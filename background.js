// Background service worker for PromptNest Chrome Extension
class PromptNestBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupContextMenus();
        this.handleInstallation();
    }

    setupEventListeners() {
        // Handle extension installation/update
        chrome.runtime.onInstalled.addListener(this.handleOnInstalled.bind(this));
        
        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        
        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));
        
        // Handle keyboard shortcuts (if any)
        chrome.commands.onCommand.addListener(this.handleCommand.bind(this));
        
        // Handle tab updates to check for supported sites
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    }

    async handleOnInstalled(details) {
        console.log('PromptNest installed/updated:', details.reason);
        
        if (details.reason === 'install') {
            // First-time installation
            await this.handleFirstInstall();
        } else if (details.reason === 'update') {
            // Extension update
            await this.handleUpdate(details.previousVersion);
        }
    }

    async handleFirstInstall() {
        try {
            // Initialize default data
            await this.initializeDefaultData();
            
            // Show welcome notification
            
            // Optionally open welcome page
            // chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
            
        } catch (error) {
            console.error('Failed to handle first install:', error);
        }
    }

    async handleUpdate(previousVersion) {
        try {
            console.log(`Updated from version ${previousVersion} to current version`);
            
            // Handle data migration if needed
            await this.handleDataMigration(previousVersion);
            
            // Show update notification
            
        } catch (error) {
            console.error('Failed to handle update:', error);
        }
    }

    async initializeDefaultData() {
        try {
            // Check if data already exists
            const existingCategories = await chrome.storage.local.get('categories');
            
            if (!existingCategories.categories || existingCategories.categories.length === 0) {
                // Set up default categories
                const defaultCategories = [
                    { id: 'general', name: 'General', created: Date.now() },
                    { id: 'work', name: 'Work', created: Date.now() },
                    { id: 'creative', name: 'Creative', created: Date.now() }
                ];
                
                await chrome.storage.local.set({ categories: defaultCategories });
                
                // Add some sample prompts
                const samplePrompts = [
                    {
                        id: Date.now() + '-1',
                        title: 'Email Summary',
                        content: 'Please summarize the key points from this email in 3-4 bullet points, focusing on action items and important deadlines.',
                        categoryId: 'work',
                        created: Date.now(),
                        modified: Date.now(),
                        useCount: 0,
                        lastUsed: null
                    },
                    {
                        id: Date.now() + '-2',
                        title: 'Creative Writing Prompt',
                        content: 'Write a short story (500 words) about a character who discovers an unusual object in their attic. Focus on building mystery and atmosphere.',
                        categoryId: 'creative',
                        created: Date.now(),
                        modified: Date.now(),
                        useCount: 0,
                        lastUsed: null
                    },
                    {
                        id: Date.now() + '-3',
                        title: 'Explain Like I\'m 5',
                        content: 'Explain this concept as if you\'re talking to a 5-year-old. Use simple language, analogies, and examples that a child would understand.',
                        categoryId: 'general',
                        created: Date.now(),
                        modified: Date.now(),
                        useCount: 0,
                        lastUsed: null
                    }
                ];
                
                await chrome.storage.local.set({ prompts: samplePrompts });
            }
            
            // Initialize default settings
            const existingSettings = await chrome.storage.local.get('settings');
            if (!existingSettings.settings) {
                const defaultSettings = {
                    theme: 'auto',
                    autoBackup: true,
                    showUsageStats: true,
                    defaultCategory: null
                };
                
                await chrome.storage.local.set({ settings: defaultSettings });
            }
            
        } catch (error) {
            console.error('Failed to initialize default data:', error);
        }
    }

    async handleDataMigration(previousVersion) {
        // Handle data migration between versions if needed
        console.log('Checking for data migration needs...');
        
        // Example: Migration from version 1.0.0 to current
        if (previousVersion === '1.0.0') {
            // Perform specific migration tasks
            console.log('Migrating from version 1.0.0');
        }
    }

    setupContextMenus() {
        try {
            // Remove existing context menus
            chrome.contextMenus.removeAll(() => {
                // Create context menu for selected text
                chrome.contextMenus.create({
                    id: 'saveAsPrompt',
                    title: 'Save as PromptNest prompt',
                    contexts: ['selection']
                });
                
                // Create context menu for page
                chrome.contextMenus.create({
                    id: 'openPromptNest',
                    title: 'Open PromptNest',
                    contexts: ['page', 'action']
                });
            });
        } catch (error) {
            console.error('Failed to setup context menus:', error);
        }
    }

    async handleContextMenu(info, tab) {
        try {
            switch (info.menuItemId) {
                case 'saveAsPrompt':
                    await this.saveSelectedTextAsPrompt(info.selectionText, tab);
                    break;
                case 'openPromptNest':
                    // Toggle sidebar on active tab
                    this.toggleSidebarOnActiveTab();
                    break;
                default:
                    console.log('Unknown context menu item:', info.menuItemId);
            }
        } catch (error) {
            console.error('Context menu handler error:', error);
        }
    }

    async saveSelectedTextAsPrompt(selectedText, tab) {
        try {
            if (!selectedText || selectedText.trim().length === 0) {
                return;
            }
            
            // Get current prompts
            const result = await chrome.storage.local.get('prompts');
            const prompts = result.prompts || [];
            
            // Create new prompt from selected text
            const newPrompt = {
                id: Date.now().toString(),
                title: `Prompt from ${tab.title || 'webpage'}`,
                content: selectedText.trim(),
                categoryId: 'general',
                created: Date.now(),
                modified: Date.now(),
                useCount: 0,
                lastUsed: null,
                source: {
                    url: tab.url,
                    title: tab.title,
                    savedAt: Date.now()
                }
            };
            
            // Add to prompts array
            prompts.push(newPrompt);
            
            // Save to storage
            await chrome.storage.local.set({ prompts });
            
            // Show success notification
            
        } catch (error) {
            console.error('Failed to save selected text as prompt:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getTabInfo':
                    // Get current tab information
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    sendResponse({ tab });
                    break;
                    
                case 'checkSupportedSite':
                    // Check if current site is supported
                    const isSupported = this.isSupportedSite(request.url);
                    sendResponse({ supported: isSupported });
                    break;
                    
                    
                default:
                    console.log('Unknown message action:', request.action);
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Message handler error:', error);
            sendResponse({ error: error.message });
        }
        
        // Return true to indicate async response
        return true;
    }

    handleCommand(command) {
        try {
            switch (command) {
                case 'open-promptnest':
                    // Send message to content script to toggle sidebar
                    this.toggleSidebarOnActiveTab();
                    break;
                case 'quick-search':
                    // Send message to content script to toggle sidebar with search focus
                    this.toggleSidebarOnActiveTab(true);
                    break;
                default:
                    console.log('Unknown command:', command);
            }
        } catch (error) {
            console.error('Command handler error:', error);
        }
    }

    async toggleSidebarOnActiveTab(focusSearch = false) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && this.isSupportedSite(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleSidebar',
                    focusSearch: focusSearch
                });
            }
        } catch (error) {
            console.error('Failed to toggle sidebar:', error);
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Only process when tab loading is complete
        if (changeInfo.status === 'complete' && tab.url) {
            const isSupported = this.isSupportedSite(tab.url);
            
            // Update icon based on site support
            this.updateExtensionIcon(isSupported, tabId);
        }
    }

    isSupportedSite(url) {
        if (!url) return false;
        
        const supportedSites = [
            'chat.openai.com',
            'chatgpt.com',
            'gemini.google.com',
            'claude.ai',
            'copilot.microsoft.com',
            'chat.deepseek.com'
        ];
        
        return supportedSites.some(site => url.includes(site));
    }

    updateExtensionIcon(isSupported, tabId) {
        try {
            // Just update the title for now - icon will use default from manifest
            if (isSupported) {
                chrome.action.setTitle({
                    title: 'PromptNest - Click to manage prompts',
                    tabId: tabId
                });
            } else {
                chrome.action.setTitle({
                    title: 'PromptNest - Available on AI chat websites',
                    tabId: tabId
                });
            }
        } catch (error) {
            console.error('Failed to update extension icon:', error);
        }
    }


    handleInstallation() {
        // Handle any additional installation setup
        // No uninstall URL needed
    }

    // Utility methods
    async getStorageUsage() {
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            return {
                used: usage,
                available: chrome.storage.local.QUOTA_BYTES - usage,
                percentage: (usage / chrome.storage.local.QUOTA_BYTES) * 100
            };
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            return null;
        }
    }

    async cleanupOldData() {
        try {
            // Clean up old search history (keep only recent 50 entries)
            const searchHistory = await chrome.storage.local.get('searchHistory');
            if (searchHistory.searchHistory && searchHistory.searchHistory.length > 50) {
                const trimmed = searchHistory.searchHistory.slice(0, 50);
                await chrome.storage.local.set({ searchHistory: trimmed });
            }
            
            // Clean up old backup data if any
            const backups = await chrome.storage.local.get('backups');
            if (backups.backups && backups.backups.length > 5) {
                const recent = backups.backups.slice(0, 5);
                await chrome.storage.local.set({ backups: recent });
            }
            
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
        }
    }
}

// Initialize background script
const promptNestBackground = new PromptNestBackground();

// Periodic cleanup (every 24 hours)
chrome.alarms.create('cleanup', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        promptNestBackground.cleanupOldData();
    }
});