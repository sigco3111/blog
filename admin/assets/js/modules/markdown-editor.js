// Markdown Editor Module for Jekyll Admin

/**
 * MarkdownEditor class handles markdown editing with toolbar and preview
 */
export class MarkdownEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showPreview: true,
            showToolbar: true,
            syncScroll: true,
            placeholder: '마크다운으로 포스트를 작성하세요...',
            ...options
        };
        
        this.editor = null;
        this.preview = null;
        this.toolbar = null;
        this.content = '';
        
        this.init();
    }
    
    /**
     * Initialize the markdown editor
     */
    init() {
        this.createEditorStructure();
        this.setupToolbar();
        this.setupEditor();
        this.setupPreview();
        this.setupEventListeners();
        
        // Load marked.js for markdown parsing
        this.loadMarkedLibrary();
    }
    
    /**
     * Create the basic editor structure
     */
    createEditorStructure() {
        this.container.innerHTML = `
            <div class="markdown-editor">
                ${this.options.showToolbar ? this.createToolbarHTML() : ''}
                <div class="editor-container" id="editor-container">
                    <div class="editor-pane">
                        <textarea 
                            class="markdown-textarea" 
                            placeholder="${this.options.placeholder}"
                        ></textarea>
                    </div>
                    ${this.options.showPreview ? `
                        <div class="split-resizer" id="split-resizer"></div>
                        <div class="preview-pane">
                            <div class="preview-header">
                                <span class="preview-title">미리보기</span>
                                <div class="preview-controls">
                                    <button class="preview-sync-toggle" type="button" title="스크롤 동기화 토글" id="sync-toggle">
                                        🔗
                                    </button>
                                    <button class="preview-toggle" type="button" title="미리보기 토글">
                                        👁️
                                    </button>
                                </div>
                            </div>
                            <div class="preview-content"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Get references to elements
        this.editor = this.container.querySelector('.markdown-textarea');
        this.preview = this.container.querySelector('.preview-content');
        this.toolbar = this.container.querySelector('.editor-toolbar');
        this.editorContainer = this.container.querySelector('.editor-container');
        this.splitResizer = this.container.querySelector('.split-resizer');
    }
    
    /**
     * Create toolbar HTML
     */
    createToolbarHTML() {
        return `
            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="bold" title="굵게 (Ctrl+B)">
                        <strong>B</strong>
                    </button>
                    <button class="toolbar-btn" data-action="italic" title="기울임 (Ctrl+I)">
                        <em>I</em>
                    </button>
                    <button class="toolbar-btn" data-action="strikethrough" title="취소선">
                        <s>S</s>
                    </button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="heading1" title="제목 1">H1</button>
                    <button class="toolbar-btn" data-action="heading2" title="제목 2">H2</button>
                    <button class="toolbar-btn" data-action="heading3" title="제목 3">H3</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="link" title="링크 (Ctrl+K)">🔗</button>
                    <button class="toolbar-btn" data-action="image" title="이미지">🖼️</button>
                    <button class="toolbar-btn" data-action="code" title="인라인 코드">💻</button>
                    <button class="toolbar-btn" data-action="codeblock" title="코드 블록">📝</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="quote" title="인용">💬</button>
                    <button class="toolbar-btn" data-action="list" title="목록">📋</button>
                    <button class="toolbar-btn" data-action="orderedlist" title="번호 목록">🔢</button>
                    <button class="toolbar-btn" data-action="table" title="표">📊</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <div class="toolbar-group">
                    <button class="toolbar-btn" data-action="undo" title="실행 취소 (Ctrl+Z)">↶</button>
                    <button class="toolbar-btn" data-action="redo" title="다시 실행 (Ctrl+Y)">↷</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup toolbar functionality
     */
    setupToolbar() {
        if (!this.toolbar) return;
        
        this.toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('.toolbar-btn');
            if (!button) return;
            
            e.preventDefault();
            const action = button.dataset.action;
            this.executeAction(action);
        });
    }
    
    /**
     * Setup editor functionality
     */
    setupEditor() {
        if (!this.editor) return;
        
        // Handle input changes
        this.editor.addEventListener('input', () => {
            this.content = this.editor.value;
            this.updatePreview();
            this.dispatchChangeEvent();
        });
        
        // Handle keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Handle tab key for indentation
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertText('    '); // 4 spaces for indentation
            }
        });
        
        // Auto-resize textarea
        this.editor.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }
    
    /**
     * Setup preview functionality
     */
    setupPreview() {
        if (!this.preview) return;
        
        // Setup preview toggle
        const toggleBtn = this.container.querySelector('.preview-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.togglePreview();
            });
        }
        
        // Setup scroll synchronization
        if (this.options.syncScroll) {
            this.setupScrollSync();
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle window resize for responsive layout
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Setup split view resizer
        this.setupSplitResizer();
        
        // Setup sync toggle
        this.setupSyncToggle();
    }
    
    /**
     * Load marked.js library for markdown parsing
     */
    async loadMarkedLibrary() {
        if (window.marked) {
            this.updatePreview();
            return;
        }
        
        try {
            // Load marked.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js';
            script.onload = () => {
                this.updatePreview();
            };
            script.onerror = () => {
                console.warn('Failed to load marked.js, preview will show raw markdown');
                this.updatePreview();
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error loading marked.js:', error);
        }
    }
    
    /**
     * Execute toolbar action
     */
    executeAction(action) {
        const selection = this.getSelection();
        
        switch (action) {
            case 'bold':
                this.wrapSelection('**', '**');
                break;
            case 'italic':
                this.wrapSelection('*', '*');
                break;
            case 'strikethrough':
                this.wrapSelection('~~', '~~');
                break;
            case 'heading1':
                this.insertAtLineStart('# ');
                break;
            case 'heading2':
                this.insertAtLineStart('## ');
                break;
            case 'heading3':
                this.insertAtLineStart('### ');
                break;
            case 'link':
                this.insertLink();
                break;
            case 'image':
                this.insertImage();
                break;
            case 'code':
                this.wrapSelection('`', '`');
                break;
            case 'codeblock':
                this.insertCodeBlock();
                break;
            case 'quote':
                this.insertAtLineStart('> ');
                break;
            case 'list':
                this.insertAtLineStart('- ');
                break;
            case 'orderedlist':
                this.insertOrderedList();
                break;
            case 'table':
                this.insertTable();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
        }
        
        this.editor.focus();
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.executeAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeAction('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    this.executeAction('link');
                    break;
                case 'z':
                    if (e.shiftKey) {
                        e.preventDefault();
                        this.executeAction('redo');
                    } else {
                        e.preventDefault();
                        this.executeAction('undo');
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.executeAction('redo');
                    break;
            }
        }
    }
    
    /**
     * Get current selection information
     */
    getSelection() {
        return {
            start: this.editor.selectionStart,
            end: this.editor.selectionEnd,
            text: this.editor.value.substring(this.editor.selectionStart, this.editor.selectionEnd)
        };
    }
    
    /**
     * Wrap selected text with prefix and suffix
     */
    wrapSelection(prefix, suffix) {
        const selection = this.getSelection();
        const beforeText = this.editor.value.substring(0, selection.start);
        const afterText = this.editor.value.substring(selection.end);
        
        const newText = beforeText + prefix + selection.text + suffix + afterText;
        this.editor.value = newText;
        
        // Set cursor position
        const newCursorPos = selection.start + prefix.length + selection.text.length + suffix.length;
        this.editor.setSelectionRange(newCursorPos, newCursorPos);
        
        this.content = newText;
        this.updatePreview();
        this.dispatchChangeEvent();
    }
    
    /**
     * Insert text at current cursor position
     */
    insertText(text) {
        const selection = this.getSelection();
        const beforeText = this.editor.value.substring(0, selection.start);
        const afterText = this.editor.value.substring(selection.end);
        
        const newText = beforeText + text + afterText;
        this.editor.value = newText;
        
        // Set cursor position after inserted text
        const newCursorPos = selection.start + text.length;
        this.editor.setSelectionRange(newCursorPos, newCursorPos);
        
        this.content = newText;
        this.updatePreview();
        this.dispatchChangeEvent();
    }
    
    /**
     * Insert text at the beginning of current line
     */
    insertAtLineStart(prefix) {
        const selection = this.getSelection();
        const beforeCursor = this.editor.value.substring(0, selection.start);
        const afterCursor = this.editor.value.substring(selection.start);
        
        // Find the start of current line
        const lastNewline = beforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        
        const beforeLine = this.editor.value.substring(0, lineStart);
        const line = this.editor.value.substring(lineStart, selection.start);
        const afterLine = afterCursor;
        
        // Check if line already starts with prefix
        if (line.startsWith(prefix)) {
            // Remove prefix
            const newText = beforeLine + line.substring(prefix.length) + afterLine;
            this.editor.value = newText;
            this.editor.setSelectionRange(selection.start - prefix.length, selection.start - prefix.length);
        } else {
            // Add prefix
            const newText = beforeLine + prefix + line + afterLine;
            this.editor.value = newText;
            this.editor.setSelectionRange(selection.start + prefix.length, selection.start + prefix.length);
        }
        
        this.content = this.editor.value;
        this.updatePreview();
        this.dispatchChangeEvent();
    }
    
    /**
     * Insert link
     */
    insertLink() {
        const selection = this.getSelection();
        const linkText = selection.text || '링크 텍스트';
        const linkUrl = prompt('링크 URL을 입력하세요:', 'https://');
        
        if (linkUrl) {
            const linkMarkdown = `[${linkText}](${linkUrl})`;
            this.insertText(linkMarkdown);
        }
    }
    
    /**
     * Insert image
     */
    insertImage() {
        const altText = prompt('이미지 설명을 입력하세요:', '이미지');
        const imageUrl = prompt('이미지 URL을 입력하세요:', 'https://');
        
        if (imageUrl) {
            const imageMarkdown = `![${altText || '이미지'}](${imageUrl})`;
            this.insertText(imageMarkdown);
        }
    }
    
    /**
     * Insert code block
     */
    insertCodeBlock() {
        const language = prompt('프로그래밍 언어를 입력하세요 (선택사항):', '');
        const codeBlock = `\n\`\`\`${language || ''}\n코드를 입력하세요\n\`\`\`\n`;
        this.insertText(codeBlock);
    }
    
    /**
     * Insert ordered list
     */
    insertOrderedList() {
        const selection = this.getSelection();
        const beforeCursor = this.editor.value.substring(0, selection.start);
        const lastNewline = beforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const line = this.editor.value.substring(lineStart, selection.start);
        
        // Find the next number for ordered list
        const orderMatch = line.match(/^(\d+)\.\s/);
        const nextNumber = orderMatch ? parseInt(orderMatch[1]) + 1 : 1;
        
        this.insertAtLineStart(`${nextNumber}. `);
    }
    
    /**
     * Insert table
     */
    insertTable() {
        const table = `
| 헤더1 | 헤더2 | 헤더3 |
|-------|-------|-------|
| 셀1   | 셀2   | 셀3   |
| 셀4   | 셀5   | 셀6   |
`;
        this.insertText(table);
    }
    
    /**
     * Undo functionality (basic implementation)
     */
    undo() {
        document.execCommand('undo');
        this.content = this.editor.value;
        this.updatePreview();
        this.dispatchChangeEvent();
    }
    
    /**
     * Redo functionality (basic implementation)
     */
    redo() {
        document.execCommand('redo');
        this.content = this.editor.value;
        this.updatePreview();
        this.dispatchChangeEvent();
    }
    
    /**
     * Update preview content
     */
    updatePreview() {
        if (!this.preview) return;
        
        const content = this.editor.value;
        
        if (window.marked) {
            try {
                // Configure marked options
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false
                });
                
                const html = window.marked.parse(content);
                this.preview.innerHTML = html || '<p class="preview-empty">미리보기가 여기에 표시됩니다</p>';
            } catch (error) {
                console.error('Error parsing markdown:', error);
                this.preview.innerHTML = `<pre class="preview-raw">${content}</pre>`;
            }
        } else {
            // Fallback: show raw markdown
            this.preview.innerHTML = content ? 
                `<pre class="preview-raw">${content}</pre>` : 
                '<p class="preview-empty">미리보기가 여기에 표시됩니다</p>';
        }
    }
    
    /**
     * Toggle preview visibility
     */
    togglePreview() {
        const previewPane = this.container.querySelector('.preview-pane');
        const editorContainer = this.container.querySelector('.editor-container');
        
        if (previewPane) {
            previewPane.classList.toggle('preview-hidden');
            editorContainer.classList.toggle('preview-hidden');
        }
    }
    
    /**
     * Setup scroll synchronization between editor and preview
     */
    setupScrollSync() {
        if (!this.editor || !this.preview) return;
        
        let isEditorScrolling = false;
        let isPreviewScrolling = false;
        
        this.editor.addEventListener('scroll', () => {
            if (isPreviewScrolling) return;
            
            isEditorScrolling = true;
            const scrollPercentage = this.editor.scrollTop / (this.editor.scrollHeight - this.editor.clientHeight);
            const previewScrollTop = scrollPercentage * (this.preview.scrollHeight - this.preview.clientHeight);
            this.preview.scrollTop = previewScrollTop;
            
            setTimeout(() => {
                isEditorScrolling = false;
            }, 100);
        });
        
        this.preview.addEventListener('scroll', () => {
            if (isEditorScrolling) return;
            
            isPreviewScrolling = true;
            const scrollPercentage = this.preview.scrollTop / (this.preview.scrollHeight - this.preview.clientHeight);
            const editorScrollTop = scrollPercentage * (this.editor.scrollHeight - this.editor.clientHeight);
            this.editor.scrollTop = editorScrollTop;
            
            setTimeout(() => {
                isPreviewScrolling = false;
            }, 100);
        });
    }
    
    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea() {
        if (!this.editor) return;
        
        this.editor.style.height = 'auto';
        this.editor.style.height = Math.max(this.editor.scrollHeight, 300) + 'px';
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layout for mobile/desktop
        const editorContainer = this.container.querySelector('.editor-container');
        if (editorContainer && window.innerWidth <= 768) {
            editorContainer.classList.add('mobile-layout');
        } else if (editorContainer) {
            editorContainer.classList.remove('mobile-layout');
        }
    }
    
    /**
     * Dispatch change event
     */
    dispatchChangeEvent() {
        const event = new CustomEvent('markdownchange', {
            detail: {
                content: this.content,
                editor: this
            }
        });
        this.container.dispatchEvent(event);
    }
    
    /**
     * Get current content
     */
    getContent() {
        return this.content;
    }
    
    /**
     * Set content
     */
    setContent(content) {
        this.content = content;
        if (this.editor) {
            this.editor.value = content;
            this.updatePreview();
            this.autoResizeTextarea();
        }
    }
    
    /**
     * Focus the editor
     */
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
    
    /**
     * Setup split view resizer
     */
    setupSplitResizer() {
        if (!this.splitResizer || !this.editorContainer) return;
        
        let isResizing = false;
        let startX = 0;
        let startLeftWidth = 0;
        
        this.splitResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            
            const containerRect = this.editorContainer.getBoundingClientRect();
            startLeftWidth = (e.clientX - containerRect.left) / containerRect.width * 100;
            
            this.splitResizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerRect = this.editorContainer.getBoundingClientRect();
            const currentX = e.clientX - containerRect.left;
            const percentage = Math.max(20, Math.min(80, (currentX / containerRect.width) * 100));
            
            this.editorContainer.style.setProperty('--editor-width', `${percentage}%`);
            this.editorContainer.style.setProperty('--preview-width', `${100 - percentage}%`);
            this.editorContainer.classList.add('custom-split');
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            
            isResizing = false;
            this.splitResizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }
    
    /**
     * Setup sync toggle functionality
     */
    setupSyncToggle() {
        const syncToggle = this.container.querySelector('#sync-toggle');
        if (!syncToggle) return;
        
        this.syncEnabled = this.options.syncScroll;
        this.updateSyncToggleState(syncToggle);
        
        syncToggle.addEventListener('click', () => {
            this.syncEnabled = !this.syncEnabled;
            this.updateSyncToggleState(syncToggle);
            
            // Show feedback
            this.showSyncFeedback(this.syncEnabled);
        });
    }
    
    /**
     * Update sync toggle button state
     * @param {HTMLElement} syncToggle - Sync toggle button
     */
    updateSyncToggleState(syncToggle) {
        if (!syncToggle) return;
        
        if (this.syncEnabled) {
            syncToggle.textContent = '🔗';
            syncToggle.title = '스크롤 동기화 비활성화';
            syncToggle.classList.add('sync-enabled');
        } else {
            syncToggle.textContent = '🔗';
            syncToggle.title = '스크롤 동기화 활성화';
            syncToggle.classList.remove('sync-enabled');
            syncToggle.style.opacity = '0.5';
        }
    }
    
    /**
     * Show sync feedback
     * @param {boolean} enabled - Whether sync is enabled
     */
    showSyncFeedback(enabled) {
        const message = enabled ? '스크롤 동기화가 활성화되었습니다' : '스크롤 동기화가 비활성화되었습니다';
        
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = 'sync-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.9rem;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        this.editorContainer.style.position = 'relative';
        this.editorContainer.appendChild(feedback);
        
        // Show and hide feedback
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }
    
    /**
     * Setup scroll synchronization between editor and preview (enhanced)
     */
    setupScrollSync() {
        if (!this.editor || !this.preview) return;
        
        let isEditorScrolling = false;
        let isPreviewScrolling = false;
        let syncTimeout;
        
        // Enhanced scroll synchronization with line-based mapping
        this.editor.addEventListener('scroll', () => {
            if (isPreviewScrolling || !this.syncEnabled) return;
            
            clearTimeout(syncTimeout);
            isEditorScrolling = true;
            
            // Calculate scroll position based on content
            const editorScrollTop = this.editor.scrollTop;
            const editorScrollHeight = this.editor.scrollHeight - this.editor.clientHeight;
            const scrollPercentage = editorScrollHeight > 0 ? editorScrollTop / editorScrollHeight : 0;
            
            // Apply to preview with smooth scrolling
            const previewScrollHeight = this.preview.scrollHeight - this.preview.clientHeight;
            const targetScrollTop = scrollPercentage * previewScrollHeight;
            
            this.preview.scrollTo({
                top: targetScrollTop,
                behavior: 'auto' // Use 'auto' for better performance during typing
            });
            
            syncTimeout = setTimeout(() => {
                isEditorScrolling = false;
            }, 150);
        });
        
        this.preview.addEventListener('scroll', () => {
            if (isEditorScrolling || !this.syncEnabled) return;
            
            clearTimeout(syncTimeout);
            isPreviewScrolling = true;
            
            // Calculate scroll position
            const previewScrollTop = this.preview.scrollTop;
            const previewScrollHeight = this.preview.scrollHeight - this.preview.clientHeight;
            const scrollPercentage = previewScrollHeight > 0 ? previewScrollTop / previewScrollHeight : 0;
            
            // Apply to editor
            const editorScrollHeight = this.editor.scrollHeight - this.editor.clientHeight;
            const targetScrollTop = scrollPercentage * editorScrollHeight;
            
            this.editor.scrollTop = targetScrollTop;
            
            syncTimeout = setTimeout(() => {
                isPreviewScrolling = false;
            }, 150);
        });
    }
    
    /**
     * Enhanced handle window resize with split view support
     */
    handleResize() {
        // Adjust layout for mobile/desktop
        if (this.editorContainer && window.innerWidth <= 768) {
            this.editorContainer.classList.add('mobile-layout');
            // Reset custom split on mobile
            this.editorContainer.classList.remove('custom-split');
            this.editorContainer.style.removeProperty('--editor-width');
            this.editorContainer.style.removeProperty('--preview-width');
        } else if (this.editorContainer) {
            this.editorContainer.classList.remove('mobile-layout');
        }
        
        // Update scroll sync after resize
        if (this.syncEnabled) {
            setTimeout(() => {
                this.syncScrollPositions();
            }, 100);
        }
    }
    
    /**
     * Manually sync scroll positions
     */
    syncScrollPositions() {
        if (!this.editor || !this.preview || !this.syncEnabled) return;
        
        const editorScrollTop = this.editor.scrollTop;
        const editorScrollHeight = this.editor.scrollHeight - this.editor.clientHeight;
        const scrollPercentage = editorScrollHeight > 0 ? editorScrollTop / editorScrollHeight : 0;
        
        const previewScrollHeight = this.preview.scrollHeight - this.preview.clientHeight;
        const targetScrollTop = scrollPercentage * previewScrollHeight;
        
        this.preview.scrollTop = targetScrollTop;
    }
    
    /**
     * Reset split view to default
     */
    resetSplitView() {
        if (this.editorContainer) {
            this.editorContainer.classList.remove('custom-split');
            this.editorContainer.style.removeProperty('--editor-width');
            this.editorContainer.style.removeProperty('--preview-width');
        }
    }
    
    /**
     * Destroy the editor
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}