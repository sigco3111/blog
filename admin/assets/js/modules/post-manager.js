// Post Management Module for Jekyll Admin

import { 
    parseJekyllFrontMatter, 
    generateJekyllFrontMatter, 
    generateJekyllFilename,
    formatJekyllDate,
    generateId,
    supportsFileSystemAccess,
    downloadFile,
    readFileAsText
} from './utils.js';
import { SearchEngine } from './search-engine.js';
import { createFileSystemError, createParsingError, createValidationError } from './error-handler.js';
import { showLoading, hideLoading, showSuccess, showError } from './notification-system.js';

/**
 * PostManager class handles all post-related operations
 * Supports both File System Access API and fallback methods
 */
export class PostManager {
    constructor() {
        this.posts = [];
        this.currentPost = null;
        this.directoryHandle = null;
        this.postsDirectoryHandle = null;
        this.supportsFileSystemAccess = supportsFileSystemAccess();
        this.searchEngine = new SearchEngine();
        
        // Post data structure template
        this.postTemplate = {
            id: '',
            filename: '',
            frontMatter: {
                layout: 'post',
                title: '',
                date: '',
                categories: [],
                tags: [],
                published: true
            },
            content: '',
            lastModified: null,
            isNew: false
        };
    }

    /**
     * Initialize the PostManager
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        const loadingId = showLoading('포스트 매니저를 초기화하는 중...');
        
        try {
            await this.loadPosts();
            hideLoading(loadingId);
            return true;
        } catch (error) {
            hideLoading(loadingId);
            createFileSystemError(`Failed to initialize PostManager: ${error.message}`, {
                operation: 'init',
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    /**
     * Load all posts from the _posts directory
     * @returns {Promise<Array>} Array of post objects
     */
    async loadPosts() {
        try {
            if (this.supportsFileSystemAccess && this.postsDirectoryHandle) {
                return await this.loadPostsFromFileSystem();
            } else {
                // Fallback: Load from existing posts (for demo purposes)
                return await this.loadPostsFromDemo();
            }
        } catch (error) {
            createFileSystemError(`Failed to load posts: ${error.message}`, {
                operation: 'loadPosts',
                supportsFileSystemAccess: this.supportsFileSystemAccess,
                hasDirectoryHandle: !!this.postsDirectoryHandle
            });
            throw new Error('Failed to load posts');
        }
    }

