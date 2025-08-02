# PromptNest 🗂️

A modern Chrome extension (Manifest V3) for managing AI prompts with intelligent site detection, organized categories, and seamless one-click insertion across popular AI platforms.

## Features ✨

### Core Functionality
- **🎯 Smart AI Site Detection**: Automatically detects and activates on 5 major AI platforms
- **💫 Floating Icon Interface**: Unobtrusive floating icon appears only on supported AI websites
- **📁 Category Organization**: Create unlimited custom categories to organize your prompts
- **🔍 Advanced Search**: Real-time fuzzy search with highlighting and search history
- **⚡ Instant Insertion**: One-click prompt insertion into any AI chat input field
- **📊 Usage Analytics**: Track prompt usage frequency and last-used timestamps

### User Experience
- **🎨 Multi-Theme Support**: Auto, Light, and Dark themes with system preference detection
- **⌨️ Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Shift + P`: Open PromptNest
  - `Ctrl/Cmd + Shift + F`: Quick search mode
- **💾 Backup & Restore**: Complete JSON export/import functionality
- **🔄 Context Menu Integration**: Right-click selected text to save as prompt
- **📱 Responsive Design**: Optimized for various screen sizes and popup dimensions

### Advanced Features
- **🏗️ Modular Architecture**: Class-based design with under 500 lines per file
- **🔒 Privacy-First**: All data stored locally, no external server communication
- **🚀 Performance Optimized**: Lazy loading, efficient storage, minimal resource usage
- **🛠️ Developer Friendly**: Comprehensive debugging support and error handling

## Supported AI Platforms 🤖

| Platform | URL | Status |
|----------|-----|---------|
| **ChatGPT** | [chat.openai.com](https://chat.openai.com) / [chatgpt.com](https://chatgpt.com) | ✅ Full Support |
| **Claude AI** | [claude.ai](https://claude.ai) | ✅ Full Support |
| **Google Gemini** | [gemini.google.com](https://gemini.google.com) | ✅ Full Support |
| **Microsoft Copilot** | [copilot.microsoft.com](https://copilot.microsoft.com) | ✅ Full Support |
| **DeepSeek Chat** | [chat.deepseek.com](https://chat.deepseek.com) | ✅ Full Support |

## Installation 🚀

### Development Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd PromptNest
   ```

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `PromptNest` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in the Chrome toolbar
   - Click the pin icon next to PromptNest

### Production Installation
*(Coming soon to Chrome Web Store)*

## Usage Guide 📝

### Getting Started

1. **First Launch**: The extension creates default categories (General, Work, Creative) and sample prompts
2. **Navigate to an AI Website**: Visit any supported AI chat website
3. **Find the Floating Icon**: Look for the subtle blue icon in the bottom-right corner
4. **Click to Open**: Click the icon to open the prompt management interface

### Managing Prompts

#### Creating Prompts
1. Click the **"+ Add Prompt"** button
2. Fill in:
   - **Title**: A descriptive name for your prompt
   - **Category**: Select an existing category or create a new one
   - **Content**: The actual prompt text
3. Click **"Save"** to store your prompt

#### Using Prompts
1. Find your prompt using search or category navigation
2. Click the **📝 Use** button next to any prompt
3. The prompt will be automatically inserted into the active input field
4. Usage count is automatically tracked

#### Organizing with Categories
1. Click the **"+"** button next to "Categories" in the sidebar
2. Enter a category name and click **"Save"**
3. Assign prompts to categories when creating or editing them

### Search and Navigation

#### Search Features
- **Real-time Search**: Type in the search bar for instant results
- **Fuzzy Matching**: Finds prompts even with partial or misspelled terms
- **Search History**: Recent searches are saved for quick access
- **Highlighted Results**: Search terms are highlighted in results

#### Keyboard Shortcuts
- **Ctrl/Cmd + K**: Focus search bar
- **Escape**: Clear search
- **Enter**: Add search term to history
- **Arrow Keys**: Navigate between results

