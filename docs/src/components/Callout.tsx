interface CalloutProps {
    type?: 'note' | 'tip' | 'warning' | 'danger';
    title?: string;
    children: React.ReactNode;
}

const icons = {
    note: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    tip: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    danger: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const colors = {
    note: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500',
        icon: 'text-blue-400',
        title: 'text-blue-400',
    },
    tip: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500',
        icon: 'text-emerald-400',
        title: 'text-emerald-400',
    },
    warning: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        icon: 'text-yellow-400',
        title: 'text-yellow-400',
    },
    danger: {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        icon: 'text-red-400',
        title: 'text-red-400',
    },
};

export default function Callout({ type = 'note', title, children }: CalloutProps) {
    const style = colors[type];

    return (
        <div className={`${style.bg} border-l-4 ${style.border} rounded-r-lg p-4 my-4`}>
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 ${style.icon}`}>{icons[type]}</span>
                <div>
                    {title && (
                        <p className={`font-semibold ${style.title} mb-1`}>{title}</p>
                    )}
                    <div className="text-zinc-300 text-sm">{children}</div>
                </div>
            </div>
        </div>
    );
}
