/**
 * Helios Chat - AI Conversation Loop with Streaming
 * Now with timeout handling, retry logic, and multi-provider support
 */

import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import { select, input } from '@inquirer/prompts';
import search from '@inquirer/search';
import { config, getApiKey } from './config.js';
import { tools, executeTool } from './tools/index.js';
import { loopDetector, securityScanner, auditLogger } from './supervision/index.js';
import { getProvider, withRetry } from './providers/index.js';
import { checkPermission, createPermissionState, toggleAutoApprove, type PermissionState } from './permissions.js';
import type { Message, Tool } from './types.js';

const SYSTEM_PROMPT = `You are Helios, an AI coding assistant with built-in supervision.

You help developers by:
- Reading, writing, and editing files
- Running shell commands
- Searching codebases
- Generating code, tests, and components

IMPORTANT: You have a supervision layer that:
1. Detects loops - if you repeat actions, you'll be stopped
2. Scans for security issues - dangerous code will be flagged
3. Logs all actions - everything is audited

Be efficient. Don't repeat yourself. Write secure code.

Current directory: ${process.cwd()}`;

const warningGradient = gradient(['#ff6b6b', '#feca57']);
const successGradient = gradient(['#00d2ff', '#3a7bd5']);
const accentGradient = gradient(['#667eea', '#764ba2']);

// ==================== SLASH COMMANDS ====================

interface SlashCommand {
    name: string;
    description: string;
    handler: (args: string, state: ChatState) => string | Promise<string>;
}

interface ChatState {
    messages: Message[];
    compact: boolean;
    streaming: boolean;
    permissions: PermissionState;
}

const SLASH_COMMANDS: SlashCommand[] = [
    {
        name: '/help',
        description: '📖 Show available commands',
        handler: () => {
            return SLASH_COMMANDS.map(c =>
                `  ${chalk.cyan(c.name.padEnd(12))} ${chalk.dim(c.description)}`
            ).join('\n') + '\n';
        }
    },
    {
        name: '/clear',
        description: '🧹 Clear conversation history',
        handler: (_args, state) => {
            state.messages = [{ role: 'system', content: SYSTEM_PROMPT }];
            loopDetector.reset();
            console.clear();
            return accentGradient('✓ Conversation cleared');
        }
    },
    {
        name: '/tools',
        description: '🛠️  List available tools',
        handler: () => {
            return chalk.dim(`${tools.length} tools available. Ask me to use them!`);
        }
    },
    {
        name: '/secrets',
        description: '🔒 Scan for hardcoded secrets',
        handler: () => executeTool('detect_secrets', { path: '.', fix: 'false' })
    },
    {
        name: '/status',
        description: '📊 Show session status',
        handler: (_args, state) => {
            const stats = auditLogger.getStats();
            const { provider } = getApiKey();
            const streaming = state.streaming ? chalk.green('ON') : chalk.dim('OFF');
            return `Provider: ${provider} | Messages: ${state.messages.length} | Actions: ${stats.total} | Streaming: ${streaming}`;
        }
    },
    {
        name: '/model',
        description: '🤖 Change AI model',
        handler: async () => {
            const models = [
                { name: '🆓 Gemini 2.0 Flash (Free)', value: 'google/gemini-2.0-flash-exp:free' },
                { name: '🆓 Llama 3.3 70B (Free)', value: 'meta-llama/llama-3.3-70b-instruct:free' },
                { name: '🆓 DeepSeek V3 (Free)', value: 'deepseek/deepseek-chat:free' },
                { name: '💎 Claude 4 Sonnet', value: 'claude-sonnet-4-20250514' },
                { name: '💎 Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
                { name: '💰 GPT-4o', value: 'openai/gpt-4o' },
                { name: '💵 GPT-4o Mini (Cheap)', value: 'openai/gpt-4o-mini' },
                { name: '💵 Claude 3 Haiku (Cheap)', value: 'anthropic/claude-3-haiku' }
            ];
            const chosen = await select({
                message: 'Select model:',
                choices: models
            });
            config.set('MODEL', chosen);
            return successGradient(`✓ Model set to: ${chosen}`);
        }
    },
    {
        name: '/stream',
        description: '⚡ Toggle streaming mode',
        handler: (_args, state) => {
            state.streaming = !state.streaming;
            config.set('STREAMING', state.streaming);
            return state.streaming ? '✓ Streaming: ON (faster feedback)' : '✓ Streaming: OFF (wait for full response)';
        }
    },
    {
        name: '/compact',
        description: '📦 Toggle compact output mode',
        handler: (_args, state) => {
            state.compact = !state.compact;
            config.set('COMPACT_MODE', state.compact);
            return state.compact ? '✓ Compact mode ON' : '✓ Compact mode OFF';
        }
    },
    {
        name: '/history',
        description: '📜 Show recent actions',
        handler: () => {
            const entries = auditLogger.getRecent(5);
            if (!entries.length) return 'No actions yet';
            return entries.map(e => `${e.result === 'success' ? '✓' : '✗'} ${e.action}`).join('\n');
        }
    },
    {
        name: '/project',
        description: '📁 Analyze current project',
        handler: () => executeTool('analyze_project', { path: '.' })
    },
    {
        name: '/git',
        description: '🔧 Show git status',
        handler: () => executeTool('git_status', {}) || '(clean)'
    },
    {
        name: '/todos',
        description: '📝 Find TODO comments',
        handler: () => executeTool('find_todos', { path: '.' })
    },
    {
        name: '/doctor',
        description: '🏥 Diagnose Helios issues',
        handler: () => {
            const { key, provider } = getApiKey();
            const issues: string[] = [];

            if (!key) issues.push('❌ No API key configured');
            if (provider === 'none') issues.push('❌ No provider available');

            if (issues.length === 0) {
                return chalk.green('✓ All systems operational') + `\n  Provider: ${provider}`;
            }
            return issues.join('\n');
        }
    },
    {
        name: '/yolo',
        description: '⚡ Toggle auto-approve mode (skip permission prompts)',
        handler: (_args, state) => {
            const enabled = toggleAutoApprove(state.permissions);
            return enabled ?
                chalk.yellow('⚡ YOLO MODE: Auto-approving all actions') :
                chalk.green('✓ Permission prompts re-enabled');
        }
    },
    {
        name: '/exit',
        description: '👋 Exit Helios',
        handler: () => 'EXIT'
    }
];

async function showSlashMenu(prefix: string = ''): Promise<string> {
    const filterText = prefix.replace('/', '').toLowerCase();

    if (filterText) {
        const matches = SLASH_COMMANDS.filter(c =>
            c.name.slice(1).toLowerCase().startsWith(filterText) ||
            c.description.toLowerCase().includes(filterText)
        );
        if (matches.length === 1) {
            return matches[0].name;
        }
        const exact = SLASH_COMMANDS.find(c => c.name === prefix);
        if (exact) return exact.name;
    }

    const choice = await search({
        message: accentGradient('⚡ Commands'),
        source: async (searchInput: string | undefined) => {
            const searchTerm = (searchInput || filterText || '').toLowerCase();
            const filtered = SLASH_COMMANDS.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.description.toLowerCase().includes(searchTerm)
            );
            const seen = new Set<string>();
            return filtered
                .filter(c => {
                    if (seen.has(c.name)) return false;
                    seen.add(c.name);
                    return true;
                })
                .map(c => ({
                    name: `${c.name.padEnd(12)} ${chalk.dim(c.description)}`,
                    value: c.name
                }));
        }
    });
    return choice;
}

