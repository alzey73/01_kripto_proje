# Haftalık portföy testi: volume_surge
_Oluşturma: 2026-09-28 00:11_  
Dönem: **2020-07-20 → 2026-02-23** (293 hafta, geliştirme dönemi, son 6 ay hariç)  
Maliyet: taraf başına %0.15, gerçek ağırlık değişimi üzerinden. Evren: 60+ gün geçmiş, 30 günlük medyan hacim ≥ 1M USDT, delist edilenler dahil.

## Sonuç
**Hiçbir varyant kanıt kriterlerini geçemedi.**

## Karşılaştırma ölçütleri
| strateji                 | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   |
|:-------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|
| BTC al-tut               | 41.8%           | 57.2%             |     0.9  | -75.2%      | 52.2%           | 614.3%          |
| Eşit ağırlık (tüm evren) | 7.1%            | 94.0%             |     0.53 | -93.8%      | 51.9%           | 47.0%           |

## Varyantlar (24 adet, Bonferroni eşiği p < 0.0021)
| strateji                                     | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   | yatirim_orani   |   rastgele_p | fazla_haftalik   | fazla_ci_alt   | fazla_ci_ust   | yil_ustun_oran   | KANIT   |
|:---------------------------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|:----------------|-------------:|:-----------------|:---------------|:---------------|:-----------------|:--------|
| SAT_yorgunluk | K=10                         | 37.6%           | 56.9%             |     0.81 | -57.5%      | 30.7%           | 502.8%          | 29.1%           |       0.8731 | 0.2%             | -0.2%          | 0.8%           | 40.0%            | False   |
| SAT_yorgunluk | K=10 | BTC>SMA200            | 33.1%           | 51.4%             |     0.77 | -62.5%      | 19.5%           | 399.8%          | 19.8%           |       0.9375 | 0.3%             | -0.1%          | 0.8%           | 40.0%            | False   |
| SAT_yorgunluk | K=5 | BTC>SMA200             | 21.6%           | 67.8%             |     0.57 | -82.7%      | 19.8%           | 200.6%          | 28.3%           |       0.8371 | 0.2%             | -0.3%          | 0.9%           | 40.0%            | False   |
| SAT_yorgunluk_alim_durdu | K=5 | BTC>SMA200  | 18.8%           | 61.8%             |     0.52 | -73.5%      | 18.1%           | 163.8%          | 19.9%           |       0.6907 | 0.2%             | -0.6%          | 1.1%           | 20.0%            | False   |
| SAT_yorgunluk_alim_durdu | K=10              | 14.5%           | 40.2%             |     0.51 | -56.3%      | 27.3%           | 114.2%          | 17.9%           |       0.7006 | 0.1%             | -0.3%          | 0.5%           | 20.0%            | False   |
| SAT_yorgunluk_alim_durdu | K=5               | 16.6%           | 67.1%             |     0.5  | -79.1%      | 27.0%           | 137.0%          | 28.6%           |       0.7211 | 0.2%             | -0.6%          | 1.1%           | 20.0%            | False   |
| SAT_yorgunluk_alim_durdu | K=10 | BTC>SMA200 | 12.4%           | 37.3%             |     0.47 | -57.6%      | 18.4%           | 93.5%           | 13.1%           |       0.7156 | 0.1%             | -0.3%          | 0.5%           | 20.0%            | False   |
| SAT_yorgunluk | K=5                          | 11.2%           | 75.9%             |     0.47 | -87.5%      | 30.7%           | 82.1%           | 42.9%           |       0.6767 | 0.1%             | -0.6%          | 0.9%           | 40.0%            | False   |
| dip_alim90_teyit | K=10                      | -1.6%           | 32.2%             |     0.11 | -52.2%      | 18.1%           | -8.5%           | 15.1%           |       0.6837 | -0.0%            | -0.3%          | 0.3%           | 60.0%            | False   |
| dip_alim30_teyit | K=10 | BTC>SMA200         | 0.1%            | 11.1%             |     0.06 | -21.4%      | 4.1%            | 0.6%            | 1.8%            |       0.933  | -0.0%            | -0.2%          | 0.1%           | 20.0%            | False   |
| dip_alim30 | K=10 | BTC>SMA200               | -2.6%           | 14.2%             |    -0.12 | -32.3%      | 6.5%            | -14.0%          | 5.3%            |       0.8606 | -0.1%            | -0.2%          | 0.1%           | 40.0%            | False   |
| dip_alim30_teyit | K=10                      | -2.7%           | 13.1%             |    -0.15 | -29.5%      | 8.9%            | -14.1%          | 3.7%            |       0.9835 | -0.1%            | -0.2%          | 0.1%           | 20.0%            | False   |
| dip_alim30_teyit | K=5 | BTC>SMA200          | -3.8%           | 15.1%             |    -0.18 | -39.3%      | 4.1%            | -19.4%          | 3.3%            |       0.987  | -0.1%            | -0.3%          | 0.1%           | 20.0%            | False   |
| dip_alim90 | K=10                            | -12.4%          | 36.0%             |    -0.19 | -77.3%      | 20.5%           | -52.5%          | 22.5%           |       0.8836 | -0.1%            | -0.4%          | 0.2%           | 40.0%            | False   |
| dip_alim90_teyit | K=5                       | -24.4%          | 48.1%             |    -0.34 | -88.0%      | 17.7%           | -79.3%          | 24.0%           |       0.9905 | -0.4%            | -0.8%          | 0.0%           | 0.0%             | False   |
| dip_alim30_teyit | K=5                       | -9.7%           | 20.3%             |    -0.4  | -50.7%      | 8.9%            | -43.6%          | 7.0%            |       1      | -0.3%            | -0.5%          | -0.0%          | 20.0%            | False   |
| dip_alim30 | K=5 | BTC>SMA200                | -10.5%          | 20.3%             |    -0.44 | -62.4%      | 6.8%            | -46.5%          | 8.6%            |       0.9955 | -0.2%            | -0.5%          | -0.0%          | 0.0%             | False   |
| dip_alim30 | K=10                            | -11.2%          | 18.5%             |    -0.55 | -58.7%      | 13.7%           | -48.8%          | 10.9%           |       0.9985 | -0.2%            | -0.4%          | 0.0%           | 20.0%            | False   |
| dip_alim90 | K=5                             | -36.6%          | 53.3%             |    -0.59 | -96.3%      | 20.5%           | -92.3%          | 34.3%           |       0.9915 | -0.5%            | -1.0%          | -0.1%          | 20.0%            | False   |
| dip_alim90_teyit | K=10 | BTC>SMA200         | -9.3%           | 12.4%             |    -0.72 | -42.4%      | 6.5%            | -42.1%          | 4.5%            |       0.9965 | -0.1%            | -0.3%          | 0.1%           | 20.0%            | False   |
| dip_alim90 | K=10 | BTC>SMA200               | -14.0%          | 16.3%             |    -0.84 | -59.6%      | 6.8%            | -57.3%          | 7.8%            |       0.9995 | -0.2%            | -0.4%          | 0.0%           | 20.0%            | False   |
| dip_alim30 | K=5                             | -27.9%          | 28.2%             |    -1.01 | -88.3%      | 14.0%           | -84.1%          | 18.4%           |       1      | -0.5%            | -0.8%          | -0.2%          | 0.0%             | False   |
| dip_alim90 | K=5 | BTC>SMA200                | -27.5%          | 25.9%             |    -1.1  | -86.0%      | 7.2%            | -83.6%          | 12.6%           |       1      | -0.5%            | -0.8%          | -0.2%          | 20.0%            | False   |
| dip_alim90_teyit | K=5 | BTC>SMA200          | -21.6%          | 19.8%             |    -1.12 | -74.8%      | 6.5%            | -74.6%          | 8.1%            |       1      | -0.3%            | -0.6%          | -0.1%          | 0.0%             | False   |

