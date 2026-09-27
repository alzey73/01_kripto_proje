# Backtest raporu
_Oluşturma: 2026-09-27 16:16_  
Aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 2,479,087  |  Taban oran (rastgele isabet): **45.87%**
- AUC: **0.5152** (0.5 = yazı tura)
- Brier beceri skoru: **-0.31%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.397%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural          |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 |    11538 |           11.15 | 54.97%   | 54.07%              | 45.87%       | 0.22%            | -0.18%          |          1.15 | 50.00%                 |        0.001 | False   |
| olasilik>=0.60 |     4869 |            4.7  | 55.49%   | 54.09%              | 45.87%       | 0.41%            | -0.21%          |          1.28 | 77.78%                 |        0.001 | False   |
| olasilik>=0.65 |     3079 |            2.97 | 53.59%   | 51.82%              | 45.87%       | 0.10%            | -0.47%          |          1.06 | 77.78%                 |        0.001 | False   |
| olasilik>=0.70 |     2663 |            2.57 | 54.37%   | 52.48%              | 45.87%       | 0.12%            | -0.51%          |          1.08 | 77.78%                 |        0.001 | False   |
| olasilik>=0.75 |     2524 |            2.44 | 54.91%   | 52.97%              | 45.87%       | 0.13%            | -0.49%          |          1.08 | 77.78%                 |        0.001 | False   |
| olasilik>=0.80 |     2152 |            2.08 | 55.02%   | 52.91%              | 45.87%       | 0.09%            | -0.64%          |          1.06 | 77.78%                 |        0.001 | False   |
| ust_%1         |    14008 |           13.53 | 53.83%   | 53.01%              | 45.87%       | 0.23%            | -0.25%          |          1.15 | 58.33%                 |        0.001 | False   |
| ust_%0.5       |     9193 |            8.88 | 54.72%   | 53.70%              | 45.87%       | 0.31%            | -0.31%          |          1.2  | 66.67%                 |        0.001 | False   |
| ust_%0.1       |     4186 |            4.04 | 55.66%   | 54.15%              | 45.87%       | 0.54%            | -0.45%          |          1.34 | 63.64%                 |        0.001 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |                n |   tahmin |   gercek |
|:------------|-----------------:|---------:|---------:|
| [0.0, 0.3)  |   5093           |      9.1 |     47.7 |
| [0.3, 0.4)  |   9286           |     36.5 |     43   |
| [0.4, 0.45) | 837449           |     44.1 |     44.4 |
| [0.45, 0.5) |      1.49456e+06 |     46.9 |     46.4 |
| [0.5, 0.55) |  93866           |     52.3 |     48   |
| [0.55, 0.6) |  24727           |     56.9 |     51.6 |
| [0.6, 0.65) |   5243           |     61.1 |     58.5 |
| [0.65, 0.7) |   1107           |     67.6 |     48.7 |
| [0.7, 0.8)  |   1740           |     75.3 |     49.4 |
| [0.8, 1.0)  |   6011           |     93.8 |     56.5 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2023-04-30 00:00:00+00:00 |  126010 |        0.451 | 0.5108 |
|      1 | 2023-07-30 00:00:00+00:00 |  104785 |        0.464 | 0.5146 |
|      2 | 2023-10-30 00:00:00+00:00 |  265675 |        0.469 | 0.5238 |
|      3 | 2024-01-30 00:00:00+00:00 |  364859 |        0.455 | 0.5296 |
|      4 | 2024-04-30 00:00:00+00:00 |  232205 |        0.452 | 0.4829 |
|      5 | 2024-07-30 00:00:00+00:00 |  205121 |        0.463 | 0.4964 |
|      6 | 2024-10-30 00:00:00+00:00 |  380842 |        0.463 | 0.5359 |
|      7 | 2025-01-30 00:00:00+00:00 |  226223 |        0.463 | 0.5272 |
|      8 | 2025-04-30 00:00:00+00:00 |  204893 |        0.473 | 0.5273 |
|      9 | 2025-07-30 00:00:00+00:00 |  194844 |        0.455 | 0.5282 |
|     10 | 2025-10-30 00:00:00+00:00 |  137503 |        0.438 | 0.4831 |
|     11 | 2026-01-30 00:00:00+00:00 |   36127 |        0.393 | 0.4965 |

## En önemli 15 özellik (% kazanç payı)
|                  |   pay |
|:-----------------|------:|
| mkt_n_symbols    |  21.4 |
| btc_vol_24       |  14.2 |
| btc_ret_168      |  12.9 |
| btc_dist_ema200  |  12.2 |
| dow              |   9   |
| btc_ret_24       |   8   |
| mkt_breadth_24   |   6.4 |
| mkt_ret_24_mean  |   6.3 |
| hour             |   3.8 |
| btc_ret_1        |   1.4 |
| mkt_ret_1_mean   |   1.1 |
| ret_72           |   1   |
| macd_hist        |   0.9 |
| dd_from_high_720 |   0.8 |
| vol_ratio        |   0.7 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.