# Backtest raporu
_Oluşturma: 2026-09-27 22:42_  
Etiket **relative**, kalibrasyon **platt**, aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, getiri **hedged**, maliyet **%0.40**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 2,454,225  |  Taban oran (rastgele isabet): **45.01%**
- AUC: **0.5495** (0.5 = yazı tura)
- Brier beceri skoru: **0.81%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.590%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural                                  |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   | ort_fazla_getiri   |   oynaklik_orani |   oynaklik_esli_p |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------------------------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|:-------------------|-----------------:|------------------:|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 | saatte≤3              |     3941 |            3.81 | 54.58%   | 53.02%              | 45.01%       | -0.27%           | -0.49%          | 0.05%              |             0.64 |            0.0033 |          0.8  | 16.67%                 |       0.001  | False   |
| olasilik>=0.55 | saatte≤3 | BTC>EMA200 |     1459 |            1.41 | 56.48%   | 53.92%              | 45.01%       | -0.33%           | -0.56%          | 0.22%              |             0.49 |            0.0066 |          0.71 | 25.00%                 |       0.0569 | False   |
| olasilik>=0.60 | saatte≤3              |      894 |            0.86 | 54.03%   | 50.75%              | 45.01%       | 0.26%            | -0.07%          | 0.13%              |             0.6  |            0.0033 |          1.27 | 60.00%                 |       0.003  | False   |
| olasilik>=0.60 | saatte≤3 | BTC>EMA200 |      297 |            0.29 | 60.61%   | 54.95%              | 45.01%       | -0.07%           | -0.35%          | 0.68%              |             0.41 |            0.0033 |          0.92 | 33.33%                 |       0.0759 | False   |
| ust_%1 | saatte≤3                      |     2152 |            2.08 | 54.18%   | 52.07%              | 45.01%       | -0.18%           | -0.50%          | 0.09%              |             0.66 |            0.0033 |          0.87 | 33.33%                 |       0.001  | False   |
| ust_%1 | saatte≤3 | BTC>EMA200         |      855 |            0.83 | 53.80%   | 50.45%              | 45.01%       | -0.40%           | -0.62%          | 0.07%              |             0.46 |            0.0399 |          0.65 | 16.67%                 |       0.1638 | False   |
| ust_%0.5 | saatte≤3                    |     1139 |            1.1  | 54.78%   | 51.88%              | 45.01%       | -0.07%           | -0.51%          | 0.06%              |             0.69 |            0.0066 |          0.95 | 50.00%                 |       0.003  | False   |
| ust_%0.5 | saatte≤3 | BTC>EMA200       |      398 |            0.38 | 50.75%   | 45.86%              | 45.01%       | -0.50%           | -0.79%          | 0.02%              |             0.46 |            0.2591 |          0.56 | 16.67%                 |       0.3566 | False   |
| ust_%0.1 | saatte≤3                    |      233 |            0.23 | 56.65%   | 50.23%              | 45.01%       | 0.69%            | -0.23%          | 0.02%              |             0.77 |            0.0033 |          1.53 | 50.00%                 |       0.003  | False   |
| ust_%0.1 | saatte≤3 | BTC>EMA200       |       69 |            0.07 | 55.07%   | 43.38%              | 45.01%       | -0.78%           | -1.85%          | -0.21%             |             0.48 |            0.711  |          0.39 | 40.00%                 |       0.5894 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.  
Risk kontrolü (KANIT'a dahil değil): `oynaklik_esli_p` < 0.01 ise kazanç sadece oynak coin seçmekten gelmiyor; `oynaklik_orani` seçilen coinlerin ortalama oynaklığının evrene oranı.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |                n |   tahmin |   gercek |
|:------------|-----------------:|---------:|---------:|
| [0.0, 0.3)  |   5862           |     27   |     28.9 |
| [0.3, 0.4)  | 282443           |     37.9 |     38   |
| [0.4, 0.45) |      1.02919e+06 |     42.8 |     42.7 |
| [0.45, 0.5) | 807636           |     47.1 |     47.3 |
| [0.5, 0.55) | 265869           |     52   |     52.3 |
| [0.55, 0.6) |  57057           |     56.7 |     54.5 |
| [0.6, 0.65) |   5797           |     61.5 |     55.4 |
| [0.65, 0.7) |    344           |     66.2 |     68.6 |
| [0.7, 0.8)  |     31           |     72.4 |     80.6 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2023-04-30 00:00:00+00:00 |  123826 |        0.45  | 0.5511 |
|      1 | 2023-07-30 00:00:00+00:00 |  102577 |        0.454 | 0.5325 |
|      2 | 2023-10-30 00:00:00+00:00 |  263467 |        0.424 | 0.5376 |
|      3 | 2024-01-30 00:00:00+00:00 |  362675 |        0.42  | 0.5416 |
|      4 | 2024-04-30 00:00:00+00:00 |  230021 |        0.453 | 0.5303 |
|      5 | 2024-07-30 00:00:00+00:00 |  202913 |        0.457 | 0.5438 |
|      6 | 2024-10-30 00:00:00+00:00 |  378634 |        0.44  | 0.5462 |
|      7 | 2025-01-30 00:00:00+00:00 |  224063 |        0.473 | 0.5457 |
|      8 | 2025-04-30 00:00:00+00:00 |  202709 |        0.467 | 0.5618 |
|      9 | 2025-07-30 00:00:00+00:00 |  192636 |        0.477 | 0.5755 |
|     10 | 2025-10-30 00:00:00+00:00 |  135295 |        0.481 | 0.5614 |
|     11 | 2026-01-30 00:00:00+00:00 |   35409 |        0.481 | 0.5413 |

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