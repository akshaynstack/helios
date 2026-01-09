import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="text-4xl font-bold mb-6 text-white">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mt-10 mb-4 text-white border-b border-zinc-800 pb-2">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-8 mb-3 text-zinc-100">{children}</h3>
        ),
        p: ({ children }) => (
            <p className="text-zinc-400 leading-relaxed mb-4">{children}</p>
        ),
        a: ({ href, children }) => (
            <Link href={href || '#'} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors">
                {children}
            </Link>
        ),
        ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-4 ml-4">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 text-zinc-400 mb-4 ml-4">{children}</ol>
        ),
        li: ({ children }) => (
            <li className="text-zinc-400">{children}</li>
        ),
        code: ({ children }) => (
            <code className="bg-zinc-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        pre: ({ children }) => (
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto mb-4 text-sm">
                {children}
            </pre>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-500 pl-4 py-2 my-4 bg-orange-500/5 text-zinc-300 italic">
                {children}
            </blockquote>
        ),
        table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-zinc-800 rounded-lg overflow-hidden">{children}</table>
            </div>
        ),
        th: ({ children }) => (
            <th className="bg-zinc-800 text-zinc-200 px-4 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
            <td className="border-t border-zinc-800 text-zinc-400 px-4 py-2">{children}</td>
        ),
        hr: () => <hr className="border-zinc-800 my-8" />,
        ...components,
    };
}
