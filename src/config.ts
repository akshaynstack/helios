import Conf from 'conf';

interface ConfigSchema {
    OPENROUTER_API_KEY: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    V0_API_KEY: string;
    MODEL: string;
}

export const config = new Conf<ConfigSchema>({
    projectName: 'helios-cli',
    defaults: {
        OPENROUTER_API_KEY: '',
        OPENAI_API_KEY: '',
        ANTHROPIC_API_KEY: '',
        V0_API_KEY: '',
        MODEL: 'google/gemini-2.0-flash-exp:free'
    }
});

export function getApiKey(): { key: string; provider: string } {
    const openrouter = config.get('OPENROUTER_API_KEY');
    if (openrouter) return { key: openrouter, provider: 'openrouter' };

    const openai = config.get('OPENAI_API_KEY');
    if (openai) return { key: openai, provider: 'openai' };

    const anthropic = config.get('ANTHROPIC_API_KEY');
    if (anthropic) return { key: anthropic, provider: 'anthropic' };

    return { key: '', provider: 'none' };
}

export function getV0Key(): string {
    return config.get('V0_API_KEY') || '';
}
