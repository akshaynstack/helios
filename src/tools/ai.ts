/**
 * AI-Assisted Tools (return instructions for LLM)
 */
import type { Tool, ToolHandler } from './types.js';
import { readFile } from './utils.js';

export const tools: Tool[] = [
    { name: 'explain_code', description: 'Explain what code does', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File' } }, required: ['path'] } },
    { name: 'fix_error', description: 'Analyze error and suggest fix', parameters: { type: 'object', properties: { error: { type: 'string', description: 'Error message' }, file: { type: 'string', description: 'Related file' } }, required: ['error'] } },
    { name: 'suggest_improvements', description: 'Suggest code improvements', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File' } }, required: ['path'] } },
    { name: 'add_documentation', description: 'Add JSDoc comments', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File' } }, required: ['path'] } },
    { name: 'convert_code', description: 'Convert code format', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File' }, target: { type: 'string', description: 'Target format' } }, required: ['path', 'target'] } },
    { name: 'generate_test', description: 'Generate test file', parameters: { type: 'object', properties: { source_file: { type: 'string', description: 'Source file' }, framework: { type: 'string', description: 'jest/vitest' } }, required: ['source_file'] } },
    { name: 'generate_readme', description: 'Generate README.md', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Project path' } }, required: [] } }
];

export const handlers: Record<string, ToolHandler> = {
    explain_code: (args) => `[AI TASK] Explain this code:\n\n${readFile(args.path)}`,
    fix_error: (args) => `[AI TASK] Fix this error:\n${args.error}\n\nRelated file:\n${args.file ? readFile(args.file) : 'N/A'}`,
    suggest_improvements: (args) => `[AI TASK] Suggest improvements for:\n\n${readFile(args.path)}`,
    add_documentation: (args) => `[AI TASK] Add JSDoc comments to:\n\n${readFile(args.path)}`,
    convert_code: (args) => `[AI TASK] Convert to ${args.target}:\n\n${readFile(args.path)}`,
    generate_test: (args) => `[AI TASK] Generate tests for:\n\n${readFile(args.source_file)}`,
    generate_readme: (args) => `[AI TASK] Generate README.md for project at: ${args.path || '.'}`
};
