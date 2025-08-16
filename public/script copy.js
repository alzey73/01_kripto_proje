// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    // HTML elementlerine referansları al
    const currentPriceSpan = document.getElementById('current-price');
    const currentRsiSpan = document.getElementById('current-rsi');
    const priceChartCtx = document.getElementById('priceChart').getContext('2d');
    const rsiChartCtx = document.getElementById('rsiChart').getContext('2d');

    let priceChart; // Fiyat grafiği nesnesi
    let rsiChart;   // RSI grafiği nesnesi

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

            // Fiyat grafiğini güncelle
            if (data.klines && data.klines.length > 0) {
                const labels = data.klines.map(k => new Date(k.time).toLocaleTimeString()); 
                const prices = data.klines.map(k => k.close); 

                const allHighs = data.klines.map(k => k.high);
                const allLows = data.klines.map(k => k.low);

                const minPrice = Math.min(...allLows);
                const maxPrice = Math.max(...allHighs);

                console.log('minPrice ',minPrice);
                console.log('maxPrice ',maxPrice);

                // --- GÜNCELLEME: Daha kararlı bir ölçeklendirme stratejisi ve yuvarlama ---
                const priceRange = maxPrice - minPrice;
                let yMin, yMax;

                // Dinamik bir tampon bölge (padding) belirleyelim.
                // Fiyat aralığının %5'i kadar bir padding kullanalım.
                let dynamicPadding = priceRange * 0.05; 
                
                // Eğer fiyat aralığı çok küçükse (örneğin, en düşük fiyatın %0.1'inden az ise),
                // sabit ve çok küçük bir padding kullanalım ki grafik sıkışık görünmesin.
                if (priceRange < (minPrice * 0.001)) { 
                    dynamicPadding = minPrice * 0.0005; // En düşük fiyatın %0.05'i kadar
                } else if (dynamicPadding === 0) { // Fiyat hiç değişmiyorsa (yatay çizgi)
                    dynamicPadding = minPrice * 0.0005; // Yine de küçük bir padding ver
                }

                yMin = minPrice - dynamicPadding;
                yMax = maxPrice + dynamicPadding;
                console.log('dynamicPadding ',dynamicPadding);
                // yMin'in asla negatif olmamasını sağlayalım
                if (yMin < 0) yMin = 0;

                // --- Y Ekseni değerlerini yuvarlama (daha stabil etiketler için) ---
                // Örneğin, fiyatları 50'nin katlarına yuvarlayalım.
                // Bu, eksen etiketlerinin sürekli değişmesini engeller ve daha temiz bir görünüm sağlar.
                const roundTo = 50; // Fiyatları 50'nin katlarına yuvarla (BTC fiyatları için uygun)
                yMin = Math.floor(yMin / roundTo) * roundTo;
                yMax = Math.ceil(yMax / roundTo) * roundTo;

                // Eğer yuvarlama sonrası min ve max aynı olursa, küçük bir aralık oluştur
                if (yMin === yMax) {
                    yMin -= roundTo;
                    yMax += roundTo;
                }
                // --- GÜNCELLEME SONU ---
                console.log('yMin ',yMin);
                    console.log('yMax ',yMax);
                if (priceChart) {
                    priceChart.data.labels = labels;
                    priceChart.data.datasets[0].data = prices;
                    priceChart.options.scales.y.min = yMin;
                    priceChart.options.scales.y.max = yMax;
                    priceChart.update();
                    
                    
                } else {
                    priceChart = new Chart(priceChartCtx, {
                        type: 'line', 
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'BTCUSDT Kapanış Fiyatı',
                                data: prices,
                                borderColor: '#53bf9d',
                                backgroundColor: 'rgba(83, 191, 157, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1
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
                                y: {
                                    min: yMin, 
                                    max: yMax, 
                                    beginAtZero: false, 
                                    title: { display: true, text: 'Fiyat ($)', color: '#e0e0e0' },
                                    ticks: { color: '#e0e0e0' },
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: '#e0e0e0' } }
                            }
                        }
                    });
                    console.log('yMin ',yMin);
                    console.log('yMax ',yMax);
                }
            }

            

            // RSI grafiğini güncelle (bu kısımda değişiklik yok, zaten 0-100 sabit ölçek)
            if (data.rsi !== null) {
                const rsiValue = data.rsi;
                const rsiLabels = data.klines.map(k => new Date(k.time).toLocaleTimeString());
                const rsiDataPoints = Array(rsiLabels.length).fill(rsiValue); 

                if (rsiChart) {
                    rsiChart.data.labels = rsiLabels;
                    rsiChart.data.datasets[0].data = rsiDataPoints;
                    rsiChart.update();
                } else {
                    rsiChart = new Chart(rsiChartCtx, {
                        type: 'line',
                        data: {
                            labels: rsiLabels,
                            datasets: [{
                                label: 'Son Hesaplanan RSI',
                                data: rsiDataPoints,
                                borderColor: '#ffc107', 
                                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1
                            },
                            { 
                                label: 'RSI Alım Eşiği (30)',
                                data: Array(rsiLabels.length).fill(30),
                                borderColor: 'rgba(0, 255, 0, 0.7)', 
                                borderWidth: 1,
                                borderDash: [5, 5], 
                                fill: false,
                                pointRadius: 0
                            },
                            { 
                                label: 'RSI Satım Eşiği (70)',
                                data: Array(rsiLabels.length).fill(70),
                                borderColor: 'rgba(255, 0, 0, 0.7)', 
                                borderWidth: 1,
                                borderDash: [5, 5],
                                fill: false,
                                pointRadius: 0
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
                                y: {
                                    title: { display: true, text: 'RSI Değeri', color: '#e0e0e0' },
                                    min: 0,
                                    max: 100, 
                                    ticks: { color: '#e0e0e0' },
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: '#e0e0e0' } }
                            }
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Veri çekme hatası:', error); 
        }
    }

    // Verileri ilk yüklendiğinde çek
    fetchData();

    // Verileri her 15 dakikada bir güncelle
    setInterval(fetchData, 15 * 60 * 1000); 
});
