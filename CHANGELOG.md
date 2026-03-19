# Changelog

All notable changes to this extension are documented in this file.

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
