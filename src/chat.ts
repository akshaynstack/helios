import OpenAI from 'openai';
import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import * as readline from 'readline';
import { select, input } from '@inquirer/prompts';
import { config, getApiKey } from './config.js';
import { tools, executeTool } from './tools.js';
import { loopDetector, securityScanner, auditLogger } from './supervision/index.js';

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

interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
}

const warningGradient = gradient(['#ff6b6b', '#feca57']);
const successGradient = gradient(['#00d2ff', '#3a7bd5']);
const accentGradient = gradient(['#667eea', '#764ba2']);

// ==================== SLASH COMMANDS ====================

interface SlashCommand {
    name: string;
    description: string;
    handler: (args: string, state: any) => string | Promise<string>;
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
            return `Provider: ${provider} | Messages: ${state.messages.length} | Actions: ${stats.total}`;
        }
    },
    {
        name: '/model',
        description: '🤖 Change AI model',
        handler: async () => {
            const models = [
                { name: 'Gemini 2.0 Flash (Free)', value: 'google/gemini-2.0-flash-exp:free' },
                { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
                { name: 'GPT-4o', value: 'openai/gpt-4o' },
                { name: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
                { name: 'Llama 3.1 70B', value: 'meta-llama/llama-3.1-70b-instruct' }
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
        name: '/compact',
        description: '📦 Toggle compact output mode',
        handler: (_args, state) => {
            state.compact = !state.compact;
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
        name: '/exit',
        description: '👋 Exit Helios',
        handler: () => 'EXIT'
    }
];

async function showSlashMenu(): Promise<string> {
    const choice = await select({
        message: accentGradient('⚡ Commands'),
        choices: SLASH_COMMANDS.map(c => ({
            name: `${c.name.padEnd(12)} ${chalk.dim(c.description)}`,
            value: c.name
        }))
    });
    return choice;
}

async function handleSlashCommand(cmdName: string, state: any): Promise<string | null> {
    const cmd = SLASH_COMMANDS.find(c => c.name === cmdName);
    if (!cmd) return null;

    const result = await cmd.handler('', state);
    return result;
}

// ==================== MAIN CHAT ====================

export async function chat(singlePrompt?: string): Promise<void> {
    const { key, provider } = getApiKey();

    if (!key) {
        console.log(chalk.red('\n✗ No API key configured!'));
        console.log(chalk.dim('Run: helios config set OPENROUTER_API_KEY sk-or-...\n'));
        return;
    }

    console.log(chalk.dim(`Using ${provider} • Supervision: `) + chalk.green('Active'));
    console.log(chalk.dim('Type / for commands\n'));

    const openai = new OpenAI({
        apiKey: key,
        baseURL: provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined
    });

    const state = {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }] as Message[],
        compact: false
    };

    const openaiTools = tools.map(t => ({
        type: 'function' as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }
    }));

    loopDetector.reset();

    const runAgent = async (userMessage: string) => {
        state.messages.push({ role: 'user', content: userMessage });
        let iterations = 0;
        const maxIterations = 10;

        while (iterations < maxIterations) {
            iterations++;
            const model = config.get('MODEL') || 'google/gemini-2.0-flash-exp:free';
            const spinner = ora({ text: 'Thinking...', color: 'cyan' }).start();

            try {
                const response = await openai.chat.completions.create({
                    model,
                    messages: state.messages as any,
                    tools: openaiTools,
                    stream: false
                });

                spinner.stop();

                const choice = response.choices[0];
                const assistantMessage = choice.message;

                if (assistantMessage.content) {
                    console.log(successGradient('\n' + assistantMessage.content));
                }

                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    state.messages.push({
                        role: 'assistant',
                        content: assistantMessage.content,
                        tool_calls: assistantMessage.tool_calls
                    });

                    for (const toolCall of assistantMessage.tool_calls) {
                        const fn = (toolCall as any).function;
                        const args = JSON.parse(fn.arguments || '{}');

                        // Loop Detection
                        const loopCheck = loopDetector.check(fn.name, args);
                        if (loopCheck.isLoop && loopCheck.risk === 'high') {
                            console.log('\n' + warningGradient(`⚠️  ${loopCheck.message}`));
                            auditLogger.log({ action: fn.name, args, result: 'blocked', supervision: { loopDetected: true } });
                            state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'LOOP DETECTED: Try a different approach.' });
                            continue;
                        }

                        // Security Scan
                        if (fn.name === 'write_file' && args.content) {
                            const scanResult = securityScanner.scan(args.content);
                            if (!scanResult.approved) {
                                console.log('\n' + warningGradient('🔒 Security blocked'));
                                state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: `BLOCKED: ${scanResult.issues[0].message}` });
                                continue;
                            }
                        }

                        if (fn.name === 'run_command') {
                            const cmdScan = securityScanner.scanCommand(args.command);
                            if (!cmdScan.approved) {
                                console.log('\n' + warningGradient(`🔒 Blocked: ${cmdScan.issues[0].message}`));
                                state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: `BLOCKED` });
                                continue;
                            }
                        }

                        // Execute
                        console.log(chalk.yellow(`\n⚡ ${fn.name}`) + chalk.dim(` ${JSON.stringify(args).slice(0, 40)}...`));
                        const result = executeTool(fn.name, args);
                        if (!state.compact) {
                            console.log(chalk.dim(result.slice(0, 150) + (result.length > 150 ? '...' : '')));
                        }
                        auditLogger.log({ action: fn.name, args, result: 'success' });
                        state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
                    }
                    continue;
                }

                state.messages.push({ role: 'assistant', content: assistantMessage.content || '' });
                break;

            } catch (error: any) {
                spinner.stop();
                console.log(chalk.red(`\nError: ${error.message}`));
                break;
            }
        }
    };

    // Single prompt mode
    if (singlePrompt) {
        await runAgent(singlePrompt);
        return;
    }

    // Interactive mode
    while (true) {
        try {
            const userInput = await input({ message: chalk.cyan('❯') });

            if (!userInput.trim()) continue;

            // Slash command - show menu
            if (userInput === '/') {
                const cmd = await showSlashMenu();
                const result = await handleSlashCommand(cmd, state);
                if (result === 'EXIT') break;
                if (result) console.log('\n' + result + '\n');
                continue;
            }

            // Direct slash command
            if (userInput.startsWith('/')) {
                const result = await handleSlashCommand(userInput, state);
                if (result === 'EXIT') break;
                if (result) console.log('\n' + result + '\n');
                else console.log(chalk.yellow(`Unknown: ${userInput}. Type / for menu.`));
                continue;
            }

            if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) {
                break;
            }

            await runAgent(userInput);

        } catch (error: any) {
            if (error.message?.includes('cancelled')) {
                continue;
            }
            console.log(chalk.red(`Error: ${error.message}`));
        }
    }

    console.log(chalk.dim('\nGoodbye!\n'));
}
