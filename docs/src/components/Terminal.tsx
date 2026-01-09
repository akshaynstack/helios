'use client';

import { useState, useEffect } from 'react';

const scenarios = [
    {
        title: 'helios — doctor',
        lines: [
            { type: 'comment', content: '# Checking the environment' },
            { type: 'command', content: 'helios doctor' },
            { type: 'output', content: '✔ Ripgrep (rg) detected: v14.1.0', delay: 200 },
            { type: 'output', content: '✔ fd-find detected: v9.0.0', delay: 100 },
            { type: 'output', content: '✔ Playwright Environment Ready', delay: 200 },
            { type: 'output', content: 'ℹ Found Browser Grid (ws://localhost:9222)', delay: 300 },
            { type: 'output', content: '✔ Engine Power: 100% 🔥', delay: 400, highlight: true },
        ]
    },
    {
        title: 'helios — browser-report',
        lines: [
            { type: 'comment', content: '# Auditing visual experience' },
            { type: 'command', content: 'helios browser_report --url "http://localhost:3000"' },
            { type: 'output', content: '➜ Connecting to Chrome Instance...', delay: 300 },
            { type: 'output', content: '➜ Analyzing Accessibility & SEO...', delay: 400 },
            { type: 'output', content: '✔ Report Generated: report.md', delay: 200 },
            { type: 'output', content: '✔ Vibe Score: 92/100 (Excellent) ✨', delay: 400, highlight: true },
        ]
    },
    {
        title: 'helios — semantic search',
        lines: [
            { type: 'comment', content: '# Searching by meaning' },
            { type: 'command', content: 'helios mgrep "where is the auth handled?"' },
            { type: 'output', content: '➜ Scanning AST & Symbol tree...', delay: 200 },
            { type: 'output', content: '➜ Ranking semantic matches...', delay: 300 },
            { type: 'output', content: '✔ Found in src/lib/auth.ts (98% confidence)', delay: 200 },
            { type: 'output', content: '✔ Found in src/hooks/useUser.ts (85%)', delay: 100 },
        ]
    }
];

export function Terminal() {
    const [currentScenario, setCurrentScenario] = useState(0);
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [currentCommandText, setCurrentCommandText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const runAnimation = async () => {
            const scenario = scenarios[currentScenario];

            // First show the comment
            if (isCancelled) return;
            setVisibleLines(1);
            await new Promise(r => setTimeout(r, 600));

            // Start typing command
            setIsTyping(true);
            const command = scenario.lines[1].content;
            for (let i = 0; i <= command.length; i++) {
                if (isCancelled) return;
                setCurrentCommandText(command.slice(0, i));
                await new Promise(r => setTimeout(r, 40 + Math.random() * 30));
            }
            setIsTyping(false);
            setVisibleLines(2);
            await new Promise(r => setTimeout(r, 300));

            // Show outputs sequentially
            for (let i = 2; i < scenario.lines.length; i++) {
                if (isCancelled) return;
                await new Promise(r => setTimeout(r, scenario.lines[i].delay || 200));
                setVisibleLines(i + 1);
            }

            // Pause before switching
            await new Promise(r => setTimeout(r, 5000));

            if (isCancelled) return;
            // Fade out effect start (resetting)
            setVisibleLines(0);
            setCurrentCommandText('');
            setCurrentScenario((prev) => (prev + 1) % scenarios.length);
        };

        runAnimation();

        return () => {
            isCancelled = true;
        };
    }, [currentScenario]);

    const activeScenario = scenarios[currentScenario];

    return (
        <div className="relative max-w-4xl mx-auto rounded-xl border border-zinc-800 bg-[#0A0A0A] shadow-2xl overflow-hidden group h-[300px] md:h-[360px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50 bg-[#0F0F0F]">
                <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="ml-4 text-[9px] md:text-[10px] text-zinc-600 font-mono tracking-widest uppercase truncate pr-4">
                    {activeScenario.title}
                </div>
            </div>
            <div className="p-4 md:p-6 text-left font-mono text-xs md:text-sm leading-relaxed transition-all duration-500">
                {visibleLines > 0 && (
                    <div className="text-zinc-500 mb-2 italic">{activeScenario.lines[0].content}</div>
                )}

                {visibleLines >= 1 && (
                    <div className="text-gray-300">
                        <span className="text-orange-500 mr-2 text-base">➜</span>
                        <span className="text-blue-400 mr-2">~</span>
                        <span className="text-zinc-200">{currentCommandText}</span>
                        {isTyping && <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse" />}
                    </div>
                )}

                <div className="mt-4 space-y-1">
                    {activeScenario.lines.slice(2).map((line, i) => {
                        if (visibleLines <= i + 2) return null;

                        const isCheck = line.content.startsWith('✔');
                        const isInfo = line.content.startsWith('ℹ');
                        const isArrow = line.content.startsWith('➜');

                        return (
                            <div key={i} className={`
                                ${line.highlight ? 'text-white font-bold' : 'text-zinc-400'}
                                ${line.content === '' ? 'h-2' : ''}
                                animate-in fade-in slide-in-from-left-2 duration-300
                            `}>
                                {isCheck && <span className="text-green-500 mr-2">✔</span>}
                                {isInfo && <span className="text-blue-400 mr-2">ℹ</span>}
                                {isArrow && <span className="text-orange-500/50 mr-2 text-xs">➜</span>}
                                {line.content
                                    .replace('✔ ', '')
                                    .replace('ℹ ', '')
                                    .replace('➜ ', '')}
                            </div>
                        );
                    })}
                    {visibleLines === activeScenario.lines.length && !isTyping && (
                        <div className="animate-pulse mt-2 text-orange-500 text-base">▋</div>
                    )}
                </div>
            </div>
        </div>
    );
}
