import React from 'react';

interface StatsCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'primary' | 'secondary' | 'amber' | 'rose';
    compact?: boolean;
}

export function StatsCard({ icon, label, value, color, compact }: StatsCardProps) {
    const colorClasses: any = {
        primary: 'text-primary bg-primary/10 border-primary/20 hover:border-primary/50',
        secondary: 'text-secondary bg-secondary/10 border-secondary/20 hover:border-secondary/50',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50',
    };

    return (
        <div className={`glass-card hover:scale-95 ${compact ? 'py-5 px-4 rounded-2xl' : 'py-7 px-6 md:py-9 md:px-8 rounded-3xl'} border bg-card transition-all duration-500 group relative overflow-hidden shadow-xl ${colorClasses[color]}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative flex items-center gap-4">
                <div className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl md:w-16 md:h-16'} bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-500 shrink-0`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: compact ? 18 : 24 }) : icon}
                </div>
                <div className="min-w-0">
                    <h4 className={`${compact ? 'text-xl' : 'text-2xl md:text-3xl'} font-black text-foreground tracking-tighter truncate line-height-none`}>{value}</h4>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5 truncate">{label}</p>
                </div>
            </div>
        </div>
    );
}
