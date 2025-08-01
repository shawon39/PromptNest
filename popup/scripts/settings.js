// Settings management for PromptNest
class PromptNestSettings {
    constructor() {
        this.currentSettings = null;
        this.themeSelect = null;
        this.init();
    }

    async init() {
        await this.loadCurrentSettings();
        this.setupEventListeners();
    }

    async loadCurrentSettings() {
        try {
            this.currentSettings = await promptNestStorage.getSettings();
        } catch (error) {
            console.error('Failed to load current settings:', error);
            this.currentSettings = {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true,
                defaultCategory: null,
            };
        }
    }

    setupEventListeners() {
        // Theme selection
        this.themeSelect = document.getElementById('themeSelect');
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', this.handleThemeChange.bind(this));
        }

        // When settings modal opens, populate form
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', this.populateSettingsForm.bind(this));
        }

        // Listen for settings modal being shown to populate form
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const modal = mutation.target;
                        if (modal.style.display === 'flex') {
                            setTimeout(() => this.populateSettingsForm(), 100);
                        }
                    }
                });
            });
            observer.observe(settingsModal, { attributes: true });
        }
    }

    async populateSettingsForm() {
        try {
            // Ensure we have the latest settings
            await this.loadCurrentSettings();
            
            // Populate theme select
            if (this.themeSelect) {
                this.themeSelect.value = this.currentSettings.theme || 'auto';
            }
            
        } catch (error) {
            console.error('Failed to populate settings form:', error);
        }
    }

    async handleThemeChange(event) {
        const newTheme = event.target.value;
        
        try {
            // Update settings in storage
            await this.updateSetting('theme', newTheme);
            
            // Apply theme immediately
            this.applyTheme(newTheme);
            
            // Show success notification
            if (window.promptNestUI) {
            }
            
        } catch (error) {
            console.error('Failed to update theme:', error);
            if (window.promptNestUI) {
            }
        }
    }

    applyTheme(theme) {
        // Handle auto theme by detecting system preference
        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = this.getSystemTheme();
        }
        
        // Apply the theme to the document
        document.body.setAttribute('data-theme', actualTheme);
        
        // Store in local variable
        if (this.currentSettings) {
            this.currentSettings.theme = theme;
        }
    }

    async updateSetting(key, value) {
        try {
            const updatedSettings = { ...this.currentSettings, [key]: value };
            const success = await promptNestStorage.updateSettings(updatedSettings);
            
            if (success) {
                this.currentSettings = updatedSettings;
                return true;
            }
            return false;
            
        } catch (error) {
            console.error(`Failed to update setting ${key}:`, error);
            return false;
        }
    }

    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to default?')) {
            return false;
        }
        
        try {
            const defaultSettings = {
                theme: 'auto',
                autoBackup: true,
                showUsageStats: true,
                defaultCategory: null,
            };
            
            const success = await promptNestStorage.setItem('settings', defaultSettings);
            
            if (success) {
                this.currentSettings = defaultSettings;
                this.populateSettingsForm();
                this.applyTheme(defaultSettings.theme);
                
                if (window.promptNestUI) {
                }
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('Failed to reset settings:', error);
            if (window.promptNestUI) {
            }
            return false;
        }
    }

    // Theme utilities
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getCurrentTheme() {
        if (!this.currentSettings) return 'auto';
        
        const theme = this.currentSettings.theme;
        if (theme === 'auto') {
            return this.getSystemTheme();
        }
        return theme;
    }

    // Listen for system theme changes
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Only update if theme is set to auto
                if (this.currentSettings && this.currentSettings.theme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    // Public methods for external use
    async getSettings() {
        if (!this.currentSettings) {
            await this.loadCurrentSettings();
        }
        return { ...this.currentSettings };
    }

    async setSetting(key, value) {
        return await this.updateSetting(key, value);
    }

    getTheme() {
        return this.getCurrentTheme();
    }

    async setTheme(theme) {
        if (!['auto', 'light', 'dark'].includes(theme)) {
            console.error('Invalid theme:', theme);
            return false;
        }
        
        return await this.updateSetting('theme', theme);
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when not in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Ctrl/Cmd + Comma to open settings
            if ((event.ctrlKey || event.metaKey) && event.key === ',') {
                event.preventDefault();
                const settingsBtn = document.getElementById('settingsBtn');
                if (settingsBtn) {
                    settingsBtn.click();
                }
            }
            
            // Alt + T to toggle theme
            if (event.altKey && event.key === 't') {
                event.preventDefault();
                this.toggleTheme();
            }
        });
    }

    async toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        await this.setTheme(newTheme);
        this.applyTheme(newTheme);
        
        if (this.themeSelect) {
            this.themeSelect.value = newTheme;
        }
        
        if (window.promptNestUI) {
        }
    }

    // Initialize theme on startup
    async initializeTheme() {
        await this.loadCurrentSettings();
        const theme = this.currentSettings.theme || 'auto';
        this.applyTheme(theme);
        this.watchSystemTheme();
    }

    // Export settings for backup
    async exportSettings() {
        try {
            const settings = await this.getSettings();
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                type: 'settings',
                data: settings
            };
            
            return exportData;
        } catch (error) {
            console.error('Failed to export settings:', error);
            return null;
        }
    }

    // Import settings from backup
    async importSettings(importData) {
        try {
            if (!importData || !importData.data || importData.type !== 'settings') {
                throw new Error('Invalid settings import data');
            }
            
            const success = await promptNestStorage.setItem('settings', importData.data);
            
            if (success) {
                this.currentSettings = importData.data;
                this.populateSettingsForm();
                this.applyTheme(importData.data.theme || 'auto');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }

    // Validate settings object
    validateSettings(settings) {
        const validThemes = ['auto', 'light', 'dark'];
        
        // Check required properties and types
        if (typeof settings !== 'object' || settings === null) {
            return false;
        }
        
        if (settings.theme && !validThemes.includes(settings.theme)) {
            return false;
        }
        
        if (settings.autoBackup !== undefined && typeof settings.autoBackup !== 'boolean') {
            return false;
        }
        
        if (settings.showUsageStats !== undefined && typeof settings.showUsageStats !== 'boolean') {
            return false;
        }
        
        
        return true;
    }

    // Get display information for current settings
    getSettingsDisplayInfo() {
        if (!this.currentSettings) return null;
        
        return {
            theme: {
                value: this.currentSettings.theme,
                display: this.getThemeDisplayName(this.currentSettings.theme),
                actual: this.getCurrentTheme() // What's actually being used
            },
            autoBackup: {
                value: this.currentSettings.autoBackup,
                display: this.currentSettings.autoBackup ? 'Enabled' : 'Disabled'
            },
            showUsageStats: {
                value: this.currentSettings.showUsageStats,
                display: this.currentSettings.showUsageStats ? 'Shown' : 'Hidden'
            },
        };
    }

    getThemeDisplayName(theme) {
        switch (theme) {
            case 'auto': return 'Auto (System)';
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            default: return theme;
        }
    }
}

// Initialize settings when DOM is loaded
let promptNestSettings;

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.promptNestSettings) {
        promptNestSettings = new PromptNestSettings();
        window.promptNestSettings = promptNestSettings;
        await promptNestSettings.initializeTheme();
        promptNestSettings.setupKeyboardShortcuts();
    }
});

// Export for global access
if (typeof window !== 'undefined') {
    window.promptNestSettings = promptNestSettings;
}