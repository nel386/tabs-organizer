# Changelog

All notable changes to this extension are documented in this file.

## [0.2.0] - 2026-03-24

### Fixed
- Lowered minimum VS Code engine requirement from `1.110.0` back to `1.85.0`. The bump in `0.1.0` was unnecessary — the extension only uses APIs available since VS Code 1.64–1.67. This was preventing users on slightly older VS Code versions from receiving the update.
- Switching to a branch with no saved tabs no longer silently closes all open tabs. It now shows an informational notification and leaves the current tabs untouched.

### Added
- New command **Branch Tabs: Clear All Saved Data for This Workspace** (`branchTabs.clearWorkspaceData`), also accessible from the quick menu. Useful for resetting corrupted or stale saved state.

### Improved
- Status bar tooltip now shows both the number of open tabs and saved tabs separately (e.g. `4 open · 2 saved`).
- Status bar label clarified to say `saved` instead of the ambiguous `tabs`.

## [0.1.0] - 2026-03-19

### Changed
- Updated minimum VS Code engine to `1.110.0` to match current typings/tooling.
- Improved Git initialization to avoid waiting forever when no repository is available at startup.
- Updated recent branch loading to use the modern Git API when available.
- Updated auto-save subscription so enabling or disabling `branchTabs.autoSave` works immediately without reloading VS Code.
- Improved tab snapshot quality by ignoring non-file tabs and deduplicating file paths.
- Replaced console errors with extension logger output for tab restore failures.
- Cleaned up user-facing messages and refreshed README formatting.
- Reduced VSIX payload by excluding test/build artifacts from package output.

### Internal
- Hardened logger initialization to avoid crashes when used before extension activation.
- Updated tests for async branch retrieval.
- Added GitHub Actions CI (push, pull request, weekly schedule) for lint, typecheck, tests, and runtime audit.

## [0.0.1] - 2026-01-23

### Added
- Initial release.
- Automatic tab save and restore per branch.
- Status bar quick menu and manual commands.
- Load tabs from another branch.
- Configurable behavior for auto-save, auto-restore, notifications, and delay.
