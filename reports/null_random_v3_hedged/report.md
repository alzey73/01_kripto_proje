# Sızıntı testi (rastgele veri)
_Oluşturma: 2026-09-27 22:32_  
Etiket **relative**, kalibrasyon **platt**, aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, getiri **hedged**, maliyet **%0.40**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 297,134  |  Taban oran (rastgele isabet): **49.81%**
- AUC: **0.5017** (0.5 = yazı tura)
- Brier beceri skoru: **-0.03%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.429%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural                                  |   sinyal | gunluk_sinyal   | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   | ort_fazla_getiri   | oynaklik_orani   | oynaklik_esli_p   | kar_faktoru   | pozitif_katman_orani   | rastgele_p   |   KANIT |
|:---------------------------------------|---------:|:----------------|:---------|:--------------------|:-------------|:-----------------|:----------------|:-------------------|:-----------------|:------------------|:--------------|:-----------------------|:-------------|--------:|
| olasilik>=0.55 | saatte≤3              |        0 | -               | -        | -                   | -            | -                | -               | -                  | -                | -                 | -             | -                      | -            |     nan |
| olasilik>=0.55 | saatte≤3 | BTC>EMA200 |        0 | -               | -        | -                   | -            | -                | -               | -                  | -                | -                 | -             | -                      | -            |     nan |
| olasilik>=0.60 | saatte≤3              |        0 | -               | -        | -                   | -            | -                | -               | -                  | -                | -                 | -             | -                      | -            |     nan |
| olasilik>=0.60 | saatte≤3 | BTC>EMA200 |        0 | -               | -        | -                   | -            | -                | -               | -                  | -                | -                 | -             | -                      | -            |     nan |
| ust_%1 | saatte≤3                      |      493 | 1.16            | 50.71%   | 46.31%              | 49.81%       | -0.47%           | -0.94%          | -0.29%             | 1.06             | 0.6113            | 0.79          | 20.00%                 | 0.5584       |       0 |
| ust_%1 | saatte≤3 | BTC>EMA200         |      262 | 0.62            | 49.62%   | 43.61%              | 49.81%       | -0.23%           | -0.80%          | -0.38%             | 1.06             | 0.3023            | 0.89          | 60.00%                 | 0.2587       |       0 |
| ust_%0.5 | saatte≤3                    |      234 | 0.55            | 47.86%   | 41.55%              | 49.81%       | -0.29%           | -1.01%          | -0.39%             | 1.06             | 0.3688            | 0.87          | 40.00%                 | 0.3197       |       0 |
| ust_%0.5 | saatte≤3 | BTC>EMA200       |      125 | 0.29            | 46.40%   | 37.90%              | 49.81%       | -0.35%           | -1.19%          | -0.50%             | 1.06             | 0.4784            | 0.83          | 40.00%                 | 0.4106       |       0 |
| ust_%0.1 | saatte≤3                    |       55 | 0.13            | 56.36%   | 43.27%              | 49.81%       | -0.34%           | -1.58%          | -0.31%             | 1.06             | 0.4651            | 0.83          | 40.00%                 | 0.4655       |       0 |
| ust_%0.1 | saatte≤3 | BTC>EMA200       |       25 | 0.06            | 72.00%   | 52.42%              | 49.81%       | 0.93%            | -0.30%          | 0.56%              | 1.12             | 0.0897            | 2.08          | 60.00%                 | 0.0889       |       0 |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.  
Risk kontrolü (KANIT'a dahil değil): `oynaklik_esli_p` < 0.01 ise kazanç sadece oynak coin seçmekten gelmiyor; `oynaklik_orani` seçilen coinlerin ortalama oynaklığının evrene oranı.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |      n |   tahmin |   gercek |
|:------------|-------:|---------:|---------:|
| [0.45, 0.5) | 176105 |     49.3 |     49.8 |
| [0.5, 0.55) | 121029 |     50.6 |     49.9 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2022-04-30 00:00:00+00:00 |   63336 |        0.499 | 0.5042 |
|      1 | 2022-07-30 00:00:00+00:00 |   64032 |        0.489 | 0.498  |
|      2 | 2022-10-30 00:00:00+00:00 |   64032 |        0.498 | 0.5043 |
|      3 | 2023-01-30 00:00:00+00:00 |   62640 |        0.503 | 0.4989 |
|      4 | 2023-04-30 00:00:00+00:00 |   43094 |        0.502 | 0.5042 |

## En önemli 15 özellik (% kazanç payı)
|                   |   pay |
|:------------------|------:|
| log_quote_vol_168 |  20.3 |
| vol_168           |  13.6 |
| dd_from_high_720  |  10.5 |
| ret_168           |   6.9 |
| ret_72            |   6   |
| range_pos_336     |   5.5 |
| xs_rank_ret_168   |   5.4 |
| vol_ratio         |   5.2 |
| dist_ema200       |   4.8 |
| vol_z_24_vs_168   |   4.5 |
| atr_pct           |   4.5 |
| vol_24            |   4.3 |
| bb_width          |   3.3 |
| ema50_slope       |   3.1 |
| rel_ret_24_vs_mkt |   2.1 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.