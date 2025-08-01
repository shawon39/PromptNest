// Search functionality for PromptNest
class PromptNestSearch {
    constructor() {
        this.searchInput = null;
        this.searchClear = null;
        this.currentQuery = '';
        this.searchDebounceTimer = null;
        this.searchHistory = [];
        this.maxHistorySize = 10;
        
        this.init();
    }

    init() {
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        
        if (this.searchInput) {
            this.attachEventListeners();
            this.loadSearchHistory();
        }
    }

    attachEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));
        this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
        this.searchInput.addEventListener('blur', this.handleBlur.bind(this));
        
        // Clear button event
        if (this.searchClear) {
            this.searchClear.addEventListener('click', this.clearSearch.bind(this));
        }
    }

    handleSearchInput(event) {
        const query = event.target.value;
        this.currentQuery = query;
        
        // Show/hide clear button
        if (this.searchClear) {
            this.searchClear.style.display = query.length > 0 ? 'block' : 'none';
        }
        
        // Debounce search to avoid too many calls
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 200);
    }

    handleKeydown(event) {
        // Handle keyboard shortcuts
        switch (event.key) {
            case 'Escape':
                this.clearSearch();
                event.preventDefault();
                break;
            case 'Enter':
                this.addToSearchHistory(this.currentQuery);
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.focusFirstResult();
                event.preventDefault();
                break;
        }
    }

    handleFocus() {
        // Add focus styling or show search suggestions
        this.searchInput.parentElement.classList.add('search-focused');
    }

    handleBlur() {
        // Remove focus styling
        setTimeout(() => {
            this.searchInput.parentElement.classList.remove('search-focused');
        }, 100);
    }

    async performSearch(query) {
        try {
            // Update UI to show search is happening
            this.setSearchState('searching');
            
            if (!query || query.trim() === '') {
                // Show all prompts when search is empty
                await this.showAllPrompts();
            } else {
                // Perform the actual search
                const results = await this.searchPrompts(query.trim());
                await this.displaySearchResults(results, query);
            }
            
            this.setSearchState('idle');
        } catch (error) {
            console.error('Search failed:', error);
            this.setSearchState('error');
        }
    }

    async searchPrompts(query) {
        // Use fuzzy search algorithm
        const allPrompts = await promptNestStorage.getPrompts();
        const searchResults = [];
        
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
        
        for (const prompt of allPrompts) {
            const score = this.calculateSearchScore(prompt, queryLower, queryWords);
            if (score > 0) {
                searchResults.push({ ...prompt, searchScore: score });
            }
        }
        
        // Sort by relevance score (higher is better)
        return searchResults.sort((a, b) => b.searchScore - a.searchScore);
    }

    calculateSearchScore(prompt, query, queryWords) {
        let score = 0;
        const title = prompt.title.toLowerCase();
        const content = prompt.content.toLowerCase();
        
        // Exact title match gets highest score
        if (title === query) {
            score += 100;
        } else if (title.includes(query)) {
            score += 50;
        }
        
        // Exact content match
        if (content.includes(query)) {
            score += 30;
        }
        
        // Word-based matching
        for (const word of queryWords) {
            if (word.length < 2) continue;
            
            // Title word matches
            if (title.includes(word)) {
                score += 20;
                // Bonus for word at beginning
                if (title.startsWith(word)) {
                    score += 10;
                }
            }
            
            // Content word matches
            if (content.includes(word)) {
                score += 10;
            }
        }
        
        // Bonus for frequently used prompts
        score += (prompt.useCount || 0) * 2;
        
        // Bonus for recently used prompts
        if (prompt.lastUsed && prompt.lastUsed > Date.now() - 7 * 24 * 60 * 60 * 1000) {
            score += 5;
        }
        
        return score;
    }

    async displaySearchResults(results, query) {
        const promptList = document.getElementById('promptList');
        const contentTitle = document.getElementById('contentTitle');
        
        if (!promptList || !contentTitle) return;
        
        // Update header
        contentTitle.textContent = `Search: "${query}" (${results.length} found)`;
        
        if (results.length === 0) {
            this.showNoResults(query);
            return;
        }
        
        // Clear current content
        promptList.innerHTML = '';
        
        // Display results
        for (const prompt of results) {
            const promptElement = await this.createPromptElement(prompt, query);
            promptList.appendChild(promptElement);
        }
        
        // Update category selection
        this.updateCategorySelection('search');
    }

    async showAllPrompts() {
        const contentTitle = document.getElementById('contentTitle');
        if (contentTitle) {
            contentTitle.textContent = 'All Prompts';
        }
        
        // Reload all prompts (this should trigger the main app's display logic)
        if (window.promptNestUI && window.promptNestUI.loadPrompts) {
            await window.promptNestUI.loadPrompts();
        }
        
        // Update category selection back to 'all'
        this.updateCategorySelection('all');
    }

    showNoResults(query) {
        const promptList = document.getElementById('promptList');
        if (!promptList) return;
        
        promptList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <span class="icon icon-search icon-lg"></span>
                </div>
                <h4>No prompts found</h4>
                <p>No prompts match "${query}"</p>
                <button class="secondary-button" data-action="clear-search">
                    Clear Search
                </button>
            </div>
        `;
        
        // Add event delegation for clear search button
        const clearButton = promptList.querySelector('[data-action="clear-search"]');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    async createPromptElement(prompt, searchQuery = '') {
        const categories = await promptNestStorage.getCategories();
        const category = categories.find(cat => cat.id === prompt.categoryId);
        
        const promptDiv = document.createElement('div');
        promptDiv.className = 'prompt-item';
        promptDiv.dataset.promptId = prompt.id;
        
        // Highlight search terms in title and content
        const highlightedTitle = this.highlightSearchTerms(prompt.title, searchQuery);
        const highlightedContent = this.highlightSearchTerms(
            prompt.content.length > 150 ? prompt.content.substring(0, 150) + '...' : prompt.content,
            searchQuery
        );
        
        promptDiv.innerHTML = `
            <div class="prompt-header">
                <div class="prompt-title">${highlightedTitle}</div>
                <div class="prompt-actions">
                    <button class="primary-button" data-action="use" data-prompt-id="${prompt.id}" title="Insert Prompt">
                        <span class="icon icon-use"></span> Insert
                    </button>
                    <button class="icon-button" data-action="copy" data-prompt-id="${prompt.id}" title="Copy Prompt">
                        <span class="icon icon-copy"></span>
                    </button>
                    <button class="icon-button" data-action="edit" data-prompt-id="${prompt.id}" title="Edit">
                        <span class="icon icon-edit"></span>
                    </button>
                    <button class="icon-button" data-action="clone" data-prompt-id="${prompt.id}" title="Clone">
                        <span class="icon icon-duplicate"></span>
                    </button>
                    <button class="icon-button" data-action="delete" data-prompt-id="${prompt.id}" title="Delete">
                        <span class="icon icon-delete"></span>
                    </button>
                </div>
            </div>
            <div class="prompt-content">${highlightedContent}</div>
            <div class="prompt-meta">
                <span class="prompt-category">${category ? category.name : 'Uncategorized'}</span>
                <span class="prompt-usage">Used ${prompt.useCount || 0} times</span>
            </div>
        `;
        
        // Add event delegation for prompt actions
        const promptActions = promptDiv.querySelector('.prompt-actions');
        if (promptActions) {
            promptActions.addEventListener('click', (e) => {
                const button = e.target.closest('[data-action]');
                if (!button) return;
                
                const action = button.dataset.action;
                const promptId = button.dataset.promptId;
                
                if (window.promptNestUI) {
                    switch (action) {
                        case 'use':
                            window.promptNestUI.usePrompt(promptId);
                            break;
                        case 'edit':
                            window.promptNestUI.editPrompt(promptId);
                            break;
                        case 'clone':
                            window.promptNestUI.clonePrompt(promptId);
                            break;
                        case 'delete':
                            window.promptNestUI.deletePrompt(promptId);
                            break;
                    }
                }
                
                e.stopPropagation();
            });
        }
        
        return promptDiv;
    }

    highlightSearchTerms(text, query) {
        if (!query || query.trim() === '') return text;
        
        const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        let highlightedText = text;
        
        for (const word of queryWords) {
            const regex = new RegExp(`(${this.escapeRegExp(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        }
        
        return highlightedText;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        
        if (this.searchClear) {
            this.searchClear.style.display = 'none';
        }
        
        // Clear search debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Show all prompts
        this.showAllPrompts();
        
        // Focus back to search input
        this.searchInput.focus();
    }

    setSearchState(state) {
        const searchContainer = this.searchInput.parentElement;
        
        // Remove all state classes
        searchContainer.classList.remove('search-searching', 'search-error');
        
        // Add current state class
        if (state === 'searching') {
            searchContainer.classList.add('search-searching');
        } else if (state === 'error') {
            searchContainer.classList.add('search-error');
        }
    }

    updateCategorySelection(categoryId) {
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === categoryId) {
                item.classList.add('active');
            }
        });
    }

    focusFirstResult() {
        const firstResult = document.querySelector('.prompt-item');
        if (firstResult) {
            firstResult.focus();
        }
    }

    // Search history management
    addToSearchHistory(query) {
        if (!query || query.trim() === '' || query.length < 2) return;
        
        const trimmedQuery = query.trim();
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Limit size
        if (this.searchHistory.length > this.maxHistorySize) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }
        
        this.saveSearchHistory();
    }

    async loadSearchHistory() {
        try {
            const history = await promptNestStorage.getItem('searchHistory');
            this.searchHistory = history || [];
        } catch (error) {
            console.error('Failed to load search history:', error);
            this.searchHistory = [];
        }
    }

    async saveSearchHistory() {
        try {
            await promptNestStorage.setItem('searchHistory', this.searchHistory);
        } catch (error) {
            console.error('Failed to save search history:', error);
        }
    }

    getSearchHistory() {
        return this.searchHistory;
    }

    // Public methods for external use
    search(query) {
        this.searchInput.value = query;
        this.currentQuery = query;
        this.performSearch(query);
    }

    getCurrentQuery() {
        return this.currentQuery;
    }

    isSearchActive() {
        return this.currentQuery && this.currentQuery.trim() !== '';
    }
}

// Initialize search functionality
let promptNestSearch;

document.addEventListener('DOMContentLoaded', () => {
    if (!window.promptNestSearch) {
        promptNestSearch = new PromptNestSearch();
        window.promptNestSearch = promptNestSearch;
    }
});

// Export for global access
if (typeof window !== 'undefined') {
    window.promptNestSearch = promptNestSearch;
}