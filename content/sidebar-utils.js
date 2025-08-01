// UI utilities and keyboard shortcuts for PromptNest sidebar
class SidebarUtils {
    constructor(sidebar) {
        this.sidebar = sidebar;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when sidebar is open
            if (!this.sidebar.isOpen) return;
            
            // Escape key - close sidebar or modal
            if (e.key === 'Escape') {
                e.preventDefault();
                const modalOverlay = this.sidebar.sidebar.querySelector('#promptnest-modal-overlay');
                if (modalOverlay && modalOverlay.classList.contains('visible')) {
                    this.sidebar.modalManager.hideModal();
                } else {
                    this.sidebar.close();
                }
                return;
            }
            
            // Don't handle other shortcuts when modal is open or when typing in inputs
            const modalOverlay = this.sidebar.sidebar.querySelector('#promptnest-modal-overlay');
            const isModalOpen = modalOverlay && modalOverlay.classList.contains('visible');
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            
            if (isModalOpen || isTyping) return;
            
            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = this.sidebar.sidebar.querySelector('#promptnest-search');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            }
            
            // Ctrl/Cmd + N - New prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.sidebar.modalManager.showAddPromptModal();  
                return;
            }
            
            // Ctrl/Cmd + Shift + N - New category
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.sidebar.modalManager.showAddCategoryModal();
                return;
            }
            
            // Ctrl/Cmd + , - Settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.sidebar.modalManager.showSettingsModal();
                return;
            }
            
            // F key - Focus search (quick access)
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                const searchInput = this.sidebar.sidebar.querySelector('#promptnest-search');
                if (searchInput) {
                    searchInput.focus();
                }
                return;
            }
        });
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

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SidebarUtils = SidebarUtils;
}