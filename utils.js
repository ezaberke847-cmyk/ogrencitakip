// utils.js - Profesyonel Yardımcı Fonksiyonlar ve Utilities
class Utils {
    constructor() {
        this.currentUserType = '';
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize utility functions and event listeners
     */
    init() {
        if (this.isInitialized) {
            console.warn('Utils already initialized');
            return;
        }

        try {
            this.setupModalEvents();
            this.setupFormEvents();
            this.setupGlobalEventListeners();
            this.isInitialized = true;
            console.log('Utils initialized successfully');
        } catch (error) {
            console.error('Utils initialization failed:', error);
        }
    }

    /**
     * Setup modal related event listeners
     */
    setupModalEvents() {
        // Modal kapatma butonu
        const closeButton = document.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeLoginModal());
        }

        // ESC tuşu ile modal kapatma
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeLoginModal();
            }
        });
    }

    /**
     * Setup form related event listeners
     */
    setupFormEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
            
            // Real-time validation
            loginForm.addEventListener('input', (e) => {
                this.validateField(e.target);
            });
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Dışarı tıklayınca modal kapatma
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('loginModal');
            if (event.target === modal) {
                this.closeLoginModal();
            }
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showNotification('Bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
        });
    }

    /**
     * Validate individual form field
     * @param {HTMLElement} field - Field to validate
     */
    validateField(field) {
        if (!field.hasAttribute('required')) return;

        const value = field.value.trim();
        const isEmpty = value === '';
        
        if (isEmpty) {
            this.highlightInvalidField(field);
        } else {
            this.clearFieldHighlight(field);
        }
    }

    /**
     * Open login modal for specific user type
     * @param {string} userType - Type of user (admin, ogretmen, veli)
     */
    openLogin(userType) {
        if (!['admin', 'ogretmen', 'veli'].includes(userType)) {
            console.error('Invalid user type:', userType);
            return;
        }

        this.currentUserType = userType;
        const modal = document.getElementById('loginModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalTitle) {
            console.error('Modal elements not found');
            this.showNotification('Sistem bileşeni bulunamadı.', 'error');
            return;
        }

        // Modal başlığını güncelle
        const titles = {
            'admin': 'YÖNETİCİ GİRİŞİ',
            'ogretmen': 'ÖĞRETMEN GİRİŞİ',
            'veli': 'VELİ GİRİŞİ'
        };

        modalTitle.textContent = titles[userType] || 'GİRİŞ';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Input alanlarını temizle ve odağı ayarla
        this.clearLoginForm();
        
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }

    /**
     * Close login modal
     */
    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.clearLoginForm();
        }
    }

    /**
     * Clear login form inputs
     */
    clearLoginForm() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberMe = document.getElementById('rememberMe');
        
        if (usernameInput) {
            usernameInput.value = '';
            this.clearFieldHighlight(usernameInput);
        }
        if (passwordInput) {
            passwordInput.value = '';
            this.clearFieldHighlight(passwordInput);
        }
        if (rememberMe) {
            rememberMe.checked = false;
        }
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLoginSubmit(e) {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('rememberMe')?.checked;

        // Validation
        if (!username || !password) {
            this.showNotification('Lütfen kullanıcı adı ve şifre giriniz.', 'error');
            
            // Highlight empty fields
            if (!username) {
                const usernameInput = document.getElementById('username');
                if (usernameInput) this.highlightInvalidField(usernameInput);
            }
            if (!password) {
                const passwordInput = document.getElementById('password');
                if (passwordInput) this.highlightInvalidField(passwordInput);
            }
            return;
        }

        // Show loading state
        this.showLoading('Giriş yapılıyor...');

        try {
            // Auth.js'deki fonksiyonu çağır
            if (window.authenticateUser) {
                await authenticateUser(username, password, this.currentUserType);
            } else {
                throw new Error('Auth fonksiyonu bulunamadı');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(
                error.message || 'Giriş sırasında bir hata oluştu.', 
                'error'
            );
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Highlight invalid field
     * @param {HTMLElement} field - Input field element
     */
    highlightInvalidField(field) {
        field.classList.add('invalid-field');
        field.style.borderColor = '#e74c3c';
        field.style.boxShadow = '0 0 5px rgba(231, 76, 60, 0.3)';
        
        // Hata mesajı ekle (eğer yoksa)
        let errorMessage = field.parentNode.querySelector('.field-error');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'field-error';
            errorMessage.style.cssText = `
                color: #e74c3c;
                font-size: 12px;
                margin-top: 5px;
                font-weight: 500;
            `;
            
            const fieldName = field.getAttribute('name') || 'Bu alan';
            errorMessage.textContent = `${fieldName} zorunludur`;
            field.parentNode.appendChild(errorMessage);
        }
    }

    /**
     * Clear field highlight
     * @param {HTMLElement} field - Input field element
     */
    clearFieldHighlight(field) {
        field.classList.remove('invalid-field');
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        // Hata mesajını kaldır
        const errorMessage = field.parentNode.querySelector('.field-error');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message = 'Yükleniyor...') {
        // Yükleme göstergesi için overlay oluştur
        let loadingOverlay = document.getElementById('loadingOverlay');
        
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 18px;
                backdrop-filter: blur(3px);
            `;
            document.body.appendChild(loadingOverlay);
        }

        loadingOverlay.innerHTML = `
            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; backdrop-filter: blur(10px);">
                <div class="loading-spinner" style="
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <div style="font-weight: 500; margin-top: 10px;">${message}</div>
            </div>
        `;
        
        loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Mevcut bildirimleri temizle
        const existingNotifications = document.querySelectorAll('.global-notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `global-notification notification-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" aria-label="Bildirimi kapat">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            max-width: 400px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateX(120%);
            opacity: 0;
            backdrop-filter: blur(10px);
        `;

        const colors = {
            success: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
            info: 'linear-gradient(135deg, #3498db, #2980b9)'
        };

        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animasyonla göster
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Kapatma butonu
        const closeButton = notification.querySelector('.notification-close');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 15px;
            line-height: 1;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        `;

        closeButton.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(255,255,255,0.2)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'none';
        });

        // İçerik stili
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            flex: 1;
        `;

        const icon = notification.querySelector('.notification-icon');
        icon.style.cssText = `
            font-size: 18px;
            margin-right: 12px;
            font-weight: bold;
        `;

        const messageEl = notification.querySelector('.notification-message');
        messageEl.style.cssText = `
            flex: 1;
            font-weight: 500;
            line-height: 1.4;
        `;

        // Otomatik kaldırma
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * Hide notification with animation
     * @param {HTMLElement} notification - Notification element
     */
    hideNotification(notification) {
        if (!notification || !notification.parentNode) return;

        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Debounce function for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
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

    /**
     * Throttle function for performance optimization
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
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

    /**
     * Safe JSON parse with error handling
     * @param {string} str - JSON string to parse
     * @param {any} defaultValue - Default value if parsing fails
     * @returns {any} - Parsed value or default value
     */
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('JSON parse error:', error);
            return defaultValue;
        }
    }

    /**
     * Deep clone object
     * @param {any} obj - Object to clone
     * @returns {any} - Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
}

// Form helper functions
class FormHelpers {
    /**
     * Validate form fields
     * @param {string} formId - Form element ID
     * @returns {boolean} - Validation result
     */
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form with ID '${formId}' not found`);
            return false;
        }

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            const isEmpty = !input.value.trim();
            const isSelectEmpty = input.tagName === 'SELECT' && input.value === '';
            
            if (isEmpty || isSelectEmpty) {
                isValid = false;
                utils.highlightInvalidField(input);
            } else {
                utils.clearFieldHighlight(input);
            }
        });
        
        return isValid;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Validation result
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone number to validate
     * @returns {boolean} - Validation result
     */
    static validatePhone(phone) {
        const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate Turkish ID number
     * @param {string} idNumber - ID number to validate
     * @returns {boolean} - Validation result
     */
    static validateTurkishID(idNumber) {
        if (!/^[1-9]{1}[0-9]{10}$/.test(idNumber)) return false;
        
        const digits = idNumber.split('').map(Number);
        const tenth = digits[9];
        const eleventh = digits[10];
        
        let sumEven = 0;
        let sumOdd = 0;
        
        for (let i = 0; i < 9; i++) {
            if (i % 2 === 0) {
                sumOdd += digits[i];
            } else {
                sumEven += digits[i];
            }
        }
        
        const tenthCalc = (sumOdd * 7 - sumEven) % 10;
        const eleventhCalc = (sumOdd + sumEven + tenth) % 10;
        
        return tenth === tenthCalc && eleventh === eleventhCalc;
    }

    /**
     * Serialize form data to object
     * @param {string} formId - Form element ID
     * @returns {Object} - Serialized form data
     */
    static serializeForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    /**
     * Populate form with data
     * @param {string} formId - Form element ID
     * @param {Object} data - Data to populate
     */
    static populateForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form || !data) return;
        
        Object.keys(data).forEach(key => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                const value = data[key];
                
                if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else if (element.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else if (element.tagName === 'SELECT' && element.multiple) {
                    const values = Array.isArray(value) ? value : [value];
                    Array.from(element.options).forEach(option => {
                        option.selected = values.includes(option.value);
                    });
                } else {
                    element.value = value;
                }
            }
        });
    }

    /**
     * Reset form to initial state
     * @param {string} formId - Form element ID
     */
    static resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Tüm field highlight'ları temizle
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => utils.clearFieldHighlight(input));
        }
    }

    /**
     * Show loading state on button
     * @param {HTMLButtonElement} button - Button element
     * @param {string} text - Loading text
     */
    static showLoading(button, text = 'İşleniyor...') {
        if (!button) return;

        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.setAttribute('data-original-width', button.offsetWidth + 'px');
        
        button.innerHTML = `
            <span style="display: inline-flex; align-items: center;">
                <span class="loading-spinner" style="
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid currentColor;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 8px;
                "></span>
                ${text}
            </span>
        `;
        
        // Buton genişliğini koru
        button.style.width = button.offsetWidth + 'px';
    }

    /**
     * Hide loading state from button
     * @param {HTMLButtonElement} button - Button element
     */
    static hideLoading(button) {
        if (!button) return;

        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        const originalWidth = button.getAttribute('data-original-width');
        
        if (originalText) {
            button.innerHTML = originalText;
        }
        
        if (originalWidth) {
            button.style.width = originalWidth;
        } else {
            button.style.width = '';
        }
    }

    /**
     * Add real-time validation to form fields
     * @param {string} formId - Form element ID
     */
    static addRealTimeValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    utils.highlightInvalidField(input);
                } else {
                    utils.clearFieldHighlight(input);
                }
            });

            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    utils.clearFieldHighlight(input);
                }
            });
        });
    }

    /**
     * Toggle password visibility
     * @param {string} passwordFieldId - Password field ID
     * @param {string} toggleButtonId - Toggle button ID
     */
    static setupPasswordToggle(passwordFieldId, toggleButtonId) {
        const passwordField = document.getElementById(passwordFieldId);
        const toggleButton = document.getElementById(toggleButtonId);
        
        if (!passwordField || !toggleButton) return;
        
        toggleButton.addEventListener('click', () => {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
            // İkon güncelleme
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.textContent = type === 'password' ? '👁️' : '🔒';
            }
        });
    }
}

