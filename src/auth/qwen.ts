
import chalk from 'chalk';
import open from 'open';
import crypto from 'node:crypto';
import { config } from '../config.js';

// Constants from Qwen Code CLI
const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const QWEN_OAUTH_SCOPE = 'openid profile email model.completion';
const QWEN_OAUTH_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';

interface DeviceAuthorizationResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval?: number;
}

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

// PKCE Utilities
function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(codeVerifier);
    return hash.digest('base64url');
}

function objectToUrlEncoded(data: Record<string, string>): string {
    return Object.keys(data)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
}

export class QwenAuth {
    private codeVerifier: string;

    constructor() {
        this.codeVerifier = generateCodeVerifier();
    }

    async login(): Promise<void> {
        console.log(chalk.blue('Initiating Qwen.ai authentication...'));

        const codeChallenge = generateCodeChallenge(this.codeVerifier);

        // 1. Request Device Code
        const authResponse = await fetch(QWEN_OAUTH_DEVICE_CODE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: objectToUrlEncoded({
                client_id: QWEN_OAUTH_CLIENT_ID,
                scope: QWEN_OAUTH_SCOPE,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256'
            })
        });

        if (!authResponse.ok) {
            throw new Error(`Auth request failed: ${authResponse.statusText}`);
        }

        const authData = await authResponse.json() as DeviceAuthorizationResponse;

        // 2. Show user code and open browser
        console.log(chalk.yellow('\n⚠️  Please authenticate in your browser'));
        console.log(`User Code: ${chalk.bold.green(authData.user_code)}`);
        console.log(`Verify URL: ${chalk.underline(authData.verification_uri)}\n`);

        await open(authData.verification_uri_complete || authData.verification_uri);

        // 3. Poll for token
        const spinner = (await import('ora')).default('Waiting for authentication...').start();

        try {
            const tokenData = await this.pollForToken(authData.device_code, authData.interval || 5, authData.expires_in);

            // 4. Save tokens
            config.set('QWEN_ACCESS_TOKEN', tokenData.access_token);
            if (tokenData.refresh_token) {
                config.set('QWEN_REFRESH_TOKEN', tokenData.refresh_token);
            }
            if ((tokenData as any).resource_url) {
                config.set('QWEN_RESOURCE_URL', (tokenData as any).resource_url);
            }
            // Set expiry time (current time + expires_in seconds)
            config.set('QWEN_EXPIRY', Date.now() + (tokenData.expires_in * 1000));

            spinner.succeed(chalk.green('Successfully authenticated with Qwen.ai!'));
            console.log(chalk.dim('\nYou can now use Qwen free models without an API key.'));

        } catch (error: any) {
            spinner.fail(chalk.red(`Authentication failed: ${error.message}`));
        }
    }

    private async pollForToken(deviceCode: string, intervalSeconds: number, timeoutSeconds: number): Promise<TokenResponse> {
        const startTime = Date.now();
        const timeoutMs = timeoutSeconds * 1000;

        while (Date.now() - startTime < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));

            const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: objectToUrlEncoded({
                    grant_type: QWEN_OAUTH_GRANT_TYPE,
                    client_id: QWEN_OAUTH_CLIENT_ID,
                    device_code: deviceCode,
                    code_verifier: this.codeVerifier
                })
            });

            if (response.ok) {
                return await response.json() as TokenResponse;
            }

            const errorData = await response.json() as any;
            if (errorData.error === 'authorization_pending') {
                continue;
            } else if (errorData.error === 'slow_down') {
                intervalSeconds += 5;
                continue;
            } else {
                throw new Error(errorData.error_description || errorData.error);
            }
        }

        throw new Error('Authentication timed out');
    }

    static async getAccessToken(): Promise<string | null> {
        let token = config.get('QWEN_ACCESS_TOKEN');
        const expiry = config.get('QWEN_EXPIRY');
        const refreshToken = config.get('QWEN_REFRESH_TOKEN');

        if (!token) return null;

        // Check availability/expiry (buffer of 5 minutes)
        if (Date.now() > expiry - 300000) {
            if (refreshToken) {
                // Refresh logic would go here, currently just clear and return null to force re-login
                // Implementing refresh logic below
                return await this.refreshAccessToken(refreshToken);
            }
            return null;
        }

        return token;
    }

    private static async refreshAccessToken(refreshToken: string): Promise<string | null> {
        // NOTE: Device flow refresh might differ, standard oauth refresh:
        // Qwen CLI uses sharedTokenManager which likely handles this. 
        // For simplicity, if expired, we might ask user to login again for now unless we implement full refresh flow.
        // Or implement standard refresh_token grant.

        try {
            // Basic implementation placeholder - Qwen repo suggests standard token endpoint with refresh_token grant
            // For now, let's assume relogin on expiry to be safe until verified.
            return null;
        } catch {
            return null;
        }
    }
}
