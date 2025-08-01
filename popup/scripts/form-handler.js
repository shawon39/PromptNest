// Form handling logic for PromptNest popup
class PromptNestFormHandler {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isSubmitting = false;
        this.isCategorySubmitting = false;
    }

    // Form clearing methods
    clearPromptForm() {
        document.getElementById('promptTitle').value = '';
        document.getElementById('promptContent').value = '';
        document.getElementById('promptCategory').value = '';
        
        // Clear any error states
        this.clearFormErrors(['promptTitleError', 'promptContentError']);
    }

    clearCategoryForm() {
        document.getElementById('categoryName').value = '';
        this.clearFormErrors(['categoryNameError']);
    }

    clearFormErrors(errorIds) {
        errorIds.forEach(id => {
            const errorElement = document.getElementById(id);
            if (errorElement) {
                errorElement.textContent = '';
            }
        });

        // Remove error classes from inputs
        const inputs = document.querySelectorAll('.form-input.error, .form-textarea.error, .form-select.error');
        inputs.forEach(input => input.classList.remove('error'));
    }

    // Category pre-selection logic
    preSelectCategory(currentCategory) {
        const categorySelect = document.getElementById('promptCategory');
        if (categorySelect && currentCategory && currentCategory !== 'all') {
            // Pre-select the currently active category
            categorySelect.value = currentCategory;
        }
    }

    // Form validation methods
    validatePromptForm() {
        const titleInput = document.getElementById('promptTitle');
        const contentInput = document.getElementById('promptContent');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        // Clear previous errors
        this.clearFormErrors(['promptTitleError', 'promptContentError']);
        
        let hasError = false;
        
        if (!title) {
            document.getElementById('promptTitleError').textContent = 'Title is required';
            titleInput.classList.add('error');
            hasError = true;
        }
        
        if (!content) {
            document.getElementById('promptContentError').textContent = 'Content is required';
            contentInput.classList.add('error');
            hasError = true;
        }
        
        return { isValid: !hasError, title, content };
    }

    async validateCategoryForm() {
        const nameInput = document.getElementById('categoryName');
        const name = nameInput.value.trim();
        
        // Clear previous errors
        this.clearFormErrors(['categoryNameError']);
        
        if (!name) {
            document.getElementById('categoryNameError').textContent = 'Category name is required';
            nameInput.classList.add('error');
            return { isValid: false, name: null };
        }
        
        // Check for duplicate names
        const categories = await promptNestStorage.getCategories();
        const existingNames = categories.map(cat => cat.name.toLowerCase());
        if (existingNames.includes(name.toLowerCase())) {
            document.getElementById('categoryNameError').textContent = 'Category name already exists';
            nameInput.classList.add('error');
            return { isValid: false, name: null };
        }
        
        return { isValid: true, name };
    }

    // Form loading methods
    async loadPromptForm(promptId) {
        try {
            const prompts = await promptNestStorage.getPrompts();
            const prompt = prompts.find(p => p.id === promptId);
            
            if (!prompt) return;
            
            document.getElementById('promptTitle').value = prompt.title;
            document.getElementById('promptContent').value = prompt.content;
            document.getElementById('promptCategory').value = prompt.categoryId || '';
            
        } catch (error) {
            console.error('Failed to load prompt form:', error);
        }
    }

    async loadSettingsForm() {
        try {
            const settings = await promptNestStorage.getSettings();
            const themeSelect = document.getElementById('themeSelect');
            
            if (themeSelect) {
                themeSelect.value = settings.theme || 'auto';
            }
            
        } catch (error) {
            console.error('Failed to load settings form:', error);
        }
    }

    // Form submission handling
    async handlePromptSubmission(isEdit, currentPromptId) {
        // Prevent multiple simultaneous submissions
        if (this.isSubmitting) {
            console.log('Prompt submission already in progress, ignoring duplicate request');
            return false;
        }
        this.isSubmitting = true;

        const validation = this.validatePromptForm();
        if (!validation.isValid) {
            this.isSubmitting = false;
            return false;
        }

        const { title, content } = validation;
        const categoryId = document.getElementById('promptCategory').value || null;
        
        // Prevent duplicate submissions by disabling the save button
        const saveButton = document.getElementById('savePrompt');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        try {
            let success;
            if (isEdit && currentPromptId) {
                // Update existing prompt
                success = await promptNestStorage.updatePrompt(currentPromptId, {
                    title,
                    content,
                    categoryId
                });
            } else {
                // Create new prompt
                const newPrompt = await promptNestStorage.addPrompt(title, content, categoryId);
                success = !!newPrompt;
            }

            if (success) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Failed to save prompt:', error);
            return false;
        } finally {
            // Re-enable the save button and reset submission flag
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save';
            }
            this.isSubmitting = false;
        }
    }

    async handleCategorySubmission() {
        // Prevent multiple simultaneous submissions
        if (this.isCategorySubmitting) {
            console.log('Category submission already in progress, ignoring duplicate request');
            return false;
        }
        this.isCategorySubmitting = true;

        const validation = await this.validateCategoryForm();
        if (!validation.isValid) {
            this.isCategorySubmitting = false;
            return false;
        }

        const { name } = validation;
        
        // Prevent duplicate submissions by disabling the save button
        const saveButton = document.getElementById('saveCategory');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        try {
            const newCategory = await promptNestStorage.addCategory(name);
            
            if (newCategory) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Failed to save category:', error);
            return false;
        } finally {
            // Re-enable the save button and reset submission flag
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save';
            }
            this.isCategorySubmitting = false;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PromptNestFormHandler = PromptNestFormHandler;
}