// Date helper functions
class DateHelpers {
    /**
     * Format date to Turkish locale
     * @param {Date|string} date - Date to format
     * @param {Object} options - Format options
     * @returns {string} - Formatted date
     */
    static formatDate(date, options = {}) {
        if (!date) return '';
        
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            
            return new Date(date).toLocaleDateString('tr-TR', { ...defaultOptions, ...options });
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    }

    /**
     * Format date and time to Turkish locale
     * @param {Date|string} date - Date to format
     * @param {Object} options - Format options
     * @returns {string} - Formatted date and time
     */
    static formatDateTime(date, options = {}) {
        if (!date) return '';
        
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return new Date(date).toLocaleString('tr-TR', { ...defaultOptions, ...options });
        } catch (error) {
            console.error('DateTime formatting error:', error);
            return '';
        }
    }

    /**
     * Get Turkish month name
     * @param {number} monthIndex - Month index (0-11)
     * @returns {string} - Month name
     */
    static getMonthName(monthIndex) {
        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        
        if (monthIndex >= 0 && monthIndex < 12) {
            return months[monthIndex];
        }
        
        console.error('Invalid month index:', monthIndex);
        return '';
    }

    /**
     * Get Turkish day name
     * @param {number} dayIndex - Day index (0-6)
     * @returns {string} - Day name
     */
    static getDayName(dayIndex) {
        const days = [
            'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
        ];
        
        if (dayIndex >= 0 && dayIndex < 7) {
            return days[dayIndex];
        }
        
        console.error('Invalid day index:', dayIndex);
        return '';
    }

    /**
     * Get current date in YYYY-MM-DD format
     * @returns {string} - Current date
     */
    static getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get current datetime in ISO format
     * @returns {string} - Current datetime
     */
    static getCurrentDateTime() {
        return new Date().toISOString();
    }

    /**
     * Calculate age from birth date
     * @param {Date|string} birthDate - Birth date
     * @returns {number} - Age in years
     */
    static calculateAge(birthDate) {
        if (!birthDate) return 0;
        
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        } catch (error) {
            console.error('Age calculation error:', error);
            return 0;
        }
    }

    /**
     * Add days to a date
     * @param {Date} date - Start date
     * @param {number} days - Number of days to add
     * @returns {Date} - New date
     */
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add months to a date
     * @param {Date} date - Start date
     * @param {number} months - Number of months to add
     * @returns {Date} - New date
     */
    static addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Get days between two dates
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} - Number of days
     */
    static getDaysBetween(startDate, endDate) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((startDate - endDate) / oneDay));
    }

    /**
     * Check if date is weekend
     * @param {Date} date - Date to check
     * @returns {boolean} - True if weekend
     */
    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0: Pazar, 6: Cumartesi
    }

    /**
     * Get first day of month
     * @param {Date} date - Date
     * @returns {Date} - First day of month
     */
    static getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Get last day of month
     * @param {Date} date - Date
     * @returns {Date} - Last day of month
     */
    static getLastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * Check if year is leap year
     * @param {number} year - Year to check
     * @returns {boolean} - True if leap year
     */
    static isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
}

