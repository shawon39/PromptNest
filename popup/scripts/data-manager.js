// Data operations for PromptNest popup
class PromptNestDataManager {
    constructor() {
        this.currentCategory = 'all';
        this.currentPrompt = null;
    }

    // Category management
    async loadCategories() {
        try {
            const categories = await promptNestStorage.getCategories();
            const categoryList = document.getElementById('categoryList');
            const promptCategory = document.getElementById('promptCategory');
            
            if (!categoryList) return;

            // Clear existing categories (except "All Prompts")
            const existingCategories = categoryList.querySelectorAll('.category-item:not([data-category="all"])');
            existingCategories.forEach(item => item.remove());

            // Add categories to sidebar
            categories.forEach(category => {
                const categoryItem = this.createCategoryItem(category);
                categoryList.appendChild(categoryItem);
            });

            // Update prompt category dropdown
            if (promptCategory) {
                // Clear existing options except first one
                Array.from(promptCategory.children).slice(1).forEach(option => option.remove());
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    promptCategory.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Failed to load categories:', error);
            PromptNestUtils.showNotification('Failed to load categories', 'error');
        }
    }

    createCategoryItem(category) {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category.id;
        
        categoryItem.innerHTML = `
            <span class="category-name">${category.name}</span>
            <span class="category-count">0</span>
        `;
        
        categoryItem.addEventListener('click', () => {
            this.selectCategory(category.id);
        });
        
        return categoryItem;
    }

    async selectCategory(categoryId) {
        this.currentCategory = categoryId;
        
        // Update active category
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.classList.toggle('active', item.dataset.category === categoryId);
        });

        // Clear search if active
        if (window.promptNestSearch && window.promptNestSearch.isSearchActive()) {
            window.promptNestSearch.clearSearch();
        }

        // Load prompts for category
        await this.loadPrompts(categoryId);
        
