# Strateji kataloğu: 1 haftalık swing (günlük veri)

Amaç: Akademik çalışmalarda ve uygulamada etkisi gösterilmiş fikirleri, kendi verimizle, önceden
sabitlenmiş parametrelerle test etmek. Her stratejinin **kanıt düzeyi** kaynağın gücüne göre verilmiştir:
- **A:** Hakemli akademik çalışma, büyük örneklem
- **B:** Akademik çalışma ama sınırlı / karışık sonuç
- **C:** Uygulayıcı backtest'leri, blog, anekdot

## Katalog

| # | Strateji | Tanım (test edilecek hali) | Kanıt | Veri | Not |
|---|---|---|---|---|---|
| 1 | **Kesitsel momentum** | Her hafta son 7 / 14 / 30 günde en çok yükselen coinleri al, 1 hafta tut | **A** | Günlük mum ✔ | Liu-Tsyvinski-Wu: 7 günlük kazanan-kaybeden farkı günlük %0.75, 30 günlük %0.68 |
| 2 | **Trend takibi / kırılım** | Fiyat N günlük zirveyi kırınca al (N=20/50), trend bozulunca ya da 1 hafta sonra çık | **A/B** | Günlük mum ✔ | Kripto piyasasının geçmiş getirisi 1–8 hafta sonrasını tahmin ediyor. İsabet genelde %40–50, kazançlar büyük |
| 3 | **BTC rejim filtresi** | BTC 200 günlük ortalamanın altındayken alım yapma (diğer stratejilerin üstüne katman) | **B/C** | Günlük mum ✔ | Bir backtest'te maksimum kaybı %-90'dan %-54'e indirdi. Getiriyi değil riski azaltır |
| 4 | **Kısa vadeli geri dönüş** | Son 1–3 günde en çok düşen *küçük / az likit* coinleri al | **A** | Günlük mum ✔ | Küçük coinlerde geri dönüş, büyüklerde ise momentum var. Likiditeye göre ayrılmalı |
| 5 | **Büyüklük (size)** | Küçük piyasa değerli coinleri tercih et | **A** (ama riskli) | Piyasa değeri ✘ (hacim ile vekil) | En güçlü akademik etki ama işlem maliyeti ve likidite yüzünden gerçekte yakalanması zor |
| 6 | **Hacim / alım patlaması** | Hacim normalin katları + taker alım oranı yüksek → al | **B** | Günlük mum ✔ | Senin "dipte alım başladı" fikrin. İlgi (attention) küçük/orta coinlerde getiriyi olumlu etkiliyor |
| 7 | **Fonlama oranı aşırılığı (ters)** | Fonlama çok yüksek → long kalabalık → kaçın / sat. Çok negatif → sıkışma → al | **B/C** | Fonlama ✔ (arşiv) | Trendde fonlama uzun süre yüksek kalabilir. Tek başına değil filtre olarak |
| 8 | **Açık pozisyon (OI) ile fiyat uyumsuzluğu** | Fiyat yükselirken OI düşüyor → zayıf yükseliş. Fiyat düşerken OI artıyor ve fonlama pozitif → düşüş devam | **C** | OI ✔ (arşiv, 2021 sonu+) | Senin "yükseliş yoruldu, alımlar durdu" fikrine en yakın. Kanıt zayıf, test değerli |
| 9 | **Duygu endeksi (Fear & Greed)** | Aşırı korkuda al, uzun tut | **C** | Harici API (ağ izni gerekir) | Aşırı korkuda almak uzun vadede iyi. Açgözlülükte satmak ise yükselişleri kaçırtıyor |
| 10 | **Faktör momentumu** | Son dönemde çalışan stratejiye ağırlık ver | **B** | 1–9'un çıktısı | Birden fazla strateji ayakta kalırsa kullanılabilir |

## Dikkat edilmesi gerekenler (literatürden)
- **Yayın sonrası zayıflama:** 2014–2023 arasında incelenen 49 kripto anomalisinden yalnızca 13'ü anlamlı kalmış.
  Eski makalelerdeki getiriler bugün aynen beklenmemeli. Bizim test dönemimiz (2022+) bu açıdan dürüst bir sınav.
