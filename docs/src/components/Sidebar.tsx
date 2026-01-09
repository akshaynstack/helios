'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface NavItem {
    title: string;
    href: string;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Introduction', href: '/docs' },
            { title: 'Why Helios?', href: '/docs/why-helios' },
            { title: 'Installation', href: '/docs/installation' },
            { title: 'Quick Start', href: '/docs/quickstart' },
        ],
    },
    {
        title: 'Configuration',
        items: [
            { title: 'API Keys', href: '/docs/config/api-keys' },
            { title: 'Models', href: '/docs/config/models' },
            { title: 'Settings', href: '/docs/config/settings' },
        ],
    },
    {
        title: 'CLI Commands',
        items: [
            { title: 'Chat', href: '/docs/commands/chat' },
            { title: 'UI Expert', href: '/docs/commands/ui' },
            { title: 'MCP Server', href: '/docs/commands/mcp' },
            { title: 'Doctor', href: '/docs/commands/doctor' },
        ],
    },
    {
        title: 'Tools',
        items: [
            { title: 'Overview', href: '/docs/tools' },
            { title: 'File Operations', href: '/docs/tools/file' },
            { title: 'Git Integration', href: '/docs/tools/git' },
            { title: 'Shell Commands', href: '/docs/tools/shell' },
            { title: 'Browser Tools', href: '/docs/tools/browser' },
            { title: 'Cloud & DevOps', href: '/docs/tools/cloud' },
        ],
    },
    {
        title: 'Advanced',
        items: [
            { title: 'MCP Integration', href: '/docs/advanced/mcp' },
            { title: 'Supervision Layer', href: '/docs/advanced/supervision' },
            { title: 'Slash Commands', href: '/docs/advanced/slash-commands' },
        ],
    },
];

function NavContent({ currentPath, onLinkClick }: { currentPath: string; onLinkClick?: () => void }) {
    return (
        <nav className="p-4 space-y-6">
            {navigation.map((section) => (
                <div key={section.title}>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        {section.title}
                    </h3>
                    <ul className="space-y-1">
                        {section.items.map((item) => {
                            const isActive = currentPath === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onLinkClick}
                                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${isActive
                                            ? 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-500'
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

export default function Sidebar({ currentPath }: { currentPath: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center gap-2"
                aria-label="Toggle menu"
            >
                {/* Pulse ring animation */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
                )}
                <span className="relative">
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </span>
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <NavContent currentPath={currentPath} onLinkClick={() => setIsOpen(false)} />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 h-[calc(100vh-64px)] overflow-y-auto sticky top-16 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex-shrink-0">
                <NavContent currentPath={currentPath} />
            </aside>
        </>
    );
}
