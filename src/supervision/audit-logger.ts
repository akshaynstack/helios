import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface AuditEntry {
    timestamp: string;
    action: string;
    args: Record<string, any>;
    result: 'success' | 'error' | 'blocked';
    supervision?: {
        loopDetected?: boolean;
        securityIssues?: number;
    };
}

export class AuditLogger {
    private logPath: string;

    constructor() {
        const heliosDir = path.join(os.homedir(), '.helios');
        if (!fs.existsSync(heliosDir)) {
            fs.mkdirSync(heliosDir, { recursive: true });
        }
        this.logPath = path.join(heliosDir, 'audit.jsonl');
    }

    /**
     * Log an action
     */
    log(entry: Omit<AuditEntry, 'timestamp'>): void {
        const fullEntry: AuditEntry = {
            timestamp: new Date().toISOString(),
            ...entry
        };

        try {
            fs.appendFileSync(this.logPath, JSON.stringify(fullEntry) + '\n');
        } catch (e) {
            // Silently fail - audit logging shouldn't break the app
        }
    }

    /**
     * Get recent audit entries
     */
    getRecent(limit = 50): AuditEntry[] {
        try {
            if (!fs.existsSync(this.logPath)) return [];

            const content = fs.readFileSync(this.logPath, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            const entries = lines.slice(-limit).map(line => JSON.parse(line));

            return entries.reverse();
        } catch (e) {
            return [];
        }
    }

    /**
     * Get session stats
     */
    getStats(): { total: number; blocked: number; errors: number } {
        const entries = this.getRecent(1000);
        return {
            total: entries.length,
            blocked: entries.filter(e => e.result === 'blocked').length,
            errors: entries.filter(e => e.result === 'error').length
        };
    }
}

export const auditLogger = new AuditLogger();
