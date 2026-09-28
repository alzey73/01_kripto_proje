# Haftalık portföy testi: funding
_Oluşturma: 2026-09-28 00:13_  
Dönem: **2020-07-20 → 2026-02-23** (293 hafta, geliştirme dönemi, son 6 ay hariç)  
Maliyet: taraf başına %0.15, gerçek ağırlık değişimi üzerinden. Evren: 60+ gün geçmiş, 30 günlük medyan hacim ≥ 1M USDT, delist edilenler dahil.

## Sonuç
**2 varyant tüm kanıt kriterlerini geçti:** SAT_fonlama7_pozitif | K=10 | BTC>SMA200, SAT_fonlama7_pozitif | K=10

## Karşılaştırma ölçütleri
| strateji                   | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   |
|:---------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|
| BTC al-tut                 | 41.8%           | 57.2%             |     0.9  | -75.2%      | 52.2%           | 614.3%          |
| Eşit ağırlık (tüm evren)   | 7.1%            | 94.0%             |     0.53 | -93.8%      | 51.9%           | 47.0%           |
| Eşit ağırlık (grup evreni) | -2.0%           | 88.1%             |     0.43 | -94.2%      | 53.2%           | -11.0%          |

## Varyantlar (16 adet, Bonferroni eşiği p < 0.0031)
| strateji                                 | yillik_getiri   | yillik_oynaklik   |   sharpe | max_dusus   | pozitif_hafta   | toplam_getiri   | yatirim_orani   |   rastgele_p | fazla_haftalik   | fazla_ci_alt   | fazla_ci_ust   | yil_ustun_oran   | KANIT   |
|:-----------------------------------------|:----------------|:------------------|---------:|:------------|:----------------|:----------------|:----------------|-------------:|:-----------------|:---------------|:---------------|:-----------------|:--------|
| SAT_fonlama3_pozitif | K=10 | BTC>SMA200 | -17.3%          | 82.0%             |     0.17 | -97.7%      | 30.4%           | -65.7%          | 62.8%           |       0.1709 | -0.2%            | -0.8%          | 0.5%           | 40.0%            | False   |
| SAT_fonlama3_pozitif | K=10              | -29.8%          | 97.5%             |     0.12 | -99.2%      | 49.1%           | -86.4%          | 100.0%          |       0.1849 | -0.2%            | -1.0%          | 0.5%           | 40.0%            | False   |
| SAT_fonlama3_pozitif | K=5               | -50.4%          | 110.3%            |    -0.11 | -99.7%      | 46.8%           | -98.1%          | 100.0%          |       0.035  | -0.7%            | -1.8%          | 0.5%           | 0.0%             | False   |
| SAT_fonlama3_pozitif | K=5 | BTC>SMA200  | -40.4%          | 91.8%             |    -0.13 | -98.9%      | 28.0%           | -94.6%          | 62.8%           |       0.0125 | -0.7%            | -1.6%          | 0.3%           | 0.0%             | False   |
| SAT_fonlama7_pozitif | K=5               | -51.0%          | 100.3%            |    -0.22 | -99.6%      | 47.4%           | -98.2%          | 100.0%          |       0.009  | -0.9%            | -1.9%          | 0.3%           | 20.0%            | False   |
| SAT_fonlama7_pozitif | K=10 | BTC>SMA200 | -37.8%          | 72.9%             |    -0.27 | -98.1%      | 28.0%           | -93.1%          | 62.8%           |       0.0005 | -0.8%            | -1.4%          | -0.2%          | 20.0%            | True    |
| SAT_fonlama7_pozitif | K=10              | -47.7%          | 88.2%             |    -0.27 | -99.3%      | 46.8%           | -97.4%          | 99.9%           |       0.0005 | -0.9%            | -1.6%          | -0.1%          | 20.0%            | True    |
| SAT_fonlama7_pozitif | K=5 | BTC>SMA200  | -44.1%          | 82.7%             |    -0.29 | -98.9%      | 28.7%           | -96.2%          | 62.8%           |       0.001  | -0.9%            | -1.7%          | 0.1%           | 20.0%            | False   |
| fonlama3_negatif | K=5 | BTC>SMA200      | -43.9%          | 77.3%             |    -0.37 | -99.8%      | 23.9%           | -96.1%          | 51.7%           |       0.9965 | -0.7%            | -1.6%          | 0.2%           | 20.0%            | False   |
| fonlama3_negatif | K=10 | BTC>SMA200     | -32.4%          | 58.0%             |    -0.38 | -98.6%      | 24.6%           | -89.0%          | 45.6%           |       0.9975 | -0.4%            | -1.0%          | 0.1%           | 0.0%             | False   |
| fonlama3_negatif | K=10                  | -46.1%          | 77.0%             |    -0.41 | -99.7%      | 43.0%           | -96.9%          | 82.2%           |       0.998  | -0.6%            | -1.2%          | 0.1%           | 20.0%            | False   |
| fonlama3_negatif | K=5                   | -59.5%          | 98.5%             |    -0.43 | -100.0%     | 42.0%           | -99.4%          | 88.6%           |       0.9975 | -0.9%            | -2.0%          | 0.2%           | 40.0%            | False   |
| fonlama7_negatif | K=10 | BTC>SMA200     | -34.1%          | 57.7%             |    -0.43 | -98.4%      | 23.9%           | -90.4%          | 47.5%           |       0.9995 | -0.6%            | -1.1%          | -0.2%          | 0.0%             | False   |
| fonlama7_negatif | K=10                  | -51.4%          | 77.5%             |    -0.53 | -99.8%      | 42.7%           | -98.3%          | 84.5%           |       1      | -0.9%            | -1.5%          | -0.3%          | 20.0%            | False   |
| fonlama7_negatif | K=5 | BTC>SMA200      | -46.1%          | 69.3%             |    -0.54 | -99.7%      | 23.5%           | -96.9%          | 52.6%           |       1      | -0.9%            | -1.6%          | -0.3%          | 0.0%             | False   |
| fonlama7_negatif | K=5                   | -63.6%          | 90.4%             |    -0.66 | -100.0%     | 41.0%           | -99.7%          | 89.8%           |       1      | -1.4%            | -2.2%          | -0.5%          | 0.0%             | False   |

