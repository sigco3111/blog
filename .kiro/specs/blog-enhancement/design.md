# Design Document

## Overview

이 설계는 Jekyll 블로그 사이트의 사용자 경험을 개선하기 위한 세 가지 주요 기능을 구현합니다:

1. **어드민 사이트 제거**: 기존 admin 디렉토리와 관련 설정을 완전히 제거하여 사이트 구조를 단순화
2. **카테고리별 블로그 분류**: 포스트를 카테고리별로 정리하고 각 카테고리의 포스트 수를 표시하는 기능
3. **사이트 데이터 대시보드**: 블로그 통계와 데이터를 시각적으로 표시하는 대시보드 페이지

Jekyll의 Liquid 템플릿 엔진과 기존 minima 테마를 활용하여 구현하며, 추가적인 외부 의존성 없이 순수 Jekyll 기능만으로 구현합니다.

## Architecture

### 전체 구조
```
├── _config.yml (어드민 설정 제거, 새로운 페이지 설정 추가)
├── _includes/
│   ├── header.html (네비게이션에 카테고리, 대시보드 링크 추가)
│   └── category-chart.html (카테고리 차트 컴포넌트)
├── _layouts/
│   ├── category.html (개별 카테고리 페이지 레이아웃)
│   └── dashboard.html (대시보드 페이지 레이아웃)
├── _sass/
│   └── _custom.scss (카테고리 및 대시보드 스타일)
├── categories.md (카테고리 목록 페이지)
├── dashboard.md (대시보드 페이지)
├── _plugins/
│   └── category_generator.rb (카테고리별 페이지 자동 생성)
└── assets/
    ├── css/
    │   └── dashboard.css (대시보드 전용 스타일)
    └── js/
        └── dashboard.js (대시보드 차트 및 인터랙션)
```

### 데이터 흐름
1. **포스트 데이터**: Jekyll이 `_posts` 디렉토리의 마크다운 파일들을 파싱하여 `site.posts` 컬렉션 생성
2. **카테고리 추출**: Liquid 템플릿에서 `site.categories`를 통해 카테고리별 포스트 그룹핑
3. **통계 계산**: 대시보드에서 Liquid 필터를 사용하여 실시간 통계 계산
4. **페이지 렌더링**: Jekyll 빌드 시 정적 HTML 파일로 생성

## Components and Interfaces

### 1. 어드민 사이트 제거 컴포넌트

**목적**: 기존 어드민 관련 파일과 설정을 완전히 제거

**구현 방식**:
- `_config.yml`에서 admin 관련 설정 제거
- `admin/` 디렉토리 전체 삭제
- `_site/admin/` 빌드 결과물 제거
- `.gitignore`에서 admin 관련 항목 정리

### 2. 카테고리 시스템

#### 2.1 카테고리 목록 페이지 (`categories.md`)
```yaml
---
layout: page
title: 카테고리
permalink: /categories/
---
```

**기능**:
- 모든 카테고리 목록 표시
- 각 카테고리별 포스트 수 표시
- 카테고리별 페이지로의 링크 제공

#### 2.2 개별 카테고리 페이지 레이아웃 (`_layouts/category.html`)
**입력**: 카테고리 이름 (`page.category`)
**출력**: 해당 카테고리의 모든 포스트 목록

**기능**:
- 카테고리명 표시
- 해당 카테고리의 포스트 수 표시
- 포스트 목록 (제목, 날짜, 요약)
- 시간순 정렬 (최신순)

#### 2.3 카테고리 페이지 자동 생성 플러그인 (`_plugins/category_generator.rb`)
**목적**: 각 카테고리별로 개별 페이지를 자동 생성

**동작 방식**:
1. 모든 포스트의 카테고리 수집
2. 각 카테고리별로 페이지 객체 생성
3. `/category/[카테고리명]/` URL 패턴으로 페이지 생성

### 3. 대시보드 시스템

#### 3.1 대시보드 페이지 (`dashboard.md`)
```yaml
---
layout: dashboard
title: 대시보드
permalink: /dashboard/
---
```

#### 3.2 대시보드 레이아웃 (`_layouts/dashboard.html`)
**구성 요소**:

1. **기본 통계 카드**
   - 전체 포스트 수
   - 전체 카테고리 수
   - 평균 포스트 길이
   - 총 단어 수

2. **카테고리 분포 차트**
   - 카테고리별 포스트 수를 시각화
   - CSS Grid와 Flexbox를 활용한 바 차트

3. **최근 포스트 목록**
   - 최근 5개 포스트 표시
   - 제목, 날짜, 카테고리 정보

4. **월별 포스트 통계**
   - 월별 포스트 작성 수 표시
   - 시간순 정렬

5. **인기 카테고리 TOP 5**
   - 포스트 수 기준 상위 5개 카테고리

#### 3.3 대시보드 스타일링 (`assets/css/dashboard.css`)
**디자인 원칙**:
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 카드 기반 레이아웃
- 시각적 계층 구조
- 접근성 고려 (색상 대비, 키보드 네비게이션)

**주요 컴포넌트**:
- `.dashboard-grid`: CSS Grid 기반 레이아웃
- `.stat-card`: 통계 카드 스타일
- `.chart-container`: 차트 컨테이너
- `.recent-posts`: 최근 포스트 목록 스타일

#### 3.4 대시보드 인터랙션 (`assets/js/dashboard.js`)
**기능**:
- 차트 애니메이션 효과
- 통계 카드 호버 효과
- 반응형 차트 크기 조정
- 데이터 로딩 상태 표시

### 4. 네비게이션 업데이트

#### 4.1 헤더 수정 (`_includes/header.html`)
**추가 항목**:
- "카테고리" 링크 (`/categories/`)
- "대시보드" 링크 (`/dashboard/`)

