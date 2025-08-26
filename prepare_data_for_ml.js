// Gerekli modülleri içeri aktarıyoruz
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse'); // CSV okuma/yazma için (npm install papaparse ile yüklenmeli)
const { 
    calculateRSI, 
    calculateSMA, 
    calculateEMA, 
    calculateMACD, 
    calculateBollingerBands, 
    calculateStochasticOscillator, 
    calculateATR, 
    calculateOBV 
} = require('./utils/indicators'); // İndikatör hesaplama fonksiyonlarımız

// --- Konfigürasyon Ayarları ---
const INPUT_CSV_FILE = 'bitcoin_1y_1h_data.csv'; // İndirdiğiniz 1 yıllık veri dosyası
const OUTPUT_FEATURES_FILE = 'ml_features.csv'; // Özelliklerin kaydedileceği dosya
const OUTPUT_TARGETS_FILE = 'ml_targets.csv';   // Hedeflerin kaydedileceği dosya

const LAG_COUNT = 4; // Son 5 mumu kullanacağız (şimdiki mum + 4 önceki)
const MIN_CHANGE_PERCENT_FOR_DIRECTION = 0.0005; // %0.05'ten az değişim olursa atla (YATAY'ı elemek için)

// İndikatör periyotları (server.js'teki ile aynı olmalı)
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

/**
 * CSV dosyasını okur ve mum verilerini ayrıştırır.
 * @param {string} filePath CSV dosyasının yolu
 * @returns {Promise<Array<Object>>} Ayrıştırılmış mum verileri dizisi
 */
