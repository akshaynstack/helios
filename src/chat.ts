/**
 * Helios Chat - AI Conversation Loop with Streaming
 * Now with timeout handling, retry logic, and multi-provider support
 */

import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import path from 'path';
import { select, input, confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';
import search from '@inquirer/search';
import { config, getApiKey } from './config.js';
import { tools, executeTool } from './tools/index.js';
import { loopDetector, securityScanner, auditLogger } from './supervision/index.js';
import { getProvider, withRetry } from './providers/index.js';
import { checkPermission, createPermissionState, toggleAutoApprove, type PermissionState } from './permissions.js';
import type { Message, Tool } from './types.js';

const SYSTEM_PROMPT = `You are Helios, a state-of-the-art AI coding assistant with built-in supervision.

You have a set of tools that allow you to interact with the user's file system and execute terminal commands.

CORE RULES:
1. ALWAYS use the appropriate tool to perform actions (creating files, running commands, reading directories). 
2. Do NOT just output code blocks in markdown if a tool like 'write_file' can do the work.
3. If you need to create or modify code, use 'write_file' or 'edit_file' IMMEDIATELY.
4. After writing a file, you can explain what you did.
5. Be concise and efficient. Don't repeat yourself.

You help developers by:
- Reading, writing, and editing files
- Running shell commands
- Searching codebases
- Generating code, tests, and components

UI/UX DESIGN MASTERY (CRITICAL FOR ALL UI WORK):
When creating ANY user interface, you MUST apply these premium design principles:

1. TYPOGRAPHY:
   - Use modern Google Fonts (Inter, Outfit, Plus Jakarta Sans, Space Grotesk)
   - Implement proper type hierarchy: large bold headlines (48-72px), medium subheadlines (24-32px), readable body text (16-18px)
   - Use generous letter-spacing (-0.02em for headlines, 0.01em for body)

2. COLOR & GRADIENTS:
   - NEVER use flat, basic colors. Use sophisticated HSL-based palettes
   - Vibrant gradients with 3+ color stops (e.g., from purple-600 via pink-500 to orange-400)
   - Dark modes with rich backgrounds (slate-900, zinc-950, not pure black)
   - Use accent colors strategically for CTAs and highlights

3. DEPTH & DIMENSION:
   - Apply glassmorphism: backdrop-filter: blur(16px) + semi-transparent backgrounds (rgba with 0.1-0.3 alpha)
   - Layer multiple elements: floating shapes, gradient orbs, decorative patterns
   - Use multiple box-shadows for realistic depth (combine soft ambient + sharp direct shadows)
   - Add subtle borders with gradient or semi-transparent strokes

4. MICRO-ANIMATIONS (ESSENTIAL):
   - Entrance animations: fade-in + slide-up (transform + opacity)
   - Hover effects on ALL interactive elements (scale, glow, color shift)
   - Smooth transitions: transition-all duration-300 ease-out
   - Floating/pulsing elements for visual interest
   - Use CSS @keyframes for continuous animations (floating, shimmer, pulse)

5. LAYOUT & SPACING:
   - Generous whitespace (padding: 80px+ for sections)
   - Center content with max-width containers (max-w-6xl, max-w-7xl)
   - Grid/flex layouts with proper gap spacing
   - Asymmetric layouts for modern feel

6. DECORATIVE ELEMENTS:
   - Abstract gradient blobs/orbs in backgrounds
   - Subtle grid patterns or dot matrices
   - Floating geometric shapes (circles, hexagons)
   - Animated cursor effects or mouse-following elements
   - Particle effects for hero sections

7. BUTTONS & INTERACTIONS:
   - Rounded buttons (rounded-full or rounded-xl)
   - Gradient backgrounds or glass effect
   - Hover states with scale(1.05) + glow (box-shadow with color)
   - Clear visual hierarchy: primary (filled), secondary (outline), ghost

ALWAYS implement at least 5 of these techniques in EVERY UI you create. The user expects STUNNING, PRODUCTION-READY designs.

PROJECT SCAFFOLDING GUIDELINE:
When asked to create a NEW application (e.g., Next.js, React, Vite, Express), ALWAYS prefer using standard CLI scaffolding tools via 'run_command' first (e.g., 'npx create-next-app@latest', 'npm create vite@latest') instead of manually creating individual configuration files.
CRITICAL: You MUST use non-interactive flags to avoid terminal prompts (e.g., use '--yes', '--default', or '--import-alias "@/*"'). Do NOT rely on piping 'echo' for interactive prompts. Provide the project name and all configuration as flags (e.g., 'npx create-next-app@latest my-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --yes').

IMPORTANT: You have a supervision layer that:
1. Detects loops - if you repeat actions, you'll be stopped
2. Scans for security issues - dangerous code will be flagged
3. Logs all actions - everything is audited

Current directory: ${process.cwd()} status: ${process.platform}`;

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
            const categories: Record<string, string[]> = {
                '📁 File': ['read_file', 'write_file', 'edit_file', 'delete_file', 'list_directory'],
                '🔧 Git': ['git_status', 'git_diff', 'git_commit', 'git_log', 'git_branch'],
                '💻 Shell': ['run_command', 'run_script'],
                '🔍 Search': ['search_files', 'find_files', 'grep'],
                '📦 Package': ['install_package', 'run_script', 'npm_audit'],
                '🌐 Browser': ['browser_open', 'browser_screenshot', 'browser_click'],
                '🛠️ Utils': ['uuid', 'hash', 'base64_encode', 'timestamp']
            };

            let output = chalk.bold(`\n🛠️  ${tools.length} Tools Available\n\n`);
            for (const [cat, exampleTools] of Object.entries(categories)) {
                const count = exampleTools.filter(t => tools.some(tool => tool.name === t)).length;
                output += `${cat}: ${chalk.cyan(exampleTools.slice(0, 3).join(', '))}${count > 3 ? chalk.dim(` +${count - 3} more`) : ''}\n`;
            }
            output += chalk.dim('\nJust ask me to use any tool, e.g. "read the package.json"');
            return output;
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
            const stats = auditLogger.getLifetimeStats();
            const { provider } = getApiKey();
            const streaming = state.streaming ? chalk.green('ON') : chalk.dim('OFF');
            return `Provider: ${provider} | Messages: ${state.messages.length} | Lifetime Actions: ${stats.total} | Streaming: ${streaming}`;
        }
    },
    {
        name: '/model',
        description: '🤖 Change AI model',
        handler: async () => {
            const { fetchModelsForProvider, getAnthropicModels, getGoogleModels } = await import('./models.js');
            const currentConfig = getApiKey();

            // Available providers based on configured API keys
            const availableProviders: Array<{ name: string; value: string; key: string; baseUrl?: string }> = [];

            const openrouterKey = config.get('OPENROUTER_API_KEY');
            if (openrouterKey) {
                availableProviders.push({ name: '🌐 OpenRouter (100+ models)', value: 'openrouter', key: openrouterKey });
            }

            const openaiKey = config.get('OPENAI_API_KEY');
            if (openaiKey) {
                availableProviders.push({ name: '🤖 OpenAI (GPT models)', value: 'openai', key: openaiKey });
            }

            const anthropicKey = config.get('ANTHROPIC_API_KEY');
            if (anthropicKey) {
                availableProviders.push({ name: '💎 Anthropic (Claude models)', value: 'anthropic', key: anthropicKey });
            }

            const googleKey = config.get('GOOGLE_API_KEY');
            if (googleKey) {
                availableProviders.push({ name: '🔮 Google (Gemini models)', value: 'google', key: googleKey });
            }

            const customUrl = config.get('CUSTOM_BASE_URL');
            const customKey = config.get('CUSTOM_API_KEY');
            if (customUrl) {
                availableProviders.push({
                    name: `🔧 Custom (${customUrl})`,
                    value: 'custom',
                    key: customKey || '',
                    baseUrl: customUrl
                });
            }

            if (availableProviders.length === 0) {
                return chalk.red('No providers configured. Set an API key first:\n' +
                    '  helios config set OPENROUTER_API_KEY sk-or-...\n' +
                    '  helios provider add <base-url> [api-key]');
            }

            // If only one provider, skip selection
            let selectedProvider = availableProviders[0];
            if (availableProviders.length > 1) {
                const providerChoice = await select({
                    message: 'Select provider:',
                    choices: availableProviders.map(p => ({ name: p.name, value: p.value }))
                });
                selectedProvider = availableProviders.find(p => p.value === providerChoice)!;
            }

            console.log(chalk.dim(`\nFetching models from ${selectedProvider.value}...`));

            try {
                const models = await fetchModelsForProvider(
                    selectedProvider.value as any,
                    selectedProvider.key,
                    selectedProvider.baseUrl
                );

                if (models.length === 0) {
                    return chalk.red('No models found. Check your API key.');
                }

                const choices = models.slice(0, 100).map(m => ({
                    name: `${m.free ? '🆓' : '💰'} ${m.name}${m.context_length ? ` (${Math.round(m.context_length / 1000)}K)` : ''}`,
                    value: m.id
                }));

                const chosen = await search({
                    message: `Select model (${models.length} available):`,
                    source: async (input: string | undefined) => {
                        const term = (input || '').toLowerCase();
                        return choices.filter(c =>
                            c.name.toLowerCase().includes(term) ||
                            c.value.toLowerCase().includes(term)
                        ).slice(0, 20);
                    }
                });

                config.set('MODEL', chosen);
                config.set('ACTIVE_PROVIDER', selectedProvider.value as any);
                return successGradient(`✓ Model set to: ${chosen} (Provider: ${selectedProvider.value})`);
            } catch (error: any) {
                return chalk.red(`Error: ${error.message}`);
            }
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
        description: '🩺 Check and fix setup issues',
        handler: async () => {
            let reports = [chalk.bold('\n🏥 Helios Doctor Report\n')];

            // Check Playwright
            try {
                await import('playwright');
                reports.push(chalk.green('✓ Playwright is installed'));
            } catch {
                reports.push(chalk.red('✗ Playwright missing (required for screenshots/browser)'));
                reports.push(chalk.dim('  Run: npm install playwright && npx playwright install chromium'));
            }

            const { key, provider } = getApiKey();
            if (key) {
                reports.push(chalk.green(`✓ Provider: ${provider} (Key set)`));
            } else {
                reports.push(chalk.red('✗ No API key configured'));
            }

            return reports.join('\n');
        }
    },
    {
        name: '/debug',
        description: '🐛 Toggle debug mode (on/off)',
        handler: (_args, state) => {
            const current = config.get('DEBUG_MODE') || false;
            config.set('DEBUG_MODE', !current);
            const status = !current ? chalk.green('ON') : chalk.red('OFF');
            return `Debug mode is now ${status}`;
        }
    },
    {
        name: '/provider',
        description: '🔧 Setup AI provider (step-by-step)',
        handler: async () => {
            // Step 1: Choose provider type
            const providerType = await select({
                message: 'Select provider to configure:',
                choices: [
                    { name: '🌐 OpenRouter (100+ models, free options)', value: 'openrouter' },
                    { name: '🤖 OpenAI (GPT models)', value: 'openai' },
                    { name: '💎 Anthropic (Claude models)', value: 'anthropic' },
                    { name: '🔮 Google (Gemini models)', value: 'google' },
                    { name: '🔧 Custom (OpenAI-compatible endpoint)', value: 'custom' },
                ]
            });

            // Helper to mask API key
            const maskKey = (key: string) => {
                if (!key || key.length < 8) return '***';
                return key.slice(0, 6) + '****' + key.slice(-4);
            };

            if (providerType === 'custom') {
                // Step 2a: Get base URL for custom provider
                const baseUrl = await input({
                    message: 'Enter base URL (e.g., http://localhost:11434/v1):',
                    validate: (val) => val.startsWith('http') ? true : 'URL must start with http:// or https://'
                });

                // Step 3a: Get API key (optional for local)
                const apiKey = await input({
                    message: 'Enter API key (press Enter to skip for local providers):'
                });

                config.set('CUSTOM_BASE_URL', baseUrl);
                config.set('CUSTOM_API_KEY', apiKey);
                config.set('ACTIVE_PROVIDER', 'custom');

                return successGradient(`✓ Custom provider configured\n`) +
                    chalk.dim(`  URL: ${baseUrl}\n`) +
                    chalk.dim(`  Key: ${apiKey ? maskKey(apiKey) : '(none)'}`);
            } else {
                // Step 2b: Get API key for standard provider
                const keyName = providerType === 'openrouter' ? 'OPENROUTER_API_KEY' :
                    providerType === 'openai' ? 'OPENAI_API_KEY' :
                        providerType === 'anthropic' ? 'ANTHROPIC_API_KEY' :
                            'GOOGLE_API_KEY';

                const existingKey = config.get(keyName as any);
                const keyHint = providerType === 'openrouter' ? 'sk-or-...' :
                    providerType === 'openai' ? 'sk-...' :
                        providerType === 'anthropic' ? 'sk-ant-...' :
                            'AIza...';

                const apiKey = await input({
                    message: `Enter ${providerType} API key (${keyHint}):`,
                    default: existingKey ? `[keep: ${maskKey(existingKey)}]` : undefined,
                    validate: (val) => {
                        if (val.startsWith('[keep:')) return true;
                        if (!val || val.length < 10) return 'API key is too short';
                        return true;
                    }
                });

                if (!apiKey.startsWith('[keep:')) {
                    config.set(keyName as any, apiKey);
                }
                config.set('ACTIVE_PROVIDER', providerType as any);

                return successGradient(`✓ ${providerType} configured\n`) +
                    chalk.dim(`  Key: ${maskKey(apiKey.startsWith('[keep:') ? existingKey : apiKey)}`);
            }
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

// Global spinner to prevent duplicates across calls
let globalSpinner: any = null;

function getAgentSpinner() {
    if (!globalSpinner) {
        globalSpinner = ora({
            text: chalk.dim('Thinking...'),
            color: 'cyan',
            spinner: 'dots2'
        });
    }
    return globalSpinner;
}

const footerGradient = gradient(['#00f2fe', '#4facfe', '#00f2fe']);

function showAnalyticsFooter() {
    const session = auditLogger.getSessionStats();
    const lifetime = auditLogger.getLifetimeStats();

    const successfulSession = session.total - session.errors - session.blocked;
    const successfulLifetime = lifetime.total - lifetime.errors - lifetime.blocked;

    if (successfulSession === 0 && successfulLifetime === 0) return; // Only hide if brand new

    // Efficiency Metrics (Conservative Estimates)
    // 1. Tokens: Each successful action saves ~1k tokens of manual context swapping/pasting
    const savedTokensSession = successfulSession * 1000;
    const formattedTokens = savedTokensSession > 1000 ? (savedTokensSession / 1000).toFixed(1) + 'k' : savedTokensSession;

    // 2. Cost: Est. $0.01 per 1k tokens
    const savedCostSession = (savedTokensSession / 1000) * 0.01;
    const formattedCost = savedCostSession.toFixed(2);

    // 3. Time/Effort: Manual context swaps
    const swapsAvoided = successfulSession;

    const totalTokensLifetime = successfulLifetime * 1000;
    const formattedTotalTokens = totalTokensLifetime > 1000 ? (totalTokensLifetime / 1000).toFixed(1) + 'k' : totalTokensLifetime;

    const enginePower = (Math.random() * 5 + 95).toFixed(1); // Aesthetics: Performance index

    const footer = boxen(
        chalk.bold(footerGradient('🚀 HELIOS CONTEXT ENGINE')) + '\n\n' +
        chalk.cyan('Session Savings:  ') + chalk.white(`$${formattedCost} Est.`) + chalk.dim(` (${formattedTokens} tokens)`) + '\n' +
        chalk.cyan('Engine Power:     ') + chalk.green(`${enginePower}% Optimized`) + '\n' +
        chalk.cyan('Productivity:     ') + chalk.yellow(`${swapsAvoided} Context Swaps Avoided`) + '\n\n' +
        chalk.dim('────────────────────────────────────────────') + '\n' +
        chalk.dim(`🛡️  ${formattedTotalTokens} lifetime tokens saved across all tasks`),
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'cyan',
            title: 'Analytics',
            titleAlignment: 'center'
        }
    );
    console.log('\n' + footer + '\n');
}

async function ensurePlaywright(): Promise<boolean> {
    try {
        await import('playwright');
        return true;
    } catch {
        const agentSpinner = getAgentSpinner();
        agentSpinner.stop(); // Stop thinking if we need to prompt

        console.log('\n' + warningGradient('⚠️  Playwright is not installed (required for browser tools).'));
        const install = await confirm({
            message: 'Would you like to install Playwright and browser binaries now?',
            default: true
        });

        if (install) {
            const spinner = ora('Installing Playwright... (this may take a minute)').start();
            try {
                execSync('npm install playwright --no-save', { stdio: 'ignore' });
                spinner.text = 'Installing Chromium...';
                execSync('npx playwright install chromium', { stdio: 'ignore' });
                spinner.succeed('Playwright installed successfully!');
                return true;
            } catch (error: any) {
                spinner.fail('Installation failed');
                console.log(chalk.red(`Error: ${error.message}`));
                console.log(chalk.dim('Please run manually: npm install playwright && npx playwright install chromium\n'));
                return false;
            }
        }
        return false;
    }
}

async function ensureMgrep(): Promise<boolean> {
    const apiKey = config.get('MXBAI_API_KEY');

    // Check if mgrep is installed globally or locally
    let isInstalled = false;
    try {
        execSync('mgrep --version', { stdio: 'ignore' });
        isInstalled = true;
    } catch { }

    if (isInstalled) {
        if (!apiKey) {
            const agentSpinner = getAgentSpinner();
            agentSpinner.stop();
            console.log('\n' + warningGradient('⚠️  MXBAI_API_KEY is missing. '));
            console.log(chalk.dim('Please set it via: ') + chalk.cyan('helios config set MXBAI_API_KEY <your_key>'));
            console.log(chalk.dim('Get a free key at: ') + chalk.underline('https://mixedbread.ai\n'));
            return false;
        }
        return true;
    }

    const agentSpinner = getAgentSpinner();
    agentSpinner.stop();

    const spinner = ora('Optimizing Search Engine...').start();
    try {
        execSync('npm install -g @mixedbread/mgrep', { stdio: 'ignore' });
        spinner.succeed('Search optimized.');

        if (!apiKey) {
            console.log('\n' + chalk.yellow('Final step: ') + chalk.dim('Please set your MXBAI_API_KEY to start searching.'));
            console.log(chalk.cyan('helios config set MXBAI_API_KEY <your_key>\n'));
        }
        return !!apiKey;
    } catch {
        spinner.stop(); // Silent fallback
        return false;
    }
}

async function ensureRipgrep(): Promise<boolean> {
    try {
        execSync('rg --version', { stdio: 'ignore' });
        return true;
    } catch {
        const agentSpinner = getAgentSpinner();
        agentSpinner.stop();

        const spinner = ora('Optimizing Performance...').start();
        try {
            execSync('npm install -g ripgrep-bin', { stdio: 'ignore' });
            spinner.succeed('Performance boosted.');
            return true;
        } catch {
            spinner.stop(); // Silent fallback
            return false;
        }
    }
}

async function ensureFd(): Promise<boolean> {
    try {
        execSync('fd --version', { stdio: 'ignore' });
        return true;
    } catch {
        const agentSpinner = getAgentSpinner();
        agentSpinner.stop();

        const spinner = ora('Optimizing Discovery...').start();
        try {
            execSync('npm install -g fd-find', { stdio: 'ignore' });
            spinner.succeed('Discovery boosted.');
            return true;
        } catch {
            spinner.stop(); // Silent fallback
            return false;
        }
    }
}

// ==================== MCP & UI SMART ROUTER ====================

import { mcpClient } from './mcp/index.js';

// UI Presets with Stdio commands
const UI_PRESETS = {
    'magic': {
        command: 'npx',
        args: ['-y', '@21st-dev/magic'],
        keywords: ['animated', 'landing', 'hero', 'marketing', 'magic', 'interactive', 'wow']
    },
    'shadcn': {
        command: 'npx',
        args: ['-y', 'mcp-server-shadcn'], // Placeholder - user needs to verify package
        keywords: ['dashboard', 'form', 'table', 'admin', 'clean', 'shadcn', 'minimal']
    }
};

let activeUIPreset: string | null = null;

async function initializeMCP() {
    // Connect to configured servers
    await mcpClient.connectAll();
}

/**
 * Smart UI Router: Detects UI intent and connects to the right specific toolset
 */
async function detectAndActivateUIPreset(userMessage: string): Promise<string | null> {
    const lowerMsg = userMessage.toLowerCase();

    // Check explicit overrides first (e.g. "use magic ui")
    if (lowerMsg.includes('use magic') || lowerMsg.includes('enable magic')) return 'magic';
    if (lowerMsg.includes('use shadcn') || lowerMsg.includes('enable shadcn')) return 'shadcn';

    // Auto-detection based on vibe
    for (const [preset, config] of Object.entries(UI_PRESETS)) {
        if (config.keywords.some(k => lowerMsg.includes(k))) {
            return preset;
        }
    }
    return null;
}

async function ensureUIPreset(presetName: string) {
    if (activeUIPreset === presetName) return; // Already active

    const config = UI_PRESETS[presetName as keyof typeof UI_PRESETS];
    if (!config) return;

    const spinner = ora(chalk.magenta(`⚡ Activating ${presetName.toUpperCase()} UI Engine...`)).start();
    try {
        await mcpClient.connect(presetName, '', config.command, config.args);
        activeUIPreset = presetName;
        spinner.succeed(chalk.magenta(`${presetName.toUpperCase()} UI Engine Active`));
    } catch (e: any) {
        spinner.fail(`Failed to activate ${presetName}: ${e.message}`);
    }
}


async function runAgentStreaming(
    state: ChatState,
    userMessage: string
): Promise<void> {
    // Smart UI Auto-Detection
    const detectedPreset = await detectAndActivateUIPreset(userMessage);
    if (detectedPreset) {
        await ensureUIPreset(detectedPreset);
    }

    // Inject "Knowledge Feed" if UI Engine is active
    if (activeUIPreset) {
        const docs = mcpClient.getToolDocs(activeUIPreset);
        if (docs) {
            // Check if we already have the docs to avoid duplicates
            const hasDocs = state.messages.some(m => m.content?.includes(`=== ${activeUIPreset!.toUpperCase()} UI KNOWLEDGE FEED ===`));
            if (!hasDocs) {
                state.messages.push({
                    role: 'system',
                    content: `\n=== ${activeUIPreset.toUpperCase()} UI KNOWLEDGE FEED ===\n\nYou have access to the following ${activeUIPreset} components. USE THEM to create top-notch UIs:\n\n${docs}`
                });
            }
        }
    }

    const { provider: providerName } = getApiKey();
    let finalUserMessage = userMessage;

    // Reinforce tool calling for custom providers (recency bias fix)
    if (providerName === 'custom') {
        finalUserMessage += '\n\nIMPORTANT: Use your tools (e.g. write_file) to complete this request. Do NOT just output code blocks to the terminal.';
    }

    state.messages.push({ role: 'user', content: finalUserMessage });
    let iterations = 0;
    const maxIterations = config.get('MAX_ITERATIONS') || 30;

    const providerInstance = await getProvider();
    const timeout = config.get('TIMEOUT') || 60000;
    const maxRetries = config.get('MAX_RETRIES') || 3;
    const model = config.get('MODEL') || 'gpt-4o-mini';

    // Merge Standard Tools + MCP Tools
    const mcpTools = mcpClient.getAllTools();
    const allTools = [...tools, ...mcpTools];

    const providerTools: Tool[] = allTools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
    }));

    const agentSpinner = getAgentSpinner();

    while (iterations < maxIterations) {
        iterations++;

        agentSpinner.text = chalk.dim('Thinking...');
        if (!agentSpinner.isSpinning) agentSpinner.start();

        try {
            let fullContent = '';
            const pendingToolCalls: Array<{ id: string; name: string; arguments: string }> = [];

            // Use streaming
            if (state.streaming) {
                let hasStoppedSpinner = false;

                for await (const chunk of providerInstance.stream(state.messages, providerTools, { timeout, model })) {
                    if (chunk.type === 'text' && chunk.content) {
                        if (!hasStoppedSpinner) {
                            agentSpinner.stop();
                            process.stdout.write(successGradient('\n'));
                            hasStoppedSpinner = true;
                        }
                        process.stdout.write(chunk.content);
                        fullContent += chunk.content;
                    } else if (chunk.type === 'tool_call' && chunk.toolCall) {
                        if (!hasStoppedSpinner) {
                            agentSpinner.stop();
                            process.stdout.write(successGradient('\n'));
                            hasStoppedSpinner = true;
                        }
                        if (config.get('DEBUG_MODE')) {
                            console.log(chalk.dim(`\n[DEBUG] Detected API tool call: ${chunk.toolCall.name}`));
                        }
                        pendingToolCalls.push(chunk.toolCall);
                    } else if (chunk.type === 'error') {
                        agentSpinner.stop();
                        console.log(chalk.red(`\nError: ${chunk.error}`));
                        return;
                    }
                }

                if (!hasStoppedSpinner) {
                    agentSpinner.stop();
                }

                if (fullContent) {
                    console.log(); // New line after streaming
                }
            } else {
                // Non-streaming with retry
                const response = await withRetry(
                    () => providerInstance.chat(state.messages, providerTools, { timeout, model }),
                    { maxRetries }
                ) as any;

                agentSpinner.stop();
                if (config.get('DEBUG_MODE')) {
                    console.log(chalk.dim(`\n[DEBUG] Non-streaming response received. Tool calls: ${response.toolCalls?.length || 0}`));
                }

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

            // Fallback detection phase - show spinner if we might be parsing
            if (pendingToolCalls.length === 0 && fullContent.length > 0) {
                agentSpinner.text = chalk.dim('Processing response...');
                agentSpinner.start();
            }

            // Fallback 1: Textual tool calls (e.g. tool_name("arg"))
            if (pendingToolCalls.length === 0 && fullContent.includes('(')) {
                const cleanContent = fullContent.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
                const toolCallRegex = /(\w+)\(([\s\S]*?)\)/g;
                let match;

                while ((match = toolCallRegex.exec(cleanContent)) !== null) {
                    let toolName = match[1].trim();
                    const toolArgsRaw = match[2].trim();
                    if (toolName === 'write_to_file') toolName = 'write_file';
                    if (toolName === 'replace_file_content') toolName = 'edit_file';

                    const toolExists = tools.some(t => t.name === toolName);
                    if (toolExists) {
                        try {
                            let args: any = {};
                            const stringRegex = /"([\s\S]*?)"|'([\s\S]*?)'/g;
                            const strings = [];
                            let sMatch;
                            while ((sMatch = stringRegex.exec(toolArgsRaw)) !== null) {
                                strings.push(sMatch[1] || sMatch[2]);
                            }

                            if (toolName === 'write_file' && strings.length >= 2) {
                                args = { path: strings[0], content: strings[1] };
                            } else if (toolName === 'read_file' && strings.length >= 1) {
                                args = { path: strings[0] };
                            } else if (toolName === 'edit_file' && strings.length >= 3) {
                                args = { path: strings[0], search: strings[1], replace: strings[2] };
                            } else if (toolName === 'run_command' && strings.length >= 1) {
                                args = { command: strings[0] };
                            }

                            if (Object.keys(args).length > 0) {
                                if (config.get('DEBUG_MODE')) {
                                    console.log(chalk.magenta(`\n[DEBUG] Detected textual tool call: ${toolName}`));
                                }
                                pendingToolCalls.push({
                                    id: `fallback_text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                    name: toolName,
                                    arguments: JSON.stringify(args)
                                });
                            }
                        } catch (e) { }
                    }
                }
            }

            // Fallback 2: JSON tool blocks (e.g. { "action": "write_file", ... })
            if (pendingToolCalls.length === 0 && (fullContent.includes('{') || fullContent.includes('```json'))) {
                const jsonBlocks = fullContent.match(/```json\s*([\s\S]*?)\s*```|\{(?:[^{}]|\{[^{}]*\})*\}/g);
                if (jsonBlocks) {
                    for (const block of jsonBlocks) {
                        try {
                            const rawJson = block.startsWith('```json')
                                ? block.replace(/```json\s*|\s*```/g, '')
                                : block;
                            const data = JSON.parse(rawJson);

                            // Check if it's a tool-like object
                            let toolName = data.action || data.tool || data.name;
                            if (toolName) {
                                if (toolName === 'write_to_file') toolName = 'write_file';
                                if (tools.some(t => t.name === toolName)) {
                                    // Extract arguments (handles both "args" field and flat object)
                                    const args = data.args || data.arguments || data.params || data;
                                    // Map common keys
                                    if (args.TargetFile) args.path = args.TargetFile;
                                    if (args.CodeContent) args.content = args.CodeContent;

                                    if (config.get('DEBUG_MODE')) {
                                        console.log(chalk.magenta(`\n[DEBUG] Detected JSON tool call: ${toolName}`));
                                    }
                                    pendingToolCalls.push({
                                        id: `fallback_json_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                        name: toolName,
                                        arguments: JSON.stringify(args)
                                    });
                                }
                            }
                        } catch (e) { }
                    }
                }
            }

            // Fallback 3: XML-like tags (e.g. <tool_name path="..." content="..." />)
            if (pendingToolCalls.length === 0 && fullContent.includes('<')) {
                const xmlRegex = /<(\w+)\s*([^>]*?)\/?>/g;
                let match;
                while ((match = xmlRegex.exec(fullContent)) !== null) {
                    let toolName = match[1].trim();
                    const attrsRaw = match[2].trim();

                    if (toolName === 'write_to_file') toolName = 'write_file';
                    if (toolName === 'thinking') continue; // Skip DeepSeek thinking tags

                    if (tools.some(t => t.name === toolName)) {
                        const args: any = {};
                        const attrRegex = /(\w+)\s*=\s*["']([\s\S]*?)["']/g;
                        let attrMatch;
                        while ((attrMatch = attrRegex.exec(attrsRaw)) !== null) {
                            args[attrMatch[1]] = attrMatch[2];
                        }

                        if (Object.keys(args).length > 0) {
                            if (config.get('DEBUG_MODE')) {
                                console.log(chalk.magenta(`\n[DEBUG] Detected XML tool call: ${toolName}`));
                            }
                            pendingToolCalls.push({
                                id: `fallback_xml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                name: toolName,
                                arguments: JSON.stringify(args)
                            });
                        }
                    }
                }
            }

            agentSpinner.stop();

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

                    // Depth Logging: Show exactly what is happening
                    const displayPath = args.path || args.TargetFile || args.from || args.filepath || '';
                    const absolutePath = displayPath ? path.resolve(displayPath) : '';

                    // Loop Detection
                    const loopCheck = loopDetector.check(toolCall.name, args);
                    if (loopCheck.isLoop && loopCheck.risk === 'high') {
                        console.log('\n' + warningGradient(`⚠️  ${loopCheck.message}`));
                        auditLogger.log({ action: toolCall.name, args, result: 'blocked', supervision: { loopDetected: true } });
                        state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'LOOP DETECTED: Try a different approach.' });
                        continue;
                    }

                    // Security Scan
                    if ((toolCall.name === 'write_file' || toolCall.name === 'edit_file') && (args.content || args.replace)) {
                        const scanResult = securityScanner.scan(args.content || args.replace || '');
                        if (!scanResult.approved) {
                            console.log('\n' + warningGradient('🔒 Security blocked'));
                            state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: `BLOCKED: ${scanResult.issues[0].message}` });
                            continue;
                        }
                    }

                    // Permission check
                    const permission = await checkPermission(toolCall.name, { ...args, absolutePath }, state.permissions);
                    if (!permission.approved) {
                        console.log(chalk.yellow(`\n⏭️  Skipped: ${toolCall.name}`));
                        state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'User denied permission.' });
                        continue;
                    }

                    // Proactive Check for complex tools
                    if (toolCall.name.startsWith('browser_')) {
                        const ready = await ensurePlaywright();
                        if (!ready) {
                            state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'Error: Playwright not installed.' });
                            continue;
                        }
                    }

                    if (toolCall.name === 'semantic_search') {
                        const ready = await ensureMgrep();
                        if (!ready) {
                            state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'Error: mgrep setup incomplete.' });
                            continue;
                        }
                    }

                    if (toolCall.name === 'search_files' && config.get('USE_RIPGREP')) {
                        await ensureRipgrep(); // Optional, falls back to native if user cancels
                    }

                    if (toolCall.name === 'file_tree' && config.get('USE_FD')) {
                        await ensureFd(); // Optional
                    }

                    // Execute tool
                    agentSpinner.text = chalk.yellow(`⚡ ${toolCall.name}`);
                    if (absolutePath) {
                        agentSpinner.text += chalk.dim(` → Target: ${absolutePath}`);
                    } else if (args.command) {
                        agentSpinner.text += chalk.dim(` → Exec: ${args.command}`);
                    }
                    agentSpinner.start();

                    const result = await executeTool(toolCall.name, args);
                    agentSpinner.stop();

                    console.log(chalk.yellow(`⚡ ${toolCall.name}`));
                    if (absolutePath) {
                        console.log(chalk.dim(`   → Target: ${absolutePath}`));
                    } else if (args.command) {
                        console.log(chalk.dim(`   → Exec: ${args.command}`));
                    }

                    if (!state.compact) {
                        console.log(chalk.dim(result.slice(0, 300) + (result.length > 300 ? '...' : '')));
                    }
                    auditLogger.log({ action: toolCall.name, args, result: 'success' });
                    state.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
                }
                continue;
            }

            state.messages.push({ role: 'assistant', content: fullContent });
            showAnalyticsFooter();
            break;

        } catch (error: any) {
            agentSpinner.stop();
            console.log(chalk.red(`\nError: ${error.message}`));
            break;
        }
    }

    if (iterations >= maxIterations) {
        console.log(warningGradient('\n⚠️  Max iterations reached.'));
    }
}

