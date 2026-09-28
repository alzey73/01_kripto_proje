"""Haftalık portföy backtest'i (günlük veri).

Her pazartesi 00:00 UTC'de, pazar kapanışına kadarki veriye bakarak en iyi K coin seçilir, eşit ağırlıkla
alınır ve bir sonraki pazartesi açılışına kadar tutulur. Komisyon + kayma, gerçek ağırlık değişimi
(turnover) üzerinden düşülür. Hafta içinde delist olan coin son fiyatından kapatılır.

ÖNCEDEN BELİRLENMİŞ KANIT KRİTERLERİ (hepsi birden):
  1. Rastgele K coin seçen 2000 portföyün Sharpe dağılımına karşı p < 0.05 / varyant sayısı (Bonferroni)
  2. Eşleştirilmiş rastgele portföye göre haftalık fazla getiri > 0 ve 4 haftalık blok bootstrap %95 alt sınırı > 0
  3. Takvim yıllarının ≥ %70'inde eşleştirilmiş rastgele portföyden daha iyi
  (Eşleştirilmiş rastgele: her hafta stratejinin tuttuğu sayıda rastgele coin. Koşullu sinyallerde nakit payı
   farkı sonucu çarpıtmasın diye, ilk sürümdeki eşit ağırlık karşılaştırmasının yerine geçti.)
SAT sinyalleri (adı SAT_ ile başlayan) ters yönde test edilir: sepetin rastgeleden anlamlı derecede kötü gitmesi.
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


def reversal(d, elig) -> dict:
    """Katalog #4: son n günde en çok düşenleri al. 'kucuk': sadece o gün hacmi evrenin alt yarısında olanlar."""
    qv30 = d["quote_volume"].rolling(30, min_periods=20).median().where(elig)
    small = qv30.rank(axis=1, pct=True) <= 0.5
    out = {}
    for n in (1, 3, 7):
        sc = -(d["close"] / d["close"].shift(n) - 1)
        out[f"geri{n}"] = sc
        out[f"geri{n}_kucuk"] = sc.where(small)
    return out


def _range_pos(d, n):
    c = d["close"]
    lo, hi = c.rolling(n, min_periods=n).min(), c.rolling(n, min_periods=n).max()
    return (c - lo) / (hi - lo)


def volume_surge(d, elig) -> dict:
    """Katalog #6 (kullanıcı fikri): dip bölgesinde hacim + alım patlaması → AL.
    Ters test: 1 haftalık yükseliş sonrası yataylaşma ve alımın durması → SAT sinyali (bu sepet kötü gitmeli)."""
    qv, tb = d["quote_volume"], d["taker_buy_quote"]
    vol_ratio = qv.rolling(3).mean() / qv.rolling(30, min_periods=20).mean().shift(3)
    buy_ratio = tb.rolling(3).sum() / qv.rolling(3).sum()
    bounce = d["close"] > d["close"].shift(3)
    out = {}
    for n in (30, 90):
        base = (_range_pos(d, n) <= 0.2) & (vol_ratio >= 1.5) & (buy_ratio >= 0.5)
        out[f"dip_alim{n}"] = vol_ratio.where(base)
        out[f"dip_alim{n}_teyit"] = vol_ratio.where(base & bounce)
    r7 = d["close"] / d["close"].shift(7) - 1
    r3 = d["close"] / d["close"].shift(3) - 1
    slowing = (qv.rolling(3).mean() < qv.shift(3).rolling(4).mean()) & (buy_ratio < 0.5)
    tired = (r7 >= 0.15) & (r3.abs() <= 0.03)
    out["SAT_yorgunluk"] = r7.where(tired)
    out["SAT_yorgunluk_alim_durdu"] = r7.where(tired & slowing)
    return out


def load_funding(data_dir: str, index: pd.DatetimeIndex) -> pd.DataFrame:
    """Günlük toplam fonlama oranı (coin başına). Günün tüm fonlamaları o günün kapanışında bilinir."""
    parts = {}
    for f in glob.glob(os.path.join(data_dir, "funding", "*.parquet")):
        df = pd.read_parquet(f)
        parts[os.path.basename(f)[:-8]] = df.groupby(df["funding_time"].dt.floor("D"))["funding_rate"].sum()
    return pd.DataFrame(parts).reindex(index)


