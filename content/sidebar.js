// PromptNest Sidebar functionality - Refactored
class PromptNestSidebar {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentCategory = 'all';
        this.currentPrompt = null;
        this.prompts = [];
        this.categories = [];
        
        // Initialize helper modules
        this.modalManager = new SidebarModalManager(this);
        this.utils = new SidebarUtils(this);
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.createSidebar();
        this.setupEventListeners();
        this.utils.setupKeyboardShortcuts();
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get(['prompts', 'categories']);
            this.prompts = result.prompts || [];
            this.categories = result.categories || [];
            
            // Add default "All" category if no categories exist
            if (this.categories.length === 0) {
                this.categories = [{ id: 'all', name: 'All Prompts', created: Date.now() }];
            }
        } catch (error) {
            console.error('Failed to load PromptNest data:', error);
            this.prompts = [];
            this.categories = [{ id: 'all', name: 'All Prompts', created: Date.now() }];
        }
    }

    createSidebar() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'promptnest-sidebar-overlay';
        this.overlay.addEventListener('click', () => this.close());

        // Create sidebar
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'promptnest-sidebar';
        this.sidebar.innerHTML = this.generateSidebarHTML();

        // Append to body
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.sidebar);
    }

    generateSidebarHTML() {
        return `
            <div class="promptnest-sidebar-content">
                <!-- Header -->
                <div class="promptnest-header">
                    <div class="promptnest-header-content">
                        <h1 class="promptnest-title">
                            <span class="icon icon-folder icon-lg promptnest-title-icon"></span>
                            PromptNest
                        </h1>
                        <div class="promptnest-header-actions">
                            <button class="promptnest-settings-btn" id="promptnest-settings" title="Settings">
                                <span class="icon icon-settings"></span>
                            </button>
                            <button class="promptnest-close-btn" id="promptnest-close">
                                <span class="icon icon-close"></span>
                            </button>
                        </div>
                    </div>
                    <div class="promptnest-search-container">
                        <input type="text" id="promptnest-search" placeholder="Search prompts..." class="promptnest-search-input">
                        <button class="promptnest-search-clear" id="promptnest-search-clear" style="display: none;">
                            <span class="icon icon-close"></span>
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="promptnest-main">
                    <!-- Categories Sidebar -->
                    <div class="promptnest-categories">
                        <div class="promptnest-categories-header">
                            <span>Categories</span>
                            <button id="promptnest-add-category" style="background:none;border:none;color:inherit;cursor:pointer;font-size:14px;">+</button>
                        </div>
                        <div id="promptnest-category-list">
                            ${this.generateCategoriesHTML()}
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="promptnest-content">
                        <div class="promptnest-content-header">
                            <h3 class="promptnest-content-title" id="promptnest-content-title">All Prompts</h3>
                            <button class="promptnest-add-btn" id="promptnest-add-prompt">
                                <span class="icon icon-plus"></span>
                                Add Prompt
                            </button>
                        </div>
                        
                        <div class="promptnest-prompt-list" id="promptnest-prompt-list">
                            ${this.generatePromptsHTML()}
                        </div>
                    </div>
                </div>

                <!-- Modal Container -->
                <div class="promptnest-modal-overlay" id="promptnest-modal-overlay">
                    <div class="promptnest-modal" id="promptnest-modal">
                        <!-- Modal content will be dynamically inserted here -->
                    </div>
                </div>
            </div>
        `;
    }

    generateCategoriesHTML() {
        const allCategory = `
            <div class="promptnest-category-item active" data-category="all">
                <span>All Prompts</span>
                <span class="promptnest-category-count">${this.prompts.length}</span>
            </div>
        `;

        const categoryItems = this.categories
            .filter(cat => cat.id !== 'all')
            .map(category => {
                const count = this.prompts.filter(p => p.categoryId === category.id).length;
                return `
                    <div class="promptnest-category-item" data-category="${category.id}">
                        <span>${category.name}</span>
                        <span class="promptnest-category-count">${count}</span>
                    </div>
                `;
            }).join('');

        return allCategory + categoryItems;
    }

    generatePromptsHTML() {
        const filteredPrompts = this.currentCategory === 'all' 
            ? this.prompts 
            : this.prompts.filter(p => p.categoryId === this.currentCategory);

        if (filteredPrompts.length === 0) {
            return `
                <div class="promptnest-empty-state">
                    <div class="promptnest-empty-icon">
                        <span class="icon icon-document icon-lg"></span>
                    </div>
                    <h4 class="promptnest-empty-title">No prompts yet</h4>
                    <p class="promptnest-empty-text">Create your first prompt to get started</p>
                </div>
            `;
        }

        return filteredPrompts.map(prompt => `
            <div class="promptnest-prompt-item" data-prompt-id="${prompt.id}">
                <div class="promptnest-prompt-title">${prompt.title}</div>
                <div class="promptnest-prompt-content">${prompt.content}</div>
                <div class="promptnest-prompt-actions">
                    <button class="promptnest-use-btn" data-action="use" data-prompt-id="${prompt.id}">
                        <span class="icon icon-use"></span> Insert
                    </button>
                    <button class="promptnest-copy-btn" data-action="copy" data-prompt-id="${prompt.id}">
                        <span class="icon icon-copy"></span> Copy
                    </button>
                    <button class="promptnest-edit-btn" data-action="edit" data-prompt-id="${prompt.id}">
                        <span class="icon icon-edit"></span> Edit
                    </button>
                    <button class="promptnest-delete-btn" data-action="delete" data-prompt-id="${prompt.id}">
                        <span class="icon icon-delete"></span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        if (!this.sidebar) return;

        // Close button
        const closeBtn = this.sidebar.querySelector('#promptnest-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Search functionality
        const searchInput = this.sidebar.querySelector('#promptnest-search');
        const searchClear = this.sidebar.querySelector('#promptnest-search-clear');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
                
                // Show/hide clear button
                if (searchClear) {
                    searchClear.style.display = e.target.value.trim() ? 'block' : 'none';
                }
            });
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.style.display = 'none';
                this.handleSearch('');
                searchInput.focus();
            });
        }

        // Category selection
        const categoryList = this.sidebar.querySelector('#promptnest-category-list');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                const categoryItem = e.target.closest('.promptnest-category-item');
                if (categoryItem) {
                    this.selectCategory(categoryItem.dataset.category);
                }
            });
        }

        // Settings button
        const settingsBtn = this.sidebar.querySelector('#promptnest-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.modalManager.showSettingsModal());
        }

        // Add category button
        const addCategoryBtn = this.sidebar.querySelector('#promptnest-add-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.modalManager.showAddCategoryModal());
        }

        // Add prompt button with debouncing to prevent rapid clicks
        const addPromptBtn = this.sidebar.querySelector('#promptnest-add-prompt');
        if (addPromptBtn) {
            const debouncedShowModal = this.utils.debounce(() => this.modalManager.showAddPromptModal(), 300);
            addPromptBtn.addEventListener('click', debouncedShowModal);
        }

        // Prompt actions
        const promptList = this.sidebar.querySelector('#promptnest-prompt-list');
        if (promptList) {
            promptList.addEventListener('click', (e) => {
                const button = e.target.closest('[data-action]');
                if (button) {
                    const action = button.dataset.action;
                    const promptId = button.dataset.promptId;
                    this.handlePromptAction(action, promptId);
                }
            });
        }
    }

    handleSearch(query) {
        const searchInput = this.sidebar.querySelector('#promptnest-search');
        
        if (!query.trim()) {
            // If search is empty, show prompts based on current category
            this.updatePromptList();
            return;
        }
        
        // Filter based on current category first, then search within those results
        let basePrompts = this.currentCategory === 'all' 
            ? this.prompts 
            : this.prompts.filter(p => p.categoryId === this.currentCategory);
            
        const filteredPrompts = basePrompts.filter(prompt => 
            prompt.title.toLowerCase().includes(query.toLowerCase()) ||
            prompt.content.toLowerCase().includes(query.toLowerCase())
        );
        
        this.updatePromptList(filteredPrompts);
        
        // Update content title to show search results
        const titleEl = this.sidebar.querySelector('#promptnest-content-title');
        if (titleEl) {
            if (query.trim()) {
                const categoryName = this.currentCategory === 'all' ? 'All Prompts' : 
                    (this.categories.find(cat => cat.id === this.currentCategory)?.name || 'Unknown');
                titleEl.textContent = `Search in ${categoryName} (${filteredPrompts.length})`;
            } else {
                const categoryName = this.currentCategory === 'all' ? 'All Prompts' : 
                    (this.categories.find(cat => cat.id === this.currentCategory)?.name || 'Unknown');
                titleEl.textContent = categoryName;
            }
        }
    }

    selectCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update category UI
        const categoryItems = this.sidebar.querySelectorAll('.promptnest-category-item');
        categoryItems.forEach(item => {
            item.classList.toggle('active', item.dataset.category === categoryId);
        });
        
        // Update content title
        const category = this.categories.find(cat => cat.id === categoryId);
        const title = category ? category.name : 'All Prompts';
        const titleEl = this.sidebar.querySelector('#promptnest-content-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
        
        // Clear search when switching categories
        const searchInput = this.sidebar.querySelector('#promptnest-search');
        const searchClear = this.sidebar.querySelector('#promptnest-search-clear');
        if (searchInput && searchInput.value.trim()) {
            searchInput.value = '';
            if (searchClear) {
                searchClear.style.display = 'none';
            }
        }
        
        // Update prompt list
        this.updatePromptList();
    }

    updatePromptList(customPrompts = null) {
        const prompts = customPrompts || (this.currentCategory === 'all' 
            ? this.prompts 
            : this.prompts.filter(p => p.categoryId === this.currentCategory));
        
        const promptList = this.sidebar.querySelector('#promptnest-prompt-list');
        if (promptList) {
            promptList.innerHTML = this.generatePromptsHTMLFromArray(prompts);
        }
    }

    generatePromptsHTMLFromArray(prompts) {
        if (prompts.length === 0) {
            return `
                <div class="promptnest-empty-state">
                    <div class="promptnest-empty-icon">
                        <span class="icon icon-search icon-lg"></span>
                    </div>
                    <h4 class="promptnest-empty-title">No prompts found</h4>
                    <p class="promptnest-empty-text">Try adjusting your search or create a new prompt</p>
                </div>
            `;
        }

        return prompts.map(prompt => `
            <div class="promptnest-prompt-item" data-prompt-id="${prompt.id}">
                <div class="promptnest-prompt-title">${prompt.title}</div>
                <div class="promptnest-prompt-content">${prompt.content}</div>
                <div class="promptnest-prompt-actions">
                    <button class="promptnest-use-btn" data-action="use" data-prompt-id="${prompt.id}">
                        <span class="icon icon-use"></span> Insert
                    </button>
                    <button class="promptnest-copy-btn" data-action="copy" data-prompt-id="${prompt.id}">
                        <span class="icon icon-copy"></span> Copy
                    </button>
                    <button class="promptnest-edit-btn" data-action="edit" data-prompt-id="${prompt.id}">
                        <span class="icon icon-edit"></span> Edit
                    </button>
                    <button class="promptnest-delete-btn" data-action="delete" data-prompt-id="${prompt.id}">
                        <span class="icon icon-delete"></span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async handlePromptAction(action, promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return;

        switch (action) {
            case 'use':
                await this.usePrompt(prompt);
                break;
            case 'copy':
                await this.copyPrompt(prompt);
                break;
            case 'edit':
                this.modalManager.showEditPromptModal(prompt);
                break;
            case 'delete':
                this.modalManager.showDeleteConfirmModal(promptId);
                break;
        }
    }

    async usePrompt(prompt) {
        // Find input field on the page and fill it
        const success = this.utils.findAndFillInput(prompt.content);
        
        if (success) {
            // Update usage stats
            prompt.useCount = (prompt.useCount || 0) + 1;
            prompt.lastUsed = Date.now();
            
            await chrome.storage.local.set({ prompts: this.prompts });
            
            // Close sidebar after use
            this.close();
            
            // Show success feedback
            this.utils.showToast('Prompt inserted successfully!');
        } else {
            this.utils.showToast('Could not find input field. Please try again.', 'error');
        }
    }

    async copyPrompt(prompt) {
        try {
            await navigator.clipboard.writeText(prompt.content);
            
            // Update usage stats
            prompt.useCount = (prompt.useCount || 0) + 1;
            prompt.lastUsed = Date.now();
            
            await chrome.storage.local.set({ prompts: this.prompts });
            
            // Show success feedback
            this.utils.showToast('Prompt copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy prompt:', error);
            this.utils.showToast('Failed to copy prompt to clipboard', 'error');
        }
    }

    updateCategoryList() {
        const categoryList = this.sidebar.querySelector('#promptnest-category-list');
        if (categoryList) {
            categoryList.innerHTML = this.generateCategoriesHTML();
        }
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.overlay.classList.add('visible');
        this.sidebar.classList.add('open');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.overlay.classList.remove('visible');
        this.sidebar.classList.remove('open');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    destroy() {
        if (this.sidebar) {
            this.sidebar.remove();
            this.sidebar = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    // Delegate utility methods
    showToast(message, type = 'success') {
        return this.utils.showToast(message, type);
    }

    applyTheme(theme) {
        return this.utils.applyTheme(theme);
    }
}

// Make available globally for content script
window.PromptNestSidebar = PromptNestSidebar;

// Global instance reference for modal callbacks
window.promptNestSidebar = null;

// Export for use by content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptNestSidebar;
}