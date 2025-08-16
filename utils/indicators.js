/**
 * Verilen kapanış fiyatları dizisine göre her bir nokta için RSI değerlerini hesaplar.
 * @param {Array<number>} closes Kapanış fiyatları dizisi
 * @param {number} period RSI periyodu (varsayılan 14)
 * @returns {Array<number | null>} Hesaplanan RSI değerleri dizisi (yeterli veri olmayanlar null)
 */
function calculateRSI(closes, period = 14) {
    const rsiValues = new Array(closes.length).fill(null); // Tüm RSI değerlerini tutacak dizi

    // RSI hesaplaması için en az (periyot + 1) kadar mum verisi gerekir
    if (!closes || closes.length < period + 1) {
        console.warn(`RSI hesaplaması için yeterli veri yok. En az ${period + 1} mum gerekli, ${closes ? closes.length : 0} adet var.`);
        return rsiValues; // Yeterli veri yoksa null'larla dolu dizi döner
    }

    // İlk RSI hesaplaması için gerekli olan ilk 'period' + 1 mum
    let initialGains = 0;
    let initialLosses = 0;

    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) {
            initialGains += change;
        } else {
            initialLosses -= change;
        }
    }

    let avgGain = initialGains / period;
    let avgLoss = Math.abs(initialLosses) / period;

    // İlk RSI değerini hesapla ve kaydet
    if (avgLoss === 0) {
        rsiValues[period] = 100;
    } else if (avgGain === 0) {
        rsiValues[period] = 0;
    } else {
        const rs = avgGain / avgLoss;
        rsiValues[period] = 100 - (100 / (1 + rs));
    }

    // Sonraki mumlar için EMA tabanlı ortalama ve RSI hesaplaması
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - change) / period;
        }

        if (avgLoss === 0) {
            rsiValues[i] = 100;
        } else if (avgGain === 0) {
            rsiValues[i] = 0;
        } else {
            const rs = avgGain / avgLoss;
            rsiValues[i] = 100 - (100 / (1 + rs));
        }
    }

    return rsiValues; // Tüm hesaplanan RSI değerleri dizisini döndür
}

module.exports = {
    calculateRSI
};
