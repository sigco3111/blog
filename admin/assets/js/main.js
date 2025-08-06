// Jekyll Admin - Main Application Entry Point

// Load modules dynamically
async function loadModules() {
    try {
        const authModule = await import('./modules/auth.js');
        const routerModule = await import('./modules/router.js');
        const uiModule = await import('./modules/ui.js');
        const postManagerModule = await import('./modules/post-manager.js');
        const configManagerModule = await import('./modules/config-manager.js');
        const errorHandlerModule = await import('./modules/error-handler.js');
        const notificationModule = await import('./modules/notification-system.js');
        const loadingManagerModule = await import('./modules/loading-manager.js');
        
        return {
            AuthManager: authModule.AuthManager,
            Router: routerModule.Router,
            UIManager: uiModule.UIManager,
            PostManager: postManagerModule.PostManager,
            ConfigManager: configManagerModule.default || configManagerModule.ConfigManager,
            ErrorHandler: errorHandlerModule.globalErrorHandler,
            NotificationSystem: notificationModule.globalNotificationSystem,
            LoadingManager: loadingManagerModule.globalLoadingManager
        };
    } catch (error) {
        console.error('Failed to load modules:', error);
        throw error;
    }
}

// Application configuration
const CONFIG = {
    routes: {
        '/': 'login',
        '/dashboard': 'dashboard',
        '/posts': 'posts',
        '/posts/new': 'post-editor',
        '/posts/edit/:id': 'post-editor',
        '/settings': 'settings'
    }
};

// Main application class
class AdminApp {
    constructor() {
        console.log('AdminApp constructor called');
        this.modules = null;
        this.auth = null;
        this.router = null;
        this.ui = null;
        this.postManager = null;
        this.errorHandler = null;
        this.notificationSystem = null;
        this.loadingManager = null;
        
        this.init();
    }
    
    async loadAndInitializeModules() {
        console.log('Loading modules...');
        this.modules = await loadModules();
        console.log('Modules loaded successfully');
        
        this.auth = new this.modules.AuthManager();
        this.router = new this.modules.Router(CONFIG.routes);
        this.ui = new this.modules.UIManager();
        this.postManager = new this.modules.PostManager();
        this.errorHandler = this.modules.ErrorHandler;
        this.notificationSystem = this.modules.NotificationSystem;
        this.loadingManager = this.modules.LoadingManager;
        
        console.log('Module instances created');
    }
    
