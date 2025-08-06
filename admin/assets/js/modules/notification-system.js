// Notification System Module

/**
 * Notification types
 */
export const NotificationTypes = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading'
};

/**
 * Notification positions
 */
export const NotificationPositions = {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    TOP_CENTER: 'top-center',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_CENTER: 'bottom-center'
};

/**
 * Notification System Class
 */
export class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.container = null;
        this.position = NotificationPositions.TOP_RIGHT;
        this.defaultDuration = 5000;
        this.maxNotifications = 5;
        
        this.init();
    }
    
    /**
     * Initialize notification system
     */
    init() {
        this.createContainer();
        this.setupEventListeners();
        console.log('Notification system initialized');
    }
    
    /**
     * Create notification container
     */
    createContainer() {
        // Remove existing container if any
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = `notification-container ${this.position}`;
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', '알림');
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for global error events
        window.addEventListener('show-error', (event) => {
            this.showError(event.detail.message, {
                id: event.detail.id,
                duration: 8000
            });
        });
        
        // Listen for success events
        window.addEventListener('show-success', (event) => {
            this.showSuccess(event.detail.message, event.detail.options);
        });
        
        // Listen for loading events
        window.addEventListener('show-loading', (event) => {
            this.showLoading(event.detail.message, event.detail.options);
        });
        
        // Listen for hide loading events
        window.addEventListener('hide-loading', (event) => {
            this.hideLoading(event.detail.id);
        });
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    show(message, type = NotificationTypes.INFO, options = {}) {
        const id = options.id || this.generateId();
        const duration = options.duration !== undefined ? options.duration : this.defaultDuration;
        const persistent = options.persistent || false;
        const actions = options.actions || [];
        
        // Remove existing notification with same ID
        if (this.notifications.has(id)) {
            this.hide(id);
        }
        
        // Limit number of notifications
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
        
        const notification = this.createNotificationElement(id, message, type, {
            persistent,
            actions,
            ...options
        });
        
        // Store notification reference
        this.notifications.set(id, {
            element: notification,
            type,
            message,
            timestamp: Date.now(),
            persistent
        });
        
        // Add to container with animation
        this.container.appendChild(notification);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('notification-show');
        });
        
        // Auto-hide if not persistent and duration is set
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        return id;
    }
    
    /**
     * Create notification element
     * @param {string} id - Notification ID
     * @param {string} message - Message text
     * @param {string} type - Notification type
     * @param {Object} options - Additional options
     * @returns {HTMLElement} - Notification element
     */
    createNotificationElement(id, message, type, options = {}) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', type === NotificationTypes.ERROR ? 'assertive' : 'polite');
        
        // Create notification content
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        // Add icon
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.innerHTML = this.getIconForType(type);
        content.appendChild(icon);
        
        // Add message
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        // Add loading spinner if loading type
        if (type === NotificationTypes.LOADING) {
            const spinner = document.createElement('div');
            spinner.className = 'notification-spinner';
            spinner.innerHTML = '<div class="spinner-small"></div>';
            content.appendChild(spinner);
        }
        
        notification.appendChild(content);
        
        // Add actions if provided
        if (options.actions && options.actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'notification-actions';
            
            options.actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `btn btn-sm ${action.class || 'btn-outline'}`;
                button.textContent = action.text;
                button.addEventListener('click', () => {
                    if (action.handler) {
                        action.handler();
                    }
                    if (action.dismiss !== false) {
                        this.hide(id);
                    }
                });
                actionsEl.appendChild(button);
            });
            
            notification.appendChild(actionsEl);
        }
        
        // Add close button if not persistent or if explicitly requested
        if (!options.persistent || options.showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.setAttribute('aria-label', '알림 닫기');
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', () => this.hide(id));
            notification.appendChild(closeBtn);
        }
        
        // Add click to dismiss (except for loading notifications)
        if (type !== NotificationTypes.LOADING && !options.persistent) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                // Don't dismiss if clicking on action buttons
                if (!e.target.closest('.notification-actions') && !e.target.closest('.notification-close')) {
                    this.hide(id);
                }
            });
        }
        
        return notification;
    }
    
    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} - Icon HTML
     */
    getIconForType(type) {
        const icons = {
            [NotificationTypes.SUCCESS]: '✅',
            [NotificationTypes.ERROR]: '❌',
            [NotificationTypes.WARNING]: '⚠️',
            [NotificationTypes.INFO]: 'ℹ️',
            [NotificationTypes.LOADING]: '⏳'
        };
        
        return icons[type] || icons[NotificationTypes.INFO];
    }
    
    /**
     * Hide notification
     * @param {string} id - Notification ID
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const element = notification.element;
        
        // Add exit animation
        element.classList.add('notification-hide');
        
        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }
    
    /**
     * Hide all notifications
     */
    hideAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }
    
    /**
     * Hide notifications by type
     * @param {string} type - Notification type
     */
    hideByType(type) {
        const ids = Array.from(this.notifications.entries())
            .filter(([id, notification]) => notification.type === type)
            .map(([id]) => id);
        
        ids.forEach(id => this.hide(id));
    }
    
    /**
     * Convenience methods for different notification types
     */
    
    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showSuccess(message, options = {}) {
        return this.show(message, NotificationTypes.SUCCESS, {
            duration: 4000,
            ...options
        });
    }
    
    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showError(message, options = {}) {
        return this.show(message, NotificationTypes.ERROR, {
            duration: 8000,
            ...options
        });
    }
    
    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showWarning(message, options = {}) {
        return this.show(message, NotificationTypes.WARNING, {
            duration: 6000,
            ...options
        });
    }
    
    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showInfo(message, options = {}) {
        return this.show(message, NotificationTypes.INFO, options);
    }
    
    /**
     * Show loading notification
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showLoading(message = '처리 중...', options = {}) {
        return this.show(message, NotificationTypes.LOADING, {
            persistent: true,
            duration: 0,
            ...options
        });
    }
    
    /**
     * Hide loading notification
     * @param {string} id - Notification ID (optional, hides all loading if not provided)
     */
    hideLoading(id = null) {
        if (id) {
            this.hide(id);
        } else {
            this.hideByType(NotificationTypes.LOADING);
        }
    }
    
    /**
     * Show confirmation dialog as notification
     * @param {string} message - Confirmation message
     * @param {Object} options - Options with confirm/cancel handlers
     * @returns {string} - Notification ID
     */
    showConfirmation(message, options = {}) {
        const actions = [
            {
                text: options.confirmText || '확인',
                class: 'btn-primary',
                handler: options.onConfirm || (() => {}),
                dismiss: true
            },
            {
                text: options.cancelText || '취소',
                class: 'btn-outline',
                handler: options.onCancel || (() => {}),
                dismiss: true
            }
        ];
        
        return this.show(message, NotificationTypes.WARNING, {
            persistent: true,
            actions,
            showClose: false,
            ...options
        });
    }
    
    /**
     * Show progress notification
     * @param {string} message - Progress message
     * @param {number} progress - Progress percentage (0-100)
     * @param {Object} options - Additional options
     * @returns {string} - Notification ID
     */
    showProgress(message, progress = 0, options = {}) {
        const id = options.id || this.generateId();
        
        // Create or update progress notification
        if (this.notifications.has(id)) {
            this.updateProgress(id, message, progress);
        } else {
            const progressOptions = {
                ...options,
                id,
                persistent: true,
                duration: 0,
                progress
            };
            
            this.show(message, NotificationTypes.INFO, progressOptions);
        }
        
        return id;
    }
    
    /**
     * Update progress notification
     * @param {string} id - Notification ID
     * @param {string} message - Updated message
     * @param {number} progress - Progress percentage
     */
    updateProgress(id, message, progress) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const element = notification.element;
        const messageEl = element.querySelector('.notification-message');
        const progressBar = element.querySelector('.progress-bar');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }
    
    /**
     * Set notification position
     * @param {string} position - Notification position
     */
    setPosition(position) {
        if (Object.values(NotificationPositions).includes(position)) {
            this.position = position;
            if (this.container) {
                this.container.className = `notification-container ${position}`;
            }
        }
    }
    
    /**
     * Set default duration
     * @param {number} duration - Duration in milliseconds
     */
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }
    
    /**
     * Generate unique ID
     * @returns {string} - Unique ID
     */
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get active notifications count
     * @returns {number} - Number of active notifications
     */
    getActiveCount() {
        return this.notifications.size;
    }
    
    /**
     * Get notifications by type
     * @param {string} type - Notification type
     * @returns {Array} - Notifications of specified type
     */
    getByType(type) {
        return Array.from(this.notifications.entries())
            .filter(([id, notification]) => notification.type === type)
            .map(([id, notification]) => ({ id, ...notification }));
    }
}

// Create global instance
export const globalNotificationSystem = new NotificationSystem();

// Export convenience functions
export const showSuccess = (message, options) => globalNotificationSystem.showSuccess(message, options);
export const showError = (message, options) => globalNotificationSystem.showError(message, options);
export const showWarning = (message, options) => globalNotificationSystem.showWarning(message, options);
export const showInfo = (message, options) => globalNotificationSystem.showInfo(message, options);
export const showLoading = (message, options) => globalNotificationSystem.showLoading(message, options);
export const hideLoading = (id) => globalNotificationSystem.hideLoading(id);
export const showConfirmation = (message, options) => globalNotificationSystem.showConfirmation(message, options);
export const showProgress = (message, progress, options) => globalNotificationSystem.showProgress(message, progress, options);