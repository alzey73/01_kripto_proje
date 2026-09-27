"""Uçtan uca deney: panel → walk-forward → değerlendirme → rapor.

Örnekler:
    python -m research.run --synthetic null      # rastgele veri: KANIT çıkmamalı (sızıntı testi)
    python -m research.run --synthetic planted   # ekili sinyal: KANIT çıkmalı (güç testi)
    python -m research.run                       # gerçek veri (önce research.data ile indirin)
    python -m research.run --include-lockbox     # NİHAİ test: yalnızca yöntem dondurulduktan sonra
"""
import argparse
import json
import os
from datetime import datetime

import pandas as pd

from .config import Config
from .dataset import load_panel, synthetic_frames
from .evaluate import MIN_SIGNALS, evaluate_all
from .walkforward import run_walkforward

PCT_COLS = ["isabet", "isabet_wilson_alt", "isabet_wilson_ust", "taban_oran", "ort_net_getiri", "ort_fazla_getiri",
            "medyan_net_getiri", "getiri_ci_alt", "getiri_ci_ust", "toplam_net_getiri", "pozitif_katman_orani"]


def _fmt_rules(t: pd.DataFrame) -> str:
    t = t.copy()
    for c in PCT_COLS:
        if c in t:
            t[c] = (t[c] * 100).map(lambda x: f"{x:.2f}%" if pd.notna(x) else "-")
    for c in ("gunluk_sinyal", "kar_faktoru", "oynaklik_orani"):
        if c in t:
            t[c] = t[c].map(lambda x: f"{x:.2f}" if pd.notna(x) else "-")
    for c in ("binom_p", "rastgele_p", "oynaklik_esli_p"):
        if c in t:
            t[c] = t[c].map(lambda x: f"{x:.4f}" if pd.notna(x) else "-")
    cols = ["kural", "sinyal", "gunluk_sinyal", "isabet", "isabet_wilson_alt", "taban_oran",
            "ort_net_getiri", "getiri_ci_alt", "ort_fazla_getiri", "oynaklik_orani", "oynaklik_esli_p", "kar_faktoru", "pozitif_katman_orani", "rastgele_p", "KANIT"]
    return t[[c for c in cols if c in t]].to_markdown(index=False)


def write_report(res: dict, imp: pd.DataFrame, cfg: Config, title: str, out_dir: str, lockbox: bool) -> str:
    g = res["global"]
    rules = res["rules"]
    passed = rules[rules.get("KANIT", False) == True]  # noqa: E712
    top_imp = imp.mean(1).sort_values(ascending=False).head(15)
    top_imp = (top_imp / top_imp.sum() * 100).round(1)

    lines = [
        f"# {title}",
        f"_Oluşturma: {datetime.now():%Y-%m-%d %H:%M}_  ",
        f"Etiket **{cfg.label_mode}**, kalibrasyon **{cfg.calibration}**, aralık **{cfg.interval}**, yön **{cfg.side}**, hedef **{cfg.tp_mult}×ATR**, stop **{cfg.sl_mult}×ATR**, "
        f"süre **{cfg.horizon} mum**, getiri **{cfg.pnl}**, maliyet **%{(cfg.hedged_cost if cfg.pnl == 'hedged' else cfg.round_trip_cost)*100:.2f}**  ",
        f"Değerlendirilen dönem: **{'LOCKBOX DAHİL (nihai test)' if lockbox else 'yalnızca geliştirme dönemi'}**",
        "",
        "## Sonuç",
    ]
    if len(passed):
        lines.append(f"**{len(passed)} kural tüm kanıt kriterlerini geçti:** " + ", ".join(passed["kural"]))
        if not lockbox:
            lines.append("\n> Bu geliştirme dönemi sonucudur. Yöntem dondurulduktan sonra `--include-lockbox` ile "
                         "görülmemiş son dönemde de geçmesi gerekir.")
    else:
        lines.append("**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.")

    lines += [
        "",
        "## Genel model kalitesi (tüm test örnekleri)",
        f"- Örnek: {g['ornek']:,}  |  Taban oran (rastgele isabet): **{g['taban_oran']*100:.2f}%**",
        f"- AUC: **{g['auc']:.4f}** (0.5 = yazı tura)",
        f"- Brier beceri skoru: **{g['brier_beceri']*100:.2f}%** (>0 ise olasılıklar taban orandan iyi)",
        f"- Filtresiz ortalama net getiri: {g['ort_net_getiri_hepsi']*100:.3f}%",
        "",
        "## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)",
        _fmt_rules(rules),
        "",
        f"KANIT = sinyal ≥ {MIN_SIGNALS}, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, "
        "ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.  \n"
        "Risk kontrolü (KANIT'a dahil değil): `oynaklik_esli_p` < 0.01 ise kazanç sadece oynak coin seçmekten gelmiyor; "
        "`oynaklik_orani` seçilen coinlerin ortalama oynaklığının evrene oranı.",
        "",
        "## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)",
        res["calibration"].assign(tahmin=lambda d: (d.tahmin * 100).round(1), gercek=lambda d: (d.gercek * 100).round(1))
        .to_markdown(),
        "",
        "## Katmanlar",
        res["per_fold"].assign(taban_oran=lambda d: d.taban_oran.round(3), auc=lambda d: d.auc.round(4)).to_markdown(),
        "",
        "## En önemli 15 özellik (% kazanç payı)",
        top_imp.to_frame("pay").to_markdown(),
        "",
        "## Bilinen sınırlamalar",
        "- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; "
        "sonuçları iyimser gösterir).",
        "- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.",
        "- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.",
    ]
    text = "\n".join(lines)
    with open(os.path.join(out_dir, "report.md"), "w", encoding="utf-8") as f:
        f.write(text)
    return text


