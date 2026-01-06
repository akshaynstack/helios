/**
 * Permission System - Prompts user before dangerous operations
 */
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';

// Tools that require user permission
const DANGEROUS_TOOLS = new Set([
    'write_file',
    'edit_file',
    'delete_file',
    'rename_file',
    'create_directory',
    'run_command',
    'git_commit',
    'git_reset',
    'git_rebase',
    'docker_run',
    'vercel_deploy',
    'railway_deploy',
    'fly_deploy',
    'install_package',
    'uninstall_package',
    'prisma_migrate'
]);

// Auto-approve these even if they match dangerous tools
const SAFE_PATTERNS = [
    /^read_/,
    /^list_/,
    /^search_/,
    /^find_/,
    /^git_status$/,
    /^git_log$/,
    /^git_diff$/,
    /^git_branch$/, // listing branches is safe
    /^docker_ps$/,
    /^docker_logs$/
];

export interface PermissionState {
    autoApprove: boolean;
    approvedThisSession: Set<string>;
}

export function createPermissionState(): PermissionState {
    return {
        autoApprove: false,
        approvedThisSession: new Set()
    };
}

function isSafeTool(name: string): boolean {
    return SAFE_PATTERNS.some(pattern => pattern.test(name));
}

function isDangerousTool(name: string): boolean {
    return DANGEROUS_TOOLS.has(name) && !isSafeTool(name);
}

function formatToolAction(name: string, args: Record<string, any>): string {
    switch (name) {
        case 'write_file':
        case 'edit_file':
            return `Write to: ${args.path}`;
        case 'delete_file':
            return `DELETE: ${args.path}`;
        case 'create_directory':
            return `Create folder: ${args.path}`;
        case 'run_command':
            return `Run: ${args.command}`;
        case 'git_commit':
            return `Commit: "${args.message}"`;
        case 'git_reset':
            return `Reset to: ${args.commit} (${args.mode || 'mixed'})`;
        case 'install_package':
            return `Install: ${args.package}`;
        case 'uninstall_package':
            return `Uninstall: ${args.package}`;
        case 'vercel_deploy':
            return `Deploy to Vercel ${args.prod === 'true' ? '(PRODUCTION)' : '(preview)'}`;
        default:
            return `${name}: ${JSON.stringify(args).slice(0, 50)}`;
    }
}

export async function checkPermission(
    name: string,
    args: Record<string, any>,
    state: PermissionState
): Promise<{ approved: boolean; reason?: string }> {
    // Safe tools don't need permission
    if (isSafeTool(name)) {
        return { approved: true };
    }

    // Auto-approve mode
    if (state.autoApprove) {
        return { approved: true };
    }

    // Check if already approved this session for this exact action
    const actionKey = `${name}:${JSON.stringify(args)}`;
    if (state.approvedThisSession.has(actionKey)) {
        return { approved: true };
    }

    // Not a dangerous tool - auto approve
    if (!isDangerousTool(name)) {
        return { approved: true };
    }

    // Prompt user
    const action = formatToolAction(name, args);
    console.log(); // New line for clarity

    const approved = await confirm({
        message: chalk.yellow(`🔐 Allow: ${action}?`),
        default: true
    });

    if (approved) {
        state.approvedThisSession.add(actionKey);
    }

    return {
        approved,
        reason: approved ? undefined : 'User denied permission'
    };
}

export function toggleAutoApprove(state: PermissionState): boolean {
    state.autoApprove = !state.autoApprove;
    return state.autoApprove;
}
