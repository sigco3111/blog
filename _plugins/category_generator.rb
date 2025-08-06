module Jekyll
  class CategoryPageGenerator < Generator
    safe true

    def generate(site)
      if site.layouts.key? 'category'
        # 모든 카테고리 수집
        categories = site.categories.keys
        
        # 각 카테고리별로 페이지 생성
        categories.each do |category|
          generate_category_page(site, category)
        end
        
        # 미분류 포스트가 있는 경우 미분류 페이지 생성
        uncategorized_posts = site.posts.docs.select { |post| post.data['categories'].nil? || post.data['categories'].empty? }
        if uncategorized_posts.size > 0
          generate_category_page(site, '미분류')
        end
        
        Jekyll.logger.info "Category Generator:", "Generated #{categories.size} category pages"
      else
        Jekyll.logger.warn "Category Generator:", "No 'category' layout found. Skipping category page generation."
      end
    rescue => e
      Jekyll.logger.error "Category Generator Error:", e.message
    end

    private

    def generate_category_page(site, category)
      # 카테고리명을 URL에 적합한 형태로 변환
      category_slug = Jekyll::Utils.slugify(category)
      
      # 카테고리 페이지 생성
      site.pages << CategoryPage.new(site, site.source, category, category_slug)
    end
  end

  class CategoryPage < Page
    def initialize(site, base, category, category_slug)
      @site = site
      @base = base
      @dir = File.join('category', category_slug)
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'category.html')
      
      # 페이지 데이터 설정
      self.data['category'] = category
      self.data['title'] = "#{category} 카테고리"
      self.data['description'] = "#{category} 카테고리의 모든 포스트를 확인해보세요."
      
      # URL 설정
      self.data['permalink'] = "/category/#{category_slug}/"
    end
  end
end