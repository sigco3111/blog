# API 참조 문서

## 개요

Jekyll 어드민 사이트의 JavaScript API 참조 문서입니다. 모든 공개 메서드와 이벤트에 대한 상세한 정보를 제공합니다.

## AuthManager

인증 시스템을 관리하는 클래스입니다.

### 생성자

```javascript
const authManager = new AuthManager();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `adminId` | string | 관리자 ID (읽기 전용) |
| `adminPw` | string | 관리자 비밀번호 (읽기 전용) |
| `isAuthenticated` | boolean | 현재 인증 상태 |

### 메서드

#### `login(id, password)`

사용자 로그인을 처리합니다.

**매개변수:**
- `id` (string): 사용자 ID
- `password` (string): 사용자 비밀번호

**반환값:**
- `boolean`: 로그인 성공 시 `true`, 실패 시 `false`

**예제:**
```javascript
const success = authManager.login('admin', 'password');
if (success) {
  console.log('로그인 성공');
} else {
  console.log('로그인 실패');
}
```

#### `logout()`

사용자 로그아웃을 처리합니다.

**매개변수:** 없음

**반환값:** `void`

**예제:**
```javascript
authManager.logout();
```

#### `checkAuth()`

현재 인증 상태를 확인합니다.

**매개변수:** 없음

**반환값:**
- `boolean`: 인증된 상태면 `true`, 아니면 `false`

**예제:**
```javascript
if (authManager.checkAuth()) {
  // 인증된 사용자만 접근 가능한 기능
}
```

### 이벤트

#### `auth:login`

로그인 성공 시 발생하는 이벤트입니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    timestamp: Date,
    userId: string
  }
}
```

#### `auth:logout`

로그아웃 시 발생하는 이벤트입니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    timestamp: Date
  }
}
```

## PostManager

블로그 포스트의 CRUD 작업을 처리하는 클래스입니다.

### 생성자

```javascript
const postManager = new PostManager();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `posts` | Array | 로드된 포스트 목록 |
| `currentPost` | Object | 현재 편집 중인 포스트 |

### 메서드

#### `loadPosts()`

모든 포스트를 로드합니다.

**매개변수:** 없음

**반환값:**
- `Promise<Array>`: 포스트 객체 배열

**예제:**
```javascript
const posts = await postManager.loadPosts();
console.log(`${posts.length}개의 포스트를 로드했습니다.`);
```

#### `createPost(postData)`

새로운 포스트를 생성합니다.

**매개변수:**
- `postData` (Object): 포스트 데이터
  - `title` (string): 포스트 제목
  - `content` (string): 포스트 내용
  - `date` (string, 선택): 발행 날짜 (ISO 형식)
  - `categories` (Array, 선택): 카테고리 목록
  - `tags` (Array, 선택): 태그 목록

**반환값:**
- `Promise<Object>`: 생성된 포스트 객체

**예제:**
```javascript
const newPost = await postManager.createPost({
  title: '새로운 포스트',
  content: '포스트 내용입니다.',
  categories: ['jekyll', 'blog'],
  tags: ['tutorial', 'guide']
});
```

#### `updatePost(id, postData)`

기존 포스트를 업데이트합니다.

**매개변수:**
- `id` (string): 포스트 ID
- `postData` (Object): 업데이트할 데이터

**반환값:**
- `Promise<Object>`: 업데이트된 포스트 객체

**예제:**
```javascript
const updatedPost = await postManager.updatePost('post-id', {
  title: '수정된 제목',
  content: '수정된 내용'
});
```

#### `deletePost(id)`

포스트를 삭제합니다.

**매개변수:**
- `id` (string): 삭제할 포스트 ID

**반환값:**
- `Promise<boolean>`: 삭제 성공 시 `true`

**예제:**
```javascript
const deleted = await postManager.deletePost('post-id');
if (deleted) {
  console.log('포스트가 삭제되었습니다.');
}
```

#### `searchPosts(query)`

포스트를 검색합니다.

**매개변수:**
- `query` (string): 검색어

**반환값:**
- `Array`: 검색 결과 포스트 배열

**예제:**
```javascript
const results = postManager.searchPosts('Jekyll');
console.log(`${results.length}개의 검색 결과를 찾았습니다.`);
```

### 이벤트

#### `post:created`

새 포스트 생성 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    post: Object,
    timestamp: Date
  }
}
```

#### `post:updated`

포스트 업데이트 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    post: Object,
    changes: Object,
    timestamp: Date
  }
}
```

#### `post:deleted`

