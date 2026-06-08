# Branch Tabs Manager

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/nel386.tabs-organizer?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/nel386.tabs-organizer)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/nel386.tabs-organizer)](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)

**Save and restore open tabs automatically per Git branch.** Switch branches without losing your editor context.

---

## Why?

Every time you switch Git branches you lose your open files. When you switch back you have to remember which tabs you had open, hunt them down, and reopen them one by one. Branch Tabs Manager handles this automatically — save your workspace state per branch and restore it instantly.

## Features

**Automatic**
- Auto-saves your open tabs when they change (debounced)
- Auto-restores tabs when you switch back to a branch
- Detects branch changes through the VS Code Git extension API

**Status bar**
- Shows current branch name and saved tab count at a glance
- Click to open the quick menu with all actions
- Tooltip shows open vs. saved tab counts

**Manual commands**
- Save tabs for the current branch
- Restore tabs for the current branch
- Preview saved tabs without opening them
- Load tabs from another branch (without switching)
- Clear all saved data for this workspace

**Configurable**
| Setting | Default | Description |
|---------|---------|-------------|
| `branchTabs.autoRestore` | `true` | Restore tabs automatically on branch switch |
| `branchTabs.autoSave` | `true` | Save tabs automatically when they change |
| `branchTabs.showNotifications` | `true` | Show notifications for save/restore actions |
| `branchTabs.autoSaveDelay` | `2000` | Debounce delay in ms before auto-saving (500–10000) |

## Getting started

1. Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nel386.tabs-organizer)
2. Open a Git repository in VS Code
3. The extension activates automatically — you'll see the branch name in the status bar

That's it. Open some files, switch branches, and switch back — your tabs will be waiting for you.

## Commands

| Command | Description |
|---------|-------------|
| `Branch Tabs: Save Current Tabs` | Save all unpinned tabs for the current branch |
| `Branch Tabs: Restore Tabs for Current Branch` | Close unpinned tabs and restore saved ones |
| `Branch Tabs: Show Menu` | Open the quick action menu |
| `Load Tabs from Another Branch...` | Add tabs from a different branch to your workspace |
| `Branch Tabs: Clear All Saved Data for This Workspace` | Remove all saved tab data |

You can also right-click a tab and choose **Load Tabs from Another Branch...**, or click the status bar item.

## How it works

1. The extension monitors your current Git branch via the VS Code Git extension API.
2. When tabs change, it debounces and saves the list of open file paths per branch in workspace state.
3. When you switch branches, it saves the outgoing branch's tabs and restores the incoming branch's tabs.
4. Pinned tabs are left untouched — only unpinned tabs are saved and restored.

## Requirements

- VS Code 1.120.0 or higher
- A Git repository in the current workspace

## Known limitations

- Saved state is per-workspace (not shared across different workspace folders).
- Only file-backed text editor tabs are saved (not terminals, output panels, etc.).
- Tab ordering after restore may differ slightly from the original.
- Deleted files are skipped during restore with a warning notification.

## Release notes

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)