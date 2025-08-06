/**
 * FileSystemManager - 파일 시스템 인터페이스 관리 클래스
 * File System Access API와 폴백 방식(다운로드/업로드)을 지원합니다.
 */
export class FileSystemManager {
    constructor() {
        // File System Access API 지원 여부 확인
        this.supportsFileSystemAccess = 'showDirectoryPicker' in window;
        
        // 디렉토리 핸들 저장
        this.rootDirectoryHandle = null;
        this.postsDirectoryHandle = null;
        this.configFileHandle = null;
        
        // 지원되는 파일 타입
        this.supportedFileTypes = {
            markdown: {
                description: 'Markdown files',
                accept: { 'text/markdown': ['.md', '.markdown'] }
            },
            yaml: {
                description: 'YAML files',
                accept: { 'text/yaml': ['.yml', '.yaml'] }
            },
            text: {
                description: 'Text files',
                accept: { 'text/plain': ['.txt'] }
            }
        };
        
        // 오류 메시지
        this.errorMessages = {
            notSupported: 'File System Access API가 지원되지 않습니다.',
            accessDenied: '파일 시스템 접근이 거부되었습니다.',
            fileNotFound: '파일을 찾을 수 없습니다.',
            writeError: '파일 쓰기에 실패했습니다.',
            readError: '파일 읽기에 실패했습니다.',
            deleteError: '파일 삭제에 실패했습니다.'
        };
    }

