# Güç testi (ekili sinyal)
_Oluşturma: 2026-09-27 13:48_  
Aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 307,380  |  Taban oran (rastgele isabet): **49.51%**
- AUC: **0.5214** (0.5 = yazı tura)
- Brier beceri skoru: **0.03%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.304%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural          |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 |     4217 |            9.9  | 53.09%   | 51.59%              | 49.51%       | -0.18%           | -0.27%          |          0.81 | 0.00%                  |       0.001  | False   |
| olasilik>=0.60 |      382 |            0.9  | 55.76%   | 50.75%              | 49.51%       | -0.07%           | -0.35%          |          0.92 | 25.00%                 |       0.005  | False   |
| olasilik>=0.65 |       72 |            0.17 | 55.56%   | 44.09%              | 49.51%       | -0.09%           | -0.59%          |          0.9  | 25.00%                 |       0.1538 | False   |
| olasilik>=0.70 |       51 |            0.12 | 50.98%   | 37.68%              | 49.51%       | -0.23%           | -0.79%          |          0.77 | 33.33%                 |       0.3886 | False   |
| olasilik>=0.75 |       10 |            0.02 | 60.00%   | 31.27%              | 49.51%       | 0.23%            | -0.91%          |          1.28 | 50.00%                 |       0.1778 | False   |
| olasilik>=0.80 |       10 |            0.02 | 60.00%   | 31.27%              | 49.51%       | 0.23%            | -0.91%          |          1.28 | 50.00%                 |       0.1778 | False   |
| ust_%1         |     1438 |            3.38 | 53.27%   | 50.68%              | 49.51%       | -0.16%           | -0.29%          |          0.83 | 0.00%                  |       0.002  | False   |
| ust_%0.5       |      796 |            1.87 | 53.89%   | 50.42%              | 49.51%       | -0.14%           | -0.33%          |          0.85 | 20.00%                 |       0.006  | False   |
| ust_%0.1       |      203 |            0.48 | 50.74%   | 43.91%              | 49.51%       | -0.27%           | -0.65%          |          0.73 | 20.00%                 |       0.3966 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |      n |   tahmin |   gercek |
|:------------|-------:|---------:|---------:|
| [0.0, 0.3)  |    188 |      9.8 |     42   |
| [0.3, 0.4)  |    315 |     34.9 |     44.1 |
| [0.4, 0.45) |  24786 |     44   |     47.1 |
| [0.45, 0.5) | 156992 |     48.4 |     48.6 |
| [0.5, 0.55) | 115754 |     51.4 |     51   |
| [0.55, 0.6) |   8656 |     56.4 |     53.9 |
| [0.6, 0.65) |    573 |     61.1 |     58.3 |
| [0.65, 0.7) |     36 |     66.6 |     72.2 |
| [0.7, 0.8)  |     67 |     73   |     52.2 |
| [0.8, 1.0)  |     13 |     90   |     69.2 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2022-04-30 00:00:00+00:00 |   65520 |        0.489 | 0.5123 |
|      1 | 2022-07-30 00:00:00+00:00 |   66240 |        0.473 | 0.5283 |
|      2 | 2022-10-30 00:00:00+00:00 |   66240 |        0.498 | 0.5225 |
|      3 | 2023-01-30 00:00:00+00:00 |   64800 |        0.515 | 0.527  |
|      4 | 2023-04-30 00:00:00+00:00 |   44580 |        0.504 | 0.5189 |

## En önemli 15 özellik (% kazanç payı)
|                    |   pay |
|:-------------------|------:|
| btc_ret_168        |  14   |
| btc_vol_24         |  13.6 |
| btc_dist_ema200    |  11.3 |
| mkt_ret_24_mean    |   9.2 |
| btc_ret_24         |   9   |
| taker_buy_ratio    |   8.3 |
| dow                |   7.7 |
| log_quote_vol_168  |   4.5 |
| hour               |   3.9 |
| mkt_breadth_24     |   3.6 |
| vol_168            |   3.6 |
| dd_from_high_720   |   3.4 |
| taker_buy_ratio_12 |   2.9 |
| ret_168            |   2.9 |
| vol_ratio          |   2.1 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.