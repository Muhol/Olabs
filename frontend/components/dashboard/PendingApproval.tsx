import React from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

interface PendingApprovalProps {
    userName?: string;
}

export function PendingApproval({ userName }: PendingApprovalProps) {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-1000">
            <div className="w-full max-w-2xl text-center space-y-12">
                {/* Icon Core */}
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-[2rem] bg-card border border-border shadow-2xl flex items-center justify-center">
                        <ShieldAlert className="text-secondary animate-bounce" size={48} />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-4 border-background">
                            <Clock size={14} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Typography Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        Access Restricted • Identity Sync Active
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-tight">
                        Hello, <span className="text-primary">{userName?.split(' ')[0] || 'Member'}</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                        Your account has been successfully registered on the <span className="text-foreground font-bold italic">Central Core</span>, but it requires <span className="text-secondary font-bold underline">Administrator Verification</span> before you can access the command center.
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-xl mx-auto">
                    <div className="glass-card p-6 rounded-[2rem] border border-border bg-card/50">
                        <CheckCircle2 className="text-emerald-500 mb-3" size={20} />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Status</p>
                        <h4 className="text-sm font-bold text-foreground mt-1 uppercase">Account Born</h4>
                    </div>
                    <div className="glass-card p-6 rounded-[2rem] border border-primary/20 bg-primary/5">
                        <Clock className="text-primary animate-spin-slow" size={20} />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Pending</p>
                        <h4 className="text-sm font-bold text-foreground mt-1 uppercase">Admin Approval</h4>
                    </div>
                    <div className="glass-card p-6 rounded-[2rem] border border-border bg-muted/20 opacity-40">
                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground mb-3" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Locked</p>
                        <h4 className="text-sm font-bold text-foreground mt-1 uppercase">Dashboard Access</h4>
                    </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                        Estimated verification time: <span className="text-foreground">24-48 Hours</span>
                    </div>
                    <SignOutButton>
                        <button className="flex items-center gap-2 px-8 py-4 bg-foreground text-background font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-foreground/90 transition-all active:scale-95 shadow-xl">
                            <LogOut size={16} /> Exit Terminal
                        </button>
                    </SignOutButton>
                </div>

                {/* Status Ticker */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                    Waiting for Command HQ...
                </div>
            </div>
        </div>
    );
}