### Settings and Customization

#### Theme Options
- **Auto**: Follows your system theme preference
- **Light**: Always use light theme
- **Dark**: Always use dark theme

#### Import/Export
1. **Export**: Click **"📤 Export Prompts"** to download a JSON backup
2. **Import**: Click **"📥 Import Prompts"** and select a backup file
3. **Import Options**: Choose to merge with existing data or replace everything

### Context Menu Features

- **Right-click on selected text** → "Save as PromptNest prompt"
- **Right-click on page** → "Open PromptNest"

## Architecture Overview 🏗️

PromptNest follows a modular, class-based architecture with strict file size limits (500 lines max) to ensure maintainability and performance.

### Core Components

```
PromptNest/
├── manifest.json                    # Extension configuration (Manifest V3)
├── assets/                          # Organized assets directory
│   ├── css/                        # All CSS files
│   │   ├── base.css               # Core styles and layout
│   │   ├── icon.css               # Floating icon styling
│   │   ├── icons.css              # Icon definitions and styles
│   │   ├── popup.css              # Component-specific styles
│   │   ├── sidebar.css            # Sidebar styling
│   │   └── themes.css             # Light/dark theme definitions
│   └── js/                         # All JavaScript files
│       ├── background.js          # Service worker - PromptNestBackground class
│       ├── content.js             # PromptNestFloatingIcon - site detection & icon
│       ├── data-manager.js        # PromptNestDataManager - CRUD operations
│       ├── form-handler.js        # PromptNestFormHandler - form validation
│       ├── import-export.js       # JSON backup/restore
│       ├── popup.js               # PromptNestUI - main coordinator
│       ├── search.js              # Fuzzy search functionality
│       ├── settings.js            # Theme and settings management
│       ├── sidebar-modal-manager.js # SidebarModalManager - CRUD modal management
│       ├── sidebar-original.js    # Original sidebar backup
│       ├── sidebar-utils.js       # SidebarUtils - text insertion & utilities
│       ├── sidebar.js             # PromptNestSidebar - full-screen overlay interface
│       ├── storage.js             # promptNestStorage - Chrome storage API
│       └── utils.js               # Shared utility functions
├── popup/                          # Extension popup interface
│   └── popup.html                  # Main HTML structure
└── icons/                          # Extension icons and assets
    ├── README.md                   # Icon requirements and specifications
    ├── icon-48.png                # Extension icon (48x48)
    └── icon-template.svg           # SVG template for icon creation
```

### Class Hierarchy and Responsibilities

#### Background Script
- **`PromptNestBackground`** (`assets/js/background.js`): Service worker handling extension lifecycle, context menus, keyboard shortcuts, and notifications

#### Content Scripts (AI Website Integration)
- **`PromptNestFloatingIcon`** (`assets/js/content.js`): Detects supported AI sites, injects floating icon, initializes sidebar
- **`PromptNestSidebar`** (`assets/js/sidebar.js`): Full-screen overlay interface for prompt management on AI sites
- **`SidebarUtils`** (`assets/js/sidebar-utils.js`): Text insertion logic, keyboard shortcuts, theme management
- **`SidebarModalManager`** (`assets/js/sidebar-modal-manager.js`): Handles add/edit/delete modals within the sidebar

#### Popup Interface
- **`PromptNestUI`** (`assets/js/popup.js`): Main coordinator class for popup interface
- **`PromptNestDataManager`** (`assets/js/data-manager.js`): Handles all CRUD operations and UI updates
- **`PromptNestFormHandler`** (`assets/js/form-handler.js`): Form validation and submission handling
- **`promptNestStorage`** (`assets/js/storage.js`): Singleton abstraction for Chrome Storage API

### Data Flow Architecture

```
User Action → UI Class → Data Manager → Storage → Chrome Storage API
     ↓              ↓              ↓
UI Update ← Data Processing ← Storage Response
```

