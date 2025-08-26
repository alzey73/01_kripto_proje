// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    // HTML elementlerine referansları al
    const currentPriceSpan = document.getElementById('current-price');
    const currentRsiSpan = document.getElementById('current-rsi');
    const combinedChartCtx = document.getElementById('combinedChart').getContext('2d'); 

    // İndikatör onay kutularına referansları al
    const toggleRSI = document.getElementById('toggleRSI');
    const toggleSMA = document.getElementById('toggleSMA');
    const toggleEMA = document.getElementById('toggleEMA');
    const toggleMACD = document.getElementById('toggleMACD');
    const toggleBB = document.getElementById('toggleBB');
    const toggleStoch = document.getElementById('toggleStoch');
    const toggleATR = document.getElementById('toggleATR');
    const toggleOBV = document.getElementById('toggleOBV');
    const indicatorCommentsDiv = document.getElementById('indicator-comments');

    // Yeni tahmin elementleri
    const mlPredictionSpan = document.getElementById('ml-prediction'); 
    const lastPredictionResultSpan = document.getElementById('last-prediction-result');
    const accuracyRateSpan = document.getElementById('accuracy-rate');

    let combinedChart; 

    // İndikatörlerin varsayılan renkleri
    const indicatorColors = {
        rsi: '#ffc107', 
        sma: '#17a2b8', 
        ema: '#28a745', 
        macdLine: '#dc3545', 
        signalLine: '#6f42c1', 
        histogramPositive: 'rgba(40, 167, 69, 0.5)', 
        histogramNegative: 'rgba(220, 53, 69, 0.5)', 
        bbMiddle: '#fd7e14', 
        bbUpper: '#6c757d', 
        bbLower: '#6c757d', 
        stochK: '#007bff', 
        stochD: '#6c757d', 
        atr: '#ffc107', 
        obv: '#17a2b8', 
        buyLine: 'rgba(0, 255, 0, 0.7)', 
        sellLine: 'rgba(255, 0, 0, 0.7)' 
    };

    // --- Yorum Üretme Fonksiyonu ---
    function generateIndicatorComments(data) {
        const comments = [];
        const currentPrice = data.currentPrice;

        // RSI Yorumu
        if (data.rsi !== null) {
            const rsi = data.rsi;
            comments.push(`<strong>RSI (${rsi.toFixed(2)}):</strong>`);
            if (rsi < 30) {
                comments.push(`Aşırı satım bölgesinde. Varlık potansiyel olarak değerinin altında ve bir yükseliş beklenebilir.`);
            } else if (rsi > 70) {
                comments.push(`Aşırı alım bölgesinde. Varlık potansiyel olarak değerinin üzerinde ve bir düşüş beklenebilir.`);
            } else {
                comments.push(`Nötr bölgede. Trendin devamı veya belirsizlik hakim.`);
            }
        }

        // SMA Yorumu (Son SMA değeri ve fiyat ilişkisi)
        if (data.sma && data.sma.length > 0) {
            const lastSMA = data.sma[data.sma.length - 1];
            if (lastSMA !== null) {
                comments.push(`<strong>SMA (${lastSMA.toFixed(2)}):</strong>`);
                if (currentPrice > lastSMA) {
                    comments.push(`Fiyat, SMA'nın üzerinde. Yükseliş trendi devam ediyor veya güçleniyor.`);
                } else {
                    comments.push(`Fiyat, SMA'nın altında. Düşüş trendi devam ediyor veya güçleniyor.`);
                }
            }
        }

        // EMA Yorumu (Son EMA değeri ve fiyat ilişkisi)
        if (data.ema && data.ema.length > 0) {
            const lastEMA = data.ema[data.ema.length - 1];
            if (lastEMA !== null) {
                comments.push(`<strong>EMA (${lastEMA.toFixed(2)}):</strong>`);
                if (currentPrice > lastEMA) {
                    comments.push(`Fiyat, EMA'nın üzerinde. Yükseliş trendi devam ediyor veya güçleniyor.`);
                } else {
                    comments.push(`Fiyat, EMA'nın altında. Düşüş trendi devam ediyor veya güçleniyor.`);
                }
            }
        }

        // MACD Yorumu (Kesişimler ve Histogram)
        if (data.macd && data.macd.macdLine && data.macd.macdLine.length > 0) {
            const lastMACD = data.macd.macdLine[data.macd.macdLine.length - 1];
            const lastSignal = data.macd.signalLine[data.macd.signalLine.length - 1];
            const lastHistogram = data.macd.histogram[data.macd.histogram.length - 1];

            if (lastMACD !== null && lastSignal !== null && lastHistogram !== null) {
                comments.push(`<strong>MACD:</strong>`);
                if (data.macd.macdLine.length > 1 && data.macd.signalLine.length > 1) {
                    const prevMACD = data.macd.macdLine[data.macd.macdLine.length - 2];
                    const prevSignal = data.macd.signalLine[data.macd.signalLine.length - 2];

                    if (lastMACD > lastSignal && prevMACD <= prevSignal) {
                        comments.push(`MACD çizgisi sinyal çizgisini yukarı kesti (Bullish Crossover). Yükseliş momentumu başlıyor olabilir.`);
                    } else if (lastMACD < lastSignal && prevMACD >= prevSignal) {
                        comments.push(`MACD çizgisi sinyal çizgisini aşağı kesti (Bearish Crossover). Düşüş momentumu başlıyor olabilir.`);
                    } else if (lastMACD > lastSignal) {
                        comments.push(`MACD çizgisi sinyal çizgisinin üzerinde. Yükseliş momentumu hakim.`);
                    } else {
                        comments.push(`MACD çizgisi sinyal çizgisinin altında. Düşüş momentumu hakim.`);
                    }
                } else { 
                    if (lastMACD > lastSignal) {
                        comments.push(`MACD çizgisi sinyal çizgisinin üzerinde. Yükseliş momentumu hakim.`);
                    } else {
                        comments.push(`MACD çizgisi sinyal çizgisinin altında. Düşüş momentumu hakim.`);
                    }
                }
                
                if (lastHistogram > 0) {
                    comments.push(`Histogram sıfır çizgisinin üzerinde (${lastHistogram.toFixed(2)}). Yükseliş momentumu güçleniyor.`);
                } else {
                    comments.push(`Histogram sıfır çizgisinin altında (${lastHistogram.toFixed(2)}). Düşüş momentumu güçleniyor.`);
                }
            }
        }

        // Bollinger Bantları Yorumu
        if (data.bollingerBands && data.bollingerBands.middleBand && data.bollingerBands.middleBand.length > 0) {
            const lastUpper = data.bollingerBands.upperBand[data.bollingerBands.upperBand.length - 1];
            const lastLower = data.bollingerBands.lowerBand[data.bollingerBands.lowerBand.length - 1];
            const bandWidth = lastUpper - lastLower; 

            if (lastUpper !== null && lastLower !== null) {
                comments.push(`<strong>Bollinger Bantları:</strong>`);
                if (currentPrice < lastLower) {
                    comments.push(`Fiyat alt bandın altında. Aşırı satım koşulları, fiyatın toparlanması beklenebilir.`);
                } else if (currentPrice > lastUpper) {
                    comments.push(`Fiyat üst bandın üzerinde. Aşırı alım koşulları, fiyatın düzeltme yapması beklenebilir.`);
                } else {
                    comments.push(`Fiyat bantlar içinde hareket ediyor. Mevcut trend devam ediyor.`);
                }

                if (bandWidth < (currentPrice * 0.01)) { 
                    comments.push(`Bantlar daralıyor. Volatilite düşüyor, büyük bir fiyat hareketine hazırlık olabilir.`);
                } else if (bandWidth > (currentPrice * 0.05)) { 
                    comments.push(`Bantlar genişliyor. Volatilite artıyor, trendin güçlendiğini gösterebilir.`);
                }
            }
        }

        // Stokastik Osilatör Yorumu
        if (data.stochastic && data.stochastic.kValues && data.stochastic.kValues.length > 0) {
            const lastK = data.stochastic.kValues[data.stochastic.kValues.length - 1];
            const lastD = data.stochastic.dValues[data.stochastic.dValues.length - 1];

            if (lastK !== null && lastD !== null) {
                comments.push(`<strong>Stokastik Osilatör (%K: ${lastK.toFixed(2)}, %D: ${lastD.toFixed(2)}):</strong>`);
                if (lastK < 20) {
                    comments.push(`Aşırı satım bölgesinde. Potansiyel bir yükseliş beklenebilir.`);
                } else if (lastK > 80) {
                    comments.push(`Aşırı alım bölgesinde. Potansiyel bir düşüş beklenebilir.`);
                }

                if (lastK > lastD && data.stochastic.kValues[data.stochastic.kValues.length - 2] <= data.stochastic.dValues[data.stochastic.dValues.length - 2]) {
                    comments.push(`%K çizgisi %D çizgisini yukarı kesti (Alım sinyali).`);
                } else if (lastK < lastD && data.stochastic.kValues[data.stochastic.kValues.length - 2] >= data.stochastic.dValues[data.stochastic.dValues.length - 2]) {
                    comments.push(`%K çizgisi %D çizgisini aşağı kesti (Satım sinyali).`);
                }
            }
        }

        // ATR Yorumu
        if (data.atr && data.atr.length > 0) {
            const lastATR = data.atr[data.atr.length - 1];
            if (lastATR !== null) {
                comments.push(`<strong>ATR (${lastATR.toFixed(2)}):</strong>`);
                if (lastATR > (currentPrice * 0.005)) { 
                    comments.push(`Yüksek volatilite. Fiyat hareketleri büyük olabilir.`);
                } else {
                    comments.push(`Düşük volatilite. Piyasa sakinleşiyor olabilir.`);
                }
            }
        }

        // OBV Yorumu
        if (data.obv && data.obv.length > 0) {
            const lastOBV = data.obv[data.obv.length - 1];
            const prevOBV = data.obv[data.obv.length - 2]; 

            if (lastOBV !== null && prevOBV !== null) {
                comments.push(`<strong>OBV:</strong>`);
                if (lastOBV > prevOBV && currentPrice > data.klines[data.klines.length - 2].close) {
                    comments.push(`OBV yükseliyor ve fiyat da yükseliyor. Yükseliş trendi hacimle destekleniyor.`);
                } else if (lastOBV < prevOBV && currentPrice < data.klines[data.klines.length - 2].close) {
                    comments.push(`OBV düşüyor ve fiyat da düşüyor. Düşüş trendi hacimle destekleniyor.`);
                } else if (lastOBV > prevOBV && currentPrice < data.klines[data.klines.length - 2].close) {
                    comments.push(`OBV yükseliyor ancak fiyat düşüyor (Boğa Uyumsuzluğu). Düşüş trendi zayıflıyor olabilir.`);
                } else if (lastOBV < prevOBV && currentPrice > data.klines[data.klines.length - 2].close) {
                    comments.push(`OBV düşüyor ancak fiyat yükseliyor (Ayı Uyumsuzluğu). Yükseliş trendi zayıflıyor olabilir.`);
                } else {
                    comments.push(`OBV ve fiyat arasında belirgin bir uyum veya uyumsuzluk yok.`);
                }
            }
        }

        indicatorCommentsDiv.innerHTML = ''; 
        if (comments.length === 0) {
            indicatorCommentsDiv.innerHTML = '<p>Yorumlanacak yeterli veri yok veya indikatörler aktif değil.</p>';
        } else {
            comments.forEach(comment => {
                const p = document.createElement('p');
                p.innerHTML = comment;
                indicatorCommentsDiv.appendChild(p);
            });
        }
    }

    // --- Tahmin Durumunu Okuma/Kaydetme (localStorage) ---
    function loadPredictionState() {
        const state = localStorage.getItem('predictionState');
        return state ? JSON.parse(state) : {
            lastPrediction: null, 
            predictedFromPrice: null, 
            totalPredictions: 0,
            correctPredictions: 0
        };
    }

    function savePredictionState(state) {
        localStorage.setItem('predictionState', JSON.stringify(state));
    }

    // --- Tahmini Doğrulama ve İstatistikleri Güncelleme ---
    function validateAndPredict(data) {
        let state = loadPredictionState();
        const currentPrice = data.currentPrice;
        // Son gelen mumdan önceki mumun kapanışı (yani tahmin ettiğimiz mumun gerçekleşen kapanışı)
        const actualClosedCandle = data.klines.length > 1 ? data.klines[data.klines.length - 2] : null; 
        const actualClosedPrice = actualClosedCandle ? actualClosedCandle.close : null;

        let lastPredictionResultText = '-';

        // Önceki tahmini doğrula
        if (state.lastPrediction && state.predictedFromPrice !== null && actualClosedPrice !== null) {
            state.totalPredictions++; 

            // Gerçek yönü belirle
            const priceChangeForValidation = (actualClosedPrice - state.predictedFromPrice) / state.predictedFromPrice;
            const MIN_CHANGE_PERCENT_FOR_DIRECTION_FRONTEND = 0.0005; // Backend ile aynı eşik

            const actualDirection = (priceChangeForValidation > MIN_CHANGE_PERCENT_FOR_DIRECTION_FRONTEND) ? 'YUKARI' :
                                    (priceChangeForValidation < -MIN_CHANGE_PERCENT_FOR_DIRECTION_FRONTEND) ? 'AŞAĞI' : 'YATAY';
            
            let isCorrect = false;
            // ML modelimiz YATAY tahmin etmediği için, sadece YUKARI/AŞAĞI tahminlerini doğrularız
            if (state.lastPrediction === 'YUKARI' && actualDirection === 'YUKARI') {
                isCorrect = true;
            } else if (state.lastPrediction === 'AŞAĞI' && actualDirection === 'AŞAĞI') {
                isCorrect = true;
            } else if (state.lastPrediction === 'YATAY' && actualDirection === 'YATAY') { 
                isCorrect = true; 
            }

            if (isCorrect) {
                state.correctPredictions++;
                lastPredictionResultText = `DOĞRU! (${state.lastPrediction} tahmin edildi, gerçek: ${actualDirection})`;
            } else {
                lastPredictionResultText = `YANLIŞ! (${state.lastPrediction} tahmin edildi, gerçek: ${actualDirection})`;
            }
            console.log(`Tahmin Doğrulama: ${lastPredictionResultText}`);
        }

        // Yeni tahmin yap (ML modelinden gelen tahmin)
        const newPrediction = data.nextCandlePrediction || 'BELİRSİZ'; 

        state.lastPrediction = newPrediction;
        state.predictedFromPrice = currentPrice; // Yeni tahminin yapıldığı anki fiyat

        savePredictionState(state); // Durumu kaydet

        // UI'yı güncelle
        mlPredictionSpan.textContent = newPrediction;
        lastPredictionResultSpan.textContent = lastPredictionResultText;
        accuracyRateSpan.textContent = state.totalPredictions > 0 ? 
            `${((state.correctPredictions / state.totalPredictions) * 100).toFixed(2)}% (${state.correctPredictions}/${state.totalPredictions})` : '0%';
    }

    async function fetchData() {
        try {
            const response = await fetch('/api/data'); 
            const data = await response.json();

            if (data.error) {
                console.error('API Hatası:', data.error); 
                return; 
            }

            console.log('API\'den gelen veriler:', data); 

            // Bilgi kartlarını güncelle
            currentPriceSpan.textContent = data.currentPrice ? data.currentPrice.toFixed(2) : '-';
            currentRsiSpan.textContent = data.rsi !== null ? data.rsi.toFixed(2) : '-';

            // Yorumları Oluştur ve Göster
            generateIndicatorComments(data);

            // Tahmin Yap ve Doğrula (ML modelinden gelen tahmin ile)
            validateAndPredict(data);
            
            // Grafik verilerini hazırla
            if (data.klines && data.klines.length > 0) {
                const labels = data.klines.map(k => new Date(k.time).toLocaleTimeString()); 
                const prices = data.klines.map(k => k.close); 

                const allHighs = data.klines.map(k => k.high);
                const allLows = data.klines.map(k => k.low);

                const minPrice = Math.min(...allLows);
                const maxPrice = Math.max(...allHighs);

                const priceRange = maxPrice - minPrice;
                let yMin, yMax;

                let dynamicPadding = priceRange * 0.05; 

                if (priceRange < (minPrice * 0.0005)) { 
                    dynamicPadding = minPrice * 0.0005; 
                } else if (dynamicPadding === 0) { 
                    dynamicPadding = minPrice * 0.0005; 
                }

                yMin = minPrice - dynamicPadding;
                yMax = maxPrice + dynamicPadding;

                if (yMin < 0) yMin = 0;

                const roundTo = 50; 
                yMin = Math.floor(yMin / roundTo) * roundTo;
                yMax = Math.ceil(yMax / roundTo) * roundTo;

                if (yMin === yMax) {
                    yMin -= roundTo;
                    yMax += roundTo;
                }

                // RSI verileri
                const rsiDataPoints = data.historicalRSI || []; 
                const rsiLabels = labels; 

                const rsi30Line = Array(rsiLabels.length).fill(30);
                const rsi70Line = Array(rsiLabels.length).fill(70);

                const isRsiVisible = toggleRSI.checked;

                // --- Tüm veri setlerini ve Y eksenlerini dinamik olarak oluştur ---
                const datasets = [{
                    label: 'BTCUSDT Kapanış Fiyatı',
                    data: prices,
                    borderColor: '#53bf9d',
                    backgroundColor: 'rgba(83, 191, 157, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'priceY' 
                }];

                const scales = {
                    x: {
                        type: 'category', 
                        title: { display: true, text: 'Zaman', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    priceY: { // Sol Y ekseni (Fiyat)
                        type: 'linear', 
                        position: 'left',
                        min: yMin, 
                        max: yMax, 
                        beginAtZero: false, 
                        title: { display: true, text: 'Fiyat ($)', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                };

                // --- RSI Veri Setleri ve Ekseni ---
                if (data.historicalRSI && data.historicalRSI.length > 0) {
                    datasets.push({
                        label: 'RSI Değeri',
                        data: data.historicalRSI,
                        borderColor: indicatorColors.rsi, 
                        backgroundColor: 'rgba(255, 193, 7, 0.2)',
                        borderWidth: 2,
                        fill: false, 
                        tension: 0.1,
                        yAxisID: 'rsiY',
                        hidden: !toggleRSI.checked 
                    });
                    datasets.push({ // RSI 30 eşik çizgisi
                        label: 'RSI Alım Eşiği (30)',
                        data: rsi30Line,
                        borderColor: indicatorColors.buyLine, 
                        borderWidth: 1,
                        borderDash: [5, 5], 
                        fill: false, pointRadius: 0,
                        yAxisID: 'rsiY',
                        hidden: !toggleRSI.checked
                    });
                    datasets.push({ // RSI 70 eşik çizgisi
                        label: 'RSI Satım Eşiği (70)',
                        data: rsi70Line,
                        borderColor: indicatorColors.sellLine, 
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false, pointRadius: 0,
                        yAxisID: 'rsiY',
                        hidden: !toggleRSI.checked
                    });
                    scales.rsiY = { // Sağ Y ekseni (RSI)
                        type: 'linear', 
                        position: 'right',
                        min: 0, max: 100,
                        title: { display: true, text: 'RSI Değeri', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        display: toggleRSI.checked 
                    };
                }

                // --- SMA Veri Seti ---
                if (data.sma && data.sma.length > 0) {
                    datasets.push({
                        label: `SMA (${data.sma.length})`, 
                        data: data.sma,
                        borderColor: indicatorColors.sma,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'priceY', 
                        hidden: !toggleSMA.checked
                    });
                }

                // --- EMA Veri Seti ---
                if (data.ema && data.ema.length > 0) {
                    datasets.push({
                        label: `EMA (${data.ema.length})`, 
                        data: data.ema,
                        borderColor: indicatorColors.ema,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'priceY', 
                        hidden: !toggleEMA.checked
                    });
                }

                // --- MACD Veri Setleri ve Ekseni ---
                if (data.macd && data.macd.macdLine && data.macd.macdLine.length > 0) {
                    datasets.push({
                        label: 'MACD Line',
                        data: data.macd.macdLine,
                        borderColor: indicatorColors.macdLine,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'macdY',
                        hidden: !toggleMACD.checked
                    });
                    datasets.push({
                        label: 'MACD Sinyal',
                        data: data.macd.signalLine,
                        borderColor: indicatorColors.signalLine,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'macdY',
                        hidden: !toggleMACD.checked
                    });
                    datasets.push({
                        label: 'MACD Histogram',
                        data: data.macd.histogram,
                        backgroundColor: ctx => {
                            const value = ctx.parsed.y;
                            return value > 0 ? indicatorColors.histogramPositive : indicatorColors.histogramNegative;
                        },
                        type: 'bar', 
                        yAxisID: 'macdY',
                        hidden: !toggleMACD.checked
                    });
                    scales.macdY = {
                        type: 'linear',
                        position: 'right', 
                        title: { display: true, text: 'MACD', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        display: toggleMACD.checked
                    };
                }

                // --- Bollinger Bantları Veri Setleri ---
                if (data.bollingerBands && data.bollingerBands.middleBand && data.bollingerBands.middleBand.length > 0) {
                    datasets.push({
                        label: 'BB Orta Bant',
                        data: data.bollingerBands.middleBand,
                        borderColor: indicatorColors.bbMiddle,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'priceY',
                        hidden: !toggleBB.checked
                    });
                    datasets.push({
                        label: 'BB Üst Bant',
                        data: data.bollingerBands.upperBand,
                        borderColor: indicatorColors.bbUpper,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'priceY',
                        hidden: !toggleBB.checked
                    });
                    datasets.push({
                        label: 'BB Alt Bant',
                        data: data.bollingerBands.lowerBand,
                        borderColor: indicatorColors.bbLower,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'priceY',
                        hidden: !toggleBB.checked
                    });
                }

                // --- Stokastik Osilatör Veri Setleri ve Ekseni ---
                if (data.stochastic && data.stochastic.kValues && data.stochastic.kValues.length > 0) {
                    datasets.push({
                        label: '%K Line',
                        data: data.stochastic.kValues,
                        borderColor: indicatorColors.stochK,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'stochY',
                        hidden: !toggleStoch.checked
                    });
                    datasets.push({
                        label: '%D Line',
                        data: data.stochastic.dValues,
                        borderColor: indicatorColors.stochD,
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'stochY',
                        hidden: !toggleStoch.checked
                    });
                    scales.stochY = {
                        type: 'linear',
                        position: 'right', 
                        title: { display: true, text: 'Stoch', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        display: toggleStoch.checked
                    };
                }

                // --- ATR Veri Seti ve Ekseni ---
                if (data.atr && data.atr.length > 0) {
                    datasets.push({
                        label: 'ATR',
                        data: data.atr,
                        borderColor: indicatorColors.atr,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'atrY',
                        hidden: !toggleATR.checked
                    });
                    scales.atrY = {
                        type: 'linear',
                        position: 'right', 
                        title: { display: true, text: 'ATR', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        display: toggleATR.checked
                    };
                }

                // --- OBV Veri Seti ve Ekseni ---
                if (data.obv && data.obv.length > 0) {
                    datasets.push({
                        label: 'OBV',
                        data: data.obv,
                        borderColor: indicatorColors.obv,
                        borderWidth: 1,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'obvY',
                        hidden: !toggleOBV.checked
                    });
                    scales.obvY = {
                        type: 'linear',
                        position: 'right', 
                        title: { display: true, text: 'OBV', color: '#e0e0e0' },
                        ticks: { color: '#e0e0e0' },
                        grid: { drawOnChartArea: false, color: 'rgba(255, 255, 255, 0.1)' },
                        display: toggleOBV.checked
                    };
                }

                // --- Grafiği Oluşturma veya Güncelleme ---
                if (combinedChart) {
                    combinedChart.data.labels = labels;
                    combinedChart.data.datasets = datasets;
                    combinedChart.options.scales = scales; 
                    combinedChart.update();
                } else {
                    combinedChart = new Chart(combinedChartCtx, {
                        type: 'line', 
                        data: {
                            labels: labels,
                            datasets: datasets 
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true, 
                            scales: scales, 
                            plugins: {
                                legend: {
                                    labels: { color: '#e0e0e0' }
                                }
                            }
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Veri çekme hatası:', error); 
        }
    }

    // --- İndikatör Görünürlüğünü Kontrol Eden Olay Dinleyicileri ---
    const indicatorCheckboxes = [
        toggleRSI, toggleSMA, toggleEMA, toggleMACD, toggleBB, toggleStoch, toggleATR, toggleOBV
    ];

    indicatorCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (combinedChart) {
                // Her bir veri setini kontrol et
                combinedChart.data.datasets.forEach(dataset => {
                    // Dataset'in etiketi checkbox etiketiyle eşleşiyorsa veya ilgiliyse
                    // Örneğin, RSI için RSI, RSI 30, RSI 70 çizgileri
                    // MACD için MACD Line, MACD Sinyal, MACD Histogram
                    if (dataset.label.includes(checkbox.id.replace('toggle', '')) || 
                        (checkbox.id === 'toggleMACD' && (dataset.label.includes('MACD Line') || dataset.label.includes('MACD Sinyal') || dataset.label.includes('MACD Histogram'))) ||
                        (checkbox.id === 'toggleBB' && (dataset.label.includes('BB Orta') || dataset.label.includes('BB Üst') || dataset.label.includes('BB Alt'))) ||
                        (checkbox.id === 'toggleStoch' && (dataset.label.includes('%K Line') || dataset.label.includes('%D Line')))
                        ) {
                        dataset.hidden = !checkbox.checked;
                    }
                });

                // İlgili Y eksenlerinin görünürlüğünü de güncelle
                if (checkbox.id === 'toggleRSI') combinedChart.options.scales.rsiY.display = checkbox.checked;
                if (checkbox.id === 'toggleMACD') combinedChart.options.scales.macdY.display = checkbox.checked;
                if (checkbox.id === 'toggleStoch') combinedChart.options.scales.stochY.display = checkbox.checked;
                if (checkbox.id === 'toggleATR') combinedChart.options.scales.atrY.display = checkbox.checked;
                if (checkbox.id === 'toggleOBV') combinedChart.options.scales.obvY.display = checkbox.checked;
                
                combinedChart.update(); 
            }
        });
    });


    // Verileri ilk yüklendiğinde çek
    fetchData();

    // Verileri her 15 dakikada bir güncelle
    setInterval(fetchData, 15 * 60 * 1000); 
});
