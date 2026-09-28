# Haftalık portföy testi: momentum
_Oluşturma: 2026-09-28 00:09_  
Dönem: **2020-07-20 → 2026-02-23** (293 hafta, geliştirme dönemi, son 6 ay hariç)  
Maliyet: taraf başına %0.15, gerçek ağırlık değişimi üzerinden. Evren: 60+ gün geçmiş, 30 günlük medyan hacim ≥ 1M USDT, delist edilenler dahil.

## Sonuç
**Hiçbir varyant kanıt kriterlerini geçemedi.**

## Karşılaştırma ölçütleri
| strateji                 | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   |
|:-------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|
| BTC al-tut               | 41.8%           | 57.2%             |     0.9  | -75.2%      | 52.2%           | 614.3%          |
| Eşit ağırlık (tüm evren) | 7.1%            | 94.0%             |     0.53 | -93.8%      | 51.9%           | 47.0%           |

## Varyantlar (12 adet, Bonferroni eşiği p < 0.0042)
| strateji                  | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   | yatirim_orani   |   rastgele_p | fazla_haftalik   | fazla_ci_alt   | fazla_ci_ust   | yil_ustun_oran   | KANIT   |
|:--------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|:----------------|-------------:|:-----------------|:---------------|:---------------|:-----------------|:--------|
| mom30 | K=10 | BTC>SMA200 | -4.7%           | 93.7%             |     0.37 | -96.7%      | 31.1%           | -23.7%          | 62.8%           |       0.4623 | -0.0%            | -1.1%          | 0.9%           | 0.0%             | False   |
| mom30 | K=5 | BTC>SMA200  | -21.4%          | 108.4%            |     0.23 | -98.2%      | 27.6%           | -74.2%          | 62.8%           |       0.6667 | -0.2%            | -1.7%          | 1.0%           | 20.0%            | False   |
| mom14 | K=10 | BTC>SMA200 | -20.3%          | 89.2%             |     0.17 | -98.3%      | 30.4%           | -72.2%          | 62.8%           |       0.8796 | -0.4%            | -1.3%          | 0.5%           | 20.0%            | False   |
| mom7 | K=5 | BTC>SMA200   | -33.2%          | 109.5%            |     0.12 | -99.6%      | 31.1%           | -89.7%          | 62.8%           |       0.8321 | -0.5%            | -1.8%          | 0.9%           | 20.0%            | False   |
| mom7 | K=10 | BTC>SMA200  | -25.9%          | 84.9%             |     0.06 | -98.9%      | 28.7%           | -81.5%          | 62.8%           |       0.9775 | -0.6%            | -1.6%          | 0.3%           | 0.0%             | False   |
| mom30 | K=10              | -42.2%          | 108.1%            |    -0    | -99.8%      | 46.4%           | -95.4%          | 100.0%          |       0.9675 | -0.7%            | -1.8%          | 0.4%           | 0.0%             | False   |
| mom14 | K=5 | BTC>SMA200  | -40.8%          | 107.8%            |    -0.02 | -99.5%      | 28.3%           | -94.8%          | 62.8%           |       0.9535 | -0.8%            | -2.1%          | 0.5%           | 0.0%             | False   |
| mom30 | K=5               | -63.1%          | 129.5%            |    -0.19 | -100.0%     | 40.6%           | -99.6%          | 100.0%          |       0.9865 | -1.2%            | -2.8%          | 0.3%           | 0.0%             | False   |
| mom14 | K=10              | -53.3%          | 104.4%            |    -0.22 | -99.9%      | 45.7%           | -98.6%          | 100.0%          |       1      | -1.1%            | -2.2%          | -0.0%          | 0.0%             | False   |
| mom7 | K=5                | -69.7%          | 128.5%            |    -0.32 | -100.0%     | 45.4%           | -99.9%          | 100.0%          |       0.997  | -1.5%            | -3.0%          | 0.2%           | 0.0%             | False   |
| mom7 | K=10               | -57.5%          | 101.8%            |    -0.34 | -99.9%      | 45.7%           | -99.2%          | 100.0%          |       1      | -1.3%            | -2.3%          | -0.3%          | 0.0%             | False   |
| mom14 | K=5               | -72.8%          | 126.4%            |    -0.45 | -100.0%     | 42.3%           | -99.9%          | 100.0%          |       1      | -1.8%            | -3.2%          | -0.3%          | 0.0%             | False   |

Karşılaştırma: her hafta stratejinin tuttuğu sayıda rastgele coin seçen 2000 portföy (eşleştirilmiş rastgele). `fazla_*` bu portföye göre haftalık fazla getiri, `yatirim_orani` ortalama yatırımda kalma oranı.  
AL kuralları için KANIT = p < Bonferroni eşiği, fazla getiri ve bootstrap alt sınırı > 0, yılların ≥ %70'inde rastgeleden iyi, Sharpe > BTC al-tut.  
SAT kuralları (`SAT_` ile başlayan) için KANIT = sepet rastgeleden anlamlı derecede KÖTÜ (p < eşik), fazla getiri ve bootstrap üst sınırı < 0, yılların ≥ %70'inde rastgeleden kötü.

## Yıllık getiriler (en yüksek Sharpe: mom30 | K=10 | BTC>SMA200)
|      | BTC    | Eşit ağırlık   | mom30 | K=10 | BTC>SMA200   |
|-----:|:-------|:---------------|:----------------------------|
| 2020 | 258.3% | 58.9%          | 122.7%                      |
| 2021 | 43.3%  | 1147.7%        | 255.0%                      |
| 2022 | -64.9% | -81.4%         | -0.1%                       |
| 2023 | 154.5% | 94.2%          | -5.0%                       |
| 2024 | 132.6% | 24.3%          | -59.3%                      |
| 2025 | -6.9%  | -74.5%         | -75.0%                      |
| 2026 | -28.1% | -35.1%         | 0.0%                        |