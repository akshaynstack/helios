/**
 * OpenRouter Provider - Multi-model access via OpenRouter
 */

import type { AIProvider, ChatOptions, StreamChunk } from './index.js';
import type { Message, Tool, ProviderResponse } from '../types.js';
import { config } from '../config.js';
import chalk from 'chalk';

export class OpenRouterProvider implements AIProvider {
    name = 'openrouter';
    private apiKey: string;
    private baseURL = 'https://openrouter.ai/api/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: Message[], tools: Tool[], options: ChatOptions = {}): Promise<ProviderResponse> {
        const model = options.model || config.get('MODEL') || 'google/gemini-2.0-flash-exp:free';
        const timeout = options.timeout || 60000;

        const makeRequest = async (useTools: boolean): Promise<ProviderResponse | null> => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(`${this.baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/akshaynstack/helios',
                        'X-Title': 'Helios CLI'
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
                        temperature: options.temperature ?? 0.7
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const rawText = await response.text();
                if (!response.ok) {
                    if (response.status === 404 && rawText.includes('support tool use') && useTools) {
                        // Silent fallback - no user-facing message
                        return null;
                    }
                    throw new Error(`OpenRouter API error: ${response.status} - ${rawText}`);
                }

                const data = JSON.parse(rawText);
                const choice = data.choices[0];
                const message = choice.message;

                return {
                    content: message.content,
                    toolCalls: message.tool_calls?.map((tc: any) => ({
                        id: tc.id,
                        type: 'function' as const,
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        }
                    })) || [],
                    finishReason: (choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop') as any,
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

        const result = await makeRequest(true);
        if (result === null) {
            return (await makeRequest(false)) as ProviderResponse;
        }
        return result;
    }

    async *stream(messages: Message[], tools: Tool[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
        const model = options.model || config.get('MODEL') || 'google/gemini-2.0-flash-exp:free';
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
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/akshaynstack/helios',
                        'X-Title': 'Helios CLI'
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
                        temperature: options.temperature ?? 0.7,
                        stream: true
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorContent = await response.text();
                    if (response.status === 404 && errorContent.includes('support tool use') && useTools) {
                        // Silent fallback - no user-facing message
                        throw new Error('RETRY_WITHOUT_TOOLS');
                    }
                    yield { type: 'error', error: `OpenRouter API error: ${response.status} - ${errorContent}` };
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
                            const dataLine = line.slice(6).trim();
                            if (dataLine === '[DONE]') {
                                if (currentToolCall) {
                                    yield { type: 'tool_call', toolCall: currentToolCall };
                                }
                                yield { type: 'done' };
                                return;
                            }

                            try {
                                const parsed = JSON.parse(dataLine);
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
