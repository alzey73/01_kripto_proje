// Gerekli modülleri içeri aktarıyoruz
// const tf = require('@tensorflow/tfjs-node'); // TensorFlow.js'i şimdilik devre dışı bırakıyoruz
const path = require('path');               // Dosya yolları

// Modelin kaydedildiği yol (şimdilik kullanılmayacak)
const MODEL_PATH = 'file://' + path.join(__dirname, '..', 'tfjs_model', 'model.json'); 

let model = null; // Model yüklenmeyecek

/**
 * Eğitilmiş derin öğrenme modelini yükler.
 * Şimdilik model yüklemeyi devre dışı bırakıyoruz.
 */
async function loadModel() {
    console.warn('ML Modeli yükleme devre dışı bırakıldı. TensorFlow.js kurulum sorunu nedeniyle.');
    return null;
}

/**
 * Gelen özellikleri kullanarak bir sonraki mumun yönünü tahmin eder.
 * Şimdilik tahmin yapmayı devre dışı bırakıyoruz.
 * @param {Array<number>} features Modelin beklediği normalize edilmiş özellikler dizisi (tek örnek için)
 * @returns {Promise<string>} 'YUKARI', 'AŞAĞI' veya 'BELİRSİZ' tahmini
 */
async function predictNextCandleDirection(features) {
    console.warn('ML Tahmini devre dışı bırakıldı. TensorFlow.js kurulum sorunu nedeniyle.');
    return 'ML Devre Dışı'; // Tahmin yerine bu mesajı döndür
}

// Bu fonksiyonları diğer modüllerden erişilebilir yapmak için export ediyoruz.
module.exports = {
    loadModel,
    predictNextCandleDirection
};
