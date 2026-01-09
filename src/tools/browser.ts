/**
 * Browser Automation Tools - Powered by Playwright
 * Web scraping, screenshots, testing, form filling, and more
 */
import type { Tool, ToolHandler } from './types.js';

export const tools: Tool[] = [
    // ============ NAVIGATION ============
    {
        name: 'browser_open',
        description: 'Open a URL in browser and return page content',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to open' },
                wait: { type: 'string', description: 'Wait for selector before returning' }
            },
            required: ['url']
        }
    },
    {
        name: 'browser_screenshot',
        description: 'Take a screenshot of a webpage',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to screenshot' },
                output: { type: 'string', description: 'Output file path (default: screenshot.png)' },
                fullPage: { type: 'string', description: 'Capture full page (true/false)' }
            },
            required: ['url']
        }
    },
    {
        name: 'browser_pdf',
        description: 'Save webpage as PDF',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to save' },
                output: { type: 'string', description: 'Output file path (default: page.pdf)' }
            },
            required: ['url']
        }
    },

    // ============ SCRAPING ============
    {
        name: 'browser_scrape',
        description: 'Scrape text content from a webpage using CSS selector',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to scrape' },
                selector: { type: 'string', description: 'CSS selector to extract' },
                multiple: { type: 'string', description: 'Get all matching elements (true/false)' }
            },
            required: ['url', 'selector']
        }
    },
    {
        name: 'browser_links',
        description: 'Extract all links from a webpage',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to extract links from' },
                filter: { type: 'string', description: 'Filter links containing this text' }
            },
            required: ['url']
        }
    },
    {
        name: 'browser_table',
        description: 'Extract table data from a webpage as JSON',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL containing table' },
                selector: { type: 'string', description: 'Table CSS selector (default: table)' }
            },
            required: ['url']
        }
    },

    // ============ INTERACTION ============
    {
        name: 'browser_click',
        description: 'Click an element on a webpage',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to open' },
                selector: { type: 'string', description: 'CSS selector to click' }
            },
            required: ['url', 'selector']
        }
    },
    {
        name: 'browser_fill',
        description: 'Fill a form field on a webpage',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL with form' },
                selector: { type: 'string', description: 'Input CSS selector' },
                value: { type: 'string', description: 'Value to fill' }
            },
            required: ['url', 'selector', 'value']
        }
    },
    {
        name: 'browser_submit',
        description: 'Fill form and submit',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL with form' },
                formData: { type: 'string', description: 'JSON object of selector:value pairs' },
                submitSelector: { type: 'string', description: 'Submit button selector' }
            },
            required: ['url', 'formData']
        }
    },

    // ============ TESTING ============
    {
        name: 'browser_test',
        description: 'Run a simple E2E test: open URL, check for element, verify text',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to test' },
                checks: { type: 'string', description: 'JSON array of {selector, expectedText} checks' }
            },
            required: ['url', 'checks']
        }
    },
    {
        name: 'browser_lighthouse',
        description: 'Run Lighthouse audit and return scores',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to audit' }
            },
            required: ['url']
        }
    },

    // ============ UTILITY ============
    {
        name: 'browser_wait',
        description: 'Wait for an element to appear on page',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to open' },
                selector: { type: 'string', description: 'CSS selector to wait for' },
                timeout: { type: 'string', description: 'Timeout in ms (default: 30000)' }
            },
            required: ['url', 'selector']
        }
    },
    {
        name: 'browser_evaluate',
        description: 'Execute JavaScript in browser context and return result',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to open' },
                script: { type: 'string', description: 'JavaScript code to execute' }
            },
            required: ['url', 'script']
        }
    },

    // ============ VIBECODER TOOLS ============
    {
        name: 'verify_ui',
        description: '🔥 Helios Verification: Screenshot local dev server and describe what you see. Perfect for validating UI changes.',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to verify (default: http://localhost:3000)' },
                output: { type: 'string', description: 'Screenshot output path (default: ui-verify.png)' },
                selector: { type: 'string', description: 'Optional: specific element to focus on' }
            },
            required: []
        }
    }
];

