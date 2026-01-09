'use client';

import { ReactNode } from 'react';

interface MarqueeProps {
    children: ReactNode;
    direction?: 'left' | 'right';
    speed?: 'slow' | 'medium' | 'fast';
    pauseOnHover?: boolean;
}

export function Marquee({
    children,
    direction = 'left',
    speed = 'medium',
    pauseOnHover = true
}: MarqueeProps) {
    const speedMap = {
        slow: '60s',
        medium: '40s',
        fast: '20s'
    };

    return (
        <div className="flex overflow-hidden select-none group border-y border-zinc-900/50 py-10 bg-[#080808]/50 relative">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-10" />

            <div
                className="flex min-w-full shrink-0 items-center justify-around gap-20 animate-marquee"
                style={{
                    animationDirection: direction === 'left' ? 'normal' : 'reverse',
                    animationDuration: speedMap[speed]
                }}
            >
                {children}
                {children}
            </div>
            <div
                className="flex min-w-full shrink-0 items-center justify-around gap-20 animate-marquee"
                aria-hidden="true"
                style={{
                    animationDirection: direction === 'left' ? 'normal' : 'reverse',
                    animationDuration: speedMap[speed]
                }}
            >
                {children}
                {children}
            </div>
        </div>
    );
}
