'use client';

import Link from 'next/link';

export const metadata = {
    title: 'Why Choose Helios? - Helios CLI',
    description: 'Discover what makes Helios the ultimate CLI for Vibecoders',
};

export default function WhyHeliosPage() {
    return (
        <div className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-6 text-white">Why Choose Helios?</h1>

            <p className="text-xl text-zinc-400 mb-8">
                <strong className="text-white">Helios</strong> isn't just another AI CLI. It's built specifically for <strong className="text-orange-400">Vibecoders</strong> - developers who think in flows, not commands.
            </p>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-white border-b border-zinc-800 pb-2">
                🔥 You See Helios Working
            </h2>

            <p className="text-zinc-400 mb-4">
                Every tool execution shows <code className="bg-zinc-800 text-orange-400 px-1.5 py-0.5 rounded text-sm">🔥 Helios →</code> so you know exactly what's happening. No black box magic.
            </p>

            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 text-sm font-mono">
                <div className="text-orange-400">🔥 Helios → read_file</div>
                <div className="text-zinc-500">   ↣ /src/components/Button.tsx</div>
                <div className="text-orange-400 mt-2">🔥 Helios → write_file</div>
                <div className="text-zinc-500">   ↣ /src/components/Card.tsx</div>
            </pre>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-white border-b border-zinc-800 pb-2">
                Helios vs. The Rest
            </h2>

            <div className="overflow-x-auto mb-8">
                <table className="min-w-full border border-zinc-800 rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-zinc-800">
                            <th className="text-zinc-200 px-4 py-3 text-left font-semibold">Feature</th>
                            <th className="text-orange-400 px-4 py-3 text-left font-semibold">Helios</th>
                            <th className="text-zinc-200 px-4 py-3 text-left font-semibold">Claude Code</th>
                            <th className="text-zinc-200 px-4 py-3 text-left font-semibold">Cursor Agent</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">Tool Attribution</td>
                            <td className="text-green-400 px-4 py-3">🔥 Every action branded</td>
                            <td className="text-zinc-500 px-4 py-3">Hidden</td>
                            <td className="text-zinc-500 px-4 py-3">Hidden</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">130+ Native Tools</td>
                            <td className="text-green-400 px-4 py-3">✅</td>
                            <td className="text-green-400 px-4 py-3">✅</td>
                            <td className="text-zinc-500 px-4 py-3">Limited</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">Multi-Provider</td>
                            <td className="text-green-400 px-4 py-3">✅ OpenRouter, Claude, OpenAI, Google</td>
                            <td className="text-zinc-500 px-4 py-3">Anthropic only</td>
                            <td className="text-zinc-500 px-4 py-3">OpenAI focus</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">Silent Fallbacks</td>
                            <td className="text-green-400 px-4 py-3">✅ Auto-retry without tools</td>
                            <td className="text-red-400 px-4 py-3">❌ Errors</td>
                            <td className="text-red-400 px-4 py-3">❌ Errors</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">MCP Support</td>
                            <td className="text-green-400 px-4 py-3">✅ Client + Server</td>
                            <td className="text-zinc-500 px-4 py-3">Server only</td>
                            <td className="text-red-400 px-4 py-3">❌</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">Cost Transparency</td>
                            <td className="text-green-400 px-4 py-3">✅ Real-time analytics</td>
                            <td className="text-red-400 px-4 py-3">❌</td>
                            <td className="text-red-400 px-4 py-3">❌</td>
                        </tr>
                        <tr className="border-t border-zinc-800">
                            <td className="text-zinc-400 px-4 py-3">Open Source</td>
                            <td className="text-green-400 px-4 py-3">✅ MIT</td>
                            <td className="text-red-400 px-4 py-3">❌ Closed</td>
                            <td className="text-red-400 px-4 py-3">❌ Closed</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-white border-b border-zinc-800 pb-2">
                Pain Points We Solve
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">1. Context Blindness</h3>
                    <p className="text-zinc-400 text-sm">AI loses track? Helios maintains session context with intelligent memory.</p>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">2. Environment Friction</h3>
                    <p className="text-zinc-400 text-sm">"Run this manually" - Helios proactively installs missing dependencies.</p>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">3. Verification Lag</h3>
                    <p className="text-zinc-400 text-sm">Can't see the UI? Helios has browser tools to verify visually.</p>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">4. Model Lock-In</h3>
                    <p className="text-zinc-400 text-sm">Stuck with one provider? Helios supports 4 with automatic fallback.</p>
                </div>
            </div>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-white border-b border-zinc-800 pb-2">
                Get Started in 30 Seconds
            </h2>

            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4 text-sm font-mono">
                <div className="text-zinc-500">$</div>
                <div className="text-white">npm install -g helios-cli</div>
                <div className="text-white">helios config set OPENROUTER_API_KEY sk-or-...</div>
                <div className="text-white">helios</div>
            </pre>

            <p className="text-zinc-400 mb-8">
                <strong className="text-white">That's it.</strong> No IDE extension. No monthly subscription. Just pure CLI power.
            </p>

            <div className="flex flex-wrap gap-4">
                <Link
                    href="/docs/installation"
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
                >
                    Install Now →
                </Link>
                <a
                    href="https://github.com/akshaynstack/helios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium border border-zinc-700 transition-colors no-underline"
                >
                    View Source
                </a>
            </div>
        </div>
    );
}
