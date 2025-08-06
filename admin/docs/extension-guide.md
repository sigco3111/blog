# 확장 가이드

## 개요

Jekyll 어드민 사이트는 모듈형 아키텍처로 설계되어 쉽게 확장할 수 있습니다. 이 가이드는 새로운 기능을 추가하고 기존 기능을 수정하는 방법을 설명합니다.

## 기본 확장 패턴

### 1. 새로운 모듈 생성

새로운 기능을 추가할 때는 별도의 모듈로 생성하는 것을 권장합니다.

```javascript
// admin/assets/js/modules/my-feature.js
class MyFeature {
  constructor(options = {}) {
    this.options = {
      // 기본 옵션
      enabled: true,
      autoInit: true,
      ...options
    };
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  init() {
    this.setupEventListeners();
    this.loadData();
  }

  setupEventListeners() {
    document.addEventListener('my-feature:trigger', (e) => {
      this.handleTrigger(e.detail);
    });
  }

  async loadData() {
    try {
      // 데이터 로드 로직
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error('MyFeature 오류:', error);
    document.dispatchEvent(new CustomEvent('ui:notification', {
      detail: {
        message: '기능 실행 중 오류가 발생했습니다.',
        type: 'error'
      }
    }));
  }
}

export default MyFeature;
```

### 2. 메인 애플리케이션에 통합

```javascript
// admin/assets/js/main.js에 추가
import MyFeature from './modules/my-feature.js';

// 애플리케이션 초기화 부분에 추가
const myFeature = new MyFeature({
  enabled: true,
  customOption: 'value'
});
```

## 구체적인 확장 예제

### 1. 새로운 에디터 도구 추가

마크다운 에디터에 새로운 도구를 추가하는 방법입니다.

```javascript
// modules/editor-extensions.js
class EditorExtensions {
  constructor(markdownEditor) {
    this.editor = markdownEditor;
    this.addCustomTools();
  }

  addCustomTools() {
    this.addTableTool();
    this.addCodeBlockTool();
    this.addImageTool();
  }

  addTableTool() {
    const toolbar = document.querySelector('.editor-toolbar');
    const tableButton = document.createElement('button');
    tableButton.innerHTML = '📊';
    tableButton.title = '표 삽입';
    tableButton.onclick = () => this.insertTable();
    toolbar.appendChild(tableButton);
  }

  insertTable() {
    const table = `
| 헤더1 | 헤더2 | 헤더3 |
|-------|-------|-------|
| 셀1   | 셀2   | 셀3   |
| 셀4   | 셀5   | 셀6   |
`;
    this.editor.insertText(table);
  }

  addCodeBlockTool() {
    const toolbar = document.querySelector('.editor-toolbar');
    const codeButton = document.createElement('button');
    codeButton.innerHTML = '💻';
    codeButton.title = '코드 블록';
    codeButton.onclick = () => this.insertCodeBlock();
    toolbar.appendChild(codeButton);
  }

  insertCodeBlock() {
    const language = prompt('프로그래밍 언어를 입력하세요:', 'javascript');
    if (language !== null) {
      const codeBlock = `\n\`\`\`${language}\n// 여기에 코드를 입력하세요\n\`\`\`\n`;
      this.editor.insertText(codeBlock);
    }
  }

  addImageTool() {
    const toolbar = document.querySelector('.editor-toolbar');
    const imageButton = document.createElement('button');
    imageButton.innerHTML = '🖼️';
    imageButton.title = '이미지 삽입';
    imageButton.onclick = () => this.insertImage();
    toolbar.appendChild(imageButton);
  }

  insertImage() {
    const url = prompt('이미지 URL을 입력하세요:');
    const alt = prompt('이미지 설명을 입력하세요:');
    
    if (url && alt) {
      const imageMarkdown = `![${alt}](${url})`;
      this.editor.insertText(imageMarkdown);
    }
  }
}

