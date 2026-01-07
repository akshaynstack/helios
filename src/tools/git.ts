/**
 * Git Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { safeExec } from './utils.js';

export const tools: Tool[] = [
    { name: 'git_status', description: 'Show git status', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'git_diff', description: 'Show git diff', parameters: { type: 'object', properties: { file: { type: 'string', description: 'Specific file (optional)' } }, required: [] } },
    { name: 'git_commit', description: 'Stage all and commit', parameters: { type: 'object', properties: { message: { type: 'string', description: 'Commit message' } }, required: ['message'] } },
    { name: 'git_log', description: 'Show recent commits', parameters: { type: 'object', properties: { count: { type: 'string', description: 'Number of commits' } }, required: [] } },
    { name: 'git_branch', description: 'List or create branches', parameters: { type: 'object', properties: { name: { type: 'string', description: 'New branch name (optional)' } }, required: [] } },
    { name: 'git_stash', description: 'Stash or apply stashed changes', parameters: { type: 'object', properties: { action: { type: 'string', description: 'push, pop, or list' } }, required: [] } },
    { name: 'git_undo', description: 'Undo last commit or discard changes', parameters: { type: 'object', properties: { type: { type: 'string', description: 'commit (soft reset) or changes (discard)' } }, required: ['type'] } },
    { name: 'git_rebase', description: 'Rebase current branch onto another', parameters: { type: 'object', properties: { branch: { type: 'string', description: 'Branch to rebase onto' } }, required: ['branch'] } },
    { name: 'git_cherry_pick', description: 'Cherry-pick a commit', parameters: { type: 'object', properties: { commit: { type: 'string', description: 'Commit hash' } }, required: ['commit'] } },
    { name: 'git_blame', description: 'Show who last modified each line', parameters: { type: 'object', properties: { file: { type: 'string', description: 'File to blame' } }, required: ['file'] } },
    { name: 'git_reset', description: 'Reset to a specific commit', parameters: { type: 'object', properties: { commit: { type: 'string', description: 'Commit to reset to' }, mode: { type: 'string', description: 'soft, mixed, or hard' } }, required: ['commit'] } },
    { name: 'git_tag', description: 'Create or list git tags', parameters: { type: 'object', properties: { name: { type: 'string', description: 'Tag name (empty to list)' }, message: { type: 'string', description: 'Tag message' } }, required: [] } }
];

export const handlers: Record<string, ToolHandler> = {
    git_status: () => safeExec('git status --short'),
    git_diff: (args) => safeExec(args.file ? `git diff "${args.file}"` : 'git diff') || '(no changes)',
    git_commit: (args) => { safeExec('git add -A'); return safeExec(`git commit -m "${args.message}"`); },
    git_log: (args) => safeExec(`git log --oneline -${args.count || 10}`),
    git_branch: (args) => args.name ? safeExec(`git checkout -b "${args.name}"`) : safeExec('git branch -a'),
    git_stash: (args) => {
        if (args.action === 'push') return safeExec('git stash push');
        if (args.action === 'pop') return safeExec('git stash pop');
        return safeExec('git stash list');
    },
    git_undo: (args) => args.type === 'commit' ? safeExec('git reset --soft HEAD~1') : safeExec('git checkout -- .'),
    git_rebase: (args) => safeExec(`git rebase ${args.branch}`),
    git_cherry_pick: (args) => safeExec(`git cherry-pick ${args.commit}`),
    git_blame: (args) => {
        const output = safeExec(`git blame "${args.file}"`);
        return output.split('\n').slice(0, 30).join('\n');
    },
    git_reset: (args) => safeExec(`git reset --${args.mode || 'mixed'} ${args.commit}`),
    git_tag: (args) => args.name ? safeExec(`git tag -a "${args.name}" -m "${args.message || args.name}"`) : safeExec('git tag -l')
};
