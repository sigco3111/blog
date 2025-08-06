import { createFileSystemError, createParsingError, createValidationError } from './error-handler.js';
import { showLoading, hideLoading, showSuccess, showError } from './notification-system.js';

/**
 * ConfigManager - Jekyll 사이트 설정 관리 클래스
 * _config.yml 파일의 파싱, 유효성 검사, 업데이트 기능을 제공합니다.
 */
class ConfigManager {
    constructor() {
        this.config = {};
        this.originalConfig = '';
        this.configPath = '_config.yml';
        
        // 필수 필드 정의
        this.requiredFields = ['title', 'email', 'description'];
        
        // 기본 설정 템플릿
        this.defaultConfig = {
            title: 'My Jekyll Site',
            email: 'your-email@example.com',
            description: 'A Jekyll site',
            baseurl: '',
            url: '',
            theme: 'minima',
            plugins: ['jekyll-feed']
        };
    }

    /**
     * _config.yml 파일을 로드하고 파싱합니다.
     * @returns {Promise<Object>} 파싱된 설정 객체
     */
    async loadConfig() {
        const loadingId = showLoading('설정 파일을 로드하는 중...');
        
        try {
            // 실제 환경에서는 File System Access API 또는 fetch를 사용
            // 현재는 기본 설정으로 시뮬레이션
            const response = await fetch('/_config.yml');
            if (response.ok) {
                this.originalConfig = await response.text();
                this.config = this.parseYAML(this.originalConfig);
            } else {
                // 파일을 읽을 수 없는 경우 기본 설정 사용
                createFileSystemError('Config file not found, using default configuration', {
                    file: '_config.yml',
                    operation: 'loadConfig'
                });
                this.config = { ...this.defaultConfig };
                this.originalConfig = this.stringifyYAML(this.config);
            }
            
            hideLoading(loadingId);
            return this.config;
        } catch (error) {
            hideLoading(loadingId);
            createFileSystemError(`Config loading failed: ${error.message}`, {
                file: '_config.yml',
                operation: 'loadConfig'
            });
            
            // 오류 발생 시 기본 설정 사용
            this.config = { ...this.defaultConfig };
            this.originalConfig = this.stringifyYAML(this.config);
            return this.config;
        }
    }

