"""Binance spot mum verisini toplu indirir (data.binance.vision) ve parquet olarak saklar.

Kullanım:
    python -m research.data --interval 1h --start 2021-01
"""
import argparse
import io
import json
import os
import re
import urllib.error
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

import pandas as pd

from .config import Config

EXCHANGE_INFO_URLS = [
    "https://api.binance.com/api/v3/exchangeInfo",
    "https://data-api.binance.vision/api/v3/exchangeInfo",
]
ARCHIVE_LIST_URL = ("https://s3-ap-northeast-1.amazonaws.com/data.binance.vision"
                    "?delimiter=/&prefix=data/spot/monthly/klines/&marker={marker}")
MONTHLY_URL = "https://data.binance.vision/data/spot/monthly/klines/{s}/{i}/{s}-{i}-{ym}.zip"

KLINE_COLUMNS = [
    "open_time", "open", "high", "low", "close", "volume", "close_time",
    "quote_volume", "trades", "taker_buy_base", "taker_buy_quote", "ignore",
]

# Stabil coinler, kaldıraçlı tokenlar vb. tahmin için anlamsız çiftler
EXCLUDED_BASES = {
    "USDC", "BUSD", "TUSD", "FDUSD", "USDP", "DAI", "EUR", "GBP", "AEUR", "EURI",
    "PAX", "USDS", "UST", "SUSD", "USDD", "XUSD", "BFUSD", "RLUSD", "USD1", "PAXG",
}


def _get(url: str, timeout: int = 60) -> bytes:
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read()


def list_symbols(quote: str = "USDT") -> list[str]:
    """İşlem gören tüm <quote> spot çiftlerini döndürür."""
    last_err = None
    for url in EXCHANGE_INFO_URLS:
        try:
            info = json.loads(_get(url))
            break
        except Exception as e:  # noqa: BLE001
            last_err = e
    else:
        raise RuntimeError(f"exchangeInfo alınamadı: {last_err}")

    out = []
    for s in info["symbols"]:
        if s["quoteAsset"] != quote or s["status"] != "TRADING":
            continue
        if _is_excluded(s["baseAsset"]):
            continue
        out.append(s["symbol"])
    return sorted(out)


def _is_excluded(base: str) -> bool:
    return base in EXCLUDED_BASES or base.endswith(("UP", "DOWN", "BULL", "BEAR"))


def list_archive_symbols(quote: str = "USDT") -> list[str]:
    """Arşivdeki TÜM çiftler (delist edilenler dahil). Hayatta kalma yanlılığını önlemek için."""
    symbols, marker = [], ""
    while True:
        xml = _get(ARCHIVE_LIST_URL.format(marker=marker)).decode()
        prefixes = re.findall(r"<Prefix>data/spot/monthly/klines/([^/<]+)/</Prefix>", xml)
        symbols += prefixes
        if "<IsTruncated>true</IsTruncated>" not in xml or not prefixes:
            break
        marker = f"data/spot/monthly/klines/{prefixes[-1]}/"
    return sorted({s for s in symbols if s.endswith(quote) and not _is_excluded(s[: -len(quote)])})


def _months(start: str, end: date) -> list[str]:
    y, m = map(int, start.split("-"))
    out = []
    while (y, m) < (end.year, end.month):  # içinde bulunulan ay henüz tamamlanmadı
        out.append(f"{y:04d}-{m:02d}")
        m += 1
        if m == 13:
            y, m = y + 1, 1
    return out


def parse_kline_csv(raw: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(raw), header=None, names=KLINE_COLUMNS)
    if not str(df.iloc[0, 0]).isdigit():  # bazı dosyalarda başlık satırı var
        df = df.iloc[1:]
    df = df.astype({c: "float64" for c in KLINE_COLUMNS if c not in ("open_time", "close_time")})
    ot = df["open_time"].astype("int64")
    # 2025'ten itibaren spot dosyaları mikrosaniye cinsinden
    ot = ot.where(ot < 10**14, ot // 1000)
    df["open_time"] = pd.to_datetime(ot, unit="ms", utc=True)
    return df.drop(columns=["close_time", "ignore"])


def download_symbol(symbol: str, interval: str, months: list[str], out_dir: str) -> tuple[str, int]:
    path = os.path.join(out_dir, f"{symbol}.parquet")
    existing = None
    if os.path.exists(path):
        existing = pd.read_parquet(path)
        have = set(existing["open_time"].dt.strftime("%Y-%m").unique())
        months = [m for m in months if m not in have]

    frames = [] if existing is None else [existing]
    for ym in months:
        url = MONTHLY_URL.format(s=symbol, i=interval, ym=ym)
        try:
            raw = _get(url)
        except urllib.error.HTTPError as e:
            if e.code == 404:  # coin o ay listelenmemiş
                continue
            raise
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            frames.append(parse_kline_csv(z.read(z.namelist()[0])))

    if not frames:
        return symbol, 0
    df = (pd.concat(frames).drop_duplicates("open_time")
          .sort_values("open_time").reset_index(drop=True))
    df.to_parquet(path, index=False)
    return symbol, len(df)


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--interval", default=cfg.interval)
    ap.add_argument("--start", default=cfg.start)
    ap.add_argument("--symbols", nargs="*", help="Boşsa tüm USDT çiftleri")
    ap.add_argument("--include-delisted", action="store_true",
                    help="Delist edilmiş coinleri de indir (önerilir: hayatta kalma yanlılığını önler)")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    if args.symbols:
        symbols = args.symbols
    elif args.include_delisted:
        symbols = list_archive_symbols(cfg.quote_asset)
    else:
        symbols = list_symbols(cfg.quote_asset)
    months = _months(args.start, date.today())
    out_dir = os.path.join(cfg.data_dir, "klines", args.interval)
    os.makedirs(out_dir, exist_ok=True)
    print(f"{len(symbols)} sembol, {len(months)} ay, aralık={args.interval}")

    with ThreadPoolExecutor(args.workers) as ex:
        futs = {ex.submit(download_symbol, s, args.interval, months, out_dir): s for s in symbols}
        for i, f in enumerate(as_completed(futs), 1):
            try:
                sym, n = f.result()
                print(f"[{i}/{len(symbols)}] {sym}: {n} mum")
            except Exception as e:  # noqa: BLE001
                print(f"[{i}/{len(symbols)}] {futs[f]}: HATA {e}")


if __name__ == "__main__":
    main()