포스트 삭제 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    id: string,
    timestamp: Date
  }
}
```

## ConfigManager

Jekyll 설정 파일을 관리하는 클래스입니다.

### 생성자

```javascript
const configManager = new ConfigManager();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `config` | Object | 현재 로드된 설정 |

### 메서드

#### `loadConfig()`

_config.yml 파일을 로드합니다.

**매개변수:** 없음

**반환값:**
- `Promise<Object>`: 설정 객체

**예제:**
```javascript
const config = await configManager.loadConfig();
console.log('사이트 제목:', config.title);
```

#### `saveConfig(newConfig)`

설정을 저장합니다.

**매개변수:**
- `newConfig` (Object): 새로운 설정 객체

**반환값:**
- `Promise<boolean>`: 저장 성공 시 `true`

**예제:**
```javascript
const success = await configManager.saveConfig({
  title: '새로운 사이트 제목',
  description: '사이트 설명'
});
```

#### `validateConfig(config)`

설정의 유효성을 검사합니다.

**매개변수:**
- `config` (Object): 검사할 설정 객체

**반환값:**
- `boolean`: 유효한 설정이면 `true`

**예외:**
- `Error`: 유효하지 않은 설정인 경우

**예제:**
```javascript
try {
  configManager.validateConfig(newConfig);
  console.log('설정이 유효합니다.');
} catch (error) {
  console.error('설정 오류:', error.message);
}
```

### 이벤트

#### `config:loaded`

설정 로드 완료 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    config: Object,
    timestamp: Date
  }
}
```

#### `config:saved`

설정 저장 완료 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    config: Object,
    timestamp: Date
  }
}
```

## MarkdownEditor

마크다운 에디터 기능을 제공하는 클래스입니다.

### 생성자

```javascript
const editor = new MarkdownEditor(editorElement, previewElement);
```

**매개변수:**
- `editorElement` (HTMLElement): 에디터 텍스트 영역
- `previewElement` (HTMLElement): 미리보기 영역

### 메서드

#### `getValue()`

에디터의 현재 내용을 가져옵니다.

**매개변수:** 없음

**반환값:**
- `string`: 에디터 내용

**예제:**
```javascript
const content = editor.getValue();
```

#### `setValue(content)`

에디터 내용을 설정합니다.

**매개변수:**
- `content` (string): 설정할 내용

**반환값:** `void`

**예제:**
```javascript
editor.setValue('# 새로운 내용\n\n포스트 내용입니다.');
```

#### `insertText(text)`

커서 위치에 텍스트를 삽입합니다.

**매개변수:**
- `text` (string): 삽입할 텍스트

**반환값:** `void`

**예제:**
```javascript
editor.insertText('**굵은 텍스트**');
```

#### `wrapSelection(before, after)`

선택된 텍스트를 지정된 문자로 감쌉니다.

**매개변수:**
- `before` (string): 앞에 삽입할 문자
- `after` (string): 뒤에 삽입할 문자

**반환값:** `void`

**예제:**
```javascript
// 선택된 텍스트를 굵게 만들기
editor.wrapSelection('**', '**');
```

#### `getSelection()`

현재 선택된 텍스트 정보를 가져옵니다.

**매개변수:** 없음

**반환값:**
- `Object`: 선택 정보
  - `start` (number): 시작 위치
  - `end` (number): 끝 위치
  - `text` (string): 선택된 텍스트

**예제:**
```javascript
const selection = editor.getSelection();
console.log('선택된 텍스트:', selection.text);
```

### 이벤트

#### `editor:change`

에디터 내용 변경 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    content: string,
    timestamp: Date
  }
}
```

#### `editor:selection`

텍스트 선택 변경 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    selection: Object,
    timestamp: Date
  }
}
```

## SearchEngine

클라이언트 사이드 검색 기능을 제공하는 클래스입니다.

### 생성자

```javascript
const searchEngine = new SearchEngine();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `index` | Array | 검색 인덱스 |
| `searchCache` | Map | 검색 결과 캐시 |

### 메서드

#### `buildIndex(posts)`

포스트 데이터로부터 검색 인덱스를 구축합니다.

**매개변수:**
- `posts` (Array): 포스트 객체 배열

**반환값:** `void`

**예제:**
```javascript
searchEngine.buildIndex(posts);
```

#### `search(query)`

검색을 실행합니다.

**매개변수:**
- `query` (string): 검색어

**반환값:**
- `Array`: 검색 결과 배열
  - `id` (string): 포스트 ID
  - `score` (number): 관련도 점수

**예제:**
```javascript
const results = searchEngine.search('Jekyll 튜토리얼');
results.forEach(result => {
  console.log(`포스트 ID: ${result.id}, 점수: ${result.score}`);
});
```

#### `clearCache()`

검색 결과 캐시를 지웁니다.

**매개변수:** 없음

**반환값:** `void`

**예제:**
```javascript
searchEngine.clearCache();
```

### 이벤트

#### `search:completed`

검색 완료 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    query: string,
    results: Array,
    timestamp: Date
  }
}
```

