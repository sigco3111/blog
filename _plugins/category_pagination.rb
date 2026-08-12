module Jekyll
  class CategoryPagination < Generator
    safe true
    priority :low

    def generate(site)
      return unless site.config['paginate_categories']
      
      site.categories.each do |category, posts|
        paginate_category(site, category, posts.sort { |a, b| b.date <=> a.date })
      end
    end

    private

    def paginate_category(site, category, posts)
      per_page = site.config['paginate_categories'] || 10
      total_pages = (posts.size.to_f / per_page).ceil
      
      return if total_pages <= 1
      
      # 모든 페이지 생성 (1페이지부터)
      (1..total_pages).each do |page_num|
        start_index = (page_num - 1) * per_page
        paginated_posts = posts.slice(start_index, per_page) || []
        
        # 페이지네이터 객체 생성
        paginator = CategoryPaginator.new(
          page: page_num,
          per_page: per_page,
          posts: paginated_posts,
          total_posts: posts.size,
          total_pages: total_pages,
          previous_page: page_num > 1 ? page_num - 1 : nil,
          next_page: page_num < total_pages ? page_num + 1 : nil,
          category: category
        )
        
        if page_num == 1
          # 첫 번째 페이지는 기존 카테고리 페이지에 페이지네이터 추가
          category_page = site.pages.find { |p| p.data['category'] == category }
          if category_page
            category_page.data['paginator'] = paginator
          end
        else
          # 2페이지부터는 새로운 페이지 생성
          page = CategoryPaginationPage.new(site, site.source, category, page_num, paginator)
          site.pages << page
        end
      end
    end
  end

  class CategoryPaginator
    attr_reader :page, :per_page, :posts, :total_posts, :total_pages, 
                :previous_page, :next_page, :category

    def initialize(options = {})
      @page = options[:page]
      @per_page = options[:per_page]
      @posts = options[:posts]
      @total_posts = options[:total_posts]
      @total_pages = options[:total_pages]
      @previous_page = options[:previous_page]
      @next_page = options[:next_page]
      @category = options[:category]
    end

    def previous_page_path
      return nil unless @previous_page
      
      if @previous_page == 1
        "/category/#{@category}/"
      else
        "/category/#{@category}/page#{@previous_page}/"
      end
    end

    def next_page_path
      return nil unless @next_page
      "/category/#{@category}/page#{@next_page}/"
    end

    # Liquid 템플릿에서 사용할 수 있도록 해시로 변환
    def to_liquid
      {
        'page' => @page,
        'per_page' => @per_page,
        'posts' => @posts,
        'total_posts' => @total_posts,
        'total_pages' => @total_pages,
        'previous_page' => @previous_page,
        'next_page' => @next_page,
        'previous_page_path' => previous_page_path,
        'next_page_path' => next_page_path,
        'category' => @category
      }
    end
  end

  class CategoryPaginationPage < Page
    def initialize(site, base, category, page_num, paginator)
      @site = site
      @base = base
      @dir = File.join('category', category, "page#{page_num}")
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'category.html')
      
      self.data['category'] = category
      self.data['title'] = "#{category} - #{page_num}페이지"
      self.data['paginator'] = paginator
    end
  end
end