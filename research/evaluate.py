"""Test dilimi (OOS) tahminlerinin istatistiksel değerlendirmesi.

"Çalışıyor" iddiası için bir sinyal kuralının şu KANIT KRİTERLERİNİ geçmesi gerekir:
  1. En az MIN_SIGNALS örtüşmeyen sinyal
  2. İsabet oranının Wilson %95 alt sınırı > taban oran (rastgele coin/mum seçmenin isabeti)
  3. Rastgele seçim testi: aynı sayıda rastgele sinyalin ortalama getirisinin gözlenenden iyi olma olasılığı p < 0.01
  4. Komisyon sonrası ortalama getiri > 0 ve günlük blok bootstrap %95 alt sınırı > 0
  5. Sinyal üreten katmanların en az %70'inde ortalama getiri pozitif (zamanda istikrar)
Bir kural bunları geliştirme döneminde geçse bile nihai onay lockbox döneminde tekrar geçmesidir.
"""
import numpy as np
import pandas as pd
from scipy.stats import binomtest
from sklearn.metrics import brier_score_loss, roc_auc_score

MIN_SIGNALS = 100


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (np.nan, np.nan)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    m = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return c - m, c + m


def dedupe_signals(sig: pd.DataFrame, bar: pd.Timedelta) -> pd.DataFrame:
    """Aynı coinde açık pozisyon varken gelen yeni sinyalleri atar (gerçekçi işlem sayısı)."""
    keep = []
    for _, g in sig.sort_values("open_time").groupby("symbol", sort=False):
        free_at = pd.Timestamp.min.tz_localize("UTC")
        for i, t, off in zip(g.index, g["open_time"], g["exit_offset"]):
            if t >= free_at:
                keep.append(i)
                free_at = t + bar * (off + 1)
    return sig.loc[sorted(keep)]


def block_bootstrap_mean(sig: pd.DataFrame, n_boot: int = 2000, seed: int = 0) -> tuple[float, float]:
    """Günleri yeniden örnekleyerek ortalama getirinin %95 güven aralığı.
    Aynı gün gelen sinyaller birbirine bağımlı olduğu için tek tek değil gün gün örnekleriz."""
    if len(sig) < 2:
        return (np.nan, np.nan)
    daily = sig.groupby(sig["open_time"].dt.floor("D"))["net_ret"].agg(["sum", "count"])
    s, c = daily["sum"].to_numpy(), daily["count"].to_numpy()
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(daily), (n_boot, len(daily)))
    means = s[idx].sum(1) / c[idx].sum(1)
    return tuple(np.quantile(means, [0.025, 0.975]))


def null_pvalue(pool: pd.DataFrame, n: int, observed_mean: float, trials: int, seed: int = 0) -> float:
    """Havuzdan rastgele n sinyal seçildiğinde ortalama getirinin gözleneni aşma olasılığı."""
    rng = np.random.default_rng(seed)
    r = pool["net_ret"].to_numpy()
    means = np.array([r[rng.choice(len(r), n, replace=False)].mean() for _ in range(trials)])
    return float((np.sum(means >= observed_mean) + 1) / (trials + 1))


def null_pvalue_vol_matched(pool: pd.DataFrame, sig: pd.DataFrame, observed_mean: float, trials: int,
                            seed: int = 1) -> float:
    """Risk kontrolü: rastgele sinyaller, seçilen sinyallerle AYNI oynaklık dağılımından çekilir.
    Model sadece oynak coinleri seçerek kazanıyorsa bu test onu yakalar."""
    if "vol_168" not in pool or sig["vol_168"].isna().all():
        return np.nan
    edges = np.nanquantile(pool["vol_168"], np.linspace(0, 1, 11))
    edges[-1] += 1e-9
    pb = np.clip(np.searchsorted(edges, pool["vol_168"].fillna(edges[0]), side="right") - 1, 0, 9)
    sb = np.clip(np.searchsorted(edges, sig["vol_168"].fillna(edges[0]), side="right") - 1, 0, 9)
    r = pool["net_ret"].to_numpy()
    groups = {b: r[pb == b] for b in range(10)}
    counts = np.bincount(sb, minlength=10)
    rng = np.random.default_rng(seed)
    means = np.empty(trials)
    for t in range(trials):
        tot = 0.0
        for b in np.nonzero(counts)[0]:
            g = groups[b]
            tot += g[rng.integers(0, len(g), counts[b])].sum() if len(g) else 0.0
        means[t] = tot / counts.sum()
    return float((np.sum(means >= observed_mean) + 1) / (trials + 1))


