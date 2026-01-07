/**
 * File Operations Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, path, readFile, writeFile, safeExec } from './utils.js';
import { config } from '../config.js';

export const tools: Tool[] = [
    {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
            type: 'object',
            properties: { path: { type: 'string', description: 'Path to the file' } },
            required: ['path']
        }
    },
    {
        name: 'write_file',
        description: 'Create or overwrite a file with content',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to write' }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'edit_file',
        description: 'Edit a file by replacing specific text (surgical edit)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                search: { type: 'string', description: 'Exact text to find and replace' },
                replace: { type: 'string', description: 'New text to replace with' }
            },
            required: ['path', 'search', 'replace']
        }
    },
    {
        name: 'append_file',
        description: 'Append content to the end of a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to append' }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: {
            type: 'object',
            properties: { path: { type: 'string', description: 'Path to delete' } },
            required: ['path']
        }
    },
    {
        name: 'rename_file',
        description: 'Rename a file or directory',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Current path' },
                to: { type: 'string', description: 'New name/path' }
            },
            required: ['from', 'to']
        }
    },
    {
        name: 'move_file',
        description: 'Move a file or directory to a new location',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Source path' },
                to: { type: 'string', description: 'Destination path' }
            },
            required: ['from', 'to']
        }
    },
    {
        name: 'copy_file',
        description: 'Copy a file to new location',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Source path' },
                to: { type: 'string', description: 'Destination path' }
            },
            required: ['from', 'to']
        }
    },
    {
        name: 'list_directory',
        description: 'List files and directories',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path' },
                recursive: { type: 'string', description: 'List recursively (true/false)' }
            },
            required: []
        }
    },
    {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: {
            type: 'object',
            properties: { path: { type: 'string', description: 'Path to create' } },
            required: ['path']
        }
    },
    {
        name: 'file_diff',
        description: 'Show diff between two files',
        parameters: {
            type: 'object',
            properties: {
                file1: { type: 'string', description: 'First file' },
                file2: { type: 'string', description: 'Second file' }
            },
            required: ['file1', 'file2']
        }
    },
    {
        name: 'file_stats',
        description: 'Get file statistics (size, lines, modified)',
        parameters: {
            type: 'object',
            properties: { path: { type: 'string', description: 'File path' } },
            required: ['path']
        }
    },
    {
        name: 'file_tree',
        description: 'Show directory tree structure',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path' },
                depth: { type: 'string', description: 'Max depth (default: 3)' }
            },
            required: []
        }
    }
];

function listDirectory(dirPath: string = '.', recursive: boolean = false): string {
    try {
        const resolvedPath = path.resolve(dirPath);
        if (!fs.existsSync(resolvedPath)) return `Error: Path does not exist: ${dirPath}`;

        const items = fs.readdirSync(resolvedPath);
        if (!recursive) {
            return items.map(item => {
                const fullPath = path.join(resolvedPath, item);
                const stat = fs.statSync(fullPath);
                return `${stat.isDirectory() ? '📁' : '📄'} ${item}`;
            }).join('\n');
        }

        const result: string[] = [];
        const walk = (dir: string, depth: number = 0) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules') continue;
                const fullPath = path.join(dir, item);
                result.push('  '.repeat(depth) + item);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory() && depth < 3) {
                        walk(fullPath, depth + 1);
                    }
                } catch { }
            }
        };
        walk(resolvedPath);
        return result.join('\n');
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function generateNativeTree(dirPath: string = '.', maxDepth: number = 3): string {
    const result: string[] = [];
    const root = path.resolve(dirPath);

    if (!fs.existsSync(root)) return `Error: Path does not exist: ${dirPath}`;

    const walk = (current: string, depth: number) => {
        if (depth > maxDepth) return;

        const items = fs.readdirSync(current);
        items.forEach(item => {
            if (item.startsWith('.') || item === 'node_modules' || item === 'dist') return;

            const fullPath = path.join(current, item);
            const relative = path.relative(root, fullPath);
            const indent = '  '.repeat(depth);

            try {
                const stat = fs.statSync(fullPath);
                result.push(`${indent}${stat.isDirectory() ? '📁' : '📄'} ${item}`);

                if (stat.isDirectory()) {
                    walk(fullPath, depth + 1);
                }
            } catch (e) {
                result.push(`${indent}❌ ${item} (Access Denied)`);
            }
        });
    };

    result.push(`📂 ${path.basename(root) || root}`);
    walk(root, 1);
    return result.slice(0, 50).join('\n') + (result.length > 50 ? '\n... [truncated]' : '');
}

function nativeDiff(file1: string, file2: string): string {
    try {
        const text1 = fs.readFileSync(path.resolve(file1), 'utf-8');
        const text2 = fs.readFileSync(path.resolve(file2), 'utf-8');
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');

        const result: string[] = [];
        const maxLines = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLines; i++) {
            if (lines1[i] !== lines2[i]) {
                if (lines1[i] !== undefined) result.push(`- L${i + 1}: ${lines1[i]}`);
                if (lines2[i] !== undefined) result.push(`+ L${i + 1}: ${lines2[i]}`);
            }
        }

        return result.length > 0 ? result.join('\n') : 'Files are identical';
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

export const handlers: Record<string, ToolHandler> = {
    read_file: (args) => readFile(args.path),
    write_file: (args) => writeFile(args.path, args.content),
    edit_file: (args) => {
        try {
            const content = fs.readFileSync(args.path, 'utf-8');
            if (!content.includes(args.search)) {
                return `Error: Could not find text in ${args.path}`;
            }
            fs.writeFileSync(args.path, content.replace(args.search, args.replace));
            return `✓ Edited ${args.path}`;
        } catch (e: any) { return `Error: ${e.message}`; }
    },
    append_file: (args) => {
        try { fs.appendFileSync(args.path, args.content); return `✓ Appended to ${args.path}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    delete_file: (args) => {
        try { fs.unlinkSync(args.path); return `✓ Deleted ${args.path}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    rename_file: (args) => {
        try { fs.renameSync(args.from, args.to); return `✓ Renamed ${args.from} → ${args.to}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    move_file: (args) => {
        try {
            const fromPath = path.resolve(args.from);
            let toPath = path.resolve(args.to);

            if (!fs.existsSync(fromPath)) {
                return `Error: Source path does not exist: ${args.from}`;
            }

            // If destination is an existing directory, move the source INTO it (like 'mv')
            if (fs.existsSync(toPath) && fs.statSync(toPath).isDirectory()) {
                toPath = path.join(toPath, path.basename(fromPath));
            }

            // Ensure destination parent directory exists
            const destDir = path.dirname(toPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            fs.renameSync(fromPath, toPath);
            return `✓ Moved ${args.from} → ${toPath}`;
        }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    copy_file: (args) => {
        try { fs.copyFileSync(args.from, args.to); return `✓ Copied to ${args.to}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    list_directory: (args) => {
        const targetPath = args.path || '.';

        // Always try native first for reliability on Windows
        try {
            const resolvedPath = path.resolve(targetPath);
            if (fs.existsSync(resolvedPath)) {
                const files = fs.readdirSync(resolvedPath);
                return files.map(f => {
                    try {
                        const stat = fs.statSync(path.join(resolvedPath, f));
                        return `${stat.isDirectory() ? '📁' : '📄'} ${f}`;
                    } catch { return `📄 ${f}`; }
                }).join('\n');
            }
            return `Error: Path does not exist: ${targetPath}`;
        } catch (e: any) {
            return `Error: ${e.message}`;
        }
    },
    create_directory: (args) => {
        try { fs.mkdirSync(args.path, { recursive: true }); return `✓ Created ${args.path}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    file_diff: (args) => nativeDiff(args.file1, args.file2),
    file_stats: (args) => {
        try {
            const stat = fs.statSync(path.resolve(args.path));
            const content = fs.readFileSync(path.resolve(args.path), 'utf-8');
            const lines = content.split('\n').length;
            return `Size: ${stat.size} bytes\nLines: ${lines}\nModified: ${stat.mtime.toISOString()}`;
        } catch (e: any) { return `Error: ${e.message}`; }
    },
    file_tree: (args) => {
        // Use reliable native tree generation
        return generateNativeTree(args.path, parseInt(args.depth) || 3);
    }
};
