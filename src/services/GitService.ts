import * as vscode from 'vscode';
import { Logger } from './Logger';

export class GitService {
    private gitApi: any;
    private currentRepository: any;

    async initialize(): Promise<boolean> {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        this.gitApi = gitExtension?.getAPI(1);

        if (!this.gitApi) {
            return false;
        }

        if (this.gitApi.repositories.length === 0) {
            await new Promise<void>((resolve) => {
                const disposable = this.gitApi.onDidOpenRepository(() => {
                    this.currentRepository = this.gitApi.repositories[0];
                    disposable.dispose();
                    resolve();
                });
            });
        } else {
            this.currentRepository = this.gitApi.repositories[0];
        }

        return true;
    }

    getCurrentBranch(): string | undefined {
        try {
            return this.currentRepository?.state.HEAD?.name;
        } catch (error) {
            Logger.error('Failed to get current branch', error);
            return undefined;
        }
    }

    getRecentBranches(): string[] {
        try {
            if (!this.currentRepository) {return [];}

            const refs = this.currentRepository.state.refs || [];
            const currentBranch = this.getCurrentBranch();

            const branches = refs
                .filter((ref: any) => ref.type === 0)
                .map((ref: any) => ref.name)
                .filter((name: string) => name !== currentBranch)
                .slice(0, 10);

            return branches;
        } catch (error) {
            Logger.error('Failed to get recent branches', error);
            return [];
        }
    }


    onBranchChange(callback: (newBranch: string, oldBranch: string) => void): vscode.Disposable {
        if (!this.currentRepository) {
            throw new Error('Git repository not initialized');
        }

        let previousBranch = this.getCurrentBranch();

        return this.currentRepository.state.onDidChange(() => {
            const newBranch = this.getCurrentBranch();

            if (newBranch && previousBranch && newBranch !== previousBranch) {
                callback(newBranch, previousBranch);
                previousBranch = newBranch;
            } else if (newBranch) {
                previousBranch = newBranch;
            }
        });
    }

    getWorkspacePath(): string {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'default';
    }
}
