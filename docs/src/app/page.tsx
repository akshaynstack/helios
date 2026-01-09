import Link from 'next/link';

const features = [
  {
    icon: '🚀',
    title: 'Flow-State Engine',
    description: 'Triple-threat search (ripgrep, fd, mgrep) for instant context and meaning-based discovery',
  },
  {
    icon: '🛡️',
    title: 'Proactive Autopilot',
    description: 'Zero-interruption background installs for rg, fd, and playwright. Stay in the zone.',
  },
  {
    icon: '📊',
    title: 'Engine Analytics',
    description: 'Real-time efficiency metrics showing tokens saved, engine power, and cost avoided',
  },
  {
    icon: '🔌',
    title: 'Unstoppable Tooling',
    description: '130+ tools with MCP support, smart scaffolding, and multi-provider fallback flow',
  },
  {
    icon: '🎨',
    title: 'Visual Intelligence',
    description: 'Generate stunning UIs with v0 and verify them with auto-installing browser tools',
  },
  {
    icon: '🔄',
    title: 'Multi-Provider Flow',
    description: 'OpenRouter, Claude, OpenAI - automatic model-mapping and robust tool-call fallbacks',
  },
];

const commands = [
  { cmd: 'helios', desc: 'Start interactive chat mode' },
  { cmd: 'helios "fix the bug"', desc: 'Single command mode' },
  { cmd: 'helios ui "dashboard"', desc: 'Generate UI components' },
  { cmd: 'helios mcp', desc: 'Start MCP server' },
  { cmd: 'helios doctor', desc: 'Diagnose configuration' },
  { cmd: 'helios tools', desc: 'List all available tools' },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="relative max-w-screen-2xl mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-orange-400">v0.2.0</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">BridgeMind Vibeathon Entry</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-amber-400 bg-clip-text text-transparent">
              Helios Engine
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mb-8">
              The <span className="text-white font-semibold">Flow-State Engine</span> for Vibecoders.
              Ultra-fast search, proactive automation, and real-time efficiency proof.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/docs/installation"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="https://github.com/akshaynstack/helios"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors border border-zinc-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                View on GitHub
              </a>
            </div>

            {/* Terminal Preview */}
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-zinc-500">Terminal</span>
              </div>
              <div className="p-4 font-mono text-sm">
                <div className="text-zinc-500">$ npm install -g helios-cli</div>
                <div className="text-zinc-500 mt-2">$ helios config set OPENROUTER_API_KEY sk-or-...</div>
                <div className="text-zinc-500 mt-2">$ helios</div>
                <div className="mt-4 text-orange-400">
                  ██╗  ██╗███████╗██╗     ██╗ ██████╗ ███████╗<br />
                  ██║  ██║██╔════╝██║     ██║██╔═══██╗██╔════╝<br />
                  ███████║█████╗  ██║     ██║██║   ██║███████╗<br />
                  ██╔══██║██╔══╝  ██║     ██║██║   ██║╚════██║<br />
                  ██║  ██║███████╗███████╗██║╚██████╔╝███████║<br />
                  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚══════╝
                </div>
                <div className="mt-2 text-zinc-400">⚡ High-Performance Context Engine • 130+ Tools</div>
                <div className="mt-1 text-cyan-400">🚀 Engine Power: 98.4% Optimized</div>
                <div className="mt-4 text-green-400">? How can I boost your flow today?</div>
                <div className="mt-1 text-white">▊</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need</h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            Helios combines the power of multiple AI providers with a comprehensive toolkit
            for modern software development.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 hover:border-zinc-700 transition-all"
              >
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commands Section */}
      <section className="py-24 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-screen-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Quick Commands</h2>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-16">
            Get started in seconds with these simple commands.
          </p>

          <div className="max-w-2xl mx-auto space-y-3">
            {commands.map((item) => (
              <div
                key={item.cmd}
                className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
              >
                <code className="text-orange-400 font-mono text-sm">{item.cmd}</code>
                <span className="text-zinc-500 text-sm">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            Install Helios CLI and supercharge your development workflow with AI-powered assistance.
          </p>
          <div className="inline-block bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm">
            <span className="text-zinc-500">$</span>{' '}
            <span className="text-white">npm install -g helios-cli</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-500 text-sm">
            Built with ❤️ for <span className="text-zinc-300">BridgeMind Vibeathon</span>
          </div>
          <div className="text-zinc-500 text-sm">
            MIT © <a href="https://github.com/akshaynstack" className="text-zinc-300 hover:text-white">akshaynstack</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