1. **Popup Interface**: User interactions → `PromptNestUI` → `PromptNestDataManager` → `promptNestStorage` → Chrome Storage
2. **Content Script**: Floating icon click → `PromptNestSidebar` → Direct Chrome Storage → Text insertion via `SidebarUtils`
3. **Background**: Context menus/shortcuts → `PromptNestBackground` → Storage operations → Notifications

## Technical Implementation 🔧

### Core Technologies
- **📋 Manifest V3**: Latest Chrome extension architecture with enhanced security
- **🟨 Vanilla JavaScript**: Zero external dependencies for optimal performance
- **🎨 Modern CSS**: Flexbox/Grid layouts with CSS custom properties
- **💾 Chrome Storage API**: Local storage with automatic sync across devices
- **🔄 Service Workers**: Background processing with lifecycle management

### Text Insertion System
PromptNest uses intelligent site-specific selectors for reliable text insertion across different AI platforms:

```javascript
const siteSpecificSelectors = {
    'chat.openai.com': ['#prompt-textarea'],
    'chatgpt.com': ['#prompt-textarea'],
    'gemini.google.com': ['.text-input-field_textarea .ql-editor', 'div[role="textbox"]'],
    'claude.ai': ['#chat-input-file-upload-onpage', 'input[placeholder*="ask"]'],
    'copilot.microsoft.com': ['textarea[placeholder*="Copilot"]'],
    'chat.deepseek.com': ['#chat-input']
};
```

**Fallback Mechanism**: Comprehensive fallback selectors ensure compatibility with site updates and new AI platforms.

### Data Storage Schema
```javascript
{
  prompts: [{
    id: string,           // Unique identifier
    title: string,        // User-defined prompt title
    content: string,      // Actual prompt text
    categoryId: string,   // Associated category ID
    created: timestamp,   // Creation date
    lastUsed: timestamp,  // Last usage tracking
    useCount: number,     // Usage frequency
    source?: {            // Optional source tracking
      url: string,
      title: string,
      savedAt: timestamp
    }
  }],
  categories: [{
    id: string,           // Unique identifier
    name: string,         // Category name
    created: timestamp    // Creation date
  }],
  settings: {
    theme: 'auto' | 'light' | 'dark',
    autoBackup: boolean,
    showUsageStats: boolean,
    defaultCategory: string | null
  }
}
```

### Performance Optimizations
- **🚀 Lazy Loading**: Components initialize only when needed
- **🔍 Efficient Search**: Optimized fuzzy search with result caching
- **💨 Minimal DOM**: Virtual scrolling for large prompt lists
- **⚡ Event Delegation**: Single event listeners with event bubbling
- **🗜️ Data Compression**: Compact storage format with automatic cleanup

### Security Features
- **🔐 Content Security Policy**: Strict CSP preventing XSS attacks
- **🎯 Minimal Permissions**: Only essential permissions requested
- **🏠 Local-Only Storage**: No external server communication
- **🛡️ Input Sanitization**: All user inputs sanitized and validated
- **🔒 Secure Contexts**: HTTPS-only operation on supported sites

### Browser Compatibility
| Browser | Version | Support Status |
|---------|---------|----------------|
| **Chrome** | 88+ | ✅ Full Support |
| **Edge** | 88+ | ✅ Full Support |
| **Firefox** | N/A | ❌ Not Compatible* |
| **Safari** | N/A | ❌ Not Compatible* |

*Chrome-specific APIs (Manifest V3, Chrome Storage) currently prevent cross-browser compatibility.

## Development 👨‍💻

### Prerequisites
- Chrome Browser (version 88+)
- Basic knowledge of HTML, CSS, JavaScript
- Chrome Developer Tools for debugging

### Development Workflow

1. **Make Changes**: Edit files in your local copy
2. **Reload Extension**: Go to `chrome://extensions/` and click the reload button
3. **Test Changes**: Visit an AI website and test functionality
4. **Debug Issues**: Use Chrome Developer Tools console

