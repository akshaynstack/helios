#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { chat } from './chat.js';
import { config, addMCPServer, removeMCPServer, getMCPServers, getApiKey } from './config.js';
import { uiExpert } from './ui-expert.js';
import { startMCPServer, generateMCPConfig } from './mcp/index.js';
import { tools } from './tools/index.js';
import { connectClaude, disconnectClaude, isClaudeConnected } from './claude-auth.js';

const program = new Command();

// Premium gradient banner
const heliosGradient = gradient(['#667eea', '#764ba2', '#f093fb']);
const banner = heliosGradient(figlet.textSync('HELIOS', { font: 'ANSI Shadow' }));

const tagline = gradient(['#00d2ff', '#3a7bd5'])('⚡ AI Coding Assistant with 240+ Features');

console.log('\n' + banner);
console.log('  ' + tagline + '\n');

program
    .name('helios')
    .description('AI Coding Assistant with Supervision - Like Claude Code but supercharged')
    .version('0.2.0');

program
    .command('chat')
    .description('Start interactive chat mode')
    .action(async () => {
        console.log(boxen(
            chalk.white.bold('Interactive Mode\n\n') +
            chalk.dim('Ask me to read, write, or edit files.\n') +
            chalk.dim('Type ') + chalk.cyan('/') + chalk.dim(' for commands, ') +
            chalk.cyan('exit') + chalk.dim(' to quit.'),
            {
                padding: 1,
                borderColor: 'magenta',
                borderStyle: 'round',
                dimBorder: true
            }
        ));
        console.log();
        await chat();
    });

program
    .command('ui')
    .description('🎨 UI/UX Expert - Generate stunning interfaces with v0')
    .argument('[prompt...]', 'UI description')
    .action(async (promptParts: string[]) => {
        const prompt = promptParts?.join(' ') || '';
        console.log(boxen(
            gradient(['#f093fb', '#f5576c']).multiline([
                '🎨 UI/UX Expert Mode',
                '',
                'Powered by Vercel v0'
            ].join('\n')) + '\n\n' +
            chalk.dim('Generate stunning, production-ready UI components'),
            {
                padding: 1,
                borderColor: 'magenta',
                borderStyle: 'double'
            }
        ));
        console.log();
        await uiExpert(prompt);
    });

// ==================== CONNECT COMMANDS ====================

const connectCommand = program
    .command('connect')
    .description('🔐 Connect AI provider accounts');

connectCommand
    .command('claude')
    .description('Connect Claude Max/Pro account (no API key needed)')
    .action(async () => {
        await connectClaude();
    });

connectCommand
    .command('status')
    .description('Show connection status')
    .action(() => {
        const claudeOk = isClaudeConnected();
        const openrouterKey = config.get('OPENROUTER_API_KEY');
        const anthropicKey = config.get('ANTHROPIC_API_KEY');

        console.log('\n' + gradient(['#667eea', '#764ba2'])('🔐 Connection Status\n'));
        console.log(`  Claude Account: ${claudeOk ? chalk.green('✓ Connected') : chalk.dim('Not connected')}`);
        console.log(`  OpenRouter API: ${openrouterKey ? chalk.green('✓ Configured') : chalk.dim('Not set')}`);
        console.log(`  Anthropic API:  ${anthropicKey ? chalk.green('✓ Configured') : chalk.dim('Not set')}`);
        console.log();
    });

program
    .command('disconnect')
    .description('Disconnect AI provider')
    .argument('<provider>', 'Provider to disconnect (claude)')
    .action((provider: string) => {
        if (provider === 'claude') {
            disconnectClaude();
        } else {
            console.log(chalk.red(`Unknown provider: ${provider}`));
        }
    });

// ==================== PROVIDER COMMANDS ====================

const providerCommand = program
    .command('provider')
    .description('🔧 Manage custom OpenAI-compatible providers');

providerCommand
    .command('add')
    .description('Add a custom provider (OpenAI-compatible API)')
    .argument('<base-url>', 'Base URL for the provider (e.g., http://localhost:11434/v1)')
    .argument('[api-key]', 'API key (optional for local providers)')
    .action((baseUrl: string, apiKey?: string) => {
        config.set('CUSTOM_BASE_URL', baseUrl);
        config.set('CUSTOM_API_KEY', apiKey || '');
        console.log(gradient(['#00ff87', '#60efff'])(`\n✓ Custom provider set: ${baseUrl}`));
        console.log(chalk.dim('Use /model in chat to select models from this provider\n'));
    });

providerCommand
    .command('remove')
    .description('Remove custom provider')
    .action(() => {
        config.set('CUSTOM_BASE_URL', '');
        config.set('CUSTOM_API_KEY', '');
        console.log(chalk.yellow('\n✓ Custom provider removed\n'));
    });

providerCommand
    .command('show')
    .description('Show configured providers')
    .action(() => {
        console.log('\n' + gradient(['#667eea', '#764ba2'])('🔧 Configured Providers\n'));

        const anthropic = config.get('ANTHROPIC_API_KEY');
        const openrouter = config.get('OPENROUTER_API_KEY');
        const openai = config.get('OPENAI_API_KEY');
        const google = config.get('GOOGLE_API_KEY');
        const customUrl = config.get('CUSTOM_BASE_URL');

        console.log(`  ${anthropic ? chalk.green('●') : chalk.dim('○')} Anthropic (Claude)`);
        console.log(`  ${openrouter ? chalk.green('●') : chalk.dim('○')} OpenRouter`);
        console.log(`  ${openai ? chalk.green('●') : chalk.dim('○')} OpenAI`);
        console.log(`  ${google ? chalk.green('●') : chalk.dim('○')} Google`);
        console.log(`  ${customUrl ? chalk.green('●') : chalk.dim('○')} Custom: ${customUrl || chalk.dim('not set')}`);
        console.log();
    });

// ==================== MCP COMMANDS ====================

const mcpCommand = program
    .command('mcp')
    .description('🔌 MCP Server - Expose Helios tools to Claude Desktop & other MCP clients');

mcpCommand
    .command('serve', { isDefault: true })
    .description('Start the MCP server (stdio mode)')
    .action(async () => {
        await startMCPServer();
    });

mcpCommand
    .command('config')
    .description('Show MCP config for Claude Desktop')
    .action(() => {
        console.log(chalk.bold('\n📋 Add this to your Claude Desktop config:\n'));
        console.log(chalk.dim('~/.config/Claude/claude_desktop_config.json (macOS/Linux)'));
        console.log(chalk.dim('%APPDATA%\\Claude\\claude_desktop_config.json (Windows)\n'));
        console.log(JSON.stringify(generateMCPConfig(), null, 2));
        console.log();
    });

mcpCommand
    .command('list')
    .description('List connected MCP servers')
    .action(() => {
        const servers = getMCPServers();
        if (servers.length === 0) {
            console.log(chalk.dim('\nNo MCP servers configured.\n'));
            console.log('Add one with: helios mcp add <name> <url>\n');
            return;
        }
        console.log('\n' + chalk.bold('Configured MCP Servers:\n'));
        servers.forEach(s => {
            console.log(`  ${chalk.cyan(s.name)} - ${s.url || s.command || 'stdio'}`);
        });
        console.log();
    });

mcpCommand
    .command('add')
    .description('Add an MCP server')
    .argument('<name>', 'Server name')
    .argument('<url>', 'Server URL (e.g., http://localhost:3000)')
    .action((name: string, url: string) => {
        addMCPServer({ name, url });
        console.log(gradient(['#00ff87', '#60efff'])(`\n✓ Added MCP server: ${name}\n`));
    });

mcpCommand
    .command('remove')
    .description('Remove an MCP server')
    .argument('<name>', 'Server name')
    .action((name: string) => {
        if (removeMCPServer(name)) {
            console.log(chalk.yellow(`\n✓ Removed MCP server: ${name}\n`));
        } else {
            console.log(chalk.red(`\n✗ Server not found: ${name}\n`));
        }
    });

import { QwenAuth } from './auth/qwen.js';

// ... other imports

// ==================== LOGIN COMMAND ====================

const loginCommand = program
    .command('login')
    .description('Authenticate with AI providers');

loginCommand
    .command('qwen')
    .description('Login to Qwen.ai (Free access)')
    .action(async () => {
        const auth = new QwenAuth();
        await auth.login();
    });

// ==================== CONFIG COMMAND ====================

program
    .command('config')
    .description('Manage configuration')
    .argument('<action>', 'Action: set, get, show')
    .argument('[key]', 'Config key')
    .argument('[value]', 'Config value')
    .action((action: string, key?: string, value?: string) => {
        if (action === 'set' && key && value) {
            config.set(key as any, value as any);
            console.log(gradient(['#00ff87', '#60efff'])(`✓ Set ${key}`));
        } else if (action === 'get' && key) {
            const val = config.get(key as any);
            console.log(val || chalk.dim('(not set)'));
        } else if (action === 'show') {
            const titleGradient = gradient(['#667eea', '#764ba2']);
            console.log('\n' + titleGradient('  ⚙️  Helios Configuration\n'));

            const keys: [string, string][] = [
                ['QWEN_ACCESS_TOKEN', 'Qwen.ai (Free access)'],
                ['ANTHROPIC_API_KEY', 'Anthropic (Claude)'],
                ['OPENROUTER_API_KEY', 'OpenRouter (all models)'],
                ['OPENAI_API_KEY', 'OpenAI'],
                ['GOOGLE_API_KEY', 'Google (Gemini)'],
                ['V0_API_KEY', 'Vercel v0 (UI generation)'],
                ['MODEL', 'Default model'],
                ['TIMEOUT', 'Request timeout (ms)'],
                ['STREAMING', 'Streaming mode']
            ];

            // Print table
            keys.forEach(([key, label]) => {
                const val = config.get(key as any);
                let displayVal = chalk.dim('(not set)');
                if (val) {
                    if (key.includes('KEY') || key.includes('TOKEN')) {
                        displayVal = chalk.green('**********' + val.slice(-4));
                    } else {
                        displayVal = chalk.cyan(val.toString());
                    }
                }
                console.log(`  ${chalk.white(label.padEnd(25))} ${displayVal}`);
            });
            console.log();
        } else {
            console.log(chalk.yellow('\nUsage:'));
            console.log('  helios config set ANTHROPIC_API_KEY sk-ant-...');
            console.log('  helios config set OPENROUTER_API_KEY sk-or-...');
            console.log('  helios config set STREAMING true');
            console.log('  helios config show\n');
        }
    });

// ==================== DOCTOR COMMAND ====================

program
    .command('doctor')
    .description('🏥 Diagnose Helios installation and configuration')
    .action(() => {
        console.log('\n' + gradient(['#667eea', '#764ba2'])('  🏥 Helios Doctor\n'));

        const checks: Array<{ name: string; status: boolean; message: string }> = [];

        // Check API keys
        const anthropic = config.get('ANTHROPIC_API_KEY');
        const openrouter = config.get('OPENROUTER_API_KEY');
        const openai = config.get('OPENAI_API_KEY');

        const hasApiKey = !!(anthropic || openrouter || openai);
        checks.push({
            name: 'API Key',
            status: hasApiKey,
            message: hasApiKey ?
                `Configured (${anthropic ? 'Anthropic' : openrouter ? 'OpenRouter' : 'OpenAI'})` :
                'Not configured - run: helios config set OPENROUTER_API_KEY sk-or-...'
        });

        // Check tools
        checks.push({
            name: 'Tools',
            status: true,
            message: `${tools.length} tools loaded`
        });

        // Check MCP
        const mcpServers = getMCPServers();
        checks.push({
            name: 'MCP Servers',
            status: true,
            message: mcpServers.length > 0 ? `${mcpServers.length} configured` : 'None (use helios mcp add)'
        });

        // Print results
        checks.forEach(check => {
            const icon = check.status ? chalk.green('✓') : chalk.red('✗');
            console.log(`  ${icon} ${chalk.bold(check.name)}: ${check.message}`);
        });

        console.log();
    });

// ==================== TOOLS COMMAND ====================

program
    .command('tools')
    .description('🛠️  List all available tools')
    .option('-c, --category <category>', 'Filter by category')
    .action((options) => {
        console.log('\n' + gradient(['#667eea', '#764ba2'])(`  🛠️  ${tools.length} Tools Available\n`));

        const categories: Record<string, string[]> = {
            'File Operations': ['read_file', 'write_file', 'edit_file', 'delete_file', 'list_directory'],
            'Git': ['git_status', 'git_diff', 'git_commit', 'git_log', 'git_branch'],
            'Search': ['search_files', 'find_files', 'find_and_replace_all'],
            'Package': ['install_package', 'uninstall_package', 'run_script'],
            'AI-Assisted': ['explain_code', 'fix_error', 'generate_test']
        };

        // Show summary
        for (const [cat, exampleTools] of Object.entries(categories)) {
            const count = exampleTools.filter(t => tools.some(tool => tool.name === t)).length;
            console.log(`  ${chalk.cyan(cat)}: ${count}+ tools`);
        }

        console.log(chalk.dim(`\n  Type /tools in chat to use them, or ask the AI!\n`));
    });

// ==================== DEFAULT COMMAND ====================

// Welcome dashboard (Claude Code style)
function showWelcomeDashboard() {
    const { key, provider } = getApiKey();
    const model = config.get('MODEL') || 'google/gemini-2.0-flash-exp:free';
    const mcpServers = getMCPServers();

    // Show dashboard (no console.clear to preserve scroll history)
    console.log('\n' + banner);
    console.log('  ' + tagline + '\n');

    // Create side-by-side boxes
    const leftBox = boxen(
        gradient(['#667eea', '#764ba2'])('Welcome back!') + '\n\n' +
        chalk.hex('#60efff')(`    *  ██╗  ██╗  *
   * ╔██╗  ██╗╗ *
     ╚██████╔╝
      ╚═════╝`) + '\n\n' +
        chalk.dim(model.split('/').pop()?.split(':')[0] || 'AI Model') + '\n' +
        chalk.dim(process.cwd()),
        {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            borderColor: 'yellow',
            borderStyle: 'round',
            width: 36,
            title: chalk.yellow(`Helios v0.2.0`),
            titleAlignment: 'center'
        }
    );

    const tips = [
        'Type your request and press Enter',
        'Use / for slash commands',
        '/model to change AI model',
        '/yolo to auto-approve actions',
        '/help for all commands'
    ];

    const rightBox = boxen(
        gradient(['#f5576c', '#f093fb'])('Tips for getting started') + '\n\n' +
        tips.map(t => chalk.dim('• ' + t)).join('\n') + '\n\n' +
        gradient(['#f5576c', '#f093fb'])('Status') + '\n\n' +
        (key ? chalk.green('● ') + chalk.dim(`${provider} connected`) : chalk.red('○ ') + chalk.dim('No API key')) + '\n' +
        chalk.dim(`● ${tools.length} tools available`) + '\n' +
        chalk.dim(`● ${mcpServers.length} MCP servers`),
        {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            borderColor: 'red',
            borderStyle: 'round',
            width: 42,
        }
    );

    // Print boxes side by side
    const leftLines = leftBox.split('\n');
    const rightLines = rightBox.split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);

    for (let i = 0; i < maxLines; i++) {
        const left = leftLines[i] || ' '.repeat(36);
        const right = rightLines[i] || '';
        console.log(left + '  ' + right);
    }

    console.log('\n' + chalk.dim('? for shortcuts'));
    console.log();
}

// Alternate screen buffer (like Claude Code)
function enterAlternateScreen() {
    // Enter alternate screen buffer
    process.stdout.write('\x1b[?1049h');
    // Hide cursor initially
    process.stdout.write('\x1b[?25l');
    // Move cursor to top
    process.stdout.write('\x1b[H');
}

function exitAlternateScreen() {
    // Show cursor
    process.stdout.write('\x1b[?25h');
    // Exit alternate screen buffer
    process.stdout.write('\x1b[?1049l');
}

// Global process tracker for cleanup
const trackedProcesses: Set<number> = new Set();

// Export for use in shell tools
export function trackProcess(pid: number) {
    trackedProcesses.add(pid);
}

export function untrackProcess(pid: number) {
    trackedProcesses.delete(pid);
}

// Cleanup on exit - HELIOS SAFE EXIT
function setupCleanupHandlers() {
    let isExiting = false;

    const cleanup = async () => {
        if (isExiting) return;
        isExiting = true;

        // First, show cursor and exit alternate screen
        process.stdout.write('\x1b[?25h'); // Show cursor
        exitAlternateScreen();

        // Kill any tracked processes
        if (trackedProcesses.size > 0) {
            console.log(chalk.hex('#E64A19')('\n🔥 Helios cleaning up...'));
            for (const pid of trackedProcesses) {
                try {
                    process.kill(pid, 'SIGTERM');
                    console.log(chalk.dim(`   Stopped process ${pid}`));
                } catch (e) {
                    // Process may have already exited
                }
            }
            trackedProcesses.clear();
        }

        process.exit(0);
    };

    // NOTE: SIGINT (Ctrl+C) is NOT handled here - it's handled in chat.ts
    // to allow cancelling tasks without exiting Helios
    process.on('SIGTERM', cleanup);

    // Handle uncaught errors gracefully
    process.on('uncaughtException', (err) => {
        console.error(chalk.red('\n⚠️ Unexpected error:'), err.message);
        cleanup();
    });

    process.on('exit', () => {
        if (!isExiting) {
            exitAlternateScreen();
        }
    });
}

program
    .argument('[prompt...]', 'Direct prompt to run')
    .action(async (promptParts: string[]) => {
        if (promptParts && promptParts.length > 0) {
            const prompt = promptParts.join(' ');
            console.log(chalk.dim('→ ' + prompt + '\n'));
            await chat(prompt);
        } else {
            // DISABLED: Alternate screen buffer prevents scrolling
            // enterAlternateScreen();
            setupCleanupHandlers();

            // Show cursor for input
            process.stdout.write('\x1b[?25h');

            // Show welcome dashboard and enter interactive mode
            showWelcomeDashboard();

            try {
                await chat();
            } finally {
                // No need to restore - we're not using alternate screen
                // exitAlternateScreen();
            }
        }
    });

program.parse();
