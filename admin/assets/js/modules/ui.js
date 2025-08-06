// UI Manager Module
import { MarkdownEditor } from './markdown-editor.js';

export class UIManager {
    constructor() {
        this.templates = {};
        this.currentView = null;
        this.routeContext = {};
        this.postManager = null;
    }
    
    /**
     * Initialize UI Manager
     */
    init() {
        this.loadTemplates();
        this.setupAccessibility();
        console.log('UI Manager initialized');
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Detect keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        // Remove keyboard navigation class on mouse use
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Setup global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + M: Focus main content
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    this.announceToScreenReader('메인 콘텐츠로 이동했습니다');
                }
            }
            
            // Alt + N: Focus navigation
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                const nav = document.querySelector('.nav-menu .nav-link');
                if (nav) {
                    nav.focus();
                    this.announceToScreenReader('네비게이션으로 이동했습니다');
                }
            }
            
            // Escape: Close modals/overlays
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }
    
    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        let announcer = document.getElementById('status-announcements');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'status-announcements';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', priority);
            document.body.appendChild(announcer);
        }
        
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }
    
    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Close sidebar on mobile
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && !sidebar.classList.contains('sidebar-collapsed') && window.innerWidth <= 768) {
            sidebar.classList.add('sidebar-collapsed');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            document.body.style.overflow = '';
            this.announceToScreenReader('사이드바가 닫혔습니다');
        }
    }
    
    /**
     * Set PostManager instance
     * @param {PostManager} postManager - PostManager instance
     */
    setPostManager(postManager) {
        this.postManager = postManager;
    }

    /**
     * Set route context for current page
     * @param {Object} context - Route context information
     */
    setRouteContext(context) {
        this.routeContext = context;
    }
    
    /**
     * Get current route context
     * @returns {Object} - Current route context
     */
    getRouteContext() {
        return this.routeContext;
    }
    
    /**
     * Load HTML templates
     */
    loadTemplates() {
        this.templates = {
            login: this.getLoginTemplate(),
            dashboard: this.getDashboardTemplate(),
            postList: this.getPostListTemplate(),
            postEditor: this.getPostEditorTemplate(),
            settings: this.getSettingsTemplate(),
            notFound: this.getNotFoundTemplate()
        };
    }
    
    /**
     * Render login page
     * @param {HTMLElement} container - Container element
     */
    renderLogin(container) {
        container.innerHTML = this.templates.login;
        this.currentView = 'login';
        
        // Focus on first input after a short delay to ensure DOM is ready
        setTimeout(() => {
            const firstInput = container.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        // Add keyboard navigation support
        this.setupLoginKeyboardNavigation(container);
    }
    
    /**
     * Setup keyboard navigation for login form
     * @param {HTMLElement} container - Container element
     */
    setupLoginKeyboardNavigation(container) {
        const form = container.querySelector('#login-form');
        if (!form) return;
        
        // Handle Enter key on form inputs
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                const inputs = form.querySelectorAll('input');
                const submitBtn = form.querySelector('button[type="submit"]');
                
                // If on first input, move to second input
                if (activeElement === inputs[0] && inputs[1]) {
                    e.preventDefault();
                    inputs[1].focus();
                }
                // If on second input or submit button, submit form
                else if (activeElement === inputs[1] || activeElement === submitBtn) {
                    if (!submitBtn.disabled) {
                        form.dispatchEvent(new Event('submit', { bubbles: true }));
                    }
                }
            }
        });
        
        // Clear error message and validation state when user starts typing
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.hideLoginError();
                this.clearFieldValidation(input);
            });
            
            // Add blur validation
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
        
        // Form submission validation
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const isValid = this.validateLoginForm(form);
            if (isValid) {
                // Form is valid, proceed with submission
                form.dispatchEvent(new CustomEvent('validSubmit'));
            }
        });
    }
    
    /**
     * Validate individual form field
     * @param {HTMLInputElement} field - Form field to validate
     * @returns {boolean} - Whether field is valid
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${field.labels[0]?.textContent || '이 필드'}는 필수입니다.`;
        }
        
        // Update field validation state
        field.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldValidation(field);
        }
        
        return isValid;
    }
    
    /**
     * Validate entire login form
     * @param {HTMLFormElement} form - Form to validate
     * @returns {boolean} - Whether form is valid
     */
    validateLoginForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            // Focus first invalid field
            const firstInvalid = form.querySelector('input[aria-invalid="true"]');
            if (firstInvalid) {
                firstInvalid.focus();
                this.announceToScreenReader('폼에 오류가 있습니다. 필수 필드를 확인해주세요.', 'assertive');
            }
        }
        
        return isValid;
    }
    
    /**
     * Show field error message
     * @param {HTMLInputElement} field - Form field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        let errorElement = document.getElementById(`${field.id}-error`);
        
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.id = `${field.id}-error`;
            errorElement.className = 'form-error';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
            
            // Update field's aria-describedby
            const describedBy = field.getAttribute('aria-describedby') || '';
            field.setAttribute('aria-describedby', `${describedBy} ${errorElement.id}`.trim());
        }
        
        errorElement.textContent = message;
    }
    
    /**
     * Clear field validation state
     * @param {HTMLInputElement} field - Form field
     */
    clearFieldValidation(field) {
        field.setAttribute('aria-invalid', 'false');
        
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.remove();
            
            // Update field's aria-describedby
            const describedBy = field.getAttribute('aria-describedby') || '';
            const newDescribedBy = describedBy.replace(`${field.id}-error`, '').trim();
            if (newDescribedBy) {
                field.setAttribute('aria-describedby', newDescribedBy);
            } else {
                field.removeAttribute('aria-describedby');
            }
        }
    }
    
    /**
     * Render dashboard page
     * @param {HTMLElement} container - Container element
     */
    renderDashboard(container) {
        container.innerHTML = this.templates.dashboard;
        this.currentView = 'dashboard';
        this.setupSidebarToggle();
        this.setupNavigationHighlight();
    }
    
    /**
     * Render post list page
     * @param {HTMLElement} container - Container element
     */
    renderPostList(container) {
        container.innerHTML = this.templates.postList;
        this.currentView = 'postList';
        this.setupSidebarToggle();
        this.setupNavigationHighlight();
        
        // Load and display posts
        this.loadPostListContent();
    }
    
    /**
     * Render post editor page
     * @param {HTMLElement} container - Container element
     */
    renderPostEditor(container) {
        container.innerHTML = this.templates.postEditor;
        this.currentView = 'postEditor';
        this.setupSidebarToggle();
        this.setupNavigationHighlight();
    }
    
    /**
     * Render settings page
     * @param {HTMLElement} container - Container element
     */
    renderSettings(container) {
        container.innerHTML = this.templates.settings;
        this.currentView = 'settings';
        
        // Load and render settings form
        this.loadSettingsForm();
        this.setupSidebarToggle();
        this.setupNavigationHighlight();
    }
    
    /**
     * Render 404 page
     * @param {HTMLElement} container - Container element
     */
    renderNotFound(container) {
        container.innerHTML = this.templates.notFound;
        this.currentView = 'notFound';
    }
    
    // Template methods
    getLoginTemplate() {
        return `
            <div class="admin-container">
                <a href="#main-content" class="skip-link">메인 콘텐츠로 건너뛰기</a>
                <div class="login-wrapper">
                    <div class="login-card" role="main" id="main-content">
                        <div class="login-header">
                            <h1 class="login-title">Jekyll Admin</h1>
                            <p class="login-subtitle">관리자 로그인</p>
                        </div>
                        
                        <div id="login-error" class="alert alert-error" style="display: none;" role="alert" aria-live="polite"></div>
                        
                        <form id="login-form" class="login-form" action="javascript:void(0)" novalidate>
                            <div class="form-group">
                                <label for="id" class="form-label">아이디</label>
                                <input 
                                    type="text" 
                                    id="id" 
                                    name="id" 
                                    class="form-input" 
                                    required 
                                    autocomplete="username"
                                    placeholder="관리자 아이디를 입력하세요"
                                    aria-describedby="id-help"
                                    aria-invalid="false"
                                >
                                <span id="id-help" class="sr-only">관리자 계정의 아이디를 입력하세요</span>
                            </div>
                            
                            <div class="form-group">
                                <label for="password" class="form-label">비밀번호</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="form-input" 
                                    required 
                                    autocomplete="current-password"
                                    placeholder="비밀번호를 입력하세요"
                                    aria-describedby="password-help"
                                    aria-invalid="false"
                                >
                                <span id="password-help" class="sr-only">관리자 계정의 비밀번호를 입력하세요</span>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-login" id="login-submit" aria-describedby="login-status">
                                <span class="btn-text">로그인</span>
                                <span class="btn-loading" style="display: none;" aria-hidden="true">
                                    <span class="spinner-small" role="status" aria-label="로그인 처리 중"></span>
                                    로그인 중...
                                </span>
                            </button>
                            <div id="login-status" class="sr-only" aria-live="polite"></div>
                        </form>
                        
                        <div class="login-footer">
                            <p class="login-info">
                                <small>Jekyll 블로그 관리자 인터페이스</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getDashboardTemplate() {
        return `
            <div class="admin-layout">
                <a href="#main-content" class="skip-link">메인 콘텐츠로 건너뛰기</a>
                
                <!-- Top Header -->
                <header class="admin-header" role="banner">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="sidebar-toggle" id="sidebar-toggle" 
                                    aria-label="사이드바 메뉴 열기/닫기" 
                                    aria-expanded="false"
                                    aria-controls="admin-sidebar">
                                <span class="hamburger-line" aria-hidden="true"></span>
                                <span class="hamburger-line" aria-hidden="true"></span>
                                <span class="hamburger-line" aria-hidden="true"></span>
                            </button>
                            <h1 class="admin-title">Jekyll Admin</h1>
                        </div>
                        <div class="header-right">
                            <span class="user-info" aria-label="현재 사용자">관리자</span>
                            <button class="btn btn-outline logout-btn" id="logout-btn" aria-label="관리자 로그아웃">로그아웃</button>
                        </div>
                    </div>
                </header>

                <!-- Sidebar Navigation -->
                <aside class="admin-sidebar" id="admin-sidebar" role="navigation" aria-label="주 메뉴">
                    <nav class="sidebar-nav">
                        <ul class="nav-menu" role="menubar">
                            <li class="nav-item" role="none">
                                <a href="#/dashboard" data-route="/dashboard" class="nav-link active" 
                                   role="menuitem" aria-current="page">
                                    <span class="nav-icon" aria-hidden="true">📊</span>
                                    <span class="nav-text">대시보드</span>
                                </a>
                            </li>
                            <li class="nav-item" role="none">
                                <a href="#/posts" data-route="/posts" class="nav-link" role="menuitem">
                                    <span class="nav-icon" aria-hidden="true">📝</span>
                                    <span class="nav-text">포스트 관리</span>
                                </a>
                            </li>
                            <li class="nav-item" role="none">
                                <a href="#/posts/new" data-route="/posts/new" class="nav-link" role="menuitem">
                                    <span class="nav-icon" aria-hidden="true">➕</span>
                                    <span class="nav-text">새 포스트</span>
                                </a>
                            </li>
                            <li class="nav-item" role="none">
                                <a href="#/settings" data-route="/settings" class="nav-link" role="menuitem">
                                    <span class="nav-icon" aria-hidden="true">⚙️</span>
                                    <span class="nav-text">사이트 설정</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <main class="admin-main" role="main" id="main-content">
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">대시보드</h2>
                            <p class="page-description">Jekyll 블로그 관리 현황을 확인하세요</p>
                        </div>

                        <!-- Dashboard Stats Grid -->
                        <section class="dashboard-grid" aria-label="관리 기능 카드">
                            <article class="dashboard-card">
                                <div class="card-icon" aria-hidden="true">📝</div>
                                <div class="card-content">
                                    <h3 class="card-title">포스트 관리</h3>
                                    <p class="card-description">블로그 포스트를 생성, 편집, 삭제할 수 있습니다.</p>
                                    <div class="card-actions">
                                        <a href="#/posts" data-route="/posts" class="btn btn-primary">포스트 목록</a>
                                        <a href="#/posts/new" data-route="/posts/new" class="btn btn-outline">새 포스트</a>
                                    </div>
                                </div>
                            </article>

                            <article class="dashboard-card">
                                <div class="card-icon" aria-hidden="true">⚙️</div>
                                <div class="card-content">
                                    <h3 class="card-title">사이트 설정</h3>
                                    <p class="card-description">Jekyll 사이트의 기본 설정을 관리할 수 있습니다.</p>
                                    <div class="card-actions">
                                        <a href="#/settings" data-route="/settings" class="btn btn-secondary">설정 관리</a>
                                    </div>
                                </div>
                            </article>

                            <article class="dashboard-card">
                                <div class="card-icon" aria-hidden="true">🔍</div>
                                <div class="card-content">
                                    <h3 class="card-title">검색 기능</h3>
                                    <p class="card-description">포스트를 빠르게 찾고 관리할 수 있습니다.</p>
                                    <div class="card-actions">
                                        <a href="#/posts" data-route="/posts" class="btn btn-outline">포스트 검색</a>
                                    </div>
                                </div>
                            </article>

                            <article class="dashboard-card">
                                <div class="card-icon" aria-hidden="true">📊</div>
                                <div class="card-content">
                                    <h3 class="card-title">사이트 현황</h3>
                                    <p class="card-description">블로그 통계와 현황을 확인할 수 있습니다.</p>
                                    <div class="card-actions">
                                        <span class="status-text" aria-label="기능 상태: 준비 중">준비 중</span>
                                    </div>
                                </div>
                            </article>
                        </section>

                        <!-- Quick Actions -->
                        <section class="quick-actions" aria-label="빠른 작업">
                            <h3 class="section-title">빠른 작업</h3>
                            <div class="action-buttons" role="group" aria-label="빠른 작업 버튼">
                                <a href="#/posts/new" data-route="/posts/new" class="action-btn">
                                    <span class="action-icon" aria-hidden="true">✏️</span>
                                    <span class="action-text">새 포스트 작성</span>
                                </a>
                                <a href="#/posts" data-route="/posts" class="action-btn">
                                    <span class="action-icon" aria-hidden="true">📋</span>
                                    <span class="action-text">포스트 목록 보기</span>
                                </a>
                                <a href="#/settings" data-route="/settings" class="action-btn">
                                    <span class="action-icon" aria-hidden="true">🔧</span>
                                    <span class="action-text">사이트 설정</span>
                                </a>
                            </div>
                        </section>
                    </div>
                </main>
                
                <!-- Status announcements for screen readers -->
                <div id="status-announcements" class="sr-only" aria-live="polite"></div>
            </div>
        `;
    }
    
    getPostListTemplate() {
        return `
            <div class="admin-layout">
                <!-- Top Header -->
                <header class="admin-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="메뉴 토글">
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                            </button>
                            <h1 class="admin-title">Jekyll Admin</h1>
                        </div>
                        <div class="header-right">
                            <span class="user-info">관리자</span>
                            <button class="btn btn-outline logout-btn" id="logout-btn">로그아웃</button>
                        </div>
                    </div>
                </header>

                <!-- Sidebar Navigation -->
                <aside class="admin-sidebar" id="admin-sidebar">
                    <nav class="sidebar-nav">
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#/dashboard" data-route="/dashboard" class="nav-link">
                                    <span class="nav-icon">📊</span>
                                    <span class="nav-text">대시보드</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts" data-route="/posts" class="nav-link active">
                                    <span class="nav-icon">📝</span>
                                    <span class="nav-text">포스트 관리</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts/new" data-route="/posts/new" class="nav-link">
                                    <span class="nav-icon">➕</span>
                                    <span class="nav-text">새 포스트</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/settings" data-route="/settings" class="nav-link">
                                    <span class="nav-icon">⚙️</span>
                                    <span class="nav-text">사이트 설정</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <main class="admin-main">
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">포스트 관리</h2>
                            <div class="page-actions">
                                <a href="#/posts/new" data-route="/posts/new" class="btn btn-primary">새 포스트 작성</a>
                            </div>
                        </div>
                        
                        <div class="content-card">
                            <div id="post-list-content">
                                <p>포스트 목록을 로드하는 중...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
    
    getPostEditorTemplate() {
        return `
            <div class="admin-layout">
                <!-- Top Header -->
                <header class="admin-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="메뉴 토글">
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                            </button>
                            <h1 class="admin-title">Jekyll Admin</h1>
                        </div>
                        <div class="header-right">
                            <span class="user-info">관리자</span>
                            <button class="btn btn-outline logout-btn" id="logout-btn">로그아웃</button>
                        </div>
                    </div>
                </header>

                <!-- Sidebar Navigation -->
                <aside class="admin-sidebar" id="admin-sidebar">
                    <nav class="sidebar-nav">
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#/dashboard" data-route="/dashboard" class="nav-link">
                                    <span class="nav-icon">📊</span>
                                    <span class="nav-text">대시보드</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts" data-route="/posts" class="nav-link">
                                    <span class="nav-icon">📝</span>
                                    <span class="nav-text">포스트 관리</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts/new" data-route="/posts/new" class="nav-link active">
                                    <span class="nav-icon">➕</span>
                                    <span class="nav-text">새 포스트</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/settings" data-route="/settings" class="nav-link">
                                    <span class="nav-icon">⚙️</span>
                                    <span class="nav-text">사이트 설정</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <main class="admin-main">
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">포스트 편집기</h2>
                            <div class="page-actions">
                                <a href="#/posts" data-route="/posts" class="btn btn-outline">목록으로</a>
                            </div>
                        </div>
                        
                        <div class="content-card">
                            <div id="post-editor-content">
                                <p>포스트 편집기를 로드하는 중...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
    
    getSettingsTemplate() {
        return `
            <div class="admin-layout">
                <!-- Top Header -->
                <header class="admin-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="메뉴 토글">
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                                <span class="hamburger-line"></span>
                            </button>
                            <h1 class="admin-title">Jekyll Admin</h1>
                        </div>
                        <div class="header-right">
                            <span class="user-info">관리자</span>
                            <button class="btn btn-outline logout-btn" id="logout-btn">로그아웃</button>
                        </div>
                    </div>
                </header>

                <!-- Sidebar Navigation -->
                <aside class="admin-sidebar" id="admin-sidebar">
                    <nav class="sidebar-nav">
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#/dashboard" data-route="/dashboard" class="nav-link">
                                    <span class="nav-icon">📊</span>
                                    <span class="nav-text">대시보드</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts" data-route="/posts" class="nav-link">
                                    <span class="nav-icon">📝</span>
                                    <span class="nav-text">포스트 관리</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/posts/new" data-route="/posts/new" class="nav-link">
                                    <span class="nav-icon">➕</span>
                                    <span class="nav-text">새 포스트</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#/settings" data-route="/settings" class="nav-link active">
                                    <span class="nav-icon">⚙️</span>
                                    <span class="nav-text">사이트 설정</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <!-- Main Content Area -->
                <main class="admin-main">
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">사이트 설정</h2>
                            <p class="page-description">Jekyll 사이트의 기본 설정을 관리하세요</p>
                        </div>
                        
                        <div class="content-card">
                            <div id="settings-content">
                                <p>사이트 설정을 로드하는 중...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
    
    getNotFoundTemplate() {
        return `
            <div class="admin-container">
                <div class="card text-center">
                    <h1>404</h1>
                    <p>페이지를 찾을 수 없습니다.</p>
                    <a href="#/dashboard" data-route="/dashboard" class="btn btn-primary">대시보드로 돌아가기</a>
                </div>
            </div>
        `;
    }
    
    /**
     * Get current view
     * @returns {string}
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Show loading state
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
     */
    showLoading(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
    
    /**
     * Show error message
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     */
    showError(container, message) {
        container.innerHTML = `
            <div class="alert alert-error">
                ${message}
            </div>
        `;
    }
    
    /**
     * Show success message
     * @param {HTMLElement} container - Container element
     * @param {string} message - Success message
     */
    showSuccess(container, message) {
        container.innerHTML = `
            <div class="alert alert-success">
                ${message}
            </div>
        `;
    }
    
    /**
     * Show login error message
     * @param {string} message - Error message
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Announce error to screen readers
            this.announceToScreenReader(`로그인 오류: ${message}`, 'assertive');
            
            // Focus the error message for screen readers
            errorDiv.setAttribute('tabindex', '-1');
            errorDiv.focus();
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideLoginError();
            }, 5000);
        }
    }
    
    /**
     * Hide login error message
     */
    hideLoginError() {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    /**
     * Show login loading state
     */
    showLoginLoading() {
        const submitBtn = document.getElementById('login-submit');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        const statusDiv = document.getElementById('login-status');
        
        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            btnLoading.setAttribute('aria-hidden', 'false');
            
            // Update status for screen readers
            if (statusDiv) {
                statusDiv.textContent = '로그인을 처리하고 있습니다...';
            }
            
            this.announceToScreenReader('로그인을 처리하고 있습니다...', 'polite');
        }
    }
    
    /**
     * Hide login loading state
     */
    hideLoginLoading() {
        const submitBtn = document.getElementById('login-submit');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        const statusDiv = document.getElementById('login-status');
        
        if (submitBtn && btnText && btnLoading) {
            submitBtn.disabled = false;
            submitBtn.setAttribute('aria-busy', 'false');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            btnLoading.setAttribute('aria-hidden', 'true');
            
            // Clear status for screen readers
            if (statusDiv) {
                statusDiv.textContent = '';
            }
        }
    }
    
    /**
     * Setup sidebar toggle functionality with mobile support
     */
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('admin-sidebar');
        
        if (!toggleBtn || !sidebar) return;
        
        // Remove existing event listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Create mobile overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        // Check if we're on mobile
        const isMobile = () => window.innerWidth <= 768;
        
        // Toggle sidebar function
        const toggleSidebar = () => {
            const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
            
            if (isMobile()) {
                // Mobile behavior
                sidebar.classList.toggle('sidebar-collapsed');
                overlay.classList.toggle('active');
                document.body.classList.toggle('sidebar-open', !isCollapsed);
                
                // Prevent body scroll when sidebar is open on mobile
                if (!isCollapsed) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            } else {
                // Desktop behavior
                sidebar.classList.toggle('sidebar-collapsed');
                document.body.classList.toggle('sidebar-collapsed');
                
                // Store sidebar state in localStorage for desktop
                const newIsCollapsed = sidebar.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', newIsCollapsed.toString());
            }
        };
        
        // Toggle button click handler
        newToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
            
            // Update ARIA attributes
            const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
            newToggleBtn.setAttribute('aria-expanded', isMobile() ? !isCollapsed : !isCollapsed);
            
            // Announce state change
            const message = isMobile() 
                ? (isCollapsed ? '사이드바가 닫혔습니다' : '사이드바가 열렸습니다')
                : (isCollapsed ? '사이드바가 축소되었습니다' : '사이드바가 확장되었습니다');
            this.announceToScreenReader(message);
        });
        
        // Overlay click handler for mobile
        overlay.addEventListener('click', () => {
            if (isMobile()) {
                sidebar.classList.add('sidebar-collapsed');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
            }
        });
        
        // Handle window resize
        const handleResize = () => {
            if (isMobile()) {
                // On mobile, always start collapsed
                sidebar.classList.add('sidebar-collapsed');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open', 'sidebar-collapsed');
                document.body.style.overflow = '';
            } else {
                // On desktop, restore saved state
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
                
                const savedState = localStorage.getItem('sidebarCollapsed');
                if (savedState === 'true') {
                    sidebar.classList.add('sidebar-collapsed');
                    document.body.classList.add('sidebar-collapsed');
                } else {
                    sidebar.classList.remove('sidebar-collapsed');
                    document.body.classList.remove('sidebar-collapsed');
                }
            }
        };
        
        // Initial setup
        handleResize();
        
        // Listen for window resize
        window.addEventListener('resize', handleResize);
        
        // Handle escape key to close sidebar on mobile
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMobile() && !sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.add('sidebar-collapsed');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
            }
        });
        
        // Close sidebar when clicking nav links on mobile
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (isMobile()) {
                    sidebar.classList.add('sidebar-collapsed');
                    overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Add touch gesture support for mobile
        this.setupTouchGestures(sidebar, overlay);
    }
    
    /**
     * Setup touch gestures for mobile sidebar
     * @param {HTMLElement} sidebar - Sidebar element
     * @param {HTMLElement} overlay - Overlay element
     */
    setupTouchGestures(sidebar, overlay) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        const isMobile = () => window.innerWidth <= 768;
        
        // Touch start
        document.addEventListener('touchstart', (e) => {
            if (!isMobile()) return;
            
            startX = e.touches[0].clientX;
            
            // If touch starts from left edge, prepare for swipe
            if (startX < 20) {
                isDragging = true;
            }
        }, { passive: true });
        
        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (!isMobile() || !isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // If swiping right from left edge, show sidebar
            if (deltaX > 50 && sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.remove('sidebar-collapsed');
                overlay.classList.add('active');
                document.body.classList.add('sidebar-open');
                document.body.style.overflow = 'hidden';
                isDragging = false;
            }
        }, { passive: true });
        
        // Touch end
        document.addEventListener('touchend', () => {
            isDragging = false;
        }, { passive: true });
        
        // Swipe to close sidebar
        sidebar.addEventListener('touchstart', (e) => {
            if (!isMobile()) return;
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        sidebar.addEventListener('touchmove', (e) => {
            if (!isMobile()) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // If swiping left on sidebar, close it
            if (deltaX < -50 && !sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.add('sidebar-collapsed');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
            }
        }, { passive: true });
    }
    
    /**
     * Setup navigation highlighting with accessibility
     */
    setupNavigationHighlight() {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPath = window.location.hash.replace('#', '') || '/dashboard';
        
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            link.classList.remove('active');
            link.removeAttribute('aria-current');
            
            if (route === currentPath) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
        
        // Add keyboard navigation support
        navLinks.forEach((link, index) => {
            // Set tabindex for proper keyboard navigation
            link.setAttribute('tabindex', '0');
            
            link.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextLink = navLinks[index + 1] || navLinks[0];
                    nextLink.focus();
                    this.announceToScreenReader(`${nextLink.textContent.trim()}으로 이동`);
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevLink = navLinks[index - 1] || navLinks[navLinks.length - 1];
                    prevLink.focus();
                    this.announceToScreenReader(`${prevLink.textContent.trim()}으로 이동`);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    navLinks[0].focus();
                    this.announceToScreenReader(`첫 번째 메뉴 ${navLinks[0].textContent.trim()}으로 이동`);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    navLinks[navLinks.length - 1].focus();
                    this.announceToScreenReader(`마지막 메뉴 ${navLinks[navLinks.length - 1].textContent.trim()}으로 이동`);
                }
            });
            
            // Announce when link receives focus
            link.addEventListener('focus', () => {
                if (document.body.classList.contains('keyboard-navigation')) {
                    const isActive = link.classList.contains('active');
                    const announcement = isActive 
                        ? `현재 페이지: ${link.textContent.trim()}`
                        : `메뉴: ${link.textContent.trim()}`;
                    this.announceToScreenReader(announcement);
                }
            });
        });
    }ponsive behavior
        this.handleResponsiveSidebar();
        window.addEventListener('resize', () => this.handleResponsiveSidebar());
    }
    
    /**
     * Handle responsive sidebar behavior
     */
    handleResponsiveSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        if (!sidebar) return;
        
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            sidebar.classList.add('sidebar-mobile');
            // Close sidebar on mobile by default
            if (!sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.add('sidebar-collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        } else {
            sidebar.classList.remove('sidebar-mobile');
            // Restore desktop sidebar state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState !== 'true') {
                sidebar.classList.remove('sidebar-collapsed');
                document.body.classList.remove('sidebar-collapsed');
            }
        }
    }
    
    /**
     * Setup navigation highlight based on current route
     */
    setupNavigationHighlight() {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPath = window.location.hash.replace('#', '') || '/dashboard';
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = link.getAttribute('data-route');
            
            // Handle exact matches and special cases
            if (linkPath === currentPath || 
                (currentPath.startsWith('/posts/') && linkPath === '/posts/new' && currentPath.includes('/new')) ||
                (currentPath.startsWith('/posts/') && linkPath === '/posts' && !currentPath.includes('/new'))) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Close sidebar on mobile when clicking outside
     */
    setupSidebarClickOutside() {
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('admin-sidebar');
            const toggleBtn = document.getElementById('sidebar-toggle');
            
            if (!sidebar || !toggleBtn) return;
            
            const isMobile = window.innerWidth <= 768;
            const isClickOutside = !sidebar.contains(e.target) && !toggleBtn.contains(e.target);
            
            if (isMobile && isClickOutside && !sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.add('sidebar-collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        });
    }
            const toggleBtn = document.getElementById('sidebar-toggle');
            
            if (!sidebar || !toggleBtn) return;
            
            const isMobile = window.innerWidth <= 768;
            const isClickOutside = !sidebar.contains(e.target) && !toggleBtn.contains(e.target);
            
            if (isMobile && isClickOutside && !sidebar.classList.contains('sidebar-collapsed')) {
                sidebar.classList.add('sidebar-collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        });
    }

    /**
     * Load and display post editor content
     * @param {string} postId - Post ID for editing (optional)
     */
    async loadPostEditorContent(postId = null) {
        const contentContainer = document.getElementById('post-editor-content');
        if (!contentContainer) return;

        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>에디터를 로드하는 중...</p>
                </div>
            `;

            // Load post data if editing
            let post = null;
            if (postId && this.postManager) {
                post = this.postManager.getPostById(postId);
                if (!post) {
                    throw new Error('포스트를 찾을 수 없습니다.');
                }
            }

            // Render post editor form
            this.renderPostEditorForm(contentContainer, post);
            
        } catch (error) {
            console.error('Error loading post editor:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-error">
                    <h3>에디터 로드 실패</h3>
                    <p>포스트 에디터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">다시 시도</button>
                </div>
            `;
        }
    }

    /**
     * Render post editor form
     * @param {HTMLElement} container - Container element
     * @param {Object} post - Post object (null for new post)
     */
    renderPostEditorForm(container, post = null) {
        const isEditing = post !== null;
        const title = isEditing ? post.frontMatter.title : '';
        const date = isEditing ? post.frontMatter.date.split(' ')[0] : new Date().toISOString().split('T')[0];
        const categories = isEditing ? post.frontMatter.categories.join(', ') : '';
        const tags = isEditing ? post.frontMatter.tags.join(', ') : '';
        const published = isEditing ? post.frontMatter.published : true;
        const content = isEditing ? post.content : '';

        container.innerHTML = `
            <form id="post-form" class="post-editor-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="post-title" class="form-label">제목 *</label>
                        <input 
                            type="text" 
                            id="post-title" 
                            name="title" 
                            class="form-input" 
                            value="${title}" 
                            required 
                            placeholder="포스트 제목을 입력하세요"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="post-date" class="form-label">날짜</label>
                        <input 
                            type="date" 
                            id="post-date" 
                            name="date" 
                            class="form-input" 
                            value="${date}"
                        >
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="post-categories" class="form-label">카테고리</label>
                        <input 
                            type="text" 
                            id="post-categories" 
                            name="categories" 
                            class="form-input" 
                            value="${categories}" 
                            placeholder="카테고리를 쉼표로 구분하여 입력하세요"
                        >
                        <small class="form-help">예: jekyll, update, tutorial</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="post-tags" class="form-label">태그</label>
                        <input 
                            type="text" 
                            id="post-tags" 
                            name="tags" 
                            class="form-input" 
                            value="${tags}" 
                            placeholder="태그를 쉼표로 구분하여 입력하세요"
                        >
                        <small class="form-help">예: markdown, blog, writing</small>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input 
                            type="checkbox" 
                            id="post-published" 
                            name="published" 
                            ${published ? 'checked' : ''}
                        >
                        <span class="checkbox-label">게시하기</span>
                    </label>
                    <small class="form-help">체크 해제 시 초안으로 저장됩니다</small>
                </div>

                <div class="form-group">
                    <label class="form-label">내용 *</label>
                    <div id="markdown-editor-container"></div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="save-post-btn">
                        <span class="btn-text">${isEditing ? '포스트 수정' : '포스트 저장'}</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="spinner-small"></span>
                            저장 중...
                        </span>
                    </button>
                    <a href="#/posts" data-route="/posts" class="btn btn-outline">취소</a>
                    ${isEditing ? `
                        <button type="button" class="btn btn-danger" id="delete-post-btn" data-post-id="${post.id}">
                            포스트 삭제
                        </button>
                    ` : ''}
                </div>
            </form>
        `;

        // Initialize markdown editor
        const editorContainer = container.querySelector('#markdown-editor-container');
        this.markdownEditor = new MarkdownEditor(editorContainer, {
            showPreview: true,
            showToolbar: true,
            syncScroll: true,
            placeholder: '마크다운으로 포스트 내용을 작성하세요...'
        });

        // Set initial content
        if (content) {
            this.markdownEditor.setContent(content);
        }

        // Setup form handlers
        this.setupPostEditorHandlers(post);
    }

    /**
     * Setup post editor event handlers
     * @param {Object} post - Post object (null for new post)
     */
    setupPostEditorHandlers(post = null) {
        const form = document.getElementById('post-form');
        const saveBtn = document.getElementById('save-post-btn');
        const deleteBtn = document.getElementById('delete-post-btn');

        if (!form || !this.postManager) return;

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePostSave(post);
        });

        // Handle delete button
        if (deleteBtn && post) {
            deleteBtn.addEventListener('click', async () => {
                await this.handlePostDelete(post.id);
            });
        }

        // Auto-save functionality (optional)
        let autoSaveTimeout;
        const autoSave = () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                this.autoSavePost(post);
            }, 30000); // Auto-save every 30 seconds
        };

        // Listen for content changes
        form.addEventListener('input', autoSave);
        if (this.markdownEditor) {
            this.markdownEditor.container.addEventListener('markdownchange', autoSave);
        }
    }

    /**
     * Handle post save
     * @param {Object} post - Post object (null for new post)
     */
    async handlePostSave(post = null) {
        const form = document.getElementById('post-form');
        const saveBtn = document.getElementById('save-post-btn');
        
        if (!form || !saveBtn || !this.postManager) return;

        try {
            // Show loading state
            this.showSaveLoading(saveBtn);

            // Collect form data
            const formData = new FormData(form);
            const postData = {
                title: formData.get('title').trim(),
                date: formData.get('date'),
                categories: formData.get('categories'),
                tags: formData.get('tags'),
                published: formData.has('published'),
                content: this.markdownEditor ? this.markdownEditor.getContent() : ''
            };

            // Validate required fields
            if (!postData.title) {
                throw new Error('제목을 입력해주세요.');
            }

            if (!postData.content.trim()) {
                throw new Error('내용을 입력해주세요.');
            }

            // Save post
            let savedPost;
            if (post) {
                // Update existing post
                savedPost = await this.postManager.updatePost(post.id, postData);
                this.showToast('포스트가 성공적으로 수정되었습니다.', 'success');
            } else {
                // Create new post
                savedPost = await this.postManager.createPost(postData);
                this.showToast('포스트가 성공적으로 생성되었습니다.', 'success');
            }

            // Redirect to post list after a short delay
            setTimeout(() => {
                window.location.hash = '#/posts';
            }, 1500);

        } catch (error) {
            console.error('Error saving post:', error);
            this.showToast(`포스트 저장 실패: ${error.message}`, 'error');
        } finally {
            this.hideSaveLoading(saveBtn);
        }
    }

    /**
     * Handle post delete
     * @param {string} postId - Post ID
     */
    async handlePostDelete(postId) {
        if (!confirm('정말로 이 포스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            await this.postManager.deletePost(postId);
            this.showToast('포스트가 성공적으로 삭제되었습니다.', 'success');
            
            // Redirect to post list
            setTimeout(() => {
                window.location.hash = '#/posts';
            }, 1000);

        } catch (error) {
            console.error('Error deleting post:', error);
            this.showToast(`포스트 삭제 실패: ${error.message}`, 'error');
        }
    }

    /**
     * Auto-save post (draft)
     * @param {Object} post - Post object (null for new post)
     */
    async autoSavePost(post = null) {
        // Implementation for auto-save functionality
        // This could save to localStorage or send to server
        console.log('Auto-saving post...');
    }

    /**
     * Show save loading state
     * @param {HTMLElement} saveBtn - Save button element
     */
    showSaveLoading(saveBtn) {
        if (!saveBtn) return;
        
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            saveBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        }
    }

    /**
     * Hide save loading state
     * @param {HTMLElement} saveBtn - Save button element
     */
    hideSaveLoading(saveBtn) {
        if (!saveBtn) return;
        
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            saveBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                <button class="toast-close" aria-label="닫기">✕</button>
            </div>
        `;

        // Add to document
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);

        // Auto-hide after 5 seconds
        const hideTimeout = setTimeout(() => {
            this.hideToast(toast);
        }, 5000);

        // Handle close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(hideTimeout);
                this.hideToast(toast);
            });
        }
    }

    /**
     * Hide toast notification
     * @param {HTMLElement} toast - Toast element
     */
    hideToast(toast) {
        if (!toast) return;
        
        toast.classList.remove('toast-show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
} 
   /**
     * Load and display post list content
     */
    async loadPostListContent() {
        const contentContainer = document.getElementById('post-list-content');
        if (!contentContainer || !this.postManager) return;

        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>포스트를 로드하는 중...</p>
                </div>
            `;

            // Load posts
            const posts = await this.postManager.loadPosts();
            
            // Render post list
            this.renderPostListItems(contentContainer, posts);
            
            // Setup search functionality
            this.setupPostSearch();
            
        } catch (error) {
            console.error('Error loading posts:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-error">
                    <h3>포스트 로드 실패</h3>
                    <p>포스트를 불러오는 중 오류가 발생했습니다: ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">다시 시도</button>
                </div>
            `;
        }
    }

    /**
     * Render post list items
     * @param {HTMLElement} container - Container element
     * @param {Array} posts - Array of posts
     */
    renderPostListItems(container, posts) {
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>포스트가 없습니다</h3>
                    <p>첫 번째 포스트를 작성해보세요!</p>
                    <a href="#/posts/new" data-route="/posts/new" class="btn btn-primary">새 포스트 작성</a>
                </div>
            `;
            return;
        }

        const searchHtml = `
            <div class="post-search-section">
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            id="post-search" 
                            class="search-input" 
                            placeholder="포스트 제목, 내용, 카테고리, 태그로 검색..."
                            autocomplete="off"
                        >
                        <button class="search-clear" id="search-clear" style="display: none;" title="검색어 지우기">✕</button>
                    </div>
                    <div class="search-suggestions" id="search-suggestions" style="display: none;"></div>
                </div>
                <div class="search-results-info" id="search-results-info"></div>
                <div class="search-filters" id="search-filters" style="display: none;">
                    <div class="filter-group">
                        <label class="filter-label">카테고리:</label>
                        <div class="filter-tags" id="category-filters"></div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">태그:</label>
                        <div class="filter-tags" id="tag-filters"></div>
                    </div>
                </div>
            </div>
        `;

        const postsHtml = posts.map(post => this.renderPostItem(post)).join('');
        
        container.innerHTML = `
            ${searchHtml}
            <div class="post-list" id="post-list">
                ${postsHtml}
            </div>
        `;
    }

    /**
     * Render search result item with highlighting
     * @param {Object} searchResult - Search result object
     * @param {string} query - Search query
     * @returns {string} HTML string
     */
    renderSearchResultItem(searchResult, query) {
        const { post, score, highlights, matchedWords, exactMatches } = searchResult;
        
        // If no query, render as normal post item
        if (!query || score === 0) {
            return this.renderPostItem(post);
        }

        const publishedStatus = post.frontMatter.published ? 'published' : 'draft';
        const statusText = post.frontMatter.published ? '게시됨' : '초안';
        const date = new Date(post.frontMatter.date);
        const formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Render categories with highlighting
        const categories = post.frontMatter.categories.length > 0 
            ? highlights.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')
            : '<span class="no-categories">카테고리 없음</span>';

        // Render content snippets with highlighting
        const contentSnippets = highlights.content.length > 0
            ? highlights.content.map(snippet => 
                `<div class="content-snippet">${snippet.text}</div>`
              ).join('')
            : `<div class="post-excerpt">${this.escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}</div>`;

        // Show search relevance indicators
        const relevanceIndicators = [];
        if (exactMatches > 0) {
            relevanceIndicators.push(`<span class="relevance-indicator exact-match">정확한 일치</span>`);
        }
        if (matchedWords.length > 0) {
            relevanceIndicators.push(`<span class="relevance-indicator word-match">${matchedWords.length}개 단어 일치</span>`);
        }

        return `
            <div class="post-item search-result-item" data-post-id="${post.id}" data-search-score="${score}">
                <div class="post-header">
                    <h3 class="post-title">
                        <a href="#/posts/edit/${post.id}" data-route="/posts/edit/${post.id}">
                            ${highlights.title}
                        </a>
                    </h3>
                    <div class="post-meta">
                        <span class="post-date">${formattedDate}</span>
                        <span class="post-status status-${publishedStatus}">${statusText}</span>
                        ${relevanceIndicators.length > 0 ? `<div class="relevance-indicators">${relevanceIndicators.join('')}</div>` : ''}
                    </div>
                </div>
                
                <div class="post-categories">
                    ${categories}
                </div>
                
                <div class="post-content-highlights">
                    ${contentSnippets}
                </div>
                
                <div class="post-actions">
                    <a href="#/posts/edit/${post.id}" data-route="/posts/edit/${post.id}" class="btn btn-sm btn-primary">편집</a>
                    <button class="btn btn-sm btn-danger" onclick="window.adminApp.ui.confirmDeletePost('${post.id}', '${this.escapeHtml(post.frontMatter.title)}')">삭제</button>
                </div>
            </div>
        `;
    }

    /**
     * Render individual post item
     * @param {Object} post - Post object
     * @returns {string} HTML string
     */
    renderPostItem(post) {
        const publishedStatus = post.frontMatter.published ? 'published' : 'draft';
        const statusText = post.frontMatter.published ? '게시됨' : '초안';
        const date = new Date(post.frontMatter.date);
        const formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const categories = post.frontMatter.categories.length > 0 
            ? post.frontMatter.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')
            : '<span class="no-categories">카테고리 없음</span>';

        const excerpt = post.content.length > 150 
            ? post.content.substring(0, 150) + '...'
            : post.content;

        return `
            <div class="post-item" data-post-id="${post.id}">
                <div class="post-header">
                    <h3 class="post-title">
                        <a href="#/posts/edit/${post.id}" data-route="/posts/edit/${post.id}">
                            ${this.escapeHtml(post.frontMatter.title)}
                        </a>
                    </h3>
                    <div class="post-meta">
                        <span class="post-date">${formattedDate}</span>
                        <span class="post-status status-${publishedStatus}">${statusText}</span>
                    </div>
                </div>
                
                <div class="post-categories">
                    ${categories}
                </div>
                
                <div class="post-excerpt">
                    ${this.escapeHtml(excerpt)}
                </div>
                
                <div class="post-actions">
                    <a href="#/posts/edit/${post.id}" data-route="/posts/edit/${post.id}" class="btn btn-sm btn-primary">편집</a>
                    <button class="btn btn-sm btn-danger" onclick="window.adminApp.ui.confirmDeletePost('${post.id}', '${this.escapeHtml(post.frontMatter.title)}')">삭제</button>
                </div>
            </div>
        `;
    }

    /**
     * Setup post search functionality
     */
    setupPostSearch() {
        const searchInput = document.getElementById('post-search');
        const searchClear = document.getElementById('search-clear');
        const resultsInfo = document.getElementById('search-results-info');
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (!searchInput || !this.postManager) return;

        let searchTimeout;
        let suggestionTimeout;

        // Main search input handler with optimized debouncing
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            if (searchClear) {
                searchClear.style.display = query ? 'block' : 'none';
            }

            // Handle suggestions with shorter debounce for better UX
            clearTimeout(suggestionTimeout);
            if (query.length >= 2) {
                suggestionTimeout = setTimeout(() => {
                    this.showSearchSuggestions(query, suggestionsContainer);
                }, 100); // Reduced from 150ms
            } else {
                this.hideSearchSuggestions(suggestionsContainer);
            }

            // Debounce search with adaptive timing
            clearTimeout(searchTimeout);
            const debounceTime = query.length < 3 ? 400 : 250; // Longer debounce for short queries
            searchTimeout = setTimeout(() => {
                this.performPostSearch(query, resultsInfo);
            }, debounceTime);
        });

        // Clear search
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.style.display = 'none';
                this.hideSearchSuggestions(suggestionsContainer);
                this.performPostSearch('', resultsInfo);
                searchInput.focus();
            });
        }

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                this.hideSearchSuggestions(suggestionsContainer);
                this.performPostSearch(query, resultsInfo);
            } else if (e.key === 'Escape') {
                this.hideSearchSuggestions(suggestionsContainer);
                searchInput.blur();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSuggestions('down', suggestionsContainer);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSuggestions('up', suggestionsContainer);
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer?.contains(e.target)) {
                this.hideSearchSuggestions(suggestionsContainer);
            }
        });

        // Setup category and tag filters
        this.setupSearchFilters();
    }

    /**
     * Perform post search
     * @param {string} query - Search query
     * @param {HTMLElement} resultsInfo - Results info element
     */
    performPostSearch(query, resultsInfo) {
        if (!this.postManager) return;

        const searchResults = this.postManager.searchPosts(query);
        const postList = document.getElementById('post-list');
        
        if (!postList) return;

        // Update results info
        if (resultsInfo) {
            if (query) {
                const totalResults = searchResults.length;
                const hasHighScoreResults = searchResults.some(result => result.score > 0);
                
                resultsInfo.innerHTML = `
                    <div class="search-results-info">
                        <span class="search-results-count">
                            "${this.escapeHtml(query)}" 검색 결과: ${totalResults}개
                        </span>
                        ${hasHighScoreResults ? '<span class="search-relevance-note">관련도 순으로 정렬됨</span>' : ''}
                    </div>
                `;
                resultsInfo.style.display = 'block';
            } else {
                resultsInfo.style.display = 'none';
            }
        }

        // Update post list
        if (searchResults.length === 0 && query) {
            postList.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>검색 결과가 없습니다</h3>
                    <p>"${this.escapeHtml(query)}"에 대한 검색 결과를 찾을 수 없습니다.</p>
                    <div class="search-suggestions">
                        <p>다음을 시도해보세요:</p>
                        <ul>
                            <li>다른 키워드로 검색</li>
                            <li>더 짧은 검색어 사용</li>
                            <li>맞춤법 확인</li>
                        </ul>
                    </div>
                    <button class="btn btn-outline" onclick="document.getElementById('post-search').value = ''; window.adminApp.ui.performPostSearch('', document.getElementById('search-results-info'))">
                        전체 포스트 보기
                    </button>
                </div>
            `;
        } else {
            const postsHtml = searchResults.map(result => 
                this.renderSearchResultItem(result, query)
            ).join('');
            postList.innerHTML = postsHtml;
        }
    }

    /**
     * Show search suggestions
     * @param {string} query - Search query
     * @param {HTMLElement} container - Suggestions container
     */
    showSearchSuggestions(query, container) {
        if (!container || !this.postManager) return;

        const suggestions = this.postManager.getSearchSuggestions(query, 8);
        
        if (suggestions.length === 0) {
            this.hideSearchSuggestions(container);
            return;
        }

        const suggestionsHtml = suggestions.map((suggestion, index) => 
            `<div class="suggestion-item" data-suggestion="${this.escapeHtml(suggestion)}" data-index="${index}">
                <span class="suggestion-icon">🔍</span>
                <span class="suggestion-text">${this.highlightSuggestion(suggestion, query)}</span>
            </div>`
        ).join('');

        container.innerHTML = suggestionsHtml;
        container.style.display = 'block';

        // Add click handlers for suggestions
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                const searchInput = document.getElementById('post-search');
                if (searchInput) {
                    searchInput.value = suggestion;
                    this.hideSearchSuggestions(container);
                    this.performPostSearch(suggestion, document.getElementById('search-results-info'));
                }
            });
        });
    }

    /**
     * Hide search suggestions
     * @param {HTMLElement} container - Suggestions container
     */
    hideSearchSuggestions(container) {
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }

    /**
     * Navigate suggestions with keyboard
     * @param {string} direction - 'up' or 'down'
     * @param {HTMLElement} container - Suggestions container
     */
    navigateSuggestions(direction, container) {
        if (!container || container.style.display === 'none') return;

        const suggestions = container.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        const current = container.querySelector('.suggestion-item.active');
        let nextIndex = 0;

        if (current) {
            const currentIndex = parseInt(current.dataset.index);
            current.classList.remove('active');
            
            if (direction === 'down') {
                nextIndex = (currentIndex + 1) % suggestions.length;
            } else {
                nextIndex = currentIndex === 0 ? suggestions.length - 1 : currentIndex - 1;
            }
        }

        suggestions[nextIndex].classList.add('active');
        
        // Update search input with selected suggestion
        const searchInput = document.getElementById('post-search');
        if (searchInput) {
            searchInput.value = suggestions[nextIndex].dataset.suggestion;
        }
    }

    /**
     * Highlight matching part in suggestion
     * @param {string} suggestion - Suggestion text
     * @param {string} query - Search query
     * @returns {string} Highlighted suggestion
     */
    highlightSuggestion(suggestion, query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return suggestion.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Setup search filters for categories and tags
     */
    setupSearchFilters() {
        if (!this.postManager) return;

        const categories = this.postManager.getAllCategories();
        const tags = this.postManager.getAllTags();

        // Setup category filters
        const categoryFilters = document.getElementById('category-filters');
        if (categoryFilters && categories.length > 0) {
            const categoryHtml = categories.slice(0, 10).map(category => 
                `<button class="filter-tag" data-filter-type="category" data-filter-value="${this.escapeHtml(category)}">
                    ${this.escapeHtml(category)}
                </button>`
            ).join('');
            categoryFilters.innerHTML = categoryHtml;
        }

        // Setup tag filters
        const tagFilters = document.getElementById('tag-filters');
        if (tagFilters && tags.length > 0) {
            const tagHtml = tags.slice(0, 10).map(tag => 
                `<button class="filter-tag" data-filter-type="tag" data-filter-value="${this.escapeHtml(tag)}">
                    ${this.escapeHtml(tag)}
                </button>`
            ).join('');
            tagFilters.innerHTML = tagHtml;
        }

        // Add click handlers for filter tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const filterValue = tag.dataset.filterValue;
                const searchInput = document.getElementById('post-search');
                if (searchInput) {
                    searchInput.value = filterValue;
                    this.performPostSearch(filterValue, document.getElementById('search-results-info'));
                }
            });
        });

        // Show filters if there are categories or tags
        const filtersContainer = document.getElementById('search-filters');
        if (filtersContainer && (categories.length > 0 || tags.length > 0)) {
            filtersContainer.style.display = 'block';
        }
    }

    /**
     * Escape regex special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Confirm post deletion
     * @param {string} postId - Post ID
     * @param {string} postTitle - Post title
     */
    confirmDeletePost(postId, postTitle) {
        if (!this.postManager) return;

        const confirmed = confirm(`정말로 "${postTitle}" 포스트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
        
        if (confirmed) {
            this.deletePost(postId);
        }
    }

    /**
     * Delete post
     * @param {string} postId - Post ID
     */
    async deletePost(postId) {
        if (!this.postManager) return;

        try {
            // Show loading state
            const postItem = document.querySelector(`[data-post-id="${postId}"]`);
            if (postItem) {
                postItem.style.opacity = '0.5';
                postItem.style.pointerEvents = 'none';
            }

            await this.postManager.deletePost(postId);
            
            // Remove from DOM
            if (postItem) {
                postItem.remove();
            }

            // Show success message
            this.showToast('포스트가 성공적으로 삭제되었습니다.', 'success');
            
            // Refresh post list if no posts remain
            const remainingPosts = document.querySelectorAll('.post-item');
            if (remainingPosts.length === 0) {
                this.loadPostListContent();
            }

        } catch (error) {
            console.error('Error deleting post:', error);
            
            // Restore post item state
            const postItem = document.querySelector(`[data-post-id="${postId}"]`);
            if (postItem) {
                postItem.style.opacity = '1';
                postItem.style.pointerEvents = 'auto';
            }

            this.showToast('포스트 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Load and render settings form
     */
    async loadSettingsForm() {
        const contentContainer = document.getElementById('settings-content');
        if (!contentContainer) return;

        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>설정을 로드하는 중...</p>
                </div>
            `;

            // Import ConfigManager dynamically
            const { default: ConfigManager } = await import('./config-manager.js');
            this.configManager = new ConfigManager();

            // Load current configuration
            const config = await this.configManager.loadConfig();
            
            // Render settings form
            this.renderSettingsForm(contentContainer, config);
            
            // Setup form handlers
            this.setupSettingsHandlers();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-error">
                    <h3>설정 로드 실패</h3>
                    <p>사이트 설정을 불러오는 중 오류가 발생했습니다: ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">다시 시도</button>
                </div>
            `;
        }
    }

    /**
     * Render settings form
     * @param {HTMLElement} container - Container element
     * @param {Object} config - Configuration object
     */
    renderSettingsForm(container, config) {
        container.innerHTML = `
            <form id="settings-form" class="settings-form">
                <div class="settings-section">
                    <h3 class="section-title">기본 사이트 정보</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="site-title" class="form-label">사이트 제목 *</label>
                            <input 
                                type="text" 
                                id="site-title" 
                                name="title" 
                                class="form-input" 
                                value="${config.title || ''}" 
                                required 
                                placeholder="사이트 제목을 입력하세요"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="site-email" class="form-label">이메일 *</label>
                            <input 
                                type="email" 
                                id="site-email" 
                                name="email" 
                                class="form-input" 
                                value="${config.email || ''}" 
                                required 
                                placeholder="your-email@example.com"
                            >
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="site-description" class="form-label">사이트 설명 *</label>
                        <textarea 
                            id="site-description" 
                            name="description" 
                            class="form-textarea" 
                            rows="3" 
                            required 
                            placeholder="사이트에 대한 간단한 설명을 입력하세요"
                        >${config.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="site-url" class="form-label">사이트 URL</label>
                            <input 
                                type="url" 
                                id="site-url" 
                                name="url" 
                                class="form-input" 
                                value="${config.url || ''}" 
                                placeholder="https://username.github.io"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="site-baseurl" class="form-label">Base URL</label>
                            <input 
                                type="text" 
                                id="site-baseurl" 
                                name="baseurl" 
                                class="form-input" 
                                value="${config.baseurl || ''}" 
                                placeholder="/blog (선택사항)"
                            >
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="section-title">소셜 미디어</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="twitter-username" class="form-label">Twitter 사용자명</label>
                            <input 
                                type="text" 
                                id="twitter-username" 
                                name="twitter_username" 
                                class="form-input" 
                                value="${config.twitter_username || ''}" 
                                placeholder="username"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="github-username" class="form-label">GitHub 사용자명</label>
                            <input 
                                type="text" 
                                id="github-username" 
                                name="github_username" 
                                class="form-input" 
                                value="${config.github_username || ''}" 
                                placeholder="username"
                            >
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3 class="section-title">테마 및 플러그인</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="site-theme" class="form-label">테마</label>
                            <select id="site-theme" name="theme" class="form-select">
                                <option value="minima" ${config.theme === 'minima' ? 'selected' : ''}>Minima</option>
                                <option value="jekyll-theme-cayman" ${config.theme === 'jekyll-theme-cayman' ? 'selected' : ''}>Cayman</option>
                                <option value="jekyll-theme-minimal" ${config.theme === 'jekyll-theme-minimal' ? 'selected' : ''}>Minimal</option>
                                <option value="jekyll-theme-architect" ${config.theme === 'jekyll-theme-architect' ? 'selected' : ''}>Architect</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="site-plugins" class="form-label">플러그인</label>
                        <textarea 
                            id="site-plugins" 
                            name="plugins" 
                            class="form-textarea" 
                            rows="4" 
                            placeholder="플러그인을 한 줄에 하나씩 입력하세요&#10;예: jekyll-feed&#10;jekyll-seo-tag"
                        >${Array.isArray(config.plugins) ? config.plugins.join('\n') : ''}</textarea>
                        <small class="form-help">각 플러그인을 새 줄에 입력하세요</small>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" id="save-settings-btn">
                        <span class="btn-text">설정 저장</span>
                        <span class="btn-loading" style="display: none;">
                            <span class="spinner-small"></span>
                            저장 중...
                        </span>
                    </button>
                    <button type="button" class="btn btn-outline" id="reset-settings-btn">
                        변경사항 되돌리기
                    </button>
                    <button type="button" class="btn btn-outline" id="download-config-btn">
                        설정 파일 다운로드
                    </button>
                </div>
            </form>

            <div id="settings-validation" class="validation-messages" style="display: none;">
                <!-- Validation messages will be inserted here -->
            </div>
        `;
    }

    /**
     * Setup settings form event handlers
     */
    setupSettingsHandlers() {
        const form = document.getElementById('settings-form');
        const saveBtn = document.getElementById('save-settings-btn');
        const resetBtn = document.getElementById('reset-settings-btn');
        const downloadBtn = document.getElementById('download-config-btn');

        if (!form || !this.configManager) return;

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSettingsSave();
        });

        // Handle reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.handleSettingsReset();
            });
        }

        // Handle download button
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleConfigDownload();
            });
        }

        // Real-time validation with debouncing
        let validationTimeout;
        form.addEventListener('input', (e) => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                this.validateSettingsForm();
                this.updateSaveButtonState();
            }, 300);
            
            // Immediate feedback for specific fields
            this.provideImmediateFeedback(e.target);
        });
    }

    /**
     * Handle settings save
     */
    async handleSettingsSave() {
        const form = document.getElementById('settings-form');
        const saveBtn = document.getElementById('save-settings-btn');
        
        if (!form || !saveBtn || !this.configManager) return;

        try {
            // Show loading state
            this.showSaveLoading(saveBtn);
            this.showSaveProgress(0);

            // Collect form data
            const formData = new FormData(form);
            const configData = {
                title: formData.get('title').trim(),
                email: formData.get('email').trim(),
                description: formData.get('description').trim(),
                url: formData.get('url').trim(),
                baseurl: formData.get('baseurl').trim(),
                twitter_username: formData.get('twitter_username').trim(),
                github_username: formData.get('github_username').trim(),
                theme: formData.get('theme'),
                plugins: formData.get('plugins').split('\n').map(p => p.trim()).filter(p => p)
            };

            this.showSaveProgress(25);

            // Validate configuration
            const validation = this.configManager.validateConfig(configData);
            if (!validation.isValid) {
                this.showValidationMessages(validation.errors, validation.warnings);
                this.showToast('설정에 오류가 있습니다. 오류를 수정한 후 다시 시도해주세요.', 'error');
                return;
            }

            this.showSaveProgress(50);

            // Show warnings if any (but allow saving)
            if (validation.hasWarnings) {
                this.showValidationMessages([], validation.warnings);
            } else {
                this.hideValidationErrors();
            }

            this.showSaveProgress(75);

            // Update configuration
            await this.configManager.updateConfig(configData);

            this.showSaveProgress(100);

            // Show success message with details
            let successMessage = '설정이 성공적으로 저장되었습니다!';
            if (validation.hasWarnings) {
                successMessage += ' 권장사항을 확인해주세요.';
            }
            
            this.showToast(successMessage, 'success');

            // Hide progress after a short delay
            setTimeout(() => {
                this.hideSaveProgress();
            }, 1000);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.hideSaveProgress();
            
            // Provide more specific error messages
            let errorMessage = '설정 저장 실패: ';
            if (error.message.includes('Validation failed')) {
                errorMessage += '설정 유효성 검사에 실패했습니다.';
            } else if (error.message.includes('Failed to save')) {
                errorMessage += '파일 저장에 실패했습니다. 브라우저 권한을 확인해주세요.';
            } else {
                errorMessage += error.message;
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.hideSaveLoading(saveBtn);
        }
    }

    /**
     * Show save progress indicator
     * @param {number} percentage - Progress percentage (0-100)
     */
    showSaveProgress(percentage) {
        let progressContainer = document.querySelector('.settings-save-progress');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'settings-save-progress';
            progressContainer.innerHTML = '<div class="progress-bar"></div>';
            document.body.appendChild(progressContainer);
        }
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Hide save progress indicator
     */
    hideSaveProgress() {
        const progressContainer = document.querySelector('.settings-save-progress');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * Provide immediate feedback for specific fields
     * @param {HTMLElement} field - Input field element
     */
    provideImmediateFeedback(field) {
        if (!field || !this.configManager) return;

        const fieldName = field.name;
        const value = field.value.trim();
        
        // Remove existing feedback
        const existingFeedback = field.parentNode.querySelector('.field-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        let isValid = true;
        let feedbackIcon = '';

        // Field-specific validation
        switch (fieldName) {
            case 'email':
                if (value && !this.configManager.isValidEmail(value)) {
                    isValid = false;
                    feedbackIcon = '❌';
                } else if (value) {
                    feedbackIcon = '✅';
                }
                break;
                
            case 'url':
                if (value && !this.configManager.isValidUrl(value)) {
                    isValid = false;
                    feedbackIcon = '❌';
                } else if (value) {
                    feedbackIcon = '✅';
                }
                break;
                
            case 'baseurl':
                if (value && !value.startsWith('/')) {
                    isValid = false;
                    feedbackIcon = '❌';
                } else if (value) {
                    feedbackIcon = '✅';
                }
                break;
                
            case 'twitter_username':
            case 'github_username':
                if (value && !this.configManager.isValidUsername(value)) {
                    isValid = false;
                    feedbackIcon = '❌';
                } else if (value) {
                    feedbackIcon = '✅';
                }
                break;
                
            default:
                if (value && this.configManager.requiredFields.includes(fieldName)) {
                    feedbackIcon = '✅';
                }
        }

        // Add feedback icon
        if (feedbackIcon) {
            const feedback = document.createElement('span');
            feedback.className = `field-feedback ${isValid ? 'valid' : 'invalid'}`;
            feedback.textContent = feedbackIcon;
            field.parentNode.appendChild(feedback);
        }
    }

    /**
     * Update save button state based on form validity
     */
    updateSaveButtonState() {
        const form = document.getElementById('settings-form');
        const saveBtn = document.getElementById('save-settings-btn');
        
        if (!form || !saveBtn || !this.configManager) return;

        const formData = new FormData(form);
        const configData = {
            title: formData.get('title').trim(),
            email: formData.get('email').trim(),
            description: formData.get('description').trim(),
            url: formData.get('url').trim(),
            baseurl: formData.get('baseurl').trim(),
            twitter_username: formData.get('twitter_username').trim(),
            github_username: formData.get('github_username').trim(),
            theme: formData.get('theme'),
            plugins: formData.get('plugins').split('\n').map(p => p.trim()).filter(p => p)
        };

        const validation = this.configManager.validateConfig(configData);
        
        // Enable/disable save button based on validation
        saveBtn.disabled = !validation.isValid;
        
        // Update button text based on state
        const btnText = saveBtn.querySelector('.btn-text');
        if (btnText) {
            if (!validation.isValid) {
                btnText.textContent = '오류 수정 필요';
            } else if (validation.hasWarnings) {
                btnText.textContent = '설정 저장 (권장사항 확인)';
            } else {
                btnText.textContent = '설정 저장';
            }
        }
    }

    /**
     * Handle settings reset
     */
    handleSettingsReset() {
        if (!this.configManager) return;

        if (confirm('변경사항을 되돌리시겠습니까? 저장되지 않은 변경사항은 모두 사라집니다.')) {
            this.configManager.revertChanges();
            const config = this.configManager.getConfig();
            
            // Re-render form with original values
            const contentContainer = document.getElementById('settings-content');
            if (contentContainer) {
                this.renderSettingsForm(contentContainer, config);
                this.setupSettingsHandlers();
            }
            
            this.showToast('변경사항이 되돌려졌습니다.', 'info');
        }
    }

    /**
     * Handle config file download
     */
    handleConfigDownload() {
        if (!this.configManager) return;

        try {
            const config = this.configManager.getConfig();
            const yamlContent = this.configManager.stringifyYAML(config);
            
            // Create and trigger download
            const blob = new Blob([yamlContent], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '_config.yml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('설정 파일이 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('Error downloading config:', error);
            this.showToast(`다운로드 실패: ${error.message}`, 'error');
        }
    }

    /**
     * Validate settings form in real-time
     */
    validateSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form || !this.configManager) return;

        const formData = new FormData(form);
        const configData = {
            title: formData.get('title').trim(),
            email: formData.get('email').trim(),
            description: formData.get('description').trim(),
            url: formData.get('url').trim(),
            baseurl: formData.get('baseurl').trim(),
            twitter_username: formData.get('twitter_username').trim(),
            github_username: formData.get('github_username').trim(),
            theme: formData.get('theme'),
            plugins: formData.get('plugins').split('\n').map(p => p.trim()).filter(p => p)
        };

        const validation = this.configManager.validateConfig(configData);
        
        // Update field validation states
        this.updateFieldValidationStates(form, validation);
        
        if (!validation.isValid || validation.hasWarnings) {
            this.showValidationMessages(validation.errors, validation.warnings);
        } else {
            this.hideValidationErrors();
        }
    }

    /**
     * Update individual field validation states
     * @param {HTMLElement} form - Form element
     * @param {Object} validation - Validation result
     */
    updateFieldValidationStates(form, validation) {
        const fields = ['title', 'email', 'description', 'url', 'baseurl', 'twitter_username', 'github_username'];
        
        fields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            
            // Remove existing validation classes
            field.classList.remove('invalid', 'valid');
            
            // Check if field has errors
            const hasError = validation.errors.some(error => 
                error.toLowerCase().includes(fieldName) || 
                error.toLowerCase().includes(this.configManager.getFieldDisplayName(fieldName).toLowerCase())
            );
            
            if (hasError) {
                field.classList.add('invalid');
            } else if (field.value.trim() !== '') {
                field.classList.add('valid');
            }
        });
    }

    /**
     * Show validation messages (errors and warnings)
     * @param {Array} errors - Array of error messages
     * @param {Array} warnings - Array of warning messages
     */
    showValidationMessages(errors = [], warnings = []) {
        const validationDiv = document.getElementById('settings-validation');
        if (!validationDiv) return;

        let html = '';
        
        if (errors.length > 0) {
            html += `
                <div class="alert alert-error">
                    <h4>❌ 설정 오류</h4>
                    <p>다음 오류를 수정해야 설정을 저장할 수 있습니다:</p>
                    <ul>
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (warnings.length > 0) {
            html += `
                <div class="alert alert-warning">
                    <h4>⚠️ 권장사항</h4>
                    <p>다음 사항을 확인해주세요:</p>
                    <ul>
                        ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        validationDiv.innerHTML = html;
        validationDiv.style.display = 'block';
    }

    /**
     * Show validation errors (legacy method for compatibility)
     * @param {Array} errors - Array of error messages
     */
    showValidationErrors(errors) {
        this.showValidationMessages(errors, []);
    }

    /**
     * Hide validation errors
     */
    hideValidationErrors() {
        const validationDiv = document.getElementById('settings-validation');
        if (validationDiv) {
            validationDiv.style.display = 'none';
        }
    }
}
}