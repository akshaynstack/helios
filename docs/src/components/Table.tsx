interface TableProps {
    children: React.ReactNode;
}

interface TableRowProps {
    children: React.ReactNode;
    header?: boolean;
}

interface TableCellProps {
    children: React.ReactNode;
}

export function Table({ children }: TableProps) {
    return (
        <div className="overflow-x-auto my-6">
            <table className="min-w-full border border-zinc-800 rounded-lg overflow-hidden">
                {children}
            </table>
        </div>
    );
}

export function THead({ children }: TableProps) {
    return <thead className="bg-zinc-800">{children}</thead>;
}

export function TBody({ children }: TableProps) {
    return <tbody className="divide-y divide-zinc-800">{children}</tbody>;
}

export function TR({ children, header }: TableRowProps) {
    return (
        <tr className={header ? 'bg-zinc-800' : 'hover:bg-zinc-800/30 transition-colors'}>
            {children}
        </tr>
    );
}

export function TH({ children }: TableCellProps) {
    return (
        <th className="text-left text-zinc-200 font-semibold px-4 py-3 text-sm">
            {children}
        </th>
    );
}

export function TD({ children }: TableCellProps) {
    return (
        <td className="text-zinc-400 px-4 py-3 text-sm">
            {children}
        </td>
    );
}
