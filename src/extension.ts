import * as vscode from 'vscode';
import { GitService } from './services/GitService';
import { StorageService } from './services/StorageService';
import { TabsService } from './services/TabsService';
import { ConfigService } from './services/ConfigService';
import { Logger, LogLevel } from './services/Logger';
import { StatusBarManager } from './ui/StatusBarManager';
import { CommandHandler } from './ui/CommandHandler';

let gitService: GitService;
let storageService: StorageService;
let tabsService: TabsService;
let configService: ConfigService;
let statusBarManager: StatusBarManager;
let commandHandler: CommandHandler;
let autoSaveTimeout: NodeJS.Timeout | undefined;
let autoSaveTabsDisposable: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext) {
  Logger.initialize(LogLevel.INFO);
  Logger.info('Branch Tabs extension activated');

  try {
    gitService = new GitService();
    storageService = new StorageService(context);
    tabsService = new TabsService();
    configService = new ConfigService();

    const gitInitialized = await gitService.initialize();
    if (!gitInitialized) {
      Logger.warn('Git repository not available in current workspace');
      return;
    }

    statusBarManager = new StatusBarManager(gitService, storageService, tabsService);
    commandHandler = new CommandHandler(gitService, storageService, tabsService, configService);

    await statusBarManager.update();
    registerCommands(context);
    setupBranchWatcher(context);
    configureAutoSaveSubscription();

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration('branchTabs')) {
          return;
        }

        configService.refresh();
        configureAutoSaveSubscription();
        Logger.info('Configuration updated');
      })
    );

    context.subscriptions.push(statusBarManager);
    Logger.info('Extension activation completed successfully');
  } catch (error) {
    Logger.error('Failed to activate extension', error);
    vscode.window.showErrorMessage('Branch Tabs: Failed to activate extension');
  }
}

export function deactivate() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTabsDisposable?.dispose();
  Logger.info('Extension deactivated');
  Logger.dispose();
}

function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('branchTabs.saveTabs', async () => {
      await commandHandler.saveTabs();
      await statusBarManager.update();
    }),

    vscode.commands.registerCommand('branchTabs.restoreTabs', async () => {
      await commandHandler.restoreTabs();
      await statusBarManager.update();
    }),

    vscode.commands.registerCommand('branchTabs.showQuickMenu', async () => {
      await commandHandler.showQuickMenu();
      await statusBarManager.update();
    }),

    vscode.commands.registerCommand('branchTabs.loadFromBranch', async () => {
      await commandHandler.loadTabsFromBranch();
      await statusBarManager.update();
    }),

    vscode.commands.registerCommand('branchTabs.clearWorkspaceData', async () => {
      await commandHandler.clearWorkspaceData();
      await statusBarManager.update();
    })
  );
}

function setupBranchWatcher(context: vscode.ExtensionContext): void {
  const disposable = gitService.onBranchChange(async (newBranch, oldBranch) => {
    Logger.info(`Branch changed from ${oldBranch} to ${newBranch}`);

    try {
      await saveTabs(oldBranch);

      if (configService.autoRestore) {
        await restoreTabs(newBranch);
      }

      await statusBarManager.update();
    } catch (error) {
      Logger.error('Error during branch change', error);
      vscode.window.showErrorMessage('Failed to switch tabs between branches');
    }
  });

  context.subscriptions.push(disposable);
}

function scheduleAutoSave(): void {
  if (!configService.autoSave) {
    return;
  }

  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  const delay = configService.autoSaveDelay;
  autoSaveTimeout = setTimeout(async () => {
    if (!configService.autoSave) {
      return;
    }

    const branch = gitService.getCurrentBranch();
    if (branch) {
      await saveTabs(branch);
    }
  }, delay);
}

function configureAutoSaveSubscription(): void {
  autoSaveTabsDisposable?.dispose();
  autoSaveTabsDisposable = undefined;

  if (!configService.autoSave) {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = undefined;
    }

    Logger.info('Auto-save listener disabled');
    return;
  }

  autoSaveTabsDisposable = vscode.window.tabGroups.onDidChangeTabs(async () => {
    scheduleAutoSave();
    await statusBarManager.update();
  });

  Logger.info('Auto-save listener enabled');
}

async function saveTabs(branchName: string): Promise<void> {
  try {
    const workspacePath = gitService.getWorkspacePath();
    const tabs = tabsService.getCurrentOpenTabs();

    await storageService.saveTabs(workspacePath, branchName, tabs);
    Logger.debug(`Saved ${tabs.length} tabs for branch: ${branchName}`);
  } catch (error) {
    Logger.error(`Failed to save tabs for branch ${branchName}`, error);
    throw error;
  }
}

async function restoreTabs(branchName: string): Promise<void> {
  try {
    const workspacePath = gitService.getWorkspacePath();
    const savedTabs = await storageService.getTabs(workspacePath, branchName);

    Logger.debug(`Restoring ${savedTabs.length} tabs for branch: ${branchName}`);

    if (savedTabs.length === 0) {
      if (configService.showNotifications) {
        vscode.window.showInformationMessage(
          `No saved tabs for branch: ${branchName}`
        );
      }
      return;
    }

    await tabsService.openTabs(savedTabs, false);

    if (configService.showNotifications) {
      vscode.window.showInformationMessage(
        `Restored ${savedTabs.length} tabs for branch: ${branchName}`
      );
    }
  } catch (error) {
    Logger.error(`Failed to restore tabs for branch ${branchName}`, error);
    throw error;
  }
}
