import * as vscode from 'vscode';

export class ConfigService {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('branchTabs');
  }

  refresh(): void {
    this.config = vscode.workspace.getConfiguration('branchTabs');
  }

  get autoRestore(): boolean {
    return this.config.get('autoRestore', true);
  }

  get autoSave(): boolean {
    return this.config.get('autoSave', true);
  }

  get showNotifications(): boolean {
    return this.config.get('showNotifications', true);
  }

  get autoSaveDelay(): number {
    return this.config.get('autoSaveDelay', 2000);
  }
}
