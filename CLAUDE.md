# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

PromptNest is a Chrome extension (Manifest V3) for managing AI prompts with a modular, class-based architecture:

### Core Components

**Extension Entry Points:**
- `manifest.json` - Extension configuration with content scripts for 5 AI sites (ChatGPT, Gemini, Claude, Copilot, DeepSeek)
- `background.js` - Service worker handling extension lifecycle, context menus, and keyboard shortcuts

**Content Scripts (Injected into AI websites):**
- `content/content.js` - `PromptNestFloatingIcon` class detects supported sites and injects floating icon
- `content/sidebar.js` - `PromptNestSidebar` class provides full-screen overlay interface for prompt management
- `content/sidebar-utils.js` - `SidebarUtils` class handles keyboard shortcuts, theming, and site-specific text insertion
- `content/sidebar-modal-manager.js` - `SidebarModalManager` class manages CRUD modals within sidebar

**Popup Interface:**
- `popup/popup.js` - `PromptNestUI` main coordinator class
- `popup/scripts/data-manager.js` - `PromptNestDataManager` handles CRUD operations and UI updates
- `popup/scripts/form-handler.js` - `PromptNestFormHandler` manages form validation and submission
- `popup/scripts/storage.js` - `promptNestStorage` singleton for Chrome storage operations
- `popup/scripts/search.js` - Fuzzy search functionality
- `popup/scripts/settings.js` - Theme and settings management
- `popup/scripts/import-export.js` - JSON backup/restore functionality

### Text Insertion System

The extension uses site-specific selectors for reliable text insertion:

```javascript
const siteSpecificSelectors = {
    'chat.openai.com': ['#prompt-textarea'],
    'chatgpt.com': ['#prompt-textarea'],
    'gemini.google.com': ['.text-input-field_textarea .ql-editor', '.text-input-field_textarea', 'div[role="textbox"]', '[contenteditable="true"]'],
    'claude.ai': ['#chat-input-file-upload-onpage', 'input[placeholder*="ask"]'],
    'copilot.microsoft.com': ['textarea[placeholder*="Copilot"]'],
    'chat.deepseek.com': ['#chat-input']
};
```

With intelligent fallback selectors for unsupported sites and handles both `input.value` and `contentEditable` text insertion.

### Data Flow

1. **Popup Interface**: User interacts with popup � `PromptNestUI` � `PromptNestDataManager` � `promptNestStorage` � Chrome Storage API
2. **Content Script**: User clicks floating icon � `PromptNestSidebar` � Direct Chrome Storage API access � Text insertion via `SidebarUtils.findAndFillInput()`
3. **Background Script**: Handles context menus, keyboard shortcuts, extension icon updates based on current tab

### File Size Constraint

All files must stay under 500 lines. The architecture is deliberately modular to maintain this constraint:
- Original monolithic files were split into focused modules
- Each class has a single responsibility
- Complex features are broken into separate utility classes

## Development Commands

**Extension Development:**
```bash
# Load extension in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode" 
3. Click "Load unpacked"
4. Select the PromptNest folder
5. After changes, click reload button on extension card
```

**Testing:**
```bash
# Test floating icon injection
1. Visit supported AI site (ChatGPT, Gemini, Claude, Copilot, DeepSeek)
2. Look for floating icon in bottom-right corner after 1 second delay
3. Check browser console for errors

# Test text insertion
1. Open PromptNest sidebar/popup
2. Try inserting a prompt
3. Verify text appears in AI site's input field
```

**Debugging:**
```bash
# Content script debugging
- Open AI website
- F12 � Console tab
- Look for PromptNest-related errors

# Popup debugging  
- Right-click extension icon � "Inspect popup"
- Or F12 on popup.html when open

# Background script debugging
- Go to chrome://extensions/
- Click "Inspect views: service worker" under PromptNest
```

## Adding New AI Site Support

1. **Update manifest.json:**
   ```json
   "matches": ["*://newsite.com/*"],
   "host_permissions": ["*://newsite.com/*"]
   ```

2. **Update supported sites arrays in:**
   - `content/content.js` � `supportedSites` array
   - `background.js` � `supportedSites` array  

3. **Add site-specific selectors in both:**
   - `content/content.js` � `siteSpecificSelectors` object
   - `content/sidebar-utils.js` � `siteSpecificSelectors` object

4. **Test text insertion:**
   - Visit new site
   - Verify floating icon appears
   - Test prompt insertion works correctly

## Key Classes and Responsibilities

- `PromptNestFloatingIcon` - Site detection, floating icon injection, sidebar initialization
- `PromptNestSidebar` - Full-screen overlay interface, prompt management
- `SidebarUtils` - Text insertion logic, keyboard shortcuts, theming utilities  
- `SidebarModalManager` - Modal management (add/edit/delete prompts/categories)
- `PromptNestUI` - Popup interface coordinator
- `PromptNestDataManager` - Data operations, UI updates
- `PromptNestFormHandler` - Form validation, submission handling
- `promptNestStorage` - Chrome storage abstraction layer

## Storage Schema

```javascript
// Chrome storage structure
{
  prompts: [
    {
      id: string,
      title: string, 
      content: string,
      categoryId: string,
      created: timestamp,
      lastUsed: timestamp,
      useCount: number
    }
  ],
  categories: [
    {
      id: string,
      name: string, 
      created: timestamp
    }
  ],
  settings: {
    theme: 'auto' | 'light' | 'dark',
    // other settings
  }
}
```