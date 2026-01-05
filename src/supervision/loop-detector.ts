import * as crypto from 'crypto';

interface StepRecord {
    hash: string;
    action: string;
    timestamp: number;
}

export class LoopDetector {
    private history: StepRecord[] = [];
    private consecutiveRepeats = 0;
    private maxHistory = 20;

    /**
     * Check if a step indicates a loop pattern
     */
    check(action: string, args: Record<string, any>): { isLoop: boolean; risk: 'low' | 'medium' | 'high'; message: string } {
        const hash = this.hashStep(action, args);
        const now = Date.now();

        // Check for exact consecutive repeats
        if (this.history.length > 0 && this.history[this.history.length - 1].hash === hash) {
            this.consecutiveRepeats++;
        } else {
            this.consecutiveRepeats = 0;
        }

        // Record step
        this.history.push({ hash, action, timestamp: now });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // High risk: 3+ consecutive identical actions
        if (this.consecutiveRepeats >= 2) {
            return {
                isLoop: true,
                risk: 'high',
                message: `Loop detected: "${action}" repeated ${this.consecutiveRepeats + 1} times consecutively`
            };
        }

        // Medium risk: Same action called 5+ times in recent history
        const sameActionCount = this.history.filter(h => h.action === action).length;
        if (sameActionCount >= 5) {
            return {
                isLoop: true,
                risk: 'medium',
                message: `Potential loop: "${action}" called ${sameActionCount} times recently`
            };
        }

        // Check for oscillation pattern (A -> B -> A -> B)
        if (this.detectOscillation()) {
            return {
                isLoop: true,
                risk: 'medium',
                message: 'Oscillation pattern detected: alternating between two actions'
            };
        }

        return { isLoop: false, risk: 'low', message: '' };
    }

    /**
     * Detect A-B-A-B oscillation patterns
     */
    private detectOscillation(): boolean {
        if (this.history.length < 4) return false;

        const last4 = this.history.slice(-4);
        return (
            last4[0].action === last4[2].action &&
            last4[1].action === last4[3].action &&
            last4[0].action !== last4[1].action
        );
    }

    /**
     * Reset the detector
     */
    reset(): void {
        this.history = [];
        this.consecutiveRepeats = 0;
    }

    /**
     * Create a hash for deduplication
     */
    private hashStep(action: string, args: Record<string, any>): string {
        const data = JSON.stringify({ action, args });
        return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
    }
}

export const loopDetector = new LoopDetector();