    async init() {
        try {
            console.log('Starting Jekyll Admin initialization...');
            
            // Load modules first
            await this.loadAndInitializeModules();
            
            // Initialize UI
            console.log('Initializing UI...');
            this.ui.init();
            console.log('UI initialized successfully');
            
            // Initialize PostManager
            console.log('Initializing PostManager...');
            await this.postManager.init();
            console.log('PostManager initialized successfully');
            
            // Pass PostManager to UI for integration
            console.log('Setting PostManager in UI...');
            this.ui.setPostManager(this.postManager);
            
            // Check authentication status
            console.log('Checking authentication...');
            const isAuthenticated = this.auth.checkAuth();
            console.log('Authentication status:', isAuthenticated);
            
            // Initialize router with auth check
            console.log('Initializing router...');
            this.router.init(
                (route, routeInfo) => this.handleRouteChange(route, routeInfo),
                (fromPath, toPath) => this.beforeRouteChange(fromPath, toPath)
            );
            console.log('Router initialized successfully');
            
            // Force immediate route handling
            console.log('Forcing immediate route handling...');
            const currentHash = window.location.hash.slice(1) || '/';
            console.log('Current hash:', currentHash);
            
            // Clear any existing content first
            const appContainer = document.getElementById('app');
            if (appContainer) {
                appContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
            }
            
            // Handle route immediately
            this.handleDirectRoute(currentHash);
            
            // Add hash change listener that actually works
            window.addEventListener('hashchange', () => {
                console.log('Hash changed to:', window.location.hash);
                const hash = window.location.hash.slice(1) || '/';
                this.handleDirectRoute(hash);
            });
            
            // Set up global event listeners
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Event listeners set up successfully');
            
            // Hide loading spinner
            this.hideLoading();
            
            console.log('Jekyll Admin initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Jekyll Admin:', error);
            console.error('Error stack:', error);
            
            // Use error handler if available
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'initialization',
                    message: `Failed to initialize application: ${error.message}`,
                    stack: error.stack,
                    severity: 'critical'
                });
            } else {
                this.showError(`Failed to initialize application: ${error.message}`);
            }
        }
    }
    
    handleRouteChange(route, routeInfo) {
        const { path, params, query, previousRoute, isPopState } = routeInfo;
        const isAuthenticated = this.auth.checkAuth();
        
        // Redirect to login if not authenticated and trying to access protected routes
        if (!isAuthenticated && route !== 'login') {
            this.router.navigate('/', true);
            return;
        }
        
        // Redirect to dashboard if authenticated and trying to access login
        if (isAuthenticated && route === 'login') {
            this.router.navigate('/dashboard', true);
            return;
        }
        
        // Handle route rendering with additional context
        this.renderRoute(route, { path, params, query, previousRoute, isPopState });
    }
    
    renderRoute(route, routeContext = {}) {
        const appContainer = document.getElementById('app');
        const { path, params, query, previousRoute, isPopState } = routeContext;
        
        // Add route context to UI manager
        this.ui.setRouteContext(routeContext);
        
        switch (route) {
            case 'login':
                this.ui.renderLogin(appContainer);
                break;
            case 'dashboard':
                this.ui.renderDashboard(appContainer);
                break;
            case 'posts':
                this.ui.renderPostList(appContainer);
                break;
            case 'post-editor':
                this.ui.renderPostEditor(appContainer);
                // Load post editor content after rendering
                setTimeout(() => {
                    const postId = params.id || null;
                    this.ui.loadPostEditorContent(postId);
                }, 100);
                break;
            case 'settings':
                this.ui.renderSettings(appContainer);
                break;
            default:
                this.ui.renderNotFound(appContainer);
        }
        
        // Update page title based on route
        this.updatePageTitle(route, params);
        
        // Scroll to top on route change (unless it's a popstate event)
        if (!isPopState) {
            window.scrollTo(0, 0);
        }
    }
    
    /**
     * Handle route directly without router
     * @param {string} hash - Current hash path
     */
    handleDirectRoute(hash) {
        console.log('Handling direct route:', hash);
        const appContainer = document.getElementById('app');
        if (!appContainer) return;
        
        const isAuthenticated = this.auth.checkAuth();
        
        // Route to appropriate page
        if (hash === '/settings' && isAuthenticated) {
            console.log('Rendering settings page directly');
            this.ui.renderSettings(appContainer);
        } else if (hash === '/dashboard' && isAuthenticated) {
            console.log('Rendering dashboard page directly');
            this.ui.renderDashboard(appContainer);
        } else if (hash === '/posts' && isAuthenticated) {
            console.log('Rendering posts page directly');
            this.ui.renderPostList(appContainer);
        } else if (hash.startsWith('/posts/new') && isAuthenticated) {
            console.log('Rendering post editor page directly');
            this.ui.renderPostEditor(appContainer);
        } else if (hash.startsWith('/posts/edit/') && isAuthenticated) {
            console.log('Rendering post editor page directly');
            this.ui.renderPostEditor(appContainer);
        } else if (!isAuthenticated) {
            console.log('User not authenticated, rendering login');
            this.ui.renderLogin(appContainer);
        } else {
            // Default to dashboard for authenticated users
            console.log('Default route, rendering dashboard');
            this.ui.renderDashboard(appContainer);
            window.location.hash = '#/dashboard';
        }
    }
    
    /**
     * Handle hash changes directly (temporary solution)
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || '/';
        console.log('Handling hash change:', hash);
        
        const appContainer = document.getElementById('app');
        if (!appContainer) return;
        
        // Simple route matching
        if (hash === '/settings') {
            console.log('Rendering settings page');
            this.ui.renderSettings(appContainer);
        } else if (hash === '/dashboard') {
            console.log('Rendering dashboard page');
            this.ui.renderDashboard(appContainer);
        } else if (hash === '/posts') {
            console.log('Rendering posts page');
            this.ui.renderPostList(appContainer);
        } else if (hash.startsWith('/posts/')) {
            console.log('Rendering post editor page');
            this.ui.renderPostEditor(appContainer);
        } else {
            // Default to dashboard for authenticated users
            const isAuthenticated = this.auth.checkAuth();
            if (isAuthenticated) {
                console.log('Rendering default dashboard page');
                this.ui.renderDashboard(appContainer);
            } else {
                console.log('Rendering login page');
                this.ui.renderLogin(appContainer);
            }
        }
    }
    
    /**
     * Add settings test button for debugging
     */
    addSettingsTestButton() {
        const header = document.querySelector('.admin-header .header-right');
        if (header) {
            const testBtn = document.createElement('button');
            testBtn.className = 'btn btn-outline';
            testBtn.textContent = '설정 테스트';
            testBtn.style.marginRight = '10px';
            testBtn.addEventListener('click', () => {
                console.log('Settings test button clicked');
                const appContainer = document.getElementById('app');
                if (appContainer && this.ui) {
                    console.log('Rendering settings directly...');
                    this.ui.renderSettings(appContainer);
                }
            });
            header.insertBefore(testBtn, header.firstChild);
        }
    }
    
    setupEventListeners() {
        // Handle login form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                this.handleLogin(e.target);
            }
        });
        
        // Handle logout
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.classList.contains('logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
        });
        
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.router.navigate(route);
            }
        });
        
        // Setup sidebar click outside functionality
        this.ui.setupSidebarClickOutside();
    }
    
    async handleLogin(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const password = formData.get('password');
        
        // Clear previous errors and show loading
        this.ui.hideLoginError();
        this.ui.showLoginLoading();
        
        try {
            const success = await this.auth.login(id, password);
            
            if (success) {
                this.notificationSystem.showSuccess('로그인되었습니다.');
                this.router.navigate('/dashboard');
            } else {
                this.errorHandler.createAuthError('Invalid credentials provided');
                this.ui.showLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.errorHandler.createAuthError(`Login failed: ${error.message}`, { 
                id, 
                timestamp: new Date().toISOString() 
            });
            this.ui.showLoginError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.ui.hideLoginLoading();
        }
    }
    
    handleLogout() {
        this.auth.logout();
        this.notificationSystem.showInfo('로그아웃되었습니다.');
        this.router.navigate('/');
    }
    
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.app-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-error app-error';
            document.getElementById('app').prepend(errorDiv);
        }
        errorDiv.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    /**
     * Update page title based on current route
     * @param {string} route - Current route
     * @param {Object} params - Route parameters
     */
    updatePageTitle(route, params = {}) {
        const baseTitles = {
            'login': 'Login',
            'dashboard': 'Dashboard',
            'posts': 'Posts',
            'post-editor': params.id ? 'Edit Post' : 'New Post',
            'settings': 'Settings'
        };
        
        const title = baseTitles[route] || 'Jekyll Admin';
        document.title = `${title} - Jekyll Admin`;
    }
    
    /**
     * Route guard - called before route changes
     * @param {string} fromPath - Current path
     * @param {string} toPath - Target path
     * @returns {boolean} - Whether navigation should proceed
     */
    beforeRouteChange(fromPath, toPath) {
        // Check authentication for protected routes
        const isAuthenticated = this.auth.checkAuth();
        const protectedRoutes = ['/dashboard', '/posts', '/settings'];
        const isProtectedRoute = protectedRoutes.some(route => 
            toPath.startsWith(route) || toPath === route
        );
        
        if (!isAuthenticated && isProtectedRoute) {
            console.log('Access denied: User not authenticated');
            return false;
        }
        
        // Allow navigation
        return true;
    }
}

