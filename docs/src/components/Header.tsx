import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="https://raw.githubusercontent.com/akshaynstack/helios/main/assets/icon.png"
                            alt="Helios"
                            width={32}
                            height={32}
                            className="rounded-lg"
                        />
                        <span className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                            Helios
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            CLI
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Docs
                        </Link>
                        <Link href="/docs/tools" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Tools
                        </Link>
                        <Link href="/docs/advanced/mcp" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            MCP
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="https://github.com/akshaynstack/helios"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        GitHub
                    </a>

                    <Link
                        href="/docs/installation"
                        className="hidden sm:inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}
