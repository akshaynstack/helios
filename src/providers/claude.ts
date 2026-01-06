/**
 * Claude Provider - Native Anthropic SDK integration
 */

import type { AIProvider, ChatOptions, StreamChunk } from './index.js';
import type { Message, Tool, ProviderResponse } from '../types.js';

export class ClaudeProvider implements AIProvider {
    name = 'claude';
    private apiKey: string;
    private baseURL = 'https://api.anthropic.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private convertMessages(messages: Message[]): any[] {
        // Filter out system messages (handled separately in Claude)
        return messages
            .filter(m => m.role !== 'system')
            .map(m => {
                if (m.role === 'tool') {
                    return {
                        role: 'user',
                        content: [{
                            type: 'tool_result',
                            tool_use_id: m.tool_call_id,
                            content: m.content
                        }]
                    };
                }
                if (m.role === 'assistant' && m.tool_calls?.length) {
                    return {
                        role: 'assistant',
                        content: [
                            ...(m.content ? [{ type: 'text', text: m.content }] : []),
                            ...m.tool_calls.map(tc => ({
                                type: 'tool_use',
                                id: tc.id,
                                name: tc.function.name,
                                input: JSON.parse(tc.function.arguments || '{}')
                            }))
                        ]
                    };
                }
                return {
                    role: m.role,
                    content: m.content || ''
                };
            });
    }

    private convertTools(tools: Tool[]): any[] {
        return tools.map(t => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters
        }));
    }

    async chat(messages: Message[], tools: Tool[], options: ChatOptions = {}): Promise<ProviderResponse> {
        const model = options.model || 'claude-sonnet-4-20250514';
        const timeout = options.timeout || 60000;
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 8192,
                    system: systemMessage,
                    messages: this.convertMessages(messages),
                    tools: tools.length > 0 ? this.convertTools(tools) : undefined
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Claude API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as any;

            let content = '';
            const toolCalls: any[] = [];

            for (const block of data.content) {
                if (block.type === 'text') {
                    content += block.text;
                } else if (block.type === 'tool_use') {
                    toolCalls.push({
                        id: block.id,
                        type: 'function',
                        function: {
                            name: block.name,
                            arguments: JSON.stringify(block.input)
                        }
                    });
                }
            }

            return {
                content: content || null,
                toolCalls,
                finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
                usage: data.usage ? {
                    promptTokens: data.usage.input_tokens,
                    completionTokens: data.usage.output_tokens,
                    totalTokens: data.usage.input_tokens + data.usage.output_tokens
                } : undefined
            };
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${timeout}ms`);
            }
            throw error;
        }
    }

    async *stream(messages: Message[], tools: Tool[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
        const model = options.model || 'claude-sonnet-4-20250514';
        const timeout = options.timeout || 60000;
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 8192,
                    system: systemMessage,
                    messages: this.convertMessages(messages),
                    tools: tools.length > 0 ? this.convertTools(tools) : undefined,
                    stream: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                yield { type: 'error', error: `Claude API error: ${response.status} - ${error}` };
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                yield { type: 'error', error: 'No response body' };
                return;
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentToolUse: { id: string; name: string; arguments: string } | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (!data) continue;

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.type === 'content_block_start') {
                                if (parsed.content_block?.type === 'tool_use') {
                                    currentToolUse = {
                                        id: parsed.content_block.id,
                                        name: parsed.content_block.name,
                                        arguments: ''
                                    };
                                }
                            } else if (parsed.type === 'content_block_delta') {
                                if (parsed.delta?.type === 'text_delta') {
                                    yield { type: 'text', content: parsed.delta.text };
                                } else if (parsed.delta?.type === 'input_json_delta' && currentToolUse) {
                                    currentToolUse.arguments += parsed.delta.partial_json;
                                }
                            } else if (parsed.type === 'content_block_stop' && currentToolUse) {
                                yield { type: 'tool_call', toolCall: currentToolUse };
                                currentToolUse = null;
                            } else if (parsed.type === 'message_stop') {
                                yield { type: 'done' };
                                return;
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
            if (error.name === 'AbortError') {
                yield { type: 'error', error: `Request timed out after ${timeout}ms` };
            } else {
                yield { type: 'error', error: error.message };
            }
        }
    }
}
