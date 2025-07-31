// Main popup functionality for PromptNest - Refactored
class PromptNestUI {
    constructor() {
        this.dataManager = new PromptNestDataManager();
        this.formHandler = new PromptNestFormHandler(this);
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        await this.loadTheme();
        await this.setupEventListeners();
        await this.dataManager.loadCategories();
        await this.dataManager.loadPrompts();
        await this.dataManager.updatePromptCounts();
    }

    get currentCategory() {
        return this.dataManager.currentCategory;
    }

    get currentPrompt() {
        return this.dataManager.currentPrompt;
    }

    set currentPrompt(value) {
        this.dataManager.currentPrompt = value;
    }

    async loadTheme() {
        try {
            const settings = await promptNestStorage.getSettings();
            const theme = settings.theme || 'auto';
            document.body.setAttribute('data-theme', theme);
        } catch (error) {
            console.error('Failed to load theme:', error);
            document.body.setAttribute('data-theme', 'auto');
        }
    }

    async setupEventListeners() {
        // Clear any existing event listeners first
        this.removeExistingEventListeners();
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', this.openSettings.bind(this));
        }

        // Add prompt buttons
        const addPromptBtn = document.getElementById('addPromptBtn');
        const createFirstPrompt = document.getElementById('createFirstPrompt');
        
        if (addPromptBtn) {
            addPromptBtn.addEventListener('click', this.openPromptModal.bind(this));
        }
        if (createFirstPrompt) {
            createFirstPrompt.addEventListener('click', this.openPromptModal.bind(this));
        }

