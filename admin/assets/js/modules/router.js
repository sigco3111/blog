// Client-side Router Module

export class Router {
    constructor(routes = {}) {
        this.routes = routes;
        this.currentRoute = null;
        this.currentParams = {};
        this.currentQuery = {};
        this.routeChangeCallback = null;
        this.beforeRouteChange = null;
        this.routeHistory = [];
    }
    
    /**
     * Initialize the router
     * @param {Function} onRouteChange - Callback function for route changes
     * @param {Function} beforeRouteChange - Optional callback before route changes
     */
    init(onRouteChange, beforeRouteChange = null) {
        this.routeChangeCallback = onRouteChange;
        this.beforeRouteChange = beforeRouteChange;
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange(true);
        });
        
        // Handle initial route
        this.handleRouteChange();
        
        console.log('Router initialized with routes:', Object.keys(this.routes));
    }
    
    /**
     * Navigate to a specific route
     * @param {string} path - The path to navigate to
     * @param {boolean} replace - Whether to replace current history entry
     * @param {Object} state - Optional state object to store with history entry
     */
    navigate(path, replace = false, state = null) {
        // Check if navigation should be prevented
        if (this.beforeRouteChange) {
            const shouldNavigate = this.beforeRouteChange(this.getCurrentPath(), path);
            if (shouldNavigate === false) {
                return false;
            }
        }
        
        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        const fullUrl = `#${path}`;
        
        if (replace) {
            history.replaceState(state, '', fullUrl);
        } else {
            history.pushState(state, '', fullUrl);
        }
        
        this.handleRouteChange();
        return true;
    }
    
    /**
     * Handle route changes
     * @param {boolean} isPopState - Whether this is triggered by browser back/forward
     */
    handleRouteChange(isPopState = false) {
        const fullPath = window.location.hash.slice(1) || '/';
        const { path, query } = this.parseUrl(fullPath);
        const route = this.matchRoute(path);
        const params = this.extractRouteParams(path);
        
        // Store previous route in history
        if (this.currentRoute && this.currentRoute !== route) {
            this.routeHistory.push({
                route: this.currentRoute,
                path: this.getCurrentPath(),
                params: { ...this.currentParams },
                query: { ...this.currentQuery },
                timestamp: Date.now()
            });
            
            // Keep only last 10 entries
            if (this.routeHistory.length > 10) {
                this.routeHistory.shift();
            }
        }
        
        // Update current route info
        const previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.currentParams = params;
        this.currentQuery = query;
        
        // Call route change callback
        if (this.routeChangeCallback) {
            this.routeChangeCallback(route, {
                path,
                params,
                query,
                previousRoute,
                isPopState,
                history: this.routeHistory
            });
        }
        
        console.log('Route changed:', { route, path, params, query });
    }
    
    /**
     * Parse URL to extract path and query parameters
     * @param {string} url - Full URL with potential query string
     * @returns {Object} - Object with path and query
     */
    parseUrl(url) {
        const [path, queryString] = url.split('?');
        const query = {};
        
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                }
            });
        }
        
        return { path: path || '/', query };
    }
    
    /**
     * Match current path to a route
     * @param {string} path - Current path
     * @returns {string} - Matched route name
     */
    matchRoute(path) {
        // Direct match
        if (this.routes[path]) {
            return this.routes[path];
        }
        
        // Check for parameterized routes
        for (const [routePath, routeName] of Object.entries(this.routes)) {
            if (this.matchParameterizedRoute(path, routePath)) {
                return routeName;
            }
        }
        
        // Default to 404 or first route
        return 'not-found';
    }
    
    /**
     * Match parameterized routes (e.g., /posts/edit/:id)
     * @param {string} currentPath - Current path
     * @param {string} routePath - Route pattern
     * @returns {boolean} - Whether the route matches
     */
    matchParameterizedRoute(currentPath, routePath) {
        const currentSegments = currentPath.split('/').filter(s => s);
        const routeSegments = routePath.split('/').filter(s => s);
        
        if (currentSegments.length !== routeSegments.length) {
            return false;
        }
        
        return routeSegments.every((segment, index) => {
            return segment.startsWith(':') || segment === currentSegments[index];
        });
    }
    
    /**
     * Extract parameters from current route
     * @param {string} currentPath - Current path
     * @returns {Object} - Extracted parameters
     */
    extractRouteParams(currentPath) {
        const params = {};
        
        // Find matching route pattern
        for (const [routePath, routeName] of Object.entries(this.routes)) {
            if (this.matchParameterizedRoute(currentPath, routePath)) {
                const currentSegments = currentPath.split('/').filter(s => s);
                const routeSegments = routePath.split('/').filter(s => s);
                
                routeSegments.forEach((segment, index) => {
                    if (segment.startsWith(':')) {
                        const paramName = segment.slice(1);
                        params[paramName] = currentSegments[index];
                    }
                });
                break;
            }
        }
        
        return params;
    }
    
    /**
     * Get route parameters (legacy method for compatibility)
     * @param {string} routePath - Route pattern
     * @returns {Object} - Extracted parameters
     */
    getRouteParams(routePath) {
        return this.currentParams;
    }
    
    /**
     * Get current route
     * @returns {string}
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get current path
     * @returns {string}
     */
    getCurrentPath() {
        return window.location.hash.slice(1) || '/';
    }
    
    /**
     * Check if current route matches given route
     * @param {string} route - Route to check
     * @returns {boolean}
     */
    isCurrentRoute(route) {
        return this.currentRoute === route;
    }
    
    /**
     * Get current query parameters
     * @returns {Object} - Current query parameters
     */
    getQueryParams() {
        return { ...this.currentQuery };
    }
    
    /**
     * Get current route parameters
     * @returns {Object} - Current route parameters
     */
    getCurrentParams() {
        return { ...this.currentParams };
    }
    
    /**
     * Build URL with parameters and query string
     * @param {string} path - Base path
     * @param {Object} params - Route parameters
     * @param {Object} query - Query parameters
     * @returns {string} - Built URL
     */
    buildUrl(path, params = {}, query = {}) {
        let url = path;
        
        // Replace route parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        });
        
        // Add query parameters
        const queryString = Object.entries(query)
            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        if (queryString) {
            url += `?${queryString}`;
        }
        
        return url;
    }
    
    /**
     * Navigate back in history
     */
    goBack() {
        if (this.routeHistory.length > 0) {
            const previousRoute = this.routeHistory.pop();
            this.navigate(previousRoute.path, true);
        } else {
            // Fallback to browser back
            history.back();
        }
    }
    
    /**
     * Navigate forward in history
     */
    goForward() {
        history.forward();
    }
    
    /**
     * Refresh current route
     */
    refresh() {
        this.handleRouteChange();
    }
    
    /**
     * Set route guard
     * @param {Function} guard - Function that returns true/false for navigation
     */
    setRouteGuard(guard) {
        this.beforeRouteChange = guard;
    }
    
    /**
     * Remove route guard
     */
    removeRouteGuard() {
        this.beforeRouteChange = null;
    }
    
    /**
     * Get route history
     * @returns {Array} - Array of previous routes
     */
    getHistory() {
        return [...this.routeHistory];
    }
    
    /**
     * Clear route history
     */
    clearHistory() {
        this.routeHistory = [];
    }
    
    /**
     * Check if a path matches current path
     * @param {string} path - Path to check
     * @returns {boolean}
     */
    isCurrentPath(path) {
        return this.getCurrentPath() === path;
    }
    
    /**
     * Add route dynamically
     * @param {string} path - Route path
     * @param {string} name - Route name
     */
    addRoute(path, name) {
        this.routes[path] = name;
    }
    
    /**
     * Remove route
     * @param {string} path - Route path to remove
     */
    removeRoute(path) {
        delete this.routes[path];
    }
    
    /**
     * Get all registered routes
     * @returns {Object} - All routes
     */
    getRoutes() {
        return { ...this.routes };
    }
}