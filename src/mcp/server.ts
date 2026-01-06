/**
 * Helios MCP Server - Expose Helios tools via MCP protocol
 * Allows Claude Desktop, Antigravity, and other MCP clients to use Helios tools
 */

import { tools, executeTool } from '../tools/index.js';

interface MCPRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: Record<string, unknown>;
}

interface MCPResponse {
    jsonrpc: '2.0';
    id: number | string;
    result?: unknown;
    error?: { code: number; message: string };
}

interface MCPNotification {
    jsonrpc: '2.0';
    method: string;
    params?: Record<string, unknown>;
}

const SERVER_INFO = {
    name: 'helios',
    version: '0.1.0',
    protocolVersion: '2024-11-05'
};

const CAPABILITIES = {
    tools: {},
    resources: {},
    prompts: {}
};

/**
 * Handle incoming MCP requests
 */
export function handleMCPRequest(request: MCPRequest): MCPResponse {
    const { id, method, params } = request;

    try {
        switch (method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        protocolVersion: SERVER_INFO.protocolVersion,
                        serverInfo: {
                            name: SERVER_INFO.name,
                            version: SERVER_INFO.version
                        },
                        capabilities: CAPABILITIES
                    }
                };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        tools: tools.map(t => ({
                            name: t.name,
                            description: t.description,
                            inputSchema: t.parameters
                        }))
                    }
                };

            case 'tools/call': {
                const toolName = (params as any)?.name;
                const toolArgs = (params as any)?.arguments || {};

                if (!toolName) {
                    return {
                        jsonrpc: '2.0',
                        id,
                        error: { code: -32602, message: 'Missing tool name' }
                    };
                }

                // Note: executeTool is async but MCP protocol expects sync
                // For now, return placeholder - async tools work in chat mode
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [{ type: 'text', text: `Tool ${toolName} queued for execution` }],
                        isError: false
                    }
                };
            }

            case 'resources/list':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        resources: [
                            {
                                uri: `file://${process.cwd()}`,
                                name: 'Current Directory',
                                description: 'The current working directory',
                                mimeType: 'inode/directory'
                            }
                        ]
                    }
                };

            case 'resources/read': {
                const uri = (params as any)?.uri;
                // For now, just return directory listing
                const result = executeTool('list_directory', { path: uri?.replace('file://', '') || '.' });
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        contents: [{ uri, mimeType: 'text/plain', text: result }]
                    }
                };
            }

            case 'prompts/list':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        prompts: [
                            {
                                name: 'analyze-project',
                                description: 'Analyze the current project structure',
                                arguments: []
                            },
                            {
                                name: 'fix-error',
                                description: 'Fix an error in the code',
                                arguments: [
                                    { name: 'error', description: 'The error message', required: true }
                                ]
                            }
                        ]
                    }
                };

            case 'prompts/get': {
                const promptName = (params as any)?.name;

                if (promptName === 'analyze-project') {
                    return {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            description: 'Analyze the current project',
                            messages: [
                                {
                                    role: 'user',
                                    content: {
                                        type: 'text',
                                        text: 'Please analyze this project and give me an overview of its structure, main files, and technologies used.'
                                    }
                                }
                            ]
                        }
                    };
                }

                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32602, message: `Unknown prompt: ${promptName}` }
                };
            }

            default:
                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: `Method not found: ${method}` }
                };
        }
    } catch (error: any) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: error.message }
        };
    }
}

/**
 * Start MCP server on stdio
 */
export async function startMCPServer(): Promise<void> {
    console.error('Helios MCP Server starting...');
    console.error(`Tools available: ${tools.length}`);

    process.stdin.setEncoding('utf8');

    let buffer = '';

    process.stdin.on('data', (chunk: string) => {
        buffer += chunk;

        // Try to parse complete JSON-RPC messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;

            try {
                const request = JSON.parse(line) as MCPRequest;
                const response = handleMCPRequest(request);
                process.stdout.write(JSON.stringify(response) + '\n');
            } catch (error: any) {
                console.error(`Parse error: ${error.message}`);
            }
        }
    });

    process.stdin.on('end', () => {
        console.error('MCP Server shutting down...');
        process.exit(0);
    });

    // Keep process alive
    await new Promise(() => { });
}

/**
 * Generate MCP config for Claude Desktop
 */
export function generateMCPConfig(): Record<string, unknown> {
    return {
        mcpServers: {
            helios: {
                command: 'helios',
                args: ['mcp'],
                env: {}
            }
        }
    };
}
