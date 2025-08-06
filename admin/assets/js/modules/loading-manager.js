// Loading Manager Module

/**
 * Loading types
 */
export const LoadingTypes = {
    OVERLAY: 'overlay',
    INLINE: 'inline',
    BUTTON: 'button',
    NOTIFICATION: 'notification'
};

/**
 * Loading Manager Class
 */
export class LoadingManager {
    constructor() {
        this.activeLoadings = new Map();
        this.overlayElement = null;
        
        console.log('Loading manager initialized');
    }
    
    /**
     * Show loading state
     * @param {string} id - Loading identifier
     * @param {string} message - Loading message
     * @param {string} type - Loading type
     * @param {Object} options - Additional options
     */
    show(id, message = '로딩 중...', type = LoadingTypes.OVERLAY, options = {}) {
        // Hide existing loading with same ID
        if (this.activeLoadings.has(id)) {
            this.hide(id);
        }
        
        const loadingInfo = {
            id,
            message,
            type,
            startTime: Date.now(),
            options
        };
        
        this.activeLoadings.set(id, loadingInfo);
        
        switch (type) {
            case LoadingTypes.OVERLAY:
                this.showOverlay(id, message, options);
                break;
            case LoadingTypes.INLINE:
                this.showInline(id, message, options);
                break;
            case LoadingTypes.BUTTON:
                this.showButton(id, message, options);
                break;
            case LoadingTypes.NOTIFICATION:
                this.showNotification(id, message, options);
                break;
        }
        
        // Auto-hide after timeout if specified
        if (options.timeout) {
            setTimeout(() => {
                this.hide(id);
            }, options.timeout);
        }
    }
    
    /**
     * Hide loading state
     * @param {string} id - Loading identifier
     */
    hide(id) {
        const loadingInfo = this.activeLoadings.get(id);
        if (!loadingInfo) return;
        
        switch (loadingInfo.type) {
            case LoadingTypes.OVERLAY:
                this.hideOverlay(id);
                break;
            case LoadingTypes.INLINE:
                this.hideInline(id);
                break;
            case LoadingTypes.BUTTON:
                this.hideButton(id);
                break;
            case LoadingTypes.NOTIFICATION:
                this.hideNotification(id);
                break;
        }
        
        this.activeLoadings.delete(id);
    }
    
    /**
     * Show overlay loading
     * @param {string} id - Loading identifier
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     */
    showOverlay(id, message, options = {}) {
        // Remove existing overlay
        this.hideOverlay();
        
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'loading-overlay';
        this.overlayElement.setAttribute('data-loading-id', id);
        this.overlayElement.setAttribute('aria-label', '로딩 중');
        this.overlayElement.setAttribute('role', 'status');
        
        const content = document.createElement('div');
        content.className = 'loading-content';
        
        // Add spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        content.appendChild(spinner);
        
        // Add message
        const messageEl = document.createElement('p');
        messageEl.className = 'loading-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        // Add progress bar if specified
        if (options.showProgress) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'loading-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = '0%';
            
            progressContainer.appendChild(progressBar);
            content.appendChild(progressContainer);
        }
        
        // Add cancel button if specified
        if (options.cancelable && options.onCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-outline btn-sm';
            cancelBtn.textContent = '취소';
            cancelBtn.style.marginTop = '1rem';
            cancelBtn.addEventListener('click', () => {
                options.onCancel();
                this.hide(id);
            });
            content.appendChild(cancelBtn);
        }
        