    /**
     * 설정을 업데이트하고 저장합니다.
     * @param {Object} newConfig - 새로운 설정 객체
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async updateConfig(newConfig) {
        const loadingId = showLoading('설정을 저장하는 중...');
        
        try {
            // 유효성 검사
            const validation = this.validateConfig(newConfig);
            if (!validation.isValid) {
                hideLoading(loadingId);
                createValidationError(`Config validation failed: ${validation.errors.join(', ')}`, {
                    errors: validation.errors,
                    config: newConfig
                });
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // 설정 업데이트
            this.config = { ...this.config, ...newConfig };
            
            // YAML 문자열로 변환
            const yamlContent = this.stringifyYAML(this.config);
            
            // 파일 저장 (실제 환경에서는 File System Access API 사용)
            const success = await this.saveConfigFile(yamlContent);
            
            if (success) {
                this.originalConfig = yamlContent;
                hideLoading(loadingId);
                showSuccess('설정이 성공적으로 저장되었습니다.');
                return true;
            } else {
                hideLoading(loadingId);
                createFileSystemError('Failed to save config file', {
                    file: '_config.yml',
                    operation: 'updateConfig'
                });
                throw new Error('Failed to save config file');
            }
        } catch (error) {
            hideLoading(loadingId);
            if (error.message.includes('Validation failed')) {
                // Validation errors are already handled above
                throw error;
            } else {
                createFileSystemError(`Config update failed: ${error.message}`, {
                    file: '_config.yml',
                    operation: 'updateConfig',
                    config: newConfig
                });
                throw error;
            }
        }
    }

    /**
     * 설정 객체의 유효성을 검사합니다.
     * @param {Object} config - 검사할 설정 객체
     * @returns {Object} 유효성 검사 결과
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        
        // 필수 필드 검사
        for (const field of this.requiredFields) {
            if (!config[field] || config[field].trim() === '') {
                const error = `필수 필드 '${this.getFieldDisplayName(field)}'이(가) 비어있습니다.`;
                errors.push(error);
                createValidationError(error, { field, value: config[field] });
            }
        }
        
        // 제목 길이 검사
        if (config.title && config.title.length > 100) {
            warnings.push('사이트 제목이 너무 깁니다. 100자 이하로 작성하는 것을 권장합니다.');
        }
        
        // 이메일 형식 검사
        if (config.email) {
            if (!this.isValidEmail(config.email)) {
                errors.push('이메일 형식이 올바르지 않습니다.');
            }
        }
        
        // URL 형식 검사
        if (config.url && config.url !== '') {
            if (!this.isValidUrl(config.url)) {
                errors.push('사이트 URL 형식이 올바르지 않습니다. (예: https://username.github.io)');
            } else if (!config.url.startsWith('https://')) {
                warnings.push('보안을 위해 HTTPS URL 사용을 권장합니다.');
            }
        }
        
        // baseurl 형식 검사
        if (config.baseurl && config.baseurl !== '') {
            if (!config.baseurl.startsWith('/')) {
                errors.push('Base URL은 "/"로 시작해야 합니다. (예: /blog)');
            }
            if (config.baseurl.endsWith('/')) {
                warnings.push('Base URL은 "/"로 끝나지 않는 것을 권장합니다.');
            }
            if (config.baseurl.includes(' ')) {
                errors.push('Base URL에는 공백이 포함될 수 없습니다.');
            }
        }
        
        // 설명 길이 검사
        if (config.description && config.description.length > 500) {
            warnings.push('사이트 설명이 너무 깁니다. 500자 이하로 작성하는 것을 권장합니다.');
        }
        
        // 소셜 미디어 사용자명 검사
        if (config.twitter_username && !this.isValidUsername(config.twitter_username)) {
            errors.push('Twitter 사용자명에 유효하지 않은 문자가 포함되어 있습니다.');
        }
        
        if (config.github_username && !this.isValidUsername(config.github_username)) {
            errors.push('GitHub 사용자명에 유효하지 않은 문자가 포함되어 있습니다.');
        }
        
        // 테마 검사
        const validThemes = ['minima', 'jekyll-theme-cayman', 'jekyll-theme-minimal', 'jekyll-theme-architect'];
        if (config.theme && !validThemes.includes(config.theme)) {
            warnings.push(`'${config.theme}' 테마는 일반적이지 않습니다. 호환성을 확인해주세요.`);
        }
        
        // plugins 배열 검사
        if (config.plugins) {
            if (!Array.isArray(config.plugins)) {
                errors.push('플러그인 설정이 올바르지 않습니다.');
            } else {
                // 플러그인 이름 유효성 검사
                const invalidPlugins = config.plugins.filter(plugin => 
                    !plugin || typeof plugin !== 'string' || plugin.trim() === ''
                );
                if (invalidPlugins.length > 0) {
                    errors.push('일부 플러그인 이름이 유효하지 않습니다.');
                }
                
                // 중복 플러그인 검사
                const uniquePlugins = [...new Set(config.plugins)];
                if (uniquePlugins.length !== config.plugins.length) {
                    warnings.push('중복된 플러그인이 있습니다.');
                }
                
                // 권장 플러그인 확인
                const recommendedPlugins = ['jekyll-feed', 'jekyll-seo-tag'];
                const missingRecommended = recommendedPlugins.filter(plugin => 
                    !config.plugins.includes(plugin)
                );
                if (missingRecommended.length > 0) {
                    warnings.push(`권장 플러그인이 누락되었습니다: ${missingRecommended.join(', ')}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            hasWarnings: warnings.length > 0
        };
    }

    /**
     * 필드의 표시 이름을 반환합니다.
     * @param {string} fieldName - 필드명
     * @returns {string} 표시 이름
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            'title': '사이트 제목',
            'email': '이메일',
            'description': '사이트 설명',
            'url': '사이트 URL',
            'baseurl': 'Base URL'
        };
        return displayNames[fieldName] || fieldName;
    }

    /**
     * 사용자명 유효성 검사
     * @param {string} username - 검사할 사용자명
     * @returns {boolean} 유효성 여부
     */
    isValidUsername(username) {
        // 영문자, 숫자, 하이픈, 언더스코어만 허용
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        return usernameRegex.test(username) && username.length <= 39;
    }

    /**
     * YAML 문법 유효성 검사
     * @param {string} yamlString - 검사할 YAML 문자열
     * @returns {Object} 검사 결과
     */
    validateYAMLSyntax(yamlString) {
        const errors = [];
        const lines = yamlString.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            
            // 빈 줄이나 주석 건너뛰기
            if (line.trim() === '' || line.trim().startsWith('#')) {
                continue;
            }
            
            // 기본적인 YAML 문법 검사
            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                
                // 키에 특수문자 검사
                if (key.includes(' ') && !key.startsWith('"') && !key.endsWith('"')) {
                    errors.push(`Line ${lineNumber}: 키에 공백이 포함된 경우 따옴표로 감싸야 합니다.`);
                }
                
                // 값의 따옴표 검사
                if (value.startsWith('"') && !value.endsWith('"')) {
                    errors.push(`Line ${lineNumber}: 따옴표가 올바르게 닫히지 않았습니다.`);
                }
            }
            