def evaluate_rule(oos: pd.DataFrame, mask: pd.Series, name: str, bar: pd.Timedelta,
                  n_null: int, base_rate: float) -> dict:
    sig = dedupe_signals(oos[mask], bar)
    n = len(sig)
    row = {"kural": name, "sinyal": n}
    if n == 0:
        return row
    k = int(sig["label"].sum())
    days = max((oos["open_time"].max() - oos["open_time"].min()).days, 1)
    lo, hi = wilson(k, n)
    boot_lo, boot_hi = block_bootstrap_mean(sig)
    fold_means = sig.groupby("fold")["net_ret"].mean()
    row.update({
        "gunluk_sinyal": n / days,
        "farkli_saat": sig["open_time"].nunique(),
        "isabet": k / n,
        "isabet_wilson_alt": lo,
        "isabet_wilson_ust": hi,
        "taban_oran": base_rate,
        "binom_p": binomtest(k, n, base_rate, alternative="greater").pvalue,
        "ort_net_getiri": sig["net_ret"].mean(),
        "ort_fazla_getiri": sig["excess_ret"].mean() if "excess_ret" in sig else np.nan,
        "medyan_net_getiri": sig["net_ret"].median(),
        "getiri_ci_alt": boot_lo,
        "getiri_ci_ust": boot_hi,
        "toplam_net_getiri": sig["net_ret"].sum(),
        "kar_faktoru": sig.loc[sig.net_ret > 0, "net_ret"].sum() / max(-sig.loc[sig.net_ret < 0, "net_ret"].sum(), 1e-12),
        "pozitif_katman_orani": (fold_means > 0).mean(),
        "katman_sayisi": len(fold_means),
        "rastgele_p": null_pvalue(oos, n, sig["net_ret"].mean(), n_null) if n <= len(oos) else np.nan,
        "oynaklik_esli_p": null_pvalue_vol_matched(oos, sig, sig["net_ret"].mean(), min(n_null, 300)),
        "oynaklik_orani": sig["vol_168"].mean() / oos["vol_168"].mean() if "vol_168" in sig else np.nan,
    })
    row["KANIT"] = bool(
        n >= MIN_SIGNALS
        and lo > base_rate
        and row["rastgele_p"] < 0.01
        and row["ort_net_getiri"] > 0 and boot_lo > 0
        and row["pozitif_katman_orani"] >= 0.7
    )
    return row


def calibration_table(oos: pd.DataFrame, bins=(0, .3, .4, .45, .5, .55, .6, .65, .7, .8, 1.0001)) -> pd.DataFrame:
    b = pd.cut(oos["prob"], bins, right=False)
    t = oos.groupby(b, observed=True).agg(n=("label", "size"), tahmin=("prob", "mean"), gercek=("label", "mean"))
    t.index = t.index.astype(str)
    return t


def global_metrics(oos: pd.DataFrame) -> dict:
    y = oos["label"].to_numpy()
    base = y.mean()
    brier = brier_score_loss(y, oos["prob"])
    brier_base = brier_score_loss(y, np.full_like(y, base, dtype=float))
    return {
        "ornek": len(oos),
        "taban_oran": base,
        "auc": roc_auc_score(y, oos["raw"]) if 0 < base < 1 else np.nan,
        "brier": brier,
        "brier_taban": brier_base,
        "brier_beceri": 1 - brier / brier_base,  # >0: taban orandan daha iyi olasılık tahmini
        "ort_net_getiri_hepsi": oos["net_ret"].mean(),
    }


def cap_per_bar(oos: pd.DataFrame, mask: pd.Series, k: int) -> pd.Series:
    """Aynı saatte en fazla k sinyal: en yüksek olasılıklılar kalır (ilişkili toplu bahisleri önler)."""
    if k <= 0:
        return mask
    sel = oos[mask]
    top = sel.sort_values("prob", ascending=False).groupby("open_time").head(k).index
    return oos.index.isin(top)


def evaluate_all(oos: pd.DataFrame, cfg) -> dict:
    bar = pd.Timedelta(cfg.interval)
    if cfg.pnl == "hedged":  # piyasa nötr: getiri hedged_ret, pozisyon sabit horizon kadar tutulur
        oos = oos[oos["hedged_ret"].notna()].copy()
        oos["net_ret"] = oos["hedged_ret"]
        oos["exit_offset"] = cfg.horizon - 1
    base = oos["label"].mean()
    base_rules = [(f"olasilik>={th:.2f}", oos["prob"] >= th) for th in cfg.report_thresholds]
    base_rules += [(f"ust_%{q*100:g}", oos[f"top_{q}"]) for q in cfg.top_quantiles]
    rules = []
    k = cfg.max_signals_per_bar
    for name, m in base_rules:
        m = cap_per_bar(oos, m, k)
        rules.append((f"{name} | saatte≤{k}", m))
        if "btc_dist_ema200" in oos:  # önceden belirlenmiş tek zamanlama filtresi: BTC EMA200 üstünde
            rules.append((f"{name} | saatte≤{k} | BTC>EMA200", m & (oos["btc_dist_ema200"] > 0)))
    table = pd.DataFrame([evaluate_rule(oos, m, n, bar, cfg.n_null_trials, base) for n, m in rules])

    per_fold = oos.groupby("fold").agg(
        baslangic=("open_time", "min"), ornek=("label", "size"), taban_oran=("label", "mean"),
        auc=("raw", lambda s: roc_auc_score(oos.loc[s.index, "label"], s) if oos.loc[s.index, "label"].nunique() > 1 else np.nan),
    )
    return {
        "global": global_metrics(oos),
        "rules": table,
        "calibration": calibration_table(oos),
        "per_fold": per_fold,
    }
