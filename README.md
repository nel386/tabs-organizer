# Branch Tabs Manager - VS Code Extension

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/nel386.tabs-organizer)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/nel386.tabs-organizer)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/nel386.tabs-organizer)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)

Save and restore opened tabs automatically per Git branch. Keep your editor context when switching branches.

## Features

### Automatic tab management
- Auto-save tabs when they change (debounced)
- Auto-restore tabs when switching back to a branch
- Branch-aware behavior through VS Code Git API

### Status bar integration
- Shows current branch and saved tab count
- One-click quick menu for common actions
- Updates live as tabs change

### Manual controls
- Save tabs for current branch
- Restore tabs for current branch
- Preview saved tabs without opening them
- Load tabs from another branch without switching

### Configurable behavior
- Enable or disable auto-save
- Enable or disable auto-restore
- Configure auto-save debounce delay
- Enable or disable notifications

## Usage

### Status bar
Click the status bar item (example: `main (12 tabs)`) to open:
- Save Current Tabs
- Restore Tabs
- Preview Saved Tabs
- Load Tabs from Another Branch
- Settings

### Context menu
Right-click a tab and choose **Load Tabs from Another Branch...**

### Command palette
- `Branch Tabs: Save Current Tabs`
- `Branch Tabs: Restore Tabs for Current Branch`
- `Branch Tabs: Show Menu`

## Requirements

- VS Code 1.108.1 or higher
- Git repository in the current workspace

## Extension settings

- `branchTabs.autoRestore`: restore tabs on branch switch (default `true`)
- `branchTabs.autoSave`: auto-save tabs when they change (default `true`)
- `branchTabs.showNotifications`: show user notifications (default `true`)
- `branchTabs.autoSaveDelay`: debounce delay in milliseconds (default `2000`)

## How it works

1. Monitors current branch via VS Code Git extension API.
2. Saves tabs per branch in workspace state.
3. Auto-saves after tab changes (debounced).
4. Restores tabs when switching back to that branch.

## Project structure

```text
src/
|-- services/    # Git, storage, config, tab services
|-- ui/          # Status bar and command handlers
|-- types/       # Shared interfaces
`-- test/        # Extension and service tests
```

## Known limitations

- State is per-workspace, not global across all projects.
- Only file-backed text tabs are saved and restored.
- Tab ordering can vary slightly after restore.

## Release notes

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
