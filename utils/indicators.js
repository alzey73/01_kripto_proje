/**
 * Verilen kapanış fiyatları dizisine göre her bir nokta için RSI değerlerini hesaplar.
 * @param {Array<number>} closes Kapanış fiyatları dizisi
 * @param {number} period RSI periyodu (varsayılan 14)
 * @returns {Array<number | null>} Hesaplanan RSI değerleri dizisi (yeterli veri olmayanlar null)
 */
function calculateRSI(closes, period = 14) {
    const rsiValues = new Array(closes.length).fill(null);

    if (!closes || closes.length < period + 1) {
        // console.warn(`RSI hesaplaması için yeterli veri yok. En az ${period + 1} mum gerekli, ${closes ? closes.length : 0} adet var.`);
        return rsiValues;
    }

    let avgGain = 0;
    let avgLoss = 0;

    // İlk 'period' mum için ortalama kazanç ve kayıp hesaplaması
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) {
            avgGain += change;
        } else {
            avgLoss += Math.abs(change);
        }
    }

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
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
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

    return rsiValues;
}

/**
 * Basit Hareketli Ortalama (SMA) hesaplar.
 * @param {Array<number>} data Hesaplama yapılacak veri dizisi
 * @param {number} period SMA periyodu
 * @returns {Array<number | null>} Hesaplanan SMA değerleri dizisi
 */
function calculateSMA(data, period) {
    const smaValues = new Array(data.length).fill(null);
    if (!data || data.length < period) {
        return smaValues;
    }
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        smaValues[i] = sum / period;
    }
    return smaValues;
}

/**
 * Üstel Hareketli Ortalama (EMA) hesaplar.
 * @param {Array<number>} data Hesaplama yapılacak veri dizisi
 * @param {number} period EMA periyodu
 * @returns {Array<number | null>} Hesaplanan EMA değerleri dizisi
 */
function calculateEMA(data, period) {
    const emaValues = new Array(data.length).fill(null);
    if (!data || data.length < period) {
        return emaValues;
    }

    const multiplier = 2 / (period + 1);

    // İlk EMA, ilk SMA'ya eşittir
    let initialSum = data.slice(0, period).reduce((a, b) => a + b, 0);
    emaValues[period - 1] = initialSum / period;

    for (let i = period; i < data.length; i++) {
        emaValues[i] = (data[i] - emaValues[i - 1]) * multiplier + emaValues[i - 1];
    }
    return emaValues;
}

/**
 * Hareketli Ortalama Yakınsama Iraksama (MACD) hesaplar.
 * @param {Array<number>} closes Kapanış fiyatları dizisi
 * @param {number} fastPeriod Hızlı EMA periyodu (varsayılan 12)
 * @param {number} slowPeriod Yavaş EMA periyodu (varsayılan 26)
 * @param {number} signalPeriod Sinyal çizgisi EMA periyodu (varsayılan 9)
 * @returns {Object} MACD çizgisi, sinyal çizgisi ve histogram değerleri dizileri
 */
function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const macdLine = new Array(closes.length).fill(null);
    const signalLine = new Array(closes.length).fill(null);
    const histogram = new Array(closes.length).fill(null);

    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);

    if (!fastEMA || !slowEMA || fastEMA.length === 0 || slowEMA.length === 0) {
        return { macdLine, signalLine, histogram };
    }

    for (let i = slowPeriod - 1; i < closes.length; i++) {
        if (fastEMA[i] !== null && slowEMA[i] !== null) {
            macdLine[i] = fastEMA[i] - slowEMA[i];
        }
    }

    const macdDataForSignal = macdLine.filter(val => val !== null);
    if (macdDataForSignal.length < signalPeriod) {
        return { macdLine, signalLine, histogram };
    }

    const signalEMA = calculateEMA(macdDataForSignal, signalPeriod);
    
    let signalIndex = 0;
    for (let i = slowPeriod - 1; i < closes.length; i++) {
        if (macdLine[i] !== null) {
            if (signalIndex < signalEMA.length && signalEMA[signalIndex] !== null) {
                signalLine[i] = signalEMA[signalIndex];
                histogram[i] = macdLine[i] - signalLine[i];
            }
            signalIndex++;
        }
    }

    return { macdLine, signalLine, histogram };
}

/**
 * Bollinger Bantları (BB) hesaplar.
 * @param {Array<number>} closes Kapanış fiyatları dizisi
 * @param {number} period BB periyodu (varsayılan 20)
 * @param {number} stdDev Standart sapma katsayısı (varsayılan 2)
 * @returns {Object} Orta bant, üst bant ve alt bant değerleri dizileri
 */
