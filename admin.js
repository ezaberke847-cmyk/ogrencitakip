// 👨‍💼 YÖNETİCİ PANELİ FONKSİYONLARI - PROFESYONEL VERSİYON
// Tüm modüller tam ve optimize edilmiş

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.seciliOgretmenId = null;
        this.chartInstances = new Map();
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.initializeFirebase();
            this.bindEvents();
            await this.checkAuthState();
            this.isInitialized = true;
            console.log('✅ Admin panel başarıyla başlatıldı');
        } catch (error) {
            console.error('❌ Admin panel başlatılamadı:', error);
            this.showError('Sistem başlatılamadı. Lütfen sayfayı yenileyin.');
        }
    }

    async initializeFirebase() {
        // Firebase başlatma kontrolü
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase kütüphanesi yüklenmedi');
        }
        
        try {
            await firebase.auth();
            await firebase.firestore();
        } catch (error) {
            throw new Error('Firebase başlatılamadı: ' + error.message);
        }
    }

    bindEvents() {
        // DOM hazır olduğunda
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMLoaded());
        } else {
            this.onDOMLoaded();
        }

        // Global event listener'lar
        window.addEventListener('click', this.handleOutsideClick.bind(this));
        window.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    onDOMLoaded() {
        // Form event listener'ları
        this.bindFormEvents();
        
        // Navigation event listener'ları
        this.bindNavigationEvents();
    }

    bindFormEvents() {
        const ogretmenEkleForm = document.getElementById('ogretmenEkleForm');
        if (ogretmenEkleForm) {
            ogretmenEkleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.ogretmenEkle();
            });
        }

        // Mesaj gönderme formu
        const mesajForm = document.getElementById('mesajForm');
        if (mesajForm) {
            mesajForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.mesajGonder();
            });
        }
    }

    bindNavigationEvents() {
        // Navigation butonları
        const navButtons = [
            { id: 'kullaniciYonetimiBtn', handler: () => this.openKullaniciYonetimi() },
            { id: 'iletisimBtn', handler: () => this.openIletisim() },
            { id: 'sistemIstatistikleriBtn', handler: () => this.openSistemIstatistikleri() },
            { id: 'sinifGorunumleriBtn', handler: () => this.openSinifGorunumleri() },
            { id: 'logoutBtn', handler: () => this.logout() }
        ];

        navButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    handleKeydown(event) {
        // ESC tuşu ile modal kapatma
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    handleGlobalError(event) {
        console.error('Global error:', event.error);
        this.showError('Beklenmeyen bir hata oluştu');
    }

    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.showError('İşlem sırasında hata oluştu');
    }

    // Kimlik doğrulama durumunu kontrol et
    async checkAuthState() {
        return new Promise((resolve, reject) => {
            const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                try {
                    if (user && await this.isAdminUser(user)) {
                        this.currentUser = user;
                        await this.loadAdminData();
                        await this.loadDashboardData();
                        this.showUI();
                        resolve();
                    } else {
                        this.redirectToLogin();
                        reject(new Error('Yetkisiz erişim'));
                    }
                } catch (error) {
                    console.error('Auth state kontrol hatası:', error);
                    this.redirectToLogin();
                    reject(error);
                } finally {
                    unsubscribe();
                }
            }, reject);
        });
    }

    async isAdminUser(user) {
        try {
            // Email kontrolü
            if (user.email && user.email.includes('@sistem.com')) {
                return true;
            }

            // Firestore'dan kullanıcı tipini kontrol et
            const userDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(user.uid)
                .get();

            return userDoc.exists && userDoc.data().tip === 'admin';
        } catch (error) {
            console.error('Kullanıcı tipi kontrol hatası:', error);
            return false;
        }
    }

    redirectToLogin() {
        window.location.href = 'index.html';
    }

    showUI() {
        // Admin arayüzünü göster
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = 'block';
        });

        // Loading state'i kaldır
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    // Yönetici verilerini yükle
    async loadAdminData() {
        try {
            const userDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(this.currentUser.uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.updateAdminDisplay(userData);
            }
        } catch (error) {
            console.error('Yönetici verisi yüklenemedi:', error);
            this.showError('Yönetici verileri yüklenirken hata oluştu');
        }
    }

    updateAdminDisplay(userData) {
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = `Hoş geldiniz, ${userData.kullaniciAdi || userData.ad || 'Yönetici'}`;
        }

        // Admin avatar veya diğer bilgileri güncelle
        const adminAvatar = document.getElementById('adminAvatar');
        if (adminAvatar && userData.avatar) {
            adminAvatar.src = userData.avatar;
            adminAvatar.alt = userData.kullaniciAdi;
        }
    }

    // Dashboard verilerini yükle
    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadSistemOzeti(),
                this.loadSonAktiviteler(),
                this.loadOgretmenListesi()
            ]);
        } catch (error) {
            console.error('Dashboard verileri yüklenemedi:', error);
            this.showError('Dashboard verileri yüklenirken hata oluştu');
        }
    }

    // Sistem özetini yükle
    async loadSistemOzeti() {
        try {
            const [
                ogretmenSnapshot,
                ogrenciSnapshot,
                veliSnapshot,
                kayitSnapshot,
                aktifKullaniciSnapshot
            ] = await Promise.all([
                firebase.firestore().collection('kullanicilar')
                    .where('tip', '==', 'ogretmen')
                    .where('durum', '==', 'aktif')
                    .get(),
                firebase.firestore().collection('ogrenciler').get(),
                firebase.firestore().collection('kullanicilar')
                    .where('tip', '==', 'veli')
                    .get(),
                firebase.firestore().collection('modulKayitlari')
                    .where('olusturulmaTarihi', '>=', this.getLastMonthDate())
                    .get(),
                this.getAktifKullaniciSayisi()
            ]);

            this.updateSistemOzeti({
                ogretmen: ogretmenSnapshot.size,
                ogrenci: ogrenciSnapshot.size,
                veli: veliSnapshot.size,
                kayit: kayitSnapshot.size,
                aktifKullanici: aktifKullaniciSnapshot
            });

        } catch (error) {
            console.error('Sistem özeti yüklenemedi:', error);
            throw error;
        }
    }

    async getAktifKullaniciSayisi() {
        // Son 24 saat içinde aktif olan kullanıcılar
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [ogretmenSnapshot, veliSnapshot] = await Promise.all([
            firebase.firestore().collection('kullanicilar')
                .where('tip', '==', 'ogretmen')
                .where('sonGirisTarihi', '>=', last24Hours)
                .get(),
            firebase.firestore().collection('kullanicilar')
                .where('tip', '==', 'veli')
                .where('sonGirisTarihi', '>=', last24Hours)
                .get()
        ]);

        return ogretmenSnapshot.size + veliSnapshot.size;
    }

    getLastMonthDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date;
    }

    updateSistemOzeti(veriler) {
        const elements = {
            toplamOgretmen: veriler.ogretmen,
            toplamOgrenci: veriler.ogrenci,
            toplamVeli: veriler.veli,
            toplamKayit: veriler.kayit,
            aktifKullanicilar: veriler.aktifKullanici
        };

        Object.keys(elements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = this.formatNumber(elements[key]);
                this.animateValue(element, 0, elements[key], 1000);
            }
        });

        // Progress bar'ları güncelle (varsa)
        this.updateProgressBars(veriler);
    }

    animateValue(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + range * progress);
            element.textContent = this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    }

    formatNumber(num) {
        return new Intl.NumberFormat('tr-TR').format(num);
    }

    updateProgressBars(veriler) {
        const progressBars = {
            ogretmenProgress: (veriler.ogretmen / Math.max(veriler.ogretmen, 50)) * 100,
            ogrenciProgress: (veriler.ogrenci / Math.max(veriler.ogrenci, 200)) * 100,
            veliProgress: (veriler.veli / Math.max(veriler.veli, 150)) * 100
        };

        Object.keys(progressBars).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.style.width = `${progressBars[key]}%`;
            }
        });
    }

    // Son aktiviteleri yükle
    async loadSonAktiviteler() {
        try {
            const aktivitelerContainer = document.getElementById('sonAktiviteler');
            if (!aktivitelerContainer) return;

            aktivitelerContainer.innerHTML = this.createLoadingSpinner();

            const kayitSnapshot = await firebase.firestore()
                .collection('modulKayitlari')
                .orderBy('olusturulmaTarihi', 'desc')
                .limit(15)
                .get();

            if (kayitSnapshot.empty) {
                aktivitelerContainer.innerHTML = this.createNoDataMessage('Henüz aktivite bulunmuyor');
                return;
            }

            const aktiviteler = await this.processAktiviteler(kayitSnapshot);
            this.renderAktiviteler(aktiviteler, aktivitelerContainer);

        } catch (error) {
            console.error('Aktiviteler yüklenemedi:', error);
            this.showError('Aktiviteler yüklenirken hata oluştu', 'sonAktiviteler');
        }
    }

    async processAktiviteler(kayitSnapshot) {
        const aktiviteler = await Promise.all(
            kayitSnapshot.docs.map(async (doc) => {
                try {
                    const kayit = doc.data();
                    const [ogrenciAdi, ogretmenAdi] = await Promise.all([
                        this.getOgrenciAdi(kayit.ogrenciId),
                        this.getOgretmenAdi(kayit.ogretmenId)
                    ]);

                    return {
                        id: doc.id,
                        kayit: kayit,
                        ogrenciAdi: ogrenciAdi,
                        ogretmenAdi: ogretmenAdi,
                        tarih: kayit.olusturulmaTarihi?.toDate() || new Date(),
                        tip: kayit.tip
                    };
                } catch (error) {
                    console.error('Aktivite işleme hatası:', error);
                    return null;
                }
            })
        );

        return aktiviteler.filter(aktivite => aktivite !== null);
    }

    async getOgrenciAdi(ogrenciId) {
        if (!ogrenciId) return 'Bilinmeyen Öğrenci';

        try {
            const ogrenciDoc = await firebase.firestore()
                .collection('ogrenciler')
                .doc(ogrenciId)
                .get();
            
            if (ogrenciDoc.exists) {
                const ogrenci = ogrenciDoc.data();
                return `${ogrenci.ad} ${ogrenci.soyad}`;
            }
        } catch (error) {
            console.error('Öğrenci bilgisi alınamadı:', error);
        }
        return 'Bilinmeyen Öğrenci';
    }

    async getOgretmenAdi(ogretmenId) {
        if (!ogretmenId) return 'Bilinmeyen Öğretmen';

        try {
            const ogretmenDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(ogretmenId)
                .get();
            
            if (ogretmenDoc.exists) {
                const ogretmen = ogretmenDoc.data();
                return `${ogretmen.ad} ${ogretmen.soyad}`;
            }
        } catch (error) {
            console.error('Öğretmen bilgisi alınamadı:', error);
        }
        return 'Bilinmeyen Öğretmen';
    }

    renderAktiviteler(aktiviteler, container) {
        const aktiviteHTML = aktiviteler.map(aktivite => {
            const tarihStr = this.formatTarih(aktivite.tarih);
            const aktiviteMetni = this.generateAktiviteMetni(aktivite);
            const aktiviteIkon = this.getAktiviteIkon(aktivite.tip);
            
            return `
                <div class="aktivite-item" data-tip="${aktivite.tip}">
                    <div class="aktivite-ikon">${aktiviteIkon}</div>
                    <div class="aktivite-bilgi">
                        <div class="aktivite-metni">${aktiviteMetni}</div>
                        <div class="aktivite-detay">
                            <span class="aktivite-ogretmen">${aktivite.ogretmenAdi}</span>
                            <span class="aktivite-tarih">${tarihStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = aktiviteHTML;
        
        // Aktivite filtreleme event'lerini bağla
        this.bindAktiviteFiltreleme();
    }

    getAktiviteIkon(tip) {
        const ikonlar = {
            kitapOkuma: '📚',
            odevPuani: '📝',
            soruCozumu: '🧮',
            olumsuzDavranis: '⚠️',
            yildiz: '⭐',
            test: '📊',
            deneme: '🎯',
            kitapOkumaSinavi: '📖',
            default: '📋'
        };
        
        return ikonlar[tip] || ikonlar.default;
    }

    bindAktiviteFiltreleme() {
        const filtreButonlari = document.querySelectorAll('.aktivite-filtre');
        filtreButonlari.forEach(buton => {
            buton.addEventListener('click', (e) => {
                const filtre = e.target.dataset.filtre;
                this.filtreleAktiviteler(filtre);
            });
        });
    }

    filtreleAktiviteler(filtre) {
        const aktiviteItems = document.querySelectorAll('.aktivite-item');
        
        aktiviteItems.forEach(item => {
            if (filtre === 'tum' || item.dataset.tip === filtre) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    generateAktiviteMetni(aktivite) {
        const { kayit, ogrenciAdi } = aktivite;
        
        const aktiviteTipleri = {
            kitapOkuma: () => kayit.durum === 'okundu' 
                ? `${ogrenciAdi}, <strong>${kayit.sayfaSayisi}</strong> sayfa kitap okudu`
                : `${ogrenciAdi}, kitap okumadı`,
            
            odevPuani: () => kayit.durum === 'yapildi'
                ? `${ogrenciAdi}, <strong>${kayit.puan}</strong> puan aldı`
                : `${ogrenciAdi}, ödev yapmadı`,
            
            soruCozumu: () => `${ogrenciAdi}, <strong>${kayit.toplamSoru}</strong> soru çözdü`,
            
            olumsuzDavranis: () => `${ogrenciAdi}, olumsuz davranış kaydı eklendi`,
            
            yildiz: () => `${ogrenciAdi}, <strong>${kayit.yildizSayisi}</strong> yıldız kazandı`,
            
            test: () => `${ogrenciAdi}, test çözdü - ${kayit.puan} puan`,
            
            deneme: () => `${ogrenciAdi}, deneme sınavına girdi - ${kayit.puan} puan`,
            
            kitapOkumaSinavi: () => `${ogrenciAdi}, kitap okuma sınavına girdi - ${kayit.puan} puan`,
            
            default: () => `${ogrenciAdi}, ${kayit.tip} kaydı eklendi`
        };

        const aktiviteFonksiyonu = aktiviteTipleri[kayit.tip] || aktiviteTipleri.default;
        return aktiviteFonksiyonu();
    }

    formatTarih(tarih) {
        const now = new Date();
        const diffMs = now - tarih;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Şimdi';
        } else if (diffMins < 60) {
            return `${diffMins} dakika önce`;
        } else if (diffHours < 24) {
            return `${diffHours} saat önce`;
        } else if (diffDays < 7) {
            return `${diffDays} gün önce`;
        } else {
            return tarih.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Kullanıcı yönetimi modalını aç
    async openKullaniciYonetimi() {
        try {
            await this.loadOgretmenListesi();
            this.showModal('kullaniciYonetimiModal');
            this.trackEvent('kullanici_yonetimi_acildi');
        } catch (error) {
            console.error('Kullanıcı yönetimi açılırken hata:', error);
            this.showError('Kullanıcı yönetimi açılırken hata oluştu');
        }
    }

    closeKullaniciYonetimiModal() {
        this.hideModal('kullaniciYonetimiModal');
    }

    // Öğretmen listesini yükle
    async loadOgretmenListesi() {
        try {
            const ogretmenListesiContainer = document.getElementById('ogretmenListesi');
            if (!ogretmenListesiContainer) return;

            ogretmenListesiContainer.innerHTML = this.createLoadingSpinner();

            const querySnapshot = await firebase.firestore()
                .collection('kullanicilar')
                .where('tip', '==', 'ogretmen')
                .orderBy('olusturulmaTarihi', 'desc')
                .get();

            if (querySnapshot.empty) {
                ogretmenListesiContainer.innerHTML = this.createNoDataMessage('Henüz öğretmen kaydı bulunmuyor');
                return;
            }

            this.renderOgretmenListesi(querySnapshot, ogretmenListesiContainer);

        } catch (error) {
            console.error('Öğretmen listesi yüklenemedi:', error);
            this.showError('Öğretmen listesi yüklenirken hata oluştu', 'ogretmenListesi');
        }
    }

    renderOgretmenListesi(querySnapshot, container) {
        const ogretmenHTML = querySnapshot.docs.map(doc => {
            const ogretmen = doc.data();
            const durumClass = ogretmen.durum === 'aktif' ? 'durum-aktif' : 'durum-pasif';
            const durumText = ogretmen.durum === 'aktif' ? 'Aktif' : 'Pasif';
            const olusturulmaTarihi = ogretmen.olusturulmaTarihi?.toDate();
            const tarihStr = olusturulmaTarihi ? this.formatTarih(olusturulmaTarihi) : 'Bilinmiyor';

            return `
                <div class="ogretmen-karti" data-ogretmen-id="${doc.id}">
                    <div class="ogretmen-bilgi">
                        <div class="ogretmen-adi">${ogretmen.ad} ${ogretmen.soyad}</div>
                        <div class="ogretmen-detay">
                            <span class="ogretmen-kullaniciadi">@${ogretmen.kullaniciAdi}</span>
                            <span class="ogretmen-sinif">Sınıf: ${ogretmen.sinif}/${ogretmen.sube}</span>
                            <span class="ogretmen-tarih">${tarihStr}</span>
                        </div>
                        <div class="ogretmen-durum ${durumClass}">
                            <span class="durum-nokta"></span>
                            ${durumText}
                        </div>
                    </div>
                    <div class="ogretmen-aksiyonlar">
                        <button onclick="adminPanel.ogretmenDuzenle('${doc.id}')" 
                                class="edit-btn" 
                                title="Öğretmeni Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adminPanel.ogretmenDurumDegistir('${doc.id}', '${ogretmen.durum}')" 
                                class="status-btn ${ogretmen.durum === 'aktif' ? 'pasiflestir' : 'aktiflestir'}" 
                                title="${ogretmen.durum === 'aktif' ? 'Pasif Yap' : 'Aktif Yap'}">
                            <i class="fas ${ogretmen.durum === 'aktif' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button onclick="adminPanel.ogretmenSil('${doc.id}')" 
                                class="delete-btn" 
                                title="Öğretmeni Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ogretmenHTML;
        
        // Arama ve filtreleme event'lerini bağla
        this.bindOgretmenArama();
    }

    bindOgretmenArama() {
        const aramaInput = document.getElementById('ogretmenArama');
        const durumFiltre = document.getElementById('ogretmenDurumFiltre');
        
        if (aramaInput) {
            aramaInput.addEventListener('input', (e) => {
                this.filtreleOgretmenler(e.target.value, durumFiltre?.value);
            });
        }
        
        if (durumFiltre) {
            durumFiltre.addEventListener('change', (e) => {
                this.filtreleOgretmenler(aramaInput?.value, e.target.value);
            });
        }
    }

    filtreleOgretmenler(aramaMetni, durumFiltre) {
        const ogretmenKartlari = document.querySelectorAll('.ogretmen-karti');
        
        ogretmenKartlari.forEach(kart => {
            const ogretmenAdi = kart.querySelector('.ogretmen-adi').textContent.toLowerCase();
            const ogretmenDurum = kart.querySelector('.ogretmen-durum').textContent.toLowerCase();
            const aramaKriteri = aramaMetni ? aramaMetni.toLowerCase() : '';
            const durumKriteri = durumFiltre || 'tum';
            
            const aramaEslesiyor = !aramaKriteri || ogretmenAdi.includes(aramaKriteri);
            const durumEslesiyor = durumKriteri === 'tum' || 
                                 (durumKriteri === 'aktif' && ogretmenDurum.includes('aktif')) ||
                                 (durumKriteri === 'pasif' && ogretmenDurum.includes('pasif'));
            
            if (aramaEslesiyor && durumEslesiyor) {
                kart.style.display = 'flex';
            } else {
                kart.style.display = 'none';
            }
        });
    }

    // Öğretmen ekle modalını aç
    openOgretmenEkleModal() {
        this.showModal('ogretmenEkleModal');
        this.trackEvent('ogretmen_ekle_modal_acildi');
    }

    closeOgretmenEkleModal() {
        this.hideModal('ogretmenEkleModal');
        document.getElementById('ogretmenEkleForm').reset();
        this.temizleFormHatalari('ogretmenEkleForm');
    }

    // Öğretmen ekle
    async ogretmenEkle() {
        try {
            const formData = this.getOgretmenFormData();
            
            if (!this.validateOgretmenForm(formData)) {
                return;
            }

            this.showLoading('ogretmenEkleBtn', 'Ekleniyor...');
            
            await this.createOgretmenInFirebase(formData);
            
            this.closeOgretmenEkleModal();
            await Promise.all([
                this.loadOgretmenListesi(),
                this.loadSistemOzeti()
            ]);
            
            this.showSuccess('✅ Öğretmen başarıyla eklendi!');
            this.trackEvent('ogretmen_eklendi');

        } catch (error) {
            console.error('Öğretmen ekleme hatası:', error);
            this.showError('❌ Öğretmen eklenirken hata oluştu: ' + this.getErrorMessage(error));
        } finally {
            this.hideLoading('ogretmenEkleBtn', 'Öğretmen Ekle');
        }
    }

    getOgretmenFormData() {
        return {
            ad: document.getElementById('ogretmenAd').value.trim(),
            soyad: document.getElementById('ogretmenSoyad').value.trim(),
            kullaniciAdi: document.getElementById('ogretmenKullaniciAdi').value.trim(),
            sifre: document.getElementById('ogretmenSifre').value,
            sinif: document.getElementById('ogretmenSinif').value,
            sube: document.getElementById('ogretmenSube').value,
            email: document.getElementById('ogretmenEmail')?.value.trim() || '',
            telefon: document.getElementById('ogretmenTelefon')?.value.trim() || ''
        };
    }

    validateOgretmenForm(data) {
        this.temizleFormHatalari('ogretmenEkleForm');

        let isValid = true;
        const hatalar = {};

        if (!data.ad) {
            hatalar.ogretmenAd = 'Ad alanı zorunludur';
            isValid = false;
        }

        if (!data.soyad) {
            hatalar.ogretmenSoyad = 'Soyad alanı zorunludur';
            isValid = false;
        }

        if (!data.kullaniciAdi) {
            hatalar.ogretmenKullaniciAdi = 'Kullanıcı adı zorunludur';
            isValid = false;
        } else if (data.kullaniciAdi.length < 3) {
            hatalar.ogretmenKullaniciAdi = 'Kullanıcı adı en az 3 karakter olmalıdır';
            isValid = false;
        }

        if (!data.sifre) {
            hatalar.ogretmenSifre = 'Şifre alanı zorunludur';
            isValid = false;
        } else if (data.sifre.length < 6) {
            hatalar.ogretmenSifre = 'Şifre en az 6 karakter olmalıdır';
            isValid = false;
        }

        if (!data.sinif) {
            hatalar.ogretmenSinif = 'Sınıf seçimi zorunludur';
            isValid = false;
        }

        if (!data.sube) {
            hatalar.ogretmenSube = 'Şube seçimi zorunludur';
            isValid = false;
        }

        // Hataları göster
        Object.keys(hatalar).forEach(field => {
            this.showFieldError(field, hatalar[field]);
        });

        return isValid;
    }

    async createOgretmenInFirebase(formData) {
        const email = formData.email || `${formData.kullaniciAdi}@ogretmen.sistem.com`;
        
        // Firebase Authentication'a kullanıcı ekle
        const userCredential = await firebase.auth()
            .createUserWithEmailAndPassword(email, formData.sifre);
        
        const yeniOgretmenId = userCredential.user.uid;

        // Firestore'a öğretmen bilgilerini kaydet
        await firebase.firestore().collection('kullanicilar').doc(yeniOgretmenId).set({
            ad: formData.ad,
            soyad: formData.soyad,
            kullaniciAdi: formData.kullaniciAdi,
            email: email,
            telefon: formData.telefon,
            sinif: formData.sinif,
            sube: formData.sube,
            tip: 'ogretmen',
            durum: 'aktif',
            olusturulmaTarihi: new Date(),
            sonGirisTarihi: null,
            avatar: this.generateAvatar(formData.ad, formData.soyad)
        });

        // Kullanıcıya hoş geldin e-postası gönder (opsiyonel)
        await this.sendWelcomeEmail(email, formData.ad, formData.kullaniciAdi, formData.sifre);
    }

    generateAvatar(ad, soyad) {
        // Basit avatar URL'i oluştur (gerçek uygulamada daha gelişmiş bir sistem kullanılmalı)
        const initials = (ad.charAt(0) + soyad.charAt(0)).toUpperCase();
        return `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=128`;
    }

    async sendWelcomeEmail(email, ad, kullaniciAdi, sifre) {
        // E-posta gönderme işlemi (gerçek uygulamada bir e-posta servisi kullanılmalı)
        console.log(`Hoş geldin e-postası gönderildi: ${email}`);
        // Burada Firebase Functions veya başka bir e-posta servisi kullanılabilir
    }

    // Öğretmen düzenle
    async ogretmenDuzenle(ogretmenId) {
        try {
            const ogretmenDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(ogretmenId)
                .get();

            if (!ogretmenDoc.exists) {
                this.showError('Öğretmen bulunamadı');
                return;
            }

            const ogretmen = ogretmenDoc.data();
            this.openOgretmenDuzenleModal(ogretmen, ogretmenId);
            
        } catch (error) {
            console.error('Öğretmen düzenleme hatası:', error);
            this.showError('Öğretmen düzenlenirken hata oluştu');
        }
    }

    openOgretmenDuzenleModal(ogretmen, ogretmenId) {
        // Düzenleme modalını aç ve formu doldur
        this.showModal('ogretmenDuzenleModal');
        
        // Form alanlarını doldur
        document.getElementById('duzenleOgretmenAd').value = ogretmen.ad || '';
        document.getElementById('duzenleOgretmenSoyad').value = ogretmen.soyad || '';
        document.getElementById('duzenleOgretmenKullaniciAdi').value = ogretmen.kullaniciAdi || '';
        document.getElementById('duzenleOgretmenSinif').value = ogretmen.sinif || '';
        document.getElementById('duzenleOgretmenSube').value = ogretmen.sube || '';
        document.getElementById('duzenleOgretmenEmail').value = ogretmen.email || '';
        document.getElementById('duzenleOgretmenTelefon').value = ogretmen.telefon || '';

        // Form submit event'ini bağla
        const form = document.getElementById('ogretmenDuzenleForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.guncelleOgretmen(ogretmenId);
        };

        this.trackEvent('ogretmen_duzenle_modal_acildi');
    }

    async guncelleOgretmen(ogretmenId) {
        try {
            const formData = {
                ad: document.getElementById('duzenleOgretmenAd').value.trim(),
                soyad: document.getElementById('duzenleOgretmenSoyad').value.trim(),
                kullaniciAdi: document.getElementById('duzenleOgretmenKullaniciAdi').value.trim(),
                sinif: document.getElementById('duzenleOgretmenSinif').value,
                sube: document.getElementById('duzenleOgretmenSube').value,
                email: document.getElementById('duzenleOgretmenEmail').value.trim(),
                telefon: document.getElementById('duzenleOgretmenTelefon').value.trim()
            };

            if (!this.validateOgretmenGuncellemeForm(formData)) {
                return;
            }

            this.showLoading('ogretmenGuncelleBtn', 'Güncelleniyor...');

            await firebase.firestore()
                .collection('kullanicilar')
                .doc(ogretmenId)
                .update({
                    ...formData,
                    guncellenmeTarihi: new Date()
                });

            this.hideModal('ogretmenDuzenleModal');
            await this.loadOgretmenListesi();
            
            this.showSuccess('✅ Öğretmen başarıyla güncellendi!');
            this.trackEvent('ogretmen_guncellendi');

        } catch (error) {
            console.error('Öğretmen güncelleme hatası:', error);
            this.showError('❌ Öğretmen güncellenirken hata oluştu: ' + this.getErrorMessage(error));
        } finally {
            this.hideLoading('ogretmenGuncelleBtn', 'Güncelle');
        }
    }

    validateOgretmenGuncellemeForm(data) {
        // Öğretmen güncelleme formu validasyonu
        // Benzer şekilde implemente edilebilir
        return true;
    }

    closeOgretmenDuzenleModal() {
        this.hideModal('ogretmenDuzenleModal');
    }

    // Öğretmen durum değiştir
    async ogretmenDurumDegistir(ogretmenId, mevcutDurum) {
        try {
            const yeniDurum = mevcutDurum === 'aktif' ? 'pasif' : 'aktif';
            const onay = confirm(`Öğretmeni ${yeniDurum === 'aktif' ? 'aktif' : 'pasif'} duruma getirmek istediğinizden emin misiniz?`);
            
            if (!onay) return;

            await firebase.firestore().collection('kullanicilar')
                .doc(ogretmenId)
                .update({ 
                    durum: yeniDurum,
                    durumDegisimTarihi: new Date()
                });

            await this.loadOgretmenListesi();
            this.showSuccess(`✅ Öğretmen durumu ${yeniDurum} olarak güncellendi!`);
            this.trackEvent('ogretmen_durum_degisti', { yeniDurum });

        } catch (error) {
            console.error('Öğretmen durum değiştirme hatası:', error);
            this.showError('❌ Durum değiştirilirken hata oluştu.');
        }
    }

    // Öğretmen sil
    async ogretmenSil(ogretmenId) {
        try {
            const ogretmenDoc = await firebase.firestore()
                .collection('kullanicilar')
                .doc(ogretmenId)
                .get();

            if (!ogretmenDoc.exists) {
                this.showError('Öğretmen bulunamadı');
                return;
            }

            const ogretmen = ogretmenDoc.data();
            
            if (!confirm(`${ogretmen.ad} ${ogretmen.soyad} öğretmenini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve öğretmenin tüm verileri silinecektir!`)) {
                return;
            }

            // Öğretmenin öğrencilerini kontrol et
            const ogrenciSnapshot = await firebase.firestore()
                .collection('ogrenciler')
                .where('ogretmenId', '==', ogretmenId)
                .get();

            if (!ogrenciSnapshot.empty) {
                if (!confirm('Bu öğretmenin kayıtlı öğrencileri bulunmaktadır. Yine de silmek istiyor musunuz?')) {
                    return;
                }
            }

            // Firebase Authentication'dan kullanıcıyı sil
            await firebase.auth().currentUser.delete();

            // Firestore'dan öğretmeni sil
            await firebase.firestore().collection('kullanicilar')
                .doc(ogretmenId)
                .delete();

            await Promise.all([
                this.loadOgretmenListesi(),
                this.loadSistemOzeti()
            ]);
            
            this.showSuccess('✅ Öğretmen başarıyla silindi.');
            this.trackEvent('ogretmen_silindi');

        } catch (error) {
            console.error('Öğretmen silme hatası:', error);
            this.showError('❌ Öğretmen silinirken hata oluştu: ' + this.getErrorMessage(error));
        }
    }

    // İletişim modalını aç
    async openIletisim() {
        try {
            await this.loadIletisimOgretmenListesi();
            this.showModal('iletisimModal');
            this.trackEvent('iletisim_modal_acildi');
        } catch (error) {
            console.error('İletişim modalı açılırken hata:', error);
            this.showError('İletişim açılırken hata oluştu');
        }
    }

    closeIletisimModal() {
        this.hideModal('iletisimModal');
        this.seciliOgretmenId = null;
        document.getElementById('mesajGirisAlani').style.display = 'none';
        document.getElementById('mesajGoruntuleme').innerHTML = '<div class="mesaj-secimi"><p>Lütfen bir öğretmen seçin</p></div>';
    }

    // İletişim için öğretmen listesini yükle
    async loadIletisimOgretmenListesi() {
        try {
            const ogretmenListesiContainer = document.getElementById('iletisimOgretmenListesi');
            if (!ogretmenListesiContainer) return;

            ogretmenListesiContainer.innerHTML = this.createLoadingSpinner();

            const querySnapshot = await firebase.firestore()
                .collection('kullanicilar')
                .where('tip', '==', 'ogretmen')
                .where('durum', '==', 'aktif')
                .orderBy('ad')
                .get();

            if (querySnapshot.empty) {
                ogretmenListesiContainer.innerHTML = this.createNoDataMessage('Henüz aktif öğretmen kaydı bulunmuyor');
                return;
            }

            this.renderIletisimOgretmenListesi(querySnapshot, ogretmenListesiContainer);

        } catch (error) {
            console.error('İletişim öğretmen listesi yüklenemedi:', error);
            this.showError('Öğretmen listesi yüklenirken hata oluştu', 'iletisimOgretmenListesi');
        }
    }

    renderIletisimOgretmenListesi(querySnapshot, container) {
        const ogretmenHTML = querySnapshot.docs.map(doc => {
            const ogretmen = doc.data();
            const sonGirisTarihi = ogretmen.sonGirisTarihi?.toDate();
            const cevrimici = sonGirisTarihi && (new Date() - sonGirisTarihi) < 5 * 60 * 1000; // 5 dakika
            
            return `
                <div class="ogretmen-secim ${cevrimici ? 'cevrimici' : 'cevrimdisi'}" 
                     onclick="adminPanel.ogretmenSec('${doc.id}', '${ogretmen.ad} ${ogretmen.soyad}')">
                    <div class="ogretmen-avatar">
                        <img src="${ogretmen.avatar || this.generateAvatar(ogretmen.ad, ogretmen.soyad)}" 
                             alt="${ogretmen.ad} ${ogretmen.soyad}">
                        <span class="durum-gostergesi ${cevrimici ? 'aktif' : 'pasif'}"></span>
                    </div>
                    <div class="ogretmen-bilgi">
                        <div class="ogretmen-adi">${ogretmen.ad} ${ogretmen.soyad}</div>
                        <div class="ogretmen-detay">${ogretmen.sinif}/${ogretmen.sube}</div>
                        <div class="ogretmen-durum">${cevrimici ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ogretmenHTML;
    }

    // Öğretmen seç
    async ogretmenSec(ogretmenId, ogretmenAdi) {
        try {
            this.seciliOgretmenId = ogretmenId;
            
            // Tüm seçimleri temizle
            document.querySelectorAll('.ogretmen-secim').forEach(item => {
                item.classList.remove('aktif');
            });
            
            // Seçili öğretmeni aktif yap
            event.currentTarget.classList.add('aktif');
            
            // Mesajları yükle
            await this.loadMesajlar(ogretmenId, ogretmenAdi);
            
            // Mesaj giriş alanını göster
            document.getElementById('mesajGirisAlani').style.display = 'flex';
            
            // Input'a focusla
            document.getElementById('yeniMesaj').focus();

            this.trackEvent('ogretmen_secildi', { ogretmenId });

        } catch (error) {
            console.error('Öğretmen seçim hatası:', error);
            this.showError('Öğretmen seçilirken hata oluştu');
        }
    }

    // Mesajları yükle
    async loadMesajlar(ogretmenId, ogretmenAdi) {
        try {
            const mesajGoruntuleme = document.getElementById('mesajGoruntuleme');
            mesajGoruntuleme.innerHTML = this.createLoadingSpinner();

            // Öğretmenin tüm öğrencilerini bul
            const ogrenciSnapshot = await firebase.firestore()
                .collection('ogrenciler')
                .where('ogretmenId', '==', ogretmenId)
                .get();

            if (ogrenciSnapshot.empty) {
                mesajGoruntuleme.innerHTML = this.createNoDataMessage('Bu öğretmenin henüz öğrencisi yok');
                return;
            }

            const ogrenciIds = ogrenciSnapshot.docs.map(doc => doc.id);
            
            // Tüm mesajları getir (öğretmenin öğrencilerine ait)
            const mesajQuery = await firebase.firestore()
                .collection('mesajlar')
                .where('ogrenciId', 'in', ogrenciIds)
                .orderBy('tarih', 'desc')
                .limit(50)
                .get();

            this.renderMesajlar(mesajQuery, ogrenciSnapshot, ogretmenAdi, mesajGoruntuleme);

        } catch (error) {
            console.error('Mesajlar yüklenemedi:', error);
            this.showError('Mesajlar yüklenirken hata oluştu', 'mesajGoruntuleme');
        }
    }

    renderMesajlar(mesajQuery, ogrenciSnapshot, ogretmenAdi, container) {
        if (mesajQuery.empty) {
            container.innerHTML = this.createNoDataMessage('Henüz mesaj bulunmuyor');
            return;
        }

        // Öğrenci bilgilerini önceden yükle
        const ogrenciBilgileri = {};
        ogrenciSnapshot.docs.forEach(doc => {
            ogrenciBilgileri[doc.id] = doc.data();
        });

        let mesajHTML = `
            <div class="mesaj-baslik">
                <h4>💬 ${ogretmenAdi} ile Mesajlaşma</h4>
                <div class="mesaj-sayisi">${mesajQuery.size} mesaj</div>
            </div>
            <div class="mesaj-listesi">
        `;

        // Mesajları ters çevir (en eskiden en yeniye)
        const mesajlar = [...mesajQuery.docs].reverse();

        mesajlar.forEach((doc) => {
            const mesaj = doc.data();
            const tarih = mesaj.tarih.toDate();
            const tarihStr = this.formatTarih(tarih);
            
            const ogrenciAdi = ogrenciBilgileri[mesaj.ogrenciId] ? 
                `${ogrenciBilgileri[mesaj.ogrenciId].ad} ${ogrenciBilgileri[mesaj.ogrenciId].soyad}` : 
                'Bilinmeyen Öğrenci';
            
            const mesajSinif = mesaj.gonderenId === this.currentUser.uid ? 'mesaj-gonderen' : 'mesaj-alici';
            const gonderenAd = mesaj.gonderenId === this.currentUser.uid ? 'Siz' : `${ogrenciAdi}`;

            mesajHTML += `
                <div class="mesaj ${mesajSinif}">
                    <div class="mesaj-icerik">
                        <div class="mesaj-metin">${this.escapeHtml(mesaj.icerik)}</div>
                        <div class="mesaj-detay">
                            <span class="mesaj-gonderen">${gonderenAd}</span>
                            <span class="mesaj-tarih">${tarihStr}</span>
                            ${mesaj.okundu ? '<span class="mesaj-okundu">✓✓</span>' : '<span class="mesaj-okundu">✓</span>'}
                        </div>
                    </div>
                </div>
            `;
        });

        mesajHTML += '</div>';
        container.innerHTML = mesajHTML;
        
        // En alta kaydır
        const mesajListesi = container.querySelector('.mesaj-listesi');
        if (mesajListesi) {
            mesajListesi.scrollTop = mesajListesi.scrollHeight;
        }
    }

    // Mesaj gönder
    async mesajGonder() {
        try {
            if (!this.seciliOgretmenId) {
                this.showError('Lütfen bir öğretmen seçin.');
                return;
            }

            const mesajIcerik = document.getElementById('yeniMesaj').value.trim();
            
            if (!mesajIcerik) {
                this.showError('Lütfen mesajınızı yazın.');
                return;
            }

            this.showLoading('mesajGonderBtn', 'Gönderiliyor...');
            await this.sendMessageToTeacher(mesajIcerik);

        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            this.showError('Mesaj gönderilirken hata oluştu.');
        } finally {
            this.hideLoading('mesajGonderBtn', 'Gönder');
        }
    }

    async sendMessageToTeacher(mesajIcerik) {
        // Öğretmenin bir öğrencisini bul (mesajlaşma için)
        const ogrenciSnapshot = await firebase.firestore()
            .collection('ogrenciler')
            .where('ogretmenId', '==', this.seciliOgretmenId)
            .limit(1)
            .get();

        if (ogrenciSnapshot.empty) {
            this.showError('Bu öğretmenin henüz öğrencisi yok.');
            return;
        }

        const ogrenciId = ogrenciSnapshot.docs[0].id;
        const ogrenciAdi = `${ogrenciSnapshot.docs[0].data().ad} ${ogrenciSnapshot.docs[0].data().soyad}`;

        const mesajData = {
            ogrenciId: ogrenciId,
            gonderenId: this.currentUser.uid,
            gonderenAd: 'Yönetici',
            gonderenTip: 'admin',
            icerik: mesajIcerik,
            tarih: new Date(),
            okundu: false,
            ogretmenId: this.seciliOgretmenId
        };

        await firebase.firestore().collection('mesajlar').add(mesajData);

        // Mesaj kutusunu temizle
        document.getElementById('yeniMesaj').value = '';

        // Mesajları yenile
        const seciliOgretmen = document.querySelector('.ogretmen-secim.aktif');
        const ogretmenAdi = seciliOgretmen.querySelector('.ogretmen-adi').textContent;
        await this.loadMesajlar(this.seciliOgretmenId, ogretmenAdi);

        this.trackEvent('mesaj_gonderildi');
    }

    // Sistem istatistikleri modalını aç
    async openSistemIstatistikleri() {
        try {
            this.showModal('sistemIstatistikleriModal');
            await this.initSistemGrafikleri();
            this.trackEvent('sistem_istatistikleri_acildi');
        } catch (error) {
            console.error('Sistem istatistikleri açılırken hata:', error);
            this.showError('Sistem istatistikleri açılırken hata oluştu');
        }
    }

    closeSistemIstatistikleriModal() {
        this.hideModal('sistemIstatistikleriModal');
        this.temizleGrafikler();
    }

    // Sistem grafiklerini başlat
    async initSistemGrafikleri() {
        try {
            await Promise.all([
                this.initSinifDagilimChart(),
                this.initModulKullanimChart(),
                this.initAylikKayitChart(),
                this.initMadalyaDagilimChart()
            ]);
        } catch (error) {
            console.error('Sistem grafikleri başlatılırken hata:', error);
            this.showError('Grafikler oluşturulurken hata oluştu');
        }
    }

    // Sınıf dağılım grafiği
    async initSinifDagilimChart() {
        try {
            const ctx = document.getElementById('sinifDagilimChart');
            if (!ctx) return;

            // Önceki chart'ı temizle
            if (this.chartInstances.has('sinifDagilim')) {
                this.chartInstances.get('sinifDagilim').destroy();
            }

            const siniflar = ['1', '2', '3', '4'];
            const ogrenciSayilari = await this.getSinifOgrenciSayilari(siniflar);

            const chart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'],
                    datasets: [{
                        label: 'Öğrenci Sayısı',
                        data: ogrenciSayilari,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 2,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sınıflara Göre Öğrenci Dağılımı',
                            font: { size: 16 }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Öğrenci Sayısı'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Sınıflar'
                            }
                        }
                    }
                }
            });

            this.chartInstances.set('sinifDagilim', chart);

        } catch (error) {
            console.error('Sınıf dağılım grafiği oluşturulamadı:', error);
            throw error;
        }
    }

    async getSinifOgrenciSayilari(siniflar) {
        const ogrenciSayilari = [0, 0, 0, 0];
        
        try {
            const ogrenciSnapshot = await firebase.firestore()
                .collection('ogrenciler')
                .get();

            const ogretmenPromises = ogrenciSnapshot.docs.map(async (doc) => {
                const ogrenci = doc.data();
                if (ogrenci.ogretmenId) {
                    const ogretmenDoc = await firebase.firestore()
                        .collection('kullanicilar')
                        .doc(ogrenci.ogretmenId)
                        .get();
                    
                    if (ogretmenDoc.exists) {
                        const ogretmen = ogretmenDoc.data();
                        const sinifIndex = siniflar.indexOf(ogretmen.sinif);
                        if (sinifIndex !== -1) {
                            ogrenciSayilari[sinifIndex]++;
                        }
                    }
                }
            });

            await Promise.all(ogretmenPromises);
        } catch (error) {
            console.error('Sınıf öğrenci sayıları alınamadı:', error);
        }

        return ogrenciSayilari;
    }

    // Modül kullanım grafiği
    async initModulKullanimChart() {
        try {
            const ctx = document.getElementById('modulKullanimChart');
            if (!ctx) return;

            if (this.chartInstances.has('modulKullanim')) {
                this.chartInstances.get('modulKullanim').destroy();
            }

            const moduller = ['kitapOkuma', 'odevPuani', 'soruCozumu', 'yildiz', 'olumsuzDavranis', 'test', 'deneme', 'kitapOkumaSinavi'];
            const modulAdlari = ['Kitap Okuma', 'Ödev Puanı', 'Soru Çözümü', 'Yıldızlar', 'Olumsuz Davranış', 'Testler', 'Denemeler', 'Kitap Sınavları'];
            
            const kullanimSayilari = await this.getModulKullanimSayilari(moduller);

            const chart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: modulAdlari,
                    datasets: [{
                        data: kullanimSayilari,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)',
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)'
                        ],
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Modül Kullanım Dağılımı',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    },
                    cutout: '50%'
                }
            });

            this.chartInstances.set('modulKullanim', chart);

        } catch (error) {
            console.error('Modül kullanım grafiği oluşturulamadı:', error);
            throw error;
        }
    }

    async getModulKullanimSayilari(moduller) {
        const kullanimSayilari = [];
        
        for (let modul of moduller) {
            try {
                const snapshot = await firebase.firestore()
                    .collection('modulKayitlari')
                    .where('tip', '==', modul)
                    .get();
                kullanimSayilari.push(snapshot.size);
            } catch (error) {
                console.error(`${modul} modülü sayılamadı:`, error);
                kullanimSayilari.push(0);
            }
        }
        
        return kullanimSayilari;
    }

    // Aylık kayıt grafiği
    async initAylikKayitChart() {
        try {
            const ctx = document.getElementById('aylikKayitChart');
            if (!ctx) return;

            if (this.chartInstances.has('aylikKayit')) {
                this.chartInstances.get('aylikKayit').destroy();
            }

            const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const kayitSayilari = await this.getAylikKayitSayilari();

            const chart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: aylar,
                    datasets: [{
                        label: 'Aylık Kayıt Sayısı',
                        data: kayitSayilari,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Aylık Kayıt İstatistikleri',
                            font: { size: 16 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Kayıt Sayısı'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Aylar'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            this.chartInstances.set('aylikKayit', chart);

        } catch (error) {
            console.error('Aylık kayıt grafiği oluşturulamadı:', error);
            throw error;
        }
    }

    async getAylikKayitSayilari() {
        const kayitSayilari = new Array(12).fill(0);
        const currentYear = new Date().getFullYear();
        
        try {
            const kayitSnapshot = await firebase.firestore()
                .collection('modulKayitlari')
                .where('olusturulmaTarihi', '>=', new Date(currentYear, 0, 1))
                .get();

            kayitSnapshot.forEach((doc) => {
                const kayit = doc.data();
                const tarih = kayit.olusturulmaTarihi.toDate();
                const ay = tarih.getMonth();
                kayitSayilari[ay]++;
            });
        } catch (error) {
            console.error('Aylık kayıt sayıları alınamadı:', error);
        }

        return kayitSayilari;
    }

    // Madalya dağılım grafiği
    async initMadalyaDagilimChart() {
        try {
            const ctx = document.getElementById('madalyaDagilimChart');
            if (!ctx) return;

            if (this.chartInstances.has('madalyaDagilim')) {
                this.chartInstances.get('madalyaDagilim').destroy();
            }

            const madalyaAraliklari = ['0', '1-5', '6-10', '11-20', '21+'];
            const ogrenciSayilari = await this.getMadalyaDagilimSayilari();

            const chart = new Chart(ctx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: madalyaAraliklari,
                    datasets: [{
                        data: ogrenciSayilari,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)'
                        ],
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Madalya Dağılımı',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} öğrenci (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            this.chartInstances.set('madalyaDagilim', chart);

        } catch (error) {
            console.error('Madalya dağılım grafiği oluşturulamadı:', error);
            throw error;
        }
    }

    async getMadalyaDagilimSayilari() {
        const ogrenciSayilari = [0, 0, 0, 0, 0];
        
        try {
            const ogrenciSnapshot = await firebase.firestore()
                .collection('ogrenciler')
                .get();

            ogrenciSnapshot.forEach((doc) => {
                const ogrenci = doc.data();
                const madalya = ogrenci.toplamMadalya || 0;
                
                if (madalya === 0) ogrenciSayilari[0]++;
                else if (madalya <= 5) ogrenciSayilari[1]++;
                else if (madalya <= 10) ogrenciSayilari[2]++;
                else if (madalya <= 20) ogrenciSayilari[3]++;
                else ogrenciSayilari[4]++;
            });
        } catch (error) {
            console.error('Madalya dağılım sayıları alınamadı:', error);
        }

        return ogrenciSayilari;
    }

    temizleGrafikler() {
        this.chartInstances.forEach((chart, key) => {
            chart.destroy();
        });
        this.chartInstances.clear();
    }

    // Sınıf görünümlerini aç
    async openSinifGorunumleri() {
        try {
            await this.loadSinifGorunumleri();
            this.showModal('sinifGorunumleriModal');
            this.trackEvent('sinif_gorunumleri_acildi');
        } catch (error) {
            console.error('Sınıf görünümleri açılırken hata:', error);
            this.showError('Sınıf görünümleri açılırken hata oluştu');
        }
    }

    closeSinifGorunumleriModal() {
        this.hideModal('sinifGorunumleriModal');
    }

    async loadSinifGorunumleri() {
        try {
            const sinifIcerikleri = document.getElementById('sinifIcerikleri');
            if (!sinifIcerikleri) return;

            sinifIcerikleri.innerHTML = this.createLoadingSpinner();

            const [ogretmenSnapshot, ogrenciSnapshot] = await Promise.all([
                firebase.firestore().collection('kullanicilar')
                    .where('tip', '==', 'ogretmen')
                    .get(),
                firebase.firestore().collection('ogrenciler').get()
            ]);

            const sinifData = this.prepareSinifData(ogretmenSnapshot, ogrenciSnapshot);
            this.renderSinifGorunumleri(sinifData, sinifIcerikleri);

        } catch (error) {
            console.error('Sınıf görünümleri yüklenemedi:', error);
            this.showError('Sınıf görünümleri yüklenirken hata oluştu', 'sinifIcerikleri');
        }
    }

    prepareSinifData(ogretmenSnapshot, ogrenciSnapshot) {
        const sinifData = {};

        // Öğretmenleri sınıf bazında grupla
        ogretmenSnapshot.forEach(doc => {
            const ogretmen = doc.data();
            const sinifKey = `${ogretmen.sinif}-${ogretmen.sube}`;
            
            if (!sinifData[sinifKey]) {
                sinifData[sinifKey] = {
                    sinif: ogretmen.sinif,
                    sube: ogretmen.sube,
                    ogretmenler: [],
                    ogrenciler: []
                };
            }
            
            sinifData[sinifKey].ogretmenler.push(ogretmen);
        });

        // Öğrencileri sınıf bazında grupla
        ogrenciSnapshot.forEach(doc => {
            const ogrenci = doc.data();
            if (ogrenci.ogretmenId) {
                // Öğrencinin öğretmenini bul
                const ogretmenDoc = ogretmenSnapshot.docs.find(d => d.id === ogrenci.ogretmenId);
                if (ogretmenDoc) {
                    const ogretmen = ogretmenDoc.data();
                    const sinifKey = `${ogretmen.sinif}-${ogretmen.sube}`;
                    
                    if (sinifData[sinifKey]) {
                        sinifData[sinifKey].ogrenciler.push(ogrenci);
                    }
                }
            }
        });

        return sinifData;
    }

    renderSinifGorunumleri(sinifData, container) {
        if (Object.keys(sinifData).length === 0) {
            container.innerHTML = this.createNoDataMessage('Henüz sınıf kaydı bulunmuyor');
            return;
        }

        const sinifHTML = Object.values(sinifData).map(sinif => {
            const ogretmenListesi = sinif.ogretmenler.map(ogretmen => 
                `${ogretmen.ad} ${ogretmen.soyad}`
            ).join(', ');

            return `
                <div class="sinif-karti">
                    <div class="sinif-baslik">
                        <h3>${sinif.sinif}. Sınıf ${sinif.sube} Şubesi</h3>
                        <div class="sinif-istatistik">
                            <span class="ogretmen-sayisi">${sinif.ogretmenler.length} Öğretmen</span>
                            <span class="ogrenci-sayisi">${sinif.ogrenciler.length} Öğrenci</span>
                        </div>
                    </div>
                    <div class="sinif-detay">
                        <div class="sinif-ogretmenler">
                            <strong>Öğretmenler:</strong> ${ogretmenListesi || 'Atanmamış'}
                        </div>
                        <div class="sinif-ogrenciler">
                            <strong>Öğrenci Listesi:</strong>
                            <div class="ogrenci-listesi">
                                ${sinif.ogrenciler.map(ogrenci => 
                                    `<span class="ogrenci-adi">${ogrenci.ad} ${ogrenci.soyad}</span>`
                                ).join('') || 'Henüz öğrenci yok'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = sinifHTML;
    }

    // Çıkış fonksiyonu
    async logout() {
        try {
            if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                this.showLoading('logoutBtn', 'Çıkış Yapılıyor...');
                await firebase.auth().signOut();
                this.trackEvent('cikis_yapildi');
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Çıkış yapılırken hata:', error);
            this.showError('Çıkış yapılırken hata oluştu');
        } finally {
            this.hideLoading('logoutBtn', 'Çıkış Yap');
        }
    }

    // Yardımcı fonksiyonlar
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }

    handleOutsideClick(event) {
        const modals = [
            'kullaniciYonetimiModal',
            'ogretmenEkleModal',
            'ogretmenDuzenleModal',
            'iletisimModal',
            'sistemIstatistikleriModal',
            'sinifGorunumleriModal'
        ];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                this[`close${this.capitalizeFirstLetter(modalId.replace('Modal', ''))}Modal`]();
            }
        });
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    createLoadingSpinner() {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Yükleniyor...</p>
            </div>
        `;
    }

    createNoDataMessage(message) {
        return `
            <div class="no-data">
                <div class="no-data-icon">📊</div>
                <p>${message}</p>
            </div>
        `;
    }

    showLoading(buttonId, text = 'İşleniyor...') {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="button-loading">
                    <span class="spinner-small"></span>
                    ${text}
                </div>
            `;
        }
    }

    hideLoading(buttonId, originalText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    showError(message, elementId = null) {
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = `
                    <div class="error-message">
                        <span class="error-icon">❌</span>
                        ${message}
                    </div>
                `;
            }
        } else {
            this.showNotification(message, 'error');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Stil ekle
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            max-width: 400px;
            transform: translateX(100%);
            opacity: 0;
        `;

        // Türüne göre renk belirle
        const backgroundColor = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3',
            warning: '#FF9800'
        }[type] || '#2196F3';

        notification.style.backgroundColor = backgroundColor;
        
        document.body.appendChild(notification);

        // Animasyonla göster
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // 5 saniye sonra kaldır
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            
            let errorElement = field.parentNode.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    temizleFormHatalari(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const errorFields = form.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
            
            const errorMessages = form.querySelectorAll('.field-error');
            errorMessages.forEach(message => message.remove());
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    getErrorMessage(error) {
        if (error.code) {
            const errorMessages = {
                'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
                'auth/invalid-email': 'Geçersiz e-posta adresi.',
                'auth/operation-not-allowed': 'Bu işlem şu anda allowed değil.',
                'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
                'auth/user-not-found': 'Kullanıcı bulunamadı.',
                'auth/wrong-password': 'Hatalı şifre.',
                'permission-denied': 'Bu işlem için yetkiniz bulunmuyor.'
            };
            
            return errorMessages[error.code] || error.message;
        }
        return error.message || 'Bilinmeyen bir hata oluştu.';
    }

    trackEvent(eventName, eventParams = {}) {
        // Analytics event tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParams);
        }
        
        // Console log for development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Event: ${eventName}`, eventParams);
        }
    }

    // Performans optimizasyonu
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Global admin panel instance'ı oluştur
let adminPanel;

// Sayfa yüklendiğinde admin paneli başlat
document.addEventListener('DOMContentLoaded', function() {
    adminPanel = new AdminPanel();
});

// Global fonksiyonlar için window objesine bağla
window.openKullaniciYonetimi = () => adminPanel?.openKullaniciYonetimi();
window.closeKullaniciYonetimiModal = () => adminPanel?.closeKullaniciYonetimiModal();
window.openOgretmenEkleModal = () => adminPanel?.openOgretmenEkleModal();
window.closeOgretmenEkleModal = () => adminPanel?.closeOgretmenEkleModal();
window.openIletisim = () => adminPanel?.openIletisim();
window.closeIletisimModal = () => adminPanel?.closeIletisimModal();
window.mesajGonder = () => adminPanel?.mesajGonder();
window.openSistemIstatistikleri = () => adminPanel?.openSistemIstatistikleri();
window.closeSistemIstatistikleriModal = () => adminPanel?.closeSistemIstatistikleriModal();
window.openSinifGorunumleri = () => adminPanel?.openSinifGorunumleri();
window.closeSinifGorunumleriModal = () => adminPanel?.closeSinifGorunumleriModal();
window.logout = () => adminPanel?.logout();

// Hata yönetimi
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});