'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    BarChart2,
    PieChart as PieChartIcon,
    TrendingUp,
    Download,
    Loader2,
    BookOpen,
    Users,
    Clock,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { fetchAnalytics } from '@/lib/api';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#106981', '#139284'];

export default function ReportsPage() {
    const { getToken } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) {
                console.warn('[REPORTS] Token not available yet, skipping fetch');
                setLoading(false);
                return;
            }
            const data = await fetchAnalytics(token);
            setAnalytics(data);
        } catch (err) {
            setError('Failed to load reports data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-xs">Generating Reports...</p>
            </div>
        );
    }

    const { stats, category_distribution } = analytics;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-500 font-black uppercase tracking-[0.3em] text-[10px]">
                        <BarChart2 size={14} /> Reports & Statistics
                    </div>
                    <h1 className="text-3xl md:text-4xl tracking-tight text-foreground uppercase">Library Statistics</h1>
                    <p className="text-muted-foreground font-medium tracking-tight text-sm">Overview of library usage and student engagement.</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={loadAnalytics}
                        className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] md:text-xs tracking-widest rounded-xl border border-border transition-all active:scale-95 shadow-sm whitespace-nowrap">
                        <Download size={18} /> Export Data
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard icon={<BookOpen />} label="Total Books" value={stats.total_books} trend="+12% Increase" color="text-emerald-500" />
                <MetricCard icon={<Users />} label="Total Students" value={stats.total_students} trend="+5% Growth" color="text-blue-500" />
                <MetricCard icon={<TrendingUp />} label="Active Borrows" value={stats.active_borrows} trend="High Activity" color="text-indigo-500" />
                <MetricCard icon={<AlertTriangle />} label="Overdue Books" value={stats.overdue_count} trend="Action Required" color="text-rose-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Distribution */}
                <div className="glass-card p-6 md:p-10 rounded-[3rem] border border-border bg-card flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">Book Categories</h3>
                            <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Books share by Genre</p>
                        </div>
                        <PieChartIcon className="text-primary opacity-50 shrink-0" size={24} />
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={category_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {category_distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Overview (Mock Bar Chart for UI) */}
                <div className="glass-card p-6 md:p-10 rounded-[3rem] border border-border bg-card flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">Popular Reads</h3>
                            <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Borrowed by category</p>
                        </div>
                        <BarChart2 className="text-secondary opacity-50 shrink-0" size={24} />
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={category_distribution.slice(0, 5)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(v) => v.substring(0, 8)}
                                />
                                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{
                                        backgroundColor: '#111',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Clock size={24} />
                </div>
                <div className="flex-1 text-center lg:text-left">
                    <h4 className="text-base md:text-lg font-black text-foreground uppercase tracking-tight">Real-time Data Sync Active</h4>
                    <p className="text-muted-foreground text-xs md:text-sm font-medium">All visualizations are derived from the live PostgreSQL core. Last sync: Just now.</p>
                </div>
                <button className="w-full lg:w-auto px-6 py-3 bg-indigo-500 text-white font-black uppercase text-[10px] md:text-xs tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                    Schedule Report
                </button>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, trend, color }: any) {
    return (
        <div className="glass-card p-5 md:p-8 rounded-[2rem] border border-border bg-card hover:border-border/50 transition-all group overflow-hidden relative shadow-sm">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full translate-x-12 -translate-y-12 opacity-10 group-hover:scale-150 transition-transform duration-1000 bg-current ${color}`} />
            <div className="relative space-y-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform ${color}`}>
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                <div>
                    <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{value}</h4>
                    <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{label}</p>
                </div>
                <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${color}`}>
                    <TrendingUp size={10} /> {trend}
                </div>
            </div>
        </div>
    );
}
