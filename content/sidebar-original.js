// PromptNest Sidebar functionality - injected into AI websites
class PromptNestSidebar {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.isOpen = false;
        this.currentCategory = 'all';
        this.currentPrompt = null;
        this.prompts = [];
        this.categories = [];
        this.isSubmitting = false; // Prevent duplicate submissions
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.createSidebar();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
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
                    <button class="promptnest-view-btn" data-action="view" data-prompt-id="${prompt.id}">
                        <span class="icon icon-eye"></span> View
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
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Add category button
        const addCategoryBtn = this.sidebar.querySelector('#promptnest-add-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.showAddCategoryModal());
        }

        // Add prompt button with debouncing to prevent rapid clicks
        const addPromptBtn = this.sidebar.querySelector('#promptnest-add-prompt');
        if (addPromptBtn) {
            const debouncedShowModal = this.debounce(() => this.showAddPromptModal(), 300);
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
                    <button class="promptnest-view-btn" data-action="view" data-prompt-id="${prompt.id}">
                        <span class="icon icon-eye"></span> View
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
            case 'view':
                this.showViewPromptModal(prompt);
                break;
            case 'edit':
                this.showEditPromptModal(prompt);
                break;
            case 'delete':
                this.showDeleteConfirmModal(promptId);
                break;
        }
    }

    async usePrompt(prompt) {
        // Find input field on the page and fill it
        const success = this.findAndFillInput(prompt.content);
        
        if (success) {
            // Update usage stats
            prompt.useCount = (prompt.useCount || 0) + 1;
            prompt.lastUsed = Date.now();
            
            await chrome.storage.local.set({ prompts: this.prompts });
            
            // Close sidebar after use
            this.close();
            
            // Show success feedback
        } else {
        }
    }

    findAndFillInput(promptText) {
        const inputSelectors = [
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="prompt"]', 
            'textarea[placeholder*="ask"]',
            'textarea[placeholder*="chat"]',
            'div[contenteditable="true"]',
            'textarea:not([type="password"])',
            'input[type="text"]:not([type="password"])'
        ];

        let targetInput = null;

        // Try to find the most likely input field
        for (const selector of inputSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // Get the most visible and largest textarea/input
                targetInput = Array.from(elements)
                    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0)
                    .sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight))[0];
                
                if (targetInput) break;
            }
        }

        if (targetInput) {
            // Focus the input
            targetInput.focus();
            
            // Set the value
            if (targetInput.contentEditable === 'true') {
                targetInput.textContent = promptText;
                // Trigger input event for contenteditable
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                targetInput.value = promptText;
                // Trigger input and change events
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Set cursor to end
            if (targetInput.setSelectionRange) {
                targetInput.setSelectionRange(promptText.length, promptText.length);
            }
            
            return true;
        }
        
        return false;
    }

    // Modal Management
    showModal(content) {
        const modalOverlay = this.sidebar.querySelector('#promptnest-modal-overlay');
        const modal = this.sidebar.querySelector('#promptnest-modal');
        
        modal.innerHTML = content;
        modalOverlay.classList.add('visible');
        
        // Add close event listeners
        const closeBtn = modal.querySelector('.promptnest-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) this.hideModal();
        });
        
        // Add event delegation for modal buttons
        modal.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const promptId = button.dataset.promptId;
            
            switch (action) {
                case 'cancel-modal':
                    this.hideModal();
                    break;
                case 'save-prompt':
                    this.handleAddPrompt();
                    break;
                case 'save-edit-prompt':
                    if (promptId) this.handleEditPrompt(promptId);
                    break;
                case 'confirm-delete-prompt':
                    if (promptId) this.handleDeletePrompt(promptId);
                    break;
                case 'save-category':
                    this.handleAddCategory();
                    break;
                case 'export-data':
                    this.exportData();
                    break;
                case 'import-data':
                    this.importData();
                    break;
                case 'save-settings':
                    this.handleSaveSettings();
                    break;
            }
        });
        
        // Focus first input
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    hideModal() {
        const modalOverlay = this.sidebar.querySelector('#promptnest-modal-overlay');
        modalOverlay.classList.remove('visible');
    }

    showAddPromptModal() {
        const categoryOptions = this.categories
            .filter(cat => cat.id !== 'all')
            .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');
            
        const defaultCategoryId = this.currentCategory === 'all' ? 
            (this.categories.length > 0 ? this.categories[0].id : 'general') : 
            this.currentCategory;
        
        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">Add New Prompt</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <form id="add-prompt-form">
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Title</label>
                        <input type="text" id="prompt-title" class="promptnest-form-input" placeholder="Enter prompt title..." required>
                        <div class="promptnest-form-error" id="title-error"></div>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Category</label>
                        <select id="prompt-category" class="promptnest-form-select">
                            <option value="">Select category...</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Prompt Content</label>
                        <textarea id="prompt-content" class="promptnest-form-textarea" placeholder="Enter your prompt here..." required></textarea>
                        <div class="promptnest-form-error" id="content-error"></div>
                    </div>
                </form>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Cancel</button>
                <button type="button" class="promptnest-btn promptnest-btn-primary" data-action="save-prompt">Save Prompt</button>
            </div>
        `;
        
        this.showModal(content);
        
        // Set default category if applicable
        if (defaultCategoryId !== 'all') {
            setTimeout(() => {
                const categorySelect = document.getElementById('prompt-category');
                if (categorySelect) {
                    categorySelect.value = defaultCategoryId;
                }
            }, 100);
        }
    }

    async handleAddPrompt() {
        // Prevent multiple simultaneous submissions
        if (this.isSubmitting) {
            console.log('Sidebar Original: Prompt submission already in progress, ignoring duplicate request');
            return;
        }
        this.isSubmitting = true;

        const titleInput = document.getElementById('prompt-title');
        const categorySelect = document.getElementById('prompt-category');
        const contentInput = document.getElementById('prompt-content');
        
        // Clear previous errors
        document.getElementById('title-error').textContent = '';
        document.getElementById('content-error').textContent = '';
        titleInput.classList.remove('error');
        contentInput.classList.remove('error');
        
        // Validate
        let hasError = false;
        
        if (!titleInput.value.trim()) {
            document.getElementById('title-error').textContent = 'Title is required';
            titleInput.classList.add('error');
            hasError = true;
        }
        
        if (!contentInput.value.trim()) {
            document.getElementById('content-error').textContent = 'Content is required';
            contentInput.classList.add('error');
            hasError = true;
        }
        
        if (hasError) {
            this.isSubmitting = false;
            return;
        }
        
        try {
            const trimmedTitle = titleInput.value.trim();
            const trimmedContent = contentInput.value.trim();
            
            // Check for duplicates
            const existingDuplicate = this.prompts.find(p => 
                p.title.trim() === trimmedTitle && p.content.trim() === trimmedContent
            );
            
            if (existingDuplicate) {
                console.warn('Sidebar Original: Duplicate prompt detected, skipping creation:', trimmedTitle);
                this.hideModal();
                return;
            }
            
            const newPrompt = {
                id: Date.now().toString(),
                title: trimmedTitle,
                content: trimmedContent,
                categoryId: categorySelect.value || 'general',
                created: Date.now(),
                modified: Date.now(),
                useCount: 0,
                lastUsed: null
            };
            
            this.prompts.push(newPrompt);
            await chrome.storage.local.set({ prompts: this.prompts });
            this.updatePromptList();
            this.updateCategoryList();
            this.hideModal();
        } catch (error) {
            console.error('Sidebar Original: Failed to add prompt:', error);
        } finally {
            this.isSubmitting = false;
        }
    }

    showViewPromptModal(prompt) {
        // Find the category name
        const category = this.categories.find(cat => cat.id === prompt.categoryId);
        const categoryName = category ? category.name : 'Uncategorized';
        
        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">View Prompt</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <div class="promptnest-view-group">
                    <label class="promptnest-view-label">Title</label>
                    <div class="promptnest-view-content">${prompt.title}</div>
                </div>
                
                <div class="promptnest-view-group">
                    <label class="promptnest-view-label">Category</label>
                    <div class="promptnest-view-content">${categoryName}</div>
                </div>
                
                <div class="promptnest-view-group">
                    <label class="promptnest-view-label">Prompt Content</label>
                    <div class="promptnest-view-content promptnest-view-textarea">${prompt.content}</div>
                </div>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Close</button>
            </div>
        `;
        
        this.showModal(content);
    }

    showEditPromptModal(prompt) {
        const categoryOptions = this.categories
            .filter(cat => cat.id !== 'all')
            .map(cat => `<option value="${cat.id}" ${cat.id === prompt.categoryId ? 'selected' : ''}>${cat.name}</option>`)
            .join('');
        
        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">Edit Prompt</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <form id="edit-prompt-form">
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Title</label>
                        <input type="text" id="edit-prompt-title" class="promptnest-form-input" value="${prompt.title}" required>
                        <div class="promptnest-form-error" id="edit-title-error"></div>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Category</label>
                        <select id="edit-prompt-category" class="promptnest-form-select">
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Prompt Content</label>
                        <textarea id="edit-prompt-content" class="promptnest-form-textarea" required>${prompt.content}</textarea>
                        <div class="promptnest-form-error" id="edit-content-error"></div>
                    </div>
                </form>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Cancel</button>
                <button type="button" class="promptnest-btn promptnest-btn-primary" data-action="save-edit-prompt" data-prompt-id="${prompt.id}">Save Changes</button>
            </div>
        `;
        
        this.showModal(content);
    }

    async handleEditPrompt(promptId) {
        const titleInput = document.getElementById('edit-prompt-title');
        const categorySelect = document.getElementById('edit-prompt-category');
        const contentInput = document.getElementById('edit-prompt-content');
        
        // Clear previous errors
        document.getElementById('edit-title-error').textContent = '';
        document.getElementById('edit-content-error').textContent = '';
        titleInput.classList.remove('error');
        contentInput.classList.remove('error');
        
        // Validate
        let hasError = false;
        
        if (!titleInput.value.trim()) {
            document.getElementById('edit-title-error').textContent = 'Title is required';
            titleInput.classList.add('error');
            hasError = true;
        }
        
        if (!contentInput.value.trim()) {
            document.getElementById('edit-content-error').textContent = 'Content is required';
            contentInput.classList.add('error');
            hasError = true;
        }
        
        if (hasError) return;
        
        const prompt = this.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.title = titleInput.value.trim();
            prompt.content = contentInput.value.trim();
            prompt.categoryId = categorySelect.value;
            prompt.modified = Date.now();
            
            await chrome.storage.local.set({ prompts: this.prompts });
            this.updatePromptList();
            this.updateCategoryList();
            this.hideModal();
        }
    }

    showDeleteConfirmModal(promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return;
        
        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">Delete Prompt</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <p>Are you sure you want to delete "<strong>${prompt.title}</strong>"?</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">This action cannot be undone.</p>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Cancel</button>
                <button type="button" class="promptnest-btn promptnest-btn-danger" data-action="confirm-delete-prompt" data-prompt-id="${promptId}">Delete</button>
            </div>
        `;
        
        this.showModal(content);
    }

    async handleDeletePrompt(promptId) {
        this.prompts = this.prompts.filter(p => p.id !== promptId);
        await chrome.storage.local.set({ prompts: this.prompts });
        this.updatePromptList();
        this.updateCategoryList();
        this.hideModal();
    }

    showAddCategoryModal() {
        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">Add New Category</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <form id="add-category-form">
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Category Name</label>
                        <input type="text" id="category-name" class="promptnest-form-input" placeholder="Enter category name..." required>
                        <div class="promptnest-form-error" id="category-name-error"></div>
                    </div>
                </form>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Cancel</button>
                <button type="button" class="promptnest-btn promptnest-btn-primary" data-action="save-category">Add Category</button>
            </div>
        `;
        
        this.showModal(content);
    }

    async handleAddCategory() {
        const nameInput = document.getElementById('category-name');
        
        // Clear previous errors
        document.getElementById('category-name-error').textContent = '';
        nameInput.classList.remove('error');
        
        // Validate
        if (!nameInput.value.trim()) {
            document.getElementById('category-name-error').textContent = 'Category name is required';
            nameInput.classList.add('error');
            return;
        }
        
        // Check for duplicate names
        const existingNames = this.categories.map(cat => cat.name.toLowerCase());
        if (existingNames.includes(nameInput.value.trim().toLowerCase())) {
            document.getElementById('category-name-error').textContent = 'Category name already exists';
            nameInput.classList.add('error');
            return;
        }
        
        const newCategory = {
            id: Date.now().toString(),
            name: nameInput.value.trim(),
            created: Date.now()
        };
        
        this.categories.push(newCategory);
        await chrome.storage.local.set({ categories: this.categories });
        this.updateCategoryList();
        this.hideModal();
    }

    async showSettingsModal() {
        // Get current settings
        let settings = {};
        try {
            const result = await chrome.storage.local.get('settings');
            settings = result.settings || {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true,
                compactView: false
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true,
                compactView: false
            };
        }

        const content = `
            <div class="promptnest-modal-header">
                <h2 class="promptnest-modal-title">Settings</h2>
                <button class="promptnest-modal-close">
                    <span class="icon icon-close"></span>
                </button>
            </div>
            <div class="promptnest-modal-body">
                <form id="settings-form">
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Theme</label>
                        <select id="theme-select" class="promptnest-form-select">
                            <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">Data Management</label>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;">
                            <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="export-data">
                                <span class="icon icon-export"></span> Export Prompts
                            </button>
                            <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="import-data">
                                <span class="icon icon-import"></span> Import Prompts
                            </button>
                        </div>
                    </div>
                    
                    <div class="promptnest-form-group">
                        <label class="promptnest-form-label">View Options</label>
                        <div style="margin-top: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                                <input type="checkbox" id="compact-view" ${settings.compactView ? 'checked' : ''} style="margin: 0;">
                                Compact view
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="promptnest-modal-footer">
                <button type="button" class="promptnest-btn promptnest-btn-secondary" data-action="cancel-modal">Cancel</button>
                <button type="button" class="promptnest-btn promptnest-btn-primary" data-action="save-settings">Save Settings</button>
            </div>
        `;
        
        this.showModal(content);
    }

    async handleSaveSettings() {
        const themeSelect = document.getElementById('theme-select');
        const compactViewCheck = document.getElementById('compact-view');
        
        const newSettings = {
            theme: themeSelect.value,
            autoBackup: true,
            showUsageStats: true,
            compactView: compactViewCheck.checked
        };
        
        try {
            await chrome.storage.local.set({ settings: newSettings });
            this.applyTheme(newSettings.theme);
            this.hideModal();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    applyTheme(theme) {
        // Apply theme to the sidebar
        const sidebar = document.getElementById('promptnest-sidebar');
        if (sidebar) {
            sidebar.setAttribute('data-theme', theme);
        }
        
        // You can extend this to apply more comprehensive theming
        if (theme === 'dark') {
            sidebar?.classList.add('dark-theme');
        } else if (theme === 'light') {
            sidebar?.classList.remove('dark-theme');
        } else {
            // Auto theme - detect system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                sidebar?.classList.add('dark-theme');
            } else {
                sidebar?.classList.remove('dark-theme');
            }
        }
    }

    async exportData() {
        try {
            const data = {
                prompts: this.prompts,
                categories: this.categories,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `promptnest-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.prompts && Array.isArray(data.prompts)) {
                    this.prompts = [...this.prompts, ...data.prompts];
                }
                
                if (data.categories && Array.isArray(data.categories)) {
                    const existingNames = this.categories.map(c => c.name.toLowerCase());
                    const newCategories = data.categories.filter(c => 
                        c.id !== 'all' && !existingNames.includes(c.name.toLowerCase())
                    );
                    this.categories = [...this.categories, ...newCategories];
                }
                
                await chrome.storage.local.set({ 
                    prompts: this.prompts,
                    categories: this.categories 
                });
                
                this.updatePromptList();
                this.updateCategoryList();
                
            } catch (error) {
                console.error('Import failed:', error);
            }
        };
        
        input.click();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when sidebar is open
            if (!this.isOpen) return;
            
            // Escape key - close sidebar or modal
            if (e.key === 'Escape') {
                e.preventDefault();
                const modalOverlay = this.sidebar.querySelector('#promptnest-modal-overlay');
                if (modalOverlay && modalOverlay.classList.contains('visible')) {
                    this.hideModal();
                } else {
                    this.close();
                }
                return;
            }
            
            // Don't handle other shortcuts when modal is open or when typing in inputs
            const modalOverlay = this.sidebar.querySelector('#promptnest-modal-overlay');
            const isModalOpen = modalOverlay && modalOverlay.classList.contains('visible');
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            
            if (isModalOpen || isTyping) return;
            
            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = this.sidebar.querySelector('#promptnest-search');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            }
            
            // Ctrl/Cmd + N - New prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showAddPromptModal();
                return;
            }
            
            // Ctrl/Cmd + Shift + N - New category
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.showAddCategoryModal();
                return;
            }
            
            // Ctrl/Cmd + , - Settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.showSettingsModal();
                return;
            }
            
            // F key - Focus search (quick access)
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                const searchInput = this.sidebar.querySelector('#promptnest-search');
                if (searchInput) {
                    searchInput.focus();
                }
                return;
            }
        });
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

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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