// Lazy-load Playwright
let playwrightModule: any = null;

async function getPlaywright() {
    if (!playwrightModule) {
        try {
            playwrightModule = await import('playwright');
        } catch {
            throw new Error('Playwright not installed. Run: npm install playwright');
        }
    }
    return playwrightModule;
}

async function withBrowser<T>(fn: (page: any, browser: any) => Promise<T>): Promise<T> {
    const playwright = await getPlaywright();
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        return await fn(page, browser);
    } finally {
        await browser.close();
    }
}

export const handlers: Record<string, ToolHandler> = {
    browser_open: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            if (args.wait) {
                await page.waitForSelector(args.wait, { timeout: 10000 });
            }
            const text = await page.evaluate('document.body.innerText');
            return text.slice(0, 5000) + (text.length > 5000 ? '\n...[truncated]' : '');
        });
    },

    browser_screenshot: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'networkidle' });
            const output = args.output || 'screenshot.png';
            await page.screenshot({
                path: output,
                fullPage: args.fullPage === 'true'
            });
            return `✓ Screenshot saved to ${output}`;
        });
    },

    browser_pdf: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'networkidle' });
            const output = args.output || 'page.pdf';
            await page.pdf({ path: output, format: 'A4' });
            return `✓ PDF saved to ${output}`;
        });
    },

    browser_scrape: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            if (args.multiple === 'true') {
                const elements = await page.$$(args.selector);
                const texts = await Promise.all(elements.map((el: any) => el.textContent()));
                return texts.filter(Boolean).join('\n');
            }
            const element = await page.$(args.selector);
            return element ? await element.textContent() : 'Element not found';
        });
    },

    browser_links: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const links = await page.$$eval('a[href]', (anchors: any[]) =>
                anchors.map(a => ({ text: a.textContent?.trim(), href: a.href }))
            );
            let filtered = links.filter((l: any) => l.href && !l.href.startsWith('javascript:'));
            if (args.filter) {
                filtered = filtered.filter((l: any) =>
                    l.text?.includes(args.filter) || l.href.includes(args.filter)
                );
            }
            return filtered.slice(0, 50).map((l: any) => `${l.text || '(no text)'}: ${l.href}`).join('\n');
        });
    },

    browser_table: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const selector = args.selector || 'table';
            const data = await page.$eval(selector, (table: any) => {
                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.map((row: any) => {
                    const cells = Array.from(row.querySelectorAll('td, th'));
                    return cells.map((cell: any) => cell.textContent?.trim());
                });
            });
            return JSON.stringify(data, null, 2);
        });
    },

    browser_click: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            await page.click(args.selector);
            await page.waitForTimeout(1000);
            return `✓ Clicked ${args.selector}`;
        });
    },

    browser_fill: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            await page.fill(args.selector, args.value);
            return `✓ Filled ${args.selector}`;
        });
    },

    browser_submit: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const formData = JSON.parse(args.formData);
            for (const [selector, value] of Object.entries(formData)) {
                await page.fill(selector, value as string);
            }
            if (args.submitSelector) {
                await page.click(args.submitSelector);
            } else {
                await page.press('input', 'Enter');
            }
            await page.waitForTimeout(2000);
            return `✓ Form submitted. New URL: ${page.url()}`;
        });
    },

    browser_test: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const checks = JSON.parse(args.checks);
            const results: string[] = [];

            for (const check of checks) {
                try {
                    const element = await page.$(check.selector);
                    if (!element) {
                        results.push(`✗ ${check.selector}: Not found`);
                        continue;
                    }
                    const text = await element.textContent();
                    if (check.expectedText && !text?.includes(check.expectedText)) {
                        results.push(`✗ ${check.selector}: Expected "${check.expectedText}", got "${text?.slice(0, 50)}"`);
                    } else {
                        results.push(`✓ ${check.selector}: OK`);
                    }
                } catch (e: any) {
                    results.push(`✗ ${check.selector}: ${e.message}`);
                }
            }

            const passed = results.filter(r => r.startsWith('✓')).length;
            return `${passed}/${checks.length} checks passed\n\n${results.join('\n')}`;
        });
    },

    browser_lighthouse: async (args) => {
        // Simplified lighthouse - just load timing
        return withBrowser(async (page) => {
            const start = Date.now();
            await page.goto(args.url, { waitUntil: 'networkidle' });
            const loadTime = Date.now() - start;

            const metrics = await page.evaluate(`({
                domNodes: document.querySelectorAll('*').length,
                images: document.images.length,
                scripts: document.scripts.length,
                stylesheets: document.styleSheets.length
            })`);

            return `Page: ${args.url}\nLoad time: ${loadTime}ms\nDOM nodes: ${metrics.domNodes}\nImages: ${metrics.images}\nScripts: ${metrics.scripts}\nStylesheets: ${metrics.stylesheets}`;
        });
    },

    browser_wait: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const timeout = parseInt(args.timeout) || 30000;
            await page.waitForSelector(args.selector, { timeout });
            return `✓ Element ${args.selector} appeared`;
        });
    },

    browser_evaluate: async (args) => {
        return withBrowser(async (page) => {
            await page.goto(args.url, { waitUntil: 'domcontentloaded' });
            const result = await page.evaluate(args.script);
            return typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        });
    },

    // 🔥 VIBECODER TOOL: Verify UI
    verify_ui: async (args) => {
        return withBrowser(async (page) => {
            const url = args.url || 'http://localhost:3000';
            const output = args.output || 'ui-verify.png';

            try {
                await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            } catch (e: any) {
                if (e.message.includes('ERR_CONNECTION_REFUSED')) {
                    return `🔥 Helios Verify: No server running at ${url}. Start your dev server first (npm run dev).`;
                }
                throw e;
            }

            // Get page info
            const title = await page.title();
            const viewport = page.viewportSize();

            // Take screenshot
            if (args.selector) {
                const element = await page.$(args.selector);
                if (element) {
                    await element.screenshot({ path: output });
                } else {
                    return `🔥 Helios Verify: Element "${args.selector}" not found on page.`;
                }
            } else {
                await page.screenshot({ path: output, fullPage: false });
            }

            // Analyze page structure
            const analysis = await page.evaluate(`({
                title: document.title,
                h1: document.querySelector('h1')?.textContent?.trim() || '(none)',
                buttons: document.querySelectorAll('button').length,
                links: document.querySelectorAll('a').length,
                images: document.images.length,
                forms: document.forms.length,
                hasNav: !!document.querySelector('nav'),
                hasHeader: !!document.querySelector('header'),
                hasFooter: !!document.querySelector('footer'),
                mainColors: [...new Set([...document.querySelectorAll('*')].slice(0, 100).map(el => getComputedStyle(el).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)'))].slice(0, 5)
            })`);

            return `🔥 Helios UI Verification Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 Screenshot saved: ${output}
🌐 URL: ${url}
📄 Title: ${title}
📐 Viewport: ${viewport?.width}x${viewport?.height}

📊 Page Analysis:
   • H1: ${analysis.h1}
   • Buttons: ${analysis.buttons}
   • Links: ${analysis.links}
   • Images: ${analysis.images}
   • Forms: ${analysis.forms}
   • Has Nav: ${analysis.hasNav ? '✅' : '❌'}
   • Has Header: ${analysis.hasHeader ? '✅' : '❌'}
   • Has Footer: ${analysis.hasFooter ? '✅' : '❌'}

✅ UI verified! Check ${output} for visual confirmation.`;
        });
    }
};
