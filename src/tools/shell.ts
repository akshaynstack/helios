/**
 * Shell & Search Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, path, safeExec } from './utils.js';
import { config } from '../config.js';

export const tools: Tool[] = [
    { name: 'run_command', description: 'Execute a shell command', parameters: { type: 'object', properties: { command: { type: 'string', description: 'Command to execute' }, cwd: { type: 'string', description: 'Working directory' } }, required: ['command'] } },
    { name: 'search_files', description: 'Search for text pattern across files', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Text to search' }, path: { type: 'string', description: 'Directory to search' }, file_pattern: { type: 'string', description: 'File glob (e.g., *.ts)' } }, required: ['pattern'] } },
    { name: 'find_files', description: 'Find files by name pattern', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Filename pattern' }, path: { type: 'string', description: 'Search directory' } }, required: ['pattern'] } },
    { name: 'find_and_replace_all', description: 'Find and replace text across multiple files', parameters: { type: 'object', properties: { search: { type: 'string', description: 'Text to find' }, replace: { type: 'string', description: 'Replacement text' }, path: { type: 'string', description: 'Directory to search' }, file_pattern: { type: 'string', description: 'File glob' } }, required: ['search', 'replace'] } },
    { name: 'semantic_search', description: 'Blazing fast semantic search (use natural language)', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Natural language search query' }, path: { type: 'string', description: 'Directory to search (default: .)' } }, required: ['query'] } }
];

function findAndReplaceAll(search: string, replace: string, searchPath: string = '.', filePattern: string = '*'): string {
    let count = 0;
    const resolvedPath = path.resolve(searchPath);
    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
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
    walk(resolvedPath);
    return `✓ Replaced in ${count} files`;
}

function nativeSearch(pattern: string, searchPath: string = '.', filePattern: string = '*'): string {
    const results: string[] = [];
    const root = path.resolve(searchPath);
    if (!fs.existsSync(root)) return `Error: Path does not exist: ${searchPath}`;

    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    walk(fullPath);
                } else if (item.match(new RegExp(filePattern.replace('*', '.*')))) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const lines = content.split('\n');
                        lines.forEach((line, idx) => {
                            if (line.includes(pattern)) {
                                results.push(`${path.relative(root, fullPath)}:${idx + 1}:${line.trim()}`);
                            }
                        });
                    } catch { }
                }

                if (results.length > 50) return; // Limit results
            }
        } catch { }
    };

    walk(root);
    return results.slice(0, 50).join('\n') || 'No matches found';
}

export const handlers: Record<string, ToolHandler> = {
    run_command: (args) => safeExec(args.command, args.cwd),
    search_files: (args) => {
        if (config.get('USE_RIPGREP')) {
            try {
                // Check if rg is available
                const rgCheck = safeExec('rg --version');
                if (!rgCheck.includes('Error')) {
                    const rgCmd = `rg -n "${args.pattern}" "${args.path || '.'}" --heading --color never -g "${args.file_pattern || '*'}" --max-count 50`;
                    return safeExec(rgCmd, args.cwd);
                }
            } catch { }
        }
        return nativeSearch(args.pattern, args.path, args.file_pattern);
    },
    find_files: (args) => {
        if (config.get('USE_FD')) {
            try {
                // Check if fd is available
                const fdCheck = safeExec('fd --version');
                if (!fdCheck.includes('Error')) {
                    const fdCmd = `fd "${args.pattern}" "${args.path || '.'}" --color never --max-results 50`;
                    return safeExec(fdCmd, args.cwd);
                }
            } catch { }
        }
        const results: string[] = [];
        const walk = (dir: string) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    if (file.startsWith('.') || file === 'node_modules') continue; // Keep original ignore logic
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        walk(fullPath);
                    } else if (file.includes(args.pattern)) { // Use includes as per snippet
                        results.push(fullPath);
                    }
                }
            } catch { } // Keep original try/catch
        };
        walk(args.path || '.');
        return results.slice(0, 50).join('\n') || 'No files found';
    },
    find_and_replace_all: (args) => findAndReplaceAll(args.search, args.replace, args.path, args.file_pattern),
    semantic_search: (args) => {
        const apiKey = config.get('MXBAI_API_KEY');
        // Set env var for mgrep
        if (apiKey) process.env.MXBAI_API_KEY = apiKey;
        return safeExec(`mgrep "${args.query}" ${args.path || '.'} --json`, undefined);
    }
};
