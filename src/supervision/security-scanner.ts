interface SecurityIssue {
    severity: 'low' | 'medium' | 'high' | 'critical';
    pattern: string;
    message: string;
    suggestion: string;
}

const DANGEROUS_PATTERNS: Array<{
    regex: RegExp;
    severity: SecurityIssue['severity'];
    message: string;
    suggestion: string;
}> = [
        // Critical
        {
            regex: /\beval\s*\(/gi,
            severity: 'critical',
            message: 'eval() can execute arbitrary code',
            suggestion: 'Use JSON.parse() for data or Function constructor with caution'
        },
        {
            regex: /child_process\.exec\s*\([^)]*\$\{/gi,
            severity: 'critical',
            message: 'Command injection vulnerability',
            suggestion: 'Use execFile() with array arguments instead'
        },
        {
            regex: /innerHTML\s*=\s*[^;]*\+/gi,
            severity: 'critical',
            message: 'XSS vulnerability via innerHTML',
            suggestion: 'Use textContent or sanitize HTML input'
        },

        // High
        {
            regex: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
            severity: 'high',
            message: 'Potential SQL injection',
            suggestion: 'Use parameterized queries or prepared statements'
        },
        {
            regex: /document\.write\s*\(/gi,
            severity: 'high',
            message: 'document.write() is dangerous and deprecated',
            suggestion: 'Use DOM manipulation methods instead'
        },
        {
            regex: /new\s+Function\s*\(/gi,
            severity: 'high',
            message: 'Dynamic function creation can be dangerous',
            suggestion: 'Consider safer alternatives or strict input validation'
        },

        // Medium
        {
            regex: /console\.(log|debug)\s*\(/gi,
            severity: 'low',
            message: 'Console statements in production code',
            suggestion: 'Remove or use proper logging library'
        },
        {
            regex: /password\s*[:=]\s*["'][^"']+["']/gi,
            severity: 'high',
            message: 'Hardcoded password detected',
            suggestion: 'Use environment variables for secrets'
        },
        {
            regex: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
            severity: 'high',
            message: 'Hardcoded API key detected',
            suggestion: 'Use environment variables for API keys'
        },
        {
            regex: /dangerouslySetInnerHTML/gi,
            severity: 'medium',
            message: 'React dangerouslySetInnerHTML usage',
            suggestion: 'Ensure HTML is sanitized before rendering'
        },

        // Low
        {
            regex: /TODO|FIXME|HACK|XXX/gi,
            severity: 'low',
            message: 'Unresolved TODO/FIXME comment',
            suggestion: 'Address the issue or create a tracking ticket'
        }
    ];

export class SecurityScanner {
    /**
     * Scan code for security issues
     */
    scan(code: string): { approved: boolean; issues: SecurityIssue[] } {
        const issues: SecurityIssue[] = [];

        for (const pattern of DANGEROUS_PATTERNS) {
            const matches = code.match(pattern.regex);
            if (matches) {
                issues.push({
                    severity: pattern.severity,
                    pattern: matches[0],
                    message: pattern.message,
                    suggestion: pattern.suggestion
                });
            }
        }

        // Sort by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        // Approve only if no critical or high issues
        const approved = !issues.some(i => i.severity === 'critical' || i.severity === 'high');

        return { approved, issues };
    }

    /**
     * Scan a command for dangerous operations
     */
    scanCommand(command: string): { approved: boolean; issues: SecurityIssue[] } {
        const issues: SecurityIssue[] = [];

        const dangerousCommands = [
            { regex: /rm\s+-rf\s+\//i, message: 'Dangerous recursive delete on root' },
            { regex: /rm\s+-rf\s+\*/i, message: 'Recursive delete with wildcard' },
            { regex: /:(){ :|:& };:/i, message: 'Fork bomb detected' },
            { regex: /mkfs\./i, message: 'Filesystem format command' },
            { regex: /dd\s+if=.*of=\/dev/i, message: 'Direct disk write' },
            { regex: />\s*\/dev\/sda/i, message: 'Writing to disk device' },
            { regex: /chmod\s+-R\s+777/i, message: 'Overly permissive chmod' },
        ];

        for (const dc of dangerousCommands) {
            if (dc.regex.test(command)) {
                issues.push({
                    severity: 'critical',
                    pattern: command,
                    message: dc.message,
                    suggestion: 'This command is blocked for safety'
                });
            }
        }

        return { approved: issues.length === 0, issues };
    }
}

export const securityScanner = new SecurityScanner();
