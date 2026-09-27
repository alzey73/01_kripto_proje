"""Özellik üretimi.

Kural: t anındaki her özellik yalnızca t ve öncesindeki mumlardan hesaplanır (geleceğe bakış yok).
Tüm özellikler ölçekten bağımsızdır (yüzde, oran, z-skor), böylece tek model tüm coinlerde çalışır.
"""
import numpy as np
import pandas as pd


def _ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False, min_periods=n).mean()


def _rsi(close: pd.Series, n: int) -> pd.Series:
    d = close.diff()
    up = d.clip(lower=0).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    dn = (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    rs = up / dn.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def atr_pct(df: pd.DataFrame, n: int = 14) -> pd.Series:
    prev_close = df["close"].shift(1)
    tr = pd.concat([
        df["high"] - df["low"],
        (df["high"] - prev_close).abs(),
        (df["low"] - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False, min_periods=n).mean() / df["close"]


def symbol_features(df: pd.DataFrame) -> pd.DataFrame:
    """Tek bir coinin mum verisinden özellikleri hesaplar. df: open_time, open, high, low, close, volume ..."""
    o, h, l, c, v = (df[k] for k in ("open", "high", "low", "close", "volume"))
    logc = np.log(c)
    r1 = logc.diff()
    f = pd.DataFrame(index=df.index)

    # Getiriler (momentum / geri dönüş)
    for n in (1, 3, 6, 12, 24, 72, 168):
        f[f"ret_{n}"] = logc.diff(n)

    # Oynaklık
    f["atr_pct"] = atr_pct(df, 14)
    f["vol_24"] = r1.rolling(24).std()
    f["vol_168"] = r1.rolling(168).std()
    f["vol_ratio"] = f["vol_24"] / f["vol_168"]

    # Osilatörler
    f["rsi_14"] = _rsi(c, 14)
    f["rsi_6"] = _rsi(c, 6)
    lo14, hi14 = l.rolling(14).min(), h.rolling(14).max()
    f["stoch_k"] = 100 * (c - lo14) / (hi14 - lo14).replace(0, np.nan)
    f["stoch_d"] = f["stoch_k"].rolling(3).mean()

    # Trend: ortalamalara uzaklık (ATR cinsinden) ve eğim
    atr_abs = f["atr_pct"] * c
    for n in (20, 50, 200):
        e = _ema(c, n)
        f[f"dist_ema{n}"] = (c - e) / atr_abs
    f["ema50_slope"] = np.log(_ema(c, 50)).diff(12)
    macd = _ema(c, 12) - _ema(c, 26)
    f["macd_hist"] = (macd - _ema(macd, 9)) / atr_abs

    # Bollinger
    ma20, sd20 = c.rolling(20).mean(), c.rolling(20).std()
    f["bb_pctb"] = (c - (ma20 - 2 * sd20)) / (4 * sd20).replace(0, np.nan)
    f["bb_width"] = 4 * sd20 / ma20

    # Fiyatın son aralıktaki konumu, zirveden düşüş
    for n in (72, 336):
        lo, hi = l.rolling(n).min(), h.rolling(n).max()
        f[f"range_pos_{n}"] = (c - lo) / (hi - lo).replace(0, np.nan)
    f["dd_from_high_720"] = c / h.rolling(720, min_periods=200).max() - 1

    # Mum şekli
    rng = (h - l).replace(0, np.nan)
    f["body"] = (c - o) / rng
    f["upper_wick"] = (h - np.maximum(o, c)) / rng
    f["lower_wick"] = (np.minimum(o, c) - l) / rng

    # Hacim ve emir akışı
    lv = np.log1p(df["quote_volume"])
    f["vol_z_72"] = (lv - lv.rolling(72).mean()) / lv.rolling(72).std()
    f["vol_z_24_vs_168"] = lv.rolling(24).mean() - lv.rolling(168).mean()
    f["log_quote_vol_168"] = lv.rolling(168).mean()
    tb = df["taker_buy_base"] / v.replace(0, np.nan)
    f["taker_buy_ratio"] = tb
    f["taker_buy_ratio_12"] = tb.rolling(12).mean()
    f["trades_z_72"] = np.log1p(df["trades"]).pipe(lambda x: (x - x.rolling(72).mean()) / x.rolling(72).std())

    # Zaman
    f["hour"] = df["open_time"].dt.hour
    f["dow"] = df["open_time"].dt.dayofweek

    return f.replace([np.inf, -np.inf], np.nan).astype("float32")


CROSS_SECTIONAL_RANK_COLS = ["ret_1", "ret_24", "ret_168", "vol_z_72", "rsi_14", "dist_ema50"]


def add_market_features(panel: pd.DataFrame, btc_symbol: str = "BTCUSDT") -> pd.DataFrame:
    """Tüm coinlerin birleşik tablosuna (open_time, symbol, ...) piyasa geneli özellikleri ekler.

    Aynı zaman damgasındaki diğer coinlerin değerleri de t anında bilindiği için geleceğe bakış değildir.
    """
    g = panel.groupby("open_time")

    # Coinin piyasa içindeki göreli sırası (0-1)
    for col in CROSS_SECTIONAL_RANK_COLS:
        panel[f"xs_rank_{col}"] = g[col].rank(pct=True).astype("float32")

    # Piyasa genişliği
    mkt = pd.DataFrame({
        "mkt_ret_24_mean": g["ret_24"].mean(),
        "mkt_breadth_24": g["ret_24"].apply(lambda x: (x > 0).mean()),
        "mkt_ret_1_mean": g["ret_1"].mean(),
        "mkt_n_symbols": g.size(),
    }).astype("float32")

    # BTC bağlamı
    btc = panel.loc[panel["symbol"] == btc_symbol, ["open_time", "ret_1", "ret_24", "ret_168", "vol_24", "dist_ema200"]]
    btc = btc.set_index("open_time").add_prefix("btc_")
    mkt = mkt.join(btc, how="left")

    panel = panel.join(mkt, on="open_time")
    panel["rel_ret_24_vs_mkt"] = panel["ret_24"] - panel["mkt_ret_24_mean"]
    return panel


NON_FEATURES = {"open_time", "symbol", "label", "net_ret", "exit_offset", "fwd_ret", "excess_ret", "hedged_ret",
                "mkt_n_symbols"}  # mkt_n_symbols zamanla arttığı için dönem göstergesi gibi davranıyor


def is_market_feature(col: str) -> bool:
    """Aynı saatte tüm coinlerde aynı olan özellikler (coinler arasında ayrım yapamaz)."""
    return col.startswith(("mkt_", "btc_")) or col in ("hour", "dow")


def feature_columns(panel: pd.DataFrame, drop_market: bool = False) -> list[str]:
    return [c for c in panel.columns
            if c not in NON_FEATURES and not (drop_market and is_market_feature(c))]
