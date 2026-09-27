# Sızıntı testi (rastgele veri)
_Oluşturma: 2026-09-27 16:32_  
Etiket **relative**, kalibrasyon **platt**, aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 307,380  |  Taban oran (rastgele isabet): **49.83%**
- AUC: **0.5019** (0.5 = yazı tura)
- Brier beceri skoru: **-0.03%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.302%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural                                  |   sinyal | gunluk_sinyal   | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   | ort_fazla_getiri   | kar_faktoru   | pozitif_katman_orani   | rastgele_p   |   KANIT |
|:---------------------------------------|---------:|:----------------|:---------|:--------------------|:-------------|:-----------------|:----------------|:-------------------|:--------------|:-----------------------|:-------------|--------:|
| olasilik>=0.55 | saatte≤3              |        0 | -               | -        | -                   | -            | -                | -               | -                  | -             | -                      | -            |     nan |
| olasilik>=0.55 | saatte≤3 | BTC>EMA200 |        0 | -               | -        | -                   | -            | -                | -               | -                  | -             | -                      | -            |     nan |
| olasilik>=0.60 | saatte≤3              |        0 | -               | -        | -                   | -            | -                | -               | -                  | -             | -                      | -            |     nan |
| olasilik>=0.60 | saatte≤3 | BTC>EMA200 |        0 | -               | -        | -                   | -            | -                | -               | -                  | -             | -                      | -            |     nan |
| ust_%1 | saatte≤3                      |      828 | 1.94            | 49.64%   | 46.24%              | 49.83%       | -0.28%           | -0.42%          | -0.35%             | 0.73          | 20.00%                 | 0.4106       |       0 |
| ust_%1 | saatte≤3 | BTC>EMA200         |      404 | 0.95            | 48.51%   | 43.68%              | 49.83%       | -0.21%           | -0.40%          | -0.35%             | 0.80          | 20.00%                 | 0.1628       |       0 |
| ust_%0.5 | saatte≤3                    |      398 | 0.93            | 48.74%   | 43.87%              | 49.83%       | -0.36%           | -0.55%          | -0.43%             | 0.68          | 20.00%                 | 0.7483       |       0 |
| ust_%0.5 | saatte≤3 | BTC>EMA200       |      185 | 0.43            | 48.65%   | 41.55%              | 49.83%       | -0.39%           | -0.69%          | -0.26%             | 0.66          | 0.00%                  | 0.7532       |       0 |
| ust_%0.1 | saatte≤3                    |       91 | 0.21            | 52.75%   | 42.59%              | 49.83%       | -0.18%           | -0.57%          | -0.43%             | 0.82          | 20.00%                 | 0.2587       |       0 |
| ust_%0.1 | saatte≤3 | BTC>EMA200       |       37 | 0.09            | 62.16%   | 46.10%              | 49.83%       | 0.01%            | -0.60%          | 0.28%              | 1.01          | 40.00%                 | 0.1538       |       0 |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |      n |   tahmin |   gercek |
|:------------|-------:|---------:|---------:|
| [0.45, 0.5) | 182687 |     49.3 |     49.8 |
| [0.5, 0.55) | 124693 |     50.6 |     49.9 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2022-04-30 00:00:00+00:00 |   65520 |        0.498 | 0.5035 |
|      1 | 2022-07-30 00:00:00+00:00 |   66240 |        0.491 | 0.4969 |
|      2 | 2022-10-30 00:00:00+00:00 |   66240 |        0.497 | 0.5052 |
|      3 | 2023-01-30 00:00:00+00:00 |   64800 |        0.504 | 0.5011 |
|      4 | 2023-04-30 00:00:00+00:00 |   44580 |        0.502 | 0.5039 |

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