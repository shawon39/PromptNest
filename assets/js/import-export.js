// Import/Export functionality for PromptNest
class PromptNestImportExport {
    constructor() {
        this.exportBtn = null;
        this.importBtn = null;
        this.importFile = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Export button
        this.exportBtn = document.getElementById('exportBtn');
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', this.handleExport.bind(this));
        }

        // Import button
        this.importBtn = document.getElementById('importBtn');
        if (this.importBtn) {
            this.importBtn.addEventListener('click', this.handleImportClick.bind(this));
        }

        // Hidden file input
        this.importFile = document.getElementById('importFile');
        if (this.importFile) {
            this.importFile.addEventListener('change', this.handleImportFile.bind(this));
        }
    }

    async handleExport() {
        try {
            // Show loading state
            this.setExportButtonState('loading');
            
            // Export all data
            const exportData = await this.exportAllData();
            
            if (exportData) {
                // Create and download file
                await this.downloadExportFile(exportData);
                
                // Show success message
                if (window.promptNestUI) {
                }
            } else {
                throw new Error('Failed to export data');
            }
            
        } catch (error) {
            console.error('Export failed:', error);
            if (window.promptNestUI) {
            }
        } finally {
            this.setExportButtonState('idle');
        }
    }

    async exportAllData() {
        try {
            // Get all data from storage
            const [categories, prompts, settings, stats] = await Promise.all([
                promptNestStorage.getCategories(),
                promptNestStorage.getPrompts(),
                promptNestStorage.getSettings(),
                promptNestStorage.getStatistics()
            ]);

            // Create export object
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                exportType: 'full',
                metadata: {
                    totalCategories: categories.length,
                    totalPrompts: prompts.length,
                    totalUses: stats.totalUses || 0
                },
                data: {
                    categories,
                    prompts,
                    settings
                }
            };

            return exportData;
            
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    async exportPromptsOnly() {
        try {
            const [categories, prompts] = await Promise.all([
                promptNestStorage.getCategories(),
                promptNestStorage.getPrompts()
            ]);

            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                exportType: 'prompts',
                metadata: {
                    totalCategories: categories.length,
                    totalPrompts: prompts.length
                },
                data: {
                    categories,
                    prompts
                }
            };

            return exportData;
            
        } catch (error) {
            console.error('Failed to export prompts:', error);
            return null;
        }
    }

    async downloadExportFile(exportData) {
        try {
            // Convert to JSON string
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Create blob
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create download URL
            const url = URL.createObjectURL(blob);
            
            // Create filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `promptnest-backup-${timestamp}.json`;
            
            // Create temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            return true;
            
        } catch (error) {
            console.error('Failed to download export file:', error);
            return false;
        }
    }

    handleImportClick() {
        if (this.importFile) {
            this.importFile.click();
        }
    }

    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading state
            this.setImportButtonState('loading');
            
            // Read file
            const fileContent = await this.readFile(file);
            
            // Parse JSON
            const importData = JSON.parse(fileContent);
            
            // Validate import data
            if (!this.validateImportData(importData)) {
                throw new Error('Invalid import file format');
            }
            
            // Show import options dialog
            const importOptions = await this.showImportOptionsDialog(importData);
            
            if (importOptions.confirmed) {
                // Perform import
                const success = await this.performImport(importData, importOptions);
                
                if (success) {
                    // Refresh UI
                    if (window.promptNestUI) {
                        await window.promptNestUI.loadCategories();
                        await window.promptNestUI.loadPrompts();
                        await window.promptNestUI.updatePromptCounts();
                    }
                } else {
                    throw new Error('Import operation failed');
                }
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            if (window.promptNestUI) {
                const message = error.message.includes('JSON') 
                    ? 'Invalid file format. Please select a valid PromptNest backup file.'
                    : 'Import failed: ' + error.message;
            }
        } finally {
            // Reset file input
            event.target.value = '';
            this.setImportButtonState('idle');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        try {
            // Check basic structure
            if (!data || typeof data !== 'object') {
                return false;
            }
            
            // Check required fields
            if (!data.version || !data.data) {
                return false;
            }
            
            // Check data structure
            const { categories, prompts } = data.data;
            
            if (categories && !Array.isArray(categories)) {
                return false;
            }
            
            if (prompts && !Array.isArray(prompts)) {
                return false;
            }
            
            // Validate categories structure
            if (categories) {
                for (const category of categories) {
                    if (!category.id || !category.name || !category.created) {
                        return false;
                    }
                }
            }
            
            // Validate prompts structure
            if (prompts) {
                for (const prompt of prompts) {
                    if (!prompt.id || !prompt.title || !prompt.content || !prompt.created) {
                        return false;
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    showImportOptionsDialog(importData) {
        return new Promise((resolve) => {
            // Create modal dialog
            const modalHtml = `
                <div class="modal-overlay" id="importOptionsModal">
                    <div class="modal-content import-options-modal">
                        <div class="modal-header">
                            <h2>Import Options</h2>
                        </div>
                        <div class="modal-body">
                            <div class="import-info">
                                <h3>Import Data Summary:</h3>
                                <p><strong>Version:</strong> ${importData.version}</p>
                                <p><strong>Export Date:</strong> ${new Date(importData.exportDate).toLocaleString()}</p>
                                <p><strong>Categories:</strong> ${importData.data.categories?.length || 0}</p>
                                <p><strong>Prompts:</strong> ${importData.data.prompts?.length || 0}</p>
                            </div>
                            
                            <div class="import-options">
                                <h3>Import Mode:</h3>
                                <label class="radio-option">
                                    <input type="radio" name="importMode" value="merge" checked>
                                    <span>Merge with existing data</span>
                                    <small>Keep existing data and add imported items</small>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="importMode" value="replace">
                                    <span>Replace all existing data</span>
                                    <small>⚠️ This will delete all current data</small>
                                </label>
                            </div>
                            
                            <div class="import-items">
                                <h3>Import Items:</h3>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="importCategories" checked>
                                    <span>Categories</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="importPrompts" checked>
                                    <span>Prompts</span>
                                </label>
                                <label class="checkbox-option">
                                    <input type="checkbox" id="importSettings">
                                    <span>Settings</span>
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="secondary-button" id="cancelImport">Cancel</button>
                            <button class="primary-button" id="confirmImport">Import</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = document.getElementById('importOptionsModal');
            const cancelBtn = document.getElementById('cancelImport');
            const confirmBtn = document.getElementById('confirmImport');
            
            // Show modal
            modal.style.display = 'flex';
            
            // Handle cancel
            const handleCancel = () => {
                modal.remove();
                resolve({ confirmed: false });
            };
            
            // Handle confirm
            const handleConfirm = () => {
                const importMode = document.querySelector('input[name="importMode"]:checked').value;
                const importCategories = document.getElementById('importCategories').checked;
                const importPrompts = document.getElementById('importPrompts').checked;
                const importSettings = document.getElementById('importSettings').checked;
                
                modal.remove();
                resolve({
                    confirmed: true,
                    mode: importMode,
                    items: {
                        categories: importCategories,
                        prompts: importPrompts,
                        settings: importSettings
                    }
                });
            };
            
            // Event listeners
            cancelBtn.addEventListener('click', handleCancel);
            confirmBtn.addEventListener('click', handleConfirm);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleCancel();
            });
        });
    }

    async performImport(importData, options) {
        try {
            const { mode, items } = options;
            const { categories, prompts, settings } = importData.data;
            
            if (mode === 'replace') {
                // Clear existing data
                if (items.categories && categories) {
                    await promptNestStorage.setCategories([]);
                }
                if (items.prompts && prompts) {
                    await promptNestStorage.setPrompts([]);
                }
            }
            
            // Import categories
            if (items.categories && categories) {
                if (mode === 'merge') {
                    const existingCategories = await promptNestStorage.getCategories();
                    const mergedCategories = this.mergeData(existingCategories, categories, 'name');
                    await promptNestStorage.setCategories(mergedCategories);
                } else {
                    await promptNestStorage.setCategories(categories);
                }
            }
            
            // Import prompts
            if (items.prompts && prompts) {
                if (mode === 'merge') {
                    const existingPrompts = await promptNestStorage.getPrompts();
                    const mergedPrompts = this.mergeData(existingPrompts, prompts, 'title');
                    await promptNestStorage.setPrompts(mergedPrompts);
                } else {
                    await promptNestStorage.setPrompts(prompts);
                }
            }
            
            // Import settings
            if (items.settings && settings) {
                if (mode === 'merge') {
                    const existingSettings = await promptNestStorage.getSettings();
                    const mergedSettings = { ...existingSettings, ...settings };
                    await promptNestStorage.updateSettings(mergedSettings);
                } else {
                    await promptNestStorage.setItem('settings', settings);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('Import operation failed:', error);
            return false;
        }
    }

    mergeData(existing, incoming, uniqueField) {
        const existingMap = new Map();
        existing.forEach(item => existingMap.set(item[uniqueField], item));
        
        const merged = [...existing];
        
        incoming.forEach(item => {
            if (!existingMap.has(item[uniqueField])) {
                // Generate new ID to avoid conflicts
                merged.push({
                    ...item,
                    id: promptNestStorage.generateId(),
                    imported: true,
                    importDate: Date.now()
                });
            }
        });
        
        return merged;
    }

    setExportButtonState(state) {
        if (!this.exportBtn) return;
        
        switch (state) {
            case 'loading':
                this.exportBtn.disabled = true;
                this.exportBtn.innerHTML = '<span class="icon">⏳</span> Exporting...';
                break;
            case 'idle':
            default:
                this.exportBtn.disabled = false;
                this.exportBtn.innerHTML = '<span class="icon">📤</span> Export Prompts';
                break;
        }
    }

    setImportButtonState(state) {
        if (!this.importBtn) return;
        
        switch (state) {
            case 'loading':
                this.importBtn.disabled = true;
                this.importBtn.innerHTML = '<span class="icon">⏳</span> Importing...';
                break;
            case 'idle':
            default:
                this.importBtn.disabled = false;
                this.importBtn.innerHTML = '<span class="icon">📥</span> Import Prompts';
                break;
        }
    }

    // Public methods for external use
    async exportData(type = 'full') {
        if (type === 'prompts') {
            return await this.exportPromptsOnly();
        }
        return await this.exportAllData();
    }

    async importFromFile(file) {
        const fileContent = await this.readFile(file);
        const importData = JSON.parse(fileContent);
        
        if (!this.validateImportData(importData)) {
            throw new Error('Invalid import file format');
        }
        
        return await promptNestStorage.importData(importData, { merge: true });
    }

    // Quick export functions for different formats
    async exportAsText() {
        try {
            const prompts = await promptNestStorage.getPrompts();
            const categories = await promptNestStorage.getCategories();
            
            let textContent = 'PromptNest Export\n';
            textContent += '=================\n\n';
            textContent += `Export Date: ${new Date().toLocaleString()}\n`;
            textContent += `Total Prompts: ${prompts.length}\n\n`;
            
            // Group prompts by category
            const categoryMap = new Map();
            categories.forEach(cat => categoryMap.set(cat.id, cat.name));
            
            const groupedPrompts = {};
            prompts.forEach(prompt => {
                const categoryName = categoryMap.get(prompt.categoryId) || 'Uncategorized';
                if (!groupedPrompts[categoryName]) {
                    groupedPrompts[categoryName] = [];
                }
                groupedPrompts[categoryName].push(prompt);
            });
            
            // Add prompts by category
            Object.entries(groupedPrompts).forEach(([categoryName, categoryPrompts]) => {
                textContent += `## ${categoryName}\n\n`;
                
                categoryPrompts.forEach(prompt => {
                    textContent += `### ${prompt.title}\n`;
                    textContent += `${prompt.content}\n\n`;
                });
            });
            
            return textContent;
            
        } catch (error) {
            console.error('Failed to export as text:', error);
            return null;
        }
    }
}

// Initialize import/export functionality
let promptNestImportExport;

document.addEventListener('DOMContentLoaded', () => {
    if (!window.promptNestImportExport) {
        promptNestImportExport = new PromptNestImportExport();
        window.promptNestImportExport = promptNestImportExport;
    }
});

// Export for global access
if (typeof window !== 'undefined') {
    window.promptNestImportExport = promptNestImportExport;
}