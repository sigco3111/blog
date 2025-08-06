# Jekyll 어드민 사이트 개발자 가이드

## 개요

Jekyll 어드민 사이트는 모듈형 JavaScript 아키텍처를 기반으로 한 클라이언트 사이드 애플리케이션입니다. 이 문서는 코드 구조, API, 그리고 확장 방법에 대해 설명합니다.

## 프로젝트 구조

```
admin/
├── index.html                 # 메인 HTML 파일
├── assets/
│   ├── css/
│   │   └── admin.css         # 스타일시트
│   └── js/
│       ├── main.js           # 애플리케이션 진입점
│       ├── bundle.js         # 번들된 JavaScript
│       └── modules/          # 모듈 디렉토리
│           ├── auth.js       # 인증 관리
│           ├── post-manager.js    # 포스트 관리
│           ├── config-manager.js  # 설정 관리
│           ├── markdown-editor.js # 마크다운 에디터
│           ├── search-engine.js   # 검색 엔진
│           ├── router.js     # 라우팅
│           ├── ui.js         # UI 컴포넌트
│           ├── utils.js      # 유틸리티 함수
│           ├── file-system-manager.js  # 파일 시스템
│           ├── error-handler.js        # 오류 처리
│           ├── loading-manager.js      # 로딩 관리
│           ├── notification-system.js  # 알림 시스템
│           └── file-manager-ui.js      # 파일 관리 UI
├── docs/                     # 문서
├── tests/                    # 테스트 파일
└── test-*.html              # 개별 테스트 페이지
```

## 핵심 모듈

### 1. AuthManager (auth.js)

인증 시스템을 관리하는 클래스입니다.

```javascript
class AuthManager {
  constructor() {
    this.adminId = 'id';
    this.adminPw = 'pw';
    this.isAuthenticated = false;
  }

  // 로그인 처리
  login(id, password) {
    if (id === this.adminId && password === this.adminPw) {
      this.isAuthenticated = true;
      localStorage.setItem('admin_auth', 'true');
      return true;
    }
    return false;
  }

  // 로그아웃 처리
  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('admin_auth');
  }

  // 인증 상태 확인
  checkAuth() {
    const stored = localStorage.getItem('admin_auth');
    this.isAuthenticated = stored === 'true';
    return this.isAuthenticated;
  }
}
```

### 2. PostManager (post-manager.js)

블로그 포스트의 CRUD 작업을 처리합니다.

```javascript
class PostManager {
  constructor() {
    this.posts = [];
    this.currentPost = null;
  }

  // 포스트 목록 로드
  async loadPosts() {
    // 파일 시스템에서 포스트 로드
  }

  // 새 포스트 생성
  async createPost(postData) {
    const post = {
      id: this.generateId(),
      filename: this.generateFilename(postData.title, postData.date),
      frontMatter: this.createFrontMatter(postData),
      content: postData.content,
      lastModified: new Date().toISOString()
    };
    
    await this.savePost(post);
    this.posts.push(post);
    return post;
  }

  // 포스트 업데이트
  async updatePost(id, postData) {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      Object.assign(post, postData);
      post.lastModified = new Date().toISOString();
      await this.savePost(post);
    }
    return post;
  }

  // 포스트 삭제
  async deletePost(id) {
    const postIndex = this.posts.findIndex(p => p.id === id);
    if (postIndex !== -1) {
      const post = this.posts[postIndex];
      await this.deletePostFile(post.filename);
      this.posts.splice(postIndex, 1);
      return true;
    }
    return false;
  }
}
```

### 3. ConfigManager (config-manager.js)

Jekyll 설정 파일(_config.yml)을 관리합니다.

```javascript
class ConfigManager {
  constructor() {
    this.config = {};
  }

  // 설정 로드
  async loadConfig() {
    try {
      const configText = await this.fileManager.readFile('_config.yml');
      this.config = this.parseYAML(configText);
      return this.config;
    } catch (error) {
      throw new Error('설정 파일을 로드할 수 없습니다: ' + error.message);
    }
  }

  // 설정 저장
  async saveConfig(newConfig) {
    try {
      this.validateConfig(newConfig);
      const yamlText = this.stringifyYAML(newConfig);
      await this.fileManager.writeFile('_config.yml', yamlText);
      this.config = newConfig;
      return true;
    } catch (error) {
      throw new Error('설정 저장 실패: ' + error.message);
    }
  }

  // YAML 유효성 검사
  validateConfig(config) {
    const required = ['title', 'description'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`필수 필드가 누락되었습니다: ${field}`);
      }
    }
  }
}
```

### 4. MarkdownEditor (markdown-editor.js)

마크다운 에디터와 실시간 미리보기를 제공합니다.

