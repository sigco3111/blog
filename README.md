# Jekyll 블로그 관리 시스템

이 프로젝트는 Jekyll 기반의 블로그 시스템으로, 사용자 친화적인 인터페이스를 제공합니다. GitHub Pages와 함께 사용하기에 최적화되어 있으며, 카테고리 시스템, 대시보드, 검색 기능 등 다양한 기능을 제공합니다.

## 주요 기능

- **카테고리 시스템**: 콘텐츠 분류 및 카테고리별 조회 지원
- **대시보드**: 블로그 통계 및 주요 정보 대시보드 제공
- **검색 엔진**: 고급 검색 기능으로 콘텐츠 빠르게 찾기
- **반응형 디자인**: 모바일 및 데스크톱 환경 모두 지원

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

5. 대시보드 페이지 접근:
   ```
   http://localhost:4000/blog/dashboard
   ```

6. 캐시 페이지 정리:
   ```
   rm -rf _site .jekyll-cache
   ```

### GitHub Pages 배포

이 블로그는 GitHub Actions를 사용하여 자동으로 배포됩니다.

1. **GitHub 저장소 설정**:
   - GitHub 저장소의 Settings > Pages로 이동
   - Source를 "GitHub Actions"로 설정

2. **자동 배포**:
   - `main` 또는 `master` 브랜치에 푸시하면 자동으로 배포됩니다
   - `.github/workflows/jekyll.yml` 파일이 배포를 담당합니다

3. **카테고리 페이지 문제 해결**:
   - GitHub Pages는 사용자 정의 플러그인을 지원하지 않습니다
   - 모든 카테고리 페이지는 `category/` 폴더에 수동으로 생성되어 있습니다
   - 새 카테고리 추가 시 해당 카테고리의 `.md` 파일을 생성해야 합니다

4. **새 카테고리 추가 방법**:
   ```bash
   # 예: "새카테고리" 추가
   cat > category/새카테고리.md << EOF
   ---
   layout: category
   title: 새카테고리
   category: 새카테고리
   permalink: /category/새카테고리/
   ---
   EOF
   ```
   
## 디렉토리 구조

```
blog/
├── _config.yml               # Jekyll 설정 파일
├── _includes/                # 재사용 가능한 HTML 조각
├── _layouts/                 # 페이지 레이아웃 템플릿
│   ├── category.html        # 카테고리 레이아웃 템플릿
│   ├── dashboard.html       # 대시보드 레이아웃 템플릿
│   └── default.html         # 기본 레이아웃 템플릿
├── _plugins/                 # Jekyll 플러그인
│   └── category_generator.rb # 카테고리 생성 플러그인
├── _posts/                   # 블로그 게시물
├── assets/                   # 블로그 프론트엔드 자산
│   ├── css/                  # 스타일시트
│   ├── image/                # 이미지 파일
│   │   └── favicon/         # 파비콘 이미지 및 관련 파일
│   └── js/                   # JavaScript 파일
├── categories.md             # 카테고리 페이지
└── dashboard.md              # 대시보드 페이지
```

## 주요 기능 상세 설명

### 카테고리 시스템
- 포스트 카테고리 자동 생성 및 관리
- 카테고리별 포스트 목록 표시
- 사용자 친화적인 카테고리 탐색 인터페이스

### 대시보드
- 블로그 통계 정보 표시
- 최근 포스트 및 카테고리 요약
- 방문자 트래픽 정보 시각화

### 검색 기능
- 블로그 내 콘텐츠 전체 검색
- 검색 결과 하이라이팅
- 키워드 기반 빠른 콘텐츠 접근

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
- 파비콘 커스터마이징 가능

### 파비콘 설정 및 생성
블로그는 다양한 디바이스에 최적화된 파비콘을 제공합니다. 파비콘 파일은 `assets/image/favicon/` 디렉토리에 위치하고 있습니다.

현재 제공되는 파일:
- `favicon.svg`: 벡터 기반 파비콘 (모던 브라우저 지원)
- `favicon.ico`: 전통적인 파비콘 파일 (모든 브라우저 지원)
- `site.webmanifest`: 웹 앱 매니페스트 파일

파비콘을 커스터마이징하려면 다음 단계를 따르세요:
1. 원하는 이미지로 `assets/image/favicon/favicon.svg` 파일을 교체합니다.
2. [Favicon Generator](https://realfavicongenerator.net/)와 같은 도구를 사용하여 다양한 크기의 파비콘 파일을 생성합니다.
3. 생성된 파일을 `assets/image/favicon/` 디렉토리에 저장합니다.
4. 필요에 따라 `site.webmanifest` 파일을 업데이트합니다.

## 문서

Jekyll 공식 문서를 참고하세요:

- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [GitHub Pages 문서](https://docs.github.com/ko/pages)
- [Markdown 가이드](https://www.markdownguide.org/)

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

## 테스트

질문이나 제안이 있으시면 다음 연락처로 문의해주세요:

- 이메일: sigco3111k@gmail.com
- GitHub: [https://github.com/sigco3111](https://github.com/sigco3111)
