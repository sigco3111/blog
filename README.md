# Jekyll 블로그 관리 시스템

이 프로젝트는 Jekyll 기반의 블로그 시스템으로, 사용자 친화적인 관리자 인터페이스를 제공합니다. GitHub Pages와 함께 사용하기에 최적화되어 있으며, 마크다운 에디터, 파일 시스템 관리, 검색 기능 등 다양한 기능을 제공합니다.

## 주요 기능

- **사용자 인증**: 안전한 관리자 접근을 위한 인증 시스템
- **게시물 관리**: 게시물 생성, 수정, 삭제 및 검색 기능
- **파일 시스템 관리**: 웹 기반 파일 관리 인터페이스
- **마크다운 에디터**: 게시물 작성을 위한 직관적인 마크다운 에디터
- **검색 엔진**: 고급 검색 기능으로 콘텐츠 빠르게 찾기
- **반응형 디자인**: 모바일 및 데스크톱 환경 모두 지원
- **에러 처리 및 알림 시스템**: 사용자 친화적인 에러 메시지 및 알림

## 시작하기

### 필요 조건

- Ruby 2.6 이상
- Jekyll 4.2 이상
- 웹 브라우저 (최신 버전의 Chrome, Firefox, Safari, Edge 권장)

### 설치 방법

1. 저장소 클론하기:
   ```bash
   git clone https://github.com/sigco3111/blog.git
   cd blog
   ```

2. Jekyll 의존성 설치:
   ```bash
   bundle install
   ```

3. 로컬 서버 실행:
   ```bash
   bundle exec jekyll serve
   ```

4. 브라우저에서 확인:
   ```
   http://localhost:4000/blog
   ```

5. 관리자 페이지 접근:
   ```
   http://localhost:4000/blog/admin
   ```

## 디렉토리 구조

```
blog/
├── _config.yml               # Jekyll 설정 파일
├── _includes/                # 재사용 가능한 HTML 조각
├── _layouts/                 # 페이지 레이아웃 템플릿
├── _posts/                   # 블로그 게시물
├── admin/                    # 관리자 인터페이스
│   ├── assets/               # 관리자 페이지 자산
│   │   ├── css/             # 스타일시트
│   │   └── js/              # JavaScript 파일
│   │       └── modules/     # 모듈화된 JavaScript 컴포넌트
│   ├── docs/                # 개발자 및 사용자 문서
│   ├── tests/               # 테스트 파일
│   └── index.html           # 관리자 페이지 진입점
└── assets/                   # 블로그 프론트엔드 자산
    ├── css/                  # 스타일시트
    ├── image/                # 이미지 파일
    └── js/                   # JavaScript 파일
```

## 관리자 인터페이스 기능

### 인증 시스템
- 안전한 로그인 방식
- 세션 관리 및 자동 로그아웃

### 게시물 관리
- 마크다운 형식 지원
- 프론트매터 편집 기능
- 카테고리 및 태그 관리
- 실시간 미리보기

### 파일 시스템 관리
- 드래그 앤 드롭 파일 업로드
- 파일 시스템 접근 API 지원
- 폴더 구조 탐색 및 관리

### 검색 기능
- 고급 검색 엔진
- 결과 하이라이팅
- 자동 완성 제안

## 개발자 정보

### 기술 스택
- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **백엔드**: Jekyll, Ruby
- **배포**: GitHub Pages
- **테스트**: 자동화된 단위 및 통합 테스트

### 확장 및 커스터마이징
- 모듈식 구조로 쉽게 확장 가능
- 테마 및 레이아웃 커스터마이징 지원
- 플러그인 시스템 통합

## 문서

상세한 문서는 `admin/docs/` 디렉토리에서 찾을 수 있습니다:

- [사용자 가이드](admin/docs/user-guide.md)
- [개발자 가이드](admin/docs/developer-guide.md)
- [API 레퍼런스](admin/docs/api-reference.md)
- [자주 묻는 질문](admin/docs/faq.md)
- [문제 해결](admin/docs/troubleshooting.md)
- [확장 가이드](admin/docs/extension-guide.md)

## 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다.

## 기여하기

기여는 언제나 환영합니다! 버그 리포트, 기능 요청 또는 풀 리퀘스트를 통해 이 프로젝트에 기여할 수 있습니다.

1. 저장소 포크하기
2. 기능 브랜치 만들기 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋하기 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하기 (`git push origin feature/amazing-feature`)
5. 풀 리퀘스트 열기

## 문의처

질문이나 제안이 있으시면 다음 연락처로 문의해주세요:

- 이메일: sigco3111k@gmail.com
- GitHub: [https://github.com/sigco3111](https://github.com/sigco3111)