Karşılaştırma: her hafta stratejinin tuttuğu sayıda rastgele coin seçen 2000 portföy (eşleştirilmiş rastgele). `fazla_*` bu portföye göre haftalık fazla getiri, `yatirim_orani` ortalama yatırımda kalma oranı.  
AL kuralları için KANIT = p < Bonferroni eşiği, fazla getiri ve bootstrap alt sınırı > 0, yılların ≥ %70'inde rastgeleden iyi, Sharpe > BTC al-tut.  
SAT kuralları (`SAT_` ile başlayan) için KANIT = sepet rastgeleden anlamlı derecede KÖTÜ (p < eşik), fazla getiri ve bootstrap üst sınırı < 0, yılların ≥ %70'inde rastgeleden kötü.

## Yıllık getiriler (en yüksek Sharpe: SAT_yorgunluk | K=10)
|      | BTC    | Eşit ağırlık   | SAT_yorgunluk | K=10   |
|-----:|:-------|:---------------|:-----------------------|
| 2020 | 258.3% | 58.9%          | 19.7%                  |
| 2021 | 43.3%  | 1147.7%        | 669.6%                 |
| 2022 | -64.9% | -81.4%         | -22.4%                 |
| 2023 | 154.5% | 94.2%          | 58.0%                  |
| 2024 | 132.6% | 24.3%          | -2.3%                  |
| 2025 | -6.9%  | -74.5%         | -36.3%                 |
| 2026 | -28.1% | -35.1%         | -14.2%                 |