- **Momentum çöküşleri:** Momentum ani piyasa dönüşlerinde sert kaybettirir. Rejim filtresi (3) ve oynaklık ayarlı
  pozisyon büyüklüğü bunu azaltır.
- **Küçük coin tuzağı:** Büyüklük ve geri dönüş etkileri en çok az likit coinlerde. Gerçek alım-satım maliyeti
  (kayma) orada çok daha yüksek. Likidite filtresi şart.
- **Blog backtest'leri** (C düzeyi) genelde tek coin, tek dönem, maliyetsiz ve seçilmiş parametrelerle yapılıyor.

## Önerilen test sırası
1. **Temel:** 1 (momentum) + 3 (rejim filtresi). En güçlü kanıt, en basit uygulama.
2. **Senin fikirlerin:** 6 (alım patlaması) ve 8 (OI/fonlama ile yorgunluk). Hem tek başına hem 1'in üstüne filtre olarak.
3. **Tamamlayıcı:** 2 (kırılım), 4 (geri dönüş, sadece küçük coinlerde), 7 (fonlama).
4. **Birleştirme:** Ayakta kalanları haftalık sıralama modelinde birleştirmek.

## Test yöntemi (değişmeyen kurallar)
- Haftalık portföy: her pazartesi en iyi K coin (K=5 ve 10), eşit ağırlık, 1 hafta tut. Komisyon ve kayma dahil.
- Karşılaştırma: BTC al-tut, eşit ağırlıklı tüm coinler, rastgele K coin.
- Parametreler test öncesinde sabit ve her strateji için en fazla 3 varyant. Çoklu deneme düzeltmesi yapılır.
- Son 6 ay (lockbox) yalnızca en sonda, bir kez kullanılır.
- Ölçütler: yıllık getiri, Sharpe oranı, maksimum düşüş, haftalık isabet, yıl bazında istikrar.

## Kaynaklar
- [Liu, Tsyvinski, Wu. Common Risk Factors in Cryptocurrency (Journal of Finance, 2022)](https://onlinelibrary.wiley.com/doi/abs/10.1111/jofi.13119), [NBER](https://www.nber.org/papers/w25882)
- [Up or down? Short-term reversal, momentum, and liquidity effects in cryptocurrency markets (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S1057521921002349)
- [Impact of size and volume on cryptocurrency momentum and reversal (Fičura)](https://wp.ffu.vse.cz/pdfs/wps/2023/01/03.pdf)
- [The reversal in the cryptocurrency market ... Does investor attention matter? (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11602072/)
- [Dynamic time series momentum of cryptocurrencies (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S1062940821000590)
- [Time-Series and Cross-Sectional Momentum in the Cryptocurrency Market (AUT)](https://acfr.aut.ac.nz/__data/assets/pdf_file/0009/918729/Time_Series_and_Cross_Sectional_Momentum_in_the_Cryptocurrency_Market_with_IA.pdf)
- [Systematic Trend-Following with Adaptive Portfolio Construction in Cryptocurrency Markets (arXiv)](https://arxiv.org/html/2602.11708v1)
- [Cryptocurrency factor momentum (Quantitative Finance)](https://www.tandfonline.com/doi/abs/10.1080/14697688.2023.2269999)
- [Taming crypto anomalies: A Lasso-type factor model (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0275531926000255)
- [Crypto momentum backtest with BTC 200-day trend filter (GitHub)](https://github.com/IsaacDodds/crypto-momentum-backtest)
- [Predictability of crypto returns: The impact of trading behavior (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S2214635023000266)
- [Open Interest Divergence and funding rate (CoinUnited Research)](https://coinunited.io/en/research/crypto/crypto-open-interest-divergence-signals-guide-2026)
- [How Funding Rates Predict Crypto's Most Violent Reversals (Yellow)](https://yellow.com/learn/how-to-read-funding-rates-crypto-reversals)
- [Exploring risk and return profiles of funding rate arbitrage (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S2096720925000818)
- [Bitcoin Fear and Greed Index trading strategy (Bitcoin Magazine)](https://bitcoinmagazine.com/markets/how-a-bitcoin-fear-and-greed-index-trading-strategy-beats-buy-and-hold-investing)
- [Backtesting Fear and Greed Index as a trading signal (Substack)](https://codemeetscapital.substack.com/p/backtesting-fear-and-greed-index)
