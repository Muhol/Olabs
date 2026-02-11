import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ProtocolButtonProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    desc: string;
    color: 'primary' | 'secondary' | 'amber' | 'rose';
}

export function ProtocolButton({ icon, label, href, desc, color }: ProtocolButtonProps) {
    const colorMap: any = {
        primary: 'group-hover:text-primary group-hover:border-primary/30',
        secondary: 'group-hover:text-secondary group-hover:border-secondary/30',
        amber: 'group-hover:text-amber-500 group-hover:border-amber-500/30',
        rose: 'group-hover:text-rose-500 group-hover:border-rose-500/30',
    };

    return (
        <Link href={href} className={`flex items-center gap-4 p-4 rounded-[1.5rem] bg-card border border-border hover:bg-muted transition-all group ${colorMap[color]}`}>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center transition-colors group-hover:bg-card group-hover:scale-110 duration-500">
                {icon}
            </div>
            <div className="flex-1">
                <p className="font-black text-sm uppercase tracking-tight text-foreground">{label}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-slate-700 group-hover:translate-x-1 transition-transform" />
        </Link>
    );
}