        // Add category button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', this.openCategoryModal.bind(this));
        }

        // Modal close buttons and overlays
        this.setupModalEventListeners();
        
        // Form submissions
        this.setupFormEventListeners();
    }

    setupModalEventListeners() {
        // Settings modal
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        
        if (settingsModal && closeSettings) {
            closeSettings.addEventListener('click', () => this.closeModal(settingsModal));
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) this.closeModal(settingsModal);
            });
        }

        // Prompt modal
        const promptModal = document.getElementById('promptModal');
        const closePromptModal = document.getElementById('closePromptModal');
        const cancelPrompt = document.getElementById('cancelPrompt');
        
        if (promptModal) {
            if (closePromptModal) {
                closePromptModal.addEventListener('click', () => this.closeModal(promptModal));
            }
            if (cancelPrompt) {
                cancelPrompt.addEventListener('click', () => this.closeModal(promptModal));
            }
            promptModal.addEventListener('click', (e) => {
                if (e.target === promptModal) this.closeModal(promptModal);
            });
        }

        // Category modal
        const categoryModal = document.getElementById('categoryModal');
        const closeCategoryModal = document.getElementById('closeCategoryModal');
        const cancelCategory = document.getElementById('cancelCategory');
        
        if (categoryModal) {
            if (closeCategoryModal) {
                closeCategoryModal.addEventListener('click', () => this.closeModal(categoryModal));
            }
            if (cancelCategory) {
                cancelCategory.addEventListener('click', () => this.closeModal(categoryModal));
            }
            categoryModal.addEventListener('click', (e) => {
                if (e.target === categoryModal) this.closeModal(categoryModal);
            });
        }
    }

    setupFormEventListeners() {
        // Save prompt form with debouncing
        const savePrompt = document.getElementById('savePrompt');
        if (savePrompt) {
            const debouncedSavePrompt = PromptNestUtils.debounce(this.savePrompt.bind(this), 300);
            savePrompt.addEventListener('click', debouncedSavePrompt);
        }

        // Save category form with debouncing
        const saveCategory = document.getElementById('saveCategory');
        if (saveCategory) {
            const debouncedSaveCategory = PromptNestUtils.debounce(this.saveCategory.bind(this), 300);
            saveCategory.addEventListener('click', debouncedSaveCategory);
        }

        // Enter key support for forms
        const promptTitle = document.getElementById('promptTitle');
        const categoryName = document.getElementById('categoryName');
        
        if (promptTitle) {
            promptTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('promptContent').focus();
                }
            });
        }
        
        if (categoryName) {
            categoryName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveCategory();
                }
            });
        }
    }

    // Modal management
    async openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            this.showModal(modal);
            await this.formHandler.loadSettingsForm();
            // Also populate the settings form if promptNestSettings is available
            if (window.promptNestSettings) {
                await window.promptNestSettings.populateSettingsForm();
            }
        }
    }

    openPromptModal(promptId = null) {
        const modal = document.getElementById('promptModal');
        const title = document.getElementById('promptModalTitle');
        
        if (modal) {
            this.currentPrompt = promptId;
            
            if (promptId) {
                title.textContent = 'Edit Prompt';
                this.formHandler.loadPromptForm(promptId);
            } else {
                title.textContent = 'Add Prompt';
                this.formHandler.clearPromptForm();
                this.formHandler.preSelectCategory(this.currentCategory);
            }
            
            this.showModal(modal);
        }
    }

    openCategoryModal() {
        const modal = document.getElementById('categoryModal');
        if (modal) {
            this.formHandler.clearCategoryForm();
            this.showModal(modal);
        }
    }

    showModal(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Focus first input
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            firstInput.focus();
        }
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }

    // Action methods (delegated to appropriate managers)
    async savePrompt() {
        const isEdit = !!this.currentPrompt;
        const success = await this.formHandler.handlePromptSubmission(isEdit, this.currentPrompt);
        
        if (success) {
            this.closeModal(document.getElementById('promptModal'));
            await this.dataManager.loadPrompts();
            await this.dataManager.updatePromptCounts();
        }
    }

    async saveCategory() {
        const success = await this.formHandler.handleCategorySubmission();
        
        if (success) {
            this.closeModal(document.getElementById('categoryModal'));
            await this.dataManager.loadCategories();
        }
    }

    // Delegate data operations to data manager
    async loadPrompts(categoryId) {
        return this.dataManager.loadPrompts(categoryId);
    }

    async updatePromptCounts() {
        return this.dataManager.updatePromptCounts();
    }

    async usePrompt(promptId) {
        return this.dataManager.usePrompt(promptId);
    }

    async editPrompt(promptId) {
        return this.dataManager.editPrompt(promptId);
    }

    async clonePrompt(promptId) {
        return this.dataManager.clonePrompt(promptId);
    }

    async deletePrompt(promptId) {
        return this.dataManager.deletePrompt(promptId);
    }

    selectCategory(categoryId) {
        return this.dataManager.selectCategory(categoryId);
    }

    // Utility methods (delegated to utils)
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        return PromptNestUtils.setLoadingState(isLoading);
    }

    showNotification(message, type = 'info') {
        return PromptNestUtils.showNotification(message, type);
    }

    escapeHtml(text) {
        return PromptNestUtils.escapeHtml(text);
    }
    
    // Clean up existing event listeners to prevent duplicates
    removeExistingEventListeners() {
        // Create a list of elements that might have duplicate listeners
        const elementsToClean = [
            'settingsBtn', 'addPromptBtn', 'createFirstPrompt', 'addCategoryBtn',
            'closeSettings', 'closePromptModal', 'cancelPrompt', 
            'closeCategoryModal', 'cancelCategory', 'savePrompt', 'saveCategory'
        ];
        
        elementsToClean.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                // Clone the node to remove all event listeners
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }
}

// Initialize the UI when DOM is loaded
let promptNestUI;

document.addEventListener('DOMContentLoaded', async () => {
    // Prevent multiple instances
    if (window.promptNestUI) {
        console.log('PromptNest UI already initialized');
        return;
    }
    
    promptNestUI = new PromptNestUI();
    window.promptNestUI = promptNestUI;
});

// Export for global access
if (typeof window !== 'undefined' && !window.promptNestUI) {
    window.promptNestUI = promptNestUI;
}