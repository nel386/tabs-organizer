# Branch Tabs - VS Code Extension

Save and restore opened tabs automatically per Git branch. Never lose your context when switching between branches.

## Features

### 🔄 Automatic Tab Management
- **Auto-save**: Tabs are automatically saved when you switch branches
- **Auto-restore**: Previously opened tabs are restored when returning to a branch
- **Smart detection**: Works seamlessly with Git branch changes

### 📊 Status Bar Integration
- See current branch and number of saved tabs at a glance
- Quick access menu with one click
- Real-time updates

### 🎯 Manual Controls
- Save tabs manually for the current branch
- Restore tabs on demand
- Preview saved tabs without opening them
- Load tabs from another branch without switching

### ⚙️ Customizable
- Enable/disable auto-save and auto-restore
- Configure auto-save delay
- Show/hide notifications
- All configurable via VS Code settings

## Usage

### Status Bar (Recommended)
Click on the status bar item showing your branch name (e.g., `📂 main (12 tabs)`) to access:
- 💾 Save Current Tabs
- 📂 Restore Tabs
- 👁️ Preview Saved Tabs
- 🔄 Load Tabs from Another Branch
- ⚙️ Settings

### Context Menu
Right-click on any tab → **Load Tabs from Another Branch...**

### Command Palette
- `Branch Tabs: Save Current Tabs` - Manually save tabs
- `Branch Tabs: Restore Tabs for Current Branch` - Manually restore tabs
- `Branch Tabs: Show Menu` - Open quick menu

## Requirements

- VS Code 1.108.1 or higher
- Git repository (extension activates when Git is available)

## Extension Settings

This extension contributes the following settings:

* `branchTabs.autoRestore`: Enable/disable automatic tab restoration when switching branches (default: `true`)
* `branchTabs.autoSave`: Enable/disable automatic tab saving when tabs change (default: `true`)
* `branchTabs.showNotifications`: Show/hide notification messages (default: `true`)
* `branchTabs.autoSaveDelay`: Delay in milliseconds before auto-saving tabs (default: `2000`)

## How It Works

1. **Branch Detection**: Monitors Git branch changes using VS Code's Git extension API
2. **Storage**: Tabs are saved per branch in VS Code's workspace state (local to each project)
3. **Auto-save**: When tabs change, they're saved after a configurable delay (debounced)
4. **Restore**: When switching branches, tabs from the target branch are automatically restored

## Architecture

Built with clean architecture principles:

src/
├── services/ # Business logic
│ ├── GitService # Git API integration
│ ├── StorageService # Persistence layer
│ ├── TabsService # Tab management
│ ├── ConfigService # Configuration
│ └── Logger # Logging utility
├── ui/ # User interface
│ ├── StatusBarManager
│ └── CommandHandler
└── types/ # TypeScript interfaces


## Known Limitations

- Tabs are saved per workspace (not globally)
- Only text editor tabs are saved (not webviews, terminals, etc.)
- Tab order may vary slightly on restore

## Contributing

This is a portfolio project. Feedback and suggestions are welcome!

## Release Notes

### 0.0.1 (Initial Release)
- Automatic tab save/restore per Git branch
- Status bar integration
- Load tabs from other branches
- Configurable behavior
- Clean modular architecture

## License

MIT

---

**Enjoy seamless branch switching!** 🚀
