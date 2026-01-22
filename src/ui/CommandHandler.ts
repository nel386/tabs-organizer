import * as vscode from 'vscode';
import { GitService } from '../services/GitService';
import { StorageService } from '../services/StorageService';
import { TabsService } from '../services/TabsService';
import { ConfigService } from '../services/ConfigService';
import { Logger } from '../services/Logger';

export class CommandHandler {
  constructor(
    private gitService: GitService,
    private storageService: StorageService,
    private tabsService: TabsService,
    private configService: ConfigService
  ) {}

  async showQuickMenu(): Promise<void> {
    const branch = this.gitService.getCurrentBranch();
    if (!branch) {
      vscode.window.showWarningMessage('No Git branch detected');
      return;
    }

    const workspacePath = this.gitService.getWorkspacePath();
    const savedTabs = await this.storageService.getTabs(workspacePath, branch);

    const items: vscode.QuickPickItem[] = [
      {
        label: '$(save) Save Current Tabs',
        description: `Save ${this.tabsService.getTabsCount()} open tabs for ${branch}`,
        detail: 'save'
      },
      {
        label: '$(folder-opened) Restore Tabs',
        description: `Restore ${savedTabs.length} saved tabs for ${branch}`,
        detail: 'restore'
      },
      {
        label: '$(eye) Preview Saved Tabs',
        description: 'View saved tabs without opening',
        detail: 'preview'
      },
      {
        label: '$(git-branch) Load Tabs from Another Branch',
        description: 'Add tabs from another branch to current workspace',
        detail: 'loadFromBranch'
      },
      {
        label: '$(gear) Settings',
        description: 'Configure Branch Tabs behavior',
        detail: 'settings'
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Branch Tabs - ${branch}`
    });

    if (!selected) {return;}

    switch (selected.detail) {
      case 'save':
        await this.saveTabs();
        break;
      case 'restore':
        await this.restoreTabs();
        break;
      case 'preview':
        await this.previewTabs();
        break;
      case 'loadFromBranch':
        await this.loadTabsFromBranch();
        break;
      case 'settings':
        await this.openSettings();
        break;
    }
  }

  async saveTabs(): Promise<void> {
    try {
      const branch = this.gitService.getCurrentBranch();
      if (!branch) {
        vscode.window.showWarningMessage('No Git branch detected');
        return;
      }

      const workspacePath = this.gitService.getWorkspacePath();
      const tabs = this.tabsService.getCurrentOpenTabs();
      
      await this.storageService.saveTabs(workspacePath, branch, tabs);
      
      if (this.configService.showNotifications) {
        vscode.window.showInformationMessage(`✓ Saved ${tabs.length} tabs for ${branch}`);
      }
      
      Logger.info(`Manually saved ${tabs.length} tabs for ${branch}`);
    } catch (error) {
      Logger.error('Failed to save tabs', error);
      vscode.window.showErrorMessage('Failed to save tabs');
    }
  }

  async restoreTabs(): Promise<void> {
    try {
      const branch = this.gitService.getCurrentBranch();
      if (!branch) {
        vscode.window.showWarningMessage('No Git branch detected');
        return;
      }

      const workspacePath = this.gitService.getWorkspacePath();
      const savedTabs = await this.storageService.getTabs(workspacePath, branch);

      if (savedTabs.length === 0) {
        vscode.window.showInformationMessage(`No saved tabs for ${branch}`);
        return;
      }

      await this.tabsService.openTabs(savedTabs, false);
      
      if (this.configService.showNotifications) {
        vscode.window.showInformationMessage(`✓ Restored ${savedTabs.length} tabs`);
      }
      
      Logger.info(`Manually restored ${savedTabs.length} tabs for ${branch}`);
    } catch (error) {
      Logger.error('Failed to restore tabs', error);
      vscode.window.showErrorMessage('Failed to restore tabs');
    }
  }

  async previewTabs(): Promise<void> {
    try {
      const branch = this.gitService.getCurrentBranch();
      if (!branch) {
        vscode.window.showWarningMessage('No Git branch detected');
        return;
      }

      const workspacePath = this.gitService.getWorkspacePath();
      const savedTabs = await this.storageService.getTabs(workspacePath, branch);

      if (savedTabs.length === 0) {
        vscode.window.showInformationMessage(`No saved tabs for ${branch}`);
        return;
      }

      const items = savedTabs.map((tab, index) => {
        const fileName = tab.filePath.split(/[/\\]/).pop() || tab.filePath;
        const relativePath = tab.filePath.replace(workspacePath, '');
        return {
          label: `$(file) ${fileName}`,
          description: relativePath,
          detail: `#${index + 1}`
        };
      });

      await vscode.window.showQuickPick(items, {
        placeHolder: `Saved tabs for ${branch} (${savedTabs.length} files)`,
        canPickMany: false
      });
    } catch (error) {
      Logger.error('Failed to preview tabs', error);
      vscode.window.showErrorMessage('Failed to preview tabs');
    }
  }

  async loadTabsFromBranch(): Promise<void> {
    try {
      const currentBranch = this.gitService.getCurrentBranch();
      if (!currentBranch) {
        vscode.window.showWarningMessage('No Git branch detected');
        return;
      }

      // Obtener ramas recientes
      const recentBranches = this.gitService.getRecentBranches();
      
      // También obtener ramas que tienen tabs guardadas
      const workspacePath = this.gitService.getWorkspacePath();
      const branchesWithTabs = await this.storageService.getAllBranchesWithTabs(workspacePath);

      // Combinar y deduplicar
      const allBranches = Array.from(new Set([...recentBranches, ...branchesWithTabs]));

      if (allBranches.length === 0) {
        vscode.window.showInformationMessage('No other branches available');
        return;
      }

      const items = await Promise.all(
        allBranches.map(async (branch) => {
          const tabs = await this.storageService.getTabs(workspacePath, branch);
          return {
            label: `$(git-branch) ${branch}`,
            description: `${tabs.length} tabs saved`,
            detail: branch
          };
        })
      );

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select branch to load tabs from'
      });

      if (!selected || !selected.detail) {return;}

      const selectedBranch = selected.detail;
      const tabsToLoad = await this.storageService.getTabs(workspacePath, selectedBranch);

      if (tabsToLoad.length === 0) {
        vscode.window.showInformationMessage(`No saved tabs for ${selectedBranch}`);
        return;
      }

      // Abrir tabs SIN cerrar las actuales (preserveExisting = true)
      await this.tabsService.openTabs(tabsToLoad, true);
      
      if (this.configService.showNotifications) {
        vscode.window.showInformationMessage(
          `✓ Added ${tabsToLoad.length} tabs from ${selectedBranch}`
        );
      }
      
      Logger.info(`Loaded ${tabsToLoad.length} tabs from ${selectedBranch} to ${currentBranch}`);
    } catch (error) {
      Logger.error('Failed to load tabs from branch', error);
      vscode.window.showErrorMessage('Failed to load tabs from branch');
    }
  }

  private async openSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'branchTabs');
  }
}