export default EditorExtensions;
```

### 2. 커스텀 검색 필터 추가

검색 기능에 새로운 필터를 추가하는 방법입니다.

```javascript
// modules/advanced-search.js
class AdvancedSearch {
  constructor(searchEngine) {
    this.searchEngine = searchEngine;
    this.filters = {
      dateRange: null,
      categories: [],
      tags: [],
      author: null
    };
    this.setupUI();
  }

  setupUI() {
    const searchContainer = document.querySelector('.search-container');
    const advancedPanel = this.createAdvancedPanel();
    searchContainer.appendChild(advancedPanel);
  }

  createAdvancedPanel() {
    const panel = document.createElement('div');
    panel.className = 'advanced-search-panel';
    panel.innerHTML = `
      <div class="filter-group">
        <label>날짜 범위:</label>
        <input type="date" id="date-from" />
        <input type="date" id="date-to" />
      </div>
      <div class="filter-group">
        <label>카테고리:</label>
        <select id="category-filter" multiple>
          <!-- 동적으로 채워짐 -->
        </select>
      </div>
      <div class="filter-group">
        <label>태그:</label>
        <input type="text" id="tag-filter" placeholder="태그 입력 (쉼표로 구분)" />
      </div>
      <div class="filter-group">
        <label>작성자:</label>
        <input type="text" id="author-filter" placeholder="작성자명" />
      </div>
      <button id="apply-filters">필터 적용</button>
      <button id="clear-filters">필터 초기화</button>
    `;

    this.setupFilterEvents(panel);
    return panel;
  }

  setupFilterEvents(panel) {
    panel.querySelector('#apply-filters').onclick = () => {
      this.applyFilters();
    };

    panel.querySelector('#clear-filters').onclick = () => {
      this.clearFilters();
    };
  }

  applyFilters() {
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const categories = Array.from(document.getElementById('category-filter').selectedOptions)
      .map(option => option.value);
    const tags = document.getElementById('tag-filter').value
      .split(',').map(tag => tag.trim()).filter(tag => tag);
    const author = document.getElementById('author-filter').value;

    this.filters = { dateFrom, dateTo, categories, tags, author };
    this.performAdvancedSearch();
  }

  performAdvancedSearch() {
    let results = this.searchEngine.posts;

    // 날짜 필터
    if (this.filters.dateFrom || this.filters.dateTo) {
      results = this.filterByDate(results);
    }

    // 카테고리 필터
    if (this.filters.categories.length > 0) {
      results = this.filterByCategories(results);
    }

    // 태그 필터
    if (this.filters.tags.length > 0) {
      results = this.filterByTags(results);
    }

    // 작성자 필터
    if (this.filters.author) {
      results = this.filterByAuthor(results);
    }

    this.displayResults(results);
  }

  filterByDate(posts) {
    return posts.filter(post => {
      const postDate = new Date(post.frontMatter.date);
      const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
      const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

      if (fromDate && postDate < fromDate) return false;
      if (toDate && postDate > toDate) return false;
      return true;
    });
  }

  filterByCategories(posts) {
    return posts.filter(post => {
      const postCategories = post.frontMatter.categories || [];
      return this.filters.categories.some(cat => postCategories.includes(cat));
    });
  }

  filterByTags(posts) {
    return posts.filter(post => {
      const postTags = post.frontMatter.tags || [];
      return this.filters.tags.some(tag => postTags.includes(tag));
    });
  }

  filterByAuthor(posts) {
    return posts.filter(post => {
      const author = post.frontMatter.author || '';
      return author.toLowerCase().includes(this.filters.author.toLowerCase());
    });
  }

  displayResults(results) {
    document.dispatchEvent(new CustomEvent('search:results', {
      detail: { results, filters: this.filters }
    }));
  }

  clearFilters() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('category-filter').selectedIndex = -1;
    document.getElementById('tag-filter').value = '';
    document.getElementById('author-filter').value = '';
    
