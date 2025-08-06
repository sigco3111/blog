// Jekyll Admin - Updated Bundle with Working Router and Error Handling
console.log('Jekyll Admin Bundle loading...');

// Initialize error handling and notification systems first
let errorHandler, notificationSystem, loadingManager;

async function initializeGlobalSystems() {
    try {
        const errorHandlerModule = await import('./modules/error-handler.js');
        const notificationModule = await import('./modules/notification-system.js');
        const loadingManagerModule = await import('./modules/loading-manager.js');
        
        errorHandler = errorHandlerModule.globalErrorHandler;
        notificationSystem = notificationModule.globalNotificationSystem;
        loadingManager = loadingManagerModule.globalLoadingManager;
        
        console.log('Global systems initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize global systems:', error);
        return false;
    }
}

// Initialize global systems first, then load main app
initializeGlobalSystems().then(success => {
    if (success) {
        // Import main.js functionality
        import('./main.js').then(module => {
            console.log('Main module loaded successfully');
        }).catch(error => {
            console.error('Failed to load main module:', error);
            errorHandler?.handleError({
                type: 'initialization',
                message: `Failed to load main module: ${error.message}`,
                stack: error.stack,
                severity: 'critical'
            });
            
            // Fallback: Load modules directly
            loadFallbackAdmin();
        });
    } else {
        // Load fallback without global systems
        loadFallbackAdmin();
    }
});

