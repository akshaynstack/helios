import Conf from 'conf';

interface MCPServerConfig {
    name: string;
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}

interface ConfigSchema {
    // API Keys
    OPENROUTER_API_KEY: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    GOOGLE_API_KEY: string;
    V0_API_KEY: string;

    // Model Settings
    MODEL: string;
    TIMEOUT: number;
    MAX_RETRIES: number;
    STREAMING: boolean;

    // MCP
    MCP_SERVERS: MCPServerConfig[];

    // UI
    COMPACT_MODE: boolean;
    SHOW_USAGE: boolean;
}

export const config = new Conf<ConfigSchema>({
    projectName: 'helios-cli',
    defaults: {
        OPENROUTER_API_KEY: '',
        OPENAI_API_KEY: '',
        ANTHROPIC_API_KEY: '',
        GOOGLE_API_KEY: '',
        V0_API_KEY: '',
        MODEL: 'google/gemini-2.0-flash-exp:free',
        TIMEOUT: 60000,
        MAX_RETRIES: 3,
        STREAMING: true,
        MCP_SERVERS: [],
        COMPACT_MODE: false,
        SHOW_USAGE: false
    }
});

export function getApiKey(): { key: string; provider: 'openrouter' | 'openai' | 'anthropic' | 'google' | 'none' } {
    const anthropic = config.get('ANTHROPIC_API_KEY');
    if (anthropic) return { key: anthropic, provider: 'anthropic' };

    const openrouter = config.get('OPENROUTER_API_KEY');
    if (openrouter) return { key: openrouter, provider: 'openrouter' };

    const openai = config.get('OPENAI_API_KEY');
    if (openai) return { key: openai, provider: 'openai' };

    const google = config.get('GOOGLE_API_KEY');
    if (google) return { key: google, provider: 'google' };

    return { key: '', provider: 'none' };
}

export function getV0Key(): string {
    return config.get('V0_API_KEY') || '';
}

export function getMCPServers(): MCPServerConfig[] {
    return config.get('MCP_SERVERS') || [];
}

export function addMCPServer(server: MCPServerConfig): void {
    const servers = getMCPServers();
    const existing = servers.findIndex(s => s.name === server.name);
    if (existing >= 0) {
        servers[existing] = server;
    } else {
        servers.push(server);
    }
    config.set('MCP_SERVERS', servers);
}

export function removeMCPServer(name: string): boolean {
    const servers = getMCPServers();
    const filtered = servers.filter(s => s.name !== name);
    if (filtered.length < servers.length) {
        config.set('MCP_SERVERS', filtered);
        return true;
    }
    return false;
}
