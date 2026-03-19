import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from './Logger';

interface GitRef {
  type: number;
  name?: string;
}

interface GitState {
  HEAD?: { name?: string };
  refs?: GitRef[];
  onDidChange(listener: () => void): vscode.Disposable;
}

interface GitRepository {
  rootUri: vscode.Uri;
  state: GitState;
  getRefs?(): Promise<GitRef[]>;
}

interface GitApi {
  repositories: GitRepository[];
  onDidOpenRepository(listener: (repository: GitRepository) => void): vscode.Disposable;
}

interface GitExtensionExports {
  getAPI(version: 1): GitApi;
}

const BRANCH_REF_TYPE = 0;
const REPO_DISCOVERY_TIMEOUT_MS = 5000;

export class GitService {
  private gitApi: GitApi | undefined;
  private currentRepository: GitRepository | undefined;

  async initialize(): Promise<boolean> {
    const gitExtension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git')?.exports;
    this.gitApi = gitExtension?.getAPI(1);

    if (!this.gitApi) {
      return false;
    }

    if (this.gitApi.repositories.length === 0) {
      const discoveredRepository = await this.waitForRepository();
      if (!discoveredRepository) {
        Logger.warn('No Git repository detected within startup timeout');
        return false;
      }

      this.currentRepository = this.selectRepository(this.gitApi.repositories) ?? discoveredRepository;
    } else {
      this.currentRepository = this.selectRepository(this.gitApi.repositories);
    }

    return Boolean(this.currentRepository);
  }

  getCurrentBranch(): string | undefined {
    try {
      return this.currentRepository?.state.HEAD?.name;
    } catch (error) {
      Logger.error('Failed to get current branch', error);
      return undefined;
    }
  }

  async getRecentBranches(): Promise<string[]> {
    try {
      if (!this.currentRepository) {
        return [];
      }

      const refs = await this.getRepositoryRefs();
      const currentBranch = this.getCurrentBranch();

      return refs
        .filter((ref) => ref.type === BRANCH_REF_TYPE)
        .map((ref) => ref.name)
        .filter((name): name is string => Boolean(name) && name !== currentBranch)
        .slice(0, 10);
    } catch (error) {
      Logger.error('Failed to get recent branches', error);
      return [];
    }
  }

  onBranchChange(
    callback: (newBranch: string, oldBranch: string) => void | Promise<void>
  ): vscode.Disposable {
    if (!this.currentRepository) {
      throw new Error('Git repository not initialized');
    }

    let previousBranch = this.getCurrentBranch();

    return this.currentRepository.state.onDidChange(() => {
      const newBranch = this.getCurrentBranch();

      if (newBranch && previousBranch && newBranch !== previousBranch) {
        void callback(newBranch, previousBranch);
        previousBranch = newBranch;
      } else if (newBranch) {
        previousBranch = newBranch;
      }
    });
  }

  getWorkspacePath(): string {
    return this.currentRepository?.rootUri.fsPath
      ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      ?? 'default';
  }

  private async waitForRepository(): Promise<GitRepository | undefined> {
    const gitApi = this.gitApi;
    if (!gitApi) {
      return undefined;
    }

    return new Promise<GitRepository | undefined>((resolve) => {
      const disposable = gitApi.onDidOpenRepository((repository) => {
        clearTimeout(timeoutHandle);
        disposable.dispose();
        resolve(repository);
      });

      const timeoutHandle = setTimeout(() => {
        disposable?.dispose();
        resolve(undefined);
      }, REPO_DISCOVERY_TIMEOUT_MS);
    });
  }

  private selectRepository(repositories: GitRepository[]): GitRepository | undefined {
    if (repositories.length === 0) {
      return undefined;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      return repositories[0];
    }

    return repositories.find((repository) =>
      this.isPathInsideRepository(workspaceFolder, repository.rootUri.fsPath)
    ) ?? repositories[0];
  }

  private async getRepositoryRefs(): Promise<GitRef[]> {
    if (!this.currentRepository) {
      return [];
    }

    if (typeof this.currentRepository.getRefs === 'function') {
      return this.currentRepository.getRefs();
    }

    return this.currentRepository.state.refs ?? [];
  }

  private isPathInsideRepository(candidatePath: string, repositoryRoot: string): boolean {
    const relativePath = path.relative(repositoryRoot, candidatePath);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  }
}