async function handleSlashCommand(cmdName: string, state: ChatState): Promise<string | null> {
    const cmd = SLASH_COMMANDS.find(c => c.name === cmdName);
    if (!cmd) return null;
    const result = await cmd.handler('', state);
    return result;
}

// ==================== STREAMING AGENT ====================

async function runAgentStreaming(
    state: ChatState,
    userMessage: string
): Promise<void> {
    state.messages.push({ role: 'user', content: userMessage });
    let iterations = 0;
    const maxIterations = 15;

    const provider = await getProvider();
    const timeout = config.get('TIMEOUT') || 60000;
    const maxRetries = config.get('MAX_RETRIES') || 3;

    // Convert tools to provider format
    const providerTools: Tool[] = tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
    }));

    while (iterations < maxIterations) {
        iterations++;

        const spinner = ora({
            text: chalk.dim('Thinking...'),
            color: 'cyan',
            spinner: 'dots2'
        }).start();

        try {
            let fullContent = '';
            const pendingToolCalls: Array<{ id: string; name: string; arguments: string }> = [];

            // Use streaming
            if (state.streaming) {
                spinner.stop();
                process.stdout.write(successGradient('\n'));

                for await (const chunk of provider.stream(state.messages, providerTools, { timeout })) {
                    if (chunk.type === 'text' && chunk.content) {
                        process.stdout.write(chunk.content);
                        fullContent += chunk.content;
                    } else if (chunk.type === 'tool_call' && chunk.toolCall) {
                        pendingToolCalls.push(chunk.toolCall);
                    } else if (chunk.type === 'error') {
                        console.log(chalk.red(`\nError: ${chunk.error}`));
                        return;
                    }
                }

                if (fullContent) {
                    console.log(); // New line after streaming
                }
            } else {
                // Non-streaming with retry
                const response = await withRetry(
                    () => provider.chat(state.messages, providerTools, { timeout }),
                    { maxRetries }
                );

                spinner.stop();

                if (response.content) {
                    console.log(successGradient('\n' + response.content));
                    fullContent = response.content;
                }

                if (response.toolCalls?.length) {
                    for (const tc of response.toolCalls) {
                        pendingToolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        });
                    }
                }
            }

            // Handle tool calls
            if (pendingToolCalls.length > 0) {
                state.messages.push({
                    role: 'assistant',
                    content: fullContent || null,
                    tool_calls: pendingToolCalls.map(tc => ({
                        id: tc.id,
                        type: 'function' as const,
                        function: { name: tc.name, arguments: tc.arguments }
                    }))
                });

                for (const toolCall of pendingToolCalls) {
                    const args = JSON.parse(toolCall.arguments || '{}');

                    // Loop Detection
                    const loopCheck = loopDetector.check(toolCall.name, args);
                    if (loopCheck.isLoop && loopCheck.risk === 'high') {
                        console.log('\n' + warningGradient(`⚠️  ${loopCheck.message}`));
                        auditLogger.log({
                            action: toolCall.name,
                            args,
                            result: 'blocked',
                            supervision: { loopDetected: true }
                        });
                        state.messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: 'LOOP DETECTED: Try a different approach.'
                        });
                        continue;
                    }

                    // Security Scan
                    if (toolCall.name === 'write_file' && args.content) {
                        const scanResult = securityScanner.scan(args.content);
                        if (!scanResult.approved) {
                            console.log('\n' + warningGradient('🔒 Security blocked'));
                            state.messages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                content: `BLOCKED: ${scanResult.issues[0].message}`
                            });
                            continue;
                        }
                    }

                    if (toolCall.name === 'run_command') {
                        const cmdScan = securityScanner.scanCommand(args.command);
                        if (!cmdScan.approved) {
                            console.log('\n' + warningGradient(`🔒 Blocked: ${cmdScan.issues[0].message}`));
                            state.messages.push({
                                role: 'tool',
                                tool_call_id: toolCall.id,
                                content: `BLOCKED`
                            });
                            continue;
                        }
                    }

                    // Permission check
                    const permission = await checkPermission(toolCall.name, args, state.permissions);
                    if (!permission.approved) {
                        console.log(chalk.yellow(`\n⏭️  Skipped: ${toolCall.name}`));
                        state.messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: 'User denied permission. Try a different approach or explain why this is needed.'
                        });
                        continue;
                    }

                    // Execute tool
                    console.log(chalk.yellow(`\n⚡ ${toolCall.name}`) + chalk.dim(` ${JSON.stringify(args).slice(0, 50)}...`));
                    const result = await executeTool(toolCall.name, args);
                    if (!state.compact) {
                        console.log(chalk.dim(result.slice(0, 200) + (result.length > 200 ? '...' : '')));
                    }
                    auditLogger.log({ action: toolCall.name, args, result: 'success' });
                    state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
                }
                continue; // Continue loop to get assistant's response after tool execution
            }

            // No tool calls - conversation complete
            state.messages.push({ role: 'assistant', content: fullContent });
            break;

        } catch (error: any) {
            spinner.stop();

            if (error.message?.includes('timed out')) {
                console.log(chalk.red(`\n⏱️  Request timed out. Try a shorter prompt or check your connection.`));
            } else {
                console.log(chalk.red(`\nError: ${error.message}`));
            }
            break;
        }
    }

    if (iterations >= maxIterations) {
        console.log(warningGradient('\n⚠️  Max iterations reached. Stopping to prevent infinite loop.'));
    }
}

