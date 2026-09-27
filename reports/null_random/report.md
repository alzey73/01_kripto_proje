# Sızıntı testi (rastgele veri)
_Oluşturma: 2026-09-27 13:44_  
Aralık **1h**, yön **long**, hedef **1.5×ATR**, stop **1.5×ATR**, süre **24 mum**, gidiş-dönüş maliyet **%0.30**  
Değerlendirilen dönem: **yalnızca geliştirme dönemi**

## Sonuç
**Hiçbir kural kanıt kriterlerini geçemedi.** Bu yapılandırmada güvenilir bir kenar yok.

## Genel model kalitesi (tüm test örnekleri)
- Örnek: 307,380  |  Taban oran (rastgele isabet): **49.53%**
- AUC: **0.4962** (0.5 = yazı tura)
- Brier beceri skoru: **-0.25%** (>0 ise olasılıklar taban orandan iyi)
- Filtresiz ortalama net getiri: -0.302%

## Sinyal kuralları (örtüşmeyen işlemler, maliyet düşülmüş)
| kural          |   sinyal |   gunluk_sinyal | isabet   | isabet_wilson_alt   | taban_oran   | ort_net_getiri   | getiri_ci_alt   |   kar_faktoru | pozitif_katman_orani   |   rastgele_p | KANIT   |
|:---------------|---------:|----------------:|:---------|:--------------------|:-------------|:-----------------|:----------------|--------------:|:-----------------------|-------------:|:--------|
| olasilik>=0.55 |      317 |            0.74 | 50.47%   | 45.00%              | 49.53%       | -0.25%           | -0.48%          |          0.75 | 50.00%                 |       0.3137 | False   |
| olasilik>=0.60 |      156 |            0.37 | 46.15%   | 38.52%              | 49.53%       | -0.42%           | -0.72%          |          0.62 | 0.00%                  |       0.7952 | False   |
| olasilik>=0.65 |      145 |            0.34 | 47.59%   | 39.62%              | 49.53%       | -0.38%           | -0.71%          |          0.65 | 33.33%                 |       0.6593 | False   |
| olasilik>=0.70 |      145 |            0.34 | 47.59%   | 39.62%              | 49.53%       | -0.38%           | -0.71%          |          0.65 | 33.33%                 |       0.6593 | False   |
| olasilik>=0.75 |      145 |            0.34 | 47.59%   | 39.62%              | 49.53%       | -0.38%           | -0.71%          |          0.65 | 33.33%                 |       0.6593 | False   |
| olasilik>=0.80 |       83 |            0.19 | 53.01%   | 42.38%              | 49.53%       | -0.15%           | -0.52%          |          0.84 | 66.67%                 |       0.2238 | False   |
| ust_%1         |     1182 |            2.77 | 50.08%   | 47.24%              | 49.53%       | -0.28%           | -0.43%          |          0.73 | 0.00%                  |       0.2897 | False   |
| ust_%0.5       |      747 |            1.75 | 49.93%   | 46.36%              | 49.53%       | -0.28%           | -0.49%          |          0.73 | 20.00%                 |       0.3706 | False   |
| ust_%0.1       |      328 |            0.77 | 51.83%   | 46.43%              | 49.53%       | -0.19%           | -0.46%          |          0.81 | 50.00%                 |       0.1169 | False   |

KANIT = sinyal ≥ 100, isabet alt sınırı > taban oran, rastgele seçim p < 0.01, ortalama getiri ve bootstrap alt sınırı > 0, katmanların ≥ %70'i pozitif.

## Kalibrasyon (model %X dediğinde gerçekte ne oldu?)
| prob        |      n |   tahmin |   gercek |
|:------------|-------:|---------:|---------:|
| [0.0, 0.3)  |     96 |      0.6 |     53.1 |
| [0.3, 0.4)  |   1602 |     38.1 |     51.5 |
| [0.4, 0.45) |   8407 |     43.1 |     49.7 |
| [0.45, 0.5) | 198214 |     48.9 |     49.5 |
| [0.5, 0.55) |  98087 |     51.1 |     49.6 |
| [0.55, 0.6) |    481 |     57   |     52.2 |
| [0.6, 0.65) |     20 |     60   |     35   |
| [0.7, 0.8)  |    226 |     76.7 |     41.2 |
| [0.8, 1.0)  |    247 |     96.6 |     51.8 |

## Katmanlar
|   fold | baslangic                 |   ornek |   taban_oran |    auc |
|-------:|:--------------------------|--------:|-------------:|-------:|
|      0 | 2022-04-30 00:00:00+00:00 |   65520 |        0.488 | 0.4932 |
|      1 | 2022-07-30 00:00:00+00:00 |   66240 |        0.475 | 0.5003 |
|      2 | 2022-10-30 00:00:00+00:00 |   66240 |        0.498 | 0.4946 |
|      3 | 2023-01-30 00:00:00+00:00 |   64800 |        0.515 | 0.5016 |
|      4 | 2023-04-30 00:00:00+00:00 |   44580 |        0.503 | 0.493  |

## En önemli 15 özellik (% kazanç payı)
|                   |   pay |
|:------------------|------:|
| btc_vol_24        |  14.9 |
| btc_ret_168       |  13.9 |
| btc_dist_ema200   |  11.8 |
| btc_ret_24        |  10.2 |
| mkt_ret_24_mean   |   9.7 |
| dow               |   8.9 |
| log_quote_vol_168 |   4.8 |
| hour              |   4.6 |
| mkt_breadth_24    |   4.3 |
| vol_168           |   4.1 |
| dd_from_high_720  |   3.8 |
| ret_168           |   2.8 |
| vol_ratio         |   2.2 |
| vol_24            |   2.1 |
| range_pos_336     |   1.9 |

## Bilinen sınırlamalar
- Sadece şu an işlem gören coinler indirilirse, delist edilen coinler dışarıda kalır (hayatta kalma yanlılığı; sonuçları iyimser gösterir).
- Aynı saatte birçok coinde gelen sinyaller birbiriyle ilişkilidir; bu yüzden bootstrap gün bazında yapılır.
- Birden fazla kural test ediliyor; tesadüfen geçen bir kuralı elemek için lockbox testi şarttır.