### Development Workflow
Following the project's established workflow ensures consistent code quality and maintainability:

1. **🎯 Planning**: Write implementation plan to `tasks/todo.md`
2. **✅ User Verification**: Confirm plan with stakeholders before implementation
3. **🔨 Implementation**: Work through todo items, marking completion progress
4. **🧪 Testing**: Verify functionality across all supported AI platforms
5. **📝 Documentation**: Update relevant documentation and code comments
6. **🔍 Review**: Add summary of changes to `tasks/todo.md`

### Code Standards and Guidelines

#### Architecture Principles
- **📏 File Size Limit**: Maximum 500 lines per file
- **🎯 Single Responsibility**: Each class handles one primary concern
- **🔗 Loose Coupling**: Minimal dependencies between modules
- **🏗️ Modular Design**: Features split into focused, reusable components

#### Code Quality Requirements
- **🛡️ Error Handling**: Comprehensive try-catch blocks with logging
- **✅ Input Validation**: All user inputs sanitized and validated
- **🎨 Consistent Styling**: Follow existing CSS patterns and naming conventions
- **📚 Documentation**: Clear comments for complex functionality
- **🧪 Testing**: Manual testing across all supported platforms

### Adding New AI Platform Support

**Step 1: Update Configuration**
```javascript
// manifest.json - Add URL patterns
"content_scripts": [{
  "matches": [
    "*://newplatform.com/*"  // Add new platform
  ]
}],
"host_permissions": [
  "*://newplatform.com/*"    // Add new platform
]
```

**Step 2: Update Site Detection**
```javascript
// assets/js/content.js and assets/js/background.js
const supportedSites = [
  'chat.openai.com',
  'newplatform.com'         // Add new platform
];
```

**Step 3: Add Text Insertion Selectors**
```javascript
// assets/js/content.js and assets/js/sidebar-utils.js
const siteSpecificSelectors = {
  'newplatform.com': ['#input-selector', '.fallback-selector']
};
```

**Step 4: Test Integration**
- Visit new platform and verify floating icon appears
- Test prompt insertion functionality
- Verify search and category features work correctly

### Debugging and Testing

#### Content Script Debugging
```bash
# Open AI website → F12 → Console
# Look for PromptNest-related errors and logs
console.log('PromptNest Debug Info');
```

#### Popup Interface Debugging
```bash
# Right-click extension icon → "Inspect popup"
# Or open popup.html directly during development
```

#### Background Script Debugging
```bash
# Go to chrome://extensions/
# Click "Inspect views: service worker" under PromptNest
```

#### Common Issues and Solutions
| Issue | Cause | Solution |
|-------|-------|----------|
| Floating icon not appearing | Site not in `supportedSites` array | Add site to configuration |
| Prompt insertion fails | Incorrect CSS selectors | Update selectors in both content scripts |
| Storage errors | Insufficient permissions | Check `manifest.json` permissions |
| Theme not applying | CSS loading order | Verify stylesheet load sequence |

## Troubleshooting 🔍

### Common Issues

#### Extension Not Loading
- **Check Developer Mode**: Ensure developer mode is enabled
- **Check File Paths**: Verify all files are in correct locations
- **Check Console**: Look for errors in `chrome://extensions/`

#### Floating Icon Not Appearing
- **Verify Supported Site**: Ensure you're on a supported AI website
- **Check Content Script**: Look for console errors on the page
- **Clear Cache**: Try hard refresh (Ctrl+Shift+R)

#### Prompts Not Inserting
- **Check Input Field**: Ensure there's an active input/textarea on the page
- **Site Updates**: AI websites may change their input selectors
- **Console Errors**: Check browser console for JavaScript errors

#### Data Not Saving
- **Storage Permissions**: Verify extension has storage permissions
- **Storage Quota**: Check if local storage is full
- **Background Script**: Ensure background script is running

### Getting Help