    /**
     * Load posts using File System Access API
     * @returns {Promise<Array>} Array of post objects
     */
    async loadPostsFromFileSystem() {
        const posts = [];
        
        try {
            for await (const [name, handle] of this.postsDirectoryHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.markdown')) {
                    const file = await handle.getFile();
                    const content = await file.text();
                    const post = this.parsePostFile(name, content, file.lastModified);
                    posts.push(post);
                }
            }
        } catch (error) {
            createFileSystemError(`Error reading posts directory: ${error.message}`, {
                operation: 'loadPostsFromFileSystem',
                directoryHandle: !!this.postsDirectoryHandle
            });
            throw error;
        }

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.frontMatter.date) - new Date(a.frontMatter.date));
        
        this.posts = posts;
        
        // Initialize search engine with loaded posts
        this.searchEngine.initialize(this.posts);
        
        // Preload common search queries for better performance
        this.searchEngine.preloadCommonQueries(['jekyll', 'blog', 'post', 'tutorial']);
        
        return posts;
    }

    /**
     * Load posts from demo data (fallback method)
     * @returns {Promise<Array>} Array of post objects
     */
    async loadPostsFromDemo() {
        // This is a fallback method for browsers that don't support File System Access API
        // In a real implementation, this would fetch from a server or use other storage methods
        const demoPost = {
            id: generateId(),
            filename: '2025-08-05-welcome-to-jekyll.markdown',
            frontMatter: {
                layout: 'post',
                title: 'Welcome to Jekyll!',
                date: '2025-08-05 10:27:35 +0900',
                categories: ['jekyll', 'update'],
                tags: [],
                published: true
            },
            content: `You'll find this post in your \`_posts\` directory. Go ahead and edit it and re-build the site to see your changes.

Jekyll requires blog post files to be named according to the following format:

\`YEAR-MONTH-DAY-title.MARKUP\`

Where \`YEAR\` is a four-digit number, \`MONTH\` and \`DAY\` are both two-digit numbers, and \`MARKUP\` is the file extension representing the format used in the file.`,
            lastModified: new Date('2025-08-05T10:27:35.000Z'),
            isNew: false
        };

        this.posts = [demoPost];
        
        // Initialize search engine with demo posts
        this.searchEngine.initialize(this.posts);
        
        // Preload common search queries for better performance
        this.searchEngine.preloadCommonQueries(['jekyll', 'blog', 'post', 'tutorial']);
        
        return this.posts;
    }

    /**
     * Parse a post file into a post object
     * @param {string} filename - File name
     * @param {string} content - File content
     * @param {number} lastModified - Last modified timestamp
     * @returns {Object} Post object
     */
    parsePostFile(filename, content, lastModified) {
        const { frontMatter, content: postContent } = parseJekyllFrontMatter(content);
        
        return {
            id: generateId(),
            filename,
            frontMatter: {
                layout: frontMatter.layout || 'post',
                title: frontMatter.title || '',
                date: frontMatter.date || '',
                categories: Array.isArray(frontMatter.categories) ? frontMatter.categories : 
                           typeof frontMatter.categories === 'string' ? frontMatter.categories.split(' ') : [],
                tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : 
                      typeof frontMatter.tags === 'string' ? frontMatter.tags.split(' ') : [],
                published: frontMatter.published !== false,
                ...frontMatter // Include any additional front matter fields
            },
            content: postContent.trim(),
            lastModified: new Date(lastModified),
            isNew: false
        };
    }

    /**
     * Create a new post
     * @param {Object} postData - Post data
     * @returns {Promise<Object>} Created post object
     */
    async createPost(postData) {
        try {
            const post = this.createPostObject(postData);
            
            if (this.supportsFileSystemAccess && this.postsDirectoryHandle) {
                await this.savePostToFileSystem(post);
            } else {
                // Fallback: Add to memory and provide download
                this.posts.unshift(post);
                this.downloadPost(post);
            }
            
            // Reinitialize search engine with updated posts
            this.searchEngine.initialize(this.posts);
            
            return post;
        } catch (error) {
            console.error('Error creating post:', error);
            throw new Error('Failed to create post');
        }
    }

    /**
     * Update an existing post
     * @param {string} id - Post ID
     * @param {Object} postData - Updated post data
     * @returns {Promise<Object>} Updated post object
     */
    async updatePost(id, postData) {
        try {
            const postIndex = this.posts.findIndex(p => p.id === id);
            if (postIndex === -1) {
                throw new Error('Post not found');
            }

            const existingPost = this.posts[postIndex];
            const updatedPost = {
                ...existingPost,
                frontMatter: {
                    ...existingPost.frontMatter,
                    ...postData.frontMatter
                },
                content: postData.content || existingPost.content,
                lastModified: new Date()
            };

            // Update filename if title or date changed
            if (postData.frontMatter.title || postData.frontMatter.date) {
                const date = new Date(postData.frontMatter.date || existingPost.frontMatter.date);
                const title = postData.frontMatter.title || existingPost.frontMatter.title;
                updatedPost.filename = generateJekyllFilename(title, date);
            }

            if (this.supportsFileSystemAccess && this.postsDirectoryHandle) {
                await this.savePostToFileSystem(updatedPost, existingPost.filename);
            } else {
                // Fallback: Update in memory and provide download
                this.posts[postIndex] = updatedPost;
                this.downloadPost(updatedPost);
            }

            // Reinitialize search engine with updated posts
            this.searchEngine.initialize(this.posts);

            return updatedPost;
        } catch (error) {
            console.error('Error updating post:', error);
            throw new Error('Failed to update post');
        }
    }

    /**
     * Delete a post
     * @param {string} id - Post ID
     * @returns {Promise<boolean>} Success status
     */
    async deletePost(id) {
        try {
            const postIndex = this.posts.findIndex(p => p.id === id);
            if (postIndex === -1) {
                throw new Error('Post not found');
            }

            const post = this.posts[postIndex];

            if (this.supportsFileSystemAccess && this.postsDirectoryHandle) {
                await this.deletePostFromFileSystem(post.filename);
            }
            
            // Remove from memory
            this.posts.splice(postIndex, 1);
            
            // Reinitialize search engine with updated posts
            this.searchEngine.initialize(this.posts);
            
            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw new Error('Failed to delete post');
        }
    }

    /**
     * Search posts using advanced search engine
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Search results with scores and highlights
     */
    searchPosts(query, options = {}) {
        if (!query || query.trim() === '') {
            return this.posts.map(post => ({
                post,
                score: 0,
                matchedWords: [],
                exactMatches: 0,
                fieldMatches: { title: 0, content: 0, category: 0, tag: 0 },
                highlights: {
                    title: post.frontMatter.title,
                    content: [],
                    categories: post.frontMatter.categories,
                    tags: post.frontMatter.tags
                }
            }));
        }

        return this.searchEngine.search(query, options);
    }

    /**
     * Get search suggestions
     * @param {string} partialQuery - Partial search query
     * @param {number} limit - Maximum number of suggestions
     * @returns {Array} Array of suggestions
     */
    getSearchSuggestions(partialQuery, limit = 10) {
        return this.searchEngine.getSuggestions(partialQuery, limit);
    }

    /**
     * Get search statistics
     * @returns {Object} Search statistics
     */
    getSearchStatistics() {
        return this.searchEngine.getStatistics();
    }

    /**
     * Get search performance metrics
     * @returns {Object} Performance metrics
     */
    getSearchPerformanceMetrics() {
        return this.searchEngine.getPerformanceMetrics();
    }

    /**
     * Get a post by ID
     * @param {string} id - Post ID
     * @returns {Object|null} Post object or null
     */
    getPostById(id) {
        return this.posts.find(p => p.id === id) || null;
    }

    /**
     * Get posts by category
     * @param {string} category - Category name
     * @returns {Array} Filtered posts
     */
    getPostsByCategory(category) {
        return this.posts.filter(post => 
            post.frontMatter.categories.includes(category)
        );
    }

    /**
     * Get all categories
     * @returns {Array} Array of unique categories
     */
    getAllCategories() {
        const categories = new Set();
        this.posts.forEach(post => {
            post.frontMatter.categories.forEach(cat => categories.add(cat));
        });
        return Array.from(categories).sort();
    }

    /**
     * Get all tags
     * @returns {Array} Array of unique tags
     */
    getAllTags() {
        const tags = new Set();
        this.posts.forEach(post => {
            post.frontMatter.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }

    /**
     * Create a post object from form data
     * @param {Object} postData - Form data
     * @returns {Object} Post object
     */
    createPostObject(postData) {
        const now = new Date();
        const date = postData.date ? new Date(postData.date) : now;
        
        const post = {
            id: generateId(),
            filename: generateJekyllFilename(postData.title, date),
            frontMatter: {
                layout: postData.layout || 'post',
                title: postData.title || '',
                date: formatJekyllDate(date),
                categories: this.parseArrayField(postData.categories),
                tags: this.parseArrayField(postData.tags),
                published: postData.published !== false,
                ...postData.additionalFields // Allow additional front matter fields
            },
            content: postData.content || '',
            lastModified: now,
            isNew: true
        };

        return post;
    }

    /**
     * Parse array field from form input
     * @param {string|Array} field - Field value
     * @returns {Array} Parsed array
     */
    parseArrayField(field) {
        if (Array.isArray(field)) {
            return field;
        }
        if (typeof field === 'string') {
            return field.split(',').map(item => item.trim()).filter(item => item);
        }
        return [];
    }

    /**
     * Save post to file system
     * @param {Object} post - Post object
     * @param {string} oldFilename - Old filename (for updates)
     * @returns {Promise<void>}
     */
    async savePostToFileSystem(post, oldFilename = null) {
        try {
            const content = this.generatePostContent(post);
            
            // Delete old file if filename changed
            if (oldFilename && oldFilename !== post.filename) {
                await this.deletePostFromFileSystem(oldFilename);
            }
            
            // Create new file
            const fileHandle = await this.postsDirectoryHandle.getFileHandle(
                post.filename, 
                { create: true }
            );
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Update posts array
            const existingIndex = this.posts.findIndex(p => p.id === post.id);
            if (existingIndex >= 0) {
                this.posts[existingIndex] = post;
            } else {
                this.posts.unshift(post);
            }
            
        } catch (error) {
            console.error('Error saving post to file system:', error);
            throw error;
        }
    }

    /**
     * Delete post from file system
     * @param {string} filename - File name to delete
     * @returns {Promise<void>}
     */
    async deletePostFromFileSystem(filename) {
        try {
            await this.postsDirectoryHandle.removeEntry(filename);
        } catch (error) {
            console.error('Error deleting post from file system:', error);
            throw error;
        }
    }

    /**
     * Generate post content with front matter
     * @param {Object} post - Post object
     * @returns {string} Complete post content
     */
    generatePostContent(post) {
        const frontMatter = generateJekyllFrontMatter(post.frontMatter);
        return frontMatter + '\n' + post.content;
    }

    /**
     * Download post as file (fallback method)
     * @param {Object} post - Post object
     */
    downloadPost(post) {
        const content = this.generatePostContent(post);
        downloadFile(content, post.filename, 'text/markdown');
    }

    /**
     * Set directory handle for File System Access API
     * @param {FileSystemDirectoryHandle} directoryHandle - Root directory handle
     */
    async setDirectoryHandle(directoryHandle) {
        this.directoryHandle = directoryHandle;
        
        try {
            // Get or create _posts directory
            this.postsDirectoryHandle = await directoryHandle.getDirectoryHandle('_posts', {
                create: true
            });
        } catch (error) {
            console.error('Error accessing _posts directory:', error);
            throw error;
        }
    }

    /**
     * Get post statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const published = this.posts.filter(p => p.frontMatter.published).length;
        const drafts = this.posts.length - published;
        const categories = this.getAllCategories().length;
        const tags = this.getAllTags().length;

        return {
            total: this.posts.length,
            published,
            drafts,
            categories,
            tags
        };
    }
}