import * as vscode from 'vscode';
import { GitService } from '../services/GitService';
import { StorageService } from '../services/StorageService';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor(
    private gitService: GitService,
    private storageService: StorageService
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'branchTabs.showQuickMenu';
  }

  async update(): Promise<void> {
    const branch = this.gitService.getCurrentBranch();
    
    if (!branch) {
      this.statusBarItem.hide();
      return;
    }

    const workspacePath = this.gitService.getWorkspacePath();
    const savedTabs = await this.storageService.getTabs(workspacePath, branch);
    const tabCount = savedTabs.length;

    this.statusBarItem.text = `$(file-directory) ${branch} (${tabCount} tabs)`;
    this.statusBarItem.tooltip = `Branch Tabs: ${branch}\nClick for options`;
    this.statusBarItem.show();
  }

  show(): void {
    this.statusBarItem.show();
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