1. **Check Console**: Look for error messages in browser developer tools
2. **Clear Data**: Try clearing extension data and reloading
3. **Reinstall**: Remove and reinstall the extension
4. **Browser Compatibility**: Ensure you're using a supported browser version

## Privacy Policy 🔒

PromptNest is designed with privacy in mind:

- **No Data Collection**: We don't collect any personal information
- **Local Storage Only**: All data stays on your device
- **No External Requests**: No communication with external servers
- **No Analytics**: No usage tracking or analytics
- **Open Source**: Code is transparent and auditable

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap 🛣️

### Version 1.1.0 - Enhanced User Experience
- [ ] **🎨 Prompt Templates**: Variable placeholders with dynamic substitution
- [ ] **📊 Advanced Analytics**: Detailed usage statistics and prompt performance
- [ ] **⌨️ Custom Shortcuts**: User-configurable keyboard shortcuts
- [ ] **📋 Bulk Operations**: Multi-select and batch prompt management
- [ ] **🔖 Tagging System**: Additional organizational layer beyond categories

### Version 1.2.0 - Collaboration Features
- [ ] **👥 Team Sharing**: Share prompt collections with team members
- [ ] **☁️ Cloud Sync**: Optional cloud backup and cross-device synchronization
- [ ] **📤 Advanced Export**: Multiple format support (Markdown, CSV, TXT)
- [ ] **🔗 Prompt Linking**: Create relationships between related prompts
- [ ] **📝 Version History**: Track prompt modifications and rollback changes

### Version 2.0.0 - AI Integration
- [ ] **🤖 Smart Suggestions**: AI-powered prompt recommendations
- [ ] **🔍 Semantic Search**: Context-aware search using embeddings
- [ ] **✨ Auto-categorization**: Intelligent prompt categorization
- [ ] **🎯 Usage Optimization**: Personalized prompt effectiveness insights
- [ ] **🌐 Multi-language**: Prompt translation and localization support

### Platform Expansion
- [ ] **🦊 Firefox Extension**: Cross-browser compatibility with WebExtensions
- [ ] **📱 Mobile Companion**: React Native app for mobile prompt management
- [ ] **🖥️ Desktop App**: Electron-based standalone application
- [ ] **🌐 Web Interface**: Browser-based prompt management portal

### Integration Ecosystem
- [ ] **📚 Notion Integration**: Sync prompts with Notion databases
- [ ] **📝 Obsidian Plugin**: Vault integration for knowledge management
- [ ] **💼 Slack Bot**: Team prompt sharing via Slack workspace
- [ ] **📊 API Access**: RESTful API for third-party integrations
- [ ] **🔗 Zapier Support**: Automation workflows with Zapier connections

## Support & Community 💬

### Getting Help
- **📚 Documentation**: Check this README and `CLAUDE.md` for development guidance
- **🐛 Bug Reports**: Create detailed issue reports with reproduction steps
- **💡 Feature Requests**: Suggest improvements and new functionality
- **💬 Discussions**: Join community discussions about usage and development

### Contributing
We welcome contributions! Here's how you can help:

- **⭐ Star the Repository**: Show your support and help others discover PromptNest
- **🔄 Code Contributions**: Follow our development workflow in `CLAUDE.md`
- **📝 Documentation**: Improve guides, examples, and code comments
- **🧪 Testing**: Report issues and verify fixes across different platforms
- **🎨 Design**: Contribute UI/UX improvements and accessibility enhancements

### Community Guidelines
- **🤝 Be Respectful**: Maintain a welcoming and inclusive environment
- **📋 Follow Templates**: Use issue and PR templates for consistency
- **🔍 Search First**: Check existing issues before creating new ones
- **📚 Document Changes**: Update relevant documentation with code changes

---

<div align="center">

**PromptNest** - *Organize, Search, and Deploy AI Prompts Effortlessly* 🚀

Made with ❤️ for the AI community

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?style=flat-square&logo=google-chrome)](https://chrome.google.com/webstore/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg?style=flat-square)](#)

</div>