# Güç testi (ekili sinyal)
_Oluşturma: 2026-09-27 13:46_  
Aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**8 kural tüm kanıt kriterlerini geçti:** olasilik>=0.55, olasilik>=0.60, olasilik>=0.65, olasilik>=0.70, olasilik>=0.75, ust_%1, ust_%0.5, ust_%0.1

> Bu geliştirme dönemi sonucudur. Yöntem dondurulduktan sonra `--include-lockbox` ile görülmemiş son dönemde de geçmesi gerekir.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 307,380  |  Taban oran (rastgele isabet): **49.59%**
- AUC: **0.5957** (0.5 = yazı tura)
- Brier beceri skoru: **2.77%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.306%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural          |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 |    27965 |           65.65 | 59.15%   | 58.57%              | 49.59%       | 0.04%            | 0.00%           |          1.05 | 80.00%                 |        0.001 | True    |
| olasilik>=0.60 |    16621 |           39.02 | 63.29%   | 62.55%              | 49.59%       | 0.19%            | 0.14%           |          1.25 | 100.00%                |        0.001 | True    |
| olasilik>=0.65 |     5841 |           13.71 | 68.45%   | 67.24%              | 49.59%       | 0.37%            | 0.32%           |          1.57 | 100.00%                |        0.001 | True    |
| olasilik>=0.70 |     1230 |            2.89 | 71.38%   | 68.79%              | 49.59%       | 0.46%            | 0.37%           |          1.79 | 100.00%                |        0.001 | True    |
| olasilik>=0.75 |      631 |            1.48 | 69.57%   | 65.87%              | 49.59%       | 0.40%            | 0.25%           |          1.62 | 75.00%                 |        0.001 | True    |
| olasilik>=0.80 |       49 |            0.12 | 69.39%   | 55.47%              | 49.59%       | 0.33%            | -0.13%          |          1.47 | 66.67%                 |        0.007 | False   |
| ust_%1         |     2009 |            4.72 | 72.03%   | 70.02%              | 49.59%       | 0.50%            | 0.42%           |          1.87 | 100.00%                |        0.001 | True    |
| ust_%0.5       |      999 |            2.35 | 71.87%   | 69.00%              | 49.59%       | 0.48%            | 0.37%           |          1.8  | 100.00%                |        0.001 | True    |
| ust_%0.1       |      181 |            0.42 | 74.03%   | 67.19%              | 49.59%       | 0.57%            | 0.35%           |          2.07 | 80.00%                 |        0.001 | True    |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |     n |   tahmin |   gercek |
|:------------|------:|---------:|---------:|
| [0.0, 0.3)  |  2785 |     25.6 |     30.2 |
| [0.3, 0.4)  | 37226 |     35.9 |     36.2 |
| [0.4, 0.45) | 51850 |     42.5 |     42.7 |
| [0.45, 0.5) | 75193 |     47.6 |     47.8 |
| [0.5, 0.55) | 62055 |     52.6 |     52.8 |
| [0.55, 0.6) | 45639 |     57.3 |     57.9 |
| [0.6, 0.65) | 24533 |     62.2 |     62   |
| [0.65, 0.7) |  6695 |     66.7 |     68.4 |
| [0.7, 0.8)  |  1353 |     73.6 |     70.9 |
| [0.8, 1.0)  |    51 |     88   |     68.6 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2022-04-30 00:00:00+00:00 |   65520 |        0.49  | 0.5887 |
|      1 | 2022-07-30 00:00:00+00:00 |   66240 |        0.476 | 0.598  |
|      2 | 2022-10-30 00:00:00+00:00 |   66240 |        0.501 | 0.5991 |
|      3 | 2023-01-30 00:00:00+00:00 |   64800 |        0.513 | 0.5945 |
|      4 | 2023-04-30 00:00:00+00:00 |   44580 |        0.503 | 0.6018 |

## En önemli 15 özellik (% kazanç payı)
|                    |   pay |
|:-------------------|------:|
| taker_buy_ratio    |  36.5 |
| btc_ret_168        |   8.8 |
| taker_buy_ratio_12 |   8.8 |
| btc_vol_24         |   7.9 |
| btc_dist_ema200    |   6.6 |
| btc_ret_24         |   5.4 |
| mkt_ret_24_mean    |   5.3 |
| dow                |   4.5 |
| log_quote_vol_168  |   3.2 |
| mkt_breadth_24     |   2.6 |
| hour               |   2.5 |
| dd_from_high_720   |   2.5 |
| vol_168            |   2.2 |
| ret_168            |   1.6 |
| vol_ratio          |   1.5 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.