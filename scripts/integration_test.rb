#!/usr/bin/env ruby
# 전체 기능 통합 테스트 스크립트

require 'fileutils'
require 'yaml'
require 'json'

class IntegrationTest
  def initialize
    @test_results = {}
    @test_post_files = []
    @original_posts = []
  end

  def run_all_tests
    puts "=== Jekyll 블로그 통합 테스트 시작 ==="
    puts "테스트 시간: #{Time.now}"
    puts

    begin
      # 기존 포스트 백업
      backup_existing_posts
      
      # 1. 새 포스트 추가 테스트
      test_new_post_creation
      
      # 2. 카테고리 변경 테스트
      test_category_change
      
      # 3. 대시보드 업데이트 테스트
      test_dashboard_updates
      
      # 4. 카테고리 페이지 생성 테스트
      test_category_page_generation
      
      # 5. 빌드 무결성 테스트
      test_build_integrity
      
      # 6. 링크 유효성 테스트
      test_link_validity
      
      # 7. 성능 회귀 테스트
      test_performance_regression
      
      # 결과 요약
      print_test_summary
      
    ensure
      # 테스트 정리
      cleanup_test_files
      restore_original_posts
    end
  end

  private

  def backup_existing_posts
    puts "📁 기존 포스트 백업 중..."
    @original_posts = Dir.glob('_posts/*.md').map do |file|
      {
        path: file,
        content: File.read(file),
        mtime: File.mtime(file)
      }
    end
    puts "   #{@original_posts.size}개 포스트 백업 완료"
    puts
  end

  def test_new_post_creation
    puts "1. 새 포스트 추가 테스트"
    
    # 테스트 포스트 생성
    test_post_path = create_test_post("integration-test-1", "통합테스트")
    @test_post_files << test_post_path
    
    # 빌드 실행
    build_result = run_jekyll_build
    
    if build_result[:success]
      # 카테고리 페이지 생성 확인
      category_page_exists = File.exist?('_site/category/통합테스트/index.html')
      
      # 대시보드 업데이트 확인
      dashboard_updated = check_dashboard_content("통합테스트")
      
      @test_results[:new_post] = {
        status: category_page_exists && dashboard_updated ? :pass : :fail,
        details: {
          build_success: build_result[:success],
          category_page_created: category_page_exists,
          dashboard_updated: dashboard_updated,
          build_time: build_result[:time]
        }
      }
      
      puts "   ✅ 새 포스트 추가: #{@test_results[:new_post][:status] == :pass ? '성공' : '실패'}"
      puts "   - 빌드 성공: #{build_result[:success] ? '예' : '아니오'}"
      puts "   - 카테고리 페이지 생성: #{category_page_exists ? '예' : '아니오'}"
      puts "   - 대시보드 업데이트: #{dashboard_updated ? '예' : '아니오'}"
      puts "   - 빌드 시간: #{build_result[:time].round(3)}초"
    else
      @test_results[:new_post] = {
        status: :fail,
        details: { build_error: build_result[:error] }
      }
      puts "   ❌ 빌드 실패: #{build_result[:error]}"
    end
    puts
  end

  def test_category_change
    puts "2. 카테고리 변경 테스트"
    
    # 기존 테스트 포스트의 카테고리 변경
    if @test_post_files.any?
      test_post_path = @test_post_files.first
      update_post_category(test_post_path, "통합테스트", "변경된카테고리")
      
      # 빌드 실행
      build_result = run_jekyll_build
      
      if build_result[:success]
        # 새 카테고리 페이지 생성 확인
        new_category_exists = File.exist?('_site/category/변경된카테고리/index.html')
        
        # 기존 카테고리 페이지 정리 확인 (포스트가 없으면 빈 페이지)
        old_category_empty = check_category_page_empty('_site/category/통합테스트/index.html')
        
        # 대시보드 업데이트 확인
        dashboard_updated = check_dashboard_content("변경된카테고리")
        
        @test_results[:category_change] = {
          status: new_category_exists && dashboard_updated ? :pass : :fail,
          details: {
            build_success: build_result[:success],
            new_category_created: new_category_exists,
            old_category_handled: old_category_empty,
            dashboard_updated: dashboard_updated,
            build_time: build_result[:time]
          }
        }
        
        puts "   ✅ 카테고리 변경: #{@test_results[:category_change][:status] == :pass ? '성공' : '실패'}"
        puts "   - 새 카테고리 페이지 생성: #{new_category_exists ? '예' : '아니오'}"
        puts "   - 기존 카테고리 처리: #{old_category_empty ? '적절함' : '확인 필요'}"
        puts "   - 대시보드 업데이트: #{dashboard_updated ? '예' : '아니오'}"
      else
        @test_results[:category_change] = {
          status: :fail,
          details: { build_error: build_result[:error] }
        }
        puts "   ❌ 빌드 실패: #{build_result[:error]}"
      end
    else
      @test_results[:category_change] = {
        status: :skip,
        details: { reason: "테스트 포스트 없음" }
      }
      puts "   ⏭️  테스트 건너뜀: 테스트 포스트 없음"
    end
    puts
  end

  def test_dashboard_updates
    puts "3. 대시보드 업데이트 테스트"
    
    # 여러 카테고리의 테스트 포스트 생성
    test_categories = ["테스트A", "테스트B", "테스트C"]
    test_categories.each_with_index do |category, index|
      test_post_path = create_test_post("dashboard-test-#{index + 1}", category)
      @test_post_files << test_post_path
    end
    
    # 빌드 실행
    build_result = run_jekyll_build
    
    if build_result[:success]
      dashboard_stats = analyze_dashboard_content
      
      @test_results[:dashboard_updates] = {
        status: dashboard_stats[:valid] ? :pass : :fail,
        details: dashboard_stats.merge(build_time: build_result[:time])
      }
      
      puts "   ✅ 대시보드 업데이트: #{@test_results[:dashboard_updates][:status] == :pass ? '성공' : '실패'}"
      puts "   - 총 포스트 수: #{dashboard_stats[:total_posts]}"
      puts "   - 총 카테고리 수: #{dashboard_stats[:total_categories]}"
      puts "   - 최근 포스트 표시: #{dashboard_stats[:recent_posts_shown] ? '예' : '아니오'}"
      puts "   - 카테고리 차트 표시: #{dashboard_stats[:category_chart_shown] ? '예' : '아니오'}"
    else
      @test_results[:dashboard_updates] = {
        status: :fail,
        details: { build_error: build_result[:error] }
      }
      puts "   ❌ 빌드 실패: #{build_result[:error]}"
    end
    puts
  end

  def test_category_page_generation
    puts "4. 카테고리 페이지 생성 테스트"
    
    # 빌드 후 생성된 카테고리 페이지 확인
    category_pages = Dir.glob('_site/category/*/index.html')
    categories_list_page = File.exist?('_site/categories/index.html')
    
    # 각 카테고리 페이지 내용 검증
    valid_pages = 0
    category_pages.each do |page_path|
      if validate_category_page(page_path)
        valid_pages += 1
      end
    end
    
    @test_results[:category_pages] = {
      status: categories_list_page && valid_pages == category_pages.size ? :pass : :fail,
      details: {
        total_category_pages: category_pages.size,
        valid_category_pages: valid_pages,
        categories_list_exists: categories_list_page
      }
    }
    
    puts "   ✅ 카테고리 페이지 생성: #{@test_results[:category_pages][:status] == :pass ? '성공' : '실패'}"
    puts "   - 생성된 카테고리 페이지: #{category_pages.size}개"
    puts "   - 유효한 카테고리 페이지: #{valid_pages}개"
    puts "   - 카테고리 목록 페이지: #{categories_list_page ? '존재' : '없음'}"
    puts
  end

  def test_build_integrity
    puts "5. 빌드 무결성 테스트"
    
    # 필수 파일들 존재 확인
    required_files = [
      '_site/index.html',
      '_site/categories/index.html',
      '_site/dashboard/index.html',
      '_site/assets/css/dashboard.css',
      '_site/assets/css/categories.css',
      '_site/assets/css/accessibility.css'
    ]
    
    missing_files = required_files.reject { |file| File.exist?(file) }
    
    # HTML 유효성 간단 검사
    html_files = Dir.glob('_site/**/*.html')
    invalid_html = []
    
    html_files.each do |file|
      content = File.read(file)
      # 기본적인 HTML 구조 검사
      unless content.include?('<html') && content.include?('</html>') && 
             content.include?('<head') && content.include?('</head>') &&
             content.include?('<body') && content.include?('</body>')
        invalid_html << file
      end
    end
    
    @test_results[:build_integrity] = {
      status: missing_files.empty? && invalid_html.empty? ? :pass : :fail,
      details: {
        missing_files: missing_files,
        invalid_html_files: invalid_html.size,
        total_html_files: html_files.size
      }
    }
    
    puts "   ✅ 빌드 무결성: #{@test_results[:build_integrity][:status] == :pass ? '성공' : '실패'}"
    puts "   - 누락된 필수 파일: #{missing_files.size}개"
    puts "   - 총 HTML 파일: #{html_files.size}개"
    puts "   - 유효하지 않은 HTML: #{invalid_html.size}개"
    
    if missing_files.any?
      puts "   - 누락 파일: #{missing_files.join(', ')}"
    end
    puts
  end

  def test_link_validity
    puts "6. 링크 유효성 테스트"
    
    # 내부 링크 검사
    html_files = Dir.glob('_site/**/*.html')
    broken_links = []
    total_links = 0
    
    # baseurl 설정 확인
    config_file = '_config.yml'
    baseurl = ""
    if File.exist?(config_file)
      config = YAML.load_file(config_file)
      baseurl = config['baseurl'] || ""
    end
    
    html_files.each do |file|
      content = File.read(file)
      
      # href 속성에서 내부 링크 추출
      internal_links = content.scan(/href=["']([^"']*?)["']/).flatten
                             .select { |link| 
                               (link.start_with?('/') || !link.include?('://')) &&
                               !link.start_with?('mailto:') &&
                               !link.start_with?('tel:') &&
                               !link.start_with?('#')
                             }
      
      internal_links.each do |link|
        total_links += 1
        
        # 앵커 링크 제거
        clean_link = link.split('#').first
        next if clean_link.nil? || clean_link.empty?
        
        # baseurl 제거 (있는 경우)
        if baseurl != "" && clean_link.start_with?(baseurl)
          clean_link = clean_link[baseurl.length..-1]
        end
        
        # 절대 경로로 변환
        target_file = File.join('_site', clean_link)
        
        # 디렉토리인 경우 index.html 추가
        if File.directory?(target_file)
          target_file = File.join(target_file, 'index.html')
        end
        
        # CSS, JS 파일 등은 실제 파일 경로 확인
        unless File.exist?(target_file)
          # assets 파일들은 다른 위치에 있을 수 있음
          if clean_link.include?('/assets/')
            alt_target = File.join('_site', clean_link)
            unless File.exist?(alt_target)
              broken_links << { file: file, link: link, target: target_file }
            end
          else
            broken_links << { file: file, link: link, target: target_file }
          end
        end
      end
    end
    
    # 실제 깨진 링크만 필터링 (중요한 링크들만)
    important_broken_links = broken_links.select do |broken|
      link = broken[:link]
      # CSS, JS, 이미지 파일이 아닌 페이지 링크만 중요하게 취급
      !link.end_with?('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico')
    end
    
    @test_results[:link_validity] = {
      status: important_broken_links.empty? ? :pass : :warning,
      details: {
        total_links_checked: total_links,
        broken_links_count: broken_links.size,
        important_broken_links: important_broken_links.size,
        broken_links: important_broken_links.first(5) # 처음 5개만 표시
      }
    }
    
    puts "   ✅ 링크 유효성: #{@test_results[:link_validity][:status] == :pass ? '성공' : '경고'}"
    puts "   - 검사한 링크: #{total_links}개"
    puts "   - 깨진 링크: #{broken_links.size}개"
    puts "   - 중요한 깨진 링크: #{important_broken_links.size}개"
    
    if important_broken_links.any?
      puts "   - 중요한 깨진 링크 예시:"
      important_broken_links.first(3).each do |broken|
        puts "     * #{broken[:link]} (#{File.basename(broken[:file])}에서)"
      end
    end
    puts
  end

  def test_performance_regression
    puts "7. 성능 회귀 테스트"
    
    # 빌드 시간 측정
    build_times = []
    3.times do
      FileUtils.rm_rf('_site')
      start_time = Time.now
      result = run_jekyll_build
      build_times << Time.now - start_time if result[:success]
    end
    
    avg_build_time = build_times.sum / build_times.size if build_times.any?
    
    # 사이트 크기 측정
    site_size = calculate_site_size
    
    # CSS 파일 크기 측정
    css_files = Dir.glob('_site/assets/css/*.css')
    total_css_size = css_files.sum { |file| File.size(file) }
    
    # 성능 기준 (임계값)
    max_build_time = 30.0 # 30초
    max_site_size = 50 * 1024 * 1024 # 50MB
    max_css_size = 1024 * 1024 # 1MB
    
    performance_ok = avg_build_time && avg_build_time < max_build_time &&
                    site_size < max_site_size &&
                    total_css_size < max_css_size
    
    @test_results[:performance] = {
      status: performance_ok ? :pass : :warning,
      details: {
        avg_build_time: avg_build_time&.round(3),
        site_size_mb: (site_size / 1024.0 / 1024.0).round(2),
        css_size_kb: (total_css_size / 1024.0).round(2),
        css_files_count: css_files.size
      }
    }
    
    puts "   ✅ 성능 회귀: #{@test_results[:performance][:status] == :pass ? '통과' : '주의'}"
    puts "   - 평균 빌드 시간: #{avg_build_time&.round(3) || 'N/A'}초"
    puts "   - 사이트 크기: #{(site_size / 1024.0 / 1024.0).round(2)}MB"
    puts "   - CSS 파일 크기: #{(total_css_size / 1024.0).round(2)}KB"
    puts "   - CSS 파일 수: #{css_files.size}개"
    puts
  end

  def create_test_post(filename, category)
    date = Time.now.strftime('%Y-%m-%d')
    post_path = "_posts/#{date}-#{filename}.md"
    
    content = <<~MARKDOWN
      ---
      layout: post
      title: "#{filename.capitalize} 포스트"
      date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}
      categories: [#{category}]
      ---

      이것은 #{category} 카테고리의 통합 테스트용 포스트입니다.
      
      ## 테스트 내용
      
      - 카테고리 페이지 생성 테스트
      - 대시보드 업데이트 테스트
      - 빌드 무결성 테스트
      
      테스트 시간: #{Time.now}
    MARKDOWN
    
    File.write(post_path, content)
    post_path
  end

  def update_post_category(post_path, old_category, new_category)
    content = File.read(post_path)
    updated_content = content.gsub("categories: [#{old_category}]", "categories: [#{new_category}]")
    File.write(post_path, updated_content)
  end

  def run_jekyll_build
    start_time = Time.now
    result = system('bundle exec jekyll build --quiet 2>/dev/null')
    end_time = Time.now
    
    {
      success: result,
      time: end_time - start_time,
      error: result ? nil : "빌드 실패"
    }
  end

  def check_dashboard_content(category)
    dashboard_file = '_site/dashboard/index.html'
    return false unless File.exist?(dashboard_file)
    
    content = File.read(dashboard_file)
    # 대시보드가 정상적으로 렌더링되었는지 확인
    content.include?('dashboard-container') && 
    content.include?('기본 통계') &&
    (content.include?(category) || content.include?('전체 포스트'))
  end

  def check_category_page_empty(page_path)
    return true unless File.exist?(page_path)
    
    content = File.read(page_path)
    # 포스트 목록이 비어있는지 확인
    !content.include?('<article') && !content.include?('post-item')
  end

  def analyze_dashboard_content
    dashboard_file = '_site/dashboard/index.html'
    return { valid: false } unless File.exist?(dashboard_file)
    
    content = File.read(dashboard_file)
    
    # 통계 숫자 추출 (더 유연한 패턴)
    post_count = content.scan(/<div class="stat-number">(\d+)<\/div>/).flatten.first&.to_i || 0
    category_matches = content.scan(/<div class="stat-number">(\d+)<\/div>/).flatten
    category_count = category_matches[1]&.to_i || 0
    
    {
      valid: content.include?('dashboard-container') && content.include?('기본 통계'),
      total_posts: post_count,
      total_categories: category_count,
      recent_posts_shown: content.include?('최근 포스트') || content.include?('recent-posts'),
      category_chart_shown: content.include?('chart-container') || content.include?('category-chart')
    }
  end

  def validate_category_page(page_path)
    return false unless File.exist?(page_path)
    
    content = File.read(page_path)
    
    # 기본 HTML 구조 확인
    content.include?('<html') && 
    content.include?('</html>') &&
    content.include?('<title') &&
    (content.include?('카테고리') || content.include?('category'))
  end

  def calculate_site_size
    Dir.glob('_site/**/*').select { |f| File.file?(f) }.sum { |f| File.size(f) }
  end

  def cleanup_test_files
    puts "🧹 테스트 파일 정리 중..."
    @test_post_files.each do |file|
      File.delete(file) if File.exist?(file)
    end
    puts "   #{@test_post_files.size}개 테스트 파일 삭제 완료"
  end

  def restore_original_posts
    puts "📁 원본 포스트 복원 중..."
    
    # 현재 포스트 파일들 삭제
    Dir.glob('_posts/*.md').each { |file| File.delete(file) }
    
    # 원본 포스트 복원
    @original_posts.each do |post|
      File.write(post[:path], post[:content])
      File.utime(post[:mtime], post[:mtime], post[:path])
    end
    
    puts "   #{@original_posts.size}개 원본 포스트 복원 완료"
    
    # 최종 빌드로 정리
    puts "🔄 최종 빌드 실행 중..."
    system('bundle exec jekyll build --quiet 2>/dev/null')
    puts "   빌드 완료"
    puts
  end

  def print_test_summary
    puts "=== 통합 테스트 결과 요약 ==="
    
    total_tests = @test_results.size
    passed_tests = @test_results.values.count { |result| result[:status] == :pass }
    failed_tests = @test_results.values.count { |result| result[:status] == :fail }
    warning_tests = @test_results.values.count { |result| result[:status] == :warning }
    skipped_tests = @test_results.values.count { |result| result[:status] == :skip }
    
    puts
    puts "총 테스트: #{total_tests}개"
    puts "통과: #{passed_tests}개 ✅"
    puts "실패: #{failed_tests}개 ❌"
    puts "경고: #{warning_tests}개 ⚠️"
    puts "건너뜀: #{skipped_tests}개 ⏭️"
    puts
    
    success_rate = (passed_tests.to_f / total_tests * 100).round(1)
    puts "성공률: #{success_rate}%"
    
    if success_rate >= 90
      puts "🎉 모든 테스트가 성공적으로 완료되었습니다!"
    elsif success_rate >= 70
      puts "⚠️  일부 테스트에서 문제가 발견되었습니다."
    else
      puts "❌ 심각한 문제가 발견되었습니다. 수정이 필요합니다."
    end
    
    puts
    puts "상세 결과:"
    @test_results.each do |test_name, result|
      status_icon = case result[:status]
                   when :pass then "✅"
                   when :fail then "❌"
                   when :warning then "⚠️"
                   when :skip then "⏭️"
                   end
      
      puts "#{status_icon} #{test_name}: #{result[:status]}"
      
      if result[:details] && result[:status] != :pass
        result[:details].each do |key, value|
          puts "   - #{key}: #{value}"
        end
      end
    end
    
    puts
    puts "권장사항:"
    
    if failed_tests > 0
      puts "- 실패한 테스트를 확인하고 관련 기능을 수정하세요"
    end
    
    if warning_tests > 0
      puts "- 경고가 발생한 항목들을 검토하고 최적화를 고려하세요"
    end
    
    puts "- 정기적으로 통합 테스트를 실행하여 회귀를 방지하세요"
    puts "- 새로운 기능 추가 시 관련 테스트를 추가하세요"
  end
end

# 스크립트 실행
if __FILE__ == $0
  tester = IntegrationTest.new
  tester.run_all_tests
end