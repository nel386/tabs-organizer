import * as vscode from 'vscode';
import { Logger } from './Logger';
import { TabInfo } from '../types';

export class TabsService {
  getCurrentOpenTabs(): TabInfo[] {
    const uniquePaths = new Set<string>();

    return vscode.window.tabGroups.all
      .flatMap(group => group.tabs)
      .filter((tab): tab is vscode.Tab & { input: vscode.TabInputText } => {
        if (!(tab.input instanceof vscode.TabInputText)) {
          return false;
        }

        return tab.input.uri.scheme === 'file';
      })
      .map((tab) => tab.input.uri.fsPath)
      .filter((filePath) => {
        const normalizedPath = filePath.toLowerCase();
        if (uniquePaths.has(normalizedPath)) {
          return false;
        }

        uniquePaths.add(normalizedPath);
        return true;
      })
      .map((filePath) => ({ filePath }));
  }

  async closeAllTabs(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  }

  async openTabs(tabs: TabInfo[], preserveExisting: boolean = false): Promise<void> {
    if (!preserveExisting) {
      await this.closeAllTabs();
    }

    for (const tab of tabs) {
      try {
        const doc = await vscode.workspace.openTextDocument(tab.filePath);
        await vscode.window.showTextDocument(doc, { 
          preview: false, 
          preserveFocus: true 
        });
      } catch (error) {
        Logger.warn(`Could not open file: ${tab.filePath}`, error);
      }
    }
  }

  getTabsCount(): number {
    return this.getCurrentOpenTabs().length;
  }
}
