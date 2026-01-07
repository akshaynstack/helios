/**
 * NPM & Package Management Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, safeExec } from './utils.js';

export const tools: Tool[] = [
    { name: 'install_package', description: 'Install npm package', parameters: { type: 'object', properties: { package: { type: 'string', description: 'Package name' }, dev: { type: 'string', description: 'Dev dependency (true/false)' } }, required: ['package'] } },
    { name: 'uninstall_package', description: 'Uninstall npm package', parameters: { type: 'object', properties: { package: { type: 'string', description: 'Package name' } }, required: ['package'] } },
    { name: 'list_packages', description: 'List installed packages', parameters: { type: 'object', properties: {}, required: [] } },
    { name: 'run_script', description: 'Run npm script from package.json', parameters: { type: 'object', properties: { script: { type: 'string', description: 'Script name (e.g., dev, build, test)' } }, required: ['script'] } },
    { name: 'npm_init', description: 'Initialize new npm package', parameters: { type: 'object', properties: { name: { type: 'string', description: 'Package name' } }, required: ['name'] } },
    { name: 'audit_packages', description: 'Check for security vulnerabilities', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Project directory' } }, required: [] } },
    { name: 'check_outdated', description: 'Check for outdated packages', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Project directory' } }, required: [] } }
];

export const handlers: Record<string, ToolHandler> = {
    install_package: (args) => safeExec(`npm install ${args.dev === 'true' ? '-D' : ''} ${args.package}`),
    uninstall_package: (args) => safeExec(`npm uninstall ${args.package}`),
    list_packages: () => {
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
            return `Dependencies:\n${Object.entries(pkg.dependencies || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n\nDev:\n${Object.entries(pkg.devDependencies || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;
        } catch { return 'No package.json'; }
    },
    run_script: (args) => safeExec(`npm run ${args.script}`),
    npm_init: (args) => safeExec(`npm init -y && npm pkg set name="${args.name}"`),
    audit_packages: (args) => safeExec('npm audit', args.path),
    check_outdated: (args) => safeExec('npm outdated', args.path)
};