```javascript
class MarkdownEditor {
  constructor(editorElement, previewElement) {
    this.editor = editorElement;
    this.preview = previewElement;
    this.marked = marked; // Marked.js 라이브러리
    this.setupEditor();
  }

  // 에디터 초기화
  setupEditor() {
    this.editor.addEventListener('input', this.debounce(() => {
      this.updatePreview();
    }, 300));

    this.setupToolbar();
    this.setupSyncScroll();
  }

  // 미리보기 업데이트
  updatePreview() {
    const markdown = this.editor.value;
    const html = this.marked.parse(markdown);
    this.preview.innerHTML = html;
  }

  // 도구바 설정
  setupToolbar() {
    const toolbar = document.querySelector('.editor-toolbar');
    
    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.executeAction(action);
      }
    });
  }

  // 에디터 액션 실행
  executeAction(action) {
    const selection = this.getSelection();
    
    switch (action) {
      case 'bold':
        this.wrapSelection('**', '**');
        break;
      case 'italic':
        this.wrapSelection('*', '*');
        break;
      case 'link':
        this.insertLink();
        break;
      // 기타 액션들...
    }
  }
}
```

### 5. SearchEngine (search-engine.js)

클라이언트 사이드 검색 기능을 제공합니다.

```javascript
class SearchEngine {
  constructor() {
    this.index = [];
    this.searchCache = new Map();
  }

  // 검색 인덱스 생성
  buildIndex(posts) {
    this.index = posts.map(post => ({
      id: post.id,
      title: post.frontMatter.title.toLowerCase(),
      content: post.content.toLowerCase(),
      tags: (post.frontMatter.tags || []).join(' ').toLowerCase(),
      categories: (post.frontMatter.categories || []).join(' ').toLowerCase()
    }));
  }

  // 검색 실행
  search(query) {
    if (!query.trim()) return [];
    
    const cacheKey = query.toLowerCase();
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    const results = this.performSearch(query.toLowerCase());
    this.searchCache.set(cacheKey, results);
    return results;
  }

  // 실제 검색 로직
  performSearch(query) {
    const results = [];
    
    for (const item of this.index) {
      let score = 0;
      
      // 제목 매칭 (높은 점수)
      if (item.title.includes(query)) {
        score += 10;
      }
      
      // 내용 매칭
      if (item.content.includes(query)) {
        score += 5;
      }
      
      // 태그/카테고리 매칭
      if (item.tags.includes(query) || item.categories.includes(query)) {
        score += 8;
      }
      
      if (score > 0) {
        results.push({ id: item.id, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
}
```

### 6. Router (router.js)

클라이언트 사이드 라우팅을 처리합니다.

```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.setupEventListeners();
  }

  // 라우트 등록
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  // 라우팅 처리
  navigate(path) {
    const handler = this.routes.get(path);
    if (handler) {
      this.currentRoute = path;
      history.pushState({ path }, '', path);
      handler();
    } else {
      this.navigate('/admin/dashboard');
    }
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) {
        this.navigate(e.state.path);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault();
        this.navigate(e.target.dataset.route);
      }
    });
  }
}
```

## API 참조

### AuthManager API

| 메서드 | 매개변수 | 반환값 | 설명 |
|--------|----------|--------|------|
| `login(id, password)` | string, string | boolean | 로그인 시도 |
| `logout()` | - | void | 로그아웃 |
| `checkAuth()` | - | boolean | 인증 상태 확인 |

### PostManager API

| 메서드 | 매개변수 | 반환값 | 설명 |
|--------|----------|--------|------|
| `loadPosts()` | - | Promise<Array> | 포스트 목록 로드 |
| `createPost(data)` | Object | Promise<Object> | 새 포스트 생성 |
| `updatePost(id, data)` | string, Object | Promise<Object> | 포스트 업데이트 |
| `deletePost(id)` | string | Promise<boolean> | 포스트 삭제 |
| `searchPosts(query)` | string | Array | 포스트 검색 |

### ConfigManager API

| 메서드 | 매개변수 | 반환값 | 설명 |
|--------|----------|--------|------|
| `loadConfig()` | - | Promise<Object> | 설정 로드 |
| `saveConfig(config)` | Object | Promise<boolean> | 설정 저장 |
| `validateConfig(config)` | Object | boolean | 설정 유효성 검사 |

### MarkdownEditor API

| 메서드 | 매개변수 | 반환값 | 설명 |
|--------|----------|--------|------|
| `getValue()` | - | string | 에디터 내용 가져오기 |
| `setValue(content)` | string | void | 에디터 내용 설정 |
| `insertText(text)` | string | void | 텍스트 삽입 |
| `wrapSelection(before, after)` | string, string | void | 선택 영역 감싸기 |

### SearchEngine API

| 메서드 | 매개변수 | 반환값 | 설명 |
|--------|----------|--------|------|
| `buildIndex(posts)` | Array | void | 검색 인덱스 구축 |
| `search(query)` | string | Array | 검색 실행 |
| `clearCache()` | - | void | 검색 캐시 지우기 |

## 이벤트 시스템

애플리케이션은 커스텀 이벤트를 사용하여 모듈 간 통신을 합니다.

### 이벤트 목록

```javascript
// 인증 관련
document.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
document.dispatchEvent(new CustomEvent('auth:logout'));

// 포스트 관련
document.dispatchEvent(new CustomEvent('post:created', { detail: { post } }));
document.dispatchEvent(new CustomEvent('post:updated', { detail: { post } }));
document.dispatchEvent(new CustomEvent('post:deleted', { detail: { id } }));

// UI 관련
document.dispatchEvent(new CustomEvent('ui:loading', { detail: { show: true } }));
document.dispatchEvent(new CustomEvent('ui:notification', { detail: { message, type } }));
```

