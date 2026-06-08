import * as vscode from 'vscode';
import * as fs from 'fs';
import { Logger } from './Logger';
import { TabInfo } from '../types';

export class TabsService {
  getCurrentOpenTabs(): TabInfo[] {
    return this.getCurrentOpenTabsByPinState(true);
  }

  getCurrentUnpinnedOpenTabs(): TabInfo[] {
    return this.getCurrentOpenTabsByPinState(false);
  }

  private getCurrentOpenTabsByPinState(includePinned: boolean): TabInfo[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspacePaths = workspaceFolders
      ? workspaceFolders.map((f) => f.uri.fsPath.toLowerCase())
      : undefined;

    const seenPaths = new Set<string>();

    return vscode.window.tabGroups.all
      .flatMap(group => group.tabs)
      .filter((tab): tab is vscode.Tab & { input: vscode.TabInputText } => {
        if (!(tab.input instanceof vscode.TabInputText)) {
          return false;
        }

        if (tab.input.uri.scheme !== 'file') {
          return false;
        }

        return includePinned ? true : !tab.isPinned;
      })
      .map((tab) => tab.input.uri.fsPath)
      .filter((filePath) => {
        if (workspacePaths) {
          const normalized = filePath.toLowerCase();
          const isInWorkspace = workspacePaths.some((wp) =>
            normalized.startsWith(wp + (wp.endsWith('\\') || wp.endsWith('/') ? '' : '\\')) ||
            normalized.startsWith(wp + (wp.endsWith('\\') || wp.endsWith('/') ? '' : '/'))
          );
          if (!isInWorkspace) {
            return false;
          }
        }

        const normalizedPath = filePath.toLowerCase();
        if (seenPaths.has(normalizedPath)) {
          return false;
        }

        seenPaths.add(normalizedPath);
        return true;
      })
      .map((filePath) => ({ filePath }));
  }

  async closeAllTabs(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  }

  async closeUnpinnedTabs(): Promise<void> {
    const unpinnedTabs = vscode.window.tabGroups.all
      .flatMap((group) => group.tabs)
      .filter((tab) => !tab.isPinned);

    if (unpinnedTabs.length === 0) {
      return;
    }

    await vscode.window.tabGroups.close(unpinnedTabs, true);
  }

  async openTabs(tabs: TabInfo[], preserveExisting: boolean = false): Promise<{ opened: number; missing: number }> {
    if (!preserveExisting) {
      await this.closeUnpinnedTabs();
    }

    let opened = 0;
    let missing = 0;

    for (const tab of tabs) {
      try {
        if (!fs.existsSync(tab.filePath)) {
          Logger.warn(`File no longer exists, skipping: ${tab.filePath}`);
          missing++;
          continue;
        }

        const doc = await vscode.workspace.openTextDocument(tab.filePath);
        await vscode.window.showTextDocument(doc, {
          preview: false,
          preserveFocus: true
        });
        opened++;
      } catch (error) {
        Logger.warn(`Could not open file: ${tab.filePath}`, error);
        missing++;
      }
    }

    return { opened, missing };
  }

  getTabsCount(): number {
    return this.getCurrentOpenTabs().length;
  }
}