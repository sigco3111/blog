// Test main.js with all modules
console.log('Test main.js loaded');

import { AuthManager } from './modules/auth.js';
console.log('AuthManager imported successfully');

import { PostManager } from './modules/post-manager.js';
console.log('PostManager imported successfully');

import { UIManager } from './modules/ui.js';
console.log('UIManager imported successfully');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded in test main.js');
    try {
        const auth = new AuthManager();
        console.log('AuthManager created successfully');
        
        const postManager = new PostManager();
        console.log('PostManager created successfully');
        
        const ui = new UIManager();
        console.log('UIManager created successfully');
        
        document.getElementById('app').innerHTML = '<h1>All modules test successful!</h1>';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('app').innerHTML = '<h1>Error: ' + error.message + '</h1>';
    }
});

console.log('Test main.js end');