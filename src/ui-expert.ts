import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import * as readline from 'readline';
import { v0 } from 'v0-sdk';
import { getV0Key } from './config.js';

const uiGradient = gradient(['#f093fb', '#f5576c']);

export async function uiExpert(initialPrompt?: string): Promise<void> {
    const apiKey = getV0Key();

    if (!apiKey) {
        console.log(chalk.red('\n✗ V0 API key not configured!'));
        console.log(chalk.dim('Get your key from: ') + chalk.cyan('https://v0.dev/chat/settings/keys'));
        console.log(chalk.dim('Then run: ') + chalk.cyan('helios config set V0_API_KEY v0-...') + '\n');
        return;
    }

    // Set the API key for v0-sdk
    process.env.V0_API_KEY = apiKey;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
        return new Promise(resolve => {
            rl.question(query, resolve);
        });
    };

    const generateUI = async (prompt: string) => {
        const spinner = ora({
            text: uiGradient('Generating UI with v0...'),
            color: 'magenta'
        }).start();

        try {
            const chat: any = await v0.chats.create({
                message: prompt,
                system: `You are an expert UI/UX designer and React developer. 
Create stunning, modern, production-ready UI components using:
- React with TypeScript
- Tailwind CSS for styling
- Shadcn/ui components when appropriate
- Framer Motion for animations
- Responsive design (mobile-first)

Design principles:
- Modern glassmorphism and gradients
- Smooth micro-interactions
- Premium, Apple/Linear-like aesthetics
- Accessible and keyboard-friendly
- Dark mode by default`
            });

            spinner.succeed(uiGradient('UI Generated!'));

            console.log('\n' + chalk.bold('📍 View in browser:'));
            console.log(chalk.cyan(`   ${chat.webUrl || chat.url || 'https://v0.dev'}\n`));

            // Show the generated code if available
            if (chat.id) {
                console.log(chalk.dim('Chat ID: ' + chat.id));
            }

        } catch (error: any) {
            spinner.fail(chalk.red('Generation failed'));
            console.log(chalk.red(`\nError: ${error.message}`));

            if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
                console.log(chalk.dim('\nYour V0 API key might be invalid. Get a new one at:'));
                console.log(chalk.cyan('https://v0.dev/chat/settings/keys\n'));
            }
        }
    };

    // Single prompt mode
    if (initialPrompt && initialPrompt.trim()) {
        await generateUI(initialPrompt);
        rl.close();
        return;
    }

    // Interactive mode
    console.log(chalk.dim('Describe the UI you want to create:\n'));

    while (true) {
        const input = await askQuestion(uiGradient('🎨 ') + chalk.white('> '));

        if (['exit', 'quit', 'q'].includes(input.toLowerCase())) {
            console.log(chalk.dim('\nGoodbye!\n'));
            break;
        }

        if (!input.trim()) continue;

        await generateUI(input);
        console.log();
    }

    rl.close();
}
