/**
 * Utility Tools - UUID, Hash, Base64, etc.
 */
import type { Tool, ToolHandler } from './types.js';
import { fs, path, readFile } from './utils.js';
import * as crypto from 'crypto';

export const tools: Tool[] = [
    { name: 'uuid_generate', description: 'Generate UUID', parameters: { type: 'object', properties: { count: { type: 'string', description: 'Number of UUIDs' } }, required: [] } },
    { name: 'hash_text', description: 'Hash text (md5, sha1, sha256)', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Text to hash' }, algorithm: { type: 'string', description: 'Algorithm' } }, required: ['text'] } },
    { name: 'base64_encode', description: 'Encode to base64', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Text' } }, required: ['text'] } },
    { name: 'base64_decode', description: 'Decode base64', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Base64' } }, required: ['text'] } },
    { name: 'timestamp', description: 'Get/convert timestamp', parameters: { type: 'object', properties: { input: { type: 'string', description: 'Input timestamp' } }, required: [] } },
    { name: 'regex_test', description: 'Test regex pattern', parameters: { type: 'object', properties: { pattern: { type: 'string', description: 'Pattern' }, text: { type: 'string', description: 'Text' } }, required: ['pattern', 'text'] } },
    { name: 'calc', description: 'Evaluate math expression', parameters: { type: 'object', properties: { expression: { type: 'string', description: 'Expression' } }, required: ['expression'] } },
    { name: 'json_format', description: 'Format JSON file', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path' } }, required: ['path'] } }
];

export const handlers: Record<string, ToolHandler> = {
    uuid_generate: (args) => {
        const count = parseInt(args.count) || 1;
        return Array(count).fill(0).map(() =>
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            })
        ).join('\n');
    },
    hash_text: (args) => crypto.createHash(args.algorithm || 'sha256').update(args.text).digest('hex'),
    base64_encode: (args) => Buffer.from(args.text).toString('base64'),
    base64_decode: (args) => Buffer.from(args.text, 'base64').toString('utf-8'),
    timestamp: (args) => {
        if (args.input) {
            const ts = parseInt(args.input);
            return ts > 1e12 ? new Date(ts).toISOString() : new Date(ts * 1000).toISOString();
        }
        return `Unix: ${Math.floor(Date.now() / 1000)}\nISO: ${new Date().toISOString()}`;
    },
    regex_test: (args) => {
        try {
            const matches = args.text.match(new RegExp(args.pattern, 'g'));
            return matches ? `Matches: ${matches.join(', ')}` : 'No matches';
        } catch (e: any) { return `Error: ${e.message}`; }
    },
    calc: (args) => {
        try {
            const expr = args.expression.replace(/sqrt/g, 'Math.sqrt').replace(/pow/g, 'Math.pow');
            return String(Function(`"use strict"; return (${expr})`)());
        } catch { return 'Invalid expression'; }
    },
    json_format: (args) => {
        try {
            const raw = fs.readFileSync(path.resolve(args.path), 'utf-8');
            const json = JSON.parse(raw);
            fs.writeFileSync(path.resolve(args.path), JSON.stringify(json, null, 2));
            return `✓ Formatted ${args.path}`;
        } catch (e: any) { return `Error: ${e.message}`; }
    }
};
