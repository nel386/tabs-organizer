import * as vscode from 'vscode';

let currentBranch: string | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Branch Tabs extension activated');

  // Comandos manuales (por si acaso)
  const saveTabs = vscode.commands.registerCommand('branchTabs.saveTabs', async () => {
    await saveCurrentTabs(context);
  });

  const restoreTabs = vscode.commands.registerCommand('branchTabs.restoreTabs', async () => {
    await restoreTabsForBranch(context);
  });

  context.subscriptions.push(saveTabs, restoreTabs);

  // Inicializar detección automática de cambio de rama
  initializeGitBranchWatcher(context);
}

export function deactivate() {}

async function initializeGitBranchWatcher(context: vscode.ExtensionContext): Promise<void> {
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
  const api = gitExtension?.getAPI(1);

  if (!api) {
    console.log('Git extension not available');
    return;
  }

  // Esperar a que haya repositorios disponibles
  if (api.repositories.length === 0) {
    const disposable = api.onDidOpenRepository(async () => {
      await setupRepositoryWatcher(context, api);
      disposable.dispose();
    });
    context.subscriptions.push(disposable);
  } else {
    await setupRepositoryWatcher(context, api);
  }
}

async function setupRepositoryWatcher(context: vscode.ExtensionContext, api: any): Promise<void> {
  if (api.repositories.length === 0) return;

  const repo = api.repositories[0];
  
  // Guardar rama inicial
  currentBranch = repo.state.HEAD?.name;
  console.log(`Initial branch: ${currentBranch}`);

  // Escuchar cambios en el estado del repositorio
  const disposable = repo.state.onDidChange(async () => {
    const newBranch = repo.state.HEAD?.name;

    // Detectar cambio de rama
    if (newBranch && currentBranch && newBranch !== currentBranch) {
      console.log(`Branch changed from ${currentBranch} to ${newBranch}`);

      // Guardar tabs de la rama anterior
      await saveTabsForBranch(context, currentBranch);

      // Restaurar tabs de la nueva rama
      await restoreTabsForBranch(context, newBranch);

      // Actualizar rama actual
      currentBranch = newBranch;
    } else if (newBranch && !currentBranch) {
      // Primera vez que detectamos una rama
      currentBranch = newBranch;
    }
  });

  context.subscriptions.push(disposable);
}

async function saveCurrentTabs(context: vscode.ExtensionContext): Promise<void> {
  const branch = await getCurrentGitBranch();
  if (!branch) {
    vscode.window.showWarningMessage('No Git branch detected');
    return;
  }

  await saveTabsForBranch(context, branch);
  vscode.window.showInformationMessage(`Saved tabs for branch: ${branch}`);
}

async function saveTabsForBranch(context: vscode.ExtensionContext, branch: string): Promise<void> {
  const openTabs = vscode.window.tabGroups.all
    .flatMap(group => group.tabs)
    .filter(tab => tab.input instanceof vscode.TabInputText)
    .map(tab => (tab.input as vscode.TabInputText).uri.fsPath);

  const storageKey = getStorageKey(branch);
  await context.workspaceState.update(storageKey, openTabs);

  console.log(`Saved ${openTabs.length} tabs for branch: ${branch}`);
}

async function restoreTabsForBranch(context: vscode.ExtensionContext, branch?: string): Promise<void> {
  const targetBranch = branch || await getCurrentGitBranch();
  
  if (!targetBranch) {
    vscode.window.showWarningMessage('No Git branch detected');
    return;
  }

  const storageKey = getStorageKey(targetBranch);
  const savedTabs = context.workspaceState.get<string[]>(storageKey, []);

  console.log(`Restoring ${savedTabs.length} tabs for branch: ${targetBranch}`);

  // Cerrar todas las tabs actuales
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  // Abrir tabs guardadas
  for (const filePath of savedTabs) {
    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
    } catch (err) {
      console.error(`Could not open file: ${filePath}`, err);
    }
  }

  if (savedTabs.length > 0) {
    vscode.window.showInformationMessage(`Restored ${savedTabs.length} tabs for branch: ${targetBranch}`);
  }
}

async function getCurrentGitBranch(): Promise<string | undefined> {
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
  const api = gitExtension?.getAPI(1);

  if (!api || api.repositories.length === 0) {
    return undefined;
  }

  const repo = api.repositories[0];
  return repo.state.HEAD?.name;
}

function getStorageKey(branch: string): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'default';
  return `branchTabs:${workspaceFolder}#${branch}`;
}
