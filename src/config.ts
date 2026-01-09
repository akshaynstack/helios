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

    // Custom Provider (OpenAI-compatible)
    CUSTOM_BASE_URL: string;
    CUSTOM_API_KEY: string;

    // Model Settings
    MODEL: string;
    TIMEOUT: number;
    MAX_RETRIES: number;
    MAX_ITERATIONS: number;
    MXBAI_API_KEY: string;
    USE_RIPGREP: boolean;
    USE_FD: boolean;
    STREAMING: boolean;

    // MCP
    MCP_SERVERS: MCPServerConfig[];

    // Provider Settings
    ACTIVE_PROVIDER: ProviderType;

    // Qwen Auth
    QWEN_ACCESS_TOKEN: string;
    QWEN_REFRESH_TOKEN: string;
    QWEN_EXPIRY: number;
    QWEN_RESOURCE_URL: string;

    // Browserless
    BROWSERLESS_URL: string;

    // UI
    COMPACT_MODE: boolean;
    SHOW_USAGE: boolean;
    DEBUG_MODE: boolean;
}

export const config = new Conf<ConfigSchema>({
    projectName: 'helios-cli',
    defaults: {
        OPENROUTER_API_KEY: '',
        OPENAI_API_KEY: '',
        ANTHROPIC_API_KEY: '',
        GOOGLE_API_KEY: '',
        V0_API_KEY: '',
        CUSTOM_BASE_URL: '',
        CUSTOM_API_KEY: '',
        MODEL: 'google/gemini-2.0-flash-exp:free',
        TIMEOUT: 60000,
        MAX_RETRIES: 3,
        MAX_ITERATIONS: 30,
        MXBAI_API_KEY: '',
        USE_RIPGREP: true,
        USE_FD: true,
        STREAMING: true,
        MCP_SERVERS: [],
        ACTIVE_PROVIDER: 'none',
        QWEN_ACCESS_TOKEN: '',
        QWEN_REFRESH_TOKEN: '',
        QWEN_EXPIRY: 0,
        QWEN_RESOURCE_URL: '',
        BROWSERLESS_URL: '',
        COMPACT_MODE: false,
        SHOW_USAGE: false,
        DEBUG_MODE: false
    }
});

export type ProviderType = 'custom' | 'openrouter' | 'openai' | 'anthropic' | 'google' | 'qwen-free' | 'none';

export function getApiKey(): { key: string; provider: ProviderType; baseUrl?: string } {
    const activeProvider = config.get('ACTIVE_PROVIDER');

    // If a provider is explicitly active, try to use it
    if (activeProvider && activeProvider !== 'none') {
        if (activeProvider === 'custom') {
            const customUrl = config.get('CUSTOM_BASE_URL');
            const customKey = config.get('CUSTOM_API_KEY');
            if (customUrl && customKey) return { key: customKey, provider: 'custom', baseUrl: customUrl };
        } else if (activeProvider === 'anthropic') {
            const key = config.get('ANTHROPIC_API_KEY');
            if (key) return { key, provider: 'anthropic' };
        } else if (activeProvider === 'openrouter') {
            const key = config.get('OPENROUTER_API_KEY');
            if (key) return { key, provider: 'openrouter' };
        } else if (activeProvider === 'openai') {
            const key = config.get('OPENAI_API_KEY');
            if (key) return { key, provider: 'openai' };
        } else if (activeProvider === 'google') {
            const key = config.get('GOOGLE_API_KEY');
            if (key) return { key, provider: 'google' };
        }
    }

    // Fallback to auto-detection (original logic)
    const customUrl = config.get('CUSTOM_BASE_URL');
    const customKey = config.get('CUSTOM_API_KEY');
    if (customUrl && customKey) return { key: customKey, provider: 'custom', baseUrl: customUrl };

    const qwenToken = config.get('QWEN_ACCESS_TOKEN');
    // If not actively set to another provider, and we have a Qwen token, prefer it OR just allow it to be detected
    // Usually we prefer paid keys first if auto-detecting, or maybe free last?
    // Let's verify active provider first (handled above).

    // In auto-detect:
    // ... custom ...
    // ... anthropic ...

    // If active is qwen-free
    if (activeProvider === 'qwen-free') {
        if (qwenToken) return { key: qwenToken, provider: 'qwen-free' };
    }

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