    this.filters = {
      dateRange: null,
      categories: [],
      tags: [],
      author: null
    };
  }
}

export default AdvancedSearch;
```

### 3. 새로운 페이지 추가

완전히 새로운 관리 페이지를 추가하는 방법입니다.

```javascript
// modules/analytics-page.js
class AnalyticsPage {
  constructor(router) {
    this.router = router;
    this.data = null;
    this.registerRoute();
  }

  registerRoute() {
    this.router.addRoute('/admin/analytics', () => {
      this.render();
    });
  }

  async render() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="analytics-page">
        <h1>블로그 분석</h1>
        <div class="analytics-grid">
          <div class="stat-card">
            <h3>총 포스트 수</h3>
            <div class="stat-value" id="total-posts">-</div>
          </div>
          <div class="stat-card">
            <h3>이번 달 포스트</h3>
            <div class="stat-value" id="monthly-posts">-</div>
          </div>
          <div class="stat-card">
            <h3>가장 많이 사용된 태그</h3>
            <div class="stat-value" id="popular-tags">-</div>
          </div>
          <div class="stat-card">
            <h3>평균 포스트 길이</h3>
            <div class="stat-value" id="avg-length">-</div>
          </div>
        </div>
        <div class="charts-section">
          <div class="chart-container">
            <h3>월별 포스트 작성 현황</h3>
            <canvas id="monthly-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3>카테고리별 분포</h3>
            <canvas id="category-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    await this.loadAnalyticsData();
    this.updateStats();
    this.renderCharts();
  }

  async loadAnalyticsData() {
    // PostManager에서 데이터 가져오기
    const postManager = window.postManager; // 전역 참조
    const posts = await postManager.loadPosts();
    
    this.data = this.processAnalyticsData(posts);
  }

  processAnalyticsData(posts) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyPosts = posts.filter(post => {
      const postDate = new Date(post.frontMatter.date);
      return postDate.getMonth() === currentMonth && 
             postDate.getFullYear() === currentYear;
    });

    const tagCounts = {};
    const categoryCounts = {};
    let totalLength = 0;

    posts.forEach(post => {
      // 태그 집계
      (post.frontMatter.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      // 카테고리 집계
      (post.frontMatter.categories || []).forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // 길이 집계
      totalLength += post.content.length;
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalPosts: posts.length,
      monthlyPosts: monthlyPosts.length,
      popularTags,
      categoryCounts,
      averageLength: Math.round(totalLength / posts.length),
      monthlyData: this.getMonthlyData(posts)
    };
  }

  getMonthlyData(posts) {
    const monthlyData = new Array(12).fill(0);
    
    posts.forEach(post => {
      const month = new Date(post.frontMatter.date).getMonth();
      monthlyData[month]++;
    });

    return monthlyData;
  }

  updateStats() {
    document.getElementById('total-posts').textContent = this.data.totalPosts;
    document.getElementById('monthly-posts').textContent = this.data.monthlyPosts;
    document.getElementById('popular-tags').textContent = 
      this.data.popularTags.map(([tag]) => tag).join(', ');
    document.getElementById('avg-length').textContent = 
      this.data.averageLength + ' 글자';
  }

  renderCharts() {
    this.renderMonthlyChart();
    this.renderCategoryChart();
  }

  renderMonthlyChart() {
    const canvas = document.getElementById('monthly-chart');
    const ctx = canvas.getContext('2d');
    
    // 간단한 막대 차트 구현
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', 
                   '7월', '8월', '9월', '10월', '11월', '12월'];
    
    // 차트 그리기 로직 (Chart.js 등의 라이브러리 사용 권장)
    this.drawBarChart(ctx, months, this.data.monthlyData);
  }

  renderCategoryChart() {
    const canvas = document.getElementById('category-chart');
    const ctx = canvas.getContext('2d');
    
    const categories = Object.keys(this.data.categoryCounts);
    const counts = Object.values(this.data.categoryCounts);
    
    // 파이 차트 그리기 로직
    this.drawPieChart(ctx, categories, counts);
  }

  drawBarChart(ctx, labels, data) {
    // 간단한 막대 차트 구현
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const maxValue = Math.max(...data);
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / labels.length;
    const barMaxHeight = height - 40;
    
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * barMaxHeight;
      const x = index * barWidth;
      const y = height - barHeight - 20;
      
      ctx.fillStyle = '#007cba';
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barWidth/2, height - 5);
      ctx.fillText(value.toString(), x + barWidth/2, y - 5);
    });
  }

  drawPieChart(ctx, labels, data) {
    // 간단한 파이 차트 구현
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const total = data.reduce((sum, value) => sum + value, 0);
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];
    
    let currentAngle = 0;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // 라벨 그리기
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 15);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 15);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  }
}

