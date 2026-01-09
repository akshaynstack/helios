/**
 * OpenAI Provider - Direct OpenAI API integration
 */

import type { AIProvider, ChatOptions, StreamChunk } from './index.js';
import type { Message, Tool, ProviderResponse } from '../types.js';

export class OpenAIProvider implements AIProvider {
    name = 'openai';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string, baseUrl?: string) {
        this.apiKey = apiKey;
        this.baseURL = baseUrl || 'https://api.openai.com/v1';
    }

    async chat(messages: Message[], tools: Tool[], options: ChatOptions = {}): Promise<ProviderResponse> {
        const model = options.model || 'gpt-4o-mini';
        const timeout = options.timeout || 60000;

        const makeRequest = async (useTools: boolean): Promise<ProviderResponse | null> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(`${this.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        tools: useTools && tools.length > 0 ? tools.map(t => ({
                            type: 'function',
                            function: {
                                name: t.name,
                                description: t.description,
                                parameters: t.parameters
                            }
                        })) : undefined,
                        tool_choice: useTools && tools.length > 0 ? 'auto' : undefined,
                        temperature: options.temperature ?? 0.7
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const rawText = await response.text();
                if (!response.ok) {
                    // Detect tool-related errors and retry without tools silently
                    const lowerError = rawText.toLowerCase();
                    if (useTools && (response.status === 400 || response.status === 404 || response.status === 422)) {
                        if (lowerError.includes('tool') || lowerError.includes('function') ||
                            lowerError.includes('not supported') || lowerError.includes('invalid')) {
                            return null; // Signal to retry without tools
                        }
                    }
                    throw new Error(`OpenAI API error: ${response.status} - ${rawText}`);
                }

                const data = JSON.parse(rawText);
                const choice = data.choices[0];
                const message = choice.message;

                return {
                    content: message.content,
                    toolCalls: (message.tool_calls?.map((tc: any) => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        }
                    })) || []).concat(message.function_call ? [{
                        id: `fc_${Date.now()}`,
                        type: 'function',
                        function: {
                            name: message.function_call.name,
                            arguments: message.function_call.arguments
                        }
                    }] : []),
                    finishReason: (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call') ? 'tool_calls' : 'stop',
                    usage: data.usage ? {
                        promptTokens: data.usage.prompt_tokens,
                        completionTokens: data.usage.completion_tokens,
                        totalTokens: data.usage.total_tokens
                    } : undefined
                };
            } catch (error: any) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error(`Request timed out after ${timeout}ms`);
                }
                throw error;
            }
        };

        // Try with tools first, then fallback to without tools if rejected
        const result = await makeRequest(true);
        if (result === null) {
            return (await makeRequest(false)) as ProviderResponse;
        }
        return result;
    }

    async *stream(messages: Message[], tools: Tool[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
        const model = options.model || 'gpt-4o-mini';
        const timeout = options.timeout || 60000;

        const self = this;
        const executeStream = async function* (useTools: boolean): AsyncGenerator<StreamChunk> {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(`${self.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${self.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        tools: useTools && tools.length > 0 ? tools.map(t => ({
                            type: 'function',
                            function: {
                                name: t.name,
                                description: t.description,
                                parameters: t.parameters
                            }
                        })) : undefined,
                        tool_choice: useTools && tools.length > 0 ? 'auto' : undefined,
                        temperature: options.temperature ?? 0.7,
                        stream: true
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorContent = await response.text();
                    const lowerError = errorContent.toLowerCase();
                    // Detect tool-related errors and signal retry
                    if (useTools && (response.status === 400 || response.status === 404 || response.status === 422)) {
                        if (lowerError.includes('tool') || lowerError.includes('function') ||
                            lowerError.includes('not supported') || lowerError.includes('invalid')) {
                            throw new Error('RETRY_WITHOUT_TOOLS');
                        }
                    }
                    yield { type: 'error', error: `OpenAI API error: ${response.status} - ${errorContent}` };
                    return;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    yield { type: 'error', error: 'No response body' };
                    return;
                }

                const decoder = new TextDecoder();
                let buffer = '';
                let currentToolCall: { id: string; name: string; arguments: string } | null = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') {
                                if (currentToolCall) {
                                    yield { type: 'tool_call', toolCall: currentToolCall };
                                }
                                yield { type: 'done' };
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                const delta = parsed.choices?.[0]?.delta;

                                if (delta?.content) {
                                    yield { type: 'text', content: delta.content };
                                }

                                if (delta?.tool_calls) {
                                    for (const tc of delta.tool_calls) {
                                        if (tc.id) {
                                            if (currentToolCall) {
                                                yield { type: 'tool_call', toolCall: currentToolCall };
                                            }
                                            currentToolCall = {
                                                id: tc.id,
                                                name: tc.function?.name || '',
                                                arguments: tc.function?.arguments || ''
                                            };
                                        } else if (currentToolCall) {
                                            if (tc.function?.name) currentToolCall.name += tc.function.name;
                                            if (tc.function?.arguments) currentToolCall.arguments += tc.function.arguments;
                                        }
                                    }
                                }

                                if (delta?.function_call) {
                                    if (delta.function_call.name) {
                                        if (currentToolCall) {
                                            yield { type: 'tool_call', toolCall: currentToolCall };
                                        }
                                        currentToolCall = {
                                            id: `fc_${Date.now()}`,
                                            name: delta.function_call.name,
                                            arguments: ''
                                        };
                                    }
                                    if (delta.function_call.arguments) {
                                        if (currentToolCall) {
                                            currentToolCall.arguments += delta.function_call.arguments;
                                        }
                                    }
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }

                yield { type: 'done' };
            } catch (error: any) {
                clearTimeout(timeoutId);
                if (error.message === 'RETRY_WITHOUT_TOOLS') {
                    throw error;
                }
                if (error.name === 'AbortError') {
                    yield { type: 'error', error: `Request timed out after ${timeout}ms` };
                } else {
                    yield { type: 'error', error: error.message };
                }
            }
        };

        try {
            yield* executeStream(true);
        } catch (error: any) {
            if (error.message === 'RETRY_WITHOUT_TOOLS') {
                yield* executeStream(false);
            } else {
                yield { type: 'error', error: error.message };
            }
        }
    }
}
