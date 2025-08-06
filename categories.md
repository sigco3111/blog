---
layout: page
title: 카테고리
permalink: /categories/
---

# 카테고리

블로그의 모든 카테고리를 확인하고 각 카테고리별 포스트를 탐색해보세요.

<div class="categories-container">
  {% assign categories_list = site.categories %}
  {% for category in categories_list %}
    <div class="category-item">
      <h3><a href="{{ site.baseurl }}/category/{{ category[0] | slugify }}/">{{ category[0] }}</a></h3>
      <span class="post-count">{{ category[1].size }} 포스트</span>
    </div>
  {% endfor %}
  
  <!-- 미분류 포스트 처리 -->
  {% assign uncategorized_posts = site.posts | where: "categories", empty %}
  {% if uncategorized_posts.size > 0 %}
    <div class="category-item">
      <h3><a href="{{ site.baseurl }}/category/{{ '미분류' | slugify }}/">미분류</a></h3>
      <span class="post-count">{{ uncategorized_posts.size }} 포스트</span>
    </div>
  {% endif %}
</div>

<style>
.categories-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.category-item {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  background-color: #f8f9fa;
  transition: box-shadow 0.2s ease;
}

.category-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.category-item h3 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.category-item h3 a {
  text-decoration: none;
  color: #0366d6;
}

.category-item h3 a:hover {
  text-decoration: underline;
}

.post-count {
  color: #586069;
  font-size: 0.9em;
  background-color: #e1e4e8;
  padding: 2px 8px;
  border-radius: 12px;
}
</style>