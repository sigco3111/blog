---
layout: page
title: 카테고리
permalink: /categories/
custom_css: categories
---

# 카테고리

블로그의 모든 카테고리를 확인하고 각 카테고리별 포스트를 탐색해보세요.

<div class="categories-container">
  {% comment %} 카테고리 목록 처리 및 오류 방지 {% endcomment %}
  {% assign categories_list = site.categories %}
  {% assign total_categories = 0 %}
  
  {% if categories_list.size > 0 %}
    {% for category in categories_list %}
      {% assign category_name = category[0] | default: "알 수 없는 카테고리" %}
      {% assign category_posts = category[1] | default: site.posts | limit: 0 %}
      {% assign post_count = category_posts.size | default: 0 %}
      {% assign total_categories = total_categories | plus: 1 %}
      
      <div class="category-item">
        <h3><a href="{{ site.baseurl }}/category/{{ category_name }}/">{{ category_name }}</a></h3>
        <span class="post-count">{{ post_count }} 포스트</span>
      </div>
    {% endfor %}
  {% endif %}
  
  {% comment %} 미분류 포스트 처리 {% endcomment %}
  {% assign uncategorized_posts = site.posts | where: "categories", empty %}
  {% if uncategorized_posts.size > 0 %}
    {% assign total_categories = total_categories | plus: 1 %}
    <div class="category-item">
      <h3><a href="{{ site.baseurl }}/category/미분류/">미분류</a></h3>
      <span class="post-count">{{ uncategorized_posts.size }} 포스트</span>
    </div>
  {% endif %}
  
  {% comment %} 카테고리가 전혀 없는 경우 처리 {% endcomment %}
  {% if total_categories == 0 %}
    <div class="empty-categories-state">
      <div class="empty-state-icon">📂</div>
      <h3>아직 카테고리가 없습니다</h3>
      <p>포스트를 작성하고 카테고리를 추가해보세요.</p>
      <div class="empty-state-actions">
        <a href="{{ '/' | relative_url }}" class="back-link">홈으로 돌아가기</a>
      </div>
    </div>
  {% endif %}
</div>

{% comment %} 카테고리 통계 표시 {% endcomment %}
{% if total_categories > 0 %}
  <div class="categories-stats">
    <p>총 {{ total_categories }}개의 카테고리에 {{ site.posts.size }}개의 포스트가 있습니다.</p>
  </div>
{% endif %}