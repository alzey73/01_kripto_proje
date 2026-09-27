"""Triple-barrier etiketleme.

t mumunun kapanışında sinyal üretilir, giriş t+1 mumunun açılışından yapılır.
Hedef (TP) ve stop (SL), t anındaki ATR%'ye göre belirlenir. Sonraki `horizon` mum içinde:
  - önce TP'ye değerse  -> label=1
  - önce SL'ye değerse  -> label=0
  - aynı mumda ikisi de -> label=0 (muhafazakâr: hangisinin önce olduğunu bilemeyiz)
  - hiçbiri             -> label=0, süre sonunda kapanıştan çıkış
net_ret, komisyon ve kayma düşülmüş gerçekleşen getiridir.
"""
import numpy as np
import pandas as pd


def triple_barrier(df: pd.DataFrame, atr: pd.Series, tp_mult: float, sl_mult: float,
                   horizon: int, cost: float, side: str = "long") -> pd.DataFrame:
    o = df["open"].to_numpy(float)
    h = df["high"].to_numpy(float)
    l = df["low"].to_numpy(float)
    c = df["close"].to_numpy(float)
    a = atr.to_numpy(float)
    n = len(df)

    label = np.full(n, np.nan)
    net_ret = np.full(n, np.nan)
    exit_off = np.full(n, np.nan)

    idx = np.arange(n - horizon - 1)  # t+horizon verisi olan mumlar
    entry = o[idx + 1]
    tp_pct = tp_mult * a[idx]
    sl_pct = sl_mult * a[idx]
    valid = np.isfinite(tp_pct) & np.isfinite(entry) & (entry > 0)

    sign = 1.0 if side == "long" else -1.0
    tp_px = entry * (1 + sign * tp_pct)
    sl_px = entry * (1 - sign * sl_pct)

    done = ~valid
    lab = np.zeros(len(idx))
    ret = np.zeros(len(idx))
    off = np.full(len(idx), horizon, dtype=float)

    for k in range(1, horizon + 1):
        hk, lk = h[idx + k], l[idx + k]
        if side == "long":
            tp_hit, sl_hit = hk >= tp_px, lk <= sl_px
        else:
            tp_hit, sl_hit = lk <= tp_px, hk >= sl_px
        sl_now = ~done & sl_hit                   # SL (aynı mumda TP olsa bile)
        tp_now = ~done & tp_hit & ~sl_hit
        ret[sl_now], off[sl_now] = -sl_pct[sl_now], k
        ret[tp_now], lab[tp_now], off[tp_now] = tp_pct[tp_now], 1, k
        done |= sl_now | tp_now

    timeout = ~done
    ret[timeout] = sign * (c[idx + horizon][timeout] / entry[timeout] - 1)

    label[idx] = np.where(valid, lab, np.nan)
    net_ret[idx] = np.where(valid, ret - cost, np.nan)
    exit_off[idx] = np.where(valid, off, np.nan)
    return pd.DataFrame({"label": label, "net_ret": net_ret, "exit_offset": exit_off}, index=df.index)
