"""Haftalık portföy backtest'i (günlük veri).

Her pazartesi 00:00 UTC'de, pazar kapanışına kadarki veriye bakarak en iyi K coin seçilir, eşit ağırlıkla
alınır ve bir sonraki pazartesi açılışına kadar tutulur. Komisyon + kayma, gerçek ağırlık değişimi
(turnover) üzerinden düşülür. Hafta içinde delist olan coin son fiyatından kapatılır.

ÖNCEDEN BELİRLENMİŞ KANIT KRİTERLERİ (hepsi birden):
  1. Rastgele K coin seçen 2000 portföyün Sharpe dağılımına karşı p < 0.05 / varyant sayısı (Bonferroni)
  2. Eşit ağırlıklı evrene göre haftalık fazla getiri > 0 ve 4 haftalık blok bootstrap %95 alt sınırı > 0
  3. Takvim yıllarının ≥ %70'inde eşit ağırlıklı evrenden daha iyi
  4. Sharpe oranı BTC al-tut'tan yüksek (yoksa BTC tutmak daha iyi)
Son 6 ay (lockbox) yalnızca --include-lockbox ile, en sonda ve bir kez değerlendirilir.

Kullanım:
    python -m research.weekly --group momentum
"""
import argparse
import glob
import os
from datetime import datetime

import numpy as np
import pandas as pd

from .config import Config

COST_PER_SIDE = 0.0015          # %0.1 komisyon + %0.05 kayma
MIN_MEDIAN_QVOL_30D = 1_000_000  # 30 günlük medyan günlük hacim ≥ 1M USDT
MIN_HISTORY_DAYS = 60
N_RANDOM = 2000


# ---------------------------------------------------------------- veri
def load_daily(data_dir: str) -> dict[str, pd.DataFrame]:
    files = sorted(glob.glob(os.path.join(data_dir, "klines", "1d", "*.parquet")))
    if not files:
        raise FileNotFoundError("Günlük veri yok. Önce: python -m research.data --interval 1d --start 2020-01 --include-delisted")
    wide = {}
    for col in ("open", "close", "quote_volume", "taker_buy_quote"):
        parts = {}
        for f in files:
            df = pd.read_parquet(f, columns=["open_time", col])
            parts[os.path.basename(f)[:-8]] = df.set_index(df["open_time"].dt.normalize())[col]
        wide[col] = pd.DataFrame(parts).sort_index()
    idx = pd.date_range(wide["close"].index.min(), wide["close"].index.max(), freq="D", tz="UTC")
    return {k: v.reindex(idx) for k, v in wide.items()}


