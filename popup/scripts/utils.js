// Utility functions for PromptNest popup
class PromptNestUtils {
    static setLoadingState(isLoading) {
        // Add loading UI updates here if needed
        return isLoading;
    }

    static showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static truncateText(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static formatDate(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }

    static debounce(func, wait) {
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
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PromptNestUtils = PromptNestUtils;
}