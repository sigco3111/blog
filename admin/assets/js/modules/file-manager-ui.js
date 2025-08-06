/**
 * FileManagerUI - 파일 업로드/다운로드 UI 컴포넌트
 * FileSystemManager와 연동하여 파일 관리 인터페이스를 제공합니다.
 */
export class FileManagerUI {
    constructor(fileSystemManager) {
        this.fileSystemManager = fileSystemManager;
        this.currentDirectory = 'posts';
        this.uploadQueue = [];
        this.downloadQueue = [];
        this.isProcessing = false;
        
        // UI 상태
        this.isVisible = false;
        this.container = null;
        
        // 이벤트 리스너
        this.eventListeners = new Map();
        
        // 지원되는 파일 타입
        this.supportedTypes = {
            markdown: ['.md', '.markdown'],
            yaml: ['.yml', '.yaml'],
            text: ['.txt'],
            all: ['.md', '.markdown', '.yml', '.yaml', '.txt']
        };
    }

    /**
     * 파일 관리 UI 초기화
     * @param {HTMLElement} container - 컨테이너 엘리먼트
     */
    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.updateStatus();
    }

    /**
     * UI 렌더링
     */
    render() {
        if (!this.container) return;

        const status = this.fileSystemManager.getStatus();
        
        this.container.innerHTML = `
            <div class="file-manager">
                <!-- 파일 시스템 상태 표시 -->
                <div class="file-system-status">
                    <div class="status-header">
                        <h3 class="status-title">파일 시스템 상태</h3>
                        <div class="status-indicator ${status.mode}">
                            <span class="status-dot"></span>
                            <span class="status-text">${this.getStatusText(status)}</span>
                        </div>
                    </div>
                    
                    ${!status.hasRootDirectory && status.supportsFileSystemAccess ? `
                        <div class="status-actions">
                            <button class="btn btn-primary" id="select-directory-btn">
                                📁 작업 디렉토리 선택
                            </button>
                            <p class="status-description">
                                Jekyll 프로젝트 루트 디렉토리를 선택하면 파일을 직접 편집할 수 있습니다.
                            </p>
                        </div>
                    ` : ''}
                    
                    ${!status.supportsFileSystemAccess ? `
                        <div class="status-warning">
                            <div class="warning-icon">⚠️</div>
                            <div class="warning-content">
                                <p><strong>제한된 파일 접근</strong></p>
                                <p>현재 브라우저는 File System Access API를 지원하지 않습니다. 파일 업로드/다운로드 방식을 사용합니다.</p>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 파일 업로드 영역 -->
                <div class="file-upload-section">
                    <h4 class="section-title">파일 업로드</h4>
                    
                    <div class="upload-area" id="upload-area">
                        <div class="upload-content">
                            <div class="upload-icon">📤</div>
                            <p class="upload-text">
                                <strong>파일을 드래그하여 업로드하거나 클릭하여 선택하세요</strong>
                            </p>
                            <p class="upload-description">
                                지원 형식: Markdown (.md, .markdown), YAML (.yml, .yaml), Text (.txt)
                            </p>
                            <input type="file" id="file-input" multiple accept=".md,.markdown,.yml,.yaml,.txt" style="display: none;">
                            <button class="btn btn-outline" id="select-files-btn">파일 선택</button>
                        </div>
                    </div>
                    
                    <!-- 업로드 큐 -->
                    <div class="upload-queue" id="upload-queue" style="display: none;">
                        <h5 class="queue-title">업로드 대기열</h5>
                        <div class="queue-list" id="upload-queue-list"></div>
                        <div class="queue-actions">
                            <button class="btn btn-primary" id="start-upload-btn">업로드 시작</button>
                            <button class="btn btn-outline" id="clear-upload-queue-btn">대기열 비우기</button>
                        </div>
                    </div>
                </div>

                <!-- 파일 다운로드 영역 -->
                <div class="file-download-section">
                    <h4 class="section-title">파일 다운로드</h4>
                    
                    <div class="download-options">
                        <div class="option-group">
                            <label class="option-label">
                                <input type="radio" name="download-type" value="current" checked>
                                <span class="option-text">현재 편집 중인 파일</span>
                            </label>
                            <label class="option-label">
                                <input type="radio" name="download-type" value="all-posts">
                                <span class="option-text">모든 포스트 파일</span>
                            </label>
                            <label class="option-label">
                                <input type="radio" name="download-type" value="config">
                                <span class="option-text">설정 파일 (_config.yml)</span>
                            </label>
                        </div>
                        
                        <div class="download-actions">
                            <button class="btn btn-secondary" id="download-selected-btn">선택한 파일 다운로드</button>
                            <button class="btn btn-outline" id="download-all-btn">전체 백업 다운로드</button>
                        </div>
                    </div>
                    
                    <!-- 다운로드 큐 -->
                    <div class="download-queue" id="download-queue" style="display: none;">
                        <h5 class="queue-title">다운로드 진행 상황</h5>
                        <div class="queue-list" id="download-queue-list"></div>
                    </div>
                </div>

                <!-- 파일 목록 -->
                <div class="file-list-section">
                    <div class="section-header">
                        <h4 class="section-title">파일 목록</h4>
                        <div class="section-actions">
                            <select class="form-select" id="directory-select">
                                <option value="posts">_posts</option>
                                <option value="root">루트 디렉토리</option>
                            </select>
                            <button class="btn btn-outline btn-sm" id="refresh-files-btn">새로고침</button>
                        </div>
                    </div>
                    
                    <div class="file-list" id="file-list">
                        <div class="file-list-loading">
                            <div class="spinner-small"></div>
                            <span>파일 목록을 불러오는 중...</span>
                        </div>
                    </div>
                </div>

                <!-- 진행 상태 표시 -->
                <div class="progress-overlay" id="progress-overlay" style="display: none;">
                    <div class="progress-content">
                        <div class="progress-header">
                            <h4 id="progress-title">파일 처리 중...</h4>
                            <button class="btn btn-text" id="cancel-operation-btn">취소</button>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-details">
                            <span id="progress-text">준비 중...</span>
                            <span id="progress-percentage">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.container) return;

        // 디렉토리 선택
        this.addEventListenerSafe('select-directory-btn', 'click', () => this.selectDirectory());
        
        // 파일 업로드
        this.addEventListenerSafe('select-files-btn', 'click', () => this.selectFiles());
        this.addEventListenerSafe('file-input', 'change', (e) => this.handleFileSelection(e));
        this.addEventListenerSafe('start-upload-btn', 'click', () => this.startUpload());
        this.addEventListenerSafe('clear-upload-queue-btn', 'click', () => this.clearUploadQueue());
        
        // 파일 다운로드
        this.addEventListenerSafe('download-selected-btn', 'click', () => this.downloadSelected());
        this.addEventListenerSafe('download-all-btn', 'click', () => this.downloadAll());
        
        // 파일 목록
        this.addEventListenerSafe('directory-select', 'change', (e) => this.changeDirectory(e.target.value));
        this.addEventListenerSafe('refresh-files-btn', 'click', () => this.refreshFileList());
        
        // 진행 상태
        this.addEventListenerSafe('cancel-operation-btn', 'click', () => this.cancelOperation());
        
        // 드래그 앤 드롭
        this.setupDragAndDrop();
    }

    /**
     * 안전한 이벤트 리스너 추가
     * @param {string} elementId - 엘리먼트 ID
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    addEventListenerSafe(elementId, event, handler) {
        const element = this.container.querySelector(`#${elementId}`);
        if (element) {
            element.addEventListener(event, handler);
            
            // 이벤트 리스너 추적 (정리용)
            if (!this.eventListeners.has(elementId)) {
                this.eventListeners.set(elementId, []);
            }
            this.eventListeners.get(elementId).push({ event, handler });
        }
    }

    /**
     * 드래그 앤 드롭 설정
     */
    setupDragAndDrop() {
        const uploadArea = this.container.querySelector('#upload-area');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.addFilesToUploadQueue(files);
        });
    }

    /**
     * 디렉토리 선택
     */
    async selectDirectory() {
        try {
            this.showProgress('디렉토리 선택 중...', 0);
            
            const success = await this.fileSystemManager.selectRootDirectory();
            
            if (success) {
                this.updateStatus();
                this.refreshFileList();
                this.showToast('디렉토리가 성공적으로 선택되었습니다.', 'success');
            }
        } catch (error) {
            console.error('디렉토리 선택 실패:', error);
            this.showToast('디렉토리 선택에 실패했습니다: ' + error.message, 'error');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 파일 선택
     */
    selectFiles() {
        const fileInput = this.container.querySelector('#file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * 파일 선택 처리
     * @param {Event} event - 파일 선택 이벤트
     */
    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        this.addFilesToUploadQueue(files);
        
        // 파일 입력 초기화
        event.target.value = '';
    }

    /**
     * 업로드 큐에 파일 추가
     * @param {Array} files - 파일 배열
     */
    addFilesToUploadQueue(files) {
        const validFiles = files.filter(file => this.isValidFileType(file));
        
        if (validFiles.length === 0) {
            this.showToast('지원되지 않는 파일 형식입니다.', 'warning');
            return;
        }

        validFiles.forEach(file => {
            const fileInfo = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type || this.fileSystemManager.getMimeType(file.name),
                status: 'pending'
            };
            
            this.uploadQueue.push(fileInfo);
        });

        this.updateUploadQueue();
        
        if (files.length > validFiles.length) {
            this.showToast(`${validFiles.length}개 파일이 추가되었습니다. ${files.length - validFiles.length}개 파일은 지원되지 않는 형식입니다.`, 'warning');
        } else {
            this.showToast(`${validFiles.length}개 파일이 업로드 대기열에 추가되었습니다.`, 'success');
        }
    }

    /**
     * 파일 타입 유효성 검사
     * @param {File} file - 파일 객체
     * @returns {boolean} 유효성 여부
     */
    isValidFileType(file) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return this.supportedTypes.all.includes(extension);
    }

    /**
     * 업로드 큐 UI 업데이트
     */
    updateUploadQueue() {
        const queueContainer = this.container.querySelector('#upload-queue');
        const queueList = this.container.querySelector('#upload-queue-list');
        
        if (!queueContainer || !queueList) return;

        if (this.uploadQueue.length === 0) {
            queueContainer.style.display = 'none';
            return;
        }

        queueContainer.style.display = 'block';
        
        queueList.innerHTML = this.uploadQueue.map(fileInfo => `
            <div class="queue-item" data-file-id="${fileInfo.id}">
                <div class="file-info">
                    <div class="file-name">${fileInfo.name}</div>
                    <div class="file-details">
                        <span class="file-size">${this.fileSystemManager.formatFileSize(fileInfo.size)}</span>
                        <span class="file-status status-${fileInfo.status}">${this.getStatusText(fileInfo.status)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-text btn-sm remove-file-btn" data-file-id="${fileInfo.id}">제거</button>
                </div>
            </div>
        `).join('');

        // 제거 버튼 이벤트 리스너
        queueList.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = parseFloat(e.target.dataset.fileId);
                this.removeFromUploadQueue(fileId);
            });
        });
    }

    /**
     * 업로드 큐에서 파일 제거
     * @param {number} fileId - 파일 ID
     */
    removeFromUploadQueue(fileId) {
        this.uploadQueue = this.uploadQueue.filter(file => file.id !== fileId);
        this.updateUploadQueue();
    }

    /**
     * 업로드 큐 비우기
     */
    clearUploadQueue() {
        this.uploadQueue = [];
        this.updateUploadQueue();
        this.showToast('업로드 대기열이 비워졌습니다.', 'info');
    }

    /**
     * 업로드 시작
     */
    async startUpload() {
        if (this.uploadQueue.length === 0) {
            this.showToast('업로드할 파일이 없습니다.', 'warning');
            return;
        }

        if (this.isProcessing) {
            this.showToast('이미 처리 중입니다.', 'warning');
            return;
        }

        this.isProcessing = true;
        
        try {
            this.showProgress('파일 업로드 중...', 0);
            
            for (let i = 0; i < this.uploadQueue.length; i++) {
                const fileInfo = this.uploadQueue[i];
                const progress = ((i + 1) / this.uploadQueue.length) * 100;
                
                this.updateProgress(`${fileInfo.name} 업로드 중...`, progress);
                
                try {
                    const content = await this.fileSystemManager.readFileAsText(fileInfo.file);
                    const directory = fileInfo.name.endsWith('.yml') || fileInfo.name.endsWith('.yaml') ? 'root' : 'posts';
                    
                    await this.fileSystemManager.writeFile(fileInfo.name, content, directory);
                    
                    fileInfo.status = 'completed';
                } catch (error) {
                    console.error(`파일 업로드 실패: ${fileInfo.name}`, error);
                    fileInfo.status = 'failed';
                }
                
                this.updateUploadQueue();
            }
            
            const successCount = this.uploadQueue.filter(f => f.status === 'completed').length;
            const failCount = this.uploadQueue.filter(f => f.status === 'failed').length;
            
            if (failCount === 0) {
                this.showToast(`${successCount}개 파일이 성공적으로 업로드되었습니다.`, 'success');
            } else {
                this.showToast(`${successCount}개 파일 업로드 성공, ${failCount}개 파일 실패`, 'warning');
            }
            
            // 파일 목록 새로고침
            this.refreshFileList();
            
        } catch (error) {
            console.error('업로드 처리 실패:', error);
            this.showToast('업로드 처리 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
            this.hideProgress();
        }
    }

    /**
     * 선택된 파일 다운로드
     */
    async downloadSelected() {
        const selectedType = this.container.querySelector('input[name="download-type"]:checked')?.value;
        
        if (!selectedType) {
            this.showToast('다운로드할 파일 타입을 선택해주세요.', 'warning');
            return;
        }

        try {
            this.showProgress('다운로드 준비 중...', 0);
            
            switch (selectedType) {
                case 'current':
                    await this.downloadCurrentFile();
                    break;
                case 'all-posts':
                    await this.downloadAllPosts();
                    break;
                case 'config':
                    await this.downloadConfigFile();
                    break;
            }
            
        } catch (error) {
            console.error('다운로드 실패:', error);
            this.showToast('다운로드에 실패했습니다: ' + error.message, 'error');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 전체 백업 다운로드
     */
    async downloadAll() {
        try {
            this.showProgress('전체 백업 생성 중...', 0);
            
            // 모든 파일을 ZIP으로 압축하여 다운로드하는 로직
            // 현재는 간단히 개별 파일들을 순차적으로 다운로드
            await this.downloadAllPosts();
            await this.downloadConfigFile();
            
            this.showToast('전체 백업 다운로드가 완료되었습니다.', 'success');
            
        } catch (error) {
            console.error('전체 백업 실패:', error);
            this.showToast('전체 백업에 실패했습니다: ' + error.message, 'error');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 현재 파일 다운로드
     */
    async downloadCurrentFile() {
        // 현재 편집 중인 파일이 있다면 다운로드
        // 이 부분은 PostManager나 다른 컴포넌트와 연동 필요
        this.showToast('현재 편집 중인 파일이 없습니다.', 'info');
    }

    /**
     * 모든 포스트 다운로드
     */
    async downloadAllPosts() {
        try {
            const files = await this.fileSystemManager.listFiles('posts');
            
            if (files.length === 0) {
                this.showToast('다운로드할 포스트가 없습니다.', 'info');
                return;
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;
                
                this.updateProgress(`${file.name} 다운로드 중...`, progress);
                
                try {
                    const content = await this.fileSystemManager.readFile(file.name, 'posts');
                    await this.fileSystemManager.writeFileAsDownload(file.name, content);
                } catch (error) {
                    console.error(`파일 다운로드 실패: ${file.name}`, error);
                }
            }
            
            this.showToast(`${files.length}개 포스트 파일이 다운로드되었습니다.`, 'success');
            
        } catch (error) {
            throw new Error('포스트 파일 다운로드 실패: ' + error.message);
        }
    }

    /**
     * 설정 파일 다운로드
     */
    async downloadConfigFile() {
        try {
            const content = await this.fileSystemManager.readFile('_config.yml', 'root');
            await this.fileSystemManager.writeFileAsDownload('_config.yml', content);
            this.showToast('설정 파일이 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('설정 파일 다운로드 실패:', error);
            this.showToast('설정 파일을 찾을 수 없습니다.', 'warning');
        }
    }

    /**
     * 디렉토리 변경
     * @param {string} directory - 디렉토리명
     */
    changeDirectory(directory) {
        this.currentDirectory = directory;
        this.refreshFileList();
    }

    /**
     * 파일 목록 새로고침
     */
    async refreshFileList() {
        const fileList = this.container.querySelector('#file-list');
        if (!fileList) return;

        try {
            fileList.innerHTML = `
                <div class="file-list-loading">
                    <div class="spinner-small"></div>
                    <span>파일 목록을 불러오는 중...</span>
                </div>
            `;

            const files = await this.fileSystemManager.listFiles(this.currentDirectory);
            
            if (files.length === 0) {
                fileList.innerHTML = `
                    <div class="file-list-empty">
                        <div class="empty-icon">📁</div>
                        <p>파일이 없습니다.</p>
                    </div>
                `;
                return;
            }

            fileList.innerHTML = `
                <div class="file-list-header">
                    <div class="file-count">${files.length}개 파일</div>
                </div>
                <div class="file-items">
                    ${files.map(file => `
                        <div class="file-item">
                            <div class="file-icon">${this.getFileIcon(file.name)}</div>
                            <div class="file-info">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    <span class="file-size">${this.fileSystemManager.formatFileSize(file.size)}</span>
                                    <span class="file-date">${this.formatDate(file.lastModified)}</span>
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn btn-text btn-sm download-file-btn" data-filename="${file.name}">다운로드</button>
                                <button class="btn btn-text btn-sm delete-file-btn" data-filename="${file.name}">삭제</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // 파일 액션 이벤트 리스너
            fileList.querySelectorAll('.download-file-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filename = e.target.dataset.filename;
                    this.downloadFile(filename);
                });
            });

            fileList.querySelectorAll('.delete-file-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filename = e.target.dataset.filename;
                    this.deleteFile(filename);
                });
            });

        } catch (error) {
            console.error('파일 목록 로드 실패:', error);
            fileList.innerHTML = `
                <div class="file-list-error">
                    <div class="error-icon">❌</div>
                    <p>파일 목록을 불러올 수 없습니다.</p>
                    <button class="btn btn-outline btn-sm" onclick="this.refreshFileList()">다시 시도</button>
                </div>
            `;
        }
    }

    /**
     * 개별 파일 다운로드
     * @param {string} filename - 파일명
     */
    async downloadFile(filename) {
        try {
            this.showProgress(`${filename} 다운로드 중...`, 50);
            
            const content = await this.fileSystemManager.readFile(filename, this.currentDirectory);
            await this.fileSystemManager.writeFileAsDownload(filename, content);
            
            this.showToast(`${filename}이 다운로드되었습니다.`, 'success');
        } catch (error) {
            console.error('파일 다운로드 실패:', error);
            this.showToast(`파일 다운로드에 실패했습니다: ${error.message}`, 'error');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 파일 삭제
     * @param {string} filename - 파일명
     */
    async deleteFile(filename) {
        if (!confirm(`정말로 "${filename}" 파일을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            this.showProgress(`${filename} 삭제 중...`, 50);
            
            const success = await this.fileSystemManager.deleteFile(filename, this.currentDirectory);
            
            if (success) {
                this.showToast(`${filename}이 삭제되었습니다.`, 'success');
                this.refreshFileList();
            }
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            this.showToast(`파일 삭제에 실패했습니다: ${error.message}`, 'error');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 상태 업데이트
     */
    updateStatus() {
        const status = this.fileSystemManager.getStatus();
        const statusIndicator = this.container.querySelector('.status-indicator');
        const statusText = this.container.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${status.mode}`;
            statusText.textContent = this.getStatusText(status);
        }

        // 디렉토리 선택 버튼 표시/숨김
        const selectDirBtn = this.container.querySelector('#select-directory-btn');
        if (selectDirBtn) {
            selectDirBtn.style.display = (!status.hasRootDirectory && status.supportsFileSystemAccess) ? 'block' : 'none';
        }

        // 파일 목록 새로고침
        if (status.hasRootDirectory) {
            this.refreshFileList();
        }
    }

    /**
     * 상태 텍스트 가져오기
     * @param {Object|string} status - 상태 객체 또는 문자열
     * @returns {string} 상태 텍스트
     */
    getStatusText(status) {
        if (typeof status === 'string') {
            const statusTexts = {
                'pending': '대기 중',
                'processing': '처리 중',
                'completed': '완료',
                'failed': '실패'
            };
            return statusTexts[status] || status;
        }

        if (status.mode === 'filesystem') {
            return '파일 시스템 직접 접근';
        } else {
            return '업로드/다운로드 모드';
        }
    }

    /**
     * 파일 아이콘 가져오기
     * @param {string} filename - 파일명
     * @returns {string} 아이콘
     */
    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const icons = {
            'md': '📝',
            'markdown': '📝',
            'yml': '⚙️',
            'yaml': '⚙️',
            'txt': '📄'
        };
        return icons[extension] || '📄';
    }

    /**
     * 날짜 포맷팅
     * @param {Date} date - 날짜 객체
     * @returns {string} 포맷된 날짜
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * 진행 상태 표시
     * @param {string} title - 제목
     * @param {number} percentage - 진행률 (0-100)
     */
    showProgress(title, percentage) {
        const overlay = this.container.querySelector('#progress-overlay');
        const titleEl = this.container.querySelector('#progress-title');
        const fillEl = this.container.querySelector('#progress-fill');
        const textEl = this.container.querySelector('#progress-text');
        const percentageEl = this.container.querySelector('#progress-percentage');

        if (overlay) overlay.style.display = 'flex';
        if (titleEl) titleEl.textContent = title;
        if (fillEl) fillEl.style.width = `${percentage}%`;
        if (textEl) textEl.textContent = title;
        if (percentageEl) percentageEl.textContent = `${Math.round(percentage)}%`;
    }

    /**
     * 진행 상태 업데이트
     * @param {string} text - 진행 텍스트
     * @param {number} percentage - 진행률
     */
    updateProgress(text, percentage) {
        const fillEl = this.container.querySelector('#progress-fill');
        const textEl = this.container.querySelector('#progress-text');
        const percentageEl = this.container.querySelector('#progress-percentage');

        if (fillEl) fillEl.style.width = `${percentage}%`;
        if (textEl) textEl.textContent = text;
        if (percentageEl) percentageEl.textContent = `${Math.round(percentage)}%`;
    }

    /**
     * 진행 상태 숨김
     */
    hideProgress() {
        const overlay = this.container.querySelector('#progress-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    /**
     * 작업 취소
     */
    cancelOperation() {
        this.isProcessing = false;
        this.hideProgress();
        this.showToast('작업이 취소되었습니다.', 'info');
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        // 토스트 메시지 구현
        // 실제로는 전역 토스트 시스템을 사용하거나 별도 구현 필요
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 간단한 alert 대체 (실제 구현에서는 더 나은 UI 사용)
        if (type === 'error') {
            alert(`오류: ${message}`);
        } else if (type === 'success') {
            // 성공 메시지는 콘솔에만 출력
        } else if (type === 'warning') {
            console.warn(message);
        }
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        // 이벤트 리스너 제거
        this.eventListeners.forEach((listeners, elementId) => {
            const element = this.container?.querySelector(`#${elementId}`);
            if (element) {
                listeners.forEach(({ event, handler }) => {
                    element.removeEventListener(event, handler);
                });
            }
        });
        
        this.eventListeners.clear();
        this.uploadQueue = [];
        this.downloadQueue = [];
        this.isProcessing = false;
        this.container = null;
    }
}