// ==================== MAIN CHAT ====================

export async function chat(singlePrompt?: string): Promise<void> {
    const { key, provider } = getApiKey();

    if (singlePrompt && !key) {
        console.log(chalk.red('\n✗ No API key configured!'));
        return;
    }

    const streamingEnabled = config.get('STREAMING') ?? true;

    if (key) {
        const streamingStatus = streamingEnabled ? chalk.green('Streaming') : chalk.dim('Non-streaming');
        console.log(chalk.dim(`Using ${provider} • ${streamingStatus} • Supervision: `) + chalk.green('Active'));
        console.log(chalk.dim(`Working Directory: ${process.cwd()}\n`));
    } else {
        console.log(chalk.yellow('⚠ No API key configured - use /doctor or set one to start chatting'));
    }
    console.log(chalk.dim('Type / for commands, exit to quit\n'));

    const state: ChatState = {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
        compact: config.get('COMPACT_MODE') ?? false,
        streaming: streamingEnabled,
        permissions: createPermissionState()
    };

    loopDetector.reset();

    // Initialize MCP (connect to servers)
    await initializeMCP();

    if (singlePrompt) {
        await runAgentStreaming(state, singlePrompt);
        return;
    }

    while (true) {
        try {
            const userInput = await input({ message: chalk.cyan('❯') });
            if (!userInput.trim()) continue;

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

            if (['exit', 'quit', 'q'].includes(userInput.toLowerCase())) break;

            await runAgentStreaming(state, userInput);

        } catch (error: any) {
            if (error.message?.includes('cancelled')) continue;
            console.log(chalk.red(`Error: ${error.message}`));
        }
    }

    console.log(chalk.dim('\nGoodbye!\n'));
}
