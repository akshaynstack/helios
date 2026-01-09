/**
 * Models Utility - Fetch available models from AI providers
 */

import { config, getApiKey, type ProviderType } from './config.js';

export interface ModelInfo {
    id: string;
    name: string;
    context_length?: number;
    pricing?: { prompt: number; completion: number };
    free?: boolean;
}

interface ModelsResponse {
    data?: Array<{ id: string; name?: string; context_length?: number; pricing?: any }>;
    models?: Array<{ id?: string; name?: string; context_length?: number }>;
}

// Cache for models (5 minute TTL)
let modelsCache: { models: ModelInfo[]; timestamp: number; provider: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch models from OpenRouter API
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json() as ModelsResponse;
    return (data.data || []).map((m) => ({
        id: m.id,
        name: m.name || m.id,
        context_length: m.context_length,
        pricing: m.pricing ? {
            prompt: parseFloat(m.pricing.prompt) || 0,
            completion: parseFloat(m.pricing.completion) || 0
        } : undefined,
        free: m.id.includes(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0')
    }));
}

/**
 * Fetch models from OpenAI API
 */
export async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as ModelsResponse;
    // Filter to chat models
    const chatModels = (data.data || []).filter((m) =>
        m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('chatgpt')
    );

    return chatModels.map((m) => ({
        id: m.id,
        name: m.id,
        free: false
    }));
}

/**
 * Fetch models from custom OpenAI-compatible endpoint
 */
export async function fetchCustomModels(apiKey: string, baseUrl: string): Promise<ModelInfo[]> {
    const url = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;

    const response = await fetch(url, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });

    if (!response.ok) {
        throw new Error(`Custom API error: ${response.status}`);
    }

    const data = await response.json() as ModelsResponse;
    return (data.data || data.models || []).map((m) => ({
        id: m.id || m.name || 'unknown',
        name: m.name || m.id || 'unknown',
        context_length: m.context_length,
        free: true // Assume custom providers are free (self-hosted)
    }));
}

/**
 * Get Anthropic models (static list as they don't have a models API)
 */
export function getAnthropicModels(): ModelInfo[] {
    return [
        { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet (Latest)', free: false },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', free: false },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', free: false },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', free: false },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', free: false },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', free: false },
    ];
}

/**
 * Get Google models (static list)
 */
export function getGoogleModels(): ModelInfo[] {
    return [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', free: true },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: false },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', free: false },
    ];
}

/**
 * Get Qwen.ai models (Free tier usually supports these)
 */
export function getQwenModels(): ModelInfo[] {
    return [
        { id: 'qwen-plus', name: 'Qwen Plus (Balanced)', free: true },
        { id: 'qwen-max', name: 'Qwen Max (Most Capable)', free: true },
        { id: 'qwen-turbo', name: 'Qwen Turbo (Fast)', free: true },
    ];
}

/**
 * Fetch models for a specific provider
 */
export async function fetchModelsForProvider(
    provider: ProviderType,
    apiKey: string,
    baseUrl?: string
): Promise<ModelInfo[]> {
    let models: ModelInfo[] = [];

    try {
        switch (provider) {
            case 'custom':
                if (baseUrl) {
                    models = await fetchCustomModels(apiKey, baseUrl);
                }
                break;
            case 'openrouter':
                models = await fetchOpenRouterModels(apiKey);
                break;
            case 'openai':
                models = await fetchOpenAIModels(apiKey);
                break;
            case 'anthropic':
                models = getAnthropicModels();
                break;
            case 'google':
                models = getGoogleModels();
                break;
            case 'qwen-free':
                models = getQwenModels();
                break;
        }

        // Sort: free first, then by name
        models.sort((a, b) => {
            if (a.free && !b.free) return -1;
            if (!a.free && b.free) return 1;
            return a.name.localeCompare(b.name);
        });

        return models;
    } catch (error: any) {
        throw new Error(`Failed to fetch models: ${error.message}`);
    }
}

/**
 * Fetch models from the currently configured provider
 */
export async function fetchModels(forceRefresh = false): Promise<ModelInfo[]> {
    const { key, provider, baseUrl } = getApiKey();

    // Check cache
    if (!forceRefresh && modelsCache && modelsCache.provider === provider) {
        if (Date.now() - modelsCache.timestamp < CACHE_TTL) {
            return modelsCache.models;
        }
    }

    if (provider === 'none') {
        return [];
    }

    const models = await fetchModelsForProvider(provider, key, baseUrl);

    // Cache results
    modelsCache = { models, timestamp: Date.now(), provider };

    return models;
}

/**
 * Get a display name for a model
 */
export function getModelDisplayName(modelId: string): string {
    const parts = modelId.split('/');
    const name = parts[parts.length - 1];
    return name.replace(/:free$/, ' 🆓');
}
