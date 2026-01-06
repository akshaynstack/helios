/**
 * Helios MCP Client - Connect to external MCP servers
 * Discovers and uses tools from MCP servers
 */

import { getMCPServers } from '../config.js';
import type { Tool, MCPTool, MCPResource } from '../types.js';

interface MCPConnection {
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    tools: MCPTool[];
    resources: MCPResource[];
    error?: string;
}

interface MCPListToolsResponse {
    tools: MCPTool[];
}

interface MCPListResourcesResponse {
    resources: MCPResource[];
}

interface MCPCallToolResponse {
    content: Array<{ type: string; text?: string; data?: string }>;
    isError?: boolean;
}

export class MCPClient {
    private connections: Map<string, MCPConnection> = new Map();

    /**
     * Connect to all configured MCP servers
     */
    async connectAll(): Promise<void> {
        const servers = getMCPServers();

        for (const server of servers) {
            try {
                await this.connect(server.name, server.url || '');
            } catch (error: any) {
                console.error(`Failed to connect to MCP server ${server.name}: ${error.message}`);
            }
        }
    }

    /**
     * Connect to a single MCP server via HTTP/SSE
     */
    async connect(name: string, url: string): Promise<MCPConnection> {
        const connection: MCPConnection = {
            name,
            status: 'disconnected',
            tools: [],
            resources: []
        };

        try {
            // List tools from the server
            const toolsResponse = await fetch(`${url}/tools`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (toolsResponse.ok) {
                const data = await toolsResponse.json() as MCPListToolsResponse;
                connection.tools = data.tools || [];
            }

            // List resources
            const resourcesResponse = await fetch(`${url}/resources`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (resourcesResponse.ok) {
                const data = await resourcesResponse.json() as MCPListResourcesResponse;
                connection.resources = data.resources || [];
            }

            connection.status = 'connected';
        } catch (error: any) {
            connection.status = 'error';
            connection.error = error.message;
        }

        this.connections.set(name, connection);
        return connection;
    }

    /**
     * Disconnect from a server
     */
    disconnect(name: string): void {
        this.connections.delete(name);
    }

    /**
     * Get all tools from all connected servers
     */
    getAllTools(): Tool[] {
        const tools: Tool[] = [];

        for (const [serverName, connection] of this.connections) {
            if (connection.status !== 'connected') continue;

            for (const mcpTool of connection.tools) {
                tools.push({
                    name: `${serverName}__${mcpTool.name}`,
                    description: `[${serverName}] ${mcpTool.description}`,
                    parameters: {
                        type: 'object',
                        properties: mcpTool.inputSchema?.properties as Record<string, { type: string; description: string }> || {},
                        required: mcpTool.inputSchema?.required || []
                    }
                });
            }
        }

        return tools;
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(fullName: string, args: Record<string, unknown>): Promise<string> {
        const parts = fullName.split('__');
        if (parts.length < 2) {
            throw new Error(`Invalid MCP tool name: ${fullName}`);
        }

        const serverName = parts[0];
        const toolName = parts.slice(1).join('__');

        const connection = this.connections.get(serverName);
        if (!connection) {
            throw new Error(`Not connected to MCP server: ${serverName}`);
        }

        const server = getMCPServers().find(s => s.name === serverName);
        if (!server?.url) {
            throw new Error(`No URL configured for MCP server: ${serverName}`);
        }

        try {
            const response = await fetch(`${server.url}/tools/call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: toolName,
                    arguments: args
                })
            });

            const data = await response.json() as MCPCallToolResponse;

            if (data.isError) {
                throw new Error(data.content?.[0]?.text || 'MCP tool call failed');
            }

            // Extract text content
            const textContent = data.content
                ?.filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join('\n');

            return textContent || JSON.stringify(data.content);
        } catch (error: any) {
            throw new Error(`MCP tool call failed: ${error.message}`);
        }
    }

    /**
     * Check if a tool name is from an MCP server
     */
    isMCPTool(name: string): boolean {
        return name.includes('__');
    }

    /**
     * Get connection status for all servers
     */
    getStatus(): Array<{ name: string; status: string; toolCount: number }> {
        const result: Array<{ name: string; status: string; toolCount: number }> = [];

        for (const [name, connection] of this.connections) {
            result.push({
                name,
                status: connection.status,
                toolCount: connection.tools.length
            });
        }

        return result;
    }
}

// Singleton instance
export const mcpClient = new MCPClient();
