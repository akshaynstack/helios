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
    private sessionStats = { total: 0, blocked: 0, errors: 0 };

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

        // Update session stats
        this.sessionStats.total++;
        if (entry.result === 'blocked') this.sessionStats.blocked++;
        if (entry.result === 'error') this.sessionStats.errors++;

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
    getSessionStats() {
        return { ...this.sessionStats };
    }

    /**
     * Clear session stats
     */
    resetSession(): void {
        this.sessionStats = { total: 0, blocked: 0, errors: 0 };
    }

    /**
     * Get lifetime stats
     */
    getLifetimeStats(): { total: number; blocked: number; errors: number } {
        try {
            if (!fs.existsSync(this.logPath)) return { total: 0, blocked: 0, errors: 0 };
            const content = fs.readFileSync(this.logPath, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            const entries = lines.map(line => {
                try { return JSON.parse(line); } catch { return null; }
            }).filter(Boolean);

            return {
                total: entries.length,
                blocked: entries.filter((e: any) => e.result === 'blocked').length,
                errors: entries.filter((e: any) => e.result === 'error').length
            };
        } catch (e) {
            return { total: 0, blocked: 0, errors: 0 };
        }
    }
}

export const auditLogger = new AuditLogger();