        this.overlayElement.appendChild(content);
        document.body.appendChild(this.overlayElement);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        requestAnimationFrame(() => {
            this.overlayElement.style.opacity = '1';
        });
    }
    
    /**
     * Hide overlay loading
     * @param {string} id - Loading identifier (optional)
     */
    hideOverlay(id = null) {
        if (this.overlayElement) {
            // Check if this is the correct overlay
            if (id && this.overlayElement.getAttribute('data-loading-id') !== id) {
                return;
            }
            
            this.overlayElement.style.opacity = '0';
            
            setTimeout(() => {
                if (this.overlayElement && this.overlayElement.parentNode) {
                    this.overlayElement.parentNode.removeChild(this.overlayElement);
                }
                this.overlayElement = null;
                
                // Restore body scroll
                document.body.style.overflow = '';
            }, 300);
        }
    }
    
    /**
     * Show inline loading
     * @param {string} id - Loading identifier
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     */
    showInline(id, message, options = {}) {
        const container = options.container || document.getElementById(options.containerId);
        if (!container) {
            console.warn(`Container not found for inline loading: ${id}`);
            return;
        }
        
        // Store original content if not already stored
        if (!container.hasAttribute('data-original-content')) {
            container.setAttribute('data-original-content', container.innerHTML);
        }
        
        const loadingEl = document.createElement('div');
        loadingEl.className = 'inline-loading';
        loadingEl.setAttribute('data-loading-id', id);
        
        // Add spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner-small';
        loadingEl.appendChild(spinner);
        
        // Add message
        const messageEl = document.createElement('span');
        messageEl.className = 'loading-message';
        messageEl.textContent = message;
        messageEl.style.marginLeft = '8px';
        loadingEl.appendChild(messageEl);
        
        container.innerHTML = '';
        container.appendChild(loadingEl);
    }
    
    /**
     * Hide inline loading
     * @param {string} id - Loading identifier
     */
    hideInline(id) {
        const loadingEl = document.querySelector(`[data-loading-id="${id}"]`);
        if (!loadingEl) return;
        
        const container = loadingEl.parentNode;
        if (container && container.hasAttribute('data-original-content')) {
            container.innerHTML = container.getAttribute('data-original-content');
            container.removeAttribute('data-original-content');
        }
    }
    
    /**
     * Show button loading
     * @param {string} id - Loading identifier (button ID or selector)
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     */
    showButton(id, message, options = {}) {
        const button = document.getElementById(id) || document.querySelector(id);
        if (!button) {
            console.warn(`Button not found for loading: ${id}`);
            return;
        }
        
        // Store original state
        if (!button.hasAttribute('data-original-text')) {
            button.setAttribute('data-original-text', button.innerHTML);
            button.setAttribute('data-original-disabled', button.disabled);
        }
        
        // Create loading content
        const loadingContent = document.createElement('span');
        loadingContent.style.display = 'inline-flex';
        loadingContent.style.alignItems = 'center';
        loadingContent.style.gap = '8px';
        
        const spinner = document.createElement('span');
        spinner.className = 'spinner-small';
        loadingContent.appendChild(spinner);
        
        const text = document.createElement('span');
        text.textContent = message;
        loadingContent.appendChild(text);
        
        button.innerHTML = '';
        button.appendChild(loadingContent);
        button.disabled = true;
        button.setAttribute('data-loading-id', id);
    }
    
    /**
     * Hide button loading
     * @param {string} id - Loading identifier
     */
    hideButton(id) {
        const button = document.getElementById(id) || document.querySelector(id);
        if (!button || !button.hasAttribute('data-original-text')) return;
        
        button.innerHTML = button.getAttribute('data-original-text');
        button.disabled = button.getAttribute('data-original-disabled') === 'true';
        
        button.removeAttribute('data-original-text');
        button.removeAttribute('data-original-disabled');
        button.removeAttribute('data-loading-id');
    }
    
    /**
     * Show notification loading
     * @param {string} id - Loading identifier
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     */
    showNotification(id, message, options = {}) {
        // Dispatch event for notification system
        window.dispatchEvent(new CustomEvent('show-loading', {
            detail: {
                message,
                options: { id, ...options }
            }
        }));
    }
    
    /**
     * Hide notification loading
     * @param {string} id - Loading identifier
     */
    hideNotification(id) {
        // Dispatch event for notification system
        window.dispatchEvent(new CustomEvent('hide-loading', {
            detail: { id }
        }));
    }
    
    /**
     * Update loading message
     * @param {string} id - Loading identifier
     * @param {string} message - New message
     */
    updateMessage(id, message) {
        const loadingInfo = this.activeLoadings.get(id);
        if (!loadingInfo) return;
        
        loadingInfo.message = message;
        
        // Update message based on type
        switch (loadingInfo.type) {
            case LoadingTypes.OVERLAY:
                if (this.overlayElement) {
                    const messageEl = this.overlayElement.querySelector('.loading-message');
                    if (messageEl) {
                        messageEl.textContent = message;
                    }
                }
                break;
                
            case LoadingTypes.INLINE:
                const inlineEl = document.querySelector(`[data-loading-id="${id}"] .loading-message`);
                if (inlineEl) {
                    inlineEl.textContent = message;
                }
                break;
                
            case LoadingTypes.BUTTON:
                const button = document.querySelector(`[data-loading-id="${id}"] span:last-child`);
                if (button) {
                    button.textContent = message;
                }
                break;
                
            case LoadingTypes.NOTIFICATION:
                // Update through notification system
                window.dispatchEvent(new CustomEvent('update-loading', {
                    detail: { id, message }
                }));
                break;
        }
    }
    
    /**
     * Update progress for overlay loading
     * @param {string} id - Loading identifier
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(id, progress) {
        const loadingInfo = this.activeLoadings.get(id);
        if (!loadingInfo || loadingInfo.type !== LoadingTypes.OVERLAY) return;
        
        if (this.overlayElement) {
            const progressBar = this.overlayElement.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
        }
    }
    
    /**
     * Hide all loading states
     */
    hideAll() {
        const ids = Array.from(this.activeLoadings.keys());
        ids.forEach(id => this.hide(id));
    }
    
    /**
     * Check if loading is active
     * @param {string} id - Loading identifier
     * @returns {boolean} - Loading state
     */
    isLoading(id) {
        return this.activeLoadings.has(id);
    }
    
    /**
     * Get active loading count
     * @returns {number} - Number of active loadings
     */
    getActiveCount() {
        return this.activeLoadings.size;
    }
    
    /**
     * Get loading info
     * @param {string} id - Loading identifier
     * @returns {Object|null} - Loading information
     */
    getLoadingInfo(id) {
        return this.activeLoadings.get(id) || null;
    }
    
    /**
     * Get all active loadings
     * @returns {Array} - Array of loading information
     */
    getAllActive() {
        return Array.from(this.activeLoadings.values());
    }
    
    /**
     * Convenience methods for common loading scenarios
     */
    
    /**
     * Show page loading
     * @param {string} message - Loading message
     * @returns {string} - Loading ID
     */
    showPageLoading(message = '페이지를 로드하는 중...') {
        const id = 'page-loading';
        this.show(id, message, LoadingTypes.OVERLAY);
        return id;
    }
    
    /**
     * Hide page loading
     */
    hidePageLoading() {
        this.hide('page-loading');
    }
    
    /**
     * Show form loading
     * @param {string} formId - Form ID
     * @param {string} message - Loading message
     * @returns {string} - Loading ID
     */
    showFormLoading(formId, message = '처리 중...') {
        const id = `form-loading-${formId}`;
        this.show(id, message, LoadingTypes.INLINE, {
            containerId: formId
        });
        return id;
    }
    
    /**
     * Hide form loading
     * @param {string} formId - Form ID
     */
    hideFormLoading(formId) {
        this.hide(`form-loading-${formId}`);
    }
    
    /**
     * Show save loading
     * @param {string} message - Loading message
     * @returns {string} - Loading ID
     */
    showSaveLoading(message = '저장 중...') {
        const id = 'save-loading';
        this.show(id, message, LoadingTypes.NOTIFICATION);
        return id;
    }
    
    /**
     * Hide save loading
     */
    hideSaveLoading() {
        this.hide('save-loading');
    }
}

// Create global instance
export const globalLoadingManager = new LoadingManager();

// Export convenience functions
export const showLoading = (id, message, type, options) => globalLoadingManager.show(id, message, type, options);
export const hideLoading = (id) => globalLoadingManager.hide(id);
export const updateLoadingMessage = (id, message) => globalLoadingManager.updateMessage(id, message);
export const updateLoadingProgress = (id, progress) => globalLoadingManager.updateProgress(id, progress);
export const showPageLoading = (message) => globalLoadingManager.showPageLoading(message);
export const hidePageLoading = () => globalLoadingManager.hidePageLoading();
export const showFormLoading = (formId, message) => globalLoadingManager.showFormLoading(formId, message);
export const hideFormLoading = (formId) => globalLoadingManager.hideFormLoading(formId);