async function readCsvKlines(filePath) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        Papa.parse(fileContent, {
            header: true, // İlk satırı başlık olarak al
            dynamicTyping: true, // Sayıları ve boolean değerleri otomatik dönüştür
            skipEmptyLines: true,
            complete: function(results) {
                // Sadece ihtiyacımız olan sütunları al ve sayıya dönüştür
                const klines = results.data.map(row => ({
                    time: new Date(row['Open time']).getTime(), // Unix timestamp (milisaniye)
                    open: parseFloat(row['Open']),
                    high: parseFloat(row['High']),
                    low: parseFloat(row['Low']),
                    close: parseFloat(row['Close']),
                    volume: parseFloat(row['Volume'])
                }));
                resolve(klines);
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

/**
 * Tüm indikatörleri hesaplar ve sonuçları birleştirir.
 * @param {Array<Object>} klines Ham mum verileri (OHLCV objeleri)
 * @returns {Object} Her indikatör için hesaplanmış değerleri içeren obje
 */
function calculateAllIndicators(klines) {
    const closes = klines.map(k => k.close);
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const volumes = klines.map(k => k.volume);

    // Her bir indikatörü hesapla
    const rsi = calculateRSI(closes, RSI_PERIOD);
    const sma = calculateSMA(closes, SMA_PERIOD);
    const ema = calculateEMA(closes, EMA_PERIOD);
    const macd = calculateMACD(closes, MACD_FAST_PERIOD, MACD_SLOW_PERIOD, MACD_SIGNAL_PERIOD);
    const bollingerBands = calculateBollingerBands(closes, BB_PERIOD, BB_STD_DEV);
    const stochastic = calculateStochasticOscillator(klines, STOCH_K_PERIOD, STOCH_D_PERIOD); // Stochastic klines objesi bekler
    const atr = calculateATR(klines, ATR_PERIOD); // ATR klines objesi bekler
    const obv = calculateOBV(closes, volumes);

    return { rsi, sma, ema, macd, bollingerBands, stochastic, atr, obv };
}

/**
 * Özellikleri (X) ve Hedefleri (y) oluşturur.
 * @param {Array<Object>} klines Ham mum verileri
 * @param {Object} indicators Hesaplanan indikatör değerleri
 * @returns {Object} { features: Array<Array<number>>, targets: Array<number> }
 */
function createFeaturesAndTargets(klines, indicators) {
    const features = []; // Modelin girdileri (X)
    const targets = [];   // Modelin çıktıları (y)

    // En uzun indikatör periyodu ve lag sayısını dikkate alarak başlangıç indeksi belirle
    const maxIndicatorPeriod = Math.max(
        RSI_PERIOD, SMA_PERIOD, EMA_PERIOD, MACD_SLOW_PERIOD, BB_PERIOD, 
        STOCH_K_PERIOD, ATR_PERIOD
    );
    const startIndex = maxIndicatorPeriod + LAG_COUNT; 

    // Her mum için özellik ve hedef oluştur
    // Döngü, son mumun bir sonraki hedefi olduğu için klines.length - 1'e kadar gider.
    // Bu, her zaman bir sonraki mumu (nextCandle) kontrol edebilmemizi sağlar.
    for (let i = startIndex; i < klines.length - 1; i++) { 
        const currentCandle = klines[i];
        const nextCandle = klines[i + 1]; // Tahmin etmeye çalıştığımız mum

        // --- Hedef Değişkeni (Target) Tanımı ---
        const priceChange = (nextCandle.close - currentCandle.close) / currentCandle.close;
        let targetDirection;

        // YATAY'ı atlama mantığı burada işleniyor
        if (Math.abs(priceChange) < MIN_CHANGE_PERCENT_FOR_DIRECTION) {
            // Eğer değişim yüzde eşiğinden küçükse, bu örneği atla
            continue; 
        } else if (priceChange > 0) {
            targetDirection = 1; // YUKARI
        } else { // priceChange < 0
            targetDirection = 0; // AŞAĞI
        }

        // --- Özellikler (Features) Oluşturma ---
        const featureRow = [];

        // Fiyat Türevleri (Yüzdesel Değişimler)
        featureRow.push((currentCandle.close - klines[i-1].close) / klines[i-1].close);
        featureRow.push((currentCandle.high - currentCandle.low) / currentCandle.close);
        featureRow.push(currentCandle.volume / 1000000); 

        // İndikatör Değerleri ve Gecikmeli Özellikler (Lagged Features)
        for (let j = 0; j <= LAG_COUNT; j++) { 
            const candleIndex = i - j;

            // Null kontrolü ekleyelim, indikatörler başlangıçta null olabilir
            featureRow.push(indicators.rsi[candleIndex] !== null ? indicators.rsi[candleIndex] : 0);
            featureRow.push(indicators.sma[candleIndex] !== null ? indicators.sma[candleIndex] : 0);
            featureRow.push(indicators.ema[candleIndex] !== null ? indicators.ema[candleIndex] : 0);
            
            // MACD için null kontrolü
            featureRow.push(indicators.macd.macdLine[candleIndex] !== null ? indicators.macd.macdLine[candleIndex] : 0);
            featureRow.push(indicators.macd.signalLine[candleIndex] !== null ? indicators.macd.signalLine[candleIndex] : 0);
            featureRow.push(indicators.macd.histogram[candleIndex] !== null ? indicators.macd.histogram[candleIndex] : 0);

            // Bollinger Bantları için null kontrolü
            featureRow.push(indicators.bollingerBands.middleBand[candleIndex] !== null ? indicators.bollingerBands.middleBand[candleIndex] : 0);
            featureRow.push(indicators.bollingerBands.upperBand[candleIndex] !== null ? indicators.bollingerBands.upperBand[candleIndex] : 0);
            featureRow.push(indicators.bollingerBands.lowerBand[candleIndex] !== null ? indicators.bollingerBands.lowerBand[candleIndex] : 0);

            // Stokastik için null kontrolü
            featureRow.push(indicators.stochastic.kValues[candleIndex] !== null ? indicators.stochastic.kValues[candleIndex] : 0);
            featureRow.push(indicators.stochastic.dValues[candleIndex] !== null ? indicators.stochastic.dValues[candleIndex] : 0);

            // ATR
            featureRow.push(indicators.atr[candleIndex] !== null ? indicators.atr[candleIndex] : 0);

            // OBV
            featureRow.push(indicators.obv[candleIndex] !== null ? indicators.obv[candleIndex] : 0);
        }

        // Sadece geçerli bir hedefimiz varsa özelliği ve hedefi ekle
        features.push(featureRow);
        targets.push(targetDirection);
    }

    return { features, targets };
}

/**
 * Özellikleri Min-Max ölçeklemesi ile 0-1 aralığına normalize eder.
 * @param {Array<Array<number>>} features Ham özellik dizisi
 * @returns {Array<Array<number>>} Normalize edilmiş özellik dizisi
 */
function normalizeFeatures(features) {
    if (features.length === 0) return [];

    // Her bir özellik için min ve max değerlerini bul
    const numFeatures = features[0].length;
    const minVals = new Array(numFeatures).fill(Infinity);
    const maxVals = new Array(numFeatures).fill(-Infinity);

    for (const row of features) {
        for (let j = 0; j < numFeatures; j++) {
            if (row[j] < minVals[j]) minVals[j] = row[j];
            if (row[j] > maxVals[j]) maxVals[j] = row[j];
        }
    }

    // Normalize edilmiş özellikleri oluştur
    const normalizedFeatures = features.map(row => {
        return row.map((val, j) => {
            const range = maxVals[j] - minVals[j];
            if (range === 0) return 0; // Bölme sıfır hatasını önle
            return (val - minVals[j]) / range;
        });
    });

    return normalizedFeatures;
}

/**
 * Özellikleri ve hedefleri CSV dosyalarına kaydeder.
 * @param {Array<Array<number>>} features Özellikler dizisi
 * @param {Array<number>} targets Hedefler dizisi
 * @param {string} featuresFileName Özellikler CSV dosya adı
 * @param {string} targetsFileName Hedefler CSV dosya adı
 */
async function saveDataToCsv(features, targets, featuresFileName, targetsFileName) {
    // Özellikler için başlıkları oluştur
    const featureHeaders = [];
    const indicatorNames = ['RSI', 'SMA', 'EMA', 'MACD_Line', 'MACD_Signal', 'MACD_Hist', 'BB_Middle', 'BB_Upper', 'BB_Lower', 'Stoch_K', 'Stoch_D', 'ATR', 'OBV'];
    
    // Fiyat türevleri için başlıklar
    featureHeaders.push('Price_Change_Percent');
    featureHeaders.push('High_Low_Diff_Normalized');
    featureHeaders.push('Volume_Normalized');

    for (let j = 0; j <= LAG_COUNT; j++) {
        indicatorNames.forEach(name => {
            featureHeaders.push(`${name}_Lag_${j}`);
        });
    }

    // Özellikleri CSV'ye kaydet
    const featuresCsvContent = Papa.unparse(features, { header: false});
    fs.writeFileSync(featuresFileName, featuresCsvContent, 'utf8');
    console.log(`Özellikler '${featuresFileName}' dosyasına kaydedildi.`);

    // Hedefleri CSV'ye kaydet
    const targetsCsvContent = Papa.unparse(targets.map(t => ({ target: t })), { header: false });
    fs.writeFileSync(targetsFileName, targetsCsvContent, 'utf8');
    console.log(`Hedefler '${targetsFileName}' dosyasına kaydedildi.`);
}


// --- Ana Çalışma Akışı ---
(async () => {
    console.log('Makine öğrenimi için veri hazırlama başlatılıyor...');

    // 1. Veriyi yükle
    const klines = await readCsvKlines(path.join(__dirname, INPUT_CSV_FILE));
    console.log(`Toplam ${klines.length} adet mum verisi yüklendi.`);

    // 2. Tüm indikatörleri hesapla
    const indicators = calculateAllIndicators(klines);
    console.log('Tüm indikatörler hesaplandı.');

    // 3. Özellikleri ve hedefleri oluştur
    let { features, targets } = createFeaturesAndTargets(klines, indicators);
    console.log(`Toplam ${features.length} adet özellik-hedef çifti oluşturuldu.`);

    // 4. Özellikleri normalize et
    const normalizedFeatures = normalizeFeatures(features);
    console.log('Özellikler normalize edildi.');

    // 5. Hazırlanmış veriyi CSV dosyalarına kaydet
    await saveDataToCsv(normalizedFeatures, targets, OUTPUT_FEATURES_FILE, OUTPUT_TARGETS_FILE);

    console.log('Veri hazırlama tamamlandı.');
})();
