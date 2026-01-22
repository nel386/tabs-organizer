export interface TabInfo {
  filePath: string;
}

export interface BranchTabsState {
  branchName: string;
  tabs: TabInfo[];
  lastSaved?: Date;
}

export interface GitRepository {
  getCurrentBranch(): string | undefined;
  getRecentBranches(): string[];
}
