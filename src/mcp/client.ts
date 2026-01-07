/**
 * Helios MCP Client - Connect to external MCP servers
 * Uses @modelcontextprotocol/sdk for robust Stdio and SSE support
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { getMCPServers } from '../config.js';
import type { Tool } from '../types.js';

interface MCPConnection {
    name: string;
    client: Client;
    transport: Transport;
    status: 'connected' | 'disconnected' | 'error';
    tools: Tool[];
    error?: string;
}

export class MCPClient {
    private connections: Map<string, MCPConnection> = new Map();

    /**
     * Connect to all configured MCP servers + Auto-connect to presets
     */
    async connectAll(): Promise<void> {
        const servers = getMCPServers();
        console.log(`[MCP] Connecting to ${servers.length} servers...`);

        for (const server of servers) {
            try {
                await this.connect(server.name, server.url || '', server.command, server.args);
            } catch (error: any) {
                console.error(`[MCP] Failed to connect to ${server.name}: ${error.message}`);
            }
        }
    }

    /**
     * Connect to a single MCP server (Stdio or SSE)
     */
    async connect(name: string, url: string, command?: string, args?: string[]): Promise<MCPConnection | null> {
        // cleanup existing
        if (this.connections.has(name)) {
            const old = this.connections.get(name);
            try { await old?.client.close(); } catch { }
            this.connections.delete(name);
        }

        let transport: Transport;

        try {
            if (command) {
                // Stdio Transport (e.g. npx -y @21st-dev/magic)
                transport = new StdioClientTransport({
                    command: command,
                    args: args || []
                });
            } else if (url && (url.startsWith('http') || url.startsWith('sse'))) {
                // SSE Transport
                transport = new SSEClientTransport(new URL(url));
            } else {
                throw new Error(`Invalid config for ${name}: must have url or command`);
            }

            const client = new Client(
                {
                    name: "helios-client",
                    version: "1.0.0",
                },
                {
                    capabilities: {
                        // Clients don't provide tools, they consume them
                        roots: { listChanged: false }
                    },
                }
            );

            await client.connect(transport);

            // Fetch tools
            const toolsResult = await client.listTools();
            const tools: Tool[] = toolsResult.tools.map(t => ({
                name: `${name}__${t.name}`,
                description: `[${name}] ${t.description || ''}`,
                parameters: {
                    type: 'object',
                    properties: t.inputSchema?.properties as any || {},
                    required: t.inputSchema?.required || []
                }
            }));

            const connection: MCPConnection = {
                name,
                client,
                transport,
                status: 'connected',
                tools
            };

            this.connections.set(name, connection);
            // console.log(`[MCP] Connected to ${name} (${tools.length} tools)`);
            return connection;

        } catch (error: any) {
            console.error(`[MCP] Error connecting to ${name}:`, error);
            this.connections.set(name, {
                name,
                client: null as any,
                transport: null as any,
                status: 'error',
                tools: [],
                error: error.message
            });
            return null;
        }
    }

    /**
     * Get all tools from all connected servers
     */
    getAllTools(): Tool[] {
        const allTools: Tool[] = [];
        for (const conn of this.connections.values()) {
            if (conn.status === 'connected') {
                allTools.push(...conn.tools);
            }
        }
        return allTools;
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(fullName: string, args: any): Promise<string> {
        const [serverName, ...rest] = fullName.split('__');
        const toolName = rest.join('__');

        const conn = this.connections.get(serverName);
        if (!conn || conn.status !== 'connected') {
            throw new Error(`MCP server ${serverName} is not connected`);
        }

        try {
            const result = await conn.client.callTool({
                name: toolName,
                arguments: args
            }) as any; // Cast to any to avoid strict type issues with content iteration

            // Parse result content
            let output = '';
            if (result.content && Array.isArray(result.content)) {
                for (const item of result.content) {
                    if (item.type === 'text') {
                        output += item.text + '\n';
                    } else {
                        output += `[${item.type} content]\n`;
                    }
                }
            }

            return output || JSON.stringify(result);

        } catch (error: any) {
            throw new Error(`MCP tool call failed: ${error.message}`);
        }
    }

    /**
     * Get tool documentation specifically for "Knowledge Feed"
     */
    getToolDocs(serverName: string): string {
        const conn = this.connections.get(serverName);
        if (!conn || conn.status !== 'connected') return '';

        return conn.tools.map(t =>
            `## ${t.name}\n${t.description}\nArgs: ${JSON.stringify(t.parameters)}`
        ).join('\n\n');
    }
}

export const mcpClient = new MCPClient();
