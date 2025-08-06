// Lighthouse CI 설정 파일
// Jekyll 어드민 사이트의 성능 및 품질 측정을 위한 설정

module.exports = {
  ci: {
    // 수집 설정
    collect: {
      // 테스트할 URL 목록
      url: [
        'http://localhost:8080/admin/',
        'http://localhost:8080/admin/index.html'
      ],
      
      // 정적 파일 디렉토리 (로컬 테스트용)
      staticDistDir: '../dist',
      
      // Chrome 실행 옵션
      chromeFlags: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--headless'
      ],
      
      // 수집 횟수 (평균값 계산용)
      numberOfRuns: 3,
      
      // 설정 파일
      settings: {
        // 모바일 시뮬레이션
        emulatedFormFactor: 'mobile',
        
        // 네트워크 스로틀링
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        
        // 감사 항목 설정
        onlyAudits: [
          // 성능
          'first-contentful-paint',
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'total-blocking-time',
          'speed-index',
          
          // 접근성
          'color-contrast',
          'heading-order',
          'html-has-lang',
          'image-alt',
          'label',
          'link-name',
          
          // 모범 사례
          'uses-https',
          'is-on-https',
          'uses-http2',
          'no-vulnerable-libraries',
          
          // SEO
          'document-title',
          'meta-description',
          'viewport',
          'robots-txt'
        ]
      }
    },
    
    // 업로드 설정 (GitHub Actions용)
    upload: {
      target: 'temporary-public-storage'
    },
    
    // 어설션 (품질 기준)
    assert: {
      assertions: {
        // 성능 점수 기준
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // 핵심 웹 바이탈
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // 접근성 필수 항목
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        
        // 보안
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error'
      }
    },
    
    // 서버 설정 (로컬 테스트용)
    server: {
      command: 'npm run serve',
      port: 8080,
      timeout: 30000
    }
  }
};

// 환경별 설정 오버라이드
if (process.env.CI) {
  // CI 환경에서는 GitHub Pages URL 사용
  module.exports.ci.collect.url = [
    process.env.GITHUB_PAGES_URL + '/admin/',
    process.env.GITHUB_PAGES_URL + '/admin/index.html'
  ];
  
  // CI에서는 서버 실행하지 않음
  delete module.exports.ci.server;
}

// 개발 환경 설정
if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 더 관대한 기준 적용
  module.exports.ci.assert.assertions = {
    'categories:performance': ['warn', { minScore: 0.6 }],
    'categories:accessibility': ['error', { minScore: 0.8 }],
    'categories:best-practices': ['warn', { minScore: 0.6 }],
    'categories:seo': ['warn', { minScore: 0.6 }]
  };
}