// String helper functions
class StringHelpers {
    /**
     * Capitalize first letter of string
     * @param {string} str - Input string
     * @returns {string} - Capitalized string
     */
    static capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Capitalize each word in string
     * @param {string} str - Input string
     * @returns {string} - Capitalized string
     */
    static capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    /**
     * Format Turkish phone number
     * @param {string} phone - Phone number
     * @returns {string} - Formatted phone number
     */
    static formatPhone(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        } else if (cleaned.length === 12 && cleaned.startsWith('90')) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
        }
        
        return phone;
    }

    /**
     * Format Turkish ID number
     * @param {string} idNumber - ID number
     * @returns {string} - Formatted ID number
     */
    static formatTurkishID(idNumber) {
        if (!idNumber) return '';
        return idNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{1})/, '$1 $2 $3 $4 $5');
    }

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {boolean} useWordBoundary - Use word boundary
     * @returns {string} - Truncated text
     */
    static truncateText(text, maxLength = 50, useWordBoundary = true) {
        if (!text || text.length <= maxLength) return text;
        
        const truncated = text.substr(0, maxLength - 1);
        
        if (useWordBoundary) {
            return truncated.substr(0, truncated.lastIndexOf(' ')) + '...';
        }
        
        return truncated + '...';
    }

    /**
     * Remove special characters from string
     * @param {string} str - Input string
     * @param {boolean} keepSpaces - Whether to keep spaces
     * @returns {string} - Cleaned string
     */
    static removeSpecialChars(str, keepSpaces = true) {
        if (!str) return '';
        
        if (keepSpaces) {
            return str.replace(/[^\w\s]/gi, '');
        }
        
        return str.replace(/[^\w]/gi, '');
    }

    /**
     * Convert string to slug
     * @param {string} str - Input string
     * @returns {string} - Slug string
     */
    static toSlug(str) {
        if (!str) return '';
        
        return str
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }

    /**
     * Escape HTML special characters
     * @param {string} str - Input string
     * @returns {string} - Escaped string
     */
    static escapeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Unescape HTML special characters
     * @param {string} str - Input string
     * @returns {string} - Unescaped string
     */
    static unescapeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent;
    }

    /**
     * Generate random string
     * @param {number} length - Length of string
     * @returns {string} - Random string
     */
    static generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * Check if string is empty or contains only whitespace
     * @param {string} str - String to check
     * @returns {boolean} - True if empty or whitespace
     */
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }

    /**
     * Count words in string
     * @param {string} str - String to count
     * @returns {number} - Word count
     */
    static countWords(str) {
        if (!str) return 0;
        return str.trim().split(/\s+/).length;
    }
}

