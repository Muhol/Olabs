'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
    LayoutDashboard, 
    BookOpen, 
    Users, 
    Clock, 
    ArrowRight, 
    Plus,
    Activity,
    ShieldCheck,
    History,
    Loader2,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import { fetchAnalytics, fetchBorrowHistory } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
    const { getToken } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                console.warn('[DASHBOARD] Token not available yet, skipping fetch');
                setLoading(false);
                return;
            }
            
            const [analyticsData, historyData] = await Promise.all([
                fetchAnalytics(token),
                fetchBorrowHistory(token, 0, 5)
            ]);
            
            setAnalytics(analyticsData);
            setRecentActivity(historyData.items);
        } catch (err) {
            setError('Failed to establish connection with the central command core.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={64} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={24} className="text-secondary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-xs">Loading Dashboard...</p>
            </div>
        );
    }

    const { stats } = analytics;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Top Bar / Vitals */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <LayoutDashboard size={14} /> Library Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Dashboard Overview</h1>
                    <div className="flex items-center gap-4 text-muted-foreground font-medium tracking-tight">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Online</span>
                        </div>
                        <span>•</span>
                        <p>All library systems are running smoothly.</p>
                    </div>
                </div>
                
                <button 
                    onClick={loadDashboardData}
                    className="p-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border transition-all active:scale-95 shadow-xl"
                >
                    <RefreshCw size={24} />
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard icon={<BookOpen />} label="Total Books" value={stats.total_books} color="primary" />
                <StatsCard icon={<Users />} label="Total Students" value={stats.total_students} color="secondary" />
                <StatsCard icon={<TrendingUp />} label="Active Borrows" value={stats.active_borrows} color="amber" />
                <StatsCard icon={<Clock />} label="Overdue Books" value={stats.overdue_count} color="rose" />
            </div>

            {/* Main Action Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Ledger */}
                <div className="lg:col-span-2 glass-card rounded-[3rem] border border-border bg-card p-6 md:p-10 flex flex-col shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-x-32 -translate-y-32" />
                    
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Recent Activity</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Latest Transactions</p>
                        </div>
                        <Link href="/history" className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border transition-all">
                            View All History
                        </Link>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {recentActivity.map((log) => (
                            <div key={log.id} className="flex items-center gap-6 p-4 rounded-[1.5rem] hover:bg-muted/30 transition-all border border-transparent hover:border-border/50 group/entry">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${log.status === 'returned' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {log.status === 'returned' ? <ShieldCheck size={24} /> : <History size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-foreground text-base tracking-tight">{log.book}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(log.borrow_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} Today</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">{log.student} • <span className="text-primary">{log.class}</span></div>
                                        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${log.status === 'returned' ? 'text-emerald-500 border-emerald-500/10' : 'text-amber-500 border-amber-500/10'}`}>
                                            {log.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Protocol Deployment */}
                <div className="glass-card rounded-[3rem] border border-border bg-card p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-2xl rounded-full -translate-x-16 -translate-y-16" />
                    
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-10 relative z-10">Quick Actions</h3>
                    
                    <div className="space-y-4 relative z-10">
                        <ProtocolButton color="primary" icon={<BookOpen />} label="Borrow Book" href="/inventory" desc="Issue a book to student" />
                        <ProtocolButton color="secondary" icon={<Users />} label="Add Student" href="/students" desc="Register new student" />
                        <ProtocolButton color="amber" icon={<Plus />} label="Add Book" href="/inventory" desc="Add new book to library" />
                        <ProtocolButton color="rose" icon={<Activity />} label="System Logs" href="/logs" desc="Check system logs" />
                    </div>
                </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="p-1.5 rounded-[1.5rem] bg-muted border border-border flex items-center gap-4 overflow-hidden relative">
                <div className="px-4 py-2 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl relative z-10 shadow-lg shadow-primary/20">
                    System Status
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="whitespace-nowrap flex gap-12 animate-marquee">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground shrink-0">
                                <span>System: Online</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span>Database: Synced</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span>Safety: Secured</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon, label, value, color }: any) {
    const colorClasses: any = {
        primary: 'text-primary bg-primary/10 border-primary/20 hover:border-primary/50',
        secondary: 'text-secondary bg-secondary/10 border-secondary/20 hover:border-secondary/50',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50',
    };

    return (
        <div className={`glass-card p-6 md:p-10 rounded-[2.5rem] border bg-card transition-all duration-500 group relative overflow-hidden shadow-xl ${colorClasses[color]}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <div>
                    <h4 className="text-4xl font-black text-foreground tracking-tighter">{value}</h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">{label}</p>
                </div>
            </div>
        </div>
    );
}

function ProtocolButton({ icon, label, href, desc, color }: any) {
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