// Initialize application when DOM is loaded
console.log('Main.js loaded, waiting for DOM...');
console.log('Document ready state:', document.readyState);

// Add error handler for uncaught errors
window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    console.error('Error message:', e.message);
    console.error('Error filename:', e.filename);
    console.error('Error line:', e.lineno);
});

// Add error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AdminApp...');
    try {
        console.log('Creating new AdminApp instance...');
        window.adminApp = new AdminApp();
        console.log('AdminApp created successfully');
    } catch (error) {
        console.error('Failed to create AdminApp:', error);
        console.error('Error stack:', error.stack);
        
        // Show error on page
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.innerHTML = `
                <div style="padding: 2rem; color: red; font-family: monospace;">
                    <h2>Error initializing Jekyll Admin</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <pre>${error.stack}</pre>
                </div>
            `;
        }
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    console.log('Document already loaded, initializing immediately');
    try {
        console.log('Creating new AdminApp instance (immediate)...');
        window.adminApp = new AdminApp();
        console.log('AdminApp created successfully (immediate)');
    } catch (error) {
        console.error('Failed to create AdminApp (immediate):', error);
        console.error('Error stack:', error.stack);
        
        // Show error on page
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.innerHTML = `
                <div style="padding: 2rem; color: red; font-family: monospace;">
                    <h2>Error initializing Jekyll Admin</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <pre>${error.stack}</pre>
                </div>
            `;
        }
    }
}

// Export for debugging
export { AdminApp };