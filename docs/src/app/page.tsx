'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Features } from '../components/Features';
import { Terminal } from '../components/Terminal';
import { Marquee } from '../components/Marquee';
import { Check, Sparkles, Twitter, Github, Linkedin, Terminal as TerminalIcon } from 'lucide-react';

const partners = [
  'Ripgrep', 'Playwright', 'fd-find', 'OpenRouter', 'Rust',
  'Docker', 'Mgrep', 'Claude', 'Gemini'
];

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText('npm install -g helios-cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 selection:bg-orange-500/20">

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-900/10 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 blur-[128px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 md:pt-32 pb-12 md:pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-[10px] md:text-xs font-medium mb-6 md:mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          v0.2.0: The Flow-State Engine 🚀
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
          Stay in the zone with <br />
          <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(234,88,12,0.2)]">
            high-performance context.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Helios is the flow-state engine for vibecoders. Zero-config toolchain,
          multi-model failover, and proactive browser automation. ⚡
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/docs/installation" className="px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:scale-105 active:scale-95 leading-none h-fit">
            Explore Docs
          </Link>
          <div
            onClick={copyToClipboard}
            className="group px-6 py-4 bg-[#111] hover:bg-[#161616] text-gray-300 border border-zinc-800 rounded-lg font-mono text-sm flex items-center gap-3 cursor-pointer transition-all active:scale-95"
          >
            <span className="text-orange-500">$</span>
            <span>npm i -g helios-cli</span>
            <div className="ml-2 pl-3 border-l border-zinc-800 text-zinc-500 group-hover:text-orange-500 transition-colors">
              {copied ? <Check size={14} className="text-green-500" /> : <TerminalIcon size={14} />}
            </div>
          </div>
        </div>

        <Terminal />
      </section>

      {/* Social Proof / Engine Underpinnings */}
      <section className="pt-12 md:pt-20 pb-12 md:pb-16 bg-[#080808]/30">
        <div className="max-w-7xl mx-auto px-6 text-center mb-8 md:mb-12">
          <p className="text-[10px] md:text-sm text-zinc-500 mb-4 uppercase tracking-[0.3em] font-bold">Engine Underpinnings</p>
          <div className="h-px w-12 md:w-20 bg-orange-500/50 mx-auto" />
        </div>

        <Marquee speed="medium">
          {partners.map(p => (
            <span key={p} className="text-2xl md:text-3xl font-bold text-zinc-700 hover:text-orange-500/50 transition-colors lowercase tracking-tighter shrink-0 cursor-default">
              {p}
            </span>
          ))}
        </Marquee>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-12 md:py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Unstoppable Tooling.</h2>
        <p className="text-center text-gray-500 mb-10 md:mb-12 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Helios replaces fragile scripts with a robust, high-performance engine
          that maps your entire workspace in milliseconds.
        </p>

        <Features />
      </section>

      {/* Context Section */}
      <section className="py-12 md:py-24 border-t border-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <div className="text-orange-500 font-bold mb-4 tracking-widest uppercase text-[10px] md:text-xs">The Triple-Threat Engine</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Blazing Fast Context.</h2>
            <p className="text-gray-400 text-sm md:text-lg mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
              Helios uses custom binary integrations to scan 100k+ files in under 100ms.
              No indexing required.
            </p>
            <ul className="space-y-4">
              {[
                'Exact Search via Ripgrep',
                'Instant File Discovery (fd-find)',
                'Meaning-based search (mgrep)',
                'Silent auto-installing dependencies'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-orange-500/10 blur-[120px] rounded-full" />
            <div className="relative bg-[#0A0A0A] border border-zinc-800 rounded-xl p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                <div className="w-3 h-3 rounded-full bg-orange-500/30" />
                <span className="text-xs text-zinc-500 font-mono">helios — context-scan --depth-inf</span>
              </div>
              <pre className="text-xs font-mono text-gray-400 overflow-x-auto">
                <code>
                  <span className="text-orange-500">➜</span> scanning workspace...<br />
                  <span className="text-zinc-600">{'>'} git_ls_files: 1,240 matches</span><br />
                  <span className="text-zinc-600">{'>'} ripgrep core.ts: 12ms</span><br />
                  <span className="text-zinc-600">{'>'} fd metadata: 8ms</span><br /><br />
                  <span className="text-green-500">✅ Context Mapped in 42ms</span><br />
                  <span className="text-zinc-500 italic">// 0 tokens wasted on searching</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* About Developer */}
      <section className="py-12 px-6 relative max-w-7xl mx-auto overflow-hidden">
        <div className="glass-card overflow-hidden border-white/[0.05] bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="grid md:grid-cols-[400px_1fr] items-center">
            <div className="relative h-full min-h-[400px] border-r border-white/5">
              <img
                src="/images/akshayn.webp"
                alt="Akshay N - Solo Engineer"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 border-r border-white/5"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-6 left-6">
                <div className="badge-framer bg-white/10 backdrop-blur-md border-white/20 text-white font-bold">
                  Solo Developer
                </div>
              </div>
            </div>
            <div className="p-6 md:p-12 space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">Engineering the <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Flow-State Engine</span></h2>
                <p className="text-xl text-zinc-400 leading-relaxed">
                  Helios isn&apos;t just another CLI wrapper. It&apos;s a high-performance orchestration layer designed to give AI agents the visual intelligence and local tools they need to move at the speed of thought.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-orange-500/20 flex items-center justify-center bg-orange-500/5">
                    <Sparkles className="w-5 h-5 text-orange-500/60" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-tight">AKSHAY N</h4>
                    <p className="text-sm text-zinc-500 italic">Founder & Solo Engineer</p>
                  </div>
                </div>

                <blockquote className="border-l-2 border-orange-500/20 pl-6 text-zinc-400 italic">
                  &quot;I built Helios to bridge the gap between AI chat and AI engineering. It&apos;s about giving the model raw power—directly in your terminal, with zero latency and full environment context.&quot;
                </blockquote>
                <div className="flex gap-4">
                  <Link
                    href="https://x.com/akshaynceo"
                    target="_blank"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group/icon"
                  >
                    <Twitter className="w-5 h-5 text-text-secondary group-hover/icon:text-white transition-colors" />
                  </Link>
                  <Link
                    href="https://github.com/akshaynstack"
                    target="_blank"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group/icon"
                  >
                    <Github className="w-5 h-5 text-text-secondary group-hover/icon:text-white transition-colors" />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/akshaynstack/"
                    target="_blank"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group/icon"
                  >
                    <Linkedin className="w-5 h-5 text-text-secondary group-hover/icon:text-white transition-colors" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-500/5 blur-[128px] pointer-events-none" />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 tracking-tight px-6">Ready to vibecode?</h2>
        <div
          onClick={copyToClipboard}
          className="group inline-flex items-center gap-4 p-2 bg-[#111] border border-zinc-800 rounded-lg pr-6 cursor-pointer hover:border-zinc-700 transition-all hover:bg-[#151515] active:scale-95"
        >
          <div className="px-3 py-1 bg-zinc-800 rounded text-gray-400 text-xs font-mono">$</div>
          <span className="font-mono text-gray-300">npm install -g helios-cli</span>
          <div className="ml-4 flex items-center gap-2">
            {copied ? (
              <span className="text-green-500 text-[10px] font-sans uppercase tracking-[0.2em] font-bold">Copied!</span>
            ) : (
              <span className="text-zinc-600 text-[10px] font-sans uppercase tracking-widest group-hover:text-orange-500 transition-colors">Copy</span>
            )}
            {copied ? <Check size={12} className="text-green-500" /> : <TerminalIcon size={12} className="text-zinc-600 group-hover:text-orange-500" />}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-10 text-zinc-500 text-sm font-medium">
            <Link href="/docs" className="hover:text-orange-500 transition-colors">Documentation</Link>
            <a href="https://github.com/akshaynstack/helios" className="hover:text-orange-500 transition-colors">GitHub</a>
            <Link href="/blog" className="hover:text-orange-500 transition-colors">Engineering</Link>
          </div>
          <p className="text-zinc-600 text-xs tracking-wide">© 2026 HELIOS ENGINE. BUILT FOR THE VIBEATHON.</p>
        </div>
      </footer>
    </div>
  );
}
