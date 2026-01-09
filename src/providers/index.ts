/**
 * Helios Providers - Unified AI Provider Interface
 * Supports: OpenRouter, Claude (Anthropic), OpenAI, Google
 */

import { config, getApiKey } from '../config.js';
import type { Message, Tool, ProviderResponse } from '../types.js';

export interface AIProvider {
    name: string;
    chat(messages: Message[], tools: Tool[], options?: ChatOptions): Promise<ProviderResponse>;
    stream(messages: Message[], tools: Tool[], options?: ChatOptions): AsyncGenerator<StreamChunk>;
}

export interface ChatOptions {
    model?: string;
    timeout?: number;
    maxRetries?: number;
    temperature?: number;
}

export interface StreamChunk {
    type: 'text' | 'tool_call' | 'error' | 'done';
    content?: string;
    toolCall?: {
        id: string;
        name: string;
        arguments: string;
    };
    error?: string;
}

// Re-export providers
export { OpenRouterProvider } from './openrouter.js';
export { ClaudeProvider } from './claude.js';
export { OpenAIProvider } from './openai.js';

/**
 * Get the appropriate provider based on configured API keys
 */
export async function getProvider(): Promise<AIProvider> {
    const { key, provider, baseUrl } = getApiKey();

    if (!key && provider !== 'custom') {
        throw new Error('No API key configured. Run: helios config set OPENROUTER_API_KEY sk-or-...');
    }

    switch (provider) {
        case 'custom': {
            // Custom OpenAI-compatible provider
            const { OpenAIProvider } = await import('./openai.js');
            return new OpenAIProvider(key, baseUrl);
        }
        case 'anthropic': {
            const { ClaudeProvider } = await import('./claude.js');
            return new ClaudeProvider(key);
        }
        case 'openai': {
            const { OpenAIProvider } = await import('./openai.js');
            return new OpenAIProvider(key);
        }
        case 'qwen-free': {
            const { QwenFreeProvider } = await import('./qwen-free.js');
            return new QwenFreeProvider();
        }
        case 'openrouter':
        default: {
            const { OpenRouterProvider } = await import('./openrouter.js');
            return new OpenRouterProvider(key);
        }
    }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on auth errors or user cancellation
            if (error.status === 401 || error.status === 403 || error.name === 'AbortError') {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Timeout wrapper
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
        )
    ]);
}