// Fallback admin loader
async function loadFallbackAdmin() {
    console.log('Loading fallback admin...');
    
    try {
        // Simple hash-based routing
        function handleRoute() {
            const hash = window.location.hash.slice(1) || '/';
            const appContainer = document.getElementById('app');
            
            console.log('Handling route:', hash);
            
            if (hash === '/settings') {
                renderSettingsPage(appContainer);
            } else if (hash === '/dashboard') {
                renderDashboardPage(appContainer);
            } else if (hash === '/posts') {
                renderPostsPage(appContainer);
            } else {
                // Default to dashboard
                renderDashboardPage(appContainer);
                window.location.hash = '#/dashboard';
            }
        }
        
        // Settings page renderer
        function renderSettingsPage(container) {
            console.log('Rendering settings page');
            container.innerHTML = `
                <div class="admin-layout">
                    <header class="admin-header">
                        <div class="header-content">
                            <div class="header-left">
                                <button class="sidebar-toggle" id="sidebar-toggle">☰</button>
                                <h1 class="admin-title">Jekyll Admin</h1>
                            </div>
                            <div class="header-right">
                                <span class="user-info">관리자</span>
                                <button class="btn btn-outline logout-btn">로그아웃</button>
                            </div>
                        </div>
                    </header>

                    <aside class="admin-sidebar">
                        <nav class="sidebar-nav">
                            <ul class="nav-menu">
                                <li class="nav-item">
                                    <a href="#/dashboard" class="nav-link">
                                        <span class="nav-icon">📊</span>
                                        <span class="nav-text">대시보드</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts" class="nav-link">
                                        <span class="nav-icon">📝</span>
                                        <span class="nav-text">포스트 관리</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts/new" class="nav-link">
                                        <span class="nav-icon">➕</span>
                                        <span class="nav-text">새 포스트</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/settings" class="nav-link active">
                                        <span class="nav-icon">⚙️</span>
                                        <span class="nav-text">사이트 설정</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    <main class="admin-main">
                        <div class="main-content">
                            <div class="page-header">
                                <h2 class="page-title">사이트 설정</h2>
                                <p class="page-description">Jekyll 사이트의 기본 설정을 관리하세요</p>
                            </div>
                            
                            <div class="content-card">
                                <div id="settings-content">
                                    <div class="settings-form">
                                        <div class="settings-section">
                                            <h3 class="section-title">기본 사이트 정보</h3>
                                            <form id="settings-form">
                                                <div class="form-row">
                                                    <div class="form-group">
                                                        <label for="site-title" class="form-label">사이트 제목 *</label>
                                                        <input type="text" id="site-title" name="title" class="form-input" value="sigco3111 Blog" required>
                                                    </div>
                                                    <div class="form-group">
                                                        <label for="site-email" class="form-label">이메일 *</label>
                                                        <input type="email" id="site-email" name="email" class="form-input" value="sigco3111k@gmail.com" required>
                                                    </div>
                                                </div>
                                                
                                                <div class="form-group">
                                                    <label for="site-description" class="form-label">사이트 설명 *</label>
                                                    <textarea id="site-description" name="description" class="form-textarea" rows="3" required>바이브코딩과 일상에 대한 블로그</textarea>
                                                </div>
                                                
                                                <div class="form-row">
                                                    <div class="form-group">
                                                        <label for="site-url" class="form-label">사이트 URL</label>
                                                        <input type="url" id="site-url" name="url" class="form-input" value="https://sigco3111.github.io">
                                                    </div>
                                                    <div class="form-group">
                                                        <label for="site-baseurl" class="form-label">Base URL</label>
                                                        <input type="text" id="site-baseurl" name="baseurl" class="form-input" value="/blog">
                                                    </div>
                                                </div>
                                                
                                                <div class="form-actions">
                                                    <button type="submit" class="btn btn-primary">설정 저장</button>
                                                    <button type="button" class="btn btn-outline">변경사항 되돌리기</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;
            
            // Add form handler
            const form = document.getElementById('settings-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('설정이 저장되었습니다! (데모 버전)');
                });
            }
        }
        
        // Dashboard page renderer
        function renderDashboardPage(container) {
            console.log('Rendering dashboard page');
            container.innerHTML = `
                <div class="admin-layout">
                    <header class="admin-header">
                        <div class="header-content">
                            <div class="header-left">
                                <button class="sidebar-toggle">☰</button>
                                <h1 class="admin-title">Jekyll Admin</h1>
                            </div>
                            <div class="header-right">
                                <span class="user-info">관리자</span>
                                <button class="btn btn-outline logout-btn">로그아웃</button>
                            </div>
                        </div>
                    </header>

                    <aside class="admin-sidebar">
                        <nav class="sidebar-nav">
                            <ul class="nav-menu">
                                <li class="nav-item">
                                    <a href="#/dashboard" class="nav-link active">
                                        <span class="nav-icon">📊</span>
                                        <span class="nav-text">대시보드</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts" class="nav-link">
                                        <span class="nav-icon">📝</span>
                                        <span class="nav-text">포스트 관리</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts/new" class="nav-link">
                                        <span class="nav-icon">➕</span>
                                        <span class="nav-text">새 포스트</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/settings" class="nav-link">
                                        <span class="nav-icon">⚙️</span>
                                        <span class="nav-text">사이트 설정</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    <main class="admin-main">
                        <div class="main-content">
                            <div class="page-header">
                                <h2 class="page-title">대시보드</h2>
                                <p class="page-description">Jekyll 사이트 관리 개요</p>
                            </div>
                            
                            <div class="dashboard-cards">
                                <div class="card">
                                    <div class="card-icon">📝</div>
                                    <div class="card-content">
                                        <h3 class="card-title">포스트 관리</h3>
                                        <p class="card-description">블로그 포스트를 생성, 편집, 삭제할 수 있습니다.</p>
                                        <div class="card-actions">
                                            <a href="#/posts" class="btn btn-primary">포스트 목록</a>
                                            <a href="#/posts/new" class="btn btn-outline">새 포스트</a>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card">
                                    <div class="card-icon">⚙️</div>
                                    <div class="card-content">
                                        <h3 class="card-title">사이트 설정</h3>
                                        <p class="card-description">Jekyll 사이트의 기본 설정을 관리할 수 있습니다.</p>
                                        <div class="card-actions">
                                            <a href="#/settings" class="btn btn-secondary">설정 관리</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;
        }
        
        // Posts page renderer
        function renderPostsPage(container) {
            console.log('Rendering posts page');
            container.innerHTML = `
                <div class="admin-layout">
                    <header class="admin-header">
                        <div class="header-content">
                            <div class="header-left">
                                <button class="sidebar-toggle">☰</button>
                                <h1 class="admin-title">Jekyll Admin</h1>
                            </div>
                            <div class="header-right">
                                <span class="user-info">관리자</span>
                                <button class="btn btn-outline logout-btn">로그아웃</button>
                            </div>
                        </div>
                    </header>

                    <aside class="admin-sidebar">
                        <nav class="sidebar-nav">
                            <ul class="nav-menu">
                                <li class="nav-item">
                                    <a href="#/dashboard" class="nav-link">
                                        <span class="nav-icon">📊</span>
                                        <span class="nav-text">대시보드</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts" class="nav-link active">
                                        <span class="nav-icon">📝</span>
                                        <span class="nav-text">포스트 관리</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/posts/new" class="nav-link">
                                        <span class="nav-icon">➕</span>
                                        <span class="nav-text">새 포스트</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#/settings" class="nav-link">
                                        <span class="nav-icon">⚙️</span>
                                        <span class="nav-text">사이트 설정</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    <main class="admin-main">
                        <div class="main-content">
                            <div class="page-header">
                                <h2 class="page-title">포스트 관리</h2>
                                <div class="page-actions">
                                    <a href="#/posts/new" class="btn btn-primary">새 포스트 작성</a>
                                </div>
                            </div>
                            
                            <div class="content-card">
                                <div class="post-list">
                                    <div class="post-item">
                                        <h3>Welcome to Jekyll!</h3>
                                        <p>2025년 8월 5일 게시됨</p>
                                        <div class="post-actions">
                                            <button class="btn btn-sm btn-primary">편집</button>
                                            <button class="btn btn-sm btn-danger">삭제</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            `;
        }
        
        // Set up routing
        window.addEventListener('hashchange', handleRoute);
        
        // Handle initial route
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, handling initial route');
            setTimeout(handleRoute, 100);
        });
        
        // If DOM is already loaded
        if (document.readyState === 'loading') {
            console.log('Document still loading');
        } else {
            console.log('Document already loaded, handling route immediately');
            setTimeout(handleRoute, 100);
        }
        
    } catch (error) {
        console.error('Fallback admin loading failed:', error);
    }
}