def main():
    cfg = Config()
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", choices=["null", "planted"])
    ap.add_argument("--include-lockbox", action="store_true")
    ap.add_argument("--interval", default=cfg.interval)
    ap.add_argument("--pnl", default=cfg.pnl, choices=["spot", "hedged"])
    ap.add_argument("--label-mode", default=cfg.label_mode, choices=["relative", "absolute"])
    ap.add_argument("--side", default=cfg.side, choices=["long", "short"])
    ap.add_argument("--tp", type=float, default=cfg.tp_mult)
    ap.add_argument("--sl", type=float, default=cfg.sl_mult)
    ap.add_argument("--horizon", type=int, default=cfg.horizon)
    ap.add_argument("--symbols", nargs="*")
    ap.add_argument("--sample", type=float, default=cfg.train_sample_frac, help="Eğitim örnekleme oranı")
    ap.add_argument("--edge", type=float, default=0.15, help="Sentetik ekili sinyal gücü")
    ap.add_argument("--name", default=None)
    args = ap.parse_args()

    cfg.interval, cfg.side, cfg.tp_mult, cfg.sl_mult = args.interval, args.side, args.tp, args.sl
    cfg.horizon, cfg.train_sample_frac, cfg.label_mode = args.horizon, args.sample, args.label_mode
    cfg.pnl = args.pnl

    if args.synthetic:
        frames = synthetic_frames(planted_edge=args.edge if args.synthetic == "planted" else 0.0)
        cfg.min_median_quote_volume = 0
        panel = load_panel(cfg, raw_frames=frames)
    else:
        panel = load_panel(cfg, symbols=args.symbols)
    print(f"Panel: {len(panel):,} satır, {panel['symbol'].nunique()} coin, "
          f"{panel['open_time'].min():%Y-%m-%d} → {panel['open_time'].max():%Y-%m-%d}")

    oos, imp = run_walkforward(panel, cfg, include_lockbox=args.include_lockbox)
    if args.include_lockbox:
        oos = oos[oos["is_lockbox"]]
    res = evaluate_all(oos, cfg)

    name = args.name or f"{args.synthetic or 'real'}_{cfg.interval}_{cfg.side}_tp{cfg.tp_mult}_sl{cfg.sl_mult}_h{cfg.horizon}" \
        + ("_LOCKBOX" if args.include_lockbox else "")
    out_dir = os.path.join("reports", name)
    os.makedirs(out_dir, exist_ok=True)
    oos.to_parquet(os.path.join(out_dir, "oos_predictions.parquet"), index=False)
    res["rules"].to_csv(os.path.join(out_dir, "rules.csv"), index=False)
    imp.to_csv(os.path.join(out_dir, "feature_importance.csv"))
    with open(os.path.join(out_dir, "config.json"), "w") as f:
        json.dump(cfg.to_dict(), f, indent=2, default=str)

    title = {"null": "Sızıntı testi (rastgele veri)", "planted": "Güç testi (ekili sinyal)"}.get(args.synthetic, "Backtest raporu")
    print("\n" + write_report(res, imp, cfg, title, out_dir, args.include_lockbox))
    print(f"\nRapor: {out_dir}/report.md")


if __name__ == "__main__":
    main()
