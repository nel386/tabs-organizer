import * as vscode from 'vscode';
import { TabInfo } from '../types';

export class StorageService {
  constructor(private context: vscode.ExtensionContext) {}

  private getStorageKey(workspacePath: string, branchName: string): string {
    return `branchTabs:${workspacePath}#${branchName}`;
  }

  async saveTabs(workspacePath: string, branchName: string, tabs: TabInfo[]): Promise<void> {
    const key = this.getStorageKey(workspacePath, branchName);
    await this.context.workspaceState.update(key, tabs);
  }

  async getTabs(workspacePath: string, branchName: string): Promise<TabInfo[]> {
    const key = this.getStorageKey(workspacePath, branchName);
    return this.context.workspaceState.get<TabInfo[]>(key, []);
  }

  async getAllBranchesWithTabs(workspacePath: string): Promise<string[]> {
    const keys = this.context.workspaceState.keys();
    const prefix = `branchTabs:${workspacePath}#`;

    return keys
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
  }

  async clearWorkspaceData(workspacePath: string): Promise<number> {
    const branches = await this.getAllBranchesWithTabs(workspacePath);
    for (const branch of branches) {
      const key = this.getStorageKey(workspacePath, branch);
      await this.context.workspaceState.update(key, undefined);
    }
    return branches.length;
  }
}
