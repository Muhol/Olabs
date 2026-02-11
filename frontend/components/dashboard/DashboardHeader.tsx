import React from 'react';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
    role: string;
    userName?: string;
    onRefresh: () => void;
}

export function DashboardHeader({ role, userName, onRefresh }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                    <LayoutDashboard size={14} /> {role === 'teacher' ? 'Teacher' : 'Library'} Management
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase">
                    Welcome back, <span className="text-primary">{userName?.split(' ')[0] || 'Member'}</span>
                </h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-60">
                    System operational • Multi-Role Core Active • Role: {role.replace('_', ' ')}
                </p>
            </div>
            <button
                onClick={onRefresh}
                className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3 hover:bg-muted transition-all active:scale-95 group"
            >
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                    <RefreshCw size={18} />
                </div>
                <span className="font-black uppercase text-xs tracking-widest px-2">Synchronize</span>
            </button>
        </div>
    );
}
