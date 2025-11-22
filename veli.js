/**
 * Veli Paneli - Ana Kontrol Modülü
 * @version 1.0.0
 * @description Öğrenci takip sistemi veli paneli
 */

class VeliPaneli {
    constructor() {
        this.currentUser = null;
        this.ogrenciId = null;
        this.ogretmenId = null;
        this.charts = {};
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Uygulama başlatma
     */
    async init() {
        try {
            await this.waitForFirebase();
            this.setupEventListeners();
            await this.checkAuthState();
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            this.showError('Sistem başlatılamadı. Lütfen sayfayı yenileyin.');
        }
    }

    /**
     * Firebase hazır olana kadar bekler
     */
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
            
            // 10 saniye timeout
            setTimeout(() => reject(new Error('Firebase yüklenemedi')), 10000);
        });
    }

    /**
     * Event listener'ları kur
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.handleDOMReady();
        });

        // Global event listeners
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Klavye event listeners
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
    }

    /**
     * DOM hazır olduğunda çalışır
     */
    handleDOMReady() {
        console.log('Veli Paneli DOM hazır');
    }

    /**
     * Global click handler
     */
    handleGlobalClick(event) {
        const iletisimModal = document.getElementById('iletisimModal');
        const odevlerModal = document.getElementById('odevlerModal');
        
        if (event.target === iletisimModal) {
            this.closeIletisimModal();
        }
        if (event.target === odevlerModal) {
            this.closeOdevlerModal();
        }
    }

    /**
     * Klavye kısayolları
     */
    handleKeydown(event) {
        // ESC ile modal kapatma
        if (event.key === 'Escape') {
            this.closeIletisimModal();
            this.closeOdevlerModal();
        }
    }

    /**
     * Kimlik doğrulama durumunu kontrol et
     */
    async checkAuthState() {
        try {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user && user.email.includes('@veli.sistem.com')) {
                    this.currentUser = user;
                    await this.initializeApp();
                } else {
                    this.redirectToLogin();
                }
            });
        } catch (error) {
            console.error('Auth state kontrol hatası:', error);
            this.redirectToLogin();
        }
    }

    /**
     * Uygulamayı başlat
     */
    async initializeApp() {
        if (this.isInitialized) return;

        try {
            await this.showLoading('Sistem yükleniyor...');
            
            await this.loadVeliData();
            await this.loadOgrenciData();
            await this.initCharts();
            
            this.hideLoading();
            this.isInitialized = true;
            
            console.log('Veli Paneli başarıyla başlatıldı');
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            this.showError('Sistem yüklenirken hata oluştu.');
        }
    }

    /**
     * Veli verilerini yükle
     */
    async loadVeliData() {
        try {
            const userDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(this.currentUser.uid)
                .get();
            
            if (!userDoc.exists) {
                throw new Error('Veli kaydı bulunamadı');
            }

            const userData = userDoc.data();
            this.updateVeliUI(userData);
            
            // ID'leri sakla
            this.ogrenciId = userData.ogrenciId;
            this.ogretmenId = userData.ogretmenId;

        } catch (error) {
            console.error('Veli verisi yüklenemedi:', error);
            throw new Error('Veli bilgileri yüklenemedi');
        }
    }

    /**
     * Veli UI güncelleme
     */
    updateVeliUI(userData) {
        const veliNameElement = document.getElementById('veliName');
        if (veliNameElement) {
            veliNameElement.textContent = `Hoş geldiniz, ${userData.ad} ${userData.soyad}`;
        }
    }

    /**
     * Öğrenci verilerini yükle
     */
    async loadOgrenciData() {
        if (!this.ogrenciId) {
            throw new Error('Öğrenci ID bulunamadı');
        }

        try {
            const ogrenciDoc = await firebase.firestore()
                .collection('ogrenciler')
                .doc(this.ogrenciId)
                .get();
            
            if (!ogrenciDoc.exists) {
                throw new Error('Öğrenci kaydı bulunamadı');
            }

            const ogrenci = ogrenciDoc.data();
            this.updateOgrenciUI(ogrenci);

        } catch (error) {
            console.error('Öğrenci verisi yüklenemedi:', error);
            throw new Error('Öğrenci bilgileri yüklenemedi');
        }
    }

    /**
     * Öğrenci UI güncelleme
     */
    updateOgrenciUI(ogrenci) {
        const elements = {
            'ogrenciAdi': `${ogrenci.ad} ${ogrenci.soyad}`,
            'ogrenciAvatar': ogrenci.fotoUrl,
            'toplamPuan': ogrenci.toplamPuan?.toFixed(1) || '0',
            'toplamMadalya': ogrenci.toplamMadalya || '0'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'ogrenciAvatar') {
                    element.src = value;
                    element.alt = `${ogrenci.ad} ${ogrenci.soyad}`;
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    /**
     * Tüm grafikleri başlat
     */
    async initCharts() {
        const chartConfigs = [
            { id: 'kitapOkumaChart', type: 'kitapOkuma', chartType: 'bar' },
            { id: 'odevPuaniChart', type: 'odevPuani', chartType: 'line' },
            { id: 'soruCozumuChart', type: 'soruCozumu', chartType: 'bar' },
            { id: 'denemeChart', type: 'deneme', chartType: 'line' },
            { id: 'yildizChart', type: 'yildiz', chartType: 'bar' },
            { id: 'olumsuzDavranisChart', type: 'olumsuzDavranis', chartType: 'bar' }
        ];

        try {
            await Promise.all(
                chartConfigs.map(config => this.createChart(config))
            );
        } catch (error) {
            console.error('Grafikler oluşturulurken hata:', error);
            throw new Error('Grafikler yüklenemedi');
        }
    }

    /**
     * Grafik oluştur
     */
    async createChart(config) {
        const { id, type, chartType } = config;
        const ctx = document.getElementById(id)?.getContext('2d');
        
        if (!ctx) {
            console.warn(`${id} canvas elementi bulunamadı`);
            return;
        }

        try {
            const data = type === 'deneme' 
                ? await this.getYillikVeri(type)
                : await this.getAylikVeri(type);

            const chartOptions = this.getChartOptions(type, chartType);
            const chartData = this.getChartData(type, data, chartType);

            // Önceki chart'ı temizle
            if (this.charts[id]) {
                this.charts[id].destroy();
            }

            this.charts[id] = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: chartOptions
            });

        } catch (error) {
            console.error(`${id} grafiği oluşturulamadı:`, error);
            this.showChartError(id);
        }
    }

    /**
     * Grafik verilerini hazırla
     */
    getChartData(type, data, chartType) {
        const configs = {
            kitapOkuma: {
                label: 'Toplam Okunan Sayfa',
                colors: ['rgba(52, 152, 219, 0.7)', 'rgba(52, 152, 219, 1)']
            },
            odevPuani: {
                label: 'Toplam Ödev Puanı',
                colors: ['rgba(46, 204, 113, 0.2)', 'rgba(46, 204, 113, 1)']
            },
            soruCozumu: {
                label: 'Toplam Çözülen Soru',
                colors: ['rgba(155, 89, 182, 0.7)', 'rgba(155, 89, 182, 1)']
            },
            deneme: {
                label: 'Net Ortalama',
                colors: ['rgba(231, 76, 60, 0.2)', 'rgba(231, 76, 60, 1)']
            },
            yildiz: {
                label: 'Toplam Yıldız',
                colors: ['rgba(241, 196, 15, 0.7)', 'rgba(241, 196, 15, 1)']
            },
            olumsuzDavranis: {
                label: 'Olumsuz Davranış Sayısı',
                colors: ['rgba(149, 165, 166, 0.7)', 'rgba(149, 165, 166, 1)']
            }
        };

        const config = configs[type];
        const isLineChart = chartType === 'line';
        const labels = type === 'deneme' ? data.labels : ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'];
        const chartData = type === 'deneme' ? data.netler : data;

        return {
            labels: labels,
            datasets: [{
                label: config.label,
                data: chartData,
                backgroundColor: config.colors[0],
                borderColor: config.colors[1],
                borderWidth: isLineChart ? 2 : 1,
                tension: isLineChart ? 0.4 : 0,
                fill: isLineChart
            }]
        };
    }

    /**
     * Grafik seçeneklerini hazırla
     */
    getChartOptions(type, chartType) {
        const units = {
            kitapOkuma: 'Sayfa Sayısı',
            odevPuani: 'Puan',
            soruCozumu: 'Soru Sayısı',
            deneme: 'Net',
            yildiz: 'Yıldız Sayısı',
            olumsuzDavranis: 'Kayıt Sayısı'
        };

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: units[type]
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        };
    }

    /**
     * Aylık veri getirme fonksiyonu
     */
    async getAylikVeri(tip) {
        try {
            const aylikData = new Array(10).fill(0); // Eylül-Haziran

            const kayitSnapshot = await firebase.firestore()
                .collection('modulKayitlari')
                .where('ogrenciId', '==', this.ogrenciId)
                .where('tip', '==', tip)
                .get();

            kayitSnapshot.forEach((doc) => {
                const kayit = doc.data();
                const tarih = kayit.tarih.toDate();
                const ay = tarih.getMonth();

                const ayIndex = this.getAyIndex(ay);
                if (ayIndex !== -1) {
                    aylikData[ayIndex] += this.calculateAylikValue(tip, kayit);
                }
            });

            return aylikData;

        } catch (error) {
            console.error(`Aylık veri getirme hatası (${tip}):`, error);
            return new Array(10).fill(0);
        }
    }

    /**
     * Ay indeksini hesapla
     */
    getAyIndex(ay) {
        // Okul dönemi: Eylül (8) - Haziran (5)
        if (ay >= 8) { // Eylül-Aralık
            return ay - 8;
        } else if (ay <= 5) { // Ocak-Haziran
            return ay + 4;
        }
        return -1;
    }

    /**
     * Aylık değeri hesapla
     */
    calculateAylikValue(tip, kayit) {
        switch (tip) {
            case 'kitapOkuma':
                return kayit.durum === 'okundu' ? kayit.sayfaSayisi : 0;
            case 'odevPuani':
                return kayit.durum === 'yapildi' ? kayit.puan : 0;
            case 'soruCozumu':
                return kayit.toplamSoru || 0;
            case 'yildiz':
                return kayit.yildizSayisi || 0;
            case 'olumsuzDavranis':
                return 1;
            default:
                return 0;
        }
    }

    /**
     * Yıllık veri getirme fonksiyonu (deneme sınavları için)
     */
    async getYillikVeri(tip) {
        try {
            const tumKayitlar = [];

            const kayitSnapshot = await firebase.firestore()
                .collection('modulKayitlari')
                .where('ogrenciId', '==', this.ogrenciId)
                .where('tip', '==', tip)
                .orderBy('tarih', 'asc')
                .get();

            kayitSnapshot.forEach((doc) => {
                const kayit = doc.data();
                tumKayitlar.push({
                    tarih: kayit.tarih.toDate(),
                    net: kayit.net || 0
                });
            });

            return {
                labels: tumKayitlar.map(kayit => 
                    kayit.tarih.toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit' 
                    })
                ),
                netler: tumKayitlar.map(kayit => kayit.net)
            };

        } catch (error) {
            console.error(`Yıllık veri getirme hatası (${tip}):`, error);
            return { labels: [], netler: [] };
        }
    }

    /**
     * İletişim modalını aç
     */
    async openIletisim() {
        try {
            await this.loadMesajlar();
            this.showModal('iletisimModal');
        } catch (error) {
            console.error('İletişim modalı açılamadı:', error);
            this.showError('İletişim sayfası açılamadı.');
        }
    }

    /**
     * İletişim modalını kapat
     */
    closeIletisimModal() {
        this.hideModal('iletisimModal');
    }

    /**
     * Modal göster
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Modal gizle
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Mesajları yükle
     */
    async loadMesajlar() {
        try {
            const mesajlarContainer = document.getElementById('mesajlar');
            if (!mesajlarContainer) return;

            mesajlarContainer.innerHTML = this.getLoadingHTML();

            const querySnapshot = await firebase.firestore()
                .collection('mesajlar')
                .where('ogrenciId', '==', this.ogrenciId)
                .orderBy('tarih', 'asc')
                .get();

            if (querySnapshot.empty) {
                mesajlarContainer.innerHTML = this.getNoDataHTML('Henüz mesaj bulunmuyor.');
                return;
            }

            const mesajHTML = this.generateMesajHTML(querySnapshot);
            mesajlarContainer.innerHTML = mesajHTML;
            
            this.scrollToBottom(mesajlarContainer);

        } catch (error) {
            console.error('Mesajlar yüklenemedi:', error);
            this.showMesajError();
        }
    }

    /**
     * Mesaj HTML oluştur
     */
    generateMesajHTML(querySnapshot) {
        let mesajHTML = '';
        querySnapshot.forEach((doc) => {
            const mesaj = doc.data();
            const tarih = mesaj.tarih.toDate();
            const tarihStr = this.formatDateTime(tarih);
            
            const mesajSinif = mesaj.gonderenId === this.currentUser.uid ? 'mesaj-gonderen' : 'mesaj-alici';
            const gonderenAd = mesaj.gonderenId === this.currentUser.uid ? 'Siz' : 'Öğretmen';

            mesajHTML += `
                <div class="mesaj ${mesajSinif}">
                    <div class="mesaj-icerik">${this.escapeHTML(mesaj.icerik)}</div>
                    <div class="mesaj-tarih">${gonderenAd} - ${tarihStr}</div>
                </div>
            `;
        });

        return mesajHTML;
    }

    /**
     * Mesaj gönder
     */
    async mesajGonder() {
        try {
            const mesajIcerik = document.getElementById('yeniMesaj')?.value.trim();
            
            if (!mesajIcerik) {
                this.showAlert('Lütfen mesajınızı yazın.', 'warning');
                return;
            }

            if (mesajIcerik.length > 1000) {
                this.showAlert('Mesajınız 1000 karakteri geçemez.', 'warning');
                return;
            }

            const mesajData = {
                ogrenciId: this.ogrenciId,
                gonderenId: this.currentUser.uid,
                gonderenAd: 'Veli',
                icerik: mesajIcerik,
                tarih: new Date(),
                okundu: false
            };

            await firebase.firestore().collection('mesajlar').add(mesajData);

            // Mesaj kutusunu temizle
            const mesajInput = document.getElementById('yeniMesaj');
            if (mesajInput) mesajInput.value = '';

            // Mesajları yenile
            await this.loadMesajlar();

            this.showAlert('Mesajınız gönderildi.', 'success');

        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            this.showAlert('Mesaj gönderilirken hata oluştu.', 'error');
        }
    }

    /**
     * Ödevler modalını aç
     */
    async openOdevler() {
        try {
            await this.loadOdevler();
            this.showModal('odevlerModal');
        } catch (error) {
            console.error('Ödevler modalı açılamadı:', error);
            this.showError('Ödevler sayfası açılamadı.');
        }
    }

    /**
     * Ödevler modalını kapat
     */
    closeOdevlerModal() {
        this.hideModal('odevlerModal');
    }

    /**
     * Ödevleri yükle
     */
    async loadOdevler() {
        try {
            const odevListesiContainer = document.getElementById('odevListesi');
            if (!odevListesiContainer) return;

            odevListesiContainer.innerHTML = this.getLoadingHTML();

            const querySnapshot = await firebase.firestore()
                .collection('odevler')
                .where('ogrenciId', '==', this.ogrenciId)
                .orderBy('teslimTarihi', 'desc')
                .get();

            if (querySnapshot.empty) {
                odevListesiContainer.innerHTML = this.getNoDataHTML('Henüz ödev bulunmuyor.');
                return;
            }

            const odevHTML = this.generateOdevHTML(querySnapshot);
            odevListesiContainer.innerHTML = odevHTML;

        } catch (error) {
            console.error('Ödevler yüklenemedi:', error);
            this.showOdevError();
        }
    }

    /**
     * Ödev HTML oluştur
     */
    generateOdevHTML(querySnapshot) {
        let odevHTML = '';
        querySnapshot.forEach((doc) => {
            const odev = doc.data();
            const teslimTarihi = odev.teslimTarihi.toDate();
            const tarihStr = teslimTarihi.toLocaleDateString('tr-TR');
            
            odevHTML += `
                <div class="odev-item">
                    <div class="odev-baslik">${this.escapeHTML(odev.baslik)}</div>
                    <div class="odev-aciklama">${this.escapeHTML(odev.aciklama)}</div>
                    <div class="odev-tarih">Teslim Tarihi: ${tarihStr}</div>
                    ${odev.tamamlandi ? 
                        '<div class="odev-durum tamamlandi">✅ Tamamlandı</div>' : 
                        '<div class="odev-durum bekliyor">⏳ Bekliyor</div>'
                    }
                </div>
            `;
        });

        return odevHTML;
    }

    /**
     * Yardımcı fonksiyonlar
     */

    formatDateTime(date) {
        return date.toLocaleDateString('tr-TR') + ' ' + 
               date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    getLoadingHTML() {
        return '<div class="loading">Yükleniyor...</div>';
    }

    getNoDataHTML(message) {
        return `<div class="no-data">${message}</div>`;
    }

    showChartError(chartId) {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            canvas.parentElement.innerHTML = '<div class="chart-error">Grafik yüklenemedi</div>';
        }
    }

    showMesajError() {
        const container = document.getElementById('mesajlar');
        if (container) {
            container.innerHTML = '<div class="error">Mesajlar yüklenirken hata oluştu.</div>';
        }
    }

    showOdevError() {
        const container = document.getElementById('odevListesi');
        if (container) {
            container.innerHTML = '<div class="error">Ödevler yüklenirken hata oluştu.</div>';
        }
    }

    async showLoading(message = 'Yükleniyor...') {
        // Loading state implementation
        console.log(message);
    }

    hideLoading() {
        // Hide loading implementation
    }

    showError(message) {
        console.error('Hata:', message);
        alert(message); // Daha gelişmiş bir notification sistemi ile değiştirilebilir
    }

    showAlert(message, type = 'info') {
        // Daha gelişmiş bir alert/notification sistemi implemente edilebilir
        const alertTypes = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        alert(`${alertTypes[type] || 'ℹ️'} ${message}`);
    }

    redirectToLogin() {
        window.location.href = 'index.html';
    }

    /**
     * Çıkış fonksiyonu
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            this.redirectToLogin();
        } catch (error) {
            console.error('Çıkış hatası:', error);
            this.showError('Çıkış yapılırken hata oluştu.');
        }
    }

    /**
     * Uygulama temizleme
     */
    destroy() {
        // Chart'ları temizle
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
        this.isInitialized = false;
        
        console.log('Veli Paneli temizlendi');
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', function() {
    window.veliPaneli = new VeliPaneli();
});

// Global fonksiyonlar (mevcut HTML yapısıyla uyumluluk için)
function openIletisim() {
    if (window.veliPaneli) {
        window.veliPaneli.openIletisim();
    }
}

function closeIletisimModal() {
    if (window.veliPaneli) {
        window.veliPaneli.closeIletisimModal();
    }
}

function mesajGonder() {
    if (window.veliPaneli) {
        window.veliPaneli.mesajGonder();
    }
}

function openOdevler() {
    if (window.veliPaneli) {
        window.veliPaneli.openOdevler();
    }
}

function closeOdevlerModal() {
    if (window.veliPaneli) {
        window.veliPaneli.closeOdevlerModal();
    }
}

function logout() {
    if (window.veliPaneli) {
        window.veliPaneli.logout();
    }
}

// Enter tuşu ile mesaj gönderme
document.addEventListener('DOMContentLoaded', function() {
    const mesajInput = document.getElementById('yeniMesaj');
    if (mesajInput) {
        mesajInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                mesajGonder();
            }
        });
    }
});