export default AnalyticsPage;
```

### 4. 플러그인 시스템 구현

확장 가능한 플러그인 시스템을 만드는 방법입니다.

```javascript
// modules/plugin-system.js
class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
  }

  // 플러그인 등록
  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`플러그인 '${name}'이 이미 등록되어 있습니다.`);
      return false;
    }

    this.plugins.set(name, plugin);
    
    // 플러그인 초기화
    if (typeof plugin.init === 'function') {
      plugin.init(this);
    }

    console.log(`플러그인 '${name}'이 등록되었습니다.`);
    return true;
  }

  // 플러그인 제거
  unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      // 플러그인 정리
      if (typeof plugin.destroy === 'function') {
        plugin.destroy();
      }
      
      this.plugins.delete(name);
      console.log(`플러그인 '${name}'이 제거되었습니다.`);
      return true;
    }
    return false;
  }

  // 훅 등록
  addHook(hookName, callback, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({ callback, priority });
    
    // 우선순위로 정렬
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  }

  // 훅 실행
  executeHook(hookName, data = null) {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return data;

    let result = data;
    
    for (const hook of hooks) {
      try {
        const hookResult = hook.callback(result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`훅 '${hookName}' 실행 중 오류:`, error);
      }
    }

    return result;
  }

  // 모든 플러그인 목록
  getPlugins() {
    return Array.from(this.plugins.keys());
  }

  // 플러그인 정보
  getPluginInfo(name) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.info) {
      return plugin.info;
    }
    return null;
  }
}

// 플러그인 예제
class ExamplePlugin {
  constructor() {
    this.info = {
      name: 'Example Plugin',
      version: '1.0.0',
      description: '예제 플러그인입니다.',
      author: 'Developer'
    };
  }

  init(pluginSystem) {
    this.pluginSystem = pluginSystem;
    
    // 훅 등록
    pluginSystem.addHook('post:beforeSave', this.beforeSavePost.bind(this));
    pluginSystem.addHook('post:afterSave', this.afterSavePost.bind(this));
    
    // UI 확장
    this.addMenuItems();
  }

  beforeSavePost(postData) {
    // 포스트 저장 전 처리
    console.log('포스트 저장 전 처리:', postData.title);
    
    // 자동 태그 추가
    if (!postData.frontMatter.tags) {
      postData.frontMatter.tags = [];
    }
    
    if (!postData.frontMatter.tags.includes('auto-tagged')) {
      postData.frontMatter.tags.push('auto-tagged');
    }
    
    return postData;
  }

  afterSavePost(postData) {
    // 포스트 저장 후 처리
    console.log('포스트 저장 완료:', postData.title);
    
    // 알림 표시
    document.dispatchEvent(new CustomEvent('ui:notification', {
      detail: {
        message: `포스트 "${postData.title}"이 저장되었습니다.`,
        type: 'success'
      }
    }));
  }

  addMenuItems() {
    // 네비게이션에 메뉴 항목 추가
    const nav = document.querySelector('.admin-nav');
    if (nav) {
      const menuItem = document.createElement('li');
      menuItem.innerHTML = '<a href="#" data-route="/admin/example">예제 기능</a>';
      nav.appendChild(menuItem);
    }
  }

