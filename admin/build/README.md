# 빌드 및 배포 가이드

Jekyll 어드민 사이트의 빌드, 최적화, 배포를 위한 도구와 설정 파일들입니다.

## 파일 구조

```
build/
├── optimize.js              # 프로덕션 빌드 최적화 스크립트
├── deploy.yml              # GitHub Actions 워크플로우
├── package.json            # NPM 패키지 설정
├── lighthouse.config.js    # Lighthouse CI 설정
├── performance-budget.json # 성능 예산 설정
├── webpack.config.js       # Webpack 설정 (선택사항)
└── README.md              # 이 파일
```

## 빌드 프로세스

### 1. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run serve

# 테스트 실행
npm test

# 코드 린팅
npm run lint
```

### 2. 프로덕션 빌드

```bash
# 최적화된 빌드 생성
npm run build

# 빌드 + 테스트 + 성능 검사
npm run deploy
```

### 3. 빌드 최적화 기능

`optimize.js` 스크립트는 다음 최적화를 수행합니다:

- **JavaScript 최소화**: 주석 제거, 공백 압축
- **CSS 최소화**: 불필요한 공백 및 주석 제거
- **HTML 최소화**: 공백 압축
- **파일명 해싱**: 캐시 버스팅을 위한 해시 추가
- **번들 생성**: 모듈들을 하나의 번들 파일로 결합
- **매니페스트 생성**: 파일 매핑 정보 생성

#### 사용법

```bash
# 기본 최적화
node build/optimize.js

# 개발 모드 (해싱 비활성화)
node build/optimize.js --dev

# 소스맵 생성
node build/optimize.js --sourcemap
```

#### 출력 구조

```
dist/
├── index.html
├── assets/
│   ├── js/
│   │   ├── main.a1b2c3d4.js
│   │   └── bundle.e5f6g7h8.js
│   └── css/
│       └── admin.i9j0k1l2.css
├── docs/
├── tests/
├── manifest.json
└── build-report.md
```

## GitHub Actions 배포

### 설정 방법

1. `.github/workflows/` 디렉토리에 `deploy.yml` 복사
2. GitHub 저장소 Settings > Secrets에서 환경변수 설정:
   - `ADMIN_ID`: 관리자 ID
   - `ADMIN_PW`: 관리자 비밀번호
   - `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI 토큰 (선택)
   - `SLACK_WEBHOOK`: Slack 알림 웹훅 (선택)

### 워크플로우 단계

1. **빌드 및 테스트**: 코드 빌드, 단위/통합 테스트 실행
2. **보안 검사**: 의존성 취약점 및 시크릿 검사
3. **성능 테스트**: Lighthouse를 통한 성능 측정
4. **GitHub Pages 배포**: 최적화된 사이트 배포
5. **배포 후 검증**: 사이트 가용성 확인
6. **알림**: 배포 결과 Slack 알림

### 수동 배포

```bash
# GitHub Actions 워크플로우 수동 실행
gh workflow run deploy-admin.yml
```

## 성능 최적화

### Lighthouse CI

성능, 접근성, SEO 등을 자동으로 측정합니다.

```bash
# 로컬에서 Lighthouse 실행
npm run lighthouse

# 성능 예산 확인
lhci autorun --config=build/lighthouse.config.js
```

### 성능 예산

`performance-budget.json`에서 리소스 크기 제한을 설정합니다:

- **JavaScript**: 150KB 이하
- **CSS**: 50KB 이하
- **이미지**: 200KB 이하
- **전체**: 500KB 이하

### 번들 크기 분석

```bash
# 번들 크기 확인
npm run analyze

# Webpack Bundle Analyzer (Webpack 사용 시)
ANALYZE=true npm run build
```

## 고급 빌드 설정

### Webpack 사용 (선택사항)

더 고급 번들링이 필요한 경우 Webpack을 사용할 수 있습니다:

```bash
# Webpack 의존성 설치
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env

# Webpack으로 빌드
npx webpack --config build/webpack.config.js
```

### 환경별 설정

#### 개발 환경
```bash
NODE_ENV=development npm run build
```

#### 프로덕션 환경
```bash
NODE_ENV=production npm run build
```

#### GitHub Pages
```bash
GITHUB_PAGES=true npm run build
```

## 배포 최적화 팁

### 1. 캐시 전략

해시된 파일명을 활용하여 장기 캐시 설정:

```nginx
# Nginx 설정 예시
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Gzip 압축

웹 서버에서 Gzip 압축 활성화:

```apache
# Apache .htaccess
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 3. CDN 활용

정적 파일을 CDN을 통해 제공:

```html
<!-- CDN 링크 예시 -->
<link rel="stylesheet" href="https://cdn.example.com/admin/assets/css/admin.css">
<script src="https://cdn.example.com/admin/assets/js/bundle.js"></script>
```

### 4. 프리로딩

중요한 리소스 프리로딩:

```html
<link rel="preload" href="/admin/assets/js/bundle.js" as="script">
<link rel="preload" href="/admin/assets/css/admin.css" as="style">
```

## 모니터링

### 성능 모니터링

- **Lighthouse CI**: 지속적인 성능 측정
- **Web Vitals**: 핵심 웹 바이탈 추적
- **Bundle Analyzer**: 번들 크기 모니터링

### 오류 모니터링

```javascript
// 클라이언트 사이드 오류 추적
window.addEventListener('error', (event) => {
  // 오류 로깅 서비스로 전송
  console.error('JavaScript 오류:', event.error);
});
```

### 사용량 분석

```javascript
// 간단한 사용량 추적
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시간 측정
  const loadTime = performance.now();
  console.log('페이지 로드 시간:', loadTime + 'ms');
});
```

## 문제 해결

### 일반적인 빌드 오류

1. **의존성 오류**: `npm install` 재실행
2. **권한 오류**: `chmod +x build/optimize.js`
3. **메모리 부족**: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

### GitHub Actions 오류

1. **시크릿 설정 확인**: 환경변수가 올바르게 설정되었는지 확인
2. **권한 설정**: Pages 배포 권한 확인
3. **브랜치 보호**: 메인 브랜치 보호 규칙 확인

### 성능 이슈

1. **번들 크기**: 불필요한 의존성 제거
2. **이미지 최적화**: 이미지 압축 및 WebP 형식 사용
3. **코드 분할**: 동적 import 활용

이 가이드를 통해 Jekyll 어드민 사이트를 효율적으로 빌드하고 배포할 수 있습니다.