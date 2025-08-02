// Content script for AI site detection and floating icon injection
class PromptNestFloatingIcon {
    constructor() {
        this.isInjected = false;
        this.floatingButton = null;
        this.sidebar = null;
        this.supportedSites = [
            'chat.openai.com',
            'chatgpt.com',
            'gemini.google.com', 
            'claude.ai',
            'copilot.microsoft.com',
            'chat.deepseek.com'
        ];
        
        this.init();
    }

    init() {
        if (this.isSupportedSite()) {
            this.waitForPageLoad();
        } else {
            // For non-supported sites, only initialize sidebar without floating icon
            this.initializeSidebarOnly();
        }
    }

    isSupportedSite() {
        const hostname = window.location.hostname;
        return this.supportedSites.some(site => hostname.includes(site));
    }

    waitForPageLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.injectFloatingIcon(), 1000);
            });
        } else {
            setTimeout(() => this.injectFloatingIcon(), 1000);
        }
    }

    injectFloatingIcon() {
        if (this.isInjected || this.floatingButton) return;
        
        this.createFloatingButton();
        this.initializeSidebar();
        this.addEventListeners();
        this.isInjected = true;
    }

    initializeSidebar() {
        // Initialize sidebar - PromptNestSidebar is already loaded via manifest
        if (typeof PromptNestSidebar !== 'undefined') {
            this.sidebar = new PromptNestSidebar();
            // Set global reference for modal callbacks
            window.promptNestSidebar = this.sidebar;
        } else {
            console.error('PromptNestSidebar class not loaded');
            // Retry after a short delay in case of timing issues
            setTimeout(() => {
                if (typeof PromptNestSidebar !== 'undefined') {
                    this.sidebar = new PromptNestSidebar();
                    // Set global reference for modal callbacks
                    window.promptNestSidebar = this.sidebar;
                } else {
                    console.error('PromptNestSidebar class still not available after retry');
                }
            }, 500);
        }
    }

    initializeSidebarOnly() {
        // Initialize sidebar without floating icon for non-supported sites
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initializeSidebar(), 1000);
            });
        } else {
            setTimeout(() => this.initializeSidebar(), 1000);
        }
    }

    createFloatingButton() {
        this.floatingButton = document.createElement('div');
        this.floatingButton.id = 'promptnest-floating-icon';
        this.floatingButton.innerHTML = `
            <div class="promptnest-icon-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
            </div>
        `;
        
        document.body.appendChild(this.floatingButton);
    }

    addEventListeners() {
        if (!this.floatingButton) return;

        this.floatingButton.addEventListener('click', this.handleClick.bind(this));
        this.floatingButton.addEventListener('mouseenter', this.handleHover.bind(this));
        this.floatingButton.addEventListener('mouseleave', this.handleHoverOut.bind(this));
        
        // Handle page navigation for SPAs
        this.observePageChanges();
    }

    handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle sidebar instead of opening popup
        if (this.sidebar) {
            this.sidebar.toggle();
        }
    }

    handleHover() {
        if (this.floatingButton) {
            this.floatingButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
        }
    }

    handleHoverOut() {
        if (this.floatingButton) {
            this.floatingButton.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }

    observePageChanges() {
        // Watch for URL changes in SPAs
        let currentUrl = window.location.href;
        
        const observer = new MutationObserver(() => {
            if (currentUrl !== window.location.href) {
                currentUrl = window.location.href;
                
                // Re-inject if navigated to a supported page
                if (this.isSupportedSite() && !this.isInjected) {
                    setTimeout(() => this.injectFloatingIcon(), 1000);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Method to find and fill input elements
    findAndFillInput(promptText) {
        const hostname = window.location.hostname;
        
        // Site-specific selectors for better targeting
        const siteSpecificSelectors = {
            'chat.openai.com': ['#prompt-textarea'],
            'chatgpt.com': ['#prompt-textarea'],
            'gemini.google.com': ['.text-input-field_textarea .ql-editor', '.text-input-field_textarea', 'div[role="textbox"]', '[contenteditable="true"]'],
            'claude.ai': ['#chat-input-file-upload-onpage', 'input[placeholder*="ask"]'],
            'copilot.microsoft.com': ['textarea[placeholder*="Copilot"]'],
            'chat.deepseek.com': ['#chat-input']
        };

        // Fallback selectors (including "ask", "now", "Message", "chat" placeholders)
        const fallbackSelectors = [
            'textarea[placeholder*="ask"]',
            'textarea[placeholder*="now"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="chat"]',
            'textarea[placeholder*="prompt"]', 
            'div[contenteditable="true"]',
            'textarea:not([type="password"])',
            'input[type="text"]:not([type="password"])'
        ];

        let targetInput = null;
        let selectorsToTry = [];

        // Get site-specific selectors if available
        for (const site in siteSpecificSelectors) {
            if (hostname.includes(site)) {
                selectorsToTry = [...siteSpecificSelectors[site], ...fallbackSelectors];
                break;
            }
        }

        // If no site-specific selectors found, use fallback selectors
        if (selectorsToTry.length === 0) {
            selectorsToTry = fallbackSelectors;
        }

        // Try to find the most likely input field
        for (const selector of selectorsToTry) {
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
            // Focus the input first
            targetInput.focus();
            
            // For contenteditable divs, preserve newlines by converting to HTML
            if (targetInput.contentEditable === 'true') {
                // Convert newlines to HTML breaks for proper display
                const htmlText = promptText.replace(/\n/g, '<br>');
                
                const pTag = targetInput.querySelector('p');
                if (pTag) {
                    // Clear existing content and set new HTML content
                    pTag.innerHTML = htmlText;
                    pTag.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    // Clear and set content on the contenteditable element directly
                    targetInput.innerHTML = htmlText;
                }
                
                // Dispatch events to trigger AI site's input handling
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                targetInput.dispatchEvent(new Event('keyup', { bubbles: true }));
                
                // Move cursor to end
                this.setCursorToEnd(targetInput);
                
            } else if (targetInput.tagName === 'P') {
                // If we directly selected a p tag, handle it as contenteditable
                const parent = targetInput.parentElement;
                if (parent && parent.contentEditable === 'true') {
                    parent.focus();
                }
                
                const htmlText = promptText.replace(/\n/g, '<br>');
                targetInput.innerHTML = htmlText;
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                if (parent) {
                    parent.dispatchEvent(new Event('input', { bubbles: true }));
                    parent.dispatchEvent(new Event('keyup', { bubbles: true }));
                }
                
                this.setCursorToEnd(targetInput);
                
            } else {
                // Regular input/textarea - these preserve newlines naturally
                targetInput.value = promptText;
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                targetInput.dispatchEvent(new Event('keyup', { bubbles: true }));
            }
            
            // Set cursor to end for regular inputs
            if (targetInput.setSelectionRange && targetInput.tagName !== 'DIV') {
                targetInput.setSelectionRange(promptText.length, promptText.length);
            }
            
            return true;
        }
        
        return false;
    }

    // Helper method to set cursor to end of contenteditable element
    setCursorToEnd(element) {
        if (window.getSelection && document.createRange) {
            const range = document.createRange();
            const selection = window.getSelection();
            
            try {
                range.selectNodeContents(element);
                range.collapse(false); // Collapse to end
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (error) {
                // Fallback: just focus the element
                console.warn('Could not set cursor position:', error);
                element.focus();
            }
        } else {
            // Fallback for older browsers
            element.focus();
        }
    }

    // Clean up method
    destroy() {
        if (this.floatingButton) {
            this.floatingButton.removeEventListener('click', this.handleClick);
            this.floatingButton.removeEventListener('mouseenter', this.handleHover);
            this.floatingButton.removeEventListener('mouseleave', this.handleHoverOut);
            
            if (this.floatingButton.parentNode) {
                this.floatingButton.parentNode.removeChild(this.floatingButton);
            }
            
            this.floatingButton = null;
        }
        
        if (this.sidebar) {
            this.sidebar.destroy();
            this.sidebar = null;
        }
        
        this.isInjected = false;
    }
}

// Message listener for prompt insertion and sidebar toggle
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'fillPrompt') {
        const success = promptNestIcon.findAndFillInput(request.promptText);
        sendResponse({ success: success });
    } else if (request.action === 'toggleSidebar') {
        if (promptNestIcon && promptNestIcon.sidebar) {
            promptNestIcon.sidebar.toggle();
            if (request.focusSearch) {
                // Focus search input after opening
                setTimeout(() => {
                    const searchInput = document.querySelector('#promptnest-search');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
            }
        } else if (request.isUniversal) {
            // Handle universal sidebar toggle for non-supported sites
            if (!promptNestIcon) {
                promptNestIcon = new PromptNestFloatingIcon();
            }
            // Wait for sidebar to be initialized
            setTimeout(() => {
                if (promptNestIcon.sidebar) {
                    promptNestIcon.sidebar.toggle();
                    if (request.focusSearch) {
                        setTimeout(() => {
                            const searchInput = document.querySelector('#promptnest-search');
                            if (searchInput) {
                                searchInput.focus();
                            }
                        }, 100);
                    }
                }
            }, 500);
        }
        sendResponse({ success: true });
    }
    return true;
});

// Initialize the floating icon
let promptNestIcon;

// Wait for page to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        promptNestIcon = new PromptNestFloatingIcon();
    });
} else {
    promptNestIcon = new PromptNestFloatingIcon();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (promptNestIcon) {
        promptNestIcon.destroy();
    }
});

// Export for potential use by other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptNestFloatingIcon;
}