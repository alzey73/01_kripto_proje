// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    // HTML elementlerine referansları al
    const currentPriceSpan = document.getElementById('current-price');
    const currentRsiSpan = document.getElementById('current-rsi');
    const toggleRSICheckbox = document.getElementById('toggleRSI'); // Yeni checkbox
    const combinedChartCtx = document.getElementById('combinedChart').getContext('2d'); // Tek canvas

    let combinedChart; // Birleşik grafik nesnesi

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
                const rsiDataPoints = data.historicalRSI || []; // historicalRSI gelmiyorsa boş dizi
                const rsiLabels = labels; // RSI için de aynı zaman etiketlerini kullanıyoruz

                // RSI eşik çizgileri için veri setleri
                const rsi30Line = Array(rsiLabels.length).fill(30);
                const rsi70Line = Array(rsiLabels.length).fill(70);

                // Checkbox'ın o anki durumunu al
                const isRsiVisible = toggleRSICheckbox.checked;

                if (combinedChart) {
                    // Grafik zaten varsa veriyi güncelle
                    combinedChart.data.labels = labels;
                    combinedChart.data.datasets[0].data = prices; // Fiyat verisi
                    combinedChart.data.datasets[1].data = rsiDataPoints; // RSI verisi
                    combinedChart.data.datasets[2].data = rsi30Line; // RSI 30 çizgisi
                    combinedChart.data.datasets[3].data = rsi70Line; // RSI 70 çizgisi
                    
                    // Fiyat ekseni min/max güncellemesi
                    combinedChart.options.scales.priceY.min = yMin;
                    combinedChart.options.scales.priceY.max = yMax;

                    // RSI ile ilgili veri setlerinin görünürlüğünü güncelle
                    combinedChart.data.datasets[1].hidden = !isRsiVisible; // RSI çizgisi
                    combinedChart.data.datasets[2].hidden = !isRsiVisible; // 30 çizgisi
                    combinedChart.data.datasets[3].hidden = !isRsiVisible; // 70 çizgisi
                    
                    // RSI Y ekseninin görünürlüğünü güncelle
                    combinedChart.options.scales.rsiY.display = isRsiVisible;

                    combinedChart.update();
                } else {
                    // Grafik ilk kez oluşturuluyorsa
                    combinedChart = new Chart(combinedChartCtx, {
                        type: 'line', // Ana tip çizgi grafik
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'BTCUSDT Kapanış Fiyatı',
                                data: prices,
                                borderColor: '#53bf9d',
                                backgroundColor: 'rgba(83, 191, 157, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1,
                                yAxisID: 'priceY' // Sol Y ekseni (fiyat)
                            },
                            {
                                label: 'RSI Değeri',
                                data: rsiDataPoints,
                                borderColor: '#ffc107', // Sarımsı renk
                                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                                borderWidth: 2,
                                fill: false, 
                                tension: 0.1,
                                yAxisID: 'rsiY', // Sağ Y ekseni (RSI)
                                hidden: !isRsiVisible // Başlangıçta checkbox durumuna göre gizle/göster
                            },
                            { // RSI 30 eşik çizgisi
                                label: 'RSI Alım Eşiği (30)',
                                data: rsi30Line,
                                borderColor: 'rgba(0, 255, 0, 0.7)', // Yeşil
                                borderWidth: 1,
                                borderDash: [5, 5], // Kesikli çizgi
                                fill: false,
                                pointRadius: 0, // Noktaları gösterme
                                yAxisID: 'rsiY',
                                hidden: !isRsiVisible
                            },
                            { // RSI 70 eşik çizgisi
                                label: 'RSI Satım Eşiği (70)',
                                data: rsi70Line,
                                borderColor: 'rgba(255, 0, 0, 0.7)', // Kırmızı
                                borderWidth: 1,
                                borderDash: [5, 5],
                                fill: false,
                                pointRadius: 0,
                                yAxisID: 'rsiY',
                                hidden: !isRsiVisible
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true, 
                            scales: {
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
                                },
                                rsiY: { // Sağ Y ekseni (RSI)
                                    type: 'linear', 
                                    position: 'right',
                                    min: 0,
                                    max: 100,
                                    title: { display: true, text: 'RSI Değeri', color: '#e0e0e0' },
                                    ticks: { color: '#e0e0e0' },
                                    grid: {
                                        drawOnChartArea: false, // Sadece eksen üzerinde ızgara çizgisi olsun
                                        color: 'rgba(255, 255, 255, 0.1)'
                                    },
                                    display: isRsiVisible // Başlangıçta checkbox durumuna göre ekseni gizle/göster
                                }
                            },
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

    // RSI görünürlüğünü kontrol eden checkbox için olay dinleyici
    toggleRSICheckbox.addEventListener('change', () => {
        if (combinedChart) {
            const isRsiVisible = toggleRSICheckbox.checked;
            // RSI veri setlerinin görünürlüğünü ayarla (index 1, 2, 3)
            combinedChart.data.datasets[1].hidden = !isRsiVisible; // RSI çizgisi
            combinedChart.data.datasets[2].hidden = !isRsiVisible; // 30 çizgisi
            combinedChart.data.datasets[3].hidden = !isRsiVisible; // 70 çizgisi
            
            // RSI Y ekseninin görünürlüğünü ayarla
            combinedChart.options.scales.rsiY.display = isRsiVisible;

            combinedChart.update(); // Grafiği güncelle
        }
    });

    // Verileri ilk yüklendiğinde çek
    fetchData();

    // Verileri her 15 dakikada bir güncelle
    setInterval(fetchData, 15 * 60 * 1000); 
});