Karşılaştırma: her hafta stratejinin tuttuğu sayıda rastgele coin seçen 2000 portföy (eşleştirilmiş rastgele). `fazla_*` bu portföye göre haftalık fazla getiri, `yatirim_orani` ortalama yatırımda kalma oranı.  
AL kuralları için KANIT = p < Bonferroni eşiği, fazla getiri ve bootstrap alt sınırı > 0, yılların ≥ %70'inde rastgeleden iyi, Sharpe > BTC al-tut.  
SAT kuralları (`SAT_` ile başlayan) için KANIT = sepet rastgeleden anlamlı derecede KÖTÜ (p < eşik), fazla getiri ve bootstrap üst sınırı < 0, yılların ≥ %70'inde rastgeleden kötü.

## Yıllık getiriler (en yüksek Sharpe: SAT_fonlama3_pozitif | K=10 | BTC>SMA200)
|      | BTC    | Eşit ağırlık   | SAT_fonlama3_pozitif | K=10 | BTC>SMA200   |
|-----:|:-------|:---------------|:-------------------------------------------|
| 2020 | 258.3% | 80.0%          | 67.1%                                      |
| 2021 | 43.3%  | 576.8%         | 265.3%                                     |
| 2022 | -64.9% | -81.3%         | -0.1%                                      |
| 2023 | 154.5% | 98.2%          | -32.4%                                     |
| 2024 | 132.6% | 21.2%          | -76.4%                                     |
| 2025 | -6.9%  | -74.9%         | -64.6%                                     |
| 2026 | -28.1% | -35.1%         | 0.0%                                       |