def funding(d, elig) -> dict:
    """Katalog #7: fonlama aşırılıkları. 'negatif' → short kalabalık, sıkışma beklentisi (AL).
    'SAT_pozitif' → long kalabalık, düşüş beklentisi (bu sepet kötü gitmeli)."""
    fr = load_funding(Config().data_dir, d["close"].index).reindex(columns=d["close"].columns)
    # Karşılaştırma evreni: yalnızca o gün vadelisi (fonlama verisi) olan coinler
    has_futures = fr.rolling(7, min_periods=1).count() > 0
    out = {"_evren": has_futures}
    for n in (3, 7):
        f = fr.rolling(n, min_periods=n).mean()
        out[f"fonlama{n}_negatif"] = (-f).where(f < 0)
        out[f"SAT_fonlama{n}_pozitif"] = f.where(f > 0)
    return out


GROUPS = {
    "momentum": lambda d, elig: {f"mom{n}": momentum(d, n) for n in (7, 14, 30)},
    "reversal": reversal,
    "volume_surge": volume_surge,
    "funding": funding,
}


# ---------------------------------------------------------------- portföy
def run_portfolio(score: pd.DataFrame, elig: pd.DataFrame, rets: pd.DataFrame, k: int,
                  regime: pd.Series | None, full_invest: bool = False) -> tuple[pd.Series, pd.Series]:
    """score/elig/regime pazar günü (sinyal günü) değerleriyle okunur; getiriler pazartesiden pazartesiye.
    Her coin 1/K ağırlık alır; K'dan az coin koşulu sağlarsa kalan nakitte bekler (full_invest=False).
    Dönüş: (haftalık net getiri, haftalık tutulan coin sayısı)."""
    w_prev = pd.Series(dtype=float)
    out, held = {}, {}
    for m in rets.index:
        s = m - pd.Timedelta(days=1)
        r = rets.loc[m]
        ok = elig.loc[s] & r.notna()
        if regime is not None and not bool(regime.get(s, False)):
            w = pd.Series(dtype=float)  # nakitte bekle
        else:
            top = score.loc[s][ok].dropna().nlargest(k).index
            size = 1.0 / len(top) if full_invest else 1.0 / k
            w = pd.Series(size, index=top) if len(top) else pd.Series(dtype=float)
        turnover = w.sub(w_prev, fill_value=0).abs().sum()
        gross = float((w * r.reindex(w.index)).sum())
        out[m] = gross - turnover * COST_PER_SIDE
        held[m] = len(w)
        # hafta sonundaki ağırlıklar: coin değerleri / toplam portföy değeri (nakit dahil)
        w_prev = w * (1 + r.reindex(w.index)) / (1 + gross)
    return pd.Series(out), pd.Series(held)


def equal_weight(elig, rets) -> pd.Series:
    return run_portfolio(pd.DataFrame(1.0, index=elig.index, columns=elig.columns), elig, rets, 10**6, None,
                         full_invest=True)[0]