## Router

클라이언트 사이드 라우팅을 처리하는 클래스입니다.

### 생성자

```javascript
const router = new Router();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `routes` | Map | 등록된 라우트 맵 |
| `currentRoute` | string | 현재 활성 라우트 |

### 메서드

#### `addRoute(path, handler)`

새로운 라우트를 등록합니다.

**매개변수:**
- `path` (string): 라우트 경로
- `handler` (Function): 라우트 핸들러 함수

**반환값:** `void`

**예제:**
```javascript
router.addRoute('/admin/posts', () => {
  // 포스트 목록 페이지 렌더링
});
```

#### `navigate(path)`

지정된 경로로 이동합니다.

**매개변수:**
- `path` (string): 이동할 경로

**반환값:** `void`

**예제:**
```javascript
router.navigate('/admin/posts/new');
```

#### `getCurrentRoute()`

현재 활성 라우트를 가져옵니다.

**매개변수:** 없음

**반환값:**
- `string`: 현재 라우트 경로

**예제:**
```javascript
const currentPath = router.getCurrentRoute();
```

### 이벤트

#### `route:changed`

라우트 변경 시 발생합니다.

**이벤트 데이터:**
```javascript
{
  detail: {
    from: string,
    to: string,
    timestamp: Date
  }
}
```

## FileSystemManager

파일 시스템 접근을 관리하는 클래스입니다.

### 생성자

```javascript
const fileManager = new FileSystemManager();
```

### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `supportsFileSystemAccess` | boolean | File System Access API 지원 여부 |

### 메서드

#### `readFile(path)`

파일을 읽습니다.

**매개변수:**
- `path` (string): 파일 경로

**반환값:**
- `Promise<string>`: 파일 내용

**예제:**
```javascript
const content = await fileManager.readFile('_posts/2025-01-01-post.md');
```

#### `writeFile(path, content)`

파일을 씁니다.

**매개변수:**
- `path` (string): 파일 경로
- `content` (string): 파일 내용

**반환값:**
- `Promise<boolean>`: 성공 시 `true`

**예제:**
```javascript
const success = await fileManager.writeFile('_posts/new-post.md', content);
```

#### `deleteFile(path)`

파일을 삭제합니다.

**매개변수:**
- `path` (string): 파일 경로

**반환값:**
- `Promise<boolean>`: 성공 시 `true`

**예제:**
```javascript
const deleted = await fileManager.deleteFile('_posts/old-post.md');
```

## 유틸리티 함수

### `debounce(func, delay)`

함수 호출을 지연시킵니다.

**매개변수:**
- `func` (Function): 지연시킬 함수
- `delay` (number): 지연 시간 (밀리초)

**반환값:**
- `Function`: 디바운스된 함수

**예제:**
```javascript
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

### `formatDate(date, format)`

날짜를 포맷팅합니다.

**매개변수:**
- `date` (Date): 포맷팅할 날짜
- `format` (string): 포맷 문자열

**반환값:**
- `string`: 포맷팅된 날짜 문자열

**예제:**
```javascript
const formatted = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss +0900');
```

### `generateId()`

고유 ID를 생성합니다.

**매개변수:** 없음

**반환값:**
- `string`: 고유 ID

**예제:**
```javascript
const id = generateId(); // 예: "post-1641234567890"
```

## 오류 처리

모든 API 메서드는 적절한 오류를 발생시킵니다. 오류 처리 시 다음 패턴을 사용하세요:

```javascript
try {
  const result = await apiMethod();
  // 성공 처리
} catch (error) {
  console.error('API 오류:', error.message);
  // 오류 처리
}
```

### 일반적인 오류 타입

- `AuthenticationError`: 인증 실패
- `ValidationError`: 데이터 유효성 검사 실패
- `FileSystemError`: 파일 시스템 접근 오류
- `NetworkError`: 네트워크 관련 오류

이 API 참조를 통해 Jekyll 어드민 사이트의 모든 기능을 프로그래밍 방식으로 활용할 수 있습니다.