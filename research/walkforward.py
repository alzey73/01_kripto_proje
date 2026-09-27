"""Walk-forward eğitim ve kalibrasyon.

Her katman için zaman çizelgesi:

  |------ çekirdek eğitim ------|emb|--- kalibrasyon ---|emb|=== TEST ===|
                                                             (tamamen görülmemiş)

- Model yalnızca çekirdek eğitimde öğrenir.
- Kalibrasyon diliminde: isotonic kalibrasyon ve üst-dilim eşikleri belirlenir.
- Test dilimine eşik/kalibrasyon seçimi için hiç bakılmaz. Raporlanan her sonuç test dilimlerinden gelir.
- emb (embargo) = horizon+1 mum: etiketi test dönemine taşan eğitim örneklerini atar.
"""
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.isotonic import IsotonicRegression

from .config import Config
from .features import feature_columns


def _add_months(ts: pd.Timestamp, n: int) -> pd.Timestamp:
    return ts + pd.DateOffset(months=n)


def dev_and_lockbox_split(panel: pd.DataFrame, cfg: Config) -> pd.Timestamp:
    """Lockbox başlangıcını döndürür. Lockbox'a geliştirme sırasında bakılmaz."""
    end = panel["open_time"].max()
    return _add_months(end, -cfg.lockbox_months) if cfg.lockbox_months > 0 else end + pd.Timedelta(days=1)


def make_folds(panel: pd.DataFrame, cfg: Config, until: pd.Timestamp) -> list[tuple[pd.Timestamp, pd.Timestamp]]:
    start = panel["open_time"].min().normalize()
    ts = _add_months(start, cfg.min_train_months + cfg.calib_months)
    folds = []
    while ts < until:
        te = min(_add_months(ts, cfg.test_months), until)
        folds.append((ts, te))
        ts = te
    return folds


def run_walkforward(panel: pd.DataFrame, cfg: Config, include_lockbox: bool = False,
                    verbose: bool = True) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Test dilimlerinin tahminlerini (OOS) ve katman bazında özellik önemini döndürür."""
    feats = feature_columns(panel)
    bar = pd.Timedelta(cfg.interval)
    embargo = bar * (cfg.horizon + 1)
    lockbox_start = dev_and_lockbox_split(panel, cfg)
    folds = make_folds(panel, cfg, lockbox_start)
    if include_lockbox:  # lockbox tek, ayrı bir test katmanı olarak değerlendirilir
        folds.append((lockbox_start, panel["open_time"].max() + bar))

    t = panel["open_time"]
    oos_parts, importances = [], []
    rng = np.random.default_rng(cfg.seed)

    for k, (ts, te) in enumerate(folds):
        calib_end = ts - embargo
        calib_start = _add_months(calib_end, -cfg.calib_months)
        core_end = calib_start - embargo

        core = panel[t < core_end]
        calib = panel[(t >= calib_start) & (t < calib_end)]
        test = panel[(t >= ts) & (t < te)]
        if len(core) < 1000 or len(calib) < 200 or len(test) == 0:
            continue
        if cfg.train_sample_frac < 1.0:
            core = core.iloc[np.sort(rng.choice(len(core), int(len(core) * cfg.train_sample_frac), replace=False))]

        model = LGBMClassifier(random_state=cfg.seed, **cfg.lgbm_params)
        model.fit(core[feats], core["label"].astype(int))

        raw_cal = model.predict_proba(calib[feats])[:, 1]
        iso = IsotonicRegression(out_of_bounds="clip", y_min=0, y_max=1).fit(raw_cal, calib["label"])
        raw_test = model.predict_proba(test[feats])[:, 1]

        out = test[["open_time", "symbol", "label", "net_ret", "exit_offset"]].copy()
        out["raw"] = raw_test
        out["prob"] = iso.predict(raw_test)
        out["fold"] = k
        out["is_lockbox"] = ts >= lockbox_start
        for q in cfg.top_quantiles:  # eşik kalibrasyon diliminden (geçmişten) belirlenir
            out[f"top_{q}"] = raw_test >= np.quantile(raw_cal, 1 - q)
        oos_parts.append(out)
        importances.append(pd.Series(model.booster_.feature_importance("gain"), index=feats, name=k))

        if verbose:
            print(f"Katman {k}: test {ts:%Y-%m-%d}→{te:%Y-%m-%d} | eğitim {len(core):,} | "
                  f"kalibrasyon {len(calib):,} | test {len(test):,} | taban oran {test['label'].mean():.3f}")

    if not oos_parts:
        raise RuntimeError("Hiç katman oluşmadı; veri dönemi çok kısa olabilir.")
    return pd.concat(oos_parts, ignore_index=True), pd.concat(importances, axis=1)
