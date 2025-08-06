// Authentication Manager Module

export class AuthManager {
    constructor() {
        // Load admin credentials from environment variables
        // For Jekyll/GitHub Pages, we'll use a config approach
        this.adminId = this.loadEnvVar('VITE_ADMIN_ID');
        this.adminPw = this.loadEnvVar('VITE_ADMIN_PW');
        this.isAuthenticated = false;
        this.sessionKey = 'jekyll-admin-session';
        
        // Check for existing session on initialization
        this.checkAuth();
    }
    
    /**
     * Load environment variable (fallback for Jekyll environment)
     * @param {string} varName - Environment variable name
     * @returns {string|null} - Environment variable value
     */
    loadEnvVar(varName) {
        // Try different methods to access environment variables
        if (typeof process !== 'undefined' && process.env) {
            return process.env[varName];
        }
        
        // For client-side, check if variables are injected via build process
        if (typeof window !== 'undefined' && window.ENV) {
            return window.ENV[varName];
        }
        
        // Fallback: check for meta tags (can be set by Jekyll)
        const metaTag = document.querySelector(`meta[name="env-${varName.toLowerCase()}"]`);
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        return null;
    }
    
    /**
     * Authenticate user with provided credentials
     * @param {string} id - User ID
     * @param {string} password - User password
     * @returns {Promise<boolean>} - Authentication success
     */
    async login(id, password) {
        try {
            // Simple credential check (client-side only)
            if (id === this.adminId && password === this.adminPw) {
                this.isAuthenticated = true;
                
                // Store session in localStorage
                const sessionData = {
                    authenticated: true,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                
                localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
                
                console.log('Authentication successful');
                return true;
            } else {
                console.log('Authentication failed: Invalid credentials');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }
    
    /**
     * Log out the current user
     */
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem(this.sessionKey);
        console.log('User logged out');
    }
    
    /**
     * Check current authentication status
     * @returns {boolean} - Current authentication status
     */
    checkAuth() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            
            if (!sessionData) {
                this.isAuthenticated = false;
                return false;
            }
            
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // Check if session has expired
            if (now > session.expires) {
                this.logout();
                return false;
            }
            
            // Extend session if it's still valid
            if (session.authenticated) {
                this.isAuthenticated = true;
                
                // Extend session expiry
                session.expires = now + (24 * 60 * 60 * 1000);
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            this.logout();
            return false;
        }
    }
    
    /**
     * Get current authentication status
     * @returns {boolean}
     */
    get authenticated() {
        return this.isAuthenticated;
    }
    
    /**
     * Get session information
     * @returns {Object|null}
     */
    getSessionInfo() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Error getting session info:', error);
            return null;
        }
    }
    
    /**
     * Check if session is about to expire (within 1 hour)
     * @returns {boolean}
     */
    isSessionExpiringSoon() {
        const session = this.getSessionInfo();
        if (!session) return false;
        
        const oneHour = 60 * 60 * 1000;
        return (session.expires - Date.now()) < oneHour;
    }
    
    /**
     * Extend current session
     */
    extendSession() {
        if (this.isAuthenticated) {
            const sessionData = {
                authenticated: true,
                timestamp: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
    }
    
    /**
     * Clear all authentication data
     */
    clearAuthData() {
        this.isAuthenticated = false;
        localStorage.removeItem(this.sessionKey);
        
        // Clear any other auth-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jekyll-admin-')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
}