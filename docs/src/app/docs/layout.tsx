'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex">
            <Sidebar currentPath={pathname} />
            <div className="flex-1 min-w-0 w-full">
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {children}
                </article>
            </div>
        </div>
    );
}
