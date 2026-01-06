/**
 * Claude Browser Authentication - Automatic
 * Opens browser, user logs in, automatically captures session
 */

import { config } from './config.js';
import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import { execSync } from 'child_process';

const CLAUDE_LOGIN_URL = 'https://claude.ai/login';
const CLAUDE_HOME_URL = 'https://claude.ai';

/**
 * Connect to Claude via automatic browser auth
 * Opens browser, waits for login, captures session cookie
 */
export async function connectClaude(): Promise<void> {
    console.log('\n' + gradient(['#f5576c', '#f093fb'])('🔐 Connect Claude Account\n'));

    console.log(chalk.white('This connects your Claude Max/Pro subscription to Helios.'));
    console.log(chalk.dim('A browser will open - just log in normally.\n'));

    // Check if Playwright is available
    let playwright: any;
    try {
        playwright = await import('playwright');
    } catch {
        console.log(chalk.yellow('Installing browser automation...'));
        try {
            execSync('npm install playwright', { stdio: 'inherit' });
            playwright = await import('playwright');
        } catch (e) {
            console.log(chalk.red('\n✗ Could not install Playwright'));
            console.log(chalk.dim('Run manually: npm install playwright'));
            return;
        }
    }

    const spinner = ora('Launching browser...').start();

    try {
        // Launch visible browser
        const browser = await playwright.chromium.launch({
            headless: false,
            args: ['--start-maximized']
        });

        const context = await browser.newContext({
            viewport: null // Full screen
        });

        const page = await context.newPage();

        spinner.text = 'Opening Claude login...';
        await page.goto(CLAUDE_LOGIN_URL);

        spinner.succeed('Browser opened - please log in to Claude');
        console.log(chalk.cyan('\n👆 Complete the login in the browser window\n'));
        console.log(chalk.dim('Waiting for login to complete...\n'));

        // Wait for successful login (redirect to claude.ai home or conversation)
        await page.waitForURL((url: URL) => {
            const path = url.pathname;
            return path === '/' || path.startsWith('/chat') || path.startsWith('/new');
        }, { timeout: 300000 }); // 5 minute timeout

        // Get session cookie
        const cookies = await context.cookies();
        const sessionCookie = cookies.find((c: any) => c.name === 'sessionKey');

        if (sessionCookie) {
            // Save session
            config.set('CLAUDE_SESSION' as any, sessionCookie.value);
            config.set('CLAUDE_CONNECTED' as any, true);

            console.log(chalk.green('\n✓ Successfully connected to Claude!\n'));
            console.log(chalk.dim('Your Max/Pro subscription is now active.'));
            console.log(chalk.dim('Run: helios to start coding with Claude\n'));
        } else {
            console.log(chalk.red('\n✗ Could not capture session'));
            console.log(chalk.dim('Login may have failed. Try again.\n'));
        }

        await browser.close();

    } catch (error: any) {
        spinner.fail('Browser auth failed');

        if (error.message?.includes('timeout')) {
            console.log(chalk.yellow('\nLogin timed out. Try again with: helios connect claude\n'));
        } else {
            console.log(chalk.red(`\nError: ${error.message}\n`));
        }
    }
}

/**
 * Disconnect Claude account
 */
export function disconnectClaude(): void {
    config.delete('CLAUDE_SESSION' as any);
    config.delete('CLAUDE_CONNECTED' as any);
    console.log(chalk.yellow('\n✓ Disconnected Claude account\n'));
}

/**
 * Check if Claude is connected via browser auth
 */
export function isClaudeConnected(): boolean {
    return config.get('CLAUDE_CONNECTED' as any) === true;
}

/**
 * Get Claude session for API calls
 */
export function getClaudeSession(): string | null {
    return config.get('CLAUDE_SESSION' as any) || null;
}
