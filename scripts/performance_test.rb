#!/usr/bin/env ruby
# 빌드 성능 테스트 스크립트

require 'benchmark'
require 'fileutils'

class PerformanceTest
  def initialize
    @results = {}
    @baseline_time = nil
  end

  def run_all_tests
    puts "=== Jekyll 빌드 성능 테스트 시작 ==="
    puts "테스트 시간: #{Time.now}"
    puts

    # 기본 빌드 테스트
    test_basic_build
    
    # 증분 빌드 테스트
    test_incremental_build
    
    # 대용량 포스트 테스트
    test_large_posts
    
    # 메모리 사용량 테스트
    test_memory_usage
    
    # 결과 요약
    print_summary
  end

  private

  def test_basic_build
    puts "1. 기본 빌드 성능 테스트"
    
    # 캐시 정리
    clean_build_cache
    
    time = Benchmark.realtime do
      system("bundle exec jekyll build --quiet")
    end
    
    @baseline_time = time
    @results[:basic_build] = time
    
    puts "   기본 빌드 시간: #{time.round(3)}초"
    puts "   생성된 파일 수: #{count_generated_files}"
    puts "   사이트 크기: #{get_site_size}"
    puts
  end

  def test_incremental_build
    puts "2. 증분 빌드 성능 테스트"
    
    # 작은 변경사항 만들기
    test_file = "_posts/test-performance.md"
    create_test_post(test_file)
    
    time = Benchmark.realtime do
      system("bundle exec jekyll build --incremental --quiet")
    end
    
    @results[:incremental_build] = time
    improvement = (@baseline_time - time) / @baseline_time * 100
    
    puts "   증분 빌드 시간: #{time.round(3)}초"
    puts "   성능 개선: #{improvement.round(1)}%"
    
    # 테스트 파일 정리
    File.delete(test_file) if File.exist?(test_file)
    puts
  end

  def test_large_posts
    puts "3. 대용량 포스트 처리 테스트"
    
    # 대용량 테스트 포스트 생성
    large_posts = create_large_test_posts(5)
    
    time = Benchmark.realtime do
      system("bundle exec jekyll build --quiet")
    end
    
    @results[:large_posts] = time
    
    puts "   대용량 포스트 빌드 시간: #{time.round(3)}초"
    puts "   포스트당 평균 처리 시간: #{(time / 5).round(3)}초"
    
    # 테스트 포스트 정리
    large_posts.each { |file| File.delete(file) if File.exist?(file) }
    puts
  end

  def test_memory_usage
    puts "4. 메모리 사용량 테스트"
    
    if defined?(GC.stat)
      GC.start
      before_memory = GC.stat[:heap_live_slots]
      
      system("bundle exec jekyll build --quiet")
      
      after_memory = GC.stat[:heap_live_slots]
      memory_used = (after_memory - before_memory) * 40 / 1024.0 / 1024.0
      
      @results[:memory_usage] = memory_used
      
      puts "   메모리 사용량: #{memory_used.round(2)}MB"
      puts "   GC 실행 횟수: #{GC.count}"
    else
      puts "   메모리 통계를 사용할 수 없습니다."
    end
    puts
  end

  def clean_build_cache
    cache_dirs = ['.jekyll-cache', '.sass-cache', '_site']
    cache_dirs.each do |dir|
      FileUtils.rm_rf(dir) if Dir.exist?(dir)
    end
  end

  def count_generated_files
    return 0 unless Dir.exist?('_site')
    Dir.glob('_site/**/*').select { |f| File.file?(f) }.size
  end

  def get_site_size
    return "0KB" unless Dir.exist?('_site')
    
    size = Dir.glob('_site/**/*').select { |f| File.file?(f) }
              .sum { |f| File.size(f) }
    
    if size > 1024 * 1024
      "#{(size / 1024.0 / 1024.0).round(2)}MB"
    elsif size > 1024
      "#{(size / 1024.0).round(2)}KB"
    else
      "#{size}B"
    end
  end

  def create_test_post(filename)
    content = <<~MARKDOWN
      ---
      layout: post
      title: "성능 테스트 포스트"
      date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}
      categories: [테스트]
      ---

      이것은 성능 테스트를 위한 포스트입니다.
    MARKDOWN

    File.write(filename, content)
  end

  def create_large_test_posts(count)
    files = []
    
    count.times do |i|
      filename = "_posts/#{Time.now.strftime('%Y-%m-%d')}-large-test-#{i}.md"
      
      # 큰 콘텐츠 생성 (약 10KB)
      large_content = "Lorem ipsum dolor sit amet. " * 500
      
      content = <<~MARKDOWN
        ---
        layout: post
        title: "대용량 테스트 포스트 #{i + 1}"
        date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}
        categories: [대용량테스트, 성능]
        ---

        #{large_content}
      MARKDOWN

      File.write(filename, content)
      files << filename
    end
    
    files
  end

  def print_summary
    puts "=== 성능 테스트 결과 요약 ==="
    
    if @results[:basic_build]
      puts "기본 빌드: #{@results[:basic_build].round(3)}초"
    end
    
    if @results[:incremental_build]
      puts "증분 빌드: #{@results[:incremental_build].round(3)}초"
      improvement = (@baseline_time - @results[:incremental_build]) / @baseline_time * 100
      puts "증분 빌드 개선율: #{improvement.round(1)}%"
    end
    
    if @results[:large_posts]
      puts "대용량 포스트 처리: #{@results[:large_posts].round(3)}초"
    end
    
    if @results[:memory_usage]
      puts "메모리 사용량: #{@results[:memory_usage].round(2)}MB"
    end
    
    puts
    puts "권장사항:"
    
    if @baseline_time && @baseline_time > 10
      puts "- 빌드 시간이 길어 추가 최적화가 필요합니다"
      puts "- exclude 설정을 확인하여 불필요한 파일을 제외하세요"
    end
    
    if @results[:memory_usage] && @results[:memory_usage] > 100
      puts "- 메모리 사용량이 높습니다. 플러그인 최적화를 고려하세요"
    end
    
    puts "- 증분 빌드를 활용하여 개발 속도를 향상시키세요"
    puts "- 정기적으로 캐시를 정리하세요"
  end
end

# 스크립트 실행
if __FILE__ == $0
  tester = PerformanceTest.new
  tester.run_all_tests
end