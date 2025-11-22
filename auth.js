// auth.js - Professional Authentication Module
// Enhanced and optimized version with proper error handling and structure

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

/**
 * Professional Authentication System
 * Comprehensive user authentication, authorization, and session management
 * @version 2.0.0
 * @author System Administrator
 */

// =============================================
// CONFIGURATION CONSTANTS
// =============================================

const AUTH_CONFIG = {
    ADMIN_CREDENTIALS: {
        username: 'admin',
        password: '847',
        email: 'admin@ogrencitakip.com'
    },
    REDIRECT_DELAY: 1000,
    ERROR_TIMEOUT: 5000,
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    STORAGE_KEYS: {
        CURRENT_USER: 'currentUser_v2',
        SESSION_EXPIRY: 'sessionExpiry_v2',
        AUTH_TOKEN: 'authToken_v2'
    },
    ROLES: {
        ADMIN: 'admin',
        TEACHER: 'teacher',
        PARENT: 'parent'
    },
    PATHS: {
        ADMIN: 'admin.html',
        TEACHER: 'ogretmen.html',
        PARENT: 'veli.html',
        LOGIN: 'index.html'
    }
};

// =============================================
// DOM ELEMENTS MANAGER
// =============================================

const DomManager = {
    elements: {
        loginBtn: null,
        errorMessage: null,
        usernameInput: null,
        passwordInput: null,
        roleInputs: null,
        loginForm: null,
        loadingSpinner: null
    },

    /**
     * Initialize DOM elements cache
     */
    initialize: function() {
        this.elements = {
            loginBtn: document.getElementById('loginBtn'),
            errorMessage: document.getElementById('errorMessage'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            roleInputs: document.querySelectorAll('input[name="role"]'),
            loginForm: document.getElementById('loginForm'),
            loadingSpinner: document.getElementById('loadingSpinner')
        };
        return this.elements;
    },

    /**
     * Get selected role from radio buttons
     * @returns {string|null} Selected role
     */
    getSelectedRole: function() {
        const selectedRole = document.querySelector('input[name="role"]:checked');
        return selectedRole ? selectedRole.value : null;
    },

    /**
     * Clear form inputs
     */
    clearForm: function() {
        if (this.elements.usernameInput) this.elements.usernameInput.value = '';
        if (this.elements.passwordInput) this.elements.passwordInput.value = '';
        if (this.elements.roleInputs) {
            this.elements.roleInputs.forEach(radio => radio.checked = false);
        }
    }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

const Utils = {
    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError: function(message) {
        if (DomManager.elements.errorMessage) {
            DomManager.elements.errorMessage.textContent = message;
            DomManager.elements.errorMessage.style.display = 'block';
            DomManager.elements.errorMessage.className = 'error-message active';
            
            setTimeout(() => {
                DomManager.elements.errorMessage.style.display = 'none';
                DomManager.elements.errorMessage.className = 'error-message';
            }, AUTH_CONFIG.ERROR_TIMEOUT);
        }
        console.error('🔐 Authentication Error:', message);
    },

    /**
     * Show success message to user
     * @param {string} message - Success message to display
     */
    showSuccess: function(message) {
        // Create temporary success message element
        const successElement = document.createElement('div');
        successElement.className = 'success-message active';
        successElement.textContent = message;
        successElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.parentNode.removeChild(successElement);
            }
        }, AUTH_CONFIG.ERROR_TIMEOUT);
        
        console.log('✅ Authentication Success:', message);
    },

    /**
     * Set button loading state
     * @param {boolean} isLoading - Loading state
     * @param {string} loadingText - Loading text
     */
    setButtonState: function(isLoading, loadingText = 'İşleniyor...') {
        const btn = DomManager.elements.loginBtn;
        if (!btn) return;

        if (isLoading) {
            btn.innerHTML = `
                <div class="loading-spinner"></div>
                <span>${loadingText}</span>
            `;
            btn.disabled = true;
            btn.classList.add('loading');
        } else {
            btn.innerHTML = `
                <span>Giriş Yap</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M13 7L16 10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    },

    /**
     * Validate form inputs
     * @param {string} username - Username/email
     * @param {string} password - Password
     * @param {string} role - User role
     * @returns {boolean} Validation result
     */
    validateInputs: function(username, password, role) {
        if (!username || !password || !role) {
            this.showError('Lütfen tüm alanları doldurunuz.');
            return false;
        }

        if (username.length < 3) {
            this.showError('Kullanıcı adı en az 3 karakter olmalıdır.');
            return false;
        }

        if (password.length < 3) {
            this.showError('Şifre en az 3 karakter olmalıdır.');
            return false;
        }

        const validRoles = [AUTH_CONFIG.ROLES.ADMIN, AUTH_CONFIG.ROLES.TEACHER, AUTH_CONFIG.ROLES.PARENT];
        if (!validRoles.includes(role)) {
            this.showError('Geçersiz kullanıcı rolü.');
            return false;
        }

        return true;
    },

    /**
     * Sanitize input string
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
    },

    /**
     * Generate random session ID
     * @returns {string} Session ID
     */
    generateSessionId: function() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    },

    /**
     * Check if running in development mode
     * @returns {boolean} Development mode status
     */
    isDevelopment: function() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev.');
    }
};

// =============================================
// SESSION MANAGEMENT
// =============================================

const SessionManager = {
    /**
     * Save user session to localStorage
     * @param {Object} userData - User data to save
     */
    saveUserSession: function(userData) {
        try {
            const sessionData = {
                user: {
                    uid: userData.uid,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    name: userData.name,
                    class: userData.class || null
                },
                meta: {
                    loginTime: new Date().toISOString(),
                    expiryTime: new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION).toISOString(),
                    sessionId: Utils.generateSessionId(),
                    userAgent: navigator.userAgent
                },
                tokens: {
                    refreshToken: userData.refreshToken || null,
                    accessToken: userData.accessToken || null
                }
            };

            localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionData));
            console.log('💾 User session saved:', userData.username);
            
            // Dispatch session saved event
            window.dispatchEvent(new CustomEvent('sessionSaved', { detail: sessionData }));
        } catch (error) {
            console.error('❌ Session save error:', error);
            Utils.showError('Oturum kaydedilemedi. LocalStorage erişim hatası.');
        }
    },

    /**
     * Get current user session
     * @returns {Object|null} User session data
     */
    getCurrentSession: function() {
        try {
            const sessionData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
            if (!sessionData) return null;

            const session = JSON.parse(sessionData);
            
            // Validate session structure
            if (!session.user || !session.meta) {
                this.clearSession();
                return null;
            }

            return session;
        } catch (error) {
            console.error('❌ Session retrieval error:', error);
            this.clearSession();
            return null;
        }
    },

    /**
     * Clear user session
     */
    clearSession: function() {
        try {
            Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            sessionStorage.clear();
            
            console.log('🗑️ User session cleared');
            
            // Dispatch session cleared event
            window.dispatchEvent(new CustomEvent('sessionCleared'));
        } catch (error) {
            console.error('❌ Session clear error:', error);
        }
    },

    /**
     * Check if session is valid
     * @returns {boolean} Session validity
     */
    isSessionValid: function() {
        const session = this.getCurrentSession();
        if (!session) return false;

        // Check session expiry
        const expiryTime = new Date(session.meta.expiryTime);
        if (expiryTime < new Date()) {
            console.log('⏰ Session expired');
            this.clearSession();
            return false;
        }

        // Check user agent consistency (basic security)
        if (session.meta.userAgent !== navigator.userAgent) {
            console.warn('⚠️ User agent mismatch');
            return false;
        }

        return true;
    },

    /**
     * Refresh session expiry
     */
    refreshSession: function() {
        const session = this.getCurrentSession();
        if (!session) return;

        session.meta.expiryTime = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION).toISOString();
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        
        console.log('🔄 Session refreshed');
    },

    /**
     * Get current user data
     * @returns {Object|null} User data
     */
    getCurrentUser: function() {
        const session = this.getCurrentSession();
        return session ? session.user : null;
    }
};

// =============================================
// USER SERVICE
// =============================================

const UserService = {
    /**
     * Find user in Firestore by username and role
     * @param {string} username - Username to search
     * @param {string} role - User role
     * @returns {Object|null} User data
     */
    findUserByUsername: async function(username, role) {
        try {
            console.log('🔍 Searching user:', { username, role });

            const userQuery = query(
                collection(db, 'users'),
                where('username', '==', username.toLowerCase()),
                where('role', '==', role),
                where('isActive', '==', true)
            );

            const querySnapshot = await getDocs(userQuery);
            
            if (querySnapshot.empty) {
                throw new Error('Kullanıcı bulunamadı veya hesap pasif durumda.');
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            console.log('✅ User found:', userData.username);

            return {
                id: userDoc.id,
                ...userData,
                email: userData.email || `${username}@ogrencitakip.com`
            };
        } catch (error) {
            console.error('❌ User search error:', error);
            
            if (error.message.includes('permission') || error.message.includes('missing')) {
                throw new Error('Veritabanı erişim hatası. Lütfen sistem yöneticisi ile iletişime geçin.');
            }
            
            throw new Error('Kullanıcı arama işlemi başarısız: ' + error.message);
        }
    },

    /**
     * Create admin user in Firestore
     * @param {string} userId - Firebase Auth user ID
     * @param {string} email - User email
     * @returns {Promise} Firestore write operation
     */
    createAdminUser: async function(userId, email) {
        try {
            const adminData = {
                username: AUTH_CONFIG.ADMIN_CREDENTIALS.username,
                email: email,
                role: AUTH_CONFIG.ROLES.ADMIN,
                name: 'Sistem Yöneticisi',
                isActive: true,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                permissions: ['all'],
                settings: {
                    theme: 'light',
                    language: 'tr',
                    notifications: true
                }
            };

            await setDoc(doc(db, 'users', userId), adminData);
            console.log('👑 Admin user created successfully');
            return adminData;
        } catch (error) {
            console.error('❌ Admin user creation error:', error);
            throw new Error('Admin kullanıcı oluşturulamadı: ' + error.message);
        }
    },

    /**
     * Update user last login timestamp
     * @param {string} userId - User ID
     */
    updateLastLogin: async function(userId) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                lastLogin: serverTimestamp(),
                loginCount: await this.incrementLoginCount(userId)
            });
            
            console.log('📝 Last login updated for user:', userId);
        } catch (error) {
            console.error('❌ Last login update error:', error);
            // Non-critical error, don't throw
        }
    },

    /**
     * Increment user login count
     * @param {string} userId - User ID
     * @returns {number} New login count
     */
    incrementLoginCount: async function(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return (userData.loginCount || 0) + 1;
            }
            return 1;
        } catch (error) {
            console.error('❌ Login count increment error:', error);
            return 1;
        }
    },

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object|null} User data
     */
    getUserById: async function(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
        } catch (error) {
            console.error('❌ Get user by ID error:', error);
            throw new Error('Kullanıcı bilgileri alınamadı.');
        }
    }
};

// =============================================
// AUTHENTICATION SERVICE
// =============================================

const AuthService = {
    /**
     * Handle user login process
     */
    handleLogin: async function() {
        const username = DomManager.elements.usernameInput?.value.trim();
        const password = DomManager.elements.passwordInput?.value;
        const role = DomManager.getSelectedRole();

        // Input validation
        if (!Utils.validateInputs(username, password, role)) {
            return;
        }

        Utils.setButtonState(true, 'Giriş Yapılıyor...');

        try {
            // Admin special handling
            if (role === AUTH_CONFIG.ROLES.ADMIN && 
                username === AUTH_CONFIG.ADMIN_CREDENTIALS.username && 
                password === AUTH_CONFIG.ADMIN_CREDENTIALS.password) {
                await this.handleAdminLogin();
                return;
            }

            // Teacher and parent login
            if (role === AUTH_CONFIG.ROLES.TEACHER || role === AUTH_CONFIG.ROLES.PARENT) {
                await this.handleStandardUserLogin(username, password, role);
                return;
            }

            throw new Error('Geçersiz kullanıcı rolü.');

        } catch (error) {
            console.error('❌ Login process error:', error);
            Utils.showError('Giriş başarısız: ' + error.message);
        } finally {
            Utils.setButtonState(false);
        }
    },

    /**
     * Handle admin login process
     */
    handleAdminLogin: async function() {
        try {
            const adminEmail = AUTH_CONFIG.ADMIN_CREDENTIALS.email;
            const adminPassword = AUTH_CONFIG.ADMIN_CREDENTIALS.password;

            console.log('👑 Admin login attempt');

            // Try to sign in as admin
            try {
                const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                console.log('✅ Admin Firebase login successful');
            } catch (authError) {
                if (authError.code === 'auth/user-not-found') {
                    // Create admin user if doesn't exist
                    console.log('👑 Creating new admin account...');
                    await this.createAdminAccount(adminEmail, adminPassword);
                } else {
                    console.error('❌ Admin Firebase auth error:', authError);
                    throw authError;
                }
            }

            // Verify admin user exists in Firestore
            const adminUser = await UserService.findUserByUsername(
                AUTH_CONFIG.ADMIN_CREDENTIALS.username, 
                AUTH_CONFIG.ROLES.ADMIN
            );

            // Save admin session
            const adminUserData = {
                uid: auth.currentUser.uid,
                role: AUTH_CONFIG.ROLES.ADMIN,
                username: AUTH_CONFIG.ADMIN_CREDENTIALS.username,
                name: 'Sistem Yöneticisi',
                email: adminEmail,
                permissions: ['all']
            };

            SessionManager.saveUserSession(adminUserData);
            await UserService.updateLastLogin(auth.currentUser.uid);
            
            console.log('✅ Admin login completed successfully');
            this.redirectToDashboard(AUTH_CONFIG.ROLES.ADMIN);

        } catch (error) {
            console.error('❌ Admin login error:', error);
            
            // Sign out from Firebase if admin login fails
            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error('❌ Sign out error during admin login failure:', signOutError);
            }
            
            throw new Error('Admin girişi başarısız: ' + error.message);
        }
    },

    /**
     * Create admin account in Firebase Auth and Firestore
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     */
    createAdminAccount: async function(email, password) {
        try {
            console.log('👑 Creating admin account in Firebase Auth...');
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('✅ Admin Firebase Auth account created');
            
            // Send email verification
            await sendEmailVerification(userCredential.user);
            console.log('📧 Admin email verification sent');
            
            // Create admin user in Firestore
            await UserService.createAdminUser(userCredential.user.uid, email);
            console.log('✅ Admin Firestore record created');
            
        } catch (error) {
            console.error('❌ Admin account creation error:', error);
            
            // Clean up: delete Firebase Auth user if Firestore creation fails
            if (auth.currentUser) {
                try {
                    await auth.currentUser.delete();
                } catch (deleteError) {
                    console.error('❌ Failed to cleanup admin user:', deleteError);
                }
            }
            
            throw new Error('Admin hesabı oluşturulamadı: ' + error.message);
        }
    },

    /**
     * Handle standard user (teacher/parent) login
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {string} role - User role
     */
    handleStandardUserLogin: async function(username, password, role) {
        try {
            console.log(`🔐 ${role} login attempt:`, username);

            // Find user in Firestore
            const userData = await UserService.findUserByUsername(username, role);
            
            if (!userData.email) {
                throw new Error('Kullanıcı e-posta adresi bulunamadı.');
            }

            // Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
            const firebaseUser = userCredential.user;

            console.log('✅ Firebase authentication successful');

            // Prepare session data
            const sessionData = {
                uid: firebaseUser.uid,
                role: role,
                username: userData.username,
                name: userData.name,
                email: userData.email,
                class: userData.class || null,
                permissions: userData.permissions || [],
                settings: userData.settings || {}
            };

            // Save session and update last login
            SessionManager.saveUserSession(sessionData);
            await UserService.updateLastLogin(firebaseUser.uid);

            console.log(`✅ ${role} login successful:`, userData.username);
            this.redirectToDashboard(role);

        } catch (error) {
            console.error(`❌ ${role} login error:`, error);
            
            // Enhanced error handling with specific messages
            switch (error.code) {
                case 'auth/wrong-password':
                    throw new Error('Hatalı şifre. Lütfen tekrar deneyin.');
                
                case 'auth/user-not-found':
                    throw new Error('Kullanıcı bulunamadı. Bilgilerinizi kontrol edin.');
                
                case 'auth/too-many-requests':
                    throw new Error('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.');
                
                case 'auth/invalid-email':
                    throw new Error('Geçersiz e-posta formatı.');
                
                case 'auth/user-disabled':
                    throw new Error('Bu hesap devre dışı bırakılmış.');
                
                case 'auth/network-request-failed':
                    throw new Error('Ağ bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
                
                default:
                    throw new Error('Giriş işlemi başarısız: ' + (error.message || 'Bilinmeyen hata'));
            }
        }
    },

    /**
     * Redirect user to appropriate dashboard
     * @param {string} role - User role
     */
    redirectToDashboard: function(role) {
        const redirectPaths = {
            [AUTH_CONFIG.ROLES.ADMIN]: AUTH_CONFIG.PATHS.ADMIN,
            [AUTH_CONFIG.ROLES.TEACHER]: AUTH_CONFIG.PATHS.TEACHER,
            [AUTH_CONFIG.ROLES.PARENT]: AUTH_CONFIG.PATHS.PARENT
        };

        const redirectPath = redirectPaths[role];
        
        if (!redirectPath) {
            Utils.showError('Geçersiz kullanıcı rolü için yönlendirme yapılamıyor.');
            return;
        }

        Utils.showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // Add loading state to body
        document.body.classList.add('redirecting');
        
        setTimeout(() => {
            window.location.href = redirectPath;
        }, AUTH_CONFIG.REDIRECT_DELAY);
    },

    /**
     * Handle user logout
     */
    handleLogout: async function() {
        try {
            Utils.setButtonState(true, 'Çıkış Yapılıyor...');
            
            const currentUser = SessionManager.getCurrentUser();
            
            await signOut(auth);
            SessionManager.clearSession();
            
            console.log('✅ User logged out successfully:', currentUser?.username);
            
            // Show logout success message
            Utils.showSuccess('Başarıyla çıkış yapıldı.');
            
            setTimeout(() => {
                window.location.href = AUTH_CONFIG.PATHS.LOGIN;
            }, AUTH_CONFIG.REDIRECT_DELAY);
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            Utils.showError('Çıkış işlemi başarısız: ' + error.message);
            
            // Force logout even if there's an error
            SessionManager.clearSession();
            window.location.href = AUTH_CONFIG.PATHS.LOGIN;
        }
    },

    /**
     * Initialize authentication state observer
     */
    initializeAuthStateObserver: function() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('🔐 User authentication state: Logged in', user.uid);
                
                // Dispatch custom event for auth state change
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { 
                        isAuthenticated: true, 
                        user: user,
                        timestamp: new Date().toISOString()
                    } 
                }));
            } else {
                console.log('🔐 User authentication state: Logged out');
                
                // Only clear session if it's not a page redirect
                if (!document.body.classList.contains('redirecting')) {
                    SessionManager.clearSession();
                }
                
                // Dispatch custom event for auth state change
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { 
                        isAuthenticated: false, 
                        user: null,
                        timestamp: new Date().toISOString()
                    } 
                }));
            }
        }, (error) => {
            console.error('❌ Auth state observer error:', error);
            Utils.showError('Kimlik doğrulama sistemi hatası.');
        });
    },

    /**
     * Reset user password
     * @param {string} email - User email
     */
    resetPassword: async function(email) {
        try {
            if (!email) {
                throw new Error('Lütfen e-posta adresinizi giriniz.');
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Lütfen geçerli bir e-posta adresi giriniz.');
            }

            await sendPasswordResetEmail(auth, email);
            Utils.showSuccess('Şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutunuzu kontrol edin.');
            
            console.log('📧 Password reset email sent to:', email);
            
        } catch (error) {
            console.error('❌ Password reset error:', error);
            
            switch (error.code) {
                case 'auth/user-not-found':
                    throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
                
                case 'auth/invalid-email':
                    throw new Error('Geçersiz e-posta adresi formatı.');
                
                case 'auth/too-many-requests':
                    throw new Error('Çok fazla şifre sıfırlama isteği gönderildi. Lütfen daha sonra tekrar deneyin.');
                
                case 'auth/network-request-failed':
                    throw new Error('Ağ bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
                
                default:
                    throw new Error('Şifre sıfırlama işlemi başarısız: ' + error.message);
            }
        }
    },

    /**
     * Update user password
     * @param {string} newPassword - New password
     */
    updatePassword: async function(newPassword) {
        try {
            if (!newPassword || newPassword.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır.');
            }

            const user = auth.currentUser;
            if (!user) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            await updatePassword(user, newPassword);
            Utils.showSuccess('Şifreniz başarıyla güncellendi.');
            
            console.log('✅ Password updated for user:', user.uid);
            
        } catch (error) {
            console.error('❌ Password update error:', error);
            throw new Error('Şifre güncelleme işlemi başarısız: ' + error.message);
        }
    },

    /**
     * Verify current user session
     * @returns {boolean} Session validity
     */
    verifyCurrentSession: function() {
        const sessionValid = SessionManager.isSessionValid();
        const firebaseUser = auth.currentUser;
        
        if (sessionValid && firebaseUser) {
            console.log('✅ Session verification: Valid');
            return true;
        }
        
        if (sessionValid && !firebaseUser) {
            console.warn('⚠️ Session verification: Session exists but no Firebase user');
            SessionManager.clearSession();
            return false;
        }
        
        console.log('❌ Session verification: Invalid');
        return false;
    }
};

// =============================================
// ROUTE PROTECTION SERVICE
// =============================================

const RouteProtectionService = {
    /**
     * Check if user can access current route
     * @param {string} requiredRole - Required role for the route
     * @returns {boolean} Access permission
     */
    canAccessRoute: function(requiredRole = null) {
        const currentSession = SessionManager.getCurrentSession();
        
        if (!currentSession) {
            console.warn('🚫 Route access denied: No session');
            return false;
        }

        // Verify session validity
        if (!SessionManager.isSessionValid()) {
            console.warn('🚫 Route access denied: Invalid session');
            return false;
        }

        // Verify Firebase auth state
        if (!auth.currentUser) {
            console.warn('🚫 Route access denied: No Firebase user');
            return false;
        }

        // Role-based access control
        if (requiredRole && currentSession.user.role !== requiredRole) {
            console.warn(`🚫 Route access denied: User ${currentSession.user.username} (${currentSession.user.role}) attempted to access ${requiredRole} route`);
            return false;
        }

        console.log(`✅ Route access granted: ${currentSession.user.role} accessing ${requiredRole || 'any'} route`);
        return true;
    },

    /**
     * Protect route based on user role
     * @param {string} requiredRole - Required role
     * @returns {boolean} Access granted
     */
    protectRoute: function(requiredRole = null) {
        if (!this.canAccessRoute(requiredRole)) {
            console.warn(`🚫 Route protection triggered: Redirecting to login`);
            
            // Clear invalid session
            SessionManager.clearSession();
            
            // Show access denied message
            Utils.showError('Bu sayfaya erişim izniniz yok veya oturumunuz sona erdi.');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = AUTH_CONFIG.PATHS.LOGIN;
            }, AUTH_CONFIG.REDIRECT_DELAY);
            
            return false;
        }
        
        // Refresh session on valid access
        SessionManager.refreshSession();
        return true;
    },

    /**
     * Initialize route protection for the current page
     */
    initializeRouteProtection: function() {
        const currentPath = window.location.pathname;
        let requiredRole = null;

        if (currentPath.includes(AUTH_CONFIG.PATHS.ADMIN)) {
            requiredRole = AUTH_CONFIG.ROLES.ADMIN;
        } else if (currentPath.includes(AUTH_CONFIG.PATHS.TEACHER)) {
            requiredRole = AUTH_CONFIG.ROLES.TEACHER;
        } else if (currentPath.includes(AUTH_CONFIG.PATHS.PARENT)) {
            requiredRole = AUTH_CONFIG.ROLES.PARENT;
        }

        if (requiredRole) {
            console.log(`🛡️ Initializing route protection for: ${requiredRole}`);
            this.protectRoute(requiredRole);
        }
    },

    /**
     * Get accessible routes for current user
     * @returns {Array} Accessible routes
     */
    getAccessibleRoutes: function() {
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser) return [];

        const allRoutes = {
            [AUTH_CONFIG.ROLES.ADMIN]: [AUTH_CONFIG.PATHS.ADMIN, AUTH_CONFIG.PATHS.TEACHER, AUTH_CONFIG.PATHS.PARENT],
            [AUTH_CONFIG.ROLES.TEACHER]: [AUTH_CONFIG.PATHS.TEACHER],
            [AUTH_CONFIG.ROLES.PARENT]: [AUTH_CONFIG.PATHS.PARENT]
        };

        return allRoutes[currentUser.role] || [];
    }
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================

const AppInitializer = {
    /**
     * Initialize the authentication application
     */
    initialize: function() {
        try {
            console.log('🚀 Initializing authentication system...');
            
            // Initialize DOM elements
            DomManager.initialize();
            
            // Initialize core systems
            this.initializeEventListeners();
            this.checkExistingSession();
            AuthService.initializeAuthStateObserver();
            RouteProtectionService.initializeRouteProtection();
            
            // Initialize performance monitoring
            this.initializePerformanceMonitoring();
            
            console.log('✅ Authentication system initialized successfully');
            
            // Dispatch initialization complete event
            window.dispatchEvent(new CustomEvent('authSystemInitialized'));
            
        } catch (error) {
            console.error('❌ Application initialization error:', error);
            Utils.showError('Sistem başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.');
        }
    },

    /**
     * Initialize event listeners
     */
    initializeEventListeners: function() {
        // Login button event listener
        if (DomManager.elements.loginBtn) {
            DomManager.elements.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthService.handleLogin();
            });
        }

        // Enter key support for login form
        if (DomManager.elements.passwordInput) {
            DomManager.elements.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    AuthService.handleLogin();
                }
            });
        }

        // Form input validation on change
        if (DomManager.elements.usernameInput && DomManager.elements.passwordInput) {
            [DomManager.elements.usernameInput, DomManager.elements.passwordInput].forEach(input => {
                input.addEventListener('input', () => {
                    if (DomManager.elements.errorMessage?.style.display === 'block') {
                        DomManager.elements.errorMessage.style.display = 'none';
                    }
                });
            });
        }

        // Role selection change listener
        if (DomManager.elements.roleInputs) {
            DomManager.elements.roleInputs.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (DomManager.elements.errorMessage?.style.display === 'block') {
                        DomManager.elements.errorMessage.style.display = 'none';
                    }
                });
            });
        }

        // Global logout handler
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="logout"]') || 
                e.target.closest('[data-action="logout"]')) {
                e.preventDefault();
                AuthService.handleLogout();
            }
        });

        // Page visibility change handler (session management)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, verify session
                AuthService.verifyCurrentSession();
            }
        });

        console.log('✅ Event listeners initialized');
    },

    /**
     * Check for existing valid session
     */
    checkExistingSession: function() {
        const currentSession = SessionManager.getCurrentSession();
        
        if (currentSession && SessionManager.isSessionValid() && 
            this.isLoginPage()) {
            
            console.log('🔄 Existing valid session found, redirecting to dashboard...');
            AuthService.redirectToDashboard(currentSession.user.role);
        }
    },

    /**
     * Check if current page is login page
     * @returns {boolean} Login page status
     */
    isLoginPage: function() {
        return window.location.pathname.endsWith(AUTH_CONFIG.PATHS.LOGIN) ||
               window.location.pathname === '/' ||
               window.location.pathname.endsWith('index.html');
    },

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring: function() {
        // Monitor authentication performance
        const authPerf = {
            startTime: Date.now(),
            initTime: null
        };

        window.addEventListener('authSystemInitialized', () => {
            authPerf.initTime = Date.now();
            const loadTime = authPerf.initTime - authPerf.startTime;
            console.log(`⏱️ Authentication system loaded in ${loadTime}ms`);
        });

        // Monitor session operations
        const originalSaveSession = SessionManager.saveUserSession;
        SessionManager.saveUserSession = function(...args) {
            const start = Date.now();
            const result = originalSaveSession.apply(this, args);
            const duration = Date.now() - start;
            console.log(`⏱️ Session save operation: ${duration}ms`);
            return result;
        };
    }
};

// =============================================
// ENHANCED AUTH MANAGER (Legacy Support)
// =============================================

class EnhancedAuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        this.sessionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
        this.init();
    }
    
    /**
     * Initialize enhanced auth manager
     */
    init() {
        this.loadSession();
        
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthenticationStatus();
        });

        // Sync with main auth system
        window.addEventListener('authStateChanged', (event) => {
            this.syncWithMainAuth(event.detail);
        });

        console.log('🔄 Enhanced Auth Manager initialized');
    }
    
    /**
     * Sync with main authentication system
     * @param {Object} authState - Auth state from main system
     */
    syncWithMainAuth(authState) {
        if (authState.isAuthenticated && authState.user) {
            this.currentUser = {
                username: authState.user.displayName || SessionManager.getCurrentUser()?.username,
                name: authState.user.displayName || SessionManager.getCurrentUser()?.name,
                role: SessionManager.getCurrentUser()?.role,
                email: authState.user.email
            };
            this.isAuthenticated = true;
            this.token = await authState.user.getIdToken();
        } else {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.token = null;
        }
    }
    
    /**
     * Enhanced login method
     */
    async login(username, password, rememberMe = false) {
        try {
            this.setLoadingState(true);
            
            // Use main auth service
            const role = DomManager.getSelectedRole();
            
            if (!Utils.validateInputs(username, password, role)) {
                return false;
            }

            // Delegate to main auth service
            if (role === AUTH_CONFIG.ROLES.ADMIN && 
                username === AUTH_CONFIG.ADMIN_CREDENTIALS.username && 
                password === AUTH_CONFIG.ADMIN_CREDENTIALS.password) {
                await AuthService.handleAdminLogin();
            } else {
                await AuthService.handleStandardUserLogin(username, password, role);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Enhanced login error:', error);
            this.showErrorMessage(error.message || 'Giriş başarısız!');
            return false;
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Enhanced logout method
     */
    logout() {
        AuthService.handleLogout();
    }
    
    /**
     * Save session data
     */
    saveSession(rememberMe) {
        const sessionData = {
            user: this.currentUser,
            token: this.token,
            timestamp: Date.now()
        };
        
        if (rememberMe) {
            localStorage.setItem('student_tracking_session_v2', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('student_tracking_session_v2', JSON.stringify(sessionData));
        }
    }
    
    /**
     * Load session data
     */
    loadSession() {
        let sessionData = sessionStorage.getItem('student_tracking_session_v2') || 
                         localStorage.getItem('student_tracking_session_v2');
        
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                
                if (Date.now() - data.timestamp < this.sessionDuration) {
                    this.currentUser = data.user;
                    this.token = data.token;
                    this.isAuthenticated = true;
                } else {
                    this.clearSession();
                }
            } catch (error) {
                console.error('❌ Enhanced session load error:', error);
                this.clearSession();
            }
        }
    }
    
    /**
     * Clear session data
     */
    clearSession() {
        sessionStorage.removeItem('student_tracking_session_v2');
        localStorage.removeItem('student_tracking_session_v2');
        this.currentUser = null;
        this.token = null;
        this.isAuthenticated = false;
    }
    
    /**
     * Check authentication status
     */
    checkAuthenticationStatus() {
        if (this.isAuthenticated && this.isLoginPage()) {
            this.redirectToDashboard();
        }
    }
    
    /**
     * Check if current page is login page
     */
    isLoginPage() {
        return window.location.pathname === '/' || 
               window.location.pathname.includes('index.html');
    }
    
    /**
     * Redirect to dashboard
     */
    redirectToDashboard() {
        if (!this.currentUser) return;
        
        const role = this.currentUser.role;
        AuthService.redirectToDashboard(role);
    }
    
    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        const submitBtn = document.querySelector('.submit-btn');
        
        if (submitBtn) {
            if (isLoading) {
                submitBtn.innerHTML = '<span>Giriş Yapılıyor...</span>';
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
            } else {
                submitBtn.innerHTML = `
                    <span>GİRİŞ YAP</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M13 7L16 10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        }
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(message) {
        Utils.showSuccess(message);
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        Utils.showError(message);
    }
    
    /**
     * Check user permissions
     */
    hasPermission(requiredRole) {
        if (!this.isAuthenticated || !this.currentUser) return false;
        
        const userRole = this.currentUser.role;
        const roleHierarchy = {
            'admin': ['admin', 'teacher', 'parent'],
            'teacher': ['teacher', 'parent'],
            'parent': ['parent']
        };
        
        return roleHierarchy[userRole]?.includes(requiredRole) || false;
    }
    
    /**
     * Validate token
     */
    validateToken(token) {
        try {
            const decoded = atob(token);
            return decoded.includes(':');
        } catch (error) {
            return false;
        }
    }
}