            // 들여쓰기 검사 (기본적인)
            if (line.startsWith(' ')) {
                const spaces = line.match(/^ */)[0].length;
                if (spaces % 2 !== 0) {
                    errors.push(`Line ${lineNumber}: 들여쓰기는 2의 배수여야 합니다.`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 간단한 YAML 파싱 (기본적인 key-value 쌍과 배열 지원)
     * @param {string} yamlString - YAML 문자열
     * @returns {Object} 파싱된 객체
     */
    parseYAML(yamlString) {
        const config = {};
        const lines = yamlString.split('\n');
        let currentKey = null;
        let inArray = false;
        let arrayItems = [];
        
        for (let line of lines) {
            line = line.trim();
            
            // 주석이나 빈 줄 건너뛰기
            if (line.startsWith('#') || line === '') {
                continue;
            }
            
            // 배열 항목 처리
            if (line.startsWith('- ')) {
                if (inArray && currentKey) {
                    arrayItems.push(line.substring(2).trim());
                }
                continue;
            }
            
            // 이전 배열 완료 처리
            if (inArray && currentKey && !line.startsWith('- ')) {
                config[currentKey] = arrayItems;
                inArray = false;
                arrayItems = [];
                currentKey = null;
            }
            
            // key-value 쌍 처리
            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // 멀티라인 문자열 처리 (>- 형태)
                if (value === '>-') {
                    currentKey = key;
                    config[key] = '';
                    continue;
                }
                
                // 배열 시작 감지
                if (value === '') {
                    currentKey = key;
                    inArray = true;
                    arrayItems = [];
                    continue;
                }
                
                // 값 타입 변환
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = Number(value);
                else if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                
                config[key] = value;
            }
        }
        
        // 마지막 배열 처리
        if (inArray && currentKey) {
            config[currentKey] = arrayItems;
        }
        
        return config;
    }

    /**
     * 객체를 YAML 문자열로 변환합니다.
     * @param {Object} obj - 변환할 객체
     * @returns {string} YAML 문자열
     */
    stringifyYAML(obj) {
        let yaml = '# Site settings\n';
        yaml += '# These are used to personalize your site.\n\n';
        
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                yaml += `${key}:\n`;
                for (const item of value) {
                    yaml += `  - ${item}\n`;
                }
            } else if (typeof value === 'string' && value.includes('\n')) {
                yaml += `${key}: >-\n`;
                const lines = value.split('\n');
                for (const line of lines) {
                    yaml += `  ${line}\n`;
                }
            } else if (typeof value === 'string') {
                yaml += `${key}: "${value}"\n`;
            } else {
                yaml += `${key}: ${value}\n`;
            }
        }
        
        return yaml;
    }

    /**
     * 설정 파일을 저장합니다.
     * @param {string} content - 저장할 내용
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveConfigFile(content) {
        try {
            // File System Access API 지원 확인
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: '_config.yml',
                    types: [{
                        description: 'YAML files',
                        accept: { 'text/yaml': ['.yml', '.yaml'] }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                
                return true;
            } else {
                // 폴백: 다운로드 방식
                this.downloadFile(content, '_config.yml', 'text/yaml');
                return true;
            }
        } catch (error) {
            console.error('Failed to save config file:', error);
            return false;
        }
    }

    /**
     * 파일을 다운로드합니다 (폴백 방식).
     * @param {string} content - 파일 내용
     * @param {string} filename - 파일명
     * @param {string} mimeType - MIME 타입
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 이메일 형식 유효성 검사
     * @param {string} email - 검사할 이메일
     * @returns {boolean} 유효성 여부
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * URL 형식 유효성 검사
     * @param {string} url - 검사할 URL
     * @returns {boolean} 유효성 여부
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 현재 설정을 반환합니다.
     * @returns {Object} 현재 설정 객체
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 설정이 변경되었는지 확인합니다.
     * @returns {boolean} 변경 여부
     */
    hasChanges() {
        const currentYaml = this.stringifyYAML(this.config);
        return currentYaml !== this.originalConfig;
    }

    /**
     * 변경사항을 되돌립니다.
     */
    revertChanges() {
        if (this.originalConfig) {
            this.config = this.parseYAML(this.originalConfig);
        }
    }
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else if (typeof window !== 'undefined') {
    window.ConfigManager = ConfigManager;
}