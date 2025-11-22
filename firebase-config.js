/**
 * Firebase Configuration and Initialization
 * @module firebase-config
 * @description Firebase servislerini yapılandıran ve başlatan modül
 * @version 1.0.0
 * @license MIT
 */

// Firebase modüllerini import et
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

/**
 * Firebase yapılandırma nesnesi
 * @constant {Object} firebaseConfig
 * @property {string} apiKey - Firebase API anahtarı
 * @property {string} authDomain - Kimlik doğrulama domaini
 * @property {string} databaseURL - Realtime Database URL
 * @property {string} projectId - Firebase proje ID'si
 * @property {string} storageBucket - Storage bucket URL
 * @property {string} messagingSenderId - Mesajlaşma gönderen ID
 * @property {string} appId - Firebase uygulama ID'si
 * @property {string} measurementId - Analytics ölçüm ID'si
 */
const firebaseConfig = {
  apiKey: "AIzaSyDtGt1dJsb79DiQp7j48m8QnyDd5oF_f_M",
  authDomain: "ogrenci-takip-8a31b.firebaseapp.com",
  databaseURL: "https://ogrenci-takip-8a31b-default-rtdb.firebaseio.com",
  projectId: "ogrenci-takip-8a31b",
  storageBucket: "ogrenci-takip-8a31b.firebasestorage.app",
  messagingSenderId: "542821681180",
  appId: "1:542821681180:web:af6e28b490d5b832b6f7d9",
  measurementId: "G-4YMV5VL6T5"
};

/**
 * Firebase uygulama örneği
 * @constant {FirebaseApp} app
 */
const app = initializeApp(firebaseConfig);

/**
 * Kimlik doğrulama servisi
 * @constant {Auth} auth
 */
export const auth = getAuth(app);

/**
 * Firestore veritabanı servisi
 * @constant {Firestore} db
 */
export const db = getFirestore(app);

/**
 * Cloud Storage servisi
 * @constant {Storage} storage
 */
export const storage = getStorage(app);

/**
 * Firebase başlatma durumu kontrolü
 * @function initializeFirebase
 * @returns {boolean} Başarı durumu
 */
export const initializeFirebase = () => {
  try {
    if (!app) {
      throw new Error('Firebase uygulaması başlatılamadı');
    }
    
    console.log('✅ Firebase başarıyla yüklendi ve yapılandırıldı');
    console.log('📊 Kullanılabilir servisler:');
    console.log('   🔐 Authentication:', !!auth);
    console.log('   💾 Firestore:', !!db);
    console.log('   📁 Storage:', !!storage);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase başlatma hatası:', error);
    return false;
  }
};

// Uygulama başlatıldığında Firebase'i kontrol et
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
});

// Hata yönetimi için global error handler
window.addEventListener('error', (event) => {
  console.error('Global hata yakalandı:', event.error);
});

export default app;