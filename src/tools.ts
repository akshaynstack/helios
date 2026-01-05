/**
 * Helios Tools - Complete toolkit for vibe coders
 * 40+ Tools covering file ops, git, npm, AND AI-assisted coding
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description: string }>;
        required: string[];
    };
}

// ==================== TOOL DEFINITIONS ====================

export const tools: Tool[] = [
    // ============ FILE OPERATIONS ============
    {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' }
            },
            required: ['path']
        }
    },
    {
        name: 'write_file',
        description: 'Create or overwrite a file with content',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to write' }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'edit_file',
        description: 'Edit a file by replacing specific text (surgical edit)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                search: { type: 'string', description: 'Exact text to find and replace' },
                replace: { type: 'string', description: 'New text to replace with' }
            },
            required: ['path', 'search', 'replace']
        }
    },
    {
        name: 'insert_at_line',
        description: 'Insert content at a specific line number',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                line: { type: 'string', description: 'Line number to insert at' },
                content: { type: 'string', description: 'Content to insert' }
            },
            required: ['path', 'line', 'content']
        }
    },
    {
        name: 'append_file',
        description: 'Append content to the end of a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to append' }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to delete' }
            },
            required: ['path']
        }
    },
    {
        name: 'rename_file',
        description: 'Rename or move a file',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Current path' },
                to: { type: 'string', description: 'New path' }
            },
            required: ['from', 'to']
        }
    },
    {
        name: 'copy_file',
        description: 'Copy a file to new location',
        parameters: {
            type: 'object',
            properties: {
                from: { type: 'string', description: 'Source path' },
                to: { type: 'string', description: 'Destination path' }
            },
            required: ['from', 'to']
        }
    },
    {
        name: 'list_directory',
        description: 'List files and directories',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path' },
                recursive: { type: 'string', description: 'List recursively (true/false)' }
            },
            required: []
        }
    },
    {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to create' }
            },
            required: ['path']
        }
    },

    // ============ SEARCH ============
    {
        name: 'search_files',
        description: 'Search for text pattern across files',
        parameters: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: 'Text to search' },
                path: { type: 'string', description: 'Directory to search' },
                file_pattern: { type: 'string', description: 'File glob (e.g., *.ts)' }
            },
            required: ['pattern']
        }
    },
    {
        name: 'find_files',
        description: 'Find files by name pattern',
        parameters: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: 'Filename pattern' },
                path: { type: 'string', description: 'Search directory' }
            },
            required: ['pattern']
        }
    },
    {
        name: 'find_and_replace_all',
        description: 'Find and replace text across multiple files',
        parameters: {
            type: 'object',
            properties: {
                search: { type: 'string', description: 'Text to find' },
                replace: { type: 'string', description: 'Replacement text' },
                path: { type: 'string', description: 'Directory to search' },
                file_pattern: { type: 'string', description: 'File glob (e.g., *.ts)' }
            },
            required: ['search', 'replace']
        }
    },

    // ============ SHELL ============
    {
        name: 'run_command',
        description: 'Execute a shell command',
        parameters: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'Command to execute' },
                cwd: { type: 'string', description: 'Working directory' }
            },
            required: ['command']
        }
    },

    // ============ GIT ============
    {
        name: 'git_status',
        description: 'Show git status',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'git_diff',
        description: 'Show git diff',
        parameters: {
            type: 'object',
            properties: {
                file: { type: 'string', description: 'Specific file (optional)' }
            },
            required: []
        }
    },
    {
        name: 'git_commit',
        description: 'Stage all and commit',
        parameters: {
            type: 'object',
            properties: {
                message: { type: 'string', description: 'Commit message' }
            },
            required: ['message']
        }
    },
    {
        name: 'git_log',
        description: 'Show recent commits',
        parameters: {
            type: 'object',
            properties: {
                count: { type: 'string', description: 'Number of commits' }
            },
            required: []
        }
    },
    {
        name: 'git_branch',
        description: 'List or create branches',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'New branch name (optional)' }
            },
            required: []
        }
    },
    {
        name: 'git_stash',
        description: 'Stash or apply stashed changes',
        parameters: {
            type: 'object',
            properties: {
                action: { type: 'string', description: 'push, pop, or list' }
            },
            required: []
        }
    },
    {
        name: 'git_undo',
        description: 'Undo last commit or discard changes',
        parameters: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'commit (soft reset) or changes (discard)' }
            },
            required: ['type']
        }
    },

    // ============ NPM ============
    {
        name: 'install_package',
        description: 'Install npm package',
        parameters: {
            type: 'object',
            properties: {
                package: { type: 'string', description: 'Package name' },
                dev: { type: 'string', description: 'Dev dependency (true/false)' }
            },
            required: ['package']
        }
    },
    {
        name: 'uninstall_package',
        description: 'Uninstall npm package',
        parameters: {
            type: 'object',
            properties: {
                package: { type: 'string', description: 'Package name' }
            },
            required: ['package']
        }
    },
    {
        name: 'list_packages',
        description: 'List installed packages',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'run_script',
        description: 'Run npm script from package.json',
        parameters: {
            type: 'object',
            properties: {
                script: { type: 'string', description: 'Script name (e.g., dev, build, test)' }
            },
            required: ['script']
        }
    },

    // ============ CODE ANALYSIS ============
    {
        name: 'analyze_project',
        description: 'Analyze project structure and tech stack',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Project path' }
            },
            required: []
        }
    },
    {
        name: 'check_types',
        description: 'Run TypeScript type checking',
        parameters: { type: 'object', properties: {}, required: [] }
    },
    {
        name: 'lint_code',
        description: 'Run ESLint on files',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File or directory' },
                fix: { type: 'string', description: 'Auto-fix issues (true/false)' }
            },
            required: []
        }
    },
    {
        name: 'find_todos',
        description: 'Find all TODO/FIXME comments in codebase',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory to search' }
            },
            required: []
        }
    },
    {
        name: 'count_lines',
        description: 'Count lines of code by file type',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory' }
            },
            required: []
        }
    },

    // ============ CODE GENERATION ============
    {
        name: 'generate_test',
        description: 'Generate test file for source file',
        parameters: {
            type: 'object',
            properties: {
                source_file: { type: 'string', description: 'Source file path' },
                framework: { type: 'string', description: 'jest, vitest, or mocha' }
            },
            required: ['source_file']
        }
    },
    {
        name: 'scaffold_component',
        description: 'Create React/Vue component boilerplate',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Component name' },
                type: { type: 'string', description: 'react, vue, svelte' },
                path: { type: 'string', description: 'Output directory' }
            },
            required: ['name']
        }
    },
    {
        name: 'scaffold_api',
        description: 'Create API route boilerplate',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Route name (e.g., users)' },
                framework: { type: 'string', description: 'express, fastify, nextjs' }
            },
            required: ['name']
        }
    },
    {
        name: 'generate_types',
        description: 'Generate TypeScript types from JSON',
        parameters: {
            type: 'object',
            properties: {
                json: { type: 'string', description: 'JSON string or file path' },
                name: { type: 'string', description: 'Type name' }
            },
            required: ['json', 'name']
        }
    },
    {
        name: 'create_env',
        description: 'Create .env file with variables',
        parameters: {
            type: 'object',
            properties: {
                variables: { type: 'string', description: 'JSON of key-value pairs' }
            },
            required: ['variables']
        }
    },

    // ============ AI-ASSISTED CODING (These leverage the LLM itself) ============
    {
        name: 'explain_code',
        description: 'Read a file and explain what the code does in plain English',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File to explain' }
            },
            required: ['path']
        }
    },
    {
        name: 'fix_error',
        description: 'Analyze an error message and provide fix suggestions',
        parameters: {
            type: 'object',
            properties: {
                error: { type: 'string', description: 'Error message or stack trace' },
                file: { type: 'string', description: 'Related file (optional)' }
            },
            required: ['error']
        }
    },
    {
        name: 'suggest_improvements',
        description: 'Analyze code and suggest improvements',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File to analyze' }
            },
            required: ['path']
        }
    },
    {
        name: 'add_documentation',
        description: 'Add JSDoc/TSDoc comments to functions in a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File to document' }
            },
            required: ['path']
        }
    },
    {
        name: 'convert_code',
        description: 'Convert code between formats (e.g., JS to TS, class to hooks)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File to convert' },
                target: { type: 'string', description: 'Target format (e.g., typescript, hooks, async)' }
            },
            required: ['path', 'target']
        }
    },
    {
        name: 'extract_function',
        description: 'Extract selected code into a new function',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File path' },
                code: { type: 'string', description: 'Code to extract' },
                function_name: { type: 'string', description: 'New function name' }
            },
            required: ['path', 'code', 'function_name']
        }
    },
    {
        name: 'add_error_handling',
        description: 'Add try/catch error handling to a file',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'File to modify' }
            },
            required: ['path']
        }
    },
    {
        name: 'detect_secrets',
        description: 'Scan codebase for hardcoded API keys, passwords, and secrets. Optionally move them to .env',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory to scan (default: current)' },
                fix: { type: 'string', description: 'Auto-fix by moving to .env (true/false)' }
            },
            required: []
        }
    },
    {
        name: 'audit_packages',
        description: 'Check for security vulnerabilities in dependencies (npm, pip, cargo, etc.)',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Project directory (default: current)' }
            },
            required: []
        }
    },
    {
        name: 'check_outdated',
        description: 'Check for outdated packages that need updating',
        parameters: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Project directory (default: current)' }
            },
            required: []
        }
    }
];

// ==================== TOOL IMPLEMENTATIONS ====================

// Secret detection patterns
const SECRET_PATTERNS = [
    { name: 'API_KEY', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']([^"']{10,})["']/gi },
    { name: 'SECRET_KEY', regex: /(?:secret[_-]?key|secretkey)\s*[:=]\s*["']([^"']{10,})["']/gi },
    { name: 'PASSWORD', regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"']{4,})["']/gi },
    { name: 'TOKEN', regex: /(?:token|auth[_-]?token|access[_-]?token)\s*[:=]\s*["']([^"']{10,})["']/gi },
    { name: 'DATABASE_URL', regex: /(?:database[_-]?url|db[_-]?url|mongo[_-]?uri)\s*[:=]\s*["']([^"']{10,})["']/gi },
    { name: 'AWS_KEY', regex: /(?:aws[_-]?access|aws[_-]?secret)\s*[:=]\s*["']([A-Z0-9]{16,})["']/gi },
    { name: 'PRIVATE_KEY', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/gi },
    { name: 'OPENAI_KEY', regex: /sk-[a-zA-Z0-9]{32,}/g },
    { name: 'STRIPE_KEY', regex: /(?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{24,}/g },
    { name: 'GITHUB_TOKEN', regex: /ghp_[a-zA-Z0-9]{36}/g },
    { name: 'OPENROUTER_KEY', regex: /sk-or-v1-[a-zA-Z0-9]{64}/g },
];

function detectSecrets(searchPath: string = '.', fix: boolean = false): string {
    const found: Array<{ file: string; line: number; name: string; value: string }> = [];

    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                } else if (/\.(js|ts|jsx|tsx|json|py|rb|go|java|php|env\.example)$/.test(item)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const lines = content.split('\n');

                        lines.forEach((line, lineNum) => {
                            for (const pattern of SECRET_PATTERNS) {
                                const matches = line.matchAll(pattern.regex);
                                for (const match of matches) {
                                    found.push({
                                        file: fullPath,
                                        line: lineNum + 1,
                                        name: pattern.name,
                                        value: match[1] || match[0]
                                    });
                                }
                            }
                        });
                    } catch { }
                }
            }
        } catch { }
    };

    walk(searchPath);

    if (found.length === 0) {
        return '✓ No hardcoded secrets detected';
    }

    let result = `⚠️ Found ${found.length} potential secrets:\n\n`;
    found.forEach(s => {
        const preview = s.value.slice(0, 10) + '...' + s.value.slice(-4);
        result += `  ${s.file}:${s.line}\n    ${s.name}: ${preview}\n`;
    });

    if (fix) {
        // Create/update .env file
        const envPath = path.join(searchPath, '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf-8') + '\n';
        }

        const added: string[] = [];
        found.forEach(s => {
            const envVarName = s.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            if (!envContent.includes(envVarName + '=')) {
                envContent += `${envVarName}=${s.value}\n`;
                added.push(envVarName);
            }
        });

        if (added.length > 0) {
            fs.writeFileSync(envPath, envContent);
            result += `\n✓ Added ${added.length} secrets to .env:\n  ${added.join(', ')}\n`;
            result += '\n💡 Next: Replace hardcoded values with process.env.VAR_NAME';
        }
    } else {
        result += '\n💡 Run with fix=true to move secrets to .env';
    }

    return result;
}

function auditPackages(projectPath: string = '.'): string {
    const results: string[] = [];

    // Detect package manager and run audit
    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
        // Node.js project - try npm/pnpm/yarn/bun
        results.push('📦 Node.js project detected\n');

        // Try npm audit first
        try {
            const audit = execSync('npm audit --json 2>/dev/null', {
                cwd: projectPath,
                encoding: 'utf-8',
                timeout: 30000
            });
            const data = JSON.parse(audit);
            if (data.metadata?.vulnerabilities) {
                const v = data.metadata.vulnerabilities;
                results.push(`Vulnerabilities: ${v.critical || 0} critical, ${v.high || 0} high, ${v.moderate || 0} moderate, ${v.low || 0} low`);
            }
        } catch (e: any) {
            // npm audit without --json for fallback
            const auditText = execSync('npm audit 2>&1 || true', { cwd: projectPath, encoding: 'utf-8', timeout: 30000 });
            if (auditText.includes('found 0 vulnerabilities')) {
                results.push('✓ No vulnerabilities found');
            } else if (auditText.includes('vulnerabilities')) {
                const match = auditText.match(/found (\d+) vulnerabilit/);
                results.push(`⚠️ ${match ? match[1] : 'Some'} vulnerabilities found`);
                results.push(auditText.split('\n').slice(0, 10).join('\n'));
            }
        }
    }

    if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
        results.push('\n🐍 Python project detected');
        try {
            const pipAudit = execSync('pip-audit 2>&1 || python -m pip_audit 2>&1 || echo "Install: pip install pip-audit"', {
                cwd: projectPath,
                encoding: 'utf-8',
                timeout: 60000
            });
            results.push(pipAudit.slice(0, 500));
        } catch {
            results.push('Run: pip install pip-audit && pip-audit');
        }
    }

    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
        results.push('\n🦀 Rust project detected');
        try {
            const cargoAudit = execSync('cargo audit 2>&1 || echo "Install: cargo install cargo-audit"', {
                cwd: projectPath,
                encoding: 'utf-8',
                timeout: 60000
            });
            results.push(cargoAudit.slice(0, 500));
        } catch {
            results.push('Run: cargo install cargo-audit && cargo audit');
        }
    }

    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
        results.push('\n🐹 Go project detected');
        try {
            const goVuln = execSync('govulncheck ./... 2>&1 || echo "Install: go install golang.org/x/vuln/cmd/govulncheck@latest"', {
                cwd: projectPath,
                encoding: 'utf-8',
                timeout: 60000
            });
            results.push(goVuln.slice(0, 500));
        } catch {
            results.push('Run: go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./...');
        }
    }

    return results.join('\n') || 'No package manager detected';
}

function checkOutdated(projectPath: string = '.'): string {
    const results: string[] = [];

    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
        results.push('📦 Checking npm packages...\n');
        try {
            const outdated = execSync('npm outdated 2>&1 || true', { cwd: projectPath, encoding: 'utf-8', timeout: 30000 });
            if (!outdated.trim() || outdated.includes('Package')) {
                results.push(outdated || '✓ All packages up to date');
            }
        } catch (e: any) {
            results.push(e.stdout || 'Could not check outdated packages');
        }
    }

    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
        results.push('\n🐍 Checking pip packages...');
        try {
            const pipOutdated = execSync('pip list --outdated 2>&1 | head -20', { cwd: projectPath, encoding: 'utf-8', timeout: 30000 });
            results.push(pipOutdated || '✓ All packages up to date');
        } catch {
            results.push('Run: pip list --outdated');
        }
    }

    return results.join('\n') || 'No package manager detected';
}

function safeExec(cmd: string, cwd?: string): string {
    try {
        return execSync(cmd, {
            encoding: 'utf-8',
            timeout: 30000,
            cwd: cwd || process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    } catch (e: any) {
        return e.stdout || e.stderr || e.message;
    }
}

function readFile(filepath: string): string {
    try {
        return fs.readFileSync(filepath, 'utf-8');
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function writeFile(filepath: string, content: string): string {
    try {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        fs.writeFileSync(filepath, content);
        return `✓ Created ${filepath}`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function editFile(filepath: string, search: string, replace: string): string {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        if (!content.includes(search)) {
            return `Error: Could not find text in ${filepath}. File content preview:\n${content.slice(0, 500)}...`;
        }
        fs.writeFileSync(filepath, content.replace(search, replace));
        return `✓ Edited ${filepath}`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function insertAtLine(filepath: string, lineNum: number, content: string): string {
    try {
        const lines = fs.readFileSync(filepath, 'utf-8').split('\n');
        lines.splice(lineNum - 1, 0, content);
        fs.writeFileSync(filepath, lines.join('\n'));
        return `✓ Inserted at line ${lineNum} in ${filepath}`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function listDirectory(dirPath: string = '.', recursive: boolean = false): string {
    try {
        if (recursive) {
            const results: string[] = [];
            const walk = (dir: string, prefix = '') => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    results.push(`${prefix}${stat.isDirectory() ? '📁' : '📄'} ${item}`);
                    if (stat.isDirectory() && results.length < 100) {
                        walk(fullPath, prefix + '  ');
                    }
                }
            };
            walk(dirPath);
            return results.join('\n') || '(empty)';
        }

        const items = fs.readdirSync(dirPath);
        return items.filter(i => !i.startsWith('.')).map(item => {
            const stat = fs.statSync(path.join(dirPath, item));
            return `${stat.isDirectory() ? '📁' : '📄'} ${item}`;
        }).join('\n') || '(empty)';
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function findAndReplaceAll(search: string, replace: string, searchPath: string = '.', filePattern: string = '*.ts'): string {
    const modified: string[] = [];
    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walk(fullPath);
                } else if (item.match(new RegExp(filePattern.replace('*', '.*')))) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    if (content.includes(search)) {
                        fs.writeFileSync(fullPath, content.split(search).join(replace));
                        modified.push(fullPath);
                    }
                }
            }
        } catch { }
    };
    walk(searchPath);
    return modified.length ? `✓ Modified ${modified.length} files:\n${modified.join('\n')}` : 'No matches found';
}

function gitBranch(name?: string): string {
    if (name) {
        return safeExec(`git checkout -b ${name}`);
    }
    return safeExec('git branch -a');
}

function gitStash(action: string = 'push'): string {
    return safeExec(`git stash ${action}`);
}

function gitUndo(type: string): string {
    if (type === 'commit') {
        return safeExec('git reset --soft HEAD~1');
    } else if (type === 'changes') {
        return safeExec('git checkout -- .');
    }
    return 'Unknown undo type. Use: commit or changes';
}

function runScript(script: string): string {
    return safeExec(`npm run ${script}`);
}

function lintCode(filePath: string = '.', fix: boolean = false): string {
    const fixFlag = fix ? '--fix' : '';
    return safeExec(`npx eslint ${filePath} ${fixFlag} 2>/dev/null || echo "ESLint not configured"`);
}

function findTodos(searchPath: string = '.'): string {
    try {
        const results: string[] = [];
        const walk = (dir: string) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) walk(fullPath);
                else {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const lines = content.split('\n');
                        lines.forEach((line, i) => {
                            if (/TODO|FIXME|HACK|XXX/i.test(line)) {
                                results.push(`${fullPath}:${i + 1}: ${line.trim()}`);
                            }
                        });
                    } catch { }
                }
            }
        };
        walk(searchPath);
        return results.slice(0, 30).join('\n') || 'No TODOs found';
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

function countLines(searchPath: string = '.'): string {
    const counts: Record<string, number> = {};
    const walk = (dir: string) => {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                if (item.startsWith('.') || item === 'node_modules' || item === 'dist') continue;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) walk(fullPath);
                else {
                    const ext = path.extname(item) || 'other';
                    try {
                        const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
                        counts[ext] = (counts[ext] || 0) + lines;
                    } catch { }
                }
            }
        } catch { }
    };
    walk(searchPath);
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([ext, count]) => `${ext}: ${count} lines`)
        .join('\n');
}

function scaffoldApi(name: string, framework: string = 'express'): string {
    const templates: Record<string, string> = {
        express: `import express from 'express';

const router = express.Router();

// GET /${name}
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'List ${name}' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /${name}/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Get ${name}', id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /${name}
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ message: 'Created ${name}' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
`,
        nextjs: `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ message: 'List ${name}' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Created ${name}', data: body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`
    };

    const content = templates[framework] || templates.express;
    const filepath = framework === 'nextjs'
        ? `app/api/${name}/route.ts`
        : `routes/${name}.ts`;

    return writeFile(filepath, content);
}

function generateTypes(json: string, typeName: string): string {
    try {
        let obj: any;
        if (fs.existsSync(json)) {
            obj = JSON.parse(fs.readFileSync(json, 'utf-8'));
        } else {
            obj = JSON.parse(json);
        }

        const generateType = (o: any, name: string): string => {
            if (Array.isArray(o)) {
                if (o.length === 0) return `${name}[]`;
                return `Array<${generateType(o[0], name + 'Item')}>`;
            }
            if (typeof o === 'object' && o !== null) {
                const props = Object.entries(o).map(([key, val]) => {
                    const type = typeof val === 'string' ? 'string'
                        : typeof val === 'number' ? 'number'
                            : typeof val === 'boolean' ? 'boolean'
                                : Array.isArray(val) ? 'any[]'
                                    : 'any';
                    return `  ${key}: ${type};`;
                });
                return `interface ${name} {\n${props.join('\n')}\n}`;
            }
            return typeof o;
        };

        return generateType(obj, typeName);
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

// ==================== TOOL DISPATCHER ====================

export function executeTool(name: string, args: Record<string, any>): string {
    switch (name) {
        // File ops
        case 'read_file': return readFile(args.path);
        case 'write_file': return writeFile(args.path, args.content);
        case 'edit_file': return editFile(args.path, args.search, args.replace);
        case 'insert_at_line': return insertAtLine(args.path, parseInt(args.line), args.content);
        case 'append_file':
            try { fs.appendFileSync(args.path, args.content); return `✓ Appended to ${args.path}`; }
            catch (e: any) { return `Error: ${e.message}`; }
        case 'delete_file':
            try { fs.unlinkSync(args.path); return `✓ Deleted ${args.path}`; }
            catch (e: any) { return `Error: ${e.message}`; }
        case 'rename_file':
            try { fs.renameSync(args.from, args.to); return `✓ Renamed ${args.from} → ${args.to}`; }
            catch (e: any) { return `Error: ${e.message}`; }
        case 'copy_file':
            try { fs.copyFileSync(args.from, args.to); return `✓ Copied to ${args.to}`; }
            catch (e: any) { return `Error: ${e.message}`; }
        case 'list_directory': return listDirectory(args.path, args.recursive === 'true');
        case 'create_directory':
            try { fs.mkdirSync(args.path, { recursive: true }); return `✓ Created ${args.path}`; }
            catch (e: any) { return `Error: ${e.message}`; }

        // Search
        case 'search_files':
            return safeExec(`grep -rn "${args.pattern}" "${args.path || '.'}" --include="${args.file_pattern || '*'}" 2>/dev/null | head -30`) || 'No matches';
        case 'find_files':
            const results: string[] = [];
            const walkFind = (dir: string) => {
                try {
                    const items = fs.readdirSync(dir);
                    for (const item of items) {
                        if (item.startsWith('.') || item === 'node_modules') continue;
                        const fullPath = path.join(dir, item);
                        const stat = fs.statSync(fullPath);
                        if (stat.isDirectory()) walkFind(fullPath);
                        else if (item.match(new RegExp(args.pattern.replace('*', '.*')))) {
                            results.push(fullPath);
                        }
                    }
                } catch { }
            };
            walkFind(args.path || '.');
            return results.slice(0, 50).join('\n') || 'No files found';
        case 'find_and_replace_all': return findAndReplaceAll(args.search, args.replace, args.path, args.file_pattern);

        // Shell
        case 'run_command': return safeExec(args.command, args.cwd);

        // Git
        case 'git_status': return safeExec('git status --short');
        case 'git_diff': return safeExec(args.file ? `git diff "${args.file}"` : 'git diff') || '(no changes)';
        case 'git_commit':
            safeExec('git add -A');
            return safeExec(`git commit -m "${args.message}"`);
        case 'git_log': return safeExec(`git log --oneline -${args.count || 10}`);
        case 'git_branch': return gitBranch(args.name);
        case 'git_stash': return gitStash(args.action);
        case 'git_undo': return gitUndo(args.type);

        // NPM
        case 'install_package': return safeExec(`npm install ${args.dev === 'true' ? '-D' : ''} ${args.package}`);
        case 'uninstall_package': return safeExec(`npm uninstall ${args.package}`);
        case 'list_packages':
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
                return `Dependencies:\n${Object.entries(pkg.dependencies || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n\nDev:\n${Object.entries(pkg.devDependencies || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;
            } catch { return 'No package.json'; }
        case 'run_script': return runScript(args.script);

        // Analysis
        case 'analyze_project':
            const checks = [
                ['package.json', 'Node.js'], ['tsconfig.json', 'TypeScript'], ['next.config.js', 'Next.js'],
                ['vite.config.ts', 'Vite'], ['tailwind.config.js', 'Tailwind'], ['.env', 'Env vars']
            ];
            return checks.filter(([f]) => fs.existsSync(path.join(args.path || '.', f))).map(([, t]) => `✓ ${t}`).join('\n') || 'Unknown project type';
        case 'check_types': return safeExec('npx tsc --noEmit 2>&1') || '✓ No type errors';
        case 'lint_code': return lintCode(args.path, args.fix === 'true');
        case 'find_todos': return findTodos(args.path);
        case 'count_lines': return countLines(args.path);

        // Generation
        case 'generate_test':
            const content = readFile(args.source_file);
            const fns = (content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g) || []).map(m => m.match(/function\s+(\w+)/)?.[1]).filter(Boolean);
            const testContent = `import { describe, it, expect } from '${args.framework || 'vitest'}';\n\ndescribe('${path.basename(args.source_file)}', () => {\n${fns.map(f => `  it('${f}', () => { expect(true).toBe(true); });`).join('\n')}\n});\n`;
            return writeFile(args.source_file.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'), testContent);
        case 'scaffold_component':
            const compContent = `import React from 'react';\n\ninterface ${args.name}Props {}\n\nexport function ${args.name}({}: ${args.name}Props) {\n  return <div>${args.name}</div>;\n}\n`;
            return writeFile(path.join(args.path || 'src/components', `${args.name}.tsx`), compContent);
        case 'scaffold_api': return scaffoldApi(args.name, args.framework);
        case 'generate_types': return generateTypes(args.json, args.name);
        case 'create_env':
            try {
                const vars = JSON.parse(args.variables);
                return writeFile('.env', Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n'));
            } catch { return 'Invalid JSON'; }

        // AI-assisted (these return instructions for the LLM to process)
        case 'explain_code': return `[AI TASK] Explain this code:\n\n${readFile(args.path)}`;
        case 'fix_error': return `[AI TASK] Fix this error:\n${args.error}\n\nRelated file:\n${args.file ? readFile(args.file) : 'N/A'}`;
        case 'suggest_improvements': return `[AI TASK] Suggest improvements for:\n\n${readFile(args.path)}`;
        case 'add_documentation': return `[AI TASK] Add JSDoc comments to functions in:\n\n${readFile(args.path)}`;
        case 'convert_code': return `[AI TASK] Convert to ${args.target}:\n\n${readFile(args.path)}`;
        case 'extract_function': return `[AI TASK] Extract this code into function "${args.function_name}":\n${args.code}\n\nIn file: ${args.path}`;
        case 'add_error_handling': return `[AI TASK] Add try/catch error handling to:\n\n${readFile(args.path)}`;
        case 'optimize_imports': return `[AI TASK] Organize and optimize imports in:\n\n${readFile(args.path)}`;

        // Security
        case 'detect_secrets': return detectSecrets(args.path, args.fix === 'true');
        case 'audit_packages': return auditPackages(args.path || '.');
        case 'check_outdated': return checkOutdated(args.path || '.');

        default: return `Unknown tool: ${name}`;
    }
}