// =============================================
// GLOBAL EXPORTS AND INITIALIZATION
// =============================================

// Export public methods
export { 
    AuthService, 
    SessionManager, 
    RouteProtectionService,
    UserService,
    Utils,
    DomManager,
    AppInitializer
};

// Initialize enhanced auth manager
const enhancedAuthManager = new EnhancedAuthManager();

// Global access for legacy support
window.authManager = enhancedAuthManager;

// Global logout function
window.logout = function() {
    AuthService.handleLogout();
};

// Global route protection function
window.requireAuth = function(requiredRole = null) {
    return RouteProtectionService.protectRoute(requiredRole);
};

// Global password reset function
window.resetPassword = function(email) {
    return AuthService.resetPassword(email);
};

// Initialize application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        AppInitializer.initialize();
    });
} else {
    AppInitializer.initialize();
}

// Global error handler for authentication errors
window.addEventListener('error', function(e) {
    if (e.error && (e.error.message.includes('auth') || e.error.message.includes('firebase'))) {
        console.error('🌐 Global authentication error:', e.error);
        Utils.showError('Bir kimlik doğrulama hatası oluştu. Lütfen sayfayı yenileyin.');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && (e.reason.message.includes('auth') || e.reason.code?.includes('auth'))) {
        console.error('🌐 Unhandled auth promise rejection:', e.reason);
        Utils.showError('Bir sistem hatası oluştu. Lütfen işlemi tekrar deneyin.');
    }
});

// Page unload handler for cleanup
window.addEventListener('beforeunload', function() {
    // Clean up any temporary states
    document.body.classList.remove('redirecting');
});

console.log('🔐 Authentication module loaded successfully');