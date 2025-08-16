// axios kütüphanesini içeri aktarıyoruz, HTTP istekleri için kullanılacak
const axios = require('axios');

// Binance API ana URL'si
const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

/**
 * Binance API'sinden belirli bir sembol ve aralık için mum verilerini (OHLCV) çeker.
 *
 * @param {string} symbol İşlem yapılacak sembol (örn: "BTCUSDT")
 * @param {string} interval Mum aralığı (örn: "15m", "1h", "1d")
 * @param {number} limit Çekilecek mum verisi adedi (maksimum 1000)
 * @returns {Promise<Array<Array<string>>>} Mum verileri dizisi (raw format)
 */
async function fetchKlines(symbol, interval, limit) {
    try {
        console.log(`Binance'ten ${symbol} için ${limit} adet ${interval} mum verisi çekiliyor...`);
        const response = await axios.get(`${BINANCE_API_BASE}/klines`, {
            params: {
                symbol: symbol,
                interval: interval,
                limit: limit
            }
        });
        // API'den gelen ham veriyi döndürüyoruz
        return response.data;
    } catch (error) {
        console.error(`Binance mum verileri çekilirken hata oluştu (${symbol}, ${interval}):`, error.message);
        if (error.response) {
            console.error('API Yanıt Hatası Durumu:', error.response.status);
            // Hata yanıtının detaylarını görmek için
            // console.error('API Yanıt Detayı:', error.response.data); 
        }
        return []; // Hata durumunda boş dizi döndür
    }
}

/**
 * Çekilen ham mum verilerinden sadece kapanış fiyatlarını (parseFloat olarak) ayıklar.
 * Binance Klines formatı: [openTime, open, high, low, close, volume, ...]
 * Kapanış fiyatı 4. indekstedir.
 * * @param {Array<Array<string>>} klines Ham mum verileri dizisi
 * @returns {Array<number>} Sayısal kapanış fiyatları dizisi
 */
function extractClosePrices(klines) {
    if (!klines || klines.length === 0) {
        return [];
    }
    // Her mum verisinin içindeki 4. indeksi (kapanış fiyatı) alıp sayıya çeviriyoruz
    return klines.map(kline => parseFloat(kline[4]));
}

// Bu fonksiyonları diğer modüllerden erişilebilir yapmak için export ediyoruz.
module.exports = {
    fetchKlines,
    extractClosePrices
};
