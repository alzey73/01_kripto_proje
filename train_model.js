// Gerekli modülleri içeri aktarıyoruz
const tf = require('@tensorflow/tfjs-node'); // TensorFlow.js
const fs = require('fs');                   // Dosya işlemleri
const path = require('path');               // Dosya yolları
const Papa = require('papaparse');          // CSV okuma

// --- Konfigürasyon Ayarları ---
const FEATURES_FILE = 'ml_features.csv'; // Özellikler dosyası
const TARGETS_FILE = 'ml_targets.csv';   // Hedefler dosyası
const MODEL_SAVE_PATH = 'file://./model'; // Modelin kaydedileceği yol

const TRAINING_SPLIT = 0.8; // Verinin %80'i eğitim için, %20'si test için
const EPOCHS = 50;          // Modelin tüm eğitim verisi üzerinde kaç kez geçeceği
const BATCH_SIZE = 32;      // Her eğitim adımında kaç örnek kullanılacağı

/**
 * CSV dosyasını okur ve veriyi dizi olarak döndürür.
 * @param {string} filePath CSV dosyasının yolu
 * @returns {Promise<Array<Array<number>>>} CSV verisi (sayı dizileri dizisi)
 */
async function readCsvData(filePath) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        Papa.parse(fileContent, {
            header: true, // İlk satırı başlık olarak al
            dynamicTyping: true, // Sayıları otomatik dönüştür
            skipEmptyLines: true,
            complete: function(results) {
                // Sadece değerleri al, başlıkları atla
                const data = results.data.map(row => Object.values(row));
                resolve(data);
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

/**
 * Modeli oluşturur ve eğitir.
 */
async function trainModel() {
    console.log('Veriler yükleniyor...');
    const featuresData = await readCsvData(FEATURES_FILE);
    const targetsData = await readCsvData(TARGETS_FILE);

    // Verilerin aynı sayıda örnek içerdiğinden emin ol
    if (featuresData.length !== targetsData.length) {
        console.error('Hata: Özellik ve hedef verileri farklı uzunlukta!');
        return;
    }

    if (featuresData.length === 0) {
        console.error('Hata: Eğitim için veri bulunamadı!');
        return;
    }

    // TensorFlow.js Tensor'larına dönüştür
    // featuresData: [örnek_sayısı, özellik_sayısı]
    // targetsData: [örnek_sayısı, 1] (tek hedef)
    const featuresTensor = tf.tensor2d(featuresData);
    const targetsTensor = tf.tensor2d(targetsData.map(t => [t[0]])); // Hedefleri 2D tensor yap (tek sütun)

    // Veriyi eğitim ve test setlerine ayır
    const numSamples = featuresTensor.shape[0];
    const numTrainingSamples = Math.floor(numSamples * TRAINING_SPLIT);

    const xTrain = featuresTensor.slice([0, 0], [numTrainingSamples, featuresTensor.shape[1]]);
    const yTrain = targetsTensor.slice([0, 0], [numTrainingSamples, 1]);
    const xTest = featuresTensor.slice([numTrainingSamples, 0], [numSamples - numTrainingSamples, featuresTensor.shape[1]]);
    const yTest = targetsTensor.slice([numTrainingSamples, 0], [numSamples - numTrainingSamples, 1]);

    console.log(`Eğitim verisi boyutu: ${xTrain.shape[0]} örnek, ${xTrain.shape[1]} özellik`);
    console.log(`Test verisi boyutu: ${xTest.shape[0]} örnek, ${xTest.shape[1]} özellik`);

    // --- Model Mimarisi Oluşturma ---
    // Sıralı (Sequential) bir model kullanıyoruz
    const model = tf.sequential();

    // İlk gizli katman: Giriş özelliklerinin sayısını otomatik alır
    model.add(tf.layers.dense({ 
        inputShape: [xTrain.shape[1]], // Giriş katmanının şekli (özellik sayısı)
        units: 64,                     // Bu katmandaki nöron sayısı
        activation: 'relu'             // Aktivasyon fonksiyonu (ReLU, yaygın ve etkilidir)
    }));

    // İkinci gizli katman
    model.add(tf.layers.dense({ 
        units: 32, 
        activation: 'relu' 
    }));

    // Çıkış katmanı: 2 sınıfımız olduğu için (YUKARI/AŞAĞI) 1 nöron kullanıyoruz
    // Sigmoid aktivasyonu 0 ile 1 arasında bir olasılık değeri verir.
    model.add(tf.layers.dense({ 
        units: 1, 
        activation: 'sigmoid' 
    }));

    // Modeli derle (Compile)
    // Optimizer: Ağırlıkları nasıl güncelleyeceğimizi belirler (Adam, popüler ve etkilidir)
    // Loss Function: Modelin ne kadar yanlış tahmin yaptığını ölçer (binaryClassification için binaryCrossentropy)
    // Metrics: Eğitim sırasında izlenecek performans ölçütleri (accuracy - doğruluk)
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy', // İki sınıflı sınıflandırma için
        metrics: ['accuracy']
    });

    console.log('Model eğitimi başlatılıyor...');
    // Modeli eğit
    await model.fit(xTrain, yTrain, {
        epochs: EPOCHS,
        batchSize: BATCH_SIZE,
        validationData: [xTest, yTest], // Her epoch sonunda test verisi üzerinde doğruluk ölçümü
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}/${EPOCHS}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`);
            }
        }
    });

    console.log('Model eğitimi tamamlandı.');

    // Modeli kaydet
    await model.save(MODEL_SAVE_PATH);
    console.log(`Model başarıyla '${MODEL_SAVE_PATH}' konumuna kaydedildi.`);

    // Modelin test verisi üzerindeki son değerlendirmesi
    const result = model.evaluate(xTest, yTest);
    console.log(`Test seti kaybı (Loss): ${result[0].dataSync()[0].toFixed(4)}`);
    console.log(`Test seti doğruluğu (Accuracy): ${result[1].dataSync()[0].toFixed(4)}`);
}

// Ana fonksiyonu çalıştır
trainModel();
