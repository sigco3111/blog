// Global Error Handler Module

/**
 * Error types for categorization
 */
export const ErrorTypes = {
    AUTHENTICATION: 'authentication',
    FILE_SYSTEM: 'file_system',
    VALIDATION: 'validation',
    NETWORK: 'network',
    PARSING: 'parsing',
    PERMISSION: 'permission',
    UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Global Error Handler Class
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.debugMode = false;
        this.errorCallbacks = new Map();
        
        // Initialize global error handling
        this.initGlobalErrorHandling();
    }
    
    /**
     * Initialize global error handling
     */
    initGlobalErrorHandling() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: ErrorTypes.UNKNOWN,
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                severity: ErrorSeverity.HIGH
            });
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: ErrorTypes.UNKNOWN,
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                severity: ErrorSeverity.HIGH
            });
        });
        
        console.log('Global error handler initialized');
    }
    
    /**
     * Handle error with categorization and logging
     * @param {Object} errorInfo - Error information
     */
    handleError(errorInfo) {
        const processedError = this.processError(errorInfo);
        
        // Log error
        this.logError(processedError);
        
        // Execute callbacks for this error type
        this.executeCallbacks(processedError);
        
        // Show user-friendly message if needed
        if (processedError.showToUser) {
            this.showUserError(processedError);
        }
        
        // Debug logging
        if (this.debugMode) {
            console.error('Error handled:', processedError);
        }
        
        return processedError;
    }
    
    /**
     * Process and categorize error
     * @param {Object} errorInfo - Raw error information
     * @returns {Object} - Processed error
     */
    processError(errorInfo) {
        const timestamp = new Date().toISOString();
        const id = this.generateErrorId();
        
        // Determine error category and user message
        const { category, userMessage, showToUser, severity } = this.categorizeError(errorInfo);
        
        return {
            id,
            timestamp,
            type: errorInfo.type || ErrorTypes.UNKNOWN,
            category,
            message: errorInfo.message || 'Unknown error occurred',
            userMessage,
            showToUser,
            severity: errorInfo.severity || severity || ErrorSeverity.MEDIUM,
            source: errorInfo.source,
            line: errorInfo.line,
            column: errorInfo.column,
            stack: errorInfo.stack,
            context: errorInfo.context || {},
            resolved: false
        };
    }
    
    /**
     * Categorize error and determine user message
     * @param {Object} errorInfo - Error information
     * @returns {Object} - Categorization result
     */
    categorizeError(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';
        const type = errorInfo.type;
        
        // Authentication errors
        if (type === ErrorTypes.AUTHENTICATION || message.includes('auth') || message.includes('login')) {
            return {
                category: ErrorTypes.AUTHENTICATION,
                userMessage: '인증에 실패했습니다. 다시 로그인해 주세요.',
                showToUser: true,
                severity: ErrorSeverity.HIGH
            };
        }
        
        // File system errors
        if (type === ErrorTypes.FILE_SYSTEM || 
            message.includes('file') || 
            message.includes('read') || 
            message.includes('write') ||
            message.includes('permission denied')) {
            return {
                category: ErrorTypes.FILE_SYSTEM,
                userMessage: '파일 처리 중 오류가 발생했습니다. 브라우저 권한을 확인해 주세요.',
                showToUser: true,
                severity: ErrorSeverity.MEDIUM
            };
        }
        
        // Validation errors
        if (type === ErrorTypes.VALIDATION || 
            message.includes('validation') || 
            message.includes('invalid') ||
            message.includes('required')) {
            return {
                category: ErrorTypes.VALIDATION,
                userMessage: '입력한 정보가 올바르지 않습니다. 다시 확인해 주세요.',
                showToUser: true,
                severity: ErrorSeverity.LOW
            };
        }
        
        // Network errors
        if (type === ErrorTypes.NETWORK || 
            message.includes('network') || 
            message.includes('fetch') ||
            message.includes('connection')) {
            return {
                category: ErrorTypes.NETWORK,
                userMessage: '네트워크 연결을 확인해 주세요.',
                showToUser: true,
                severity: ErrorSeverity.MEDIUM
            };
        }
        
        // Parsing errors
        if (type === ErrorTypes.PARSING || 
            message.includes('parse') || 
            message.includes('yaml') ||
            message.includes('json') ||
            message.includes('syntax')) {
            return {
                category: ErrorTypes.PARSING,
                userMessage: '파일 형식이 올바르지 않습니다. 문법을 확인해 주세요.',
                showToUser: true,
                severity: ErrorSeverity.MEDIUM
            };
        }
        
        // Permission errors
        if (type === ErrorTypes.PERMISSION || 
            message.includes('permission') || 
            message.includes('access denied') ||
            message.includes('forbidden')) {
            return {
                category: ErrorTypes.PERMISSION,
                userMessage: '접근 권한이 없습니다. 관리자에게 문의하세요.',
                showToUser: true,
                severity: ErrorSeverity.HIGH
            };
        }
        
        // Default unknown error
        return {
            category: ErrorTypes.UNKNOWN,
            userMessage: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            showToUser: true,
            severity: ErrorSeverity.MEDIUM
        };
    }
    
    /**
     * Log error to internal log
     * @param {Object} error - Processed error
     */
    logError(error) {
        this.errorLog.unshift(error);
        
        // Maintain log size limit
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        // Console logging based on severity
        const logMethod = this.getLogMethod(error.severity);
        logMethod(`[${error.category.toUpperCase()}] ${error.message}`, error);
    }
    
    /**
     * Get appropriate console log method based on severity
     * @param {string} severity - Error severity
     * @returns {Function} - Console method
     */
    getLogMethod(severity) {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                return console.error;
            case ErrorSeverity.MEDIUM:
                return console.warn;
            case ErrorSeverity.LOW:
            default:
                return console.log;
        }
    }
    
    /**
     * Show user-friendly error message
     * @param {Object} error - Processed error
     */
    showUserError(error) {
        // This will be implemented with the notification system
        // For now, we'll dispatch a custom event
        window.dispatchEvent(new CustomEvent('show-error', {
            detail: {
                message: error.userMessage,
                type: error.category,
                severity: error.severity,
                id: error.id
            }
        }));
    }
    
    /**
     * Register error callback for specific error types
     * @param {string} errorType - Error type to listen for
     * @param {Function} callback - Callback function
     */
    onError(errorType, callback) {
        if (!this.errorCallbacks.has(errorType)) {
            this.errorCallbacks.set(errorType, []);
        }
        this.errorCallbacks.get(errorType).push(callback);
    }
    
    /**
     * Execute callbacks for error type
     * @param {Object} error - Processed error
     */
    executeCallbacks(error) {
        const callbacks = this.errorCallbacks.get(error.category) || [];
        callbacks.forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
    }
    
    /**
     * Create specific error types for common scenarios
     */
    
    /**
     * Create authentication error
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} - Processed error
     */
    createAuthError(message, context = {}) {
        return this.handleError({
            type: ErrorTypes.AUTHENTICATION,
            message,
            context,
            severity: ErrorSeverity.HIGH
        });
    }
    
    /**
     * Create file system error
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} - Processed error
     */
    createFileSystemError(message, context = {}) {
        return this.handleError({
            type: ErrorTypes.FILE_SYSTEM,
            message,
            context,
            severity: ErrorSeverity.MEDIUM
        });
    }
    
    /**
     * Create validation error
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} - Processed error
     */
    createValidationError(message, context = {}) {
        return this.handleError({
            type: ErrorTypes.VALIDATION,
            message,
            context,
            severity: ErrorSeverity.LOW
        });
    }
    
    /**
     * Create parsing error
     * @param {string} message - Error message
     * @param {Object} context - Additional context
     * @returns {Object} - Processed error
     */
    createParsingError(message, context = {}) {
        return this.handleError({
            type: ErrorTypes.PARSING,
            message,
            context,
            severity: ErrorSeverity.MEDIUM
        });
    }
    
    /**
     * Get error log
     * @param {number} limit - Number of errors to return
     * @returns {Array} - Error log entries
     */
    getErrorLog(limit = 50) {
        return this.errorLog.slice(0, limit);
    }
    
    /**
     * Get errors by type
     * @param {string} type - Error type
     * @returns {Array} - Filtered errors
     */
    getErrorsByType(type) {
        return this.errorLog.filter(error => error.category === type);
    }
    
    /**
     * Get unresolved errors
     * @returns {Array} - Unresolved errors
     */
    getUnresolvedErrors() {
        return this.errorLog.filter(error => !error.resolved);
    }
    
    /**
     * Mark error as resolved
     * @param {string} errorId - Error ID
     */
    resolveError(errorId) {
        const error = this.errorLog.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            error.resolvedAt = new Date().toISOString();
        }
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
    
    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Debug mode state
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Generate unique error ID
     * @returns {string} - Unique ID
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Export error log for debugging
     * @returns {string} - JSON string of error log
     */
    exportErrorLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }
    
    /**
     * Get error statistics
     * @returns {Object} - Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            resolved: this.errorLog.filter(e => e.resolved).length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.filter(e => {
                const errorTime = new Date(e.timestamp);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return errorTime > oneHourAgo;
            }).length
        };
        
        // Count by type
        this.errorLog.forEach(error => {
            stats.byType[error.category] = (stats.byType[error.category] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });
        
        return stats;
    }
}

// Create global instance
export const globalErrorHandler = new ErrorHandler();

// Export convenience functions
export const handleError = (errorInfo) => globalErrorHandler.handleError(errorInfo);
export const createAuthError = (message, context) => globalErrorHandler.createAuthError(message, context);
export const createFileSystemError = (message, context) => globalErrorHandler.createFileSystemError(message, context);
export const createValidationError = (message, context) => globalErrorHandler.createValidationError(message, context);
export const createParsingError = (message, context) => globalErrorHandler.createParsingError(message, context);