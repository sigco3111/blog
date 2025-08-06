#!/usr/bin/env node

/**
 * Jekyll 어드민 사이트 프로덕션 빌드 최적화 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. JavaScript 파일 최소화
 * 2. CSS 파일 최소화
 * 3. 이미지 최적화
 * 4. 캐시 버스팅을 위한 파일명 해싱
 * 5. 번들 크기 분석
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BuildOptimizer {
  constructor() {
    this.config = {
      sourceDir: path.join(__dirname, '..'),
      outputDir: path.join(__dirname, '../dist'),
      assetsDir: 'assets',
      minifyJS: true,
      minifyCSS: true,
      generateSourceMaps: false,
      hashFiles: true
    };
    
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      files: []
    };
  }

  async optimize() {
    console.log('🚀 Jekyll 어드민 사이트 빌드 최적화 시작...\n');
    
    try {
      await this.createOutputDirectory();
      await this.copyStaticFiles();
      await this.optimizeJavaScript();
      await this.optimizeCSS();
      await this.optimizeHTML();
      await this.generateManifest();
      await this.generateReport();
      
      console.log('✅ 빌드 최적화 완료!\n');
      this.printStats();
    } catch (error) {
      console.error('❌ 빌드 최적화 실패:', error.message);
      process.exit(1);
    }
  }

  async createOutputDirectory() {
    if (fs.existsSync(this.config.outputDir)) {
      await this.removeDirectory(this.config.outputDir);
    }
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    console.log('📁 출력 디렉토리 생성 완료');
  }

  async removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      fs.rmdirSync(dir);
    }
  }

  async copyStaticFiles() {
    const staticFiles = [
      'index.html',
      'test-*.html',
      'docs/',
      'tests/'
    ];

    for (const pattern of staticFiles) {
      await this.copyFiles(pattern);
    }
    
    console.log('📋 정적 파일 복사 완료');
  }

  async copyFiles(pattern) {
    const sourceDir = this.config.sourceDir;
    
    if (pattern.endsWith('/')) {
      // 디렉토리 복사
      const dirName = pattern.slice(0, -1);
      const sourcePath = path.join(sourceDir, dirName);
      const targetPath = path.join(this.config.outputDir, dirName);
      
      if (fs.existsSync(sourcePath)) {
        await this.copyDirectory(sourcePath, targetPath);
      }
    } else if (pattern.includes('*')) {
      // 와일드카드 패턴
      const files = fs.readdirSync(sourceDir);
      const regex = new RegExp(pattern.replace('*', '.*'));
      
      for (const file of files) {
        if (regex.test(file)) {
          const sourcePath = path.join(sourceDir, file);
          const targetPath = path.join(this.config.outputDir, file);
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    } else {
      // 단일 파일
      const sourcePath = path.join(sourceDir, pattern);
      const targetPath = path.join(this.config.outputDir, pattern);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  async copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  async optimizeJavaScript() {
    console.log('⚡ JavaScript 최적화 중...');
    
    const jsFiles = this.findFiles(
      path.join(this.config.sourceDir, 'assets/js'),
      '.js'
    );

    const assetsDir = path.join(this.config.outputDir, 'assets/js');
    fs.mkdirSync(assetsDir, { recursive: true });

    for (const file of jsFiles) {
      await this.optimizeJSFile(file, assetsDir);
    }

    // 번들 파일 생성
    await this.createJSBundle(jsFiles, assetsDir);
    
    console.log(`📦 ${jsFiles.length}개 JavaScript 파일 최적화 완료`);
  }

  async optimizeJSFile(filePath, outputDir) {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalSize = content.length;
    
    let optimizedContent = content;
    
    if (this.config.minifyJS) {
      // 간단한 JavaScript 최소화
      optimizedContent = this.minifyJS(content);
    }

    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    
    if (this.config.hashFiles) {
      const hash = this.generateHash(optimizedContent);
      const hashedName = fileName.replace('.js', `.${hash}.js`);
      const hashedPath = path.join(outputDir, hashedName);
      fs.writeFileSync(hashedPath, optimizedContent);
      
      this.stats.files.push({
        original: fileName,
        hashed: hashedName,
        originalSize,
        optimizedSize: optimizedContent.length
      });
    } else {
      fs.writeFileSync(outputPath, optimizedContent);
    }

    this.stats.originalSize += originalSize;
    this.stats.optimizedSize += optimizedContent.length;
  }

  minifyJS(content) {
    // 간단한 JavaScript 최소화
    return content
      // 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // 불필요한 공백 제거
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, ';}')
      .replace(/{\s*/g, '{')
      .replace(/}\s*/g, '}')
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
      .replace(/;\s*/g, ';')
      .trim();
  }

  async createJSBundle(jsFiles, outputDir) {
    const moduleFiles = jsFiles.filter(file => 
      file.includes('/modules/') && !file.includes('test')
    );

    let bundleContent = '';
    
    // 의존성 순서대로 번들링
    const orderedModules = [
      'utils.js',
      'auth.js',
      'file-system-manager.js',
      'post-manager.js',
      'config-manager.js',
      'markdown-editor.js',
      'search-engine.js',
      'router.js',
      'ui.js',
      'error-handler.js',
      'loading-manager.js',
      'notification-system.js',
      'file-manager-ui.js'
    ];

    for (const moduleName of orderedModules) {
      const moduleFile = moduleFiles.find(file => file.endsWith(moduleName));
      if (moduleFile) {
        const content = fs.readFileSync(moduleFile, 'utf8');
        bundleContent += `\n// === ${moduleName} ===\n`;
        bundleContent += this.wrapModule(content, moduleName);
      }
    }

    // 메인 파일 추가
    const mainFile = jsFiles.find(file => file.endsWith('main.js'));
    if (mainFile) {
      const content = fs.readFileSync(mainFile, 'utf8');
      bundleContent += '\n// === main.js ===\n';
      bundleContent += content;
    }

    if (this.config.minifyJS) {
      bundleContent = this.minifyJS(bundleContent);
    }

    const bundleName = this.config.hashFiles 
      ? `bundle.${this.generateHash(bundleContent)}.js`
      : 'bundle.js';
    
    const bundlePath = path.join(outputDir, bundleName);
    fs.writeFileSync(bundlePath, bundleContent);

    console.log(`📦 번들 파일 생성: ${bundleName}`);
  }

  wrapModule(content, moduleName) {
    // ES6 모듈을 IIFE로 변환
    const className = this.extractClassName(content);
    
    return `
(function() {
  ${content.replace(/export default \w+;?/, '')}
  window.${className} = ${className};
})();
`;
  }

  extractClassName(content) {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1] : 'Module';
  }

  async optimizeCSS() {
    console.log('🎨 CSS 최적화 중...');
    
    const cssFiles = this.findFiles(
      path.join(this.config.sourceDir, 'assets/css'),
      '.css'
    );

    const assetsDir = path.join(this.config.outputDir, 'assets/css');
    fs.mkdirSync(assetsDir, { recursive: true });

    for (const file of cssFiles) {
      await this.optimizeCSSFile(file, assetsDir);
    }

    console.log(`🎨 ${cssFiles.length}개 CSS 파일 최적화 완료`);
  }

  async optimizeCSSFile(filePath, outputDir) {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalSize = content.length;
    
    let optimizedContent = content;
    
    if (this.config.minifyCSS) {
      optimizedContent = this.minifyCSS(content);
    }

    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    
    if (this.config.hashFiles) {
      const hash = this.generateHash(optimizedContent);
      const hashedName = fileName.replace('.css', `.${hash}.css`);
      const hashedPath = path.join(outputDir, hashedName);
      fs.writeFileSync(hashedPath, optimizedContent);
      
      this.stats.files.push({
        original: fileName,
        hashed: hashedName,
        originalSize,
        optimizedSize: optimizedContent.length
      });
    } else {
      fs.writeFileSync(outputPath, optimizedContent);
    }

    this.stats.originalSize += originalSize;
    this.stats.optimizedSize += optimizedContent.length;
  }

  minifyCSS(content) {
    return content
      // 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 불필요한 공백 제거
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, ';}')
      .replace(/{\s*/g, '{')
      .replace(/}\s*/g, '}')
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
      .replace(/;\s*/g, ';')
      .trim();
  }

  async optimizeHTML() {
    console.log('📄 HTML 최적화 중...');
    
    const htmlFiles = this.findFiles(this.config.sourceDir, '.html');
    
    for (const file of htmlFiles) {
      await this.optimizeHTMLFile(file);
    }

    console.log(`📄 ${htmlFiles.length}개 HTML 파일 최적화 완료`);
  }

  async optimizeHTMLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    let optimizedContent = content;
    
    // 해시된 파일명으로 참조 업데이트
    if (this.config.hashFiles) {
      for (const file of this.stats.files) {
        const regex = new RegExp(file.original.replace('.', '\\.'), 'g');
        optimizedContent = optimizedContent.replace(regex, file.hashed);
      }
    }

    // HTML 최소화
    optimizedContent = optimizedContent
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    const outputPath = path.join(this.config.outputDir, fileName);
    fs.writeFileSync(outputPath, optimizedContent);
  }

  findFiles(dir, extension) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(itemPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(itemPath);
      }
    }
    
    return files;
  }

  generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  async generateManifest() {
    const manifest = {
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      files: this.stats.files.reduce((acc, file) => {
        acc[file.original] = file.hashed;
        return acc;
      }, {}),
      stats: {
        originalSize: this.stats.originalSize,
        optimizedSize: this.stats.optimizedSize,
        compressionRatio: ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(2) + '%'
      }
    };

    const manifestPath = path.join(this.config.outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('📋 매니페스트 파일 생성 완료');
  }

  async generateReport() {
    const report = `
# 빌드 최적화 보고서

생성 시간: ${new Date().toLocaleString()}

## 파일 통계

| 파일 | 원본 크기 | 최적화 크기 | 압축률 |
|------|-----------|-------------|--------|
${this.stats.files.map(file => {
  const ratio = ((file.originalSize - file.optimizedSize) / file.originalSize * 100).toFixed(1);
  return `| ${file.original} | ${this.formatBytes(file.originalSize)} | ${this.formatBytes(file.optimizedSize)} | ${ratio}% |`;
}).join('\n')}

## 전체 통계

- **총 원본 크기**: ${this.formatBytes(this.stats.originalSize)}
- **총 최적화 크기**: ${this.formatBytes(this.stats.optimizedSize)}
- **총 압축률**: ${((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(2)}%
- **절약된 용량**: ${this.formatBytes(this.stats.originalSize - this.stats.optimizedSize)}

## 최적화 적용 사항

- ✅ JavaScript 최소화
- ✅ CSS 최소화
- ✅ HTML 최소화
- ✅ 파일명 해싱 (캐시 버스팅)
- ✅ 번들 파일 생성
- ✅ 매니페스트 생성

## 권장사항

1. **Gzip 압축**: 웹 서버에서 Gzip 압축을 활성화하여 추가 압축 효과를 얻으세요.
2. **CDN 사용**: 정적 파일을 CDN을 통해 제공하여 로딩 속도를 개선하세요.
3. **캐시 정책**: 해시된 파일명을 활용하여 장기 캐시 정책을 설정하세요.
4. **이미지 최적화**: 이미지 파일도 최적화하여 전체 페이지 크기를 줄이세요.
`;

    const reportPath = path.join(this.config.outputDir, 'build-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('📊 빌드 보고서 생성 완료');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printStats() {
    console.log('📊 빌드 통계:');
    console.log(`   원본 크기: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`   최적화 크기: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`   압축률: ${((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(2)}%`);
    console.log(`   절약된 용량: ${this.formatBytes(this.stats.originalSize - this.stats.optimizedSize)}`);
  }
}

// 스크립트 실행
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = BuildOptimizer;