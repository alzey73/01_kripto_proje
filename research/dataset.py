"""Coin verilerini yükleyip özellik + etiket içeren tek bir panel tablo üretir."""
import glob
import os

import numpy as np
import pandas as pd

from .config import Config
from .features import add_market_features, atr_pct, symbol_features
from .labels import triple_barrier


def build_symbol_frame(sym: str, raw: pd.DataFrame, cfg: Config) -> pd.DataFrame | None:
    raw = raw.sort_values("open_time").reset_index(drop=True)
    if len(raw) < cfg.min_history_bars:
        return None
    feats = symbol_features(raw)
    lab = triple_barrier(raw, atr_pct(raw, 14), cfg.tp_mult, cfg.sl_mult, cfg.horizon,
                         cfg.round_trip_cost, cfg.side)
    out = pd.concat([raw[["open_time"]], feats, lab], axis=1)
    # t+1 açılışından t+horizon kapanışına log getiri (relative etiket için)
    out["fwd_ret"] = np.log(raw["close"].shift(-cfg.horizon) / raw["open"].shift(-1)).astype("float32")
    out["symbol"] = sym

    # Uygunluk t anında, geçmişe bakarak belirlenir (evren seçiminde geleceğe bakış yok)
    liquid = raw["quote_volume"].rolling(168, min_periods=168).median() >= cfg.min_median_quote_volume
    seasoned = pd.Series(np.arange(len(raw)) >= 720, index=raw.index)  # yeni listelenen coinin ilk 30 günü dışarıda
    return out[liquid & seasoned & out["label"].notna()]


def load_panel(cfg: Config, symbols: list[str] | None = None, raw_frames: dict | None = None) -> pd.DataFrame:
    """raw_frames verilirse (ör. sentetik veri) diskten okumaz."""
    if raw_frames is None:
        files = sorted(glob.glob(os.path.join(cfg.data_dir, "klines", cfg.interval, "*.parquet")))
        if symbols:
            files = [f for f in files if os.path.basename(f)[:-8] in set(symbols)]
        if not files:
            raise FileNotFoundError("Veri yok. Önce: python -m research.data")
        raw_frames = {os.path.basename(f)[:-8]: pd.read_parquet(f) for f in files}

    parts = [p for s, r in raw_frames.items() if (p := build_symbol_frame(s, r, cfg)) is not None]
    panel = pd.concat(parts, ignore_index=True)
    panel = add_market_features(panel)
    if cfg.label_mode == "relative":
        panel = add_relative_label(panel, cfg)
    return panel.sort_values(["open_time", "symbol"]).reset_index(drop=True)


def add_relative_label(panel: pd.DataFrame, cfg: Config) -> pd.DataFrame:
    """label=1: coin, aynı saatteki uygun coinlerin ortalamasından daha iyi gitti.
    excess_ret: piyasaya göre fazla getiri (maliyet düşülmüş) - piyasa nötr bakış."""
    panel = panel[panel["fwd_ret"].notna()].copy()
    mkt = panel.groupby("open_time")["fwd_ret"].transform("mean")
    excess = panel["fwd_ret"] - mkt
    sign = 1.0 if cfg.side == "long" else -1.0
    panel["label"] = (sign * excess > 0).astype("float32")
    panel["excess_ret"] = (sign * excess - cfg.round_trip_cost).astype("float32")
    # İşlem yapılabilir piyasa nötr getiri: coin long + aynı tutarda BTC short (short modda tersi)
    btc = panel.loc[panel["symbol"] == "BTCUSDT"].set_index("open_time")["fwd_ret"]
    btc_simple = np.expm1(panel["open_time"].map(btc))
    panel["hedged_ret"] = (sign * (np.expm1(panel["fwd_ret"]) - btc_simple) - cfg.hedged_cost).astype("float32")
    panel.loc[panel["symbol"] == "BTCUSDT", "hedged_ret"] = np.nan  # BTC'yi BTC ile hedge etmek anlamsız
    return panel


def synthetic_frames(n_symbols: int = 30, n_bars: int = 24 * 365 * 3, planted_edge: float = 0.0,
                     seed: int = 0) -> dict[str, pd.DataFrame]:
    """Sentetik piyasa. planted_edge=0 ise tamamen rastgele yürüyüş (tahmin edilebilir hiçbir şey yok).

    planted_edge>0 ise gözlemlenebilir bir özelliğe (taker alım oranı) bağlı küçük bir gelecek sapması eklenir.
    Doğru çalışan bir altyapı: rastgele veride kenar BULMAMALI, ekili veride BULMALI.
    """
    rng = np.random.default_rng(seed)
    times = pd.date_range("2021-01-01", periods=n_bars, freq="1h", tz="UTC")
    mkt = rng.standard_t(4, n_bars) * 0.004  # ortak piyasa faktörü
    frames = {}
    for i in range(n_symbols):
        sym = "BTCUSDT" if i == 0 else f"C{i:03d}USDT"
        vol = 0.006 * np.exp(0.3 * np.sin(np.arange(n_bars) / 500 + i))  # değişken oynaklık
        tbr = np.clip(0.5 + 0.08 * rng.standard_normal(n_bars), 0.05, 0.95)  # taker alım oranı
        # Sinyal: son 3 mumun taker alım oranı ortalaması yüksekse sonraki mumlarda yukarı sapma
        sig = pd.Series(tbr).rolling(3).mean().shift(1).fillna(0.5).to_numpy() - 0.5
        drift = planted_edge * np.clip(sig / 0.05, -3, 3) * vol
        r = 0.7 * mkt + vol * rng.standard_t(4, n_bars) * 0.8 + drift
        close = 10 * (1 + i) * np.exp(np.cumsum(r))
        open_ = np.r_[close[0], close[:-1]]
        wick = np.abs(rng.normal(0, 1, (2, n_bars))) * vol * close * 0.6
        high = np.maximum(open_, close) + wick[0]
        low = np.minimum(open_, close) - wick[1]
        volume = np.exp(rng.normal(10, 0.5, n_bars))
        frames[sym] = pd.DataFrame({
            "open_time": times, "open": open_, "high": high, "low": low, "close": close,
            "volume": volume, "quote_volume": volume * close, "trades": volume / 10,
            "taker_buy_base": volume * tbr, "taker_buy_quote": volume * tbr * close,
        })
    return frames
