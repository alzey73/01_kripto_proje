# Backtest raporu
_Oluşturma: 2026-09-27 16:39_  
Etiket **relative**, kalibrasyon **platt**, aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 2,479,087  |  Taban oran (rastgele isabet): **45.10%**
- AUC: **0.5505** (0.5 = yazı tura)
- Brier beceri skoru: **0.83%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.397%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural                                  |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   | ort_fazla_getiri   |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------------------------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|:-------------------|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 | saatte≤3              |     7666 |            7.41 | 56.44%   | 55.33%              | 45.10%       | -0.28%           | -0.37%          | 0.18%              |          0.7  | 8.33%                  |       0.002  | False   |
| olasilik>=0.55 | saatte≤3 | BTC>EMA200 |     3146 |            3.04 | 58.11%   | 56.37%              | 45.10%       | -0.26%           | -0.32%          | 0.29%              |          0.61 | 0.00%                  |       0.014  | False   |
| olasilik>=0.60 | saatte≤3              |     2087 |            2.02 | 55.87%   | 53.73%              | 45.10%       | -0.24%           | -0.36%          | 0.15%              |          0.69 | 20.00%                 |       0.004  | False   |
| olasilik>=0.60 | saatte≤3 | BTC>EMA200 |      880 |            0.85 | 58.75%   | 55.47%              | 45.10%       | -0.33%           | -0.41%          | 0.38%              |          0.44 | 0.00%                  |       0.2567 | False   |
| ust_%1 | saatte≤3                      |     4668 |            4.51 | 56.51%   | 55.09%              | 45.10%       | -0.29%           | -0.39%          | 0.19%              |          0.69 | 0.00%                  |       0.011  | False   |
| ust_%1 | saatte≤3 | BTC>EMA200         |     2206 |            2.13 | 55.98%   | 53.90%              | 45.10%       | -0.29%           | -0.35%          | 0.15%              |          0.55 | 0.00%                  |       0.041  | False   |
| ust_%0.5 | saatte≤3                    |     2673 |            2.58 | 57.20%   | 55.32%              | 45.10%       | -0.24%           | -0.37%          | 0.22%              |          0.73 | 8.33%                  |       0.005  | False   |
| ust_%0.5 | saatte≤3 | BTC>EMA200       |     1258 |            1.22 | 55.25%   | 52.49%              | 45.10%       | -0.31%           | -0.38%          | 0.15%              |          0.5  | 0.00%                  |       0.1608 | False   |
| ust_%0.1 | saatte≤3                    |      705 |            0.68 | 57.16%   | 53.48%              | 45.10%       | -0.07%           | -0.39%          | 0.27%              |          0.92 | 33.33%                 |       0.005  | False   |
| ust_%0.1 | saatte≤3 | BTC>EMA200       |      355 |            0.34 | 54.93%   | 49.73%              | 45.10%       | -0.20%           | -0.31%          | 0.15%              |          0.61 | 20.00%                 |       0.1159 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |                n |   tahmin |   gercek |
|:------------|-----------------:|---------:|---------:|
| [0.0, 0.3)  |   5864           |     27   |     28.9 |
| [0.3, 0.4)  | 282729           |     37.9 |     38   |
| [0.4, 0.45) |      1.03092e+06 |     42.8 |     42.7 |
| [0.45, 0.5) | 812745           |     47.1 |     47.3 |
| [0.5, 0.55) | 273137           |     52   |     52.4 |
| [0.55, 0.6) |  63439           |     56.8 |     54.8 |
| [0.6, 0.65) |   9309           |     61.7 |     54.8 |
| [0.65, 0.7) |    886           |     66.4 |     61.3 |
| [0.7, 0.8)  |     63           |     72.5 |     88.9 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2023-04-30 00:00:00+00:00 |  126010 |        0.452 | 0.5527 |
|      1 | 2023-07-30 00:00:00+00:00 |  104785 |        0.456 | 0.5348 |
|      2 | 2023-10-30 00:00:00+00:00 |  265675 |        0.425 | 0.5381 |
|      3 | 2024-01-30 00:00:00+00:00 |  364859 |        0.421 | 0.5427 |
|      4 | 2024-04-30 00:00:00+00:00 |  232205 |        0.454 | 0.5318 |
|      5 | 2024-07-30 00:00:00+00:00 |  205121 |        0.458 | 0.5448 |
|      6 | 2024-10-30 00:00:00+00:00 |  380842 |        0.44  | 0.5471 |
|      7 | 2025-01-30 00:00:00+00:00 |  226223 |        0.474 | 0.546  |
|      8 | 2025-04-30 00:00:00+00:00 |  204893 |        0.468 | 0.5618 |
|      9 | 2025-07-30 00:00:00+00:00 |  194844 |        0.477 | 0.5757 |
|     10 | 2025-10-30 00:00:00+00:00 |  137503 |        0.483 | 0.563  |
|     11 | 2026-01-30 00:00:00+00:00 |   36127 |        0.481 | 0.5397 |

## En önemli 15 özellik (% kazanç payı)
|                    |   pay |
|:-------------------|------:|
| vol_168            |  20.4 |
| dist_ema200        |   9.7 |
| log_quote_vol_168  |   8.2 |
| dd_from_high_720   |   8.1 |
| xs_rank_ret_168    |   7.6 |
| atr_pct            |   7.3 |
| ret_168            |   6.2 |
| vol_z_24_vs_168    |   5.2 |
| vol_24             |   5.1 |
| vol_ratio          |   5   |
| range_pos_336      |   4.3 |
| ret_72             |   3.8 |
| ema50_slope        |   3.2 |
| xs_rank_ret_24     |   3.1 |
| xs_rank_dist_ema50 |   2.7 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.