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

export async function activate(context: vscode.ExtensionContext) {
  // Inicializar logger
  Logger.initialize(LogLevel.INFO);
  Logger.info('Branch Tabs extension activated');

  try {
    // Inicializar servicios
    gitService = new GitService();
    storageService = new StorageService(context);
    tabsService = new TabsService();
    configService = new ConfigService();
    
    // Inicializar Git
    const gitInitialized = await gitService.initialize();
    if (!gitInitialized) {
      Logger.warn('Git extension not available');
      return;
    }

    // Inicializar UI
    statusBarManager = new StatusBarManager(gitService, storageService);
    commandHandler = new CommandHandler(gitService, storageService, tabsService, configService);

    // Actualizar status bar inicial
    await statusBarManager.update();

    // Registrar comandos
    registerCommands(context);

    // Configurar watcher de cambios de rama
    setupBranchWatcher(context);

    // Auto-save con debounce
    if (configService.autoSave) {
      context.subscriptions.push(
        vscode.window.tabGroups.onDidChangeTabs(async () => {
          scheduleAutoSave();
          await statusBarManager.update();
        })
      );
    }

    // Escuchar cambios de configuración
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('branchTabs')) {
          configService.refresh();
          Logger.info('Configuration updated');
        }
      })
    );

    // Agregar status bar a disposables
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
    })
  );
}

function setupBranchWatcher(context: vscode.ExtensionContext): void {
  const disposable = gitService.onBranchChange(async (newBranch, oldBranch) => {
    Logger.info(`Branch changed from ${oldBranch} to ${newBranch}`);
    
    try {
      // Guardar tabs de la rama anterior
      await saveTabs(oldBranch);
      
      // Restaurar tabs de la nueva rama si está habilitado
      if (configService.autoRestore) {
        await restoreTabs(newBranch);
      }
      
      // Actualizar status bar
      await statusBarManager.update();
    } catch (error) {
      Logger.error('Error during branch change', error);
      vscode.window.showErrorMessage('Failed to switch tabs between branches');
    }
  });

  context.subscriptions.push(disposable);
}

function scheduleAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  const delay = configService.autoSaveDelay;
  
  autoSaveTimeout = setTimeout(async () => {
    const branch = gitService.getCurrentBranch();
    if (branch) {
      await saveTabs(branch);
    }
  }, delay);
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
      await tabsService.closeAllTabs();
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