// Storage helper functions
class StorageHelpers {
    /**
     * Set item to localStorage with expiration
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {number} expirationMinutes - Expiration in minutes
     */
    static setItem(key, value, expirationMinutes = null) {
        try {
            const item = {
                value: value,
                timestamp: expirationMinutes ? Date.now() : null,
                expiration: expirationMinutes ? expirationMinutes * 60 * 1000 : null
            };
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('LocalStorage set error:', error);
            return false;
        }
    }

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {any} - Stored value
     */
    static getItem(key) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item = utils.safeJsonParse(itemStr);
            if (!item) return null;
            
            // Check expiration
            if (item.timestamp && item.expiration) {
                if (Date.now() - item.timestamp > item.expiration) {
                    localStorage.removeItem(key);
                    return null;
                }
            }
            
            return item.value;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage remove error:', error);
            return false;
        }
    }

    /**
     * Clear all localStorage items
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('LocalStorage clear error:', error);
            return false;
        }
    }

    /**
     * Get all localStorage keys
     * @returns {string[]} - Array of keys
     */
    static getKeys() {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('LocalStorage getKeys error:', error);
            return [];
        }
    }

    /**
     * Check if key exists in localStorage
     * @param {string} key - Storage key
     * @returns {boolean} - True if key exists
     */
    static hasItem(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error('LocalStorage hasItem error:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} - Storage usage info
     */
    static getStorageInfo() {
        try {
            let totalSize = 0;
            const keys = this.getKeys();
            
            keys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += new Blob([item]).size;
                }
            });
            
            return {
                totalItems: keys.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('Storage info error:', error);
            return { totalItems: 0, totalSize: 0, totalSizeMB: '0.00' };
        }
    }

    /**
     * Set item to sessionStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    static setSessionItem(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('SessionStorage set error:', error);
            return false;
        }
    }

    /**
     * Get item from sessionStorage
     * @param {string} key - Storage key
     * @returns {any} - Stored value
     */
    static getSessionItem(key) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? utils.safeJsonParse(item) : null;
        } catch (error) {
            console.error('SessionStorage get error:', error);
            return null;
        }
    }

    /**
     * Remove item from sessionStorage
     * @param {string} key - Storage key
     */
    static removeSessionItem(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('SessionStorage remove error:', error);
            return false;
        }
    }
}