  destroy() {
    // 플러그인 정리
    console.log('Example Plugin 정리 중...');
  }
}

export { PluginSystem, ExamplePlugin };
```

## 스타일링 확장

### CSS 커스터마이징

```css
/* admin/assets/css/extensions.css */

/* 새로운 컴포넌트 스타일 */
.analytics-page {
  padding: 20px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #007cba;
  margin-top: 10px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container canvas {
  width: 100%;
  height: 300px;
}

/* 고급 검색 패널 */
.advanced-search-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-top: 10px;
}

.filter-group {
  margin-bottom: 15px;
}

.filter-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.filter-group input,
.filter-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
}
```

## 테스트 작성

### 확장 기능 테스트

```javascript
// tests/unit/analytics-page.test.js
describe('AnalyticsPage', () => {
  let analyticsPage;
  let mockRouter;
  let mockPosts;

  beforeEach(() => {
    mockRouter = {
      addRoute: jest.fn()
    };
    
    mockPosts = [
      {
        frontMatter: {
          title: 'Test Post 1',
          date: '2025-01-15',
          tags: ['javascript', 'tutorial'],
          categories: ['programming']
        },
        content: 'Test content 1'
      },
      {
        frontMatter: {
          title: 'Test Post 2',
          date: '2025-02-10',
          tags: ['css', 'design'],
          categories: ['web']
        },
        content: 'Test content 2'
      }
    ];

    analyticsPage = new AnalyticsPage(mockRouter);
  });

  test('should register route', () => {
    expect(mockRouter.addRoute).toHaveBeenCalledWith(
      '/admin/analytics',
      expect.any(Function)
    );
  });

  test('should process analytics data correctly', () => {
    const data = analyticsPage.processAnalyticsData(mockPosts);
    
    expect(data.totalPosts).toBe(2);
    expect(data.popularTags).toEqual([
      ['javascript', 1],
      ['tutorial', 1],
      ['css', 1],
      ['design', 1]
    ]);
  });
});
```

## 배포 및 패키징

### 확장 기능 패키징

확장 기능을 별도 패키지로 만들어 배포할 수 있습니다.

```javascript
// extensions/my-extension/index.js
import AnalyticsPage from './analytics-page.js';
import AdvancedSearch from './advanced-search.js';

class MyExtension {
  constructor() {
    this.name = 'My Extension';
    this.version = '1.0.0';
  }

  install(adminApp) {
    // 확장 기능 설치
    const analyticsPage = new AnalyticsPage(adminApp.router);
    const advancedSearch = new AdvancedSearch(adminApp.searchEngine);
    
    // 스타일시트 로드
    this.loadStyles();
    
    console.log(`${this.name} v${this.version} 설치 완료`);
  }

  loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './extensions/my-extension/styles.css';
    document.head.appendChild(link);
  }
}

export default MyExtension;
```

### 확장 기능 사용

```javascript
// main.js에서 확장 기능 로드
import MyExtension from './extensions/my-extension/index.js';

// 애플리케이션 초기화 후
const myExtension = new MyExtension();
myExtension.install(adminApp);
```

## 모범 사례

### 1. 모듈 설계 원칙
- 단일 책임 원칙 준수
- 느슨한 결합, 강한 응집
- 이벤트 기반 통신 사용

### 2. 성능 고려사항
- 지연 로딩 활용
- 메모리 누수 방지
- 효율적인 DOM 조작

### 3. 사용자 경험
- 일관된 UI/UX 패턴
- 접근성 고려
- 오류 처리 및 피드백

### 4. 유지보수성
- 명확한 문서화
- 테스트 코드 작성
- 버전 관리

이 확장 가이드를 통해 Jekyll 어드민 사이트에 새로운 기능을 추가하고 기존 기능을 개선할 수 있습니다.