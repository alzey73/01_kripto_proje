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


def test_weekly_portfolio_costs_and_selection():
    from research import weekly as w
    idx = pd.date_range("2024-01-01", periods=21, freq="D", tz="UTC")  # 3 pazartesi: 1, 8, 15 Ocak
    cols = ["A", "B", "C"]
    close = pd.DataFrame({"A": np.linspace(100, 200, 21), "B": 100.0, "C": np.linspace(100, 50, 21)}, index=idx)
    d = {"open": close.shift(1).fillna(100.0), "close": close}
    mondays = pd.DatetimeIndex([idx[7]])  # 8 Ocak
    rets = w.weekly_returns(d, mondays)
    elig = pd.DataFrame(True, index=idx, columns=cols)
    score = close / close.shift(5) - 1
    r, held = w.run_portfolio(score, elig, rets, k=1, regime=None)
    assert held.iloc[0] == 1
    exp = d["open"].loc[idx[14], "A"] / d["open"].loc[idx[7], "A"] - 1
    assert np.isclose(r.iloc[0], exp - w.COST_PER_SIDE)  # en güçlü A seçildi, giriş maliyeti 1 taraf
    cash, _ = w.run_portfolio(score, elig, rets, k=1, regime=pd.Series(False, index=idx))
    assert cash.iloc[0] == 0.0


def test_weekly_delisted_exits_at_last_close():
    from research import weekly as w
    idx = pd.date_range("2024-01-01", periods=15, freq="D", tz="UTC")
    close = pd.DataFrame({"X": [100.0] * 10 + [np.nan] * 5}, index=idx)
    close.iloc[9, 0] = 40.0
    d = {"open": close.copy(), "close": close}
    r = w.weekly_returns(d, pd.DatetimeIndex([idx[7]]))
    assert np.isclose(r.iloc[0]["X"], 40 / 100 - 1)


def test_weekly_partial_cash_weights():
    """K=2 iken tek coin koşulu sağlarsa yarısı nakitte kalır."""
    from research import weekly as w
    idx = pd.date_range("2024-01-01", periods=21, freq="D", tz="UTC")
    close = pd.DataFrame({"A": np.linspace(100, 200, 21), "B": 100.0}, index=idx)
    d = {"open": close.shift(1).fillna(100.0), "close": close}
    rets = w.weekly_returns(d, pd.DatetimeIndex([idx[7]]))
    score = pd.DataFrame({"A": 1.0, "B": np.nan}, index=idx)
    r, held = w.run_portfolio(score, pd.DataFrame(True, index=idx, columns=["A", "B"]), rets, k=2, regime=None)
    assert held.iloc[0] == 1
    assert np.isclose(r.iloc[0], 0.5 * rets.iloc[0]["A"] - 0.5 * w.COST_PER_SIDE)