**구현 방식**:
```html
<div class="trigger">
  <!-- 기존 페이지 링크들 -->
  {%- for path in page_paths -%}
    <!-- ... 기존 코드 ... -->
  {%- endfor -%}
  
  <!-- 새로운 링크들 -->
  <a class="page-link" href="{{ '/categories/' | relative_url }}">카테고리</a>
  <a class="page-link" href="{{ '/dashboard/' | relative_url }}">대시보드</a>
</div>
```

## Data Models

### 1. 포스트 데이터 구조
```yaml
---
layout: post
title: "포스트 제목"
date: 2025-08-05 13:27:35 +0900
categories: [카테고리1, 카테고리2]
tags: [태그1, 태그2]
excerpt: "포스트 요약"
---
```

### 2. 카테고리 데이터 구조
Jekyll의 `site.categories` 해시:
```ruby
{
  "바이브코딩" => [post1, post2, ...],
  "개발" => [post3, post4, ...],
  "일상" => [post5, post6, ...]
}
```

### 3. 통계 데이터 구조
Liquid 템플릿에서 계산되는 통계:
```liquid
{% assign total_posts = site.posts | size %}
{% assign total_categories = site.categories | size %}
{% assign total_words = 0 %}
{% for post in site.posts %}
  {% assign words = post.content | number_of_words %}
  {% assign total_words = total_words | plus: words %}
{% endfor %}
{% assign avg_words = total_words | divided_by: total_posts %}
```

## Error Handling

### 1. 카테고리 관련 오류 처리

**빈 카테고리 처리**:
```liquid
{% if site.categories[category].size > 0 %}
  <!-- 카테고리 내용 표시 -->
{% else %}
  <p>이 카테고리에는 아직 포스트가 없습니다.</p>
{% endif %}
```

**미분류 포스트 처리**:
```liquid
{% assign uncategorized_posts = site.posts | where: "categories", empty %}
{% if uncategorized_posts.size > 0 %}
  <h3>미분류</h3>
  <!-- 미분류 포스트 목록 -->
{% endif %}
```

### 2. 대시보드 데이터 오류 처리

**0으로 나누기 방지**:
```liquid
{% if total_posts > 0 %}
  {% assign avg_words = total_words | divided_by: total_posts %}
{% else %}
  {% assign avg_words = 0 %}
{% endif %}
```

**빈 데이터 처리**:
```liquid
{% if site.posts.size == 0 %}
  <div class="empty-state">
    <p>아직 작성된 포스트가 없습니다.</p>
  </div>
{% else %}
  <!-- 대시보드 내용 -->
{% endif %}
```

### 3. 빌드 오류 방지

**플러그인 오류 처리**:
```ruby
# _plugins/category_generator.rb
begin
  # 카테고리 페이지 생성 로직
rescue => e
  Jekyll.logger.error "Category Generator Error: #{e.message}"
end
```

**템플릿 오류 방지**:
```liquid
{% if page.category %}
  {% assign category_posts = site.categories[page.category] %}
  {% if category_posts %}
    <!-- 카테고리 포스트 표시 -->
  {% endif %}
{% endif %}
```

## Testing Strategy

### 1. 기능 테스트

**카테고리 시스템 테스트**:
- [ ] 모든 카테고리가 올바르게 표시되는지 확인
- [ ] 카테고리별 포스트 수가 정확한지 확인
- [ ] 카테고리 페이지 링크가 올바르게 작동하는지 확인
- [ ] 미분류 포스트가 올바르게 처리되는지 확인

**대시보드 테스트**:
- [ ] 모든 통계가 정확하게 계산되는지 확인
- [ ] 차트가 올바르게 렌더링되는지 확인
- [ ] 최근 포스트 목록이 올바른 순서로 표시되는지 확인
- [ ] 월별 통계가 정확한지 확인

**어드민 제거 테스트**:
- [ ] `/admin` 경로 접근 시 404 오류 발생 확인
- [ ] 빌드 결과물에 admin 관련 파일이 없는지 확인
- [ ] 사이트맵에 admin 페이지가 포함되지 않는지 확인

### 2. 성능 테스트

**빌드 성능**:
- [ ] 빌드 시간이 기존 대비 크게 증가하지 않는지 확인
- [ ] 메모리 사용량이 적정 수준인지 확인

**런타임 성능**:
- [ ] 페이지 로딩 속도 측정
- [ ] 대시보드 차트 렌더링 성능 확인

### 3. 반응형 테스트

**다양한 화면 크기 테스트**:
- [ ] 모바일 (320px~768px)
- [ ] 태블릿 (768px~1024px)
- [ ] 데스크톱 (1024px 이상)

**브라우저 호환성 테스트**:
- [ ] Chrome, Firefox, Safari, Edge에서 정상 작동 확인

### 4. 접근성 테스트

**웹 접근성 확인**:
- [ ] 키보드 네비게이션 가능 여부
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 비율 확인
- [ ] alt 텍스트 및 aria-label 적절성

### 5. 콘텐츠 테스트

**다양한 데이터 시나리오**:
- [ ] 포스트가 없는 경우
- [ ] 카테고리가 없는 포스트
- [ ] 매우 긴 카테고리명
- [ ] 특수문자가 포함된 카테고리명
- [ ] 대량의 포스트 (100개 이상)

### 6. 통합 테스트

**전체 워크플로우 테스트**:
- [ ] 새 포스트 작성 → 빌드 → 카테고리 페이지 업데이트 확인
- [ ] 카테고리 변경 → 빌드 → 대시보드 통계 업데이트 확인
- [ ] 포스트 삭제 → 빌드 → 관련 페이지 업데이트 확인