def eligibility(d: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """t günü kapanışında bilinenlerle: yeterli geçmiş ve likidite (geleceğe bakış yok)."""
    hist = d["close"].notna().cumsum() >= MIN_HISTORY_DAYS
    liquid = d["quote_volume"].rolling(30, min_periods=20).median() >= MIN_MEDIAN_QVOL_30D
    return hist & liquid & d["close"].notna()


def weekly_returns(d: dict[str, pd.DataFrame], mondays: pd.DatetimeIndex) -> pd.DataFrame:
    """Pazartesi açılışından sonraki pazartesi açılışına getiri. Delist olursa son kapanıştan çıkılır."""
    o, c = d["open"], d["close"]
    out = {}
    for m in mondays:
        entry = o.loc[m]
        nxt = m + pd.Timedelta(days=7)
        exit_ = o.loc[nxt] if nxt in o.index else pd.Series(np.nan, index=o.columns)
        last_close = c.loc[m: nxt - pd.Timedelta(days=1)].ffill().iloc[-1]
        exit_ = exit_.fillna(last_close)
        out[m] = exit_ / entry - 1
    return pd.DataFrame(out).T


# ---------------------------------------------------------------- sinyaller
def btc_regime(d) -> pd.Series:
    btc = d["close"]["BTCUSDT"]
    return btc > btc.rolling(200, min_periods=200).mean()


def momentum(d, n: int) -> pd.DataFrame:
    return d["close"] / d["close"].shift(n) - 1


GROUPS = {
    "momentum": lambda d: {f"mom{n}": momentum(d, n) for n in (7, 14, 30)},
}


# ---------------------------------------------------------------- portföy
def run_portfolio(score: pd.DataFrame, elig: pd.DataFrame, rets: pd.DataFrame, k: int,
                  regime: pd.Series | None) -> pd.Series:
    """score/elig/regime pazar günü (sinyal günü) değerleriyle okunur; getiriler pazartesiden pazartesiye."""
    w_prev = pd.Series(dtype=float)
    out = {}
    for m in rets.index:
        s = m - pd.Timedelta(days=1)
        r = rets.loc[m]
        ok = elig.loc[s] & r.notna()
        if regime is not None and not bool(regime.get(s, False)):
            w = pd.Series(dtype=float)  # nakitte bekle
        else:
            top = score.loc[s][ok].dropna().nlargest(k).index
            w = pd.Series(1.0 / len(top), index=top) if len(top) else pd.Series(dtype=float)
        turnover = w.sub(w_prev, fill_value=0).abs().sum()
        gross = float((w * r.reindex(w.index)).sum())
        out[m] = gross - turnover * COST_PER_SIDE
        # hafta sonundaki ağırlıklar (fiyat değişimiyle kayar)
        grown = w * (1 + r.reindex(w.index))
        w_prev = grown / grown.sum() if grown.sum() > 0 else pd.Series(dtype=float)
    return pd.Series(out)


def equal_weight(elig, rets) -> pd.Series:
    return run_portfolio(pd.DataFrame(1.0, index=elig.index, columns=elig.columns), elig, rets, 10**6, None)


def random_sharpes(elig, rets, k: int, n: int, seed: int = 0) -> np.ndarray:
    """Her hafta rastgele K uygun coin. Her hafta tam yenileme varsayılır (maliyet 2 × taraf)."""
    rng = np.random.default_rng(seed)
    R = np.zeros((n, len(rets)))
    for j, m in enumerate(rets.index):
        s = m - pd.Timedelta(days=1)
        r = rets.loc[m]
        pool = r[elig.loc[s] & r.notna()].to_numpy()
        if len(pool) < k:
            continue
        pick = rng.random((n, len(pool))).argsort(axis=1)[:, :k]
        R[:, j] = pool[pick].mean(axis=1) - 2 * COST_PER_SIDE
    return R.mean(1) / R.std(1) * np.sqrt(52)


# ---------------------------------------------------------------- metrikler
def stats(r: pd.Series) -> dict:
    eq = (1 + r).cumprod()
    years = len(r) / 52
    return {
        "yillik_getiri": eq.iloc[-1] ** (1 / years) - 1 if years > 0 else np.nan,
        "yillik_oynaklik": r.std() * np.sqrt(52),
        "sharpe": r.mean() / r.std() * np.sqrt(52) if r.std() > 0 else np.nan,
        "max_dusus": (eq / eq.cummax() - 1).min(),
        "pozitif_hafta": (r > 0).mean(),
        "toplam_getiri": eq.iloc[-1] - 1,
    }


def block_bootstrap_ci(x: pd.Series, block: int = 4, n: int = 5000, seed: int = 0) -> tuple[float, float]:
    rng = np.random.default_rng(seed)
    a = x.to_numpy()
    nb = int(np.ceil(len(a) / block))
    starts = rng.integers(0, len(a) - block + 1, (n, nb))
    idx = (starts[:, :, None] + np.arange(block)).reshape(n, -1)[:, : len(a)]
    return tuple(np.quantile(a[idx].mean(1), [0.025, 0.975]))


def yearly(r: pd.Series) -> pd.Series:
    return (1 + r).groupby(r.index.year).prod() - 1


# ---------------------------------------------------------------- ana akış
def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", default="momentum", choices=list(GROUPS))
    ap.add_argument("--include-lockbox", action="store_true")
    args = ap.parse_args()

    d = load_daily(cfg.data_dir)
    elig = eligibility(d)
    regime = btc_regime(d)
    n_elig = elig.sum(1)

    btc_start = d["close"]["BTCUSDT"].first_valid_index()
    first = max(btc_start + pd.Timedelta(days=200), n_elig[n_elig >= 20].index.min())  # SMA200 hazır, evren ≥ 20
    last = d["close"].index.max() - pd.Timedelta(days=7)
    lockbox_start = d["close"].index.max() - pd.DateOffset(months=cfg.lockbox_months)
    mondays = pd.date_range(first, last, freq="W-MON")
    mondays = mondays[mondays >= lockbox_start] if args.include_lockbox else mondays[mondays < lockbox_start]
    rets = weekly_returns(d, mondays)
    print(f"{len(mondays)} hafta: {mondays[0]:%Y-%m-%d} → {mondays[-1]:%Y-%m-%d} | ortalama evren {n_elig.loc[mondays - pd.Timedelta(days=1)].mean():.0f} coin")

    btc = rets["BTCUSDT"]
    ew = equal_weight(elig, rets)
    bench = {"BTC al-tut": btc, "Eşit ağırlık (tüm evren)": ew}

    signals = GROUPS[args.group](d)
    variants = {}
    for name, score in signals.items():
        for k in (5, 10):
            for filt in (False, True):
                label = f"{name} | K={k}" + (" | BTC>SMA200" if filt else "")
                variants[label] = (run_portfolio(score, elig, rets, k, regime if filt else None), k)
    n_var = len(variants)

    rand = {k: random_sharpes(elig, rets, k, N_RANDOM) for k in (5, 10)}
    btc_sharpe = stats(btc)["sharpe"]
    rows = []
    for label, (r, k) in variants.items():
        st = stats(r)
        ex = r - ew
        lo, hi = block_bootstrap_ci(ex)
        yr = yearly(r) - yearly(ew)
        yr = yr[r.groupby(r.index.year).size() >= 26]
        p = (np.sum(rand[k] >= st["sharpe"]) + 1) / (N_RANDOM + 1)
        row = {"strateji": label, **st, "rastgele_p": p, "fazla_haftalik": ex.mean(), "fazla_ci_alt": lo,
               "yil_ustun_oran": (yr > 0).mean()}
        row["KANIT"] = bool(p < 0.05 / n_var and ex.mean() > 0 and lo > 0
                            and row["yil_ustun_oran"] >= 0.7 and st["sharpe"] > btc_sharpe)
        rows.append(row)
    table = pd.DataFrame(rows).sort_values("sharpe", ascending=False)
    bt = pd.DataFrame([{"strateji": n, **stats(r)} for n, r in bench.items()])

    # ---- rapor
    name = f"weekly_{args.group}" + ("_LOCKBOX" if args.include_lockbox else "")
    out_dir = os.path.join("reports", name)
    os.makedirs(out_dir, exist_ok=True)
    pct = ["yillik_getiri", "yillik_oynaklik", "max_dusus", "pozitif_hafta", "toplam_getiri",
           "fazla_haftalik", "fazla_ci_alt", "yil_ustun_oran"]

    def fmt(t):
        t = t.copy()
        for c in pct:
            if c in t:
                t[c] = (t[c] * 100).map(lambda x: f"{x:.1f}%" if pd.notna(x) else "-")
        for c in ("sharpe",):
            t[c] = t[c].map(lambda x: f"{x:.2f}")
        if "rastgele_p" in t:
            t["rastgele_p"] = t["rastgele_p"].map(lambda x: f"{x:.4f}")
        return t.to_markdown(index=False)

    best = table.iloc[0]["strateji"]
    yrs = pd.DataFrame({"BTC": yearly(btc), "Eşit ağırlık": yearly(ew), best: yearly(variants[best][0])})
    passed = table[table["KANIT"]]
    lines = [
        f"# Haftalık portföy testi: {args.group}",
        f"_Oluşturma: {datetime.now():%Y-%m-%d %H:%M}_  ",
        f"Dönem: **{mondays[0]:%Y-%m-%d} → {mondays[-1]:%Y-%m-%d}** ({len(mondays)} hafta, "
        f"{'LOCKBOX' if args.include_lockbox else 'geliştirme dönemi, son 6 ay hariç'})  ",
        f"Maliyet: taraf başına %{COST_PER_SIDE*100:.2f}, gerçek ağırlık değişimi üzerinden. "
        f"Evren: 60+ gün geçmiş, 30 günlük medyan hacim ≥ 1M USDT, delist edilenler dahil.",
        "",
        "## Sonuç",
        (f"**{len(passed)} varyant tüm kanıt kriterlerini geçti:** " + ", ".join(passed["strateji"]))
        if len(passed) else "**Hiçbir varyant kanıt kriterlerini geçemedi.**",
        "",
        "## Karşılaştırma ölçütleri",
        fmt(bt),
        "",
        f"## Varyantlar ({n_var} adet, Bonferroni eşiği p < {0.05/n_var:.4f})",
        fmt(table),
        "",
        "KANIT = rastgele K coine karşı p < Bonferroni eşiği, eşit ağırlığa göre fazla getiri ve bootstrap alt sınırı > 0, "
        "yılların ≥ %70'inde eşit ağırlıktan iyi, Sharpe > BTC al-tut.",
        "",
        f"## Yıllık getiriler (en yüksek Sharpe: {best})",
        (yrs * 100).round(1).astype(str).add("%").to_markdown(),
    ]
    text = "\n".join(lines)
    with open(os.path.join(out_dir, "report.md"), "w", encoding="utf-8") as f:
        f.write(text)
    pd.DataFrame({k: v[0] for k, v in variants.items()} | bench).to_csv(os.path.join(out_dir, "weekly_returns.csv"))
    print(text)


if __name__ == "__main__":
    main()