def random_sharpes(elig, rets, k: int, n: int, counts: pd.Series, seed: int = 0) -> np.ndarray:
    """Eşleştirilmiş rastgele portföy: her hafta stratejinin tuttuğu SAYIDA rastgele uygun coin, 1/K ağırlık,
    kalan nakit. Böylece yalnızca coin SEÇİMİ test edilir (nakit/zamanlama etkisi iki tarafta aynı).
    Her hafta tam yenileme varsayılır (maliyet 2 × taraf × yatırım oranı)."""
    rng = np.random.default_rng(seed)
    R = np.zeros((n, len(rets)))
    for j, m in enumerate(rets.index):
        s = m - pd.Timedelta(days=1)
        r = rets.loc[m]
        pool = r[elig.loc[s] & r.notna()].to_numpy()
        c = min(int(counts.get(m, 0)), len(pool))
        if c == 0:
            continue
        pick = rng.random((n, len(pool))).argsort(axis=1)[:, :c]
        R[:, j] = pool[pick].sum(axis=1) / k - 2 * COST_PER_SIDE * c / k
    sd = R.std(1)
    sharpes = np.where(sd > 0, R.mean(1) / np.where(sd > 0, sd, 1) * np.sqrt(52), 0.0)
    return sharpes, pd.Series(R.mean(0), index=rets.index)


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

    signals = GROUPS[args.group](d, elig)
    if "_evren" in signals:  # grup kendi karşılaştırma evrenini daraltıyorsa (ör. sadece vadelisi olanlar)
        elig = elig & signals.pop("_evren")
        ew = equal_weight(elig, rets)
        bench["Eşit ağırlık (grup evreni)"] = ew
    variants = {}
    for name, score in signals.items():
        for k in (5, 10):
            for filt in (False, True):
                label = f"{name} | K={k}" + (" | BTC>SMA200" if filt else "")
                r, held = run_portfolio(score, elig, rets, k, regime if filt else None)
                variants[label] = (r, k, held)
    n_var = len(variants)
    alpha = 0.05 / n_var

    btc_sharpe = stats(btc)["sharpe"]
    rows = []
    for label, (r, k, held) in variants.items():
        st = stats(r)
        rs, rmean = random_sharpes(elig, rets, k, N_RANDOM, held)
        ex = r - rmean  # eşleştirilmiş rastgele portföye göre fazla getiri (yalnızca seçim becerisi)
        lo, hi = block_bootstrap_ci(ex)
        yr = (yearly(r) - yearly(rmean))[r.groupby(r.index.year).size() >= 26]
        sharpe = st["sharpe"] if pd.notna(st["sharpe"]) else 0.0
        p_hi = (np.sum(rs >= sharpe) + 1) / (N_RANDOM + 1)
        p_lo = (np.sum(rs <= sharpe) + 1) / (N_RANDOM + 1)
        row = {"strateji": label, **st, "yatirim_orani": (held / k).mean(),
               "rastgele_p": p_lo if label.startswith("SAT") else p_hi,
               "fazla_haftalik": ex.mean(), "fazla_ci_alt": lo, "fazla_ci_ust": hi,
               "yil_ustun_oran": (yr > 0).mean()}
        if label.startswith("SAT"):  # satış sinyali: bu sepet rastgeleden KÖTÜ gitmeli
            row["KANIT"] = bool(p_lo < alpha and ex.mean() < 0 and hi < 0 and (yr < 0).mean() >= 0.7)
        else:
            row["KANIT"] = bool(p_hi < alpha and ex.mean() > 0 and lo > 0
                                and row["yil_ustun_oran"] >= 0.7 and sharpe > btc_sharpe)
        rows.append(row)
    table = pd.DataFrame(rows).sort_values("sharpe", ascending=False)
    bt = pd.DataFrame([{"strateji": n, **stats(r)} for n, r in bench.items()])

    # ---- rapor
    name = f"weekly_{args.group}" + ("_LOCKBOX" if args.include_lockbox else "")
    out_dir = os.path.join("reports", name)
    os.makedirs(out_dir, exist_ok=True)
    pct = ["yillik_getiri", "yillik_oynaklik", "max_dusus", "pozitif_hafta", "toplam_getiri", "yatirim_orani",
           "fazla_haftalik", "fazla_ci_alt", "fazla_ci_ust", "yil_ustun_oran"]

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
        "Karşılaştırma: her hafta stratejinin tuttuğu sayıda rastgele coin seçen 2000 portföy (eşleştirilmiş rastgele). "
        "`fazla_*` bu portföye göre haftalık fazla getiri, `yatirim_orani` ortalama yatırımda kalma oranı.  \n"
        "AL kuralları için KANIT = p < Bonferroni eşiği, fazla getiri ve bootstrap alt sınırı > 0, yılların ≥ %70'inde "
        "rastgeleden iyi, Sharpe > BTC al-tut.  \n"
        "SAT kuralları (`SAT_` ile başlayan) için KANIT = sepet rastgeleden anlamlı derecede KÖTÜ (p < eşik), "
        "fazla getiri ve bootstrap üst sınırı < 0, yılların ≥ %70'inde rastgeleden kötü.",
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
