// Gerekli modülleri içeri aktarıyoruz
const express = require('express'); // Web sunucusu framework'ü
const path = require('path');     // Dosya yolları için
const { fetchKlines, extractClosePrices } = require('./utils/binanceApi'); // Binance API yardımcıları
// Tüm indikatör hesaplama fonksiyonlarını içeri aktarıyoruz
const { 
    calculateRSI, 
    calculateSMA, 
    calculateEMA, 
    calculateMACD, 
    calculateBollingerBands, 
    calculateStochasticOscillator, 
    calculateATR, 
    calculateOBV 
} = require('./utils/indicators'); 

const app = express();
const PORT = process.env.PORT || 3000; // Sunucunun çalışacağı port, varsayılan 3000

// --- Sabitler ve Konfigürasyonlar ---
const SYMBOL = 'BTCUSDT';      // İşlem yapılacak sembol
const INTERVAL = '15m';        // Mum aralığı
const KLINE_LIMIT = 1000;      // Çekilecek mum verisi adedi (tarayıcıda gösterilecek)
const RSI_PERIOD = 14;         // RSI hesaplama periyodu
const SMA_PERIOD = 50;         // SMA periyodu
const EMA_PERIOD = 20;         // EMA periyodu
const MACD_FAST_PERIOD = 12;   // MACD hızlı EMA periyodu
const MACD_SLOW_PERIOD = 26;   // MACD yavaş EMA periyodu
const MACD_SIGNAL_PERIOD = 9;  // MACD sinyal periyodu
const BB_PERIOD = 20;          // Bollinger Bantları periyodu
const BB_STD_DEV = 2;          // Bollinger Bantları standart sapma katsayısı
const STOCH_K_PERIOD = 14;     // Stokastik %K periyodu
const STOCH_D_PERIOD = 3;      // Stokastik %D periyodu
const ATR_PERIOD = 14;         // ATR periyodu


// `public` klasöründeki statik dosyaları sunmak için Express'i yapılandırıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoints ---

// '/api/data' endpoint'i, tarayıcıya mum verilerini ve tüm indikatörleri sağlar
app.get('/api/data', async (req, res) => {
    try {
        // Binance API'den mum verilerini çek (önbelleklemeyi kullanacak)
        // forceFetch: true yaparak her istekte güncel veriyi çekmeye zorluyoruz.
        const klines = await fetchKlines(SYMBOL, INTERVAL, KLINE_LIMIT, true); // TRUE: Her zaman API'den çek

        if (klines.length === 0) {
            console.error("API'den mum verisi çekilemedi veya boş geldi.");
            return res.status(500).json({ error: "Mum verileri çekilemedi." });
        }

        // Kapanış fiyatlarını ayıkla
        const closes = extractClosePrices(klines);

        // OHLCV verilerini Chart.js'in beklediği formata dönüştür (high, low, close için parseFloat)
        const formattedKlinesForIndicators = klines.map(k => ({
            time: new Date(k[0]).toISOString(),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
        // Hacim verilerini ayrı bir dizi olarak al
        const volumes = formattedKlinesForIndicators.map(k => k.volume);


        // --- Tüm İndikatörleri Hesapla ---
        const historicalRSI = calculateRSI(closes, RSI_PERIOD);
        const currentRSI = historicalRSI[historicalRSI.length - 1]; // Bilgi kartı için son RSI

        const smaValues = calculateSMA(closes, SMA_PERIOD);
        const emaValues = calculateEMA(closes, EMA_PERIOD);
        const macd = calculateMACD(closes, MACD_FAST_PERIOD, MACD_SLOW_PERIOD, MACD_SIGNAL_PERIOD);
        const bollingerBands = calculateBollingerBands(closes, BB_PERIOD, BB_STD_DEV);
        const stochastic = calculateStochasticOscillator(formattedKlinesForIndicators, STOCH_K_PERIOD, STOCH_D_PERIOD); // Stochastic OHLCV objeleri bekler
        const atrValues = calculateATR(formattedKlinesForIndicators, ATR_PERIOD); // ATR OHLCV objeleri bekler
        const obvValues = calculateOBV(closes, volumes); // OBV kapanış ve hacim bekler


        // Verileri tarayıcıya gönder
        // Sadece gerekli kline verilerini gönderelim (timestamp, open, high, low, close)
        const formattedKlinesForFrontend = klines.map(k => ({
            time: new Date(k[0]).toISOString(), // Açılış zamanı (ISO formatında)
            open: parseFloat(k[1]),             // Açılış fiyatı
            high: parseFloat(k[2]),             // En yüksek fiyat
            low: parseFloat(k[3]),              // En düşük fiyat
            close: parseFloat(k[4])             // Kapanış fiyatı
        }));

        res.json({
            klines: formattedKlinesForFrontend, // Biçimlendirilmiş mum verileri
            currentPrice: closes[closes.length - 1], // En son kapanış fiyatı

            // Tüm indikatör değerlerini gönder
            rsi: currentRSI,         // Bilgi kartı için son RSI
            historicalRSI: historicalRSI, // Grafik için tüm RSI değerleri
            sma: smaValues,
            ema: emaValues,
            macd: macd,
            bollingerBands: bollingerBands,
            stochastic: stochastic,
            atr: atrValues,
            obv: obvValues
        });

    } catch (error) {
        console.error('Veri işlenirken hata oluştu:', error);
        res.status(500).json({ error: 'Veri alınırken bir hata oluştu.' });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Lütfen web tarayıcınızı açın ve bu adresi ziyaret edin.`);
});
