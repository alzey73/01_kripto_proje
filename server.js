// Gerekli modülleri içeri aktarıyoruz
const express = require('express'); // Web sunucusu framework'ü
const path = require('path');     // Dosya yolları için
const { fetchKlines, extractClosePrices } = require('./utils/binanceApi'); // Binance API yardımcıları
const { calculateRSI } = require('./utils/indicators'); // İndikatör hesaplama yardımcıları

const app = express();
const PORT = process.env.PORT || 3000; // Sunucunun çalışacağı port, varsayılan 3000

// --- Sabitler ve Konfigürasyonlar ---
const SYMBOL = 'BTCUSDT';      // İşlem yapılacak sembol
const INTERVAL = '15m';        // Mum aralığı
const KLINE_LIMIT = 1000;      // Çekilecek mum verisi adedi (tarayıcıda gösterilecek)
const RSI_PERIOD = 14;         // RSI hesaplama periyodu

// `public` klasöründeki statik dosyaları sunmak için Express'i yapılandırıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoints ---

// '/api/data' endpoint'i, tarayıcıya mum verilerini ve RSI'yı sağlar
app.get('/api/data', async (req, res) => {
    try {
        const klines = await fetchKlines(SYMBOL, INTERVAL, KLINE_LIMIT, true); 

        if (klines.length === 0) {
            console.error("API'den mum verisi çekilemedi veya boş geldi.");
            return res.status(500).json({ error: "Mum verileri çekilemedi." });
        }

        const closes = extractClosePrices(klines);

        // --- GÜNCELLEME: Tüm geçmiş RSI değerlerini hesapla ---
        const historicalRSI = calculateRSI(closes, RSI_PERIOD);
        // En son RSI değeri (bilgi kartı için)
        const currentRSI = historicalRSI[historicalRSI.length - 1];
        // --- GÜNCELLEME SONU ---
        
        const formattedKlines = klines.map(k => ({
            time: new Date(k[0]).toISOString(), 
            open: parseFloat(k[1]),             
            high: parseFloat(k[2]),             
            low: parseFloat(k[3]),              
            close: parseFloat(k[4])             
        }));

        res.json({
            klines: formattedKlines, 
            rsi: currentRSI,         // Bilgi kartı için son RSI
            historicalRSI: historicalRSI, // Grafik için tüm RSI değerleri
            currentPrice: closes[closes.length - 1] 
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
