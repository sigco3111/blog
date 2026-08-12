module Jekyll
  class CategoryPageGenerator < Generator
    safe true
    priority :normal

    # 클래스 변수로 캐시 저장
    @@category_cache = {}
    @@last_build_time = nil

    def generate(site)
      start_time = Time.now
      
      begin
        # 기본 환경 검증
        unless validate_environment(site)
          return
        end

        # 증분 빌드 최적화 - 변경사항 확인
        if should_skip_generation?(site)
          Jekyll.logger.info "Category Generator:", "No changes detected, skipping generation"
          return
        end

        generated_pages = 0
        failed_pages = 0
        
        # 모든 카테고리 수집 및 검증 (캐시 활용)
        categories = collect_valid_categories_cached(site)
        
        if categories.empty?
          Jekyll.logger.info "Category Generator:", "No valid categories found in posts."
        else
          Jekyll.logger.info "Category Generator:", "Processing #{categories.size} categories..."
          
          # 병렬 처리를 위한 배치 처리 (소규모 사이트에서는 순차 처리)
          if categories.size > 20
            # 대용량 사이트의 경우 배치 처리
            process_categories_in_batches(site, categories) do |success, failure|
              generated_pages += success
              failed_pages += failure
            end
          else
            # 소규모 사이트의 경우 순차 처리
            categories.each_with_index do |category, index|
              begin
                if generate_category_page_cached(site, category)
                  generated_pages += 1
                  Jekyll.logger.debug "Category Generator:", "Generated page for category: #{category} (#{index + 1}/#{categories.size})"
                end
              rescue => e
                failed_pages += 1
                Jekyll.logger.error "Category Generator:", "Failed to generate page for category '#{category}': #{e.message}"
                Jekyll.logger.debug "Category Generator:", "Stack trace: #{e.backtrace.first(3).join("\n")}"
              end
            end
          end
        end
        
        # 미분류 포스트 처리
        begin
          uncategorized_count = process_uncategorized_posts(site)
          if uncategorized_count > 0
            generated_pages += 1
            Jekyll.logger.debug "Category Generator:", "Generated page for uncategorized posts (#{uncategorized_count} posts)"
          end
        rescue => e
          failed_pages += 1
          Jekyll.logger.error "Category Generator:", "Failed to process uncategorized posts: #{e.message}"
          Jekyll.logger.debug "Category Generator:", "Stack trace: #{e.backtrace.first(3).join("\n")}"
        end
        
        # 캐시 업데이트
        update_cache(site, categories)
        
        # 생성 결과 요약
        elapsed_time = Time.now - start_time
        Jekyll.logger.info "Category Generator:", "Completed in #{elapsed_time.round(3)}s - Generated: #{generated_pages}, Failed: #{failed_pages}"
        
        # 성능 통계 로깅
        log_performance_stats(site, elapsed_time, generated_pages)
        
        # 실패한 페이지가 있는 경우 경고
        if failed_pages > 0
          Jekyll.logger.warn "Category Generator:", "#{failed_pages} category pages failed to generate. Check logs for details."
        end
        
      rescue => e
        Jekyll.logger.error "Category Generator Fatal Error:", "#{e.message}"
        Jekyll.logger.error "Category Generator Fatal Error:", "Stack trace: #{e.backtrace.join("\n")}"
        
        # 빌드를 중단하지 않고 계속 진행
        Jekyll.logger.warn "Category Generator:", "Continuing build despite errors..."
      end
    end

    private

    def should_skip_generation?(site)
      return false unless site.config['incremental']
      return false if @@last_build_time.nil?
      
      # 포스트 변경 시간 확인
      latest_post_time = site.posts.docs.map { |post| 
        File.mtime(post.path) rescue Time.at(0) 
      }.max
      
      return latest_post_time <= @@last_build_time
    end

    def collect_valid_categories_cached(site)
      cache_key = generate_cache_key(site)
      
      if @@category_cache[cache_key]
        Jekyll.logger.debug "Category Generator:", "Using cached categories"
        return @@category_cache[cache_key]
      end
      
      categories = collect_valid_categories(site)
      @@category_cache[cache_key] = categories
      categories
    end

    def generate_cache_key(site)
      # 포스트 수와 카테고리 해시를 기반으로 캐시 키 생성
      post_count = site.posts.docs.size
      category_hash = site.categories.keys.sort.join(',').hash
      "#{post_count}_#{category_hash}"
    end

    def generate_category_page_cached(site, category)
      # 기존 페이지 확인으로 중복 생성 방지
      existing_page = site.pages.find { |page| page.data['category'] == category }
      if existing_page
        Jekyll.logger.debug "Category Generator:", "Category page already exists for: #{category}"
        return false
      end
      
      generate_category_page(site, category)
      true
    end

    def process_categories_in_batches(site, categories, batch_size = 10)
      success_count = 0
      failure_count = 0
      
      categories.each_slice(batch_size).with_index do |batch, batch_index|
        Jekyll.logger.debug "Category Generator:", "Processing batch #{batch_index + 1}/#{(categories.size / batch_size.to_f).ceil}"
        
        batch.each do |category|
          begin
            if generate_category_page_cached(site, category)
              success_count += 1
            end
          rescue => e
            failure_count += 1
            Jekyll.logger.error "Category Generator:", "Failed to generate page for category '#{category}': #{e.message}"
          end
        end
        
        # 메모리 정리를 위한 가비지 컬렉션 (대용량 사이트에서만)
        GC.start if batch_index % 5 == 0 && categories.size > 100
      end
      
      yield success_count, failure_count if block_given?
    end

    def update_cache(site, categories)
      @@last_build_time = Time.now
      
      # 캐시 크기 제한 (메모리 사용량 제어)
      if @@category_cache.size > 10
        @@category_cache.clear
        Jekyll.logger.debug "Category Generator:", "Cache cleared due to size limit"
      end
    end

    def log_performance_stats(site, elapsed_time, generated_pages)
      return unless site.config['profile']
      
      post_count = site.posts.docs.size
      category_count = site.categories.size
      pages_per_second = generated_pages / elapsed_time if elapsed_time > 0
      
      Jekyll.logger.info "Category Generator Performance:", 
        "Posts: #{post_count}, Categories: #{category_count}, " \
        "Pages/sec: #{pages_per_second&.round(2) || 'N/A'}, " \
        "Memory: #{get_memory_usage}"
    end

    def get_memory_usage
      if defined?(GC.stat)
        "#{(GC.stat[:heap_live_slots] * 40 / 1024.0 / 1024.0).round(1)}MB"
      else
        "N/A"
      end
    end

    def validate_environment(site)
      # 사이트 객체 검증
      unless site
        Jekyll.logger.error "Category Generator:", "Site object is nil"
        return false
      end

      # 레이아웃 파일 존재 확인
      unless site.layouts && site.layouts.key?('category')
        Jekyll.logger.warn "Category Generator:", "No 'category' layout found. Skipping category page generation."
        return false
      end

      # 사이트 포스트 존재 확인
      unless site.posts && site.posts.docs
        Jekyll.logger.warn "Category Generator:", "No posts collection found. Skipping category page generation."
        return false
      end

      # 카테고리 데이터 존재 확인
      unless site.categories
        Jekyll.logger.warn "Category Generator:", "No categories data found. Skipping category page generation."
        return false
      end

      # 출력 디렉토리 쓰기 권한 확인
      begin
        test_dir = File.join(site.dest, 'category')
        FileUtils.mkdir_p(test_dir) unless Dir.exist?(test_dir)
      rescue => e
        Jekyll.logger.error "Category Generator:", "Cannot create category directory: #{e.message}"
        return false
      end

      true
    end

    def collect_valid_categories(site)
      categories = []
      
      begin
        # 카테고리 키 수집 및 검증
        raw_categories = site.categories.keys || []
        
        raw_categories.each do |category|
          # 카테고리 이름 검증
          if category && !category.to_s.strip.empty?
            category_name = category.to_s.strip
            
            # 특수 문자 및 길이 검증
            if category_name.length <= 100 && category_name.match?(/\A[^\/\\\0]+\z/)
              categories << category_name
            else
              Jekyll.logger.warn "Category Generator:", "Skipping invalid category name: #{category_name}"
            end
          end
        end
        
        # 중복 제거 및 정렬
        categories = categories.uniq.sort
        
      rescue => e
        Jekyll.logger.error "Category Generator:", "Error collecting categories: #{e.message}"
        categories = []
      end
      
      categories
    end

    def process_uncategorized_posts(site)
      uncategorized_posts = []
      
      begin
        uncategorized_posts = site.posts.docs.select do |post|
          begin
            categories = post.data['categories']
            categories.nil? || 
            categories.empty? || 
            (categories.is_a?(Array) && categories.all? { |cat| cat.nil? || cat.to_s.strip.empty? })
          rescue => e
            Jekyll.logger.debug "Category Generator:", "Error checking post categories for #{post.path}: #{e.message}"
            true # 오류가 있는 포스트는 미분류로 처리
          end
        end
        
        if uncategorized_posts.size > 0
          generate_category_page(site, '미분류')
          return uncategorized_posts.size
        end
        
      rescue => e
        Jekyll.logger.error "Category Generator:", "Error processing uncategorized posts: #{e.message}"
        raise
      end
      
      0
    end

    private

    def generate_category_page(site, category)
      # 입력 검증
      raise ArgumentError, "Category name cannot be nil or empty" if category.nil? || category.to_s.strip.empty?
      
      category_name = category.to_s.strip
      
      # 카테고리명 길이 및 문자 검증
      if category_name.length > 100
        raise ArgumentError, "Category name too long: #{category_name}"
      end
      
      # 카테고리명을 URL에 적합한 형태로 변환 (한글 지원)
      begin
        # 한글 카테고리명을 URL 인코딩으로 처리
        category_slug = category_name.gsub(/\s+/, '-')
                                   .gsub(/[^\w\-가-힣]/, '')
                                   .downcase
        
        # 빈 슬러그인 경우 원본 이름을 URL 인코딩
        if category_slug.empty?
          require 'uri'
          category_slug = URI.encode_www_form_component(category_name)
        end
      rescue => e
        # 실패 시 원본 이름을 URL 인코딩으로 사용
        require 'uri'
        category_slug = URI.encode_www_form_component(category_name)
        Jekyll.logger.debug "Category Generator:", "Using URL encoding for category '#{category_name}': #{e.message}"
      end
      
      # 슬러그 검증
      if category_slug.nil? || category_slug.empty?
        Jekyll.logger.warn "Category Generator:", "Failed to create valid slug for category: #{category_name}"
        return
      end
      
      # 중복 페이지 확인
      existing_page = site.pages.find { |page| page.data['category'] == category_name }
      if existing_page
        Jekyll.logger.debug "Category Generator:", "Category page already exists for: #{category_name}"
        return
      end
      
      # 카테고리 페이지 생성
      begin
        category_page = CategoryPage.new(site, site.source, category_name, category_slug)
        
        # 페이지 유효성 검증
        if category_page && category_page.data
          site.pages << category_page
          Jekyll.logger.debug "Category Generator:", "Successfully created page for category: #{category_name}"
        else
          raise "Invalid category page created"
        end
        
      rescue => e
        Jekyll.logger.error "Category Generator:", "Failed to create CategoryPage for '#{category_name}': #{e.message}"
        raise
      end
    end
  end

  class CategoryPage < Page
    def initialize(site, base, category, category_slug)
      # 입력 검증
      validate_inputs(site, base, category, category_slug)
      
      @site = site
      @base = base
      @dir = File.join('category', category_slug)
      @name = 'index.html'

      begin
        # 페이지 처리 초기화
        self.process(@name)
        
        # 레이아웃 파일 검증 및 로드
        load_layout(base, category)
        
        # 페이지 데이터 설정
        setup_page_data(category, category_slug)
        
        # 페이지 유효성 최종 검증
        validate_page_data
        
        Jekyll.logger.debug "Category Page:", "Successfully initialized page for category '#{category}'"
        
      rescue => e
        Jekyll.logger.error "Category Page Error:", "Failed to initialize page for category '#{category}': #{e.message}"
        Jekyll.logger.debug "Category Page Error:", "Stack trace: #{e.backtrace.first(3).join("\n")}"
        raise
      end
    end

    private

    def validate_inputs(site, base, category, category_slug)
      raise ArgumentError, "Site cannot be nil" if site.nil?
      raise ArgumentError, "Base path cannot be nil or empty" if base.nil? || base.to_s.strip.empty?
      raise ArgumentError, "Category cannot be nil or empty" if category.nil? || category.to_s.strip.empty?
      raise ArgumentError, "Category slug cannot be nil or empty" if category_slug.nil? || category_slug.strip.empty?
      
      # 베이스 경로 존재 확인
      unless Dir.exist?(base)
        raise ArgumentError, "Base directory does not exist: #{base}"
      end
      
      # 카테고리 슬러그 형식 검증 (한글 포함)
      unless category_slug.match?(/\A[a-z0-9\-_가-힣%]+\z/i)
        Jekyll.logger.debug "Category Generator:", "Category slug contains special characters: #{category_slug}"
        # 특수 문자가 있어도 계속 진행 (URL 인코딩된 경우)
      end
    end

    def load_layout(base, category)
      layout_path = File.join(base, '_layouts', 'category.html')
      
      # 레이아웃 파일 존재 확인
      unless File.exist?(layout_path)
        Jekyll.logger.warn "Category Page:", "Layout file not found at #{layout_path}"
        Jekyll.logger.warn "Category Page:", "Category page for '#{category}' may not render correctly"
      end
      
      begin
        self.read_yaml(File.join(base, '_layouts'), 'category.html')
      rescue => e
        Jekyll.logger.error "Category Page:", "Failed to read layout file: #{e.message}"
        raise "Layout loading failed: #{e.message}"
      end
    end

    def setup_page_data(category, category_slug)
      # 기본 페이지 데이터 설정
      self.data ||= {}
      
      # 안전한 기본값으로 데이터 설정
      self.data['category'] = category.to_s
      self.data['title'] = "#{category} 카테고리"
      self.data['description'] = "#{category} 카테고리의 모든 포스트를 확인해보세요."
      self.data['permalink'] = "/category/#{category_slug}/"
      
      # 메타데이터 추가
      self.data['layout'] = 'category'
      self.data['sitemap'] = true
      self.data['robots'] = 'index, follow'
      
      # SEO 메타데이터
      self.data['og:title'] = self.data['title']
      self.data['og:description'] = self.data['description']
      self.data['og:type'] = 'website'
      
      # 생성 시간 기록
      self.data['generated_at'] = Time.now.iso8601
      
    rescue => e
      Jekyll.logger.error "Category Page:", "Failed to setup page data: #{e.message}"
      raise
    end

    def validate_page_data
      required_fields = ['category', 'title', 'permalink']
      
      required_fields.each do |field|
        if self.data[field].nil? || self.data[field].to_s.strip.empty?
          raise "Missing required page data field: #{field}"
        end
      end
      
      # URL 형식 검증
      unless self.data['permalink'].start_with?('/category/')
        raise "Invalid permalink format: #{self.data['permalink']}"
      end
      
    rescue => e
      Jekyll.logger.error "Category Page:", "Page data validation failed: #{e.message}"
      raise
    end
  end
end