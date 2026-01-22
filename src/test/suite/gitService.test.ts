import * as assert from 'assert';
import { GitService } from '../../services/GitService';

suite('GitService Test Suite', () => {
    let gitService: GitService;

    setup(async () => {
        gitService = new GitService();
        await gitService.initialize();
    });

    test('Should initialize Git service', async () => {
        const initialized = await gitService.initialize();
        assert.ok(initialized !== undefined);
    });

    test('Should get current branch', () => {
        const branch = gitService.getCurrentBranch();
        assert.ok(branch === undefined || typeof branch === 'string');
    });

    test('Should get workspace path', () => {
        const path = gitService.getWorkspacePath();
        assert.ok(typeof path === 'string');
    });

    test('Should get recent branches', () => {
        const branches = gitService.getRecentBranches();
        assert.ok(Array.isArray(branches));
    });
});