### 이벤트 리스너 등록

```javascript
document.addEventListener('post:created', (e) => {
  console.log('새 포스트 생성됨:', e.detail.post);
  // UI 업데이트 로직
});
```

## 확장 가이드

### 새로운 모듈 추가

1. `admin/assets/js/modules/` 디렉토리에 새 파일 생성
2. 모듈 클래스 정의
3. `main.js`에서 모듈 import 및 초기화
4. 필요한 경우 HTML과 CSS 업데이트

```javascript
// modules/my-module.js
class MyModule {
  constructor() {
    this.init();
  }

  init() {
    // 초기화 로직
  }

  // 공개 메서드들
}

export default MyModule;
```

### 새로운 라우트 추가

```javascript
// main.js에서
router.addRoute('/admin/my-page', () => {
  // 페이지 렌더링 로직
  document.getElementById('main-content').innerHTML = `
    <div class="my-page">
      <!-- 페이지 내용 -->
    </div>
  `;
});
```

### 커스텀 에디터 도구 추가

```javascript
// markdown-editor.js 확장
class ExtendedMarkdownEditor extends MarkdownEditor {
  setupToolbar() {
    super.setupToolbar();
    
    // 새로운 도구 추가
    this.addTool('table', '표 삽입', () => {
      this.insertTable();
    });
  }

  insertTable() {
    const table = `
| 헤더1 | 헤더2 |
|-------|-------|
| 내용1 | 내용2 |
`;
    this.insertText(table);
  }
}
```

### 새로운 검색 필터 추가

```javascript
// search-engine.js 확장
class ExtendedSearchEngine extends SearchEngine {
  searchByDate(startDate, endDate) {
    return this.index.filter(item => {
      const postDate = new Date(item.date);
      return postDate >= startDate && postDate <= endDate;
    });
  }

  searchByAuthor(author) {
    return this.index.filter(item => 
      item.author && item.author.toLowerCase().includes(author.toLowerCase())
    );
  }
}
```

## 테스트

### 단위 테스트 작성

```javascript
// tests/unit/my-module.test.js
describe('MyModule', () => {
  let myModule;

  beforeEach(() => {
    myModule = new MyModule();
  });

  test('should initialize correctly', () => {
    expect(myModule).toBeDefined();
  });

  test('should handle data correctly', () => {
    const result = myModule.processData('test');
    expect(result).toBe('expected');
  });
});
```

### 통합 테스트 작성

```javascript
// tests/integration/workflow.test.js
describe('Complete Workflow', () => {
  test('should create and edit post', async () => {
    // 로그인
    const auth = new AuthManager();
    expect(auth.login('id', 'pw')).toBe(true);

    // 포스트 생성
    const postManager = new PostManager();
    const post = await postManager.createPost({
      title: 'Test Post',
      content: 'Test content'
    });

    expect(post).toBeDefined();
    expect(post.title).toBe('Test Post');
  });
});
```

## 빌드 및 배포

### 개발 환경 설정

```bash
# 의존성 설치 (필요한 경우)
npm install

# 개발 서버 실행
jekyll serve

# 테스트 실행
npm test
```

### 프로덕션 빌드

```bash
# Jekyll 사이트 빌드
jekyll build

# JavaScript 최소화 (선택사항)
npm run minify

# GitHub Pages에 배포
git push origin main
```

### 환경변수 설정

```bash
# .env 파일
VITE_ADMIN_ID=your_admin_id
VITE_ADMIN_PW=your_admin_password
```

## 성능 최적화

### JavaScript 최적화

1. **지연 로딩**: 필요한 모듈만 로드
2. **디바운싱**: 검색 및 입력 이벤트 최적화
3. **캐싱**: 검색 결과 및 데이터 캐싱
4. **가상 스크롤링**: 대량 데이터 처리

### CSS 최적화

1. **Critical CSS**: 중요한 스타일 인라인화
2. **미사용 CSS 제거**: PurgeCSS 사용
3. **CSS 압축**: 프로덕션 빌드 시 압축

### 메모리 관리

1. **이벤트 리스너 정리**: 컴포넌트 제거 시 리스너 해제
2. **참조 해제**: 사용하지 않는 객체 참조 제거
3. **가비지 컬렉션**: 주기적인 메모리 정리

## 보안 고려사항

### 클라이언트 사이드 보안

1. **입력 검증**: 모든 사용자 입력 검증
2. **XSS 방지**: HTML 이스케이프 처리
3. **CSRF 방지**: 토큰 기반 요청 검증

### 데이터 보호

1. **민감 정보 암호화**: 로컬 스토리지 데이터 암호화
2. **세션 관리**: 적절한 세션 타임아웃
3. **접근 제어**: 권한 기반 기능 제한

이 개발자 가이드를 통해 Jekyll 어드민 사이트의 구조를 이해하고 필요에 따라 확장할 수 있습니다.