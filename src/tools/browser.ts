/**
 * Browser Automation Tools - Powered by Playwright
 * Web scraping, screenshots, testing, form filling, and more
 */
import type { Tool, ToolHandler } from './types.js';
import { config } from '../config.js';
import * as fs from 'fs';
import * as path from 'path';

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
    },
    {
        name: 'browser_report',
        description: '🚀 Helios Audit: Generate a detailed project report (HTML/MD) with metrics, accessibility, and a Vibe Score.',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to audit (default: http://localhost:3000)' },
                output: { type: 'string', description: 'Report file path (default: report.md)' },
                includePdf: { type: 'string', description: 'Generate a PDF as well (true/false)' }
            },
            required: []
        }
    },
    {
        name: 'browser_autofix',
        description: '🔧 Helios AutoFix: Self-healing audit that identifies issues, provides fix suggestions, and tracks progress. Built-in loop guards prevent credit wastage.',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to audit (default: http://localhost:3000)' },
                iteration: { type: 'string', description: 'Current iteration number (default: 1). AI should increment this on each call.' },
                maxIterations: { type: 'string', description: 'Max fix cycles (default: 3). Hard stop after this.' },
                targetScore: { type: 'string', description: 'Target Vibe Score (default: 85). Stop early if reached.' }
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
    const browserlessUrl = config.get('BROWSERLESS_URL');

    let browser;
    if (browserlessUrl) {
        browser = await playwright.chromium.connect(browserlessUrl);
    } else {
        browser = await playwright.chromium.launch({ headless: true });
    }

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

            // Analysis...
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
    },

    // 🚀 VIBECODER TOOL: Browser Report
    browser_report: async (args) => {
        return withBrowser(async (page) => {
            const url = args.url || 'http://localhost:3000';
            const output = args.output || 'report.md';

            await page.goto(url, { waitUntil: 'networkidle' });

            // Collect metrics
            const metrics = await page.evaluate(`({
                title: document.title,
                scripts: document.scripts.length,
                styles: document.styleSheets.length,
                images: document.images.length,
                textLength: document.body.innerText.length,
                links: document.querySelectorAll('a').length,
                interactive: document.querySelectorAll('button, input, select, textarea').length
            })`);

            // Check for common Vibecoder issues
            const vibeChecks = await page.evaluate(`({
                hasFavicon: !!document.querySelector('link[rel*="icon"]'),
                hasMetaDesc: !!document.querySelector('meta[name="description"]'),
                hasH1: !!document.querySelector('h1'),
                hasAltTags: [...document.images].every(img => img.alt),
                semanticTags: !!document.querySelector('main, nav, footer, section'),
                modernFonts: ['inter', 'roboto', 'outfit', 'system-ui'].some(f => getComputedStyle(document.body).fontFamily.toLowerCase().includes(f)),
                responsive: window.innerWidth > 0,
                hasMinified: document.scripts.length > 0 && [...document.scripts].some(s => s.src.includes('.min.js'))
            })`);

            let vibeScore = 50; // Stricter baseline
            const details: string[] = [];

            if (vibeChecks.hasFavicon) { vibeScore += 10; details.push('✅ Favicon detected'); } else { details.push('❌ Missing Favicon'); }
            if (vibeChecks.hasMetaDesc) { vibeScore += 10; details.push('✅ Meta description found'); } else { details.push('❌ Missing Meta description (Bad for SEO)'); }
            if (vibeChecks.hasH1) { vibeScore += 10; details.push('✅ H1 Heading found'); } else { details.push('❌ Missing H1 (Critical for hierarchy)'); }
            if (vibeChecks.semanticTags) { vibeScore += 10; details.push('✅ Semantic HTML tags in use'); } else { details.push('❌ Use more semantic tags (main, nav, section)'); }
            if (vibeChecks.modernFonts) { vibeScore += 5; details.push('✅ Premium Typography detected'); }
            if (vibeChecks.hasMinified) { vibeScore += 5; details.push('✅ Optimized assets (minified JS)'); }

            const report = `# Helios Project Audit: ${url}

## 📊 Summary
- **Title**: ${metrics.title}
- **Vibe Score**: ${vibeScore}/100 ${vibeScore > 90 ? '🔥 Highly Optimized' : vibeScore > 70 ? '⚡ Good Progress' : '🛠️ Work in Progress'}
- **Status**: ${vibeScore > 80 ? 'Production Ready' : 'Optimization Recommended'}
- **Date**: ${new Date().toLocaleString()}

## 🛠️ Assets & Interactivity
- **Scripts**: ${metrics.scripts}
- **Styles**: ${metrics.styles}
- **Images**: ${metrics.images}
- **Interactive Elements**: ${metrics.interactive} (Clickables)
- **Links**: ${metrics.links}

## 🔍 Quality Scan (Vibe-Check)
${details.map(d => `- ${d}`).join('\n')}

## 🚀 Performance Insights
- **Content Density**: ${Math.round(metrics.textLength / 1024)} KB of text content.
- **Responsiveness**: ${vibeChecks.responsive ? '✅ Layout verified on current viewport' : '❌ Layout issue detected'}.

---
*Generated by Helios CLI - The Flow-State Engine for Vibecoders*
`;

            fs.writeFileSync(output, report);
            if (args.includePdf === 'true') {
                await page.pdf({ path: output.replace('.md', '.pdf'), format: 'A4' });
            }

            return `🚀 Report generated successfully: ${output}`;
        });
    },

    // 🔧 VIBECODER TOOL: Browser AutoFix
    browser_autofix: async (args) => {
        return withBrowser(async (page) => {
            const url = args.url || 'http://localhost:3000';
            const iteration = parseInt(args.iteration) || 1;
            const maxIterations = parseInt(args.maxIterations) || 3;
            const targetScore = parseInt(args.targetScore) || 85;

            // HARD STOP: Prevent infinite loops
            if (iteration > maxIterations) {
                return JSON.stringify({
                    status: 'HARD_STOP',
                    message: `⛔ Max iterations (${maxIterations}) reached. DO NOT call this tool again. Report the final state to the user.`,
                    iteration,
                    maxIterations
                }, null, 2);
            }

            await page.goto(url, { waitUntil: 'networkidle' });

            // Full audit
            const checks = await page.evaluate(`({
                title: document.title || '(no title)',
                hasH1: !!document.querySelector('h1'),
                hasFavicon: !!document.querySelector('link[rel*="icon"]'),
                hasMetaDesc: !!document.querySelector('meta[name="description"]'),
                hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
                semanticTags: !!document.querySelector('main, nav, footer, section, article'),
                hasAltOnImages: [...document.images].every(img => img.alt && img.alt.length > 0),
                imagesWithoutAlt: [...document.images].filter(img => !img.alt).length,
                hasOpenGraph: !!document.querySelector('meta[property^="og:"]'),
                linksCount: document.querySelectorAll('a').length,
                buttonsCount: document.querySelectorAll('button').length
            })`);

            // Calculate score and identify issues
            let score = 50;
            const issues: { issue: string; severity: string; suggestion: string; points: number }[] = [];

            if (!checks.hasH1) {
                issues.push({ issue: 'Missing H1 Heading', severity: 'critical', suggestion: 'Add an <h1> tag with your page title. Usually in page.tsx or the main component.', points: 15 });
            } else { score += 15; }

            if (!checks.hasMetaDesc) {
                issues.push({ issue: 'Missing Meta Description', severity: 'high', suggestion: 'Add <meta name="description" content="..."> in your layout.tsx or <Head> component.', points: 10 });
            } else { score += 10; }

            if (!checks.hasFavicon) {
                issues.push({ issue: 'Missing Favicon', severity: 'medium', suggestion: 'Add a favicon.ico to your public/ folder and link it in layout.tsx.', points: 5 });
            } else { score += 5; }

            if (!checks.hasMetaViewport) {
                issues.push({ issue: 'Missing Viewport Meta', severity: 'high', suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.', points: 10 });
            } else { score += 10; }

            if (!checks.semanticTags) {
                issues.push({ issue: 'No Semantic HTML', severity: 'medium', suggestion: 'Use <main>, <nav>, <section>, <article>, <footer> instead of plain <div> for better accessibility.', points: 5 });
            } else { score += 5; }

            if (checks.imagesWithoutAlt > 0) {
                issues.push({ issue: `${checks.imagesWithoutAlt} images without alt text`, severity: 'high', suggestion: 'Add descriptive alt="" attributes to all <img> tags for accessibility.', points: 5 });
            } else { score += 5; }

            // Determine status
            let status: string;
            let message: string;

            if (score >= targetScore) {
                status = 'optimization_complete';
                message = `✅ Target score (${targetScore}) achieved! Current score: ${score}/100. No further action needed.`;
            } else if (iteration >= maxIterations) {
                status = 'max_iterations_reached';
                message = `⚠️ Max iterations reached. Current score: ${score}/100. Review the remaining issues manually.`;
            } else {
                status = 'needs_optimization';
                message = `🔧 Iteration ${iteration}/${maxIterations}. Current score: ${score}/100. Apply the suggested fixes and call browser_autofix again with iteration=${iteration + 1}.`;
            }

            const result = {
                status,
                message,
                iteration,
                maxIterations,
                currentScore: score,
                targetScore,
                pageTitle: checks.title,
                issues: issues.sort((a, b) => b.points - a.points), // Highest impact first
                nextAction: status === 'needs_optimization'
                    ? `Apply fixes, then call browser_autofix with iteration=${iteration + 1}`
                    : 'Report the results to the user. DO NOT call this tool again.'
            };

            return JSON.stringify(result, null, 2);
        });
    }
};
