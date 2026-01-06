/**
 * Shell & Search Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, path, safeExec } from './utils.js';

export const tools: Tool[] = [
    { name: 'run_command', description: 'Execute a shell command', parameters: { type: 'object', properties: { command: { type: 'string', description: 'Command to execute' }, cwd: { type: 'string', description: 'Working directory' } }, required: ['command'] } },
    { name: 'search_files', description: 'Search for text pattern across files', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Text to search' }, path: { type: 'string', description: 'Directory to search' }, file_pattern: { type: 'string', description: 'File glob (e.g., *.ts)' } }, required: ['pattern'] } },
    { name: 'find_files', description: 'Find files by name pattern', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Filename pattern' }, path: { type: 'string', description: 'Search directory' } }, required: ['pattern'] } },
    { name: 'find_and_replace_all', description: 'Find and replace text across multiple files', parameters: { type: 'object', properties: { search: { type: 'string', description: 'Text to find' }, replace: { type: 'string', description: 'Replacement text' }, path: { type: 'string', description: 'Directory to search' }, file_pattern: { type: 'string', description: 'File glob' } }, required: ['search', 'replace'] } }
];

function findAndReplaceAll(search: string, replace: string, searchPath: string = '.', filePattern: string = '*'): string {
    let count = 0;
    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) walk(fullPath);
                else if (item.match(new RegExp(filePattern.replace('*', '.*')))) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        if (content.includes(search)) {
                            fs.writeFileSync(fullPath, content.split(search).join(replace));
                            count++;
                        }
                    } catch { }
                }
            }
        } catch { }
    };
    walk(searchPath);
    return `✓ Replaced in ${count} files`;
}

export const handlers: Record<string, ToolHandler> = {
    run_command: (args) => safeExec(args.command, args.cwd),
    search_files: (args) => safeExec(`grep -rn "${args.pattern}" "${args.path || '.'}" --include="${args.file_pattern || '*'}" 2>/dev/null | head -30`) || 'No matches',
    find_files: (args) => {
        const results: string[] = [];
        const walk = (dir: string) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules') continue;
                    const fullPath = path.join(dir, item);
                    if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
                    else if (item.match(new RegExp(args.pattern.replace('*', '.*')))) results.push(fullPath);
                }
            } catch { }
        };
        walk(args.path || '.');
        return results.slice(0, 50).join('\n') || 'No files found';
    },
    find_and_replace_all: (args) => findAndReplaceAll(args.search, args.replace, args.path, args.file_pattern)
};
