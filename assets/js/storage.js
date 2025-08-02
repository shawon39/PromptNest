// Storage manager for PromptNest Chrome Extension
class PromptNestStorage {
    constructor() {
        this.defaultCategories = [
            { id: 'general', name: 'General', created: Date.now() },
            { id: 'work', name: 'Work', created: Date.now() },
            { id: 'creative', name: 'Creative', created: Date.now() }
        ];
        this.init();
    }

    async init() {
        try {
            const existing = await this.getCategories();
            if (!existing || existing.length === 0) {
                await this.setCategories(this.defaultCategories);
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }

    // Generic storage methods
    async setItem(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
            return true;
        } catch (error) {
            console.error(`Failed to set ${key}:`, error);
            return false;
        }
    }

    async getItem(key) {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key];
        } catch (error) {
            console.error(`Failed to get ${key}:`, error);
            return null;
        }
    }

    async removeItem(key) {
        try {
            await chrome.storage.local.remove(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
            return false;
        }
    }

    async clearAll() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    // Category management
    async getCategories() {
        return await this.getItem('categories') || [];
    }

    async setCategories(categories) {
        return await this.setItem('categories', categories);
    }

    async addCategory(name) {
        const categories = await this.getCategories();
        const newCategory = {
            id: this.generateId(),
            name: name.trim(),
            created: Date.now()
        };
        
        console.log('PromptNest: Adding new category:', newCategory.name, 'ID:', newCategory.id);
        categories.push(newCategory);
        const success = await this.setCategories(categories);
        return success ? newCategory : null;
    }

    async updateCategory(id, updates) {
        const categories = await this.getCategories();
        const index = categories.findIndex(cat => cat.id === id);
        
        if (index === -1) return false;
        
        categories[index] = { ...categories[index], ...updates, modified: Date.now() };
        return await this.setCategories(categories);
    }

    async deleteCategory(id) {
        const categories = await this.getCategories();
        const filtered = categories.filter(cat => cat.id !== id);
        
        // Also delete all prompts in this category
        const prompts = await this.getPrompts();
        const filteredPrompts = prompts.filter(prompt => prompt.categoryId !== id);
        await this.setPrompts(filteredPrompts);
        
        return await this.setCategories(filtered);
    }

    // Prompt management
    async getPrompts() {
        return await this.getItem('prompts') || [];
    }

    async setPrompts(prompts) {
        return await this.setItem('prompts', prompts);
    }

    async addPrompt(title, content, categoryId = null) {
        const prompts = await this.getPrompts();
        
        // Check for near-duplicate prompts (same title and content)
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const existingDuplicate = prompts.find(p => 
            p.title.trim() === trimmedTitle && p.content.trim() === trimmedContent
        );
        
        if (existingDuplicate) {
            console.warn('PromptNest: Duplicate prompt detected, skipping creation:', trimmedTitle);
            return existingDuplicate; // Return existing prompt instead of creating duplicate
        }
        
        const newPrompt = {
            id: this.generateId(),
            title: trimmedTitle,
            content: trimmedContent,
            categoryId: categoryId,
            created: Date.now(),
            modified: Date.now(),
            useCount: 0,
            lastUsed: null
        };
        
        console.log('PromptNest: Adding new prompt:', newPrompt.title, 'ID:', newPrompt.id, 'Category:', categoryId);
        prompts.push(newPrompt);
        const success = await this.setPrompts(prompts);
        return success ? newPrompt : null;
    }

    async updatePrompt(id, updates) {
        const prompts = await this.getPrompts();
        const index = prompts.findIndex(prompt => prompt.id === id);
        
        if (index === -1) return false;
        
        prompts[index] = { ...prompts[index], ...updates, modified: Date.now() };
        return await this.setPrompts(prompts);
    }

    async deletePrompt(id) {
        const prompts = await this.getPrompts();
        const filtered = prompts.filter(prompt => prompt.id !== id);
        return await this.setPrompts(filtered);
    }

    async clonePrompt(id) {
        const prompts = await this.getPrompts();
        const originalPrompt = prompts.find(prompt => prompt.id === id);
        
        if (!originalPrompt) return null;
        
        const clonedPrompt = {
            ...originalPrompt,
            id: this.generateId(),
            title: `${originalPrompt.title} (Copy)`,
            created: Date.now(),
            modified: Date.now(),
            useCount: 0,
            lastUsed: null
        };
        
        prompts.push(clonedPrompt);
        const success = await this.setPrompts(prompts);
        return success ? clonedPrompt : null;
    }

    async incrementPromptUsage(id) {
        const prompts = await this.getPrompts();
        const index = prompts.findIndex(prompt => prompt.id === id);
        
        if (index === -1) return false;
        
        prompts[index].useCount += 1;
        prompts[index].lastUsed = Date.now();
        return await this.setPrompts(prompts);
    }

    // Search and filter methods
    async searchPrompts(query) {
        const prompts = await this.getPrompts();
        if (!query || query.trim() === '') return prompts;
        
        const searchTerm = query.toLowerCase().trim();
        return prompts.filter(prompt => 
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.content.toLowerCase().includes(searchTerm)
        );
    }

    async getPromptsByCategory(categoryId) {
        const prompts = await this.getPrompts();
        if (categoryId === 'all' || !categoryId) return prompts;
        return prompts.filter(prompt => prompt.categoryId === categoryId);
    }

    async getRecentPrompts(limit = 10) {
        const prompts = await this.getPrompts();
        return prompts
            .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
            .slice(0, limit);
    }

    async getPopularPrompts(limit = 10) {
        const prompts = await this.getPrompts();
        return prompts
            .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
            .slice(0, limit);
    }

    // Settings management
    async getSettings() {
        const defaultSettings = {
            theme: 'auto',
            autoBackup: true,
            showUsageStats: true,
            defaultCategory: null,
        };
        
        return await this.getItem('settings') || defaultSettings;
    }

    async updateSettings(newSettings) {
        const currentSettings = await this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return await this.setItem('settings', updatedSettings);
    }

    // Import/Export functionality
    async exportData() {
        try {
            const [categories, prompts, settings] = await Promise.all([
                this.getCategories(),
                this.getPrompts(),
                this.getSettings()
            ]);
            
            return {
                version: '1.0',
                exportDate: new Date().toISOString(),
                data: {
                    categories,
                    prompts,
                    settings
                }
            };
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    async importData(importData, options = { merge: true }) {
        try {
            if (!importData || !importData.data) {
                throw new Error('Invalid import data format');
            }
            
            const { categories, prompts, settings } = importData.data;
            
            if (options.merge) {
                // Merge with existing data
                const existingCategories = await this.getCategories();
                const existingPrompts = await this.getPrompts();
                
                const mergedCategories = this.mergeArraysById(existingCategories, categories || []);
                const mergedPrompts = this.mergeArraysById(existingPrompts, prompts || []);
                
                await Promise.all([
                    this.setCategories(mergedCategories),
                    this.setPrompts(mergedPrompts),
                    settings ? this.updateSettings(settings) : Promise.resolve()
                ]);
            } else {
                // Replace existing data
                await Promise.all([
                    this.setCategories(categories || []),
                    this.setPrompts(prompts || []),
                    settings ? this.setItem('settings', settings) : Promise.resolve()
                ]);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    mergeArraysById(existing, incoming) {
        const existingIds = new Set(existing.map(item => item.id));
        const merged = [...existing];
        
        incoming.forEach(item => {
            if (!existingIds.has(item.id)) {
                // Regenerate ID to avoid conflicts
                merged.push({ ...item, id: this.generateId() });
            }
        });
        
        return merged;
    }

    // Statistics methods
    async getStatistics() {
        const [categories, prompts] = await Promise.all([
            this.getCategories(),
            this.getPrompts()
        ]);
        
        const totalUses = prompts.reduce((sum, prompt) => sum + (prompt.useCount || 0), 0);
        const mostUsedPrompt = prompts.reduce((max, prompt) => 
            (prompt.useCount || 0) > (max.useCount || 0) ? prompt : max, prompts[0]);
        
        return {
            totalCategories: categories.length,
            totalPrompts: prompts.length,
            totalUses: totalUses,
            averageUsesPerPrompt: prompts.length > 0 ? (totalUses / prompts.length).toFixed(1) : 0,
            mostUsedPrompt: mostUsedPrompt,
            recentActivity: prompts.filter(p => p.lastUsed && p.lastUsed > Date.now() - 7 * 24 * 60 * 60 * 1000).length
        };
    }
}

// Initialize storage instance
const promptNestStorage = new PromptNestStorage();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.promptNestStorage = promptNestStorage;
}