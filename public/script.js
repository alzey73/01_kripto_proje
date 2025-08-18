// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    // HTML elementlerine referansları al
    const currentPriceSpan = document.getElementById('current-price');
    const currentRsiSpan = document.getElementById('current-rsi');
    const combinedChartCtx = document.getElementById('combinedChart').getContext('2d'); // Tek canvas

    // İndikatör onay kutularına referansları al
    const toggleRSI = document.getElementById('toggleRSI');
    const toggleSMA = document.getElementById('toggleSMA');
    const toggleEMA = document.getElementById('toggleEMA');
    const toggleMACD = document.getElementById('toggleMACD');
    const toggleBB = document.getElementById('toggleBB');
    const toggleStoch = document.getElementById('toggleStoch');
    const toggleATR = document.getElementById('toggleATR');
    const toggleOBV = document.getElementById('toggleOBV');

    let combinedChart; // Birleşik grafik nesnesi

    // İndikatörlerin varsayılan renkleri
    const indicatorColors = {
        rsi: '#ffc107', // Sarı
        sma: '#17a2b8', // Mavi
        ema: '#28a745', // Yeşil
        macdLine: '#dc3545', // Kırmızı
        signalLine: '#6f42c1', // Mor
        histogramPositive: 'rgba(40, 167, 69, 0.5)', // Yeşil histogram
        histogramNegative: 'rgba(220, 53, 69, 0.5)', // Kırmızı histogram
        bbMiddle: '#fd7e14', // Turuncu
        bbUpper: '#6c757d', // Gri
        bbLower: '#6c757d', // Gri
        stochK: '#007bff', // Mavi
        stochD: '#6c757d', // Gri
        atr: '#ffc107', // Sarı
        obv: '#17a2b8', // Mavi
        buyLine: 'rgba(0, 255, 0, 0.7)', // Yeşil
        sellLine: 'rgba(255, 0, 0, 0.7)' // Kırmızı
    };

    // Verileri API'den çekme fonksiyonu
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

            // Grafik verilerini hazırla
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
                    data: Array(labels.length).fill(30),
                    borderColor: indicatorColors.buyLine, 
                    borderWidth: 1,
                    borderDash: [5, 5], 
                    fill: false, pointRadius: 0,
                    yAxisID: 'rsiY',
                    hidden: !toggleRSI.checked
                });
                datasets.push({ // RSI 70 eşik çizgisi
                    label: 'RSI Satım Eşiği (70)',
                    data: Array(labels.length).fill(70),
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
                    display: toggleRSI.checked // Başlangıçta checkbox durumuna göre ekseni gizle/göster
                };
            }

            // --- SMA Veri Seti ---
            if (data.sma && data.sma.length > 0) {
                datasets.push({
                    label: `SMA (${data.sma.length})`, // SMA periyodunu etikette göster
                    data: data.sma,
                    borderColor: indicatorColors.sma,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'priceY', // Fiyat eksenini kullanır
                    hidden: !toggleSMA.checked
                });
            }

            // --- EMA Veri Seti ---
            if (data.ema && data.ema.length > 0) {
                datasets.push({
                    label: `EMA (${data.ema.length})`, // EMA periyodunu etikette göster
                    data: data.ema,
                    borderColor: indicatorColors.ema,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'priceY', // Fiyat eksenini kullanır
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
                // MACD Histogram için özel tip (bar) ve eksen
                datasets.push({
                    label: 'MACD Histogram',
                    data: data.macd.histogram,
                    backgroundColor: ctx => {
                        const value = ctx.parsed.y;
                        return value > 0 ? indicatorColors.histogramPositive : indicatorColors.histogramNegative;
                    },
                    type: 'bar', // Bar tipi
                    yAxisID: 'macdY',
                    hidden: !toggleMACD.checked
                });
                scales.macdY = {
                    type: 'linear',
                    position: 'right', // Sağ tarafta ikinci eksen
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
                    position: 'right', // Sağ tarafta üçüncü eksen
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
                    position: 'right', // Sağ tarafta dördüncü eksen
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
                    position: 'right', // Sağ tarafta beşinci eksen
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
                combinedChart.options.scales = scales; // Ölçekleri de güncelle
                combinedChart.update();
            } else {
                combinedChart = new Chart(combinedChartCtx, {
                    type: 'line', 
                    data: {
                        labels: labels,
                        datasets: datasets // Dinamik olarak oluşturulan veri setleri
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true, 
                        scales: scales, // Dinamik olarak oluşturulan ölçekler
                        plugins: {
                            legend: {
                                labels: { color: '#e0e0e0' }
                            }
                        }
                    }
                });
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
                
                combinedChart.update(); // Grafiği güncelle
            }
        });
    });


    // Verileri ilk yüklendiğinde çek
    fetchData();

    // Verileri her 15 dakikada bir güncelle
    setInterval(fetchData, 15 * 60 * 1000); 
});
