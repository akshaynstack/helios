import { Card, CardContent } from '@/components/ui/card'
import { Globe, Activity, Wrench, Search, Layers, Zap, Cpu } from 'lucide-react'

export function Features() {
    return (
        <section className="p-0">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[140px] md:auto-rows-[160px] gap-4">

                    {/* Featured Item: Global Browser Grid */}
                    <Card className="md:col-span-4 md:row-span-2 relative flex flex-col border-zinc-800/40 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-zinc-700/50 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -inset-px bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-6 md:p-10 flex flex-col h-full relative z-10">
                            <div className="flex justify-between items-start mb-auto">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform duration-500">
                                    <Globe size={22} strokeWidth={2} />
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600 border border-zinc-800/50 px-2 py-1 rounded bg-zinc-900/50">
                                    ws://localhost:9222
                                </div>
                            </div>

                            <div className="mt-6 md:mt-8">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">Global Browser Grid</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <p className="text-[15px] text-zinc-400 leading-relaxed font-medium">
                                        The only AI assistant that lets you offload heavy browser tasks to a dedicated grid.
                                        Watch Helios browse and debug in real-time.
                                    </p>
                                    <ul className="text-xs space-y-2 text-zinc-300 font-mono font-medium">
                                        <li className="flex items-center gap-2"><span className="text-orange-500">→</span> Live-Vibe Visuals</li>
                                        <li className="flex items-center gap-2"><span className="text-orange-500">→</span> Playwright Native</li>
                                        <li className="flex items-center gap-2"><span className="text-orange-500">→</span> Docker Integrated</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vibe-Audit */}
                    <Card className="md:col-span-2 md:row-span-1 relative flex flex-col border-zinc-800/40 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-zinc-700/50 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -inset-px bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-5 md:p-6 flex flex-col h-full relative z-10">
                            <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 text-blue-400 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500">
                                <Activity size={18} strokeWidth={2} />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-white mb-2 tracking-tight">Vibe-Audit</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                One-click reports with SEO, A11y, and "Vibe Scoring" analytics.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Auto-Fix Agent */}
                    <Card className="md:col-span-2 md:row-span-1 relative flex flex-col border-zinc-800/40 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-zinc-700/50 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -inset-px bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-5 md:p-6 flex flex-col h-full relative z-10">
                            <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/10 text-green-400 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500">
                                <Zap size={18} strokeWidth={2} />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-white mb-2 tracking-tight">Auto-Fix Loop</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Self-healing agent that plans, executes, and verifies fixes in a guarded loop.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Triple-Threat Search */}
                    <Card className="md:col-span-3 md:row-span-1 relative flex flex-col border-zinc-800/40 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-zinc-700/50 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -inset-px bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-5 md:p-6 flex items-center gap-4 md:gap-6 h-full relative z-10">
                            <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Search size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-semibold text-white mb-1 tracking-tight">Triple-Threat Search</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Native Ripgrep, fd-find, and Semantic mgrep integration.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hybrid Logic */}
                    <Card className="md:col-span-3 md:row-span-1 relative flex flex-col border-zinc-800/40 bg-[#0A0A0A] hover:bg-[#0F0F0F] hover:border-zinc-700/50 transition-all duration-300 group overflow-hidden">
                        <div className="absolute -inset-px bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardContent className="p-5 md:p-6 flex items-center gap-4 md:gap-6 h-full relative z-10">
                            <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Cpu size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-semibold text-white mb-1 tracking-tight">Proactive Dependencies</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Silent high-performance Rust tool installs.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </section>
    )
}