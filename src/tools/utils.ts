/**
 * Common utilities shared across tool modules
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export function safeExec(cmd: string, cwd?: string): string {
    try {
        return execSync(cmd, {
            encoding: 'utf-8',
            timeout: 30000,
            cwd: cwd || process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    } catch (e: any) {
        return e.stdout || e.stderr || e.message;
    }
}

export function readFile(filepath: string): string {
    try {
        return fs.readFileSync(filepath, 'utf-8');
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

export function writeFile(filepath: string, content: string): string {
    try {
        const absolutePath = path.resolve(filepath);
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, content);
        return `✓ Created ${absolutePath}`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

export { fs, path };
