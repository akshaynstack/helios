#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { chat } from './chat.js';
import { config } from './config.js';
import { uiExpert } from './ui-expert.js';

const program = new Command();

// Premium gradient banner
const heliosGradient = gradient(['#667eea', '#764ba2', '#f093fb']);
const banner = heliosGradient(figlet.textSync('HELIOS', { font: 'ANSI Shadow' }));

const tagline = gradient(['#00d2ff', '#3a7bd5'])('⚡ AI Coding Assistant with Supervision');

console.log('\n' + banner);
console.log('  ' + tagline + '\n');

program
    .name('helios')
    .description('AI Coding Assistant with Supervision')
    .version('0.1.0');

program
    .command('chat')
    .description('Start interactive chat mode')
    .action(async () => {
        console.log(boxen(
            chalk.white.bold('Interactive Mode\n\n') +
            chalk.dim('Ask me to read, write, or edit files.\n') +
            chalk.dim('Type ') + chalk.cyan('exit') + chalk.dim(' to quit.'),
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

program
    .command('config')
    .description('Manage configuration')
    .argument('<action>', 'Action: set, get, show')
    .argument('[key]', 'Config key')
    .argument('[value]', 'Config value')
    .action((action: string, key?: string, value?: string) => {
        if (action === 'set' && key && value) {
            config.set(key, value);
            console.log(gradient(['#00ff87', '#60efff'])(`✓ Set ${key}`));
        } else if (action === 'get' && key) {
            const val = config.get(key);
            console.log(val || chalk.dim('(not set)'));
        } else if (action === 'show') {
            const titleGradient = gradient(['#667eea', '#764ba2']);
            console.log('\n' + titleGradient('  ⚙️  Helios Configuration\n'));

            const keys = [
                ['OPENROUTER_API_KEY', 'OpenRouter (all models)'],
                ['V0_API_KEY', 'Vercel v0 (UI generation)'],
                ['OPENAI_API_KEY', 'OpenAI'],
                ['MODEL', 'Default model']
            ];

            keys.forEach(([k, desc]) => {
                const val = config.get(k as any);
                const status = val ? chalk.green('●') : chalk.dim('○');
                const display = k === 'MODEL' ? (val || 'google/gemini-2.0-flash-exp:free') : (val ? '***' : chalk.dim('not set'));
                console.log(`  ${status} ${chalk.bold(k)}`);
                console.log(`    ${chalk.dim(desc)}: ${display}`);
            });
            console.log();
        } else {
            console.log(chalk.yellow('\nUsage:'));
            console.log('  helios config set OPENROUTER_API_KEY sk-or-...');
            console.log('  helios config set V0_API_KEY v0-...');
            console.log('  helios config show\n');
        }
    });

// Default command - run prompt directly
program
    .argument('[prompt...]', 'Direct prompt to run')
    .action(async (promptParts: string[]) => {
        if (promptParts && promptParts.length > 0) {
            const prompt = promptParts.join(' ');
            console.log(chalk.dim('→ ' + prompt + '\n'));
            await chat(prompt);
        } else {
            // Show quick start guide
            console.log(boxen(
                chalk.bold('Quick Start\n\n') +
                chalk.cyan('1.') + ' Set API key:\n' +
                chalk.dim('   helios config set OPENROUTER_API_KEY sk-or-...\n\n') +
                chalk.cyan('2.') + ' Start chatting:\n' +
                chalk.dim('   helios chat\n\n') +
                chalk.cyan('3.') + ' Or run commands directly:\n' +
                chalk.dim('   helios "list files in current directory"\n\n') +
                gradient(['#f093fb', '#f5576c'])('🎨 UI/UX Expert:') + '\n' +
                chalk.dim('   helios ui "modern pricing page"'),
                {
                    padding: 1,
                    borderColor: 'cyan',
                    borderStyle: 'round',
                    title: '💡 Help',
                    titleAlignment: 'center'
                }
            ));
        }
    });

program.parse();
