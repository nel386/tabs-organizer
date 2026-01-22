import * as vscode from 'vscode';
import { TabInfo } from '../types';

export class TabsService {
  getCurrentOpenTabs(): TabInfo[] {
    return vscode.window.tabGroups.all
      .flatMap(group => group.tabs)
      .filter(tab => tab.input instanceof vscode.TabInputText)
      .map(tab => ({
        filePath: (tab.input as vscode.TabInputText).uri.fsPath
      }));
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
      } catch (err) {
        console.error(`Could not open file: ${tab.filePath}`, err);
      }
    }
  }

  getTabsCount(): number {
    return this.getCurrentOpenTabs().length;
  }
}
