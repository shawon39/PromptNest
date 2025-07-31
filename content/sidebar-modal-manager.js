// Modal management functionality for PromptNest sidebar
class SidebarModalManager {
    constructor(sidebar) {
        this.sidebar = sidebar;
        this.isSubmitting = false; // Prevent duplicate submissions
    }

    // Modal Management
    showModal(content) {
        const modalOverlay = this.sidebar.sidebar.querySelector('#promptnest-modal-overlay');
        const modal = this.sidebar.sidebar.querySelector('#promptnest-modal');
        
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
        const modalOverlay = this.sidebar.sidebar.querySelector('#promptnest-modal-overlay');
        modalOverlay.classList.remove('visible');
    }

    showAddPromptModal() {
        const categoryOptions = this.sidebar.categories
            .filter(cat => cat.id !== 'all')
            .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');
            
        const defaultCategoryId = this.sidebar.currentCategory === 'all' ? 
            (this.sidebar.categories.length > 0 ? this.sidebar.categories[0].id : 'general') : 
            this.sidebar.currentCategory;
        
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
            console.log('Sidebar: Prompt submission already in progress, ignoring duplicate request');
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
            const existingDuplicate = this.sidebar.prompts.find(p => 
                p.title.trim() === trimmedTitle && p.content.trim() === trimmedContent
            );
            
            if (existingDuplicate) {
                console.warn('Sidebar: Duplicate prompt detected, skipping creation:', trimmedTitle);
                this.sidebar.showToast('Prompt already exists!');
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
            
            this.sidebar.prompts.push(newPrompt);
            await chrome.storage.local.set({ prompts: this.sidebar.prompts });
            this.sidebar.updatePromptList();
            this.sidebar.updateCategoryList();
            this.hideModal();
            this.sidebar.showToast('Prompt added successfully!');
        } catch (error) {
            console.error('Sidebar: Failed to add prompt:', error);
            this.sidebar.showToast('Failed to add prompt');
        } finally {
            this.isSubmitting = false;
        }
    }

    showEditPromptModal(prompt) {
        const categoryOptions = this.sidebar.categories
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
        
        const prompt = this.sidebar.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.title = titleInput.value.trim();
            prompt.content = contentInput.value.trim();
            prompt.categoryId = categorySelect.value;
            prompt.modified = Date.now();
            
            await chrome.storage.local.set({ prompts: this.sidebar.prompts });
            this.sidebar.updatePromptList();
            this.sidebar.updateCategoryList();
            this.hideModal();
            this.sidebar.showToast('Prompt updated successfully!');
        }
    }

    showDeleteConfirmModal(promptId) {
        const prompt = this.sidebar.prompts.find(p => p.id === promptId);
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
        this.sidebar.prompts = this.sidebar.prompts.filter(p => p.id !== promptId);
        await chrome.storage.local.set({ prompts: this.sidebar.prompts });
        this.sidebar.updatePromptList();
        this.sidebar.updateCategoryList();
        this.hideModal();
        this.sidebar.showToast('Prompt deleted successfully!');
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
        const existingNames = this.sidebar.categories.map(cat => cat.name.toLowerCase());
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
        
        this.sidebar.categories.push(newCategory);
        await chrome.storage.local.set({ categories: this.sidebar.categories });
        this.sidebar.updateCategoryList();
        this.hideModal();
        this.sidebar.showToast('Category added successfully!');
    }

    async showSettingsModal() {
        // Get current settings
        let settings = {};
        try {
            const result = await chrome.storage.local.get('settings');
            settings = result.settings || {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            settings = {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true
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
        
        const newSettings = {
            theme: themeSelect.value,
            autoBackup: true,
            showUsageStats: true
        };
        
        try {
            await chrome.storage.local.set({ settings: newSettings });
            this.sidebar.applyTheme(newSettings.theme);
            this.hideModal();
            this.sidebar.showToast('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.sidebar.showToast('Failed to save settings', 'error');
        }
    }

    async exportData() {
        try {
            const data = {
                prompts: this.sidebar.prompts,
                categories: this.sidebar.categories,
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
            
            this.sidebar.showToast('Data exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.sidebar.showToast('Export failed', 'error');
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
                    this.sidebar.prompts = [...this.sidebar.prompts, ...data.prompts];
                }
                
                if (data.categories && Array.isArray(data.categories)) {
                    const existingNames = this.sidebar.categories.map(c => c.name.toLowerCase());
                    const newCategories = data.categories.filter(c => 
                        c.id !== 'all' && !existingNames.includes(c.name.toLowerCase())
                    );
                    this.sidebar.categories = [...this.sidebar.categories, ...newCategories];
                }
                
                await chrome.storage.local.set({ 
                    prompts: this.sidebar.prompts,
                    categories: this.sidebar.categories 
                });
                
                this.sidebar.updatePromptList();
                this.sidebar.updateCategoryList();
                this.sidebar.showToast('Data imported successfully!');
                
            } catch (error) {
                console.error('Import failed:', error);
                this.sidebar.showToast('Import failed - invalid file format', 'error');
            }
        };
        
        input.click();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SidebarModalManager = SidebarModalManager;
}