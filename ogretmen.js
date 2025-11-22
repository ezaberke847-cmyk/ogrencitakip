<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Öğretmen Paneli</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="teacher-panel">
        <header>
            <h1>ÖĞRETMEN PANELİ</h1>
            <div class="user-info">
                <span id="teacherName">Hoş Geldiniz</span>
                <button onclick="logout()">Çıkış</button>
            </div>
        </header>

        <div class="dashboard-summary">
            <div class="summary-card">
                <h3>Toplam Öğrenci</h3>
                <div id="toplamOgrenci" class="summary-value">0</div>
            </div>
            <div class="summary-card">
                <h3>Toplam Madalya</h3>
                <div id="toplamMadalya" class="summary-value">0</div>
            </div>
            <div class="summary-card">
                <h3>Ortalama Puan</h3>
                <div id="ortalamaPuan" class="summary-value">0</div>
            </div>
            <div class="summary-card">
                <h3>Toplam Kitap Sayfası</h3>
                <div id="toplamKitap" class="summary-value">0</div>
            </div>
        </div>

        <div class="panel-actions">
            <button class="btn-primary" onclick="openOgrenciKayitModal()">Yeni Öğrenci Ekle</button>
            <button class="btn-secondary" onclick="tumOgrencilerinPuanlariniHesapla()">Puanları Yeniden Hesapla</button>
            
            <div class="sorting-options">
                <label for="siralamaSec">Sırala:</label>
                <select id="siralamaSec" onchange="sortOgrenciler(this.value)">
                    <option value="puan">Puana Göre</option>
                    <option value="madalya">Madalyaya Göre</option>
                    <option value="isim">İsme Göre</option>
                    <option value="numara">Numaraya Göre</option>
                </select>
            </div>
        </div>

        <div class="modules-grid" id="modulesGrid">
            <!-- Modüller buraya dinamik olarak eklenecek -->
        </div>

        <div class="students-section">
            <h2>Öğrenci Listesi</h2>
            <div id="ogrenciListesi" class="students-grid">
                <!-- Öğrenci kartları buraya eklenecek -->
            </div>
        </div>

        <div class="charts-container">
            <h2>Öğrenci İstatistikleri</h2>
            <div class="charts-grid">
                <div class="chart-item">
                    <h3>Kitap Okuma</h3>
                    <canvas id="kitapOkumaChart"></canvas>
                </div>
                <div class="chart-item">
                    <h3>Ödev Puanı</h3>
                    <canvas id="odevPuaniChart"></canvas>
                </div>
                <div class="chart-item">
                    <h3>Soru Çözümü</h3>
                    <canvas id="soruCozumuChart"></canvas>
                </div>
                <div class="chart-item">
                    <h3>Deneme Sınavı</h3>
                    <canvas id="denemeChart"></canvas>
                </div>
                <div class="chart-item">
                    <h3>Yıldızlar</h3>
                    <canvas id="yildizChart"></canvas>
                </div>
                <div class="chart-item">
                    <h3>Olumsuz Davranış</h3>
                    <canvas id="olumsuzDavranisChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <!-- Öğrenci Kayıt Modal -->
    <div id="ogrenciKayitModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeOgrenciKayitModal()">&times;</span>
            <h2>Yeni Öğrenci Kaydı</h2>
            <form id="ogrenciKayitForm">
                <div class="form-group">
                    <label for="ogrenciAdi">Öğrenci Adı:</label>
                    <input type="text" id="ogrenciAdi" required>
                </div>
                <div class="form-group">
                    <label for="ogrenciSoyadi">Öğrenci Soyadı:</label>
                    <input type="text" id="ogrenciSoyadi" required>
                </div>
                <div class="form-group">
                    <label for="ogrenciNo">Öğrenci No:</label>
                    <input type="text" id="ogrenciNo" required>
                </div>
                <div class="form-group">
                    <label for="ogrenciFoto">Fotoğraf URL:</label>
                    <input type="text" id="ogrenciFoto" placeholder="https://...">
                </div>
                
                <h3>Veli Bilgileri</h3>
                <div class="form-group">
                    <label for="veliAdi">Veli Adı:</label>
                    <input type="text" id="veliAdi" required>
                </div>
                <div class="form-group">
                    <label for="veliSoyadi">Veli Soyadı:</label>
                    <input type="text" id="veliSoyadi" required>
                </div>
                <div class="form-group">
                    <label for="veliKullaniciAdi">Veli Kullanıcı Adı:</label>
                    <input type="text" id="veliKullaniciAdi" required>
                </div>
                <div class="form-group">
                    <label for="veliSifre">Veli Şifre:</label>
                    <input type="password" id="veliSifre" required>
                </div>
                <div class="form-group">
                    <label for="veliTelefon">Veli Telefon:</label>
                    <input type="tel" id="veliTelefon">
                </div>
                <div class="form-group">
                    <label for="veliYakinlik">Yakınlık Derecesi:</label>
                    <select id="veliYakinlik">
                        <option value="anne">Anne</option>
                        <option value="baba">Baba</option>
                        <option value="kardes">Kardeş</option>
                        <option value="diger">Diğer</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeOgrenciKayitModal()" class="btn-secondary">İptal</button>
                    <button type="submit" class="btn-primary">Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Diğer modallar buraya eklenecek -->
    <!-- Kitap Okuma Modal -->
    <div id="kitapOkumaModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeKitapOkumaModal()">&times;</span>
            <h2>Kitap Okuma Kaydı</h2>
            <form id="kitapOkumaForm">
                <div class="form-group">
                    <label for="kitapOgrenciSelect">Öğrenci:</label>
                    <select id="kitapOgrenciSelect" required></select>
                </div>
                <div class="form-group">
                    <label for="kitapTarih">Tarih:</label>
                    <input type="date" id="kitapTarih" required>
                </div>
                <div class="form-group">
                    <label for="kitapSayfaSayisi">Sayfa Sayısı:</label>
                    <input type="number" id="kitapSayfaSayisi" min="0">
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="kitapOkunmadi">
                    <label for="kitapOkunmadi">Değer girilmedi</label>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeKitapOkumaModal()" class="btn-secondary">İptal</button>
                    <button type="button" onclick="kitapOkumaKaydet()" class="btn-primary">Kaydet</button>
                    <button type="button" onclick="openKitapOkumaGecmisi()" class="btn-info">Geçmiş</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Ödev Puanı Modal -->
    <div id="odevPuaniModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeOdevPuaniModal()">&times;</span>
            <h2>Ödev Puanı Kaydı</h2>
            <form id="odevPuaniForm">
                <div class="form-group">
                    <label for="odevOgrenciSelect">Öğrenci:</label>
                    <select id="odevOgrenciSelect" required></select>
                </div>
                <div class="form-group">
                    <label for="odevTarih">Tarih:</label>
                    <input type="date" id="odevTarih" required>
                </div>
                <div class="form-group">
                    <label for="odevPuan">Puan:</label>
                    <select id="odevPuan">
                        <option value="5">5</option>
                        <option value="4">4</option>
                        <option value="3">3</option>
                        <option value="2">2</option>
                        <option value="1">1</option>
                    </select>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="odevYapilmadi">
                    <label for="odevYapilmadi">Değer girilmedi</label>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeOdevPuaniModal()" class="btn-secondary">İptal</button>
                    <button type="button" onclick="odevPuaniKaydet()" class="btn-primary">Kaydet</button>
                    <button type="button" onclick="openOdevPuaniGecmisi()" class="btn-info">Geçmiş</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Diğer modüller için modallar benzer şekilde eklenecek -->

    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    
    <script>
        // Firebase konfigürasyonu
        const firebaseConfig = {
            apiKey: "your-api-key",
            authDomain: "your-auth-domain",
            projectId: "your-project-id",
            storageBucket: "your-storage-bucket",
            messagingSenderId: "your-messaging-sender-id",
            appId: "your-app-id"
        };

        // Firebase'i başlat
        firebase.initializeApp(firebaseConfig);

        // Global değişkenler
        let currentUser = null;
        let mevcutOgrenciListesi = [];

        // Ana uygulama sınıfı
        class OgretmenPaneli {
            constructor() {
                this.init();
            }

            async init() {
                await this.checkAuthState();
                await this.loadModules();
                this.initEventListeners();
            }

            async checkAuthState() {
                return new Promise((resolve) => {
                    firebase.auth().onAuthStateChanged(async (user) => {
                        if (user && user.email.includes('@ogretmen.sistem.com')) {
                            currentUser = user;
                            await this.loadTeacherData();
                            await this.loadOgrenciListesi();
                            await this.initDashboard();
                            resolve();
                        } else {
                            window.location.href = 'index.html';
                        }
                    });
                });
            }

            async loadTeacherData() {
                try {
                    const userDoc = await firebase.firestore().collection('kullanicilar')
                        .doc(currentUser.uid).get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        document.getElementById('teacherName').textContent = 
                            `Hoş geldiniz, ${userData.kullaniciAdi}`;
                    }
                } catch (error) {
                    console.error('Öğretmen verisi yüklenemedi:', error);
                    this.showError('Öğretmen verisi yüklenirken hata oluştu.');
                }
            }

            async loadModules() {
                const modules = [
                    { id: 'kitapOkuma', name: '📚 Kitap Okuma', color: '#3498db', icon: '📖' },
                    { id: 'odevPuani', name: '📝 Ödev Puanı', color: '#2ecc71', icon: '✏️' },
                    { id: 'soruCozumu', name: '🔢 Soru Çözümü', color: '#9b59b6', icon: '🧮' },
                    { id: 'deneme', name: '📊 Deneme Sınavı', color: '#e74c3c', icon: '📈' },
                    { id: 'test', name: '📝 Test', color: '#f39c12', icon: '📋' },
                    { id: 'kitapSinav', name: '📚 Kitap Sınavı', color: '#1abc9c', icon: '📘' },
                    { id: 'yildiz', name: '⭐ Yıldızlar', color: '#f1c40f', icon: '⭐' },
                    { id: 'olumsuzDavranis', name: '⚠️ Olumsuz Davranış', color: '#95a5a6', icon: '🚫' }
                ];

                const modulesGrid = document.getElementById('modulesGrid');
                modulesGrid.innerHTML = modules.map(module => `
                    <div class="module-card" style="border-color: ${module.color}" 
                         onclick="open${this.capitalizeFirstLetter(module.id)}Modal()">
                        <div class="module-icon" style="background-color: ${module.color}">
                            ${module.icon}
                        </div>
                        <div class="module-name">${module.name}</div>
                    </div>
                `).join('');
            }

            capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            initEventListeners() {
                // Form event listener'ları
                document.getElementById('ogrenciKayitForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.ogrenciVeVeliKaydet();
                });

                // Kitap okuma event listener'ları
                document.getElementById('kitapOkunmadi').addEventListener('change', (e) => {
                    const sayfaInput = document.getElementById('kitapSayfaSayisi');
                    sayfaInput.disabled = e.target.checked;
                    if (e.target.checked) sayfaInput.value = '';
                });

                // Ödev puanı event listener'ları
                document.getElementById('odevYapilmadi').addEventListener('change', (e) => {
                    const puanSelect = document.getElementById('odevPuan');
                    puanSelect.disabled = e.target.checked;
                    if (e.target.checked) puanSelect.value = '';
                });
            }

            showError(message) {
                alert(`❌ ${message}`);
            }

            showSuccess(message) {
                alert(`✅ ${message}`);
            }

            showLoading(button, text = 'İşleniyor...') {
                button.disabled = true;
                button.textContent = text;
            }

            hideLoading(button, originalText) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }

        // Öğrenci yönetimi sınıfı
        class OgrenciYonetimi {
            constructor() {
                this.ogrenciKayitForm = document.getElementById('ogrenciKayitForm');
            }

            async ogrenciVeVeliKaydet() {
                const submitBtn = this.ogrenciKayitForm.querySelector('.btn-primary');
                const originalText = submitBtn.textContent;
                
                try {
                    this.showLoading(submitBtn, 'Kaydediliyor...');

                    const ogrenciData = this.getOgrenciData();
                    const veliData = this.getVeliData();
                    const veliSifre = document.getElementById('veliSifre').value;

                    // 1. Veli için Firebase Authentication hesabı oluştur
                    const veliEmail = `${veliData.kullaniciAdi}@veli.sistem.com`;
                    const veliUserCredential = await firebase.auth().createUserWithEmailAndPassword(veliEmail, veliSifre);
                    const veliUserId = veliUserCredential.user.uid;

                    // 2. Veli bilgilerini Firestore'a kaydet
                    await firebase.firestore().collection('kullanicilar').doc(veliUserId).set(veliData);

                    // 3. Öğrenciyi Firestore'a kaydet
                    ogrenciData.veliId = veliUserId;
                    const ogrenciRef = await firebase.firestore().collection('ogrenciler').add(ogrenciData);

                    // 4. Veli dokümanını öğrenci ID'si ile güncelle
                    await firebase.firestore().collection('kullanicilar').doc(veliUserId).update({
                        ogrenciId: ogrenciRef.id
                    });

                    // 5. Öğrenci listesini güncelle
                    await loadOgrenciListesi();

                    // 6. Modalı kapat ve formu temizle
                    closeOgrenciKayitModal();
                    
                    this.showSuccess('Öğrenci ve veli başarıyla kaydedildi!');
                    
                } catch (error) {
                    console.error('Kayıt hatası:', error);
                    this.showError('Kayıt sırasında hata oluştu: ' + error.message);
                } finally {
                    this.hideLoading(submitBtn, originalText);
                }
            }

            getOgrenciData() {
                return {
                    ad: document.getElementById('ogrenciAdi').value,
                    soyad: document.getElementById('ogrenciSoyadi').value,
                    ogrenciNo: document.getElementById('ogrenciNo').value,
                    fotoUrl: document.getElementById('ogrenciFoto').value || '/images/default-avatar.png',
                    ogretmenId: currentUser.uid,
                    olusturulmaTarihi: new Date(),
                    toplamPuan: 0,
                    toplamMadalya: 0
                };
            }

            getVeliData() {
                return {
                    ad: document.getElementById('veliAdi').value,
                    soyad: document.getElementById('veliSoyadi').value,
                    kullaniciAdi: document.getElementById('veliKullaniciAdi').value,
                    telefon: document.getElementById('veliTelefon').value,
                    yakinlik: document.getElementById('veliYakinlik').value,
                    tip: 'veli',
                    olusturulmaTarihi: new Date()
                };
            }

            async ogrenciSil(ogrenciId) {
                if (!confirm('Bu öğrenciyi ve bağlı veli hesabını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!')) {
                    return;
                }

                try {
                    const ogrenciDoc = await firebase.firestore().collection('ogrenciler').doc(ogrenciId).get();
                    if (!ogrenciDoc.exists) {
                        this.showError('Öğrenci bulunamadı!');
                        return;
                    }

                    const ogrenci = ogrenciDoc.data();
                    const veliId = ogrenci.veliId;

                    // 1. Öğrenciyi Firestore'dan sil
                    await firebase.firestore().collection('ogrenciler').doc(ogrenciId).delete();

                    // 2. Veli kullanıcısını Firestore'dan sil
                    await firebase.firestore().collection('kullanicilar').doc(veliId).delete();

                    // 3. Öğrenciye ait modül kayıtlarını sil
                    const modulKayitlariQuery = await firebase.firestore()
                        .collection('modulKayitlari')
                        .where('ogrenciId', '==', ogrenciId)
                        .get();
                    
                    const deletePromises = modulKayitlariQuery.docs.map(doc => doc.ref.delete());
                    await Promise.all(deletePromises);

                    // 4. Öğrenci listesini güncelle
                    await loadOgrenciListesi();

                    this.showSuccess('Öğrenci ve ilgili tüm veriler başarıyla silindi.');

                } catch (error) {
                    console.error('Silme hatası:', error);
                    this.showError('Silme işlemi sırasında hata oluştu: ' + error.message);
                }
            }

            showError(message) {
                alert(`❌ ${message}`);
            }

            showSuccess(message) {
                alert(`✅ ${message}`);
            }

            showLoading(button, text = 'İşleniyor...') {
                button.disabled = true;
                button.textContent = text;
            }

            hideLoading(button, originalText) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }

        // Modül yönetimi sınıfı
        class ModulYonetimi {
            constructor(modulAdi) {
                this.modulAdi = modulAdi;
            }

            async ogrenciListesiniYukle(selectElementId) {
                try {
                    const select = document.getElementById(selectElementId);
                    select.innerHTML = '<option value="">Öğrenci seçin...</option>';

                    const querySnapshot = await firebase.firestore()
                        .collection('ogrenciler')
                        .where('ogretmenId', '==', currentUser.uid)
                        .get();

                    mevcutOgrenciListesi = [];
                    querySnapshot.forEach((doc) => {
                        const ogrenci = doc.data();
                        mevcutOgrenciListesi.push({
                            id: doc.id,
                            ...ogrenci
                        });
                        
                        const option = document.createElement('option');
                        option.value = doc.id;
                        option.textContent = `${ogrenci.ad} ${ogrenci.soyad} (${ogrenci.ogrenciNo})`;
                        select.appendChild(option);
                    });

                } catch (error) {
                    console.error('Öğrenci listesi yüklenemedi:', error);
                    this.showError('Öğrenci listesi yüklenirken hata oluştu.');
                }
            }

            async kayitEkle(kayitData) {
                try {
                    await firebase.firestore().collection('modulKayitlari').add(kayitData);
                    await this.puanVeMadalyaGuncelle(kayitData.ogrenciId);
                    return true;
                } catch (error) {
                    console.error('Kayıt ekleme hatası:', error);
                    throw error;
                }
            }

            async puanVeMadalyaGuncelle(ogrenciId) {
                try {
                    await tumModullerinPuaniniHesapla(ogrenciId);
                } catch (error) {
                    console.error('Puan güncelleme hatası:', error);
                }
            }

            showError(message) {
                alert(`❌ ${message}`);
            }

            showSuccess(message) {
                alert(`✅ ${message}`);
            }
        }

        // Kitap okuma modülü
        class KitapOkumaModulu extends ModulYonetimi {
            constructor() {
                super('kitapOkuma');
            }

            async kayitEkle() {
                try {
                    const ogrenciId = document.getElementById('kitapOgrenciSelect').value;
                    const tarih = document.getElementById('kitapTarih').value;
                    const okunmadiChecked = document.getElementById('kitapOkunmadi').checked;
                    const sayfaSayisi = document.getElementById('kitapSayfaSayisi').value;

                    if (!this.validateInput(ogrenciId, tarih, okunmadiChecked, sayfaSayisi)) {
                        return;
                    }

                    const kayitData = this.prepareKayitData(ogrenciId, tarih, okunmadiChecked, sayfaSayisi);
                    
                    await super.kayitEkle(kayitData);
                    closeKitapOkumaModal();
                    this.showSuccess('Kitap okuma kaydı başarıyla eklendi!');

                } catch (error) {
                    this.showError('Kayıt sırasında hata oluştu: ' + error.message);
                }
            }

            validateInput(ogrenciId, tarih, okunmadiChecked, sayfaSayisi) {
                if (!ogrenciId) {
                    this.showError('Lütfen bir öğrenci seçin.');
                    return false;
                }

                if (!tarih) {
                    this.showError('Lütfen tarih seçin.');
                    return false;
                }

                if (!okunmadiChecked && (!sayfaSayisi || sayfaSayisi <= 0)) {
                    this.showError('Lütfen sayfa sayısı girin veya "Değer girilmedi" seçeneğini işaretleyin.');
                    return false;
                }

                return true;
            }

            prepareKayitData(ogrenciId, tarih, okunmadiChecked, sayfaSayisi) {
                const kayitData = {
                    ogrenciId: ogrenciId,
                    tarih: new Date(tarih),
                    tip: 'kitapOkuma',
                    olusturulmaTarihi: new Date(),
                    ogretmenId: currentUser.uid
                };

                if (okunmadiChecked) {
                    kayitData.durum = 'okunmadi';
                    kayitData.sayfaSayisi = 0;
                } else {
                    kayitData.durum = 'okundu';
                    kayitData.sayfaSayisi = parseInt(sayfaSayisi);
                }

                return kayitData;
            }
        }

        // Ödev puanı modülü
        class OdevPuaniModulu extends ModulYonetimi {
            constructor() {
                super('odevPuani');
            }

            async kayitEkle() {
                try {
                    const ogrenciId = document.getElementById('odevOgrenciSelect').value;
                    const tarih = document.getElementById('odevTarih').value;
                    const yapilmadiChecked = document.getElementById('odevYapilmadi').checked;
                    const puan = document.getElementById('odevPuan').value;

                    if (!this.validateInput(ogrenciId, tarih, yapilmadiChecked, puan)) {
                        return;
                    }

                    const kayitData = this.prepareKayitData(ogrenciId, tarih, yapilmadiChecked, puan);
                    
                    await super.kayitEkle(kayitData);
                    closeOdevPuaniModal();
                    this.showSuccess('Ödev puanı başarıyla eklendi!');

                } catch (error) {
                    this.showError('Kayıt sırasında hata oluştu: ' + error.message);
                }
            }

            validateInput(ogrenciId, tarih, yapilmadiChecked, puan) {
                if (!ogrenciId) {
                    this.showError('Lütfen bir öğrenci seçin.');
                    return false;
                }

                if (!tarih) {
                    this.showError('Lütfen tarih seçin.');
                    return false;
                }

                if (!yapilmadiChecked && !puan) {
                    this.showError('Lütfen puan seçin veya "Değer girilmedi" seçeneğini işaretleyin.');
                    return false;
                }

                return true;
            }

            prepareKayitData(ogrenciId, tarih, yapilmadiChecked, puan) {
                const kayitData = {
                    ogrenciId: ogrenciId,
                    tarih: new Date(tarih),
                    tip: 'odevPuani',
                    olusturulmaTarihi: new Date(),
                    ogretmenId: currentUser.uid
                };

                if (yapilmadiChecked) {
                    kayitData.durum = 'yapilmadi';
                    kayitData.puan = 0;
                } else {
                    kayitData.durum = 'yapildi';
                    kayitData.puan = parseInt(puan);
                }

                return kayitData;
            }
        }

        // Dashboard ve grafikler sınıfı
        class Dashboard {
            constructor() {
                this.charts = {};
            }

            async init() {
                await this.loadDashboardSummary();
                await this.initAllCharts();
            }

            async loadDashboardSummary() {
                try {
                    const ogrenciSnapshot = await firebase.firestore()
                        .collection('ogrenciler')
                        .where('ogretmenId', '==', currentUser.uid)
                        .get();

                    let toplamOgrenci = ogrenciSnapshot.size;
                    let toplamMadalya = 0;
                    let toplamPuan = 0;
                    let toplamKitap = 0;

                    const ogrenciHesaplamalar = ogrenciSnapshot.docs.map(async (doc) => {
                        const ogrenci = doc.data();
                        toplamMadalya += ogrenci.toplamMadalya || 0;
                        toplamPuan += ogrenci.toplamPuan || 0;
                        toplamKitap += ogrenci.kitapToplamSayfa || 0;
                    });

                    await Promise.all(ogrenciHesaplamalar);

                    document.getElementById('toplamOgrenci').textContent = toplamOgrenci;
                    document.getElementById('toplamMadalya').textContent = toplamMadalya;
                    document.getElementById('ortalamaPuan').textContent = toplamOgrenci > 0 ? (toplamPuan / toplamOgrenci).toFixed(1) : '0';
                    document.getElementById('toplamKitap').textContent = toplamKitap;

                } catch (error) {
                    console.error('Dashboard özet yüklenemedi:', error);
                }
            }

            async initAllCharts() {
                await this.initKitapOkumaChart();
                await this.initOdevPuaniChart();
                await this.initSoruCozumuChart();
                await this.initDenemeChart();
                await this.initYildizChart();
                await this.initOlumsuzDavranisChart();
            }

            async initKitapOkumaChart() {
                try {
                    const ctx = document.getElementById('kitapOkumaChart').getContext('2d');
                    const data = await this.getAylikVeri('kitapOkuma');
                    
                    this.charts.kitapOkuma = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                            datasets: [{
                                label: 'Toplam Okunan Sayfa',
                                data: data,
                                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                                borderColor: 'rgba(52, 152, 219, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Sayfa Sayısı'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Kitap okuma grafiği oluşturulamadı:', error);
                }
            }

            async initOdevPuaniChart() {
                try {
                    const ctx = document.getElementById('odevPuaniChart').getContext('2d');
                    const data = await this.getAylikVeri('odevPuani');
                    
                    this.charts.odevPuani = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                            datasets: [{
                                label: 'Toplam Ödev Puanı',
                                data: data,
                                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                                borderColor: 'rgba(46, 204, 113, 1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Puan'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Ödev puanı grafiği oluşturulamadı:', error);
                }
            }

            async initSoruCozumuChart() {
                try {
                    const ctx = document.getElementById('soruCozumuChart').getContext('2d');
                    const data = await this.getAylikVeri('soruCozumu');
                    
                    this.charts.soruCozumu = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                            datasets: [{
                                label: 'Toplam Çözülen Soru',
                                data: data,
                                backgroundColor: 'rgba(155, 89, 182, 0.7)',
                                borderColor: 'rgba(155, 89, 182, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Soru Sayısı'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Soru çözümü grafiği oluşturulamadı:', error);
                }
            }

            async initDenemeChart() {
                try {
                    const ctx = document.getElementById('denemeChart').getContext('2d');
                    const data = await this.getYillikVeri('deneme');
                    
                    this.charts.deneme = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.labels,
                            datasets: [{
                                label: 'Net Ortalama',
                                data: data.netler,
                                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                                borderColor: 'rgba(231, 76, 60, 1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Net'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Deneme grafiği oluşturulamadı:', error);
                }
            }

            async initYildizChart() {
                try {
                    const ctx = document.getElementById('yildizChart').getContext('2d');
                    const data = await this.getAylikVeri('yildiz');
                    
                    this.charts.yildiz = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                            datasets: [{
                                label: 'Toplam Yıldız',
                                data: data,
                                backgroundColor: 'rgba(241, 196, 15, 0.7)',
                                borderColor: 'rgba(241, 196, 15, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Yıldız Sayısı'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Yıldız grafiği oluşturulamadı:', error);
                }
            }

            async initOlumsuzDavranisChart() {
                try {
                    const ctx = document.getElementById('olumsuzDavranisChart').getContext('2d');
                    const data = await this.getAylikVeri('olumsuzDavranis');
                    
                    this.charts.olumsuzDavranis = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                            datasets: [{
                                label: 'Olumsuz Davranış Sayısı',
                                data: data,
                                backgroundColor: 'rgba(149, 165, 166, 0.7)',
                                borderColor: 'rgba(149, 165, 166, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Kayıt Sayısı'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Olumsuz davranış grafiği oluşturulamadı:', error);
                }
            }

            async getAylikVeri(tip) {
                try {
                    const ogrenciSnapshot = await firebase.firestore()
                        .collection('ogrenciler')
                        .where('ogretmenId', '==', currentUser.uid)
                        .get();

                    const ogrenciIds = ogrenciSnapshot.docs.map(doc => doc.id);
                    const aylikData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

                    for (let ogrenciId of ogrenciIds) {
                        const kayitSnapshot = await firebase.firestore()
                            .collection('modulKayitlari')
                            .where('ogrenciId', '==', ogrenciId)
                            .where('tip', '==', tip)
                            .get();

                        kayitSnapshot.forEach((doc) => {
                            const kayit = doc.data();
                            const tarih = kayit.tarih.toDate();
                            const ay = tarih.getMonth();

                            let ayIndex = -1;
                            if (ay >= 8) {
                                ayIndex = ay - 8;
                            } else if (ay <= 5) {
                                ayIndex = ay + 4;
                            }

                            if (ayIndex >= 0 && ayIndex < 10) {
                                aylikData[ayIndex] += this.calculateValue(tip, kayit);
                            }
                        });
                    }

                    return aylikData;

                } catch (error) {
                    console.error(`Aylık veri getirme hatası (${tip}):`, error);
                    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                }
            }

            calculateValue(tip, kayit) {
                switch (tip) {
                    case 'kitapOkuma':
                        return kayit.durum === 'okundu' ? kayit.sayfaSayisi : 0;
                    case 'odevPuani':
                        return kayit.durum === 'yapildi' ? kayit.puan : 0;
                    case 'soruCozumu':
                        return kayit.toplamSoru;
                    case 'yildiz':
                        return kayit.yildizSayisi;
                    case 'olumsuzDavranis':
                        return 1;
                    default:
                        return 0;
                }
            }

            async getYillikVeri(tip) {
                try {
                    const ogrenciSnapshot = await firebase.firestore()
                        .collection('ogrenciler')
                        .where('ogretmenId', '==', currentUser.uid)
                        .get();

                    const ogrenciIds = ogrenciSnapshot.docs.map(doc => doc.id);
                    const tumKayitlar = [];

                    for (let ogrenciId of ogrenciIds) {
                        const kayitSnapshot = await firebase.firestore()
                            .collection('modulKayitlari')
                            .where('ogrenciId', '==', ogrenciId)
                            .where('tip', '==', tip)
                            .orderBy('tarih')
                            .get();

                        kayitSnapshot.forEach((doc) => {
                            const kayit = doc.data();
                            tumKayitlar.push({
                                tarih: kayit.tarih.toDate(),
                                net: kayit.net || 0
                            });
                        });
                    }

                    tumKayitlar.sort((a, b) => a.tarih - b.tarih);

                    const labels = tumKayitlar.map(kayit => 
                        kayit.tarih.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                    );
                    const netler = tumKayitlar.map(kayit => kayit.net);

                    return { labels, netler };

                } catch (error) {
                    console.error(`Yıllık veri getirme hatası (${tip}):`, error);
                    return { labels: [], netler: [] };
                }
            }
        }

        // Global fonksiyonlar
        let ogretmenPaneli;
        let ogrenciYonetimi;
        let kitapOkumaModulu;
        let odevPuaniModulu;
        let dashboard;

        // Sayfa yüklendiğinde
        document.addEventListener('DOMContentLoaded', async function() {
            ogretmenPaneli = new OgretmenPaneli();
            ogrenciYonetimi = new OgrenciYonetimi();
            kitapOkumaModulu = new KitapOkumaModulu();
            odevPuaniModulu = new OdevPuaniModulu();
            dashboard = new Dashboard();
        });

        // Modal fonksiyonları
        function openOgrenciKayitModal() {
            document.getElementById('ogrenciKayitModal').style.display = 'block';
        }

        function closeOgrenciKayitModal() {
            document.getElementById('ogrenciKayitModal').style.display = 'none';
            document.getElementById('ogrenciKayitForm').reset();
        }

        function openKitapOkumaModal() {
            kitapOkumaModulu.ogrenciListesiniYukle('kitapOgrenciSelect');
            document.getElementById('kitapTarih').valueAsDate = new Date();
            document.getElementById('kitapOkunmadi').checked = false;
            document.getElementById('kitapSayfaSayisi').value = '';
            document.getElementById('kitapOkumaModal').style.display = 'block';
        }

        function closeKitapOkumaModal() {
            document.getElementById('kitapOkumaModal').style.display = 'none';
        }

        function openOdevPuaniModal() {
            odevPuaniModulu.ogrenciListesiniYukle('odevOgrenciSelect');
            document.getElementById('odevTarih').valueAsDate = new Date();
            document.getElementById('odevYapilmadi').checked = false;
            document.getElementById('odevPuan').value = '';
            document.getElementById('odevPuaniModal').style.display = 'block';
        }

        function closeOdevPuaniModal() {
            document.getElementById('odevPuaniModal').style.display = 'none';
        }

        // Diğer modal fonksiyonları buraya eklenecek...

        // Öğrenci listesi yükleme
        async function loadOgrenciListesi() {
            try {
                const ogrenciListesiContainer = document.getElementById('ogrenciListesi');
                ogrenciListesiContainer.innerHTML = '<div class="loading">Yükleniyor...</div>';

                const querySnapshot = await firebase.firestore()
                    .collection('ogrenciler')
                    .where('ogretmenId', '==', currentUser.uid)
                    .get();

                if (querySnapshot.empty) {
                    ogrenciListesiContainer.innerHTML = '<div class="no-data">Henüz öğrenci kaydı bulunmuyor.</div>';
                    return;
                }

                let ogrenciler = [];
                
                const ogrenciPromises = querySnapshot.docs.map(async (doc) => {
                    const ogrenci = doc.data();
                    const ogrenciId = doc.id;
                    
                    const puanVeMadalya = await hesaplaOgrenciPuanVeMadalya(ogrenciId);
                    
                    return {
                        id: ogrenciId,
                        ...ogrenci,
                        ...puanVeMadalya
                    };
                });

                ogrenciler = await Promise.all(ogrenciPromises);
                ogrenciler.sort((a, b) => b.toplamPuan - a.toplamPuan);
                
                renderOgrenciKartlari(ogrenciler);

            } catch (error) {
                console.error('Öğrenci listesi yüklenemedi:', error);
                document.getElementById('ogrenciListesi').innerHTML = 
                    '<div class="error">Öğrenci listesi yüklenirken hata oluştu.</div>';
            }
        }

        function renderOgrenciKartlari(ogrenciler) {
            const ogrenciListesiContainer = document.getElementById('ogrenciListesi');
            
            let ogrenciHTML = '';
            
            ogrenciler.forEach((ogrenci, index) => {
                let madalyaHTML = '';
                const gosterilecekMadalya = Math.min(ogrenci.toplamMadalya, 5);
                for (let i = 0; i < gosterilecekMadalya; i++) {
                    madalyaHTML += '<div class="madalya"></div>';
                }
                if (ogrenci.toplamMadalya > 5) {
                    madalyaHTML += `<div class="madalya-text">+${ogrenci.toplamMadalya - 5}</div>`;
                }

                ogrenciHTML += `
                    <div class="student-card">
                        <div class="sira-numarasi">${index + 1}</div>
                        <img src="${ogrenci.fotoUrl}" alt="${ogrenci.ad} ${ogrenci.soyad}" 
                             class="student-avatar" 
                             onerror="this.src='https://via.placeholder.com/80x80/3498db/ffffff?text=${ogrenci.ad.charAt(0)}${ogrenci.soyad.charAt(0)}'">
                        <div class="student-name">${ogrenci.ad} ${ogrenci.soyad}</div>
                        <div class="student-number">No: ${ogrenci.ogrenciNo}</div>
                        
                        <div class="student-stats">
                            <div class="student-stat">
                                <div class="stat-value">${ogrenci.toplamPuan?.toFixed(1) || 0}</div>
                                <div class="stat-label">Toplam Puan</div>
                            </div>
                            <div class="student-stat">
                                <div class="stat-value">${ogrenci.toplamMadalya || 0}</div>
                                <div class="stat-label">Toplam Madalya</div>
                            </div>
                        </div>
                        
                        <div class="madalyalar">
                            ${madalyaHTML}
                        </div>
                        
                        <button onclick="ogrenciDetayGoster('${ogrenci.id}')" class="ogrenci-detay-btn">
                            📊 Detaylı Görünüm
                        </button>
                        
                        <div class="student-actions">
                            <button onclick="ogrenciDuzenle('${ogrenci.id}')" class="edit-btn">Düzenle</button>
                            <button onclick="ogrenciSil('${ogrenci.id}')" class="delete-btn">Sil</button>
                        </div>
                    </div>
                `;
            });

            ogrenciListesiContainer.innerHTML = ogrenciHTML;
        }

        // Puan hesaplama fonksiyonları
        async function hesaplaOgrenciPuanVeMadalya(ogrenciId) {
            try {
                const tumKayitlarQuery = await firebase.firestore()
                    .collection('modulKayitlari')
                    .where('ogrenciId', '==', ogrenciId)
                    .get();

                let toplamPuan = 0;
                let toplamMadalya = 0;

                const katsayilar = {
                    deneme: 0.25,
                    test: 0.20,
                    kitapOkumaSinavi: 0.15,
                    soruCozumu: 0.12,
                    kitapOkuma: 0.10,
                    odevPuani: 0.08,
                    yildiz: 0.05
                };

                tumKayitlarQuery.forEach((doc) => {
                    const kayit = doc.data();
                    
                    switch(kayit.tip) {
                        case 'kitapOkuma':
                            if (kayit.durum === 'okundu') {
                                toplamPuan += kayit.sayfaSayisi * katsayilar.kitapOkuma;
                            }
                            break;
                            
                        case 'odevPuani':
                            if (kayit.durum === 'yapildi') {
                                toplamPuan += kayit.puan * katsayilar.odevPuani;
                            }
                            break;
                            
                        case 'soruCozumu':
                            toplamPuan += kayit.toplamSoru * katsayilar.soruCozumu;
                            break;
                            
                        case 'yildiz':
                            toplamPuan += kayit.yildizSayisi * katsayilar.yildiz;
                            break;
                            
                        case 'olumsuzDavranis':
                            toplamPuan -= 1;
                            break;
                            
                        case 'deneme':
                            toplamPuan += (kayit.net || 0) * katsayilar.deneme;
                            break;
                    }
                });

                // Basit madalya hesaplama
                toplamMadalya = Math.floor(toplamPuan / 10);

                // Puanı 0-100 arasına sınırla
                toplamPuan = Math.max(0, Math.min(100, toplamPuan));

                await firebase.firestore().collection('ogrenciler').doc(ogrenciId).update({
                    toplamPuan: toplamPuan,
                    toplamMadalya: toplamMadalya,
                    sonPuanHesaplama: new Date()
                });

                return {
                    toplamPuan: toplamPuan,
                    toplamMadalya: toplamMadalya
                };

            } catch (error) {
                console.error('Puan hesaplama hatası:', error);
                return { toplamPuan: 0, toplamMadalya: 0 };
            }
        }

        async function tumOgrencilerinPuanlariniHesapla() {
            try {
                const ogrenciSnapshot = await firebase.firestore()
                    .collection('ogrenciler')
                    .where('ogretmenId', '==', currentUser.uid)
                    .get();

                const hesaplamaPromises = ogrenciSnapshot.docs.map(doc => 
                    hesaplaOgrenciPuanVeMadalya(doc.id)
                );

                await Promise.all(hesaplamaPromises);
                alert('Tüm öğrencilerin puanları güncellendi!');
                
                await loadOgrenciListesi();

            } catch (error) {
                console.error('Toplu puan hesaplama hatası:', error);
                alert('Puan hesaplama sırasında hata oluştu.');
            }
        }

        async function tumModullerinPuaniniHesapla(ogrenciId) {
            // Basitleştirilmiş puan hesaplama
            await hesaplaOgrenciPuanVeMadalya(ogrenciId);
        }

        // Sıralama fonksiyonu
        function sortOgrenciler(kriter) {
            const ogrenciListesiContainer = document.getElementById('ogrenciListesi');
            const ogrenciKartlari = Array.from(ogrenciListesiContainer.getElementsByClassName('student-card'));
            
            let ogrenciler = ogrenciKartlari.map(kart => {
                const puan = parseFloat(kart.querySelector('.stat-value').textContent);
                const madalya = parseInt(kart.querySelector('.student-stat:nth-child(2) .stat-value').textContent);
                const isim = kart.querySelector('.student-name').textContent;
                const numara = parseInt(kart.querySelector('.student-number').textContent.replace('No: ', ''));
                
                return {
                    element: kart,
                    puan: puan,
                    madalya: madalya,
                    isim: isim,
                    numara: numara
                };
            });

            switch(kriter) {
                case 'puan':
                    ogrenciler.sort((a, b) => b.puan - a.puan);
                    break;
                case 'madalya':
                    ogrenciler.sort((a, b) => b.madalya - a.madalya);
                    break;
                case 'isim':
                    ogrenciler.sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
                    break;
                case 'numara':
                    ogrenciler.sort((a, b) => a.numara - b.numara);
                    break;
            }

            ogrenciler.forEach((ogrenci, index) => {
                const siraNumarasi = ogrenci.element.querySelector('.sira-numarasi');
                siraNumarasi.textContent = index + 1;
                ogrenciListesiContainer.appendChild(ogrenci.element);
            });
        }

        // Çıkış fonksiyonu
        function logout() {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            });
        }

        // Modal dışına tıklayınca kapat
        window.onclick = function(event) {
            const modals = [
                'ogrenciKayitModal', 'kitapOkumaModal', 'odevPuaniModal'
                // Diğer modallar buraya eklenebilir
            ];
            
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    eval(`close${modalId.charAt(0).toUpperCase() + modalId.slice(1)}()`);
                }
            });
        }

        // Global fonksiyonlar
        function ogrenciSil(ogrenciId) {
            ogrenciYonetimi.ogrenciSil(ogrenciId);
        }

        function kitapOkumaKaydet() {
            kitapOkumaModulu.kayitEkle();
        }

        function odevPuaniKaydet() {
            odevPuaniModulu.kayitEkle();
        }

        // Diğer global fonksiyonlar buraya eklenecek...
        function openKitapOkumaGecmisi() {
            alert('Kitap okuma geçmişi özelliği yakında eklenecek!');
        }

        function openOdevPuaniGecmisi() {
            alert('Ödev puanı geçmişi özelliği yakında eklenecek!');
        }

        function ogrenciDetayGoster(ogrenciId) {
            alert(`Öğrenci detayı: ${ogrenciId} - Bu özellik yakında eklenecek!`);
        }

        function ogrenciDuzenle(ogrenciId) {
            alert(`Öğrenci düzenleme: ${ogrenciId} - Bu özellik yakında eklenecek!`);
        }

        // Diğer modül açma fonksiyonları
        function openSoruCozumuModal() {
            alert('Soru çözümü modülü yakında eklenecek!');
        }

        function openDenemeModal() {
            alert('Deneme sınavı modülü yakında eklenecek!');
        }

        function openTestModal() {
            alert('Test modülü yakında eklenecek!');
        }

        function openKitapSinavModal() {
            alert('Kitap sınavı modülü yakında eklenecek!');
        }

        function openYildizModal() {
            alert('Yıldızlar modülü yakında eklenecek!');
        }

        function openOlumsuzDavranisModal() {
            alert('Olumsuz davranış modülü yakında eklenecek!');
        }

    </script>
</body>
</html>