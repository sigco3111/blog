// Blog Search Functionality
(function() {
    'use strict';
    
    // Search configuration
    const config = {
        minQueryLength: 2,
        debounceTime: 300,
        maxSuggestions: 8
    };
    
    // DOM elements
    let searchInput, searchClear, suggestions, resultsInfo, postList, allPosts;
    
    // Search state
    let searchTimeout;
    let suggestionTimeout;
    let currentQuery = '';
    
    // Initialize search functionality
    function initSearch() {
        // Get DOM elements
        searchInput = document.getElementById('blog-search');
        searchClear = document.getElementById('blog-search-clear');
        suggestions = document.getElementById('blog-search-suggestions');
        resultsInfo = document.getElementById('blog-search-results-info');
        postList = document.getElementById('blog-post-list');
        
        if (!searchInput || !postList) {
            console.log('Search elements not found, skipping search initialization');
            return;
        }
        
        // Get all posts
        allPosts = Array.from(postList.querySelectorAll('.post-item'));
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('Blog search initialized with', allPosts.length, 'posts');
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', handleKeyDown);
        searchInput.addEventListener('focus', handleFocus);
        
        // Clear button
        if (searchClear) {
            searchClear.addEventListener('click', clearSearch);
        }
        
        // Click outside to hide suggestions
        document.addEventListener('click', handleClickOutside);
    }
    
    // Handle search input
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        currentQuery = query;
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'block' : 'none';
        }
        
        // Handle suggestions
        clearTimeout(suggestionTimeout);
        if (query.length >= config.minQueryLength) {
            suggestionTimeout = setTimeout(() => {
                showSuggestions(query);
            }, 150);
        } else {
            hideSuggestions();
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, config.debounceTime);
    }
    
    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            hideSuggestions();
            performSearch(currentQuery);
        } else if (e.key === 'Escape') {
            hideSuggestions();
            searchInput.blur();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateSuggestions('down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateSuggestions('up');
        }
    }
    
    // Handle focus
    function handleFocus() {
        if (currentQuery.length >= config.minQueryLength) {
            showSuggestions(currentQuery);
        }
    }
    
    // Handle click outside
    function handleClickOutside(e) {
        if (!searchInput.contains(e.target) && !suggestions?.contains(e.target)) {
            hideSuggestions();
        }
    }
    
    // Clear search
    function clearSearch() {
        searchInput.value = '';
        currentQuery = '';
        searchClear.style.display = 'none';
        hideSuggestions();
        performSearch('');
        searchInput.focus();
    }
    
    // Perform search
    function performSearch(query) {
        if (!query || query.length < config.minQueryLength) {
            // Show all posts
            showAllPosts();
            hideResultsInfo();
            return;
        }
        
        const results = searchPosts(query);
        displayResults(results, query);
        showResultsInfo(results.length, query);
    }
    
    // Search posts
    function searchPosts(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        allPosts.forEach(post => {
            const title = post.dataset.title || '';
            const content = post.dataset.content || '';
            const categories = post.dataset.categories || '';
            const tags = post.dataset.tags || '';
            
            let score = 0;
            let matches = [];
            
            // Title search (highest weight)
            if (title.includes(lowerQuery)) {
                score += 10;
                matches.push('title');
            }
            
            // Content search
            if (content.includes(lowerQuery)) {
                score += 5;
                matches.push('content');
            }
            
            // Categories search
            if (categories.includes(lowerQuery)) {
                score += 8;
                matches.push('categories');
            }
            
            // Tags search
            if (tags.includes(lowerQuery)) {
                score += 6;
                matches.push('tags');
            }
            
            // Word boundary matches get bonus
            const words = lowerQuery.split(' ');
            words.forEach(word => {
                if (word.length >= 2) {
                    const wordRegex = new RegExp('\\b' + escapeRegex(word) + '\\b', 'i');
                    if (wordRegex.test(title)) score += 3;
                    if (wordRegex.test(content)) score += 1;
                    if (wordRegex.test(categories)) score += 2;
                    if (wordRegex.test(tags)) score += 2;
                }
            });
            
            if (score > 0) {
                results.push({
                    element: post,
                    score: score,
                    matches: matches
                });
            }
        });
        
        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);
        
        return results;
    }
    
    // Display search results
    function displayResults(results, query) {
        // Hide all posts first
        allPosts.forEach(post => {
            post.classList.add('hidden');
            post.classList.remove('search-result');
        });
        
        if (results.length === 0) {
            showNoResults(query);
            return;
        }
        
        // Show matching posts with highlighting
        results.forEach(result => {
            const post = result.element;
            post.classList.remove('hidden');
            post.classList.add('search-result');
            
            // Highlight matches
            highlightMatches(post, query);
        });
    }
    
    // Show all posts
    function showAllPosts() {
        allPosts.forEach(post => {
            post.classList.remove('hidden', 'search-result');
            removeHighlights(post);
        });
        
        // Remove no results message
        const noResults = postList.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
    }
    
    // Show no results message
    function showNoResults(query) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div class="no-results-icon">🔍</div>
            <h3>검색 결과가 없습니다</h3>
            <p>"${escapeHtml(query)}"에 대한 검색 결과를 찾을 수 없습니다.</p>
            <p>다른 키워드로 검색해보세요.</p>
        `;
        
        // Remove existing no results message
        const existingNoResults = postList.querySelector('.no-results');
        if (existingNoResults) {
            existingNoResults.remove();
        }
        
        postList.appendChild(noResults);
    }
    
    // Highlight matches in post
    function highlightMatches(post, query) {
        const elements = post.querySelectorAll('h3 a, .post-excerpt, .category-tag, .tag-badge');
        
        elements.forEach(element => {
            const originalText = element.textContent;
            const highlightedText = highlightText(originalText, query);
            if (highlightedText !== originalText) {
                element.innerHTML = highlightedText;
            }
        });
    }
    
    // Remove highlights from post
    function removeHighlights(post) {
        const marks = post.querySelectorAll('mark');
        marks.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }
    
    // Highlight text
    function highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Show search suggestions
    function showSuggestions(query) {
        if (!suggestions) return;
        
        const suggestionList = generateSuggestions(query);
        
        if (suggestionList.length === 0) {
            hideSuggestions();
            return;
        }
        
        const suggestionsHtml = suggestionList.map((suggestion, index) => 
            `<div class="suggestion-item" data-suggestion="${escapeHtml(suggestion)}" data-index="${index}">
                <span class="suggestion-icon">🔍</span>
                <span class="suggestion-text">${highlightSuggestion(suggestion, query)}</span>
            </div>`
        ).join('');
        
        suggestions.innerHTML = suggestionsHtml;
        suggestions.style.display = 'block';
        
        // Add click handlers
        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                searchInput.value = suggestion;
                currentQuery = suggestion;
                hideSuggestions();
                performSearch(suggestion);
            });
        });
    }
    
    // Generate suggestions
    function generateSuggestions(query) {
        const suggestions = new Set();
        const lowerQuery = query.toLowerCase();
        
        // Get suggestions from post titles, categories, and tags
        allPosts.forEach(post => {
            const title = post.dataset.title || '';
            const categories = post.dataset.categories || '';
            const tags = post.dataset.tags || '';
            
            // Title words
            title.split(' ').forEach(word => {
                if (word.length >= 2 && word.toLowerCase().startsWith(lowerQuery)) {
                    suggestions.add(word);
                }
            });
            
            // Categories
            categories.split(' ').forEach(category => {
                if (category.length >= 2 && category.toLowerCase().startsWith(lowerQuery)) {
                    suggestions.add(category);
                }
            });
            
            // Tags
            tags.split(' ').forEach(tag => {
                if (tag.length >= 2 && tag.toLowerCase().startsWith(lowerQuery)) {
                    suggestions.add(tag);
                }
            });
        });
        
        return Array.from(suggestions).slice(0, config.maxSuggestions);
    }
    
    // Hide suggestions
    function hideSuggestions() {
        if (suggestions) {
            suggestions.style.display = 'none';
            suggestions.innerHTML = '';
        }
    }
    
    // Navigate suggestions with keyboard
    function navigateSuggestions(direction) {
        if (!suggestions || suggestions.style.display === 'none') return;
        
        const items = suggestions.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        const current = suggestions.querySelector('.suggestion-item.active');
        let nextIndex = 0;
        
        if (current) {
            const currentIndex = parseInt(current.dataset.index);
            current.classList.remove('active');
            
            if (direction === 'down') {
                nextIndex = (currentIndex + 1) % items.length;
            } else {
                nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            }
        }
        
        items[nextIndex].classList.add('active');
        searchInput.value = items[nextIndex].dataset.suggestion;
    }
    
    // Highlight suggestion
    function highlightSuggestion(suggestion, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return suggestion.replace(regex, '<mark>$1</mark>');
    }
    
    // Show results info
    function showResultsInfo(count, query) {
        if (!resultsInfo) return;
        
        resultsInfo.innerHTML = `
            <span class="search-results-count">
                "${escapeHtml(query)}" 검색 결과: ${count}개
            </span>
        `;
        resultsInfo.style.display = 'block';
    }
    
    // Hide results info
    function hideResultsInfo() {
        if (resultsInfo) {
            resultsInfo.style.display = 'none';
        }
    }
    
    // Utility functions
    function escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
    
})();