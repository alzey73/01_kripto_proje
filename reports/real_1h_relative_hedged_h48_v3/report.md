# Backtest raporu
_Oluşturma: 2026-09-27 22:52_  
Etiket **relative**, kalibrasyon **platt**, aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **48 mum**, getiri **hedged**, maliyet **%0.40**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 2,453,439  |  Taban oran (rastgele isabet): **45.27%**
- AUC: **0.5519** (0.5 = yazı tura)
- Brier beceri skoru: **0.91%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.786%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural                                  |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   | ort_fazla_getiri   |   oynaklik_orani |   oynaklik_esli_p |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------------------------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|:-------------------|-----------------:|------------------:|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 | saatte≤3              |     2606 |            2.52 | 56.25%   | 54.34%              | 45.27%       | -0.32%           | -0.64%          | 0.25%              |             0.61 |            0.0033 |          0.81 | 36.36%                 |       0.005  | False   |
| olasilik>=0.55 | saatte≤3 | BTC>EMA200 |     1192 |            1.15 | 60.15%   | 57.34%              | 45.27%       | -0.46%           | -0.80%          | 0.54%              |             0.5  |            0.01   |          0.72 | 27.27%                 |       0.0839 | False   |
| olasilik>=0.60 | saatte≤3              |     1110 |            1.07 | 57.93%   | 55.00%              | 45.27%       | -0.09%           | -0.51%          | 0.50%              |             0.58 |            0.0033 |          0.94 | 40.00%                 |       0.005  | False   |
| olasilik>=0.60 | saatte≤3 | BTC>EMA200 |      416 |            0.4  | 61.78%   | 57.02%              | 45.27%       | -0.27%           | -0.82%          | 0.96%              |             0.46 |            0.0233 |          0.82 | 30.00%                 |       0.1029 | False   |
| ust_%1 | saatte≤3                      |     1328 |            1.28 | 55.87%   | 53.19%              | 45.27%       | -0.37%           | -0.84%          | 0.41%              |             0.62 |            0.0199 |          0.8  | 41.67%                 |       0.044  | False   |
| ust_%1 | saatte≤3 | BTC>EMA200         |      617 |            0.6  | 58.18%   | 54.25%              | 45.27%       | -0.47%           | -0.92%          | 0.43%              |             0.5  |            0.0365 |          0.74 | 33.33%                 |       0.1698 | False   |
| ust_%0.5 | saatte≤3                    |      652 |            0.63 | 59.82%   | 56.01%              | 45.27%       | -0.19%           | -0.80%          | 0.68%              |             0.64 |            0.01   |          0.89 | 33.33%                 |       0.037  | False   |
| ust_%0.5 | saatte≤3 | BTC>EMA200       |      274 |            0.26 | 60.58%   | 54.69%              | 45.27%       | -0.39%           | -0.97%          | 0.59%              |             0.48 |            0.0963 |          0.75 | 33.33%                 |       0.2088 | False   |
| ust_%0.1 | saatte≤3                    |      145 |            0.14 | 64.14%   | 56.06%              | 45.27%       | -0.36%           | -1.73%          | 0.74%              |             0.63 |            0.2392 |          0.81 | 27.27%                 |       0.2607 | False   |
| ust_%0.1 | saatte≤3 | BTC>EMA200       |       68 |            0.07 | 63.24%   | 51.36%              | 45.27%       | -1.41%           | -2.68%          | 0.35%              |             0.48 |            0.8571 |          0.35 | 20.00%                 |       0.7263 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.  
Risk kontrolü (KANIT'a dahil değil): `oynaklik_esli_p` < 0.01 ise kazanç sadece oynak coin seçmekten gelmiyor; `oynaklik_orani` seçilen coinlerin ortalama oynaklığının evrene oranı.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |                n |   tahmin |   gercek |
|:------------|-----------------:|---------:|---------:|
| [0.0, 0.3)  |   4893           |     26.6 |     28.3 |
| [0.3, 0.4)  | 263203           |     38   |     38.5 |
| [0.4, 0.45) |      1.00574e+06 |     42.8 |     42.6 |
| [0.45, 0.5) | 812670           |     47.1 |     47.1 |
| [0.5, 0.55) | 270695           |     52   |     52.5 |
| [0.55, 0.6) |  76773           |     57   |     56.3 |
| [0.6, 0.65) |  16832           |     61.7 |     59.4 |
| [0.65, 0.7) |   2359           |     66.8 |     63.4 |
| [0.7, 0.8)  |    275           |     71.5 |     67.3 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2023-04-30 00:00:00+00:00 |  123802 |        0.452 | 0.5553 |
|      1 | 2023-07-30 00:00:00+00:00 |  102577 |        0.456 | 0.5222 |
|      2 | 2023-10-30 00:00:00+00:00 |  263396 |        0.422 | 0.5368 |
|      3 | 2024-01-30 00:00:00+00:00 |  362627 |        0.424 | 0.5438 |
|      4 | 2024-04-30 00:00:00+00:00 |  229859 |        0.451 | 0.5364 |
|      5 | 2024-07-30 00:00:00+00:00 |  202889 |        0.46  | 0.5495 |
|      6 | 2024-10-30 00:00:00+00:00 |  378465 |        0.441 | 0.5448 |
|      7 | 2025-01-30 00:00:00+00:00 |  223919 |        0.476 | 0.5466 |
|      8 | 2025-04-30 00:00:00+00:00 |  202637 |        0.472 | 0.572  |
|      9 | 2025-07-30 00:00:00+00:00 |  192564 |        0.483 | 0.5771 |
|     10 | 2025-10-30 00:00:00+00:00 |  135295 |        0.489 | 0.5781 |
|     11 | 2026-01-30 00:00:00+00:00 |   35409 |        0.487 | 0.5267 |

## En önemli 15 özellik (% kazanç payı)
|                    |   pay |
|:-------------------|------:|
| vol_168            |  21.3 |
| log_quote_vol_168  |  10.9 |
| dd_from_high_720   |   9.2 |
| dist_ema200        |   8.3 |
| xs_rank_ret_168    |   8.1 |
| atr_pct            |   6.9 |
| ret_168            |   6.3 |
| range_pos_336      |   5.3 |
| vol_z_24_vs_168    |   4.7 |
| vol_ratio          |   4.5 |
| vol_24             |   3.9 |
| ret_72             |   3.1 |
| ema50_slope        |   2.6 |
| rel_ret_24_vs_mkt  |   2.6 |
| xs_rank_dist_ema50 |   2.3 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.