// DOM helper functions
class DomHelpers {
    /**
     * Create element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {Array} children - Child elements or text
     * @returns {HTMLElement} - Created element
     */
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'style' && typeof attributes[key] === 'object') {
                Object.assign(element.style, attributes[key]);
            } else if (key === 'className') {
                element.className = attributes[key];
            } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // Append children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    /**
     * Remove all children from element
     * @param {HTMLElement} element - Parent element
     */
    static removeAllChildren(element) {
        if (!element) return;
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     * @param {boolean} force - Force show/hide
     */
    static toggleVisibility(element, force = null) {
        if (!element) return;
        
        if (force !== null) {
            element.style.display = force ? '' : 'none';
        } else {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    }

    /**
     * Add multiple event listeners
     * @param {HTMLElement} element - Target element
     * @param {Object} events - Event listeners object
     */
    static addEventListeners(element, events) {
        if (!element || !events) return;
        
        Object.keys(events).forEach(eventName => {
            element.addEventListener(eventName, events[eventName]);
        });
    }

    /**
     * Remove multiple event listeners
     * @param {HTMLElement} element - Target element
     * @param {Object} events - Event listeners object
     */
    static removeEventListeners(element, events) {
        if (!element || !events) return;
        
        Object.keys(events).forEach(eventName => {
            element.removeEventListener(eventName, events[eventName]);
        });
    }

    /**
     * Get computed style value
     * @param {HTMLElement} element - Target element
     * @param {string} property - CSS property
     * @returns {string} - Computed value
     */
    static getComputedStyle(element, property) {
        if (!element) return '';
        return window.getComputedStyle(element).getPropertyValue(property);
    }

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Target element
     * @returns {boolean} - True if in viewport
     */
    static isInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Scroll to element smoothly
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scroll options
     */
    static scrollToElement(element, options = {}) {
        if (!element) return;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }

    /**
     * Add CSS class to element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to add
     */
    static addClass(element, className) {
        if (!element || !className) return;
        element.classList.add(className);
    }

    /**
     * Remove CSS class from element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to remove
     */
    static removeClass(element, className) {
        if (!element || !className) return;
        element.classList.remove(className);
    }

    /**
     * Toggle CSS class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     */
    static toggleClass(element, className) {
        if (!element || !className) return;
        element.classList.toggle(className);
    }
}

// Network helper functions
class NetworkHelpers {
    /**
     * Make HTTP request
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} - Request promise
     */
    static async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        // Body handling
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);
        mergedOptions.signal = controller.signal;

        try {
            const response = await fetch(url, mergedOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    /**
     * Make GET request
     * @param {string} url - Request URL
     * @param {Object} headers - Request headers
     * @returns {Promise} - Request promise
     */
    static get(url, headers = {}) {
        return this.request(url, {
            method: 'GET',
            headers
        });
    }

    /**
     * Make POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Promise} - Request promise
     */
    static post(url, data = {}, headers = {}) {
        return this.request(url, {
            method: 'POST',
            body: data,
            headers
        });
    }

    /**
     * Make PUT request
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Promise} - Request promise
     */
    static put(url, data = {}, headers = {}) {
        return this.request(url, {
            method: 'PUT',
            body: data,
            headers
        });
    }

    /**
     * Make DELETE request
     * @param {string} url - Request URL
     * @param {Object} headers - Request headers
     * @returns {Promise} - Request promise
     */
    static delete(url, headers = {}) {
        return this.request(url, {
            method: 'DELETE',
            headers
        });
    }

    /**
     * Check internet connection
     * @returns {Promise<boolean>} - Connection status
     */
    static async checkConnection() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Download file from URL
     * @param {string} url - File URL
     * @param {string} filename - Download filename
     */
    static downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Upload file with progress
     * @param {string} url - Upload URL
     * @param {FormData} formData - Form data with file
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} - Upload promise
     */
    static async uploadFile(url, formData, onProgress = null) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', url);
            xhr.send(formData);
        });
    }
}

