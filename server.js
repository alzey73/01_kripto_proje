// Gerekli modülleri içeri aktarıyoruz
const express = require('express'); 
const path = require('path');     
const { fetchKlines, extractClosePrices } = require('./utils/binanceApi'); 
const { 
    calculateRSI, calculateSMA, calculateEMA, calculateMACD, 
    calculateBollingerBands, calculateStochasticOscillator, calculateATR, calculateOBV 
} = require('./utils/indicators'); 
const { loadModel, predictNextCandleDirection } = require('./utils/mlService'); // ML servisimiz

const app = express();
const PORT = process.env.PORT || 3000; 

// --- Sabitler ve Konfigürasyonlar ---
const SYMBOL = 'BTCUSDT';      
const INTERVAL = '15m';        
const KLINE_LIMIT = 1000;      
const RSI_PERIOD = 14;         
const SMA_PERIOD = 50;         
const EMA_PERIOD = 20;         
const MACD_FAST_PERIOD = 12;   
const MACD_SLOW_PERIOD = 26;   
const MACD_SIGNAL_PERIOD = 9;  
const BB_PERIOD = 20;          
const BB_STD_DEV = 2;          
const STOCH_K_PERIOD = 14;     
const STOCH_D_PERIOD = 3;      
const ATR_PERIOD = 14;         

const LAG_COUNT = 4; 
const MIN_CHANGE_PERCENT_FOR_DIRECTION = 0.0005; 


// `public` klasöründeki statik dosyaları sunmak için Express'i yapılandırıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// --- Yardımcı Fonksiyonlar (Veri Hazırlığı ve Normalizasyon için - ML devre dışı olduğu için kullanılmayacak) ---
function normalizeFeatures(features) {
    console.warn('normalizeFeatures fonksiyonu ML devre dışı olduğu için kullanılmayacak.');
    return features; // Sadece gelen özellikleri döndür
}

function createSingleFeatureVector(klines, indicators, currentIndex) {
    console.warn('createSingleFeatureVector fonksiyonu ML devre dışı olduğu için kullanılmayacak.');
    return null; // Null döndür
}


// --- API Endpoints ---

// '/api/data' endpoint'i, tarayıcıya mum verilerini ve tüm indikatörleri sağlar
app.get('/api/data', async (req, res) => {
    try {
        const klines = await fetchKlines(SYMBOL, INTERVAL, KLINE_LIMIT, true); 

        if (klines.length === 0) {
            console.error("API'den mum verisi çekilemedi veya boş geldi.");
            return res.status(500).json({ error: "Mum verileri çekilemedi." });
        }

        const closes = extractClosePrices(klines);

        const formattedKlinesForIndicators = klines.map(k => ({
            time: new Date(k[0]).toISOString(),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
        const volumes = formattedKlinesForIndicators.map(k => k.volume);

        // --- Tüm İndikatörleri Hesapla ---
        const historicalRSI = calculateRSI(closes, RSI_PERIOD);
        const currentRSI = historicalRSI[historicalRSI.length - 1]; 

        const smaValues = calculateSMA(closes, SMA_PERIOD);
        const emaValues = calculateEMA(closes, EMA_PERIOD);
        const macd = calculateMACD(closes, MACD_FAST_PERIOD, MACD_SLOW_PERIOD, MACD_SIGNAL_PERIOD);
        const bollingerBands = calculateBollingerBands(closes, BB_PERIOD, BB_STD_DEV);
        const stochastic = calculateStochasticOscillator(formattedKlinesForIndicators, STOCH_K_PERIOD, STOCH_D_PERIOD); 
        const atrValues = calculateATR(formattedKlinesForIndicators, ATR_PERIOD); 
        const obvValues = calculateOBV(closes, volumes); 

        // --- Makine Öğrenimi Tahmini (Devre Dışı) ---
        // ML tahmini fonksiyonunu çağırıyoruz ama o artık "ML Devre Dışı" döndürecek
        const nextCandlePrediction = await predictNextCandleDirection([]); 
        // --- Makine Öğrenimi Tahmini Sonu ---


        // Verileri tarayıcıya gönder
        const formattedKlinesForFrontend = klines.map(k => ({
            time: new Date(k[0]).toISOString(), 
            open: parseFloat(k[1]),             
            high: parseFloat(k[2]),             
            low: parseFloat(k[3]),              
            close: parseFloat(k[4])             
        }));

        res.json({
            klines: formattedKlinesForFrontend, 
            currentPrice: closes[closes.length - 1], 

            rsi: currentRSI,         
            historicalRSI: historicalRSI, 
            sma: smaValues,
            ema: emaValues,
            macd: macd,
            bollingerBands: bollingerBands,
            stochastic: stochastic,
            atr: atrValues,
            obv: obvValues,
            nextCandlePrediction: nextCandlePrediction // Tahmin sonucunu da gönder
        });

    } catch (error) {
        console.error('Veri işlenirken hata oluştu:', error);
        res.status(500).json({ error: 'Veri alınırken bir hata oluştu.' });
    }
});

// Sunucuyu başlat
app.listen(PORT, async () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Lütfen web tarayıcınızı açın ve bu adresi ziyaret edin.`);
    // await loadModel(); // Modeli yüklemeyi devre dışı bırakıyoruz
});