        // Update header
        const contentTitle = document.getElementById('contentTitle');
        if (contentTitle) {
            if (categoryId === 'all') {
                contentTitle.textContent = 'All Prompts';
            } else {
                const categories = await promptNestStorage.getCategories();
                const category = categories.find(cat => cat.id === categoryId);
                contentTitle.textContent = category ? category.name : 'Category';
            }
        }
    }

    // Prompt management
    async loadPrompts(categoryId = this.currentCategory) {
        try {
            PromptNestUtils.setLoadingState(true);
            
            let prompts;
            if (categoryId === 'all') {
                prompts = await promptNestStorage.getPrompts();
            } else {
                prompts = await promptNestStorage.getPromptsByCategory(categoryId);
            }

            await this.displayPrompts(prompts);
            await this.updatePromptCounts();
            
        } catch (error) {
            console.error('Failed to load prompts:', error);
            PromptNestUtils.showNotification('Failed to load prompts', 'error');
        } finally {
            PromptNestUtils.setLoadingState(false);
        }
    }

    async displayPrompts(prompts) {
        const promptList = document.getElementById('promptList');
        const emptyState = document.getElementById('emptyState');
        
        if (!promptList) return;

        if (prompts.length === 0) {
            promptList.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Clear current content
        promptList.innerHTML = '';

        // Create prompt elements
        const categories = await promptNestStorage.getCategories();
        
        prompts.forEach(prompt => {
            const promptElement = this.createPromptElement(prompt, categories);
            promptList.appendChild(promptElement);
        });
    }

    createPromptElement(prompt, categories) {
        const category = categories.find(cat => cat.id === prompt.categoryId);
        
        const promptDiv = document.createElement('div');
        promptDiv.className = 'prompt-item';
        promptDiv.dataset.promptId = prompt.id;
        
        const truncatedContent = PromptNestUtils.truncateText(prompt.content);
        
        promptDiv.innerHTML = `
            <div class="prompt-header">
                <div class="prompt-title">${PromptNestUtils.escapeHtml(prompt.title)}</div>
                <div class="prompt-actions">
                    <button class="icon-button use-prompt-btn" data-action="use" data-prompt-id="${prompt.id}" title="Insert Prompt">
                        <span class="icon icon-use"></span>
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
            <div class="prompt-content">${PromptNestUtils.escapeHtml(truncatedContent)}</div>
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
                
                this.handlePromptAction(action, promptId);
                e.stopPropagation();
            });
        }
        
        return promptDiv;
    }

    async updatePromptCounts() {
        try {
            const prompts = await promptNestStorage.getPrompts();
            const categories = await promptNestStorage.getCategories();
            
            // Update "All Prompts" count
            const allPromptsItem = document.querySelector('.category-item[data-category="all"] .category-count');
            if (allPromptsItem) {
                allPromptsItem.textContent = prompts.length.toString();
            }
            
            // Update individual category counts
            categories.forEach(category => {
                const categoryPrompts = prompts.filter(p => p.categoryId === category.id);
                const countElement = document.querySelector(`.category-item[data-category="${category.id}"] .category-count`);
                if (countElement) {
                    countElement.textContent = categoryPrompts.length.toString();
                }
            });
            
        } catch (error) {
            console.error('Failed to update prompt counts:', error);
        }
    }

    // Prompt actions
    async handlePromptAction(action, promptId) {
        switch (action) {
            case 'use':
                await this.usePrompt(promptId);
                break;
            case 'edit':
                this.editPrompt(promptId);
                break;
            case 'copy':
                await this.copyPrompt(promptId);
                break;
            case 'clone':
                await this.clonePrompt(promptId);
                break;
            case 'delete':
                await this.deletePrompt(promptId);
                break;
        }
    }

    async usePrompt(promptId) {
        try {
            const prompts = await promptNestStorage.getPrompts();
            const prompt = prompts.find(p => p.id === promptId);
            
            if (!prompt) {
                PromptNestUtils.showNotification('Prompt not found', 'error');
                return;
            }
            
            // Increment usage count
            await promptNestStorage.incrementPromptUsage(promptId);
            
            // Send message to content script to fill prompt
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'fillPrompt',
                    promptText: prompt.content
                }, (response) => {
                    if (response && response.success) {
                        PromptNestUtils.showNotification('Prompt inserted successfully', 'success');
                        // Close popup after successful use
                        setTimeout(() => window.close(), 1000);
                    } else {
                        PromptNestUtils.showNotification('Failed to insert prompt. Make sure you\'re on a supported AI website.', 'error');
                    }
                });
            }
            
        } catch (error) {
            console.error('Failed to use prompt:', error);
            PromptNestUtils.showNotification('Failed to use prompt', 'error');
        }
    }

    async copyPrompt(promptId) {
        try {
            const prompts = await promptNestStorage.getPrompts();
            const prompt = prompts.find(p => p.id === promptId);
            
            if (!prompt) {
                PromptNestUtils.showNotification('Prompt not found', 'error');
                return;
            }
            
            // Copy prompt content to clipboard
            await navigator.clipboard.writeText(prompt.content);
            PromptNestUtils.showNotification('Prompt copied to clipboard', 'success');
            
        } catch (error) {
            console.error('Failed to copy prompt:', error);
            PromptNestUtils.showNotification('Failed to copy prompt', 'error');
        }
    }

    editPrompt(promptId) {
        this.currentPrompt = promptId;
        if (window.promptNestUI && window.promptNestUI.openPromptModal) {
            window.promptNestUI.openPromptModal(promptId);
        }
    }

    async clonePrompt(promptId) {
        try {
            const clonedPrompt = await promptNestStorage.clonePrompt(promptId);
            
            if (clonedPrompt) {
                PromptNestUtils.showNotification('Prompt cloned successfully', 'success');
                await this.loadPrompts();
                await this.updatePromptCounts();
            } else {
                PromptNestUtils.showNotification('Failed to clone prompt', 'error');
            }
            
        } catch (error) {
            console.error('Failed to clone prompt:', error);
            PromptNestUtils.showNotification('Failed to clone prompt', 'error');
        }
    }

    async deletePrompt(promptId) {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }
        
        try {
            const success = await promptNestStorage.deletePrompt(promptId);
            
            if (success) {
                PromptNestUtils.showNotification('Prompt deleted successfully', 'success');
                await this.loadPrompts();
                await this.updatePromptCounts();
            } else {
                PromptNestUtils.showNotification('Failed to delete prompt', 'error');
            }
            
        } catch (error) {
            console.error('Failed to delete prompt:', error);
            PromptNestUtils.showNotification('Failed to delete prompt', 'error');
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PromptNestDataManager = PromptNestDataManager;
}