/**
 * Tools Registry - Combines all tool modules
 */
import type { Tool, ToolHandler } from './types.js';

// Import all tool modules
import * as fileTools from './file.js';
import * as gitTools from './git.js';
import * as shellTools from './shell.js';
import * as npmTools from './npm.js';
import * as cloudTools from './cloud.js';
import * as utilsTools from './utils-tools.js';
import * as aiTools from './ai.js';
import * as browserTools from './browser.js';

// Combine all tools
export const tools: Tool[] = [
    ...fileTools.tools,
    ...gitTools.tools,
    ...shellTools.tools,
    ...npmTools.tools,
    ...cloudTools.tools,
    ...utilsTools.tools,
    ...aiTools.tools,
    ...browserTools.tools
];

// Combine all handlers
const allHandlers: Record<string, ToolHandler> = {
    ...fileTools.handlers,
    ...gitTools.handlers,
    ...shellTools.handlers,
    ...npmTools.handlers,
    ...cloudTools.handlers,
    ...utilsTools.handlers,
    ...aiTools.handlers,
    ...browserTools.handlers
};

/**
 * Execute a tool by name (supports async tools)
 */
export async function executeTool(name: string, args: Record<string, any>): Promise<string> {
    const handler = allHandlers[name];
    if (!handler) {
        return `Unknown tool: ${name}. Available: ${Object.keys(allHandlers).slice(0, 10).join(', ')}...`;
    }

    try {
        const result = handler(args);
        // Handle both sync and async handlers
        if (result instanceof Promise) {
            return await result;
        }
        return result;
    } catch (e: any) {
        return `Error executing ${name}: ${e.message}`;
    }
}

// Re-export Tool type
export type { Tool };

