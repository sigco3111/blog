// Utility Functions Module

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format date to Jekyll format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatJekyllDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0900`;
}

/**
 * Generate Jekyll filename from title and date
 * @param {string} title - Post title
 * @param {Date} date - Post date
 * @returns {string} - Jekyll filename
 */
export function generateJekyllFilename(title, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Convert title to URL-friendly slug
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
    
    return `${year}-${month}-${day}-${slug}.markdown`;
}

/**
 * Parse Jekyll front matter
 * @param {string} content - File content with front matter
 * @returns {Object} - Parsed front matter and content
 */
export function parseJekyllFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
        return {
            frontMatter: {},
            content: content
        };
    }
    
    const frontMatterYaml = match[1];
    const postContent = match[2];
    
    try {
        // Simple YAML parser for basic Jekyll front matter
        const frontMatter = parseSimpleYaml(frontMatterYaml);
        return {
            frontMatter,
            content: postContent
        };
    } catch (error) {
        console.error('Error parsing front matter:', error);
        return {
            frontMatter: {},
            content: content
        };
    }
}

/**
 * Generate Jekyll front matter
 * @param {Object} data - Front matter data
 * @returns {string} - YAML front matter string
 */
export function generateJekyllFrontMatter(data) {
    let yaml = '---\n';
    
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
            yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
        } else if (typeof value === 'string') {
            yaml += `${key}: "${value}"\n`;
        } else {
            yaml += `${key}: ${value}\n`;
        }
    }
    
    yaml += '---\n';
    return yaml;
}

/**
 * Simple YAML parser for Jekyll front matter
 * @param {string} yaml - YAML string
 * @returns {Object} - Parsed object
 */
function parseSimpleYaml(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        // Parse arrays
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1);
            value = arrayContent.split(',').map(item => 
                item.trim().replace(/^["']|["']$/g, '')
            );
        }
        
        // Parse booleans and numbers
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value) && !isNaN(parseFloat(value))) {
            value = parseFloat(value);
        }
        
        result[key] = value;
    }
    
    return result;
}

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Check if File System Access API is supported
 * @returns {boolean} - Support status
 */
export function supportsFileSystemAccess() {
    return 'showDirectoryPicker' in window;
}

/**
 * Download text as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
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
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} - File content
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}