// Search Engine Module for Jekyll Admin
// Provides client-side search functionality with indexing and ranking

/**
 * SearchEngine class handles all search-related operations
 * Includes indexing, ranking, and advanced search features
 */
export class SearchEngine {
    constructor() {
        this.posts = [];
        this.searchIndex = new Map();
        this.searchCache = new Map();
        this.suggestionCache = new Map();
        this.lastIndexUpdate = null;
        this.indexingInProgress = false;
        this.stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
            'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
            'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some',
            'her', 'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more',
            'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
            'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
            'come', 'made', 'may', 'part'
        ]);
        
        // Search configuration
        this.config = {
            minQueryLength: 2,
            maxResults: 50,
            titleWeight: 3,
            contentWeight: 1,
            categoryWeight: 2,
            tagWeight: 2,
            exactMatchBonus: 2,
            recentPostBonus: 0.1,
            maxCacheSize: 100,
            maxSuggestionCacheSize: 50,
            indexUpdateThreshold: 1000 // ms
        };
    }

    /**
     * Initialize the search engine with posts data
     * @param {Array} posts - Array of post objects
     */
    initialize(posts) {
        // Check if we need to rebuild the index
        const now = Date.now();
        const shouldRebuild = !this.lastIndexUpdate || 
                             (now - this.lastIndexUpdate) > this.config.indexUpdateThreshold ||
                             this.posts.length !== posts.length;

        this.posts = posts;
        
        if (shouldRebuild && !this.indexingInProgress) {
            this.buildSearchIndexAsync();
        }
        
        this.clearCache();
    }

    /**
     * Build search index for all posts
     * Creates inverted index for efficient searching
     */
    buildSearchIndex() {
        this.searchIndex.clear();
        
        this.posts.forEach((post, postIndex) => {
            // Index title
            this.indexText(post.frontMatter.title, postIndex, 'title');
            
            // Index content (limit content indexing for performance)
            const contentToIndex = post.content.length > 5000 
                ? post.content.substring(0, 5000) 
                : post.content;
            this.indexText(contentToIndex, postIndex, 'content');
            
            // Index categories
            post.frontMatter.categories.forEach(category => {
                this.indexText(category, postIndex, 'category');
            });
            
            // Index tags
            post.frontMatter.tags.forEach(tag => {
                this.indexText(tag, postIndex, 'tag');
            });
        });
        
        this.lastIndexUpdate = Date.now();
    }

    /**
     * Build search index asynchronously to avoid blocking UI
     */
    async buildSearchIndexAsync() {
        if (this.indexingInProgress) return;
        
        this.indexingInProgress = true;
        
        try {
            // Use requestIdleCallback if available, otherwise setTimeout
            if (window.requestIdleCallback) {
                await new Promise(resolve => {
                    window.requestIdleCallback(() => {
                        this.buildSearchIndex();
                        resolve();
                    });
                });
            } else {
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.buildSearchIndex();
                        resolve();
                    }, 0);
                });
            }
        } finally {
            this.indexingInProgress = false;
        }
    }

    /**
     * Index text content for a specific post and field type
     * @param {string} text - Text to index
     * @param {number} postIndex - Index of the post in posts array
     * @param {string} fieldType - Type of field (title, content, category, tag)
     */
    indexText(text, postIndex, fieldType) {
        if (!text) return;
        
        const words = this.tokenizeText(text);
        
        words.forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Map());
            }
            
            const wordIndex = this.searchIndex.get(word);
            if (!wordIndex.has(postIndex)) {
                wordIndex.set(postIndex, {
                    title: 0,
                    content: 0,
                    category: 0,
                    tag: 0
                });
            }
            
            wordIndex.get(postIndex)[fieldType]++;
        });
    }

    /**
     * Tokenize text into searchable words
     * @param {string} text - Text to tokenize
     * @returns {Array} Array of normalized words
     */
    tokenizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ') // Keep alphanumeric and Korean characters
            .split(/\s+/)
            .filter(word => 
                word.length >= 2 && 
                !this.stopWords.has(word) &&
                !/^\d+$/.test(word) // Exclude pure numbers
            );
    }

    /**
     * Search posts with advanced ranking
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Array of search results with scores
     */
    search(query, options = {}) {
        if (!query || query.trim().length < this.config.minQueryLength) {
            return [];
        }

        const normalizedQuery = query.trim();
        
        // Check cache first
        const cacheKey = this.getCacheKey(normalizedQuery, options);
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        const results = this.performSearch(normalizedQuery, options);
        
        // Cache results and manage cache size
        this.searchCache.set(cacheKey, results);
        this.manageCacheSize();
        
        return results;
    }

    /**
     * Perform the actual search operation
     * @param {string} query - Normalized search query
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    performSearch(query, options) {
        const queryWords = this.tokenizeText(query);
        
        // Use optimized search for better performance
        const postScores = this.posts.length > 100 
            ? this.optimizedSearch(query, queryWords)
            : this.standardSearch(query, queryWords);

        // Check for exact phrase matches and apply bonuses
        postScores.forEach((scoreData, postIndex) => {
            const post = this.posts[postIndex];
            
            // Exact phrase match bonus
            if (this.hasExactMatch(post, query)) {
                scoreData.score *= this.config.exactMatchBonus;
                scoreData.exactMatches++;
            }
            
            // Recent post bonus (posts from last 30 days get slight boost)
            const postDate = new Date(post.frontMatter.date);
            const daysSincePost = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSincePost <= 30) {
                scoreData.score += this.config.recentPostBonus * (30 - daysSincePost);
            }
            
            // Query coverage bonus (how many query words matched)
            const coverage = scoreData.matchedWords.size / queryWords.length;
            scoreData.score *= (0.5 + coverage * 0.5);
        });

        // Convert to results array and sort by score
        const results = Array.from(postScores.entries())
            .map(([postIndex, scoreData]) => ({
                post: this.posts[postIndex],
                score: scoreData.score,
                matchedWords: Array.from(scoreData.matchedWords),
                exactMatches: scoreData.exactMatches,
                fieldMatches: scoreData.fieldMatches,
                highlights: this.generateHighlights(this.posts[postIndex], query, scoreData.matchedWords)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.maxResults);

        return results;
    }

    /**
     * Check if post contains exact phrase match
     * @param {Object} post - Post object
     * @param {string} query - Search query
     * @returns {boolean} True if exact match found
     */
    hasExactMatch(post, query) {
        const lowerQuery = query.toLowerCase();
        
        return (
            post.frontMatter.title.toLowerCase().includes(lowerQuery) ||
            post.content.toLowerCase().includes(lowerQuery) ||
            post.frontMatter.categories.some(cat => 
                cat.toLowerCase().includes(lowerQuery)) ||
            post.frontMatter.tags.some(tag => 
                tag.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Generate highlights for search results
     * @param {Object} post - Post object
     * @param {string} query - Original search query
     * @param {Set} matchedWords - Set of matched words
     * @returns {Object} Highlight information
     */
    generateHighlights(post, query, matchedWords) {
        const highlights = {
            title: this.highlightText(post.frontMatter.title, query, matchedWords),
            content: this.highlightContent(post.content, query, matchedWords),
            categories: post.frontMatter.categories.map(cat => 
                this.highlightText(cat, query, matchedWords)),
            tags: post.frontMatter.tags.map(tag => 
                this.highlightText(tag, query, matchedWords))
        };
        
        return highlights;
    }

    /**
     * Highlight matched terms in text
     * @param {string} text - Text to highlight
     * @param {string} query - Search query
     * @param {Set} matchedWords - Set of matched words
     * @returns {string} Text with highlight markers
     */
    highlightText(text, query, matchedWords) {
        if (!text) return '';
        
        let highlightedText = text;
        
        // First, try exact phrase match
        const exactRegex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        highlightedText = highlightedText.replace(exactRegex, '<mark class="exact-match">$1</mark>');
        
        // Then highlight individual matched words
        matchedWords.forEach(word => {
            const wordRegex = new RegExp(`\\b(${this.escapeRegex(word)})\\b`, 'gi');
            highlightedText = highlightedText.replace(wordRegex, (match, p1) => {
                // Don't double-highlight if already in exact match
                if (match.includes('<mark')) return match;
                return `<mark class="word-match">${p1}</mark>`;
            });
        });
        
        return highlightedText;
    }

    /**
     * Highlight content with context snippets
     * @param {string} content - Content to highlight
     * @param {string} query - Search query
     * @param {Set} matchedWords - Set of matched words
     * @returns {Array} Array of content snippets with highlights
     */
    highlightContent(content, query, matchedWords) {
        if (!content) return [];
        
        const snippets = [];
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        
        sentences.forEach((sentence, index) => {
            const lowerSentence = sentence.toLowerCase();
            const hasMatch = matchedWords.some(word => lowerSentence.includes(word)) ||
                           lowerSentence.includes(query.toLowerCase());
            
            if (hasMatch) {
                const highlighted = this.highlightText(sentence.trim(), query, matchedWords);
                snippets.push({
                    text: highlighted,
                    index: index,
                    context: this.getContextSnippet(sentences, index)
                });
            }
        });
        
        return snippets.slice(0, 3); // Limit to 3 snippets per post
    }

    /**
     * Get context snippet around a sentence
     * @param {Array} sentences - Array of sentences
     * @param {number} index - Index of target sentence
     * @returns {string} Context snippet
     */
    getContextSnippet(sentences, index) {
        const start = Math.max(0, index - 1);
        const end = Math.min(sentences.length, index + 2);
        return sentences.slice(start, end).join('. ').trim();
    }

    /**
     * Escape special regex characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get cache key for search query and options
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {string} Cache key
     */
    getCacheKey(query, options) {
        return `${query}|${JSON.stringify(options)}`;
    }

    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
        this.suggestionCache.clear();
    }

    /**
     * Manage cache size to prevent memory issues
     */
    manageCacheSize() {
        // Manage search cache
        if (this.searchCache.size > this.config.maxCacheSize) {
            const entries = Array.from(this.searchCache.entries());
            // Remove oldest 25% of entries
            const toRemove = Math.floor(entries.length * 0.25);
            for (let i = 0; i < toRemove; i++) {
                this.searchCache.delete(entries[i][0]);
            }
        }

        // Manage suggestion cache
        if (this.suggestionCache.size > this.config.maxSuggestionCacheSize) {
            const entries = Array.from(this.suggestionCache.entries());
            const toRemove = Math.floor(entries.length * 0.25);
            for (let i = 0; i < toRemove; i++) {
                this.suggestionCache.delete(entries[i][0]);
            }
        }
    }

    /**
     * Get search suggestions based on partial query
     * @param {string} partialQuery - Partial search query
     * @param {number} limit - Maximum number of suggestions
     * @returns {Array} Array of suggestions
     */
    getSuggestions(partialQuery, limit = 10) {
        if (!partialQuery || partialQuery.length < 2) {
            return [];
        }
        
        const cacheKey = `${partialQuery.toLowerCase()}|${limit}`;
        
        // Check cache first
        if (this.suggestionCache.has(cacheKey)) {
            return this.suggestionCache.get(cacheKey);
        }
        
        const suggestions = new Set();
        const lowerQuery = partialQuery.toLowerCase();
        
        // Get suggestions from search index (optimized)
        for (const [word, postMap] of this.searchIndex) {
            if (word.startsWith(lowerQuery)) {
                suggestions.add(word);
                if (suggestions.size >= limit * 2) break; // Get more than needed for better results
            }
        }
        
        // Add suggestions from post titles (only if we need more)
        if (suggestions.size < limit * 1.5) {
            for (const post of this.posts) {
                const titleWords = this.tokenizeText(post.frontMatter.title);
                for (const word of titleWords) {
                    if (word.startsWith(lowerQuery)) {
                        suggestions.add(word);
                        if (suggestions.size >= limit * 2) break;
                    }
                }
                if (suggestions.size >= limit * 2) break;
            }
        }
        
        // Sort suggestions by frequency and relevance
        const sortedSuggestions = Array.from(suggestions)
            .map(word => ({
                word,
                frequency: this.searchIndex.get(word)?.size || 0,
                exactMatch: word === lowerQuery
            }))
            .sort((a, b) => {
                // Exact matches first
                if (a.exactMatch && !b.exactMatch) return -1;
                if (!a.exactMatch && b.exactMatch) return 1;
                // Then by frequency
                return b.frequency - a.frequency;
            })
            .slice(0, limit)
            .map(item => item.word);
        
        // Cache results
        this.suggestionCache.set(cacheKey, sortedSuggestions);
        
        return sortedSuggestions;
    }

    /**
     * Get search statistics
     * @returns {Object} Search statistics
     */
    getStatistics() {
        return {
            totalPosts: this.posts.length,
            indexedWords: this.searchIndex.size,
            cacheSize: this.searchCache.size,
            averageWordsPerPost: this.posts.length > 0 ? 
                Array.from(this.searchIndex.values())
                    .reduce((sum, postMap) => sum + postMap.size, 0) / this.posts.length : 0
        };
    }

    /**
     * Update search configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.clearCache(); // Clear cache when config changes
    }

    /**
     * Optimize search performance for large datasets
     * @param {string} query - Search query
     * @param {Array} queryWords - Tokenized query words
     * @returns {Map} Optimized post scores
     */
    optimizedSearch(query, queryWords) {
        const postScores = new Map();
        const relevantPosts = new Set();
        
        // First pass: find posts that contain any query words
        queryWords.forEach(word => {
            if (this.searchIndex.has(word)) {
                const wordIndex = this.searchIndex.get(word);
                wordIndex.forEach((fieldCounts, postIndex) => {
                    relevantPosts.add(postIndex);
                });
            }
        });
        
        // Second pass: calculate scores only for relevant posts
        relevantPosts.forEach(postIndex => {
            const scoreData = {
                score: 0,
                matchedWords: new Set(),
                exactMatches: 0,
                fieldMatches: {
                    title: 0,
                    content: 0,
                    category: 0,
                    tag: 0
                }
            };
            
            queryWords.forEach(word => {
                if (this.searchIndex.has(word)) {
                    const wordIndex = this.searchIndex.get(word);
                    if (wordIndex.has(postIndex)) {
                        const fieldCounts = wordIndex.get(postIndex);
                        scoreData.matchedWords.add(word);
                        
                        // Calculate field-specific scores
                        scoreData.score += fieldCounts.title * this.config.titleWeight;
                        scoreData.score += fieldCounts.content * this.config.contentWeight;
                        scoreData.score += fieldCounts.category * this.config.categoryWeight;
                        scoreData.score += fieldCounts.tag * this.config.tagWeight;
                        
                        // Track field matches
                        scoreData.fieldMatches.title += fieldCounts.title;
                        scoreData.fieldMatches.content += fieldCounts.content;
                        scoreData.fieldMatches.category += fieldCounts.category;
                        scoreData.fieldMatches.tag += fieldCounts.tag;
                    }
                }
            });
            
            if (scoreData.matchedWords.size > 0) {
                postScores.set(postIndex, scoreData);
            }
        });
        
        return postScores;
    }

    /**
     * Standard search for smaller datasets
     * @param {string} query - Search query
     * @param {Array} queryWords - Tokenized query words
     * @returns {Map} Post scores
     */
    standardSearch(query, queryWords) {
        const postScores = new Map();
        
        // Find posts that contain query words
        queryWords.forEach(word => {
            if (this.searchIndex.has(word)) {
                const wordIndex = this.searchIndex.get(word);
                
                wordIndex.forEach((fieldCounts, postIndex) => {
                    if (!postScores.has(postIndex)) {
                        postScores.set(postIndex, {
                            score: 0,
                            matchedWords: new Set(),
                            exactMatches: 0,
                            fieldMatches: {
                                title: 0,
                                content: 0,
                                category: 0,
                                tag: 0
                            }
                        });
                    }
                    
                    const postScore = postScores.get(postIndex);
                    postScore.matchedWords.add(word);
                    
                    // Calculate field-specific scores
                    postScore.score += fieldCounts.title * this.config.titleWeight;
                    postScore.score += fieldCounts.content * this.config.contentWeight;
                    postScore.score += fieldCounts.category * this.config.categoryWeight;
                    postScore.score += fieldCounts.tag * this.config.tagWeight;
                    
                    // Track field matches for highlighting
                    postScore.fieldMatches.title += fieldCounts.title;
                    postScore.fieldMatches.content += fieldCounts.content;
                    postScore.fieldMatches.category += fieldCounts.category;
                    postScore.fieldMatches.tag += fieldCounts.tag;
                });
            }
        });
        
        return postScores;
    }

    /**
     * Preload frequently searched terms for better performance
     * @param {Array} commonQueries - Array of common search queries
     */
    preloadCommonQueries(commonQueries = []) {
        const defaultQueries = ['post', 'blog', 'tutorial', 'guide', 'how', 'what', 'why'];
        const queriesToPreload = [...defaultQueries, ...commonQueries];
        
        queriesToPreload.forEach(query => {
            if (query.length >= this.config.minQueryLength) {
                // Preload search results
                this.search(query);
                // Preload suggestions
                this.getSuggestions(query);
            }
        });
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            indexSize: this.searchIndex.size,
            cacheHitRate: this.searchCache.size > 0 ? 
                (this.searchCache.size / (this.searchCache.size + 1)) * 100 : 0,
            suggestionCacheSize: this.suggestionCache.size,
            lastIndexUpdate: this.lastIndexUpdate,
            indexingInProgress: this.indexingInProgress,
            memoryUsage: {
                searchIndex: this.searchIndex.size,
                searchCache: this.searchCache.size,
                suggestionCache: this.suggestionCache.size
            }
        };
    }
}