function calculateBollingerBands(closes, period = 20, stdDev = 2) {
    const middleBand = calculateSMA(closes, period);
    const upperBand = new Array(closes.length).fill(null);
    const lowerBand = new Array(closes.length).fill(null);

    if (!middleBand || middleBand.length === 0) {
        return { middleBand, upperBand, lowerBand };
    }

    for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = middleBand[i];
        
        // Standart sapma hesaplaması
        const sumOfSquares = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const standardDeviation = Math.sqrt(sumOfSquares / period);

        if (middleBand[i] !== null) {
            upperBand[i] = middleBand[i] + (standardDeviation * stdDev);
            lowerBand[i] = middleBand[i] - (standardDeviation * stdDev);
        }
    }
    return { middleBand, upperBand, lowerBand };
}

/**
 * Stokastik Osilatör hesaplar.
 * @param {Array<Object>} klines Mum verileri (her obje {high, low, close} içermeli)
 * @param {number} kPeriod %K periyodu (varsayılan 14)
 * @param {number} dPeriod %D periyodu (varsayılan 3)
 * @returns {Object} %K ve %D değerleri dizileri
 */
function calculateStochasticOscillator(klines, kPeriod = 14, dPeriod = 3) {
    const kValues = new Array(klines.length).fill(null);
    const dValues = new Array(klines.length).fill(null);

    if (!klines || klines.length < kPeriod) {
        return { kValues, dValues };
    }

    for (let i = kPeriod - 1; i < klines.length; i++) {
        const periodHighs = klines.slice(i - kPeriod + 1, i + 1).map(k => k.high);
        const periodLows = klines.slice(i - kPeriod + 1, i + 1).map(k => k.low);
        
        const highestHigh = Math.max(...periodHighs);
        const lowestLow = Math.min(...periodLows);
        const currentClose = klines[i].close;

        if (highestHigh === lowestLow) { // Sıfıra bölme hatasını önle
            kValues[i] = 0; // Veya bir önceki değeri koru, piyasa durumuna bağlı
        } else {
            kValues[i] = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        }
    }

    // %D çizgisini hesaplamak için %K değerlerinin SMA'sını kullanırız
    // %K değerleri null olabileceği için filtrelememiz gerekir
    const filteredKValues = kValues.filter(val => val !== null);
    if (filteredKValues.length >= dPeriod) {
        const dSMA = calculateSMA(filteredKValues, dPeriod);
        let dIndex = 0;
        for (let i = kPeriod - 1; i < klines.length; i++) {
            if (kValues[i] !== null) {
                if (dIndex < dSMA.length && dSMA[dIndex] !== null) {
                    dValues[i] = dSMA[dIndex];
                }
                dIndex++;
            }
        }
    }

    return { kValues, dValues };
}


/**
 * Ortalama Gerçek Aralık (ATR) hesaplar.
 * @param {Array<Object>} klines Mum verileri (her obje {high, low, close, prevClose} içermeli)
 * @param {number} period ATR periyodu (varsayılan 14)
 * @returns {Array<number | null>} Hesaplanan ATR değerleri dizisi
 */
function calculateATR(klines, period = 14) {
    const atrValues = new Array(klines.length).fill(null);
    if (!klines || klines.length < period) {
        return atrValues;
    }

    const trueRanges = [];
    for (let i = 0; i < klines.length; i++) {
        const high = klines[i].high;
        const low = klines[i].low;
        const prevClose = i > 0 ? klines[i-1].close : klines[0].close; // İlk mum için önceki kapanış yok

        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);
        trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // İlk ATR, ilk 'period' True Range'in SMA'sıdır
    const initialATRSum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    atrValues[period - 1] = initialATRSum / period;

    // Sonraki ATR'ler EMA gibi hesaplanır
    for (let i = period; i < klines.length; i++) {
        atrValues[i] = (atrValues[i - 1] * (period - 1) + trueRanges[i]) / period;
    }

    return atrValues;
}

/**
 * On-Balance Volume (OBV) hesaplar.
 * @param {Array<number>} closes Kapanış fiyatları dizisi
 * @param {Array<number>} volumes Hacim dizisi
 * @returns {Array<number | null>} Hesaplanan OBV değerleri dizisi
 */
function calculateOBV(closes, volumes) {
    const obvValues = new Array(closes.length).fill(null);
    if (!closes || !volumes || closes.length !== volumes.length || closes.length === 0) {
        return obvValues;
    }

    obvValues[0] = volumes[0]; // İlk OBV değeri ilk hacme eşittir

    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) {
            obvValues[i] = obvValues[i - 1] + volumes[i]; // Fiyat artarsa hacmi ekle
        } else if (closes[i] < closes[i - 1]) {
            obvValues[i] = obvValues[i - 1] - volumes[i]; // Fiyat düşerse hacmi çıkar
        } else {
            obvValues[i] = obvValues[i - 1]; // Fiyat değişmezse aynı kal
        }
    }
    return obvValues;
}


// Tüm hesaplama fonksiyonlarını dışarıya aktarıyoruz
module.exports = {
    calculateRSI,
    calculateSMA,
    calculateEMA,
    calculateMACD,
    calculateBollingerBands,
    calculateStochasticOscillator,
    calculateATR,
    calculateOBV
};