// ==================== MAIN CHAT ====================

export async function chat(singlePrompt?: string): Promise<void> {
    const { key, provider } = getApiKey();

    if (!key) {
        console.log(chalk.red('\n✗ No API key configured!'));
        console.log(chalk.dim('Run: helios config set OPENROUTER_API_KEY sk-or-...'));
        console.log(chalk.dim('Or:  helios config set ANTHROPIC_API_KEY sk-ant-...\n'));
        return;
    }

    const streamingEnabled = config.get('STREAMING') ?? true;
    const streamingStatus = streamingEnabled ? chalk.green('Streaming') : chalk.dim('Non-streaming');

    console.log(chalk.dim(`Using ${provider} • ${streamingStatus} • Supervision: `) + chalk.green('Active'));
    console.log(chalk.dim('Type / for commands\n'));

    const state: ChatState = {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
        compact: config.get('COMPACT_MODE') ?? false,
        streaming: streamingEnabled,
        permissions: createPermissionState()
    };

    loopDetector.reset();

    // Single prompt mode
    if (singlePrompt) {
        await runAgentStreaming(state, singlePrompt);
        return;
    }

    // Interactive mode
    while (true) {
        try {
            const userInput = await input({ message: chalk.cyan('❯') });

            if (!userInput.trim()) continue;

            // Slash command handling
            if (userInput.startsWith('/')) {
                const directResult = await handleSlashCommand(userInput, state);
                if (directResult !== null) {
                    if (directResult === 'EXIT') break;
                    console.log('\n' + directResult + '\n');
                    continue;
                }

                const cmd = await showSlashMenu(userInput);
                const result = await handleSlashCommand(cmd, state);
                if (result === 'EXIT') break;
                if (result) console.log('\n' + result + '\n');
                continue;
            }

            if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) {
                break;
            }

            await runAgentStreaming(state, userInput);

        } catch (error: any) {
            if (error.message?.includes('cancelled')) {
                continue;
            }
            console.log(chalk.red(`Error: ${error.message}`));
        }
    }

    console.log(chalk.dim('\nGoodbye!\n'));
}
