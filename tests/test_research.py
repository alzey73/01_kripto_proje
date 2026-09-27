"""Geleceğe bakış (lookahead) ve etiket doğruluğu testleri. Çalıştırma: python -m pytest tests"""
import numpy as np
import pandas as pd

from research.config import Config
from research.dataset import synthetic_frames
from research.features import symbol_features
from research.labels import triple_barrier


def test_features_do_not_use_future_data():
    """t anına kadar kesilmiş veriyle hesaplanan özellikler, tam veriyle hesaplananlarla aynı olmalı."""
    df = synthetic_frames(n_symbols=1, n_bars=2000)["BTCUSDT"]
    full = symbol_features(df)
    for cut in (900, 1500, 1999):
        part = symbol_features(df.iloc[: cut + 1])
        pd.testing.assert_series_equal(full.iloc[cut], part.iloc[cut], check_names=False)


def _bars(rows):
    df = pd.DataFrame(rows, columns=["open", "high", "low", "close"])
    df["open_time"] = pd.date_range("2024-01-01", periods=len(df), freq="1h", tz="UTC")
    return df


def test_triple_barrier_long():
    # t=0 sinyal, giriş t=1 açılışı=100, TP=%2 (102), SL=%2 (98)
    df = _bars([
        (100, 100, 100, 100),
        (100, 101, 99.5, 100.5),   # hiçbir bariyer
        (100.5, 102.5, 100, 102),  # TP
        (102, 103, 90, 95),
        (95, 96, 94, 95),
    ])
    atr = pd.Series([0.02] * len(df))
    out = triple_barrier(df, atr, tp_mult=1, sl_mult=1, horizon=3, cost=0.003)
    assert out.loc[0, "label"] == 1
    assert out.loc[0, "exit_offset"] == 2
    assert np.isclose(out.loc[0, "net_ret"], 0.02 - 0.003)


def test_triple_barrier_same_bar_counts_as_loss():
    df = _bars([(100, 100, 100, 100), (100, 103, 97, 100), (100, 100, 100, 100), (100, 100, 100, 100)])
    out = triple_barrier(df, pd.Series([0.02] * 4), 1, 1, horizon=2, cost=0.0)
    assert out.loc[0, "label"] == 0 and np.isclose(out.loc[0, "net_ret"], -0.02)


def test_triple_barrier_short_and_timeout():
    df = _bars([(100, 100, 100, 100), (100, 100.5, 99.5, 99), (99, 99.5, 98.5, 99), (99, 99, 99, 99)])
    out = triple_barrier(df, pd.Series([0.02] * 4), 1, 1, horizon=2, cost=0.0, side="short")
    assert out.loc[0, "label"] == 0                    # süre doldu
    assert np.isclose(out.loc[0, "net_ret"], 0.01)     # short: 100 → 99 = +%1


def test_labels_nan_at_end():
    df = synthetic_frames(n_symbols=1, n_bars=500)["BTCUSDT"]
    cfg = Config()
    out = triple_barrier(df, pd.Series(0.01, index=df.index), 1, 1, cfg.horizon, 0.0)
    assert out["label"].iloc[-(cfg.horizon + 1):].isna().all()