// Export classes and create instances
const utils = new Utils();
const formHelpers = FormHelpers;
const dateHelpers = DateHelpers;
const stringHelpers = StringHelpers;
const storageHelpers = StorageHelpers;
const domHelpers = DomHelpers;
const networkHelpers = NetworkHelpers;

// Global styles for animations and utilities
const addGlobalStyles = () => {
    if (!document.getElementById('utils-global-styles')) {
        const style = document.createElement('style');
        style.id = 'utils-global-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            .loading-spinner {
                display: inline-block;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .notification {
                transition: all 0.3s ease;
            }
            
            .invalid-field {
                border-color: #e74c3c !important;
                box-shadow: 0 0 5px rgba(231, 76, 60, 0.3) !important;
            }
            
            .field-error {
                color: #e74c3c;
                font-size: 12px;
                margin-top: 5px;
                font-weight: 500;
            }
            
            .global-notification {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize global styles when module loads
addGlobalStyles();

// Export everything
export {
    utils,
    formHelpers,
    dateHelpers,
    stringHelpers,
    storageHelpers,
    domHelpers,
    networkHelpers,
    Utils,
    FormHelpers,
    DateHelpers,
    StringHelpers,
    StorageHelpers,
    DomHelpers,
    NetworkHelpers
};

export default utils;

// Sayfa yüklendiğinde çalışacak kod
document.addEventListener('DOMContentLoaded', function() {
    console.log('Öğrenci Takip Sistemi utilities yüklendi');
    
    // Otomatik form validasyonu ekle
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        formHelpers.addRealTimeValidation(form.id);
    });
    
    // Global error handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        utils.showNotification('Beklenmeyen bir hata oluştu.', 'error');
    });
});