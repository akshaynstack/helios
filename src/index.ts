#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { chat } from './chat.js';
import { config, addMCPServer, removeMCPServer, getMCPServers } from './config.js';
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
                ['ANTHROPIC_API_KEY', 'Anthropic (Claude)'],
                ['OPENROUTER_API_KEY', 'OpenRouter (all models)'],
                ['OPENAI_API_KEY', 'OpenAI'],
                ['GOOGLE_API_KEY', 'Google (Gemini)'],
                ['V0_API_KEY', 'Vercel v0 (UI generation)'],
                ['MODEL', 'Default model'],
                ['TIMEOUT', 'Request timeout (ms)'],
                ['STREAMING', 'Streaming mode']
            ];

            keys.forEach(([k, desc]) => {
                const val = config.get(k as any);
                const status = val ? chalk.green('●') : chalk.dim('○');
                let display: string;
                if (k === 'MODEL') {
                    display = String(val || 'google/gemini-2.0-flash-exp:free');
                } else if (k === 'TIMEOUT') {
                    display = `${val || 60000}ms`;
                } else if (k === 'STREAMING') {
                    display = val ? chalk.green('ON') : chalk.dim('OFF');
                } else if (val && typeof val === 'string') {
                    display = '***';
                } else {
                    display = chalk.dim('not set');
                }
                console.log(`  ${status} ${chalk.bold(k)}`);
                console.log(`    ${chalk.dim(desc)}: ${display}`);
            });

            console.log('\n' + chalk.dim(`  📦 ${tools.length} tools available\n`));
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

program
    .argument('[prompt...]', 'Direct prompt to run')
    .action(async (promptParts: string[]) => {
        if (promptParts && promptParts.length > 0) {
            const prompt = promptParts.join(' ');
            console.log(chalk.dim('→ ' + prompt + '\n'));
            await chat(prompt);
        } else {
            // Enter interactive mode by default (like Claude Code)
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
        }
    });

program.parse();
