
import { OpenAI } from 'openai';
import { AgentState, SYSTEM_PROMPT } from '../chat.js';
import { AIProvider, ChatOptions, StreamChunk } from '../providers/index.js';
import type { Message, Tool, ProviderResponse } from '../types.js';
import { config } from '../config.js';
import { QwenAuth } from '../auth/qwen.js';
import chalk from 'chalk';

export class QwenFreeProvider implements AIProvider {
    name = 'qwen-free';
    private client: OpenAI | null = null;
    private token: string | null = null;
    private resourceUrl: string | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        this.token = config.get('QWEN_ACCESS_TOKEN');
        this.resourceUrl = config.get('QWEN_RESOURCE_URL');

        // Default compatible-mode URL if no resource URL is found
        let baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

        if (this.resourceUrl) {
            // Ensure /v1 suffix
            baseURL = this.resourceUrl.endsWith('/v1')
                ? this.resourceUrl
                : `${this.resourceUrl}/v1`;

            // Fix protocol if missing
            if (!baseURL.startsWith('http')) {
                baseURL = `https://${baseURL}`;
            }
        }

        if (this.token) {
            this.client = new OpenAI({
                apiKey: this.token,
                baseURL: baseURL,
            });
        }
    }

    async chat(messages: Message[], tools: Tool[], options: ChatOptions = {}): Promise<ProviderResponse> {
        // Fallback to non-streaming if needed, but for now we implement mostly stream
        // We can use the stream implementation and collect it.
        const generator = this.stream(messages, tools, options);
        let content = '';
        const toolCalls: any[] = [];

        for await (const chunk of generator) {
            if (chunk.type === 'text' && chunk.content) content += chunk.content;
            if (chunk.type === 'tool_call' && chunk.toolCall) {
                toolCalls.push(chunk.toolCall);
            }
            if (chunk.type === 'error') throw new Error(chunk.error);
        }

        return {
            content,
            toolCalls: toolCalls as any,
            finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop'
        };
    }

    async *stream(
        messages: Message[],
        tools: Tool[],
        options: ChatOptions = {}
    ): AsyncGenerator<StreamChunk> {
        if (!this.client || !this.token) {
            // Attempt to refresh or re-init
            const token = await QwenAuth.getAccessToken();
            if (token) {
                this.initializeClient(); // Re-init with check
                if (!this.client) throw new Error('Failed to initialize client');
            } else {
                yield { type: 'error', error: 'Not authenticated with Qwen.ai. Run "helios login qwen" first.' };
                return;
            }
        }

        const formattedMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({
                role: m.role,
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            }))
        ];

        try {
            const stream = await this.client.chat.completions.create({
                model: options.model || 'qwen-plus', // Default to qwen-plus (free tier usually supports plus/max/turbo)
                messages: formattedMessages as any,
                stream: true,
                tools: tools.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters,
                    },
                })),
                tool_choice: 'auto',
            });

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                if (delta?.content) {
                    yield { type: 'text', content: delta.content };
                }

                if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        yield {
                            type: 'tool_call',
                            toolCall: {
                                id: toolCall.id || `call_${Math.random().toString(36).slice(2)}`,
                                name: toolCall.function?.name || '',
                                arguments: toolCall.function?.arguments || '',
                            }
                        };
                    }
                }
            }
        } catch (error: any) {
            if (error?.status === 401) {
                yield { type: 'error', error: 'Authentication expired. Please run "helios login qwen" again.' };
            } else {
                yield { type: 'error', error: `Qwen API Error: ${error.message}` };
            }
        }
    }
}
