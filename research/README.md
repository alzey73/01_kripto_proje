# Sinyal araştırma altyapısı

Amaç: Binance'teki tüm USDT coinlerinde **seçici** sinyal üreten bir yöntem geliştirmek ve
çalıştığını **istatistiksel olarak kanıtlamak**. Sunucu ve bildirim sonraki aşamada.

## Kurulum
```bash
pip install -r requirements.txt
```

## 1. Altyapının dürüst olduğunu doğrula (veri gerekmez)
```bash
python -m pytest tests                                 # geleceğe bakış ve etiket testleri
python -m research.run --synthetic null                # rastgele piyasa → hiçbir kural GEÇMEMELİ
python -m research.run --synthetic planted --edge 0.4  # gerçek bir sinyal var → kurallar GEÇMELİ
```

## 2. Gerçek veriyi indir
```bash
python -m research.data --interval 1h --start 2021-01 --include-delisted
```
`--include-delisted` delist edilmiş coinleri de indirir. Yalnızca bugün işlem gören coinlerle test etmek
sonuçları iyimser gösterir (hayatta kalma yanlılığı).

## 3. Backtest
```bash
python -m research.run                                   # varsayılan: long, TP=1.5×ATR, SL=1.5×ATR, 24 mum
python -m research.run --tp 2 --sl 1 --horizon 48        # farklı hedef/stop
python -m research.run --side short
python -m research.run --interval 4h --horizon 12
python -m research.run --sample 0.3                      # bellek/hız için eğitim örneklemesi
```
Her çalıştırma `reports/<isim>/report.md` üretir.

## 4. Nihai test (lockbox)
Son 6 ay geliştirme sırasında **hiç kullanılmaz**. Yöntem ve kural dondurulduktan sonra bir kez:
```bash
python -m research.run --include-lockbox <aynı parametreler>
```
Kural burada da geçerse "çalışıyor" diyebiliriz. Lockbox'a bakıp tekrar ayar yapmak onu geçersiz kılar.

## Yöntem
| Adım | Ne yapılıyor | Neden |
|---|---|---|
| Özellikler (`features.py`) | ~60 ölçekten bağımsız özellik: momentum, oynaklık, RSI/Stoch/MACD, EMA uzaklığı, hacim ve taker akışı, piyasa geneli ve BTC bağlamı, coinin piyasadaki sırası | Tek model tüm coinlerde çalışır, veri çok artar |
| Etiket (`labels.py`) | Triple barrier: t+1 açılışında giriş, ATR tabanlı TP/SL, süre sınırı. Aynı mumda ikisi → kayıp | "Yön" değil gerçek bir işlemin sonucu ölçülür, komisyon dahil |
| Walk-forward (`walkforward.py`) | Genişleyen pencere, 3 aylık test katmanları, embargo | Model hep geçmişten öğrenir, geleceği görmez |
| Kalibrasyon | Eğitimin son 3 ayında isotonic regresyon ve üst-dilim eşikleri | "%70" gerçekten ~%70 tutsun; eşik seçimi test verisine bakmadan yapılır |
| Değerlendirme (`evaluate.py`) | Örtüşmeyen işlemler, Wilson güven aralığı, rastgele seçim testi, günlük blok bootstrap, katman istikrarı | Şans eseri iyi görünen sonuçları elemek |

### KANIT kriterleri (hepsi aynı anda)
1. ≥ 100 örtüşmeyen sinyal
2. İsabetin Wilson %95 alt sınırı > taban oran
3. Aynı sayıda rastgele sinyalden daha iyi (p < 0.01)
4. Komisyon sonrası ortalama getiri > 0 **ve** bootstrap %95 alt sınırı > 0
5. Sinyal üreten test katmanlarının ≥ %70'inde pozitif ortalama getiri

## Sentetik doğrulama sonuçları
| Test | AUC | Sonuç |
|---|---|---|
| Rastgele veri (`null`) | 0.496 | Hiçbir kural geçmedi ✔ (sızıntı yok) |
| Zayıf sinyal (`--edge 0.15`) | 0.521 | İsabet anlamlı ama maliyeti karşılamıyor → doğru şekilde reddedildi ✔ |
| Güçlü sinyal (`--edge 0.4`) | 0.596 | 8 kural geçti; model %70 dediğinde gerçekleşen ~%71 ✔ |

Detaylar: `reports/*/report.md`.
