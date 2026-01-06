/**
 * File Operations Tools
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, path, readFile, writeFile, safeExec } from './utils.js';

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
        description: 'Rename or move a file',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Current path' },
                to: { type: 'string', description: 'New path' }
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
        const items = fs.readdirSync(dirPath);
        if (!recursive) {
            return items.map(item => {
                const fullPath = path.join(dirPath, item);
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
                    if (fs.statSync(fullPath).isDirectory() && depth < 3) {
                        walk(fullPath, depth + 1);
                    }
                } catch { }
            }
        };
        walk(dirPath);
        return result.join('\n');
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
    copy_file: (args) => {
        try { fs.copyFileSync(args.from, args.to); return `✓ Copied to ${args.to}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    list_directory: (args) => listDirectory(args.path, args.recursive === 'true'),
    create_directory: (args) => {
        try { fs.mkdirSync(args.path, { recursive: true }); return `✓ Created ${args.path}`; }
        catch (e: any) { return `Error: ${e.message}`; }
    },
    file_diff: (args) => safeExec(`diff "${args.file1}" "${args.file2}"`),
    file_stats: (args) => {
        const stat = fs.statSync(args.path);
        const lines = fs.readFileSync(args.path, 'utf-8').split('\n').length;
        return `Size: ${stat.size} bytes\nLines: ${lines}\nModified: ${stat.mtime.toISOString()}`;
    },
    file_tree: (args) => safeExec(`find "${args.path || '.'}" -maxdepth ${args.depth || 3} -print | head -50`)
};
