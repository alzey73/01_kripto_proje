"""Binance USDⓈ-M vadeli fonlama oranlarını arşivden indirir.

Kullanım:
    python -m research.funding --start 2020-01
Çıktı: data/funding/{SYMBOL}.parquet  (funding_time, funding_rate)
"""
import argparse
import io
import os
import re
import urllib.error
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

import pandas as pd

from .config import Config
from .data import _get, _is_excluded, _months

LIST_URL = ("https://s3-ap-northeast-1.amazonaws.com/data.binance.vision"
            "?delimiter=/&prefix=data/futures/um/monthly/fundingRate/&marker={marker}")
FILE_URL = "https://data.binance.vision/data/futures/um/monthly/fundingRate/{s}/{s}-fundingRate-{ym}.zip"


def list_funding_symbols(quote: str = "USDT") -> list[str]:
    symbols, marker = [], ""
    while True:
        xml = _get(LIST_URL.format(marker=marker)).decode()
        found = re.findall(r"<Prefix>data/futures/um/monthly/fundingRate/([^/<]+)/</Prefix>", xml)
        symbols += found
        if "<IsTruncated>true</IsTruncated>" not in xml or not found:
            break
        marker = f"data/futures/um/monthly/fundingRate/{found[-1]}/"
    return sorted({s for s in symbols if s.endswith(quote) and s.isascii() and not _is_excluded(s[: -len(quote)])})


def parse_funding_csv(raw: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(raw))
    df.columns = [c.strip().lower() for c in df.columns]
    t = pd.to_numeric(df["calc_time"])
    return pd.DataFrame({
        "funding_time": pd.to_datetime(t.where(t < 10**14, t // 1000), unit="ms", utc=True),
        "funding_rate": pd.to_numeric(df["last_funding_rate"]).astype("float64"),
    })


def download_symbol(symbol: str, months: list[str], out_dir: str) -> tuple[str, int]:
    path = os.path.join(out_dir, f"{symbol}.parquet")
    frames = []
    if os.path.exists(path):
        old = pd.read_parquet(path)
        have = set(old["funding_time"].dt.strftime("%Y-%m"))
        months = [m for m in months if m not in have]
        frames.append(old)
    for ym in months:
        try:
            raw = _get(FILE_URL.format(s=symbol, ym=ym))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            raise
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            frames.append(parse_funding_csv(z.read(z.namelist()[0])))
    if not frames:
        return symbol, 0
    df = pd.concat(frames).drop_duplicates("funding_time").sort_values("funding_time").reset_index(drop=True)
    df.to_parquet(path, index=False)
    return symbol, len(df)


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2020-01")
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()

    symbols = list_funding_symbols(cfg.quote_asset)
    months = _months(args.start, date.today())
    out_dir = os.path.join(cfg.data_dir, "funding")
    os.makedirs(out_dir, exist_ok=True)
    print(f"{len(symbols)} vadeli sembol, {len(months)} ay")
    with ThreadPoolExecutor(args.workers) as ex:
        futs = {ex.submit(download_symbol, s, months, out_dir): s for s in symbols}
        for i, f in enumerate(as_completed(futs), 1):
            try:
                sym, n = f.result()
                print(f"[{i}/{len(symbols)}] {sym}: {n} kayıt")
            except Exception as e:  # noqa: BLE001
                print(f"[{i}/{len(symbols)}] {futs[f]}: HATA {e}")


if __name__ == "__main__":
    main()
