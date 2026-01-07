'use client';

import { useState } from 'react';

interface CodeBlockProps {
    children: string;
    language?: string;
    filename?: string;
    showLineNumbers?: boolean;
}

export default function CodeBlock({
    children,
    language = 'bash',
    filename,
    showLineNumbers = false
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = children.trim().split('\n');

    return (
        <div className="relative group my-4">
            {filename && (
                <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 border-b-0 rounded-t-lg px-4 py-2">
                    <span className="text-xs text-zinc-400 font-mono">{filename}</span>
                    <span className="text-xs text-zinc-500">{language}</span>
                </div>
            )}

            <div className={`relative bg-zinc-900 border border-zinc-800 ${filename ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden`}>
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs px-2 py-1 rounded"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>

                <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-zinc-300 font-mono">
                        {showLineNumbers ? (
                            lines.map((line, i) => (
                                <div key={i} className="table-row">
                                    <span className="table-cell pr-4 text-zinc-600 select-none text-right">
                                        {i + 1}
                                    </span>
                                    <span className="table-cell">{line}</span>
                                </div>
                            ))
                        ) : (
                            children
                        )}
                    </code>
                </pre>
            </div>
        </div>
    );
}