    /**
     * FileSystemManager 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async init() {
        try {
            if (this.supportsFileSystemAccess) {
                console.log('File System Access API 지원됨');
                return true;
            } else {
                console.log('File System Access API 미지원 - 폴백 모드 사용');
                return true;
            }
        } catch (error) {
            console.error('FileSystemManager 초기화 실패:', error);
            return false;
        }
    }

    /**
     * 루트 디렉토리 선택 및 설정
     * @returns {Promise<boolean>} 성공 여부
     */
    async selectRootDirectory() {
        if (!this.supportsFileSystemAccess) {
            throw new Error(this.errorMessages.notSupported);
        }

        try {
            this.rootDirectoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            // _posts 디렉토리 핸들 설정
            await this.setupPostsDirectory();
            
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('사용자가 디렉토리 선택을 취소했습니다.');
                return false;
            }
            console.error('디렉토리 선택 실패:', error);
            throw new Error(this.errorMessages.accessDenied);
        }
    }

    /**
     * _posts 디렉토리 설정
     * @returns {Promise<void>}
     */
    async setupPostsDirectory() {
        if (!this.rootDirectoryHandle) {
            throw new Error('루트 디렉토리가 설정되지 않았습니다.');
        }

        try {
            // _posts 디렉토리 가져오기 또는 생성
            this.postsDirectoryHandle = await this.rootDirectoryHandle.getDirectoryHandle('_posts', {
                create: true
            });
        } catch (error) {
            console.error('_posts 디렉토리 설정 실패:', error);
            throw error;
        }
    }

    /**
     * 파일 읽기
     * @param {string} filePath - 파일 경로
     * @param {string} directory - 디렉토리 ('posts', 'root')
     * @returns {Promise<string>} 파일 내용
     */
    async readFile(filePath, directory = 'posts') {
        if (this.supportsFileSystemAccess && this.rootDirectoryHandle) {
            return await this.readFileFromFileSystem(filePath, directory);
        } else {
            // 폴백: 파일 업로드 요청
            return await this.readFileFromUpload(filePath);
        }
    }

    /**
     * File System Access API를 사용한 파일 읽기
     * @param {string} filePath - 파일 경로
     * @param {string} directory - 디렉토리
     * @returns {Promise<string>} 파일 내용
     */
    async readFileFromFileSystem(filePath, directory) {
        try {
            let directoryHandle;
            
            if (directory === 'posts') {
                directoryHandle = this.postsDirectoryHandle;
            } else {
                directoryHandle = this.rootDirectoryHandle;
            }
            
            if (!directoryHandle) {
                throw new Error('디렉토리 핸들이 설정되지 않았습니다.');
            }

            const fileHandle = await directoryHandle.getFileHandle(filePath);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error('파일 읽기 실패:', error);
            throw new Error(`${this.errorMessages.readError}: ${filePath}`);
        }
    }

    /**
     * 폴백 방식: 파일 업로드를 통한 읽기
     * @param {string} expectedFileName - 예상 파일명
     * @returns {Promise<string>} 파일 내용
     */
    async readFileFromUpload(expectedFileName) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.markdown,.yml,.yaml,.txt';
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('파일이 선택되지 않았습니다.'));
                    return;
                }
                
                try {
                    const content = await this.readFileAsText(file);
                    resolve(content);
                } catch (error) {
                    reject(new Error(`${this.errorMessages.readError}: ${file.name}`));
                }
            };
            
            input.click();
        });
    }

    /**
     * 파일 쓰기
     * @param {string} filePath - 파일 경로
     * @param {string} content - 파일 내용
     * @param {string} directory - 디렉토리 ('posts', 'root')
     * @returns {Promise<boolean>} 성공 여부
     */
    async writeFile(filePath, content, directory = 'posts') {
        if (this.supportsFileSystemAccess && this.rootDirectoryHandle) {
            return await this.writeFileToFileSystem(filePath, content, directory);
        } else {
            // 폴백: 다운로드 방식
            return await this.writeFileAsDownload(filePath, content);
        }
    }

    /**
     * File System Access API를 사용한 파일 쓰기
     * @param {string} filePath - 파일 경로
     * @param {string} content - 파일 내용
     * @param {string} directory - 디렉토리
     * @returns {Promise<boolean>} 성공 여부
     */
    async writeFileToFileSystem(filePath, content, directory) {
        try {
            let directoryHandle;
            
            if (directory === 'posts') {
                directoryHandle = this.postsDirectoryHandle;
            } else {
                directoryHandle = this.rootDirectoryHandle;
            }
            
            if (!directoryHandle) {
                throw new Error('디렉토리 핸들이 설정되지 않았습니다.');
            }

            const fileHandle = await directoryHandle.getFileHandle(filePath, {
                create: true
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            return true;
        } catch (error) {
            console.error('파일 쓰기 실패:', error);
            throw new Error(`${this.errorMessages.writeError}: ${filePath}`);
        }
    }

    /**
     * 폴백 방식: 다운로드를 통한 파일 저장
     * @param {string} fileName - 파일명
     * @param {string} content - 파일 내용
     * @returns {Promise<boolean>} 성공 여부
     */
    async writeFileAsDownload(fileName, content) {
        try {
            const mimeType = this.getMimeType(fileName);
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('파일 다운로드 실패:', error);
            throw new Error(`${this.errorMessages.writeError}: ${fileName}`);
        }
    }

    /**
     * 파일 삭제
     * @param {string} filePath - 파일 경로
     * @param {string} directory - 디렉토리 ('posts', 'root')
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteFile(filePath, directory = 'posts') {
        if (this.supportsFileSystemAccess && this.rootDirectoryHandle) {
            return await this.deleteFileFromFileSystem(filePath, directory);
        } else {
            // 폴백: 사용자에게 수동 삭제 안내
            return await this.deleteFileManually(filePath);
        }
    }

    /**
     * File System Access API를 사용한 파일 삭제
     * @param {string} filePath - 파일 경로
     * @param {string} directory - 디렉토리
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteFileFromFileSystem(filePath, directory) {
        try {
            let directoryHandle;
            
            if (directory === 'posts') {
                directoryHandle = this.postsDirectoryHandle;
            } else {
                directoryHandle = this.rootDirectoryHandle;
            }
            
            if (!directoryHandle) {
                throw new Error('디렉토리 핸들이 설정되지 않았습니다.');
            }

            await directoryHandle.removeEntry(filePath);
            return true;
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            throw new Error(`${this.errorMessages.deleteError}: ${filePath}`);
        }
    }

    /**
     * 폴백 방식: 수동 삭제 안내
     * @param {string} fileName - 파일명
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteFileManually(fileName) {
        return new Promise((resolve) => {
            const message = `파일 시스템 접근이 제한되어 있습니다.\n다음 파일을 수동으로 삭제해주세요:\n${fileName}`;
            
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * 디렉토리 내 파일 목록 조회
     * @param {string} directory - 디렉토리 ('posts', 'root')
     * @returns {Promise<Array>} 파일 목록
     */
    async listFiles(directory = 'posts') {
        if (this.supportsFileSystemAccess && this.rootDirectoryHandle) {
            return await this.listFilesFromFileSystem(directory);
        } else {
            // 폴백: 빈 배열 반환 (실제로는 서버나 다른 방식으로 목록을 가져와야 함)
            console.warn('File System Access API 미지원 - 파일 목록을 가져올 수 없습니다.');
            return [];
        }
    }

    /**
     * File System Access API를 사용한 파일 목록 조회
     * @param {string} directory - 디렉토리
     * @returns {Promise<Array>} 파일 목록
     */
    async listFilesFromFileSystem(directory) {
        try {
            let directoryHandle;
            
            if (directory === 'posts') {
                directoryHandle = this.postsDirectoryHandle;
            } else {
                directoryHandle = this.rootDirectoryHandle;
            }
            
            if (!directoryHandle) {
                throw new Error('디렉토리 핸들이 설정되지 않았습니다.');
            }

            const files = [];
            
            for await (const [name, handle] of directoryHandle.entries()) {
                if (handle.kind === 'file') {
                    const file = await handle.getFile();
                    files.push({
                        name: name,
                        size: file.size,
                        lastModified: new Date(file.lastModified),
                        type: file.type || this.getMimeType(name)
                    });
                }
            }
            
            return files.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
            throw new Error('파일 목록을 가져올 수 없습니다.');
        }
    }

    /**
     * 파일 존재 여부 확인
     * @param {string} filePath - 파일 경로
     * @param {string} directory - 디렉토리 ('posts', 'root')
     * @returns {Promise<boolean>} 존재 여부
     */
    async fileExists(filePath, directory = 'posts') {
        if (!this.supportsFileSystemAccess || !this.rootDirectoryHandle) {
            return false;
        }

        try {
            let directoryHandle;
            
            if (directory === 'posts') {
                directoryHandle = this.postsDirectoryHandle;
            } else {
                directoryHandle = this.rootDirectoryHandle;
            }
            
            if (!directoryHandle) {
                return false;
            }

            await directoryHandle.getFileHandle(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 파일을 텍스트로 읽기 (File 객체용)
     * @param {File} file - File 객체
     * @returns {Promise<string>} 파일 내용
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 파일명에서 MIME 타입 추출
     * @param {string} fileName - 파일명
     * @returns {string} MIME 타입
     */
    getMimeType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        const mimeTypes = {
            'md': 'text/markdown',
            'markdown': 'text/markdown',
            'yml': 'text/yaml',
            'yaml': 'text/yaml',
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'text/javascript',
            'json': 'application/json'
        };
        
        return mimeTypes[extension] || 'text/plain';
    }

    /**
     * 파일 크기를 읽기 쉬운 형태로 변환
     * @param {number} bytes - 바이트 크기
     * @returns {string} 읽기 쉬운 크기
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 파일 시스템 지원 여부 확인
     * @returns {boolean} 지원 여부
     */
    isFileSystemAccessSupported() {
        return this.supportsFileSystemAccess;
    }

    /**
     * 현재 디렉토리 핸들 상태 확인
     * @returns {Object} 상태 정보
     */
    getStatus() {
        return {
            supportsFileSystemAccess: this.supportsFileSystemAccess,
            hasRootDirectory: !!this.rootDirectoryHandle,
            hasPostsDirectory: !!this.postsDirectoryHandle,
            mode: this.supportsFileSystemAccess && this.rootDirectoryHandle ? 'filesystem' : 'fallback'
        };
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        this.rootDirectoryHandle = null;
        this.postsDirectoryHandle = null;
        this.configFileHandle = null;
    }

    /**
     * 오류 메시지 가져오기
     * @param {string} errorType - 오류 타입
     * @returns {string} 오류 메시지
     */
    getErrorMessage(errorType) {
        return this.errorMessages[errorType] || '알 수 없는 오류가 발생했습니다.';
    }
}