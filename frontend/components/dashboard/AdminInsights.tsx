import React from 'react';
import { TrendingUp, BookOpen, ShieldAlert, Eye, AlertTriangle, Lock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Link from 'next/link';

interface AdminInsightsProps {
    trends: any[];
    topBooks: any[];
    securityEvents?: any[];
    isSuperAdmin?: boolean;
}

export function AdminInsights({ trends, topBooks, securityEvents, isSuperAdmin }: AdminInsightsProps) {
    return (
        <div className={`grid grid-cols-1 ${isSuperAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8 animate-in slide-in-from-bottom duration-1000`}>
            {/* Borrowing Trends Chart */}
            <div className="glass-card rounded-[3rem] border border-border bg-card p-8 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full -translate-x-16 -translate-y-16" />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8 relative z-10 flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />Borrowing Activity
                </h3>
                <div className="h-[250px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '1rem', border: '1px solid var(--border)', fontSize: '10px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#2563eb' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Popular Titles */}
            <div className="glass-card rounded-[3rem] border border-border bg-card p-8 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full translate-x-16 -translate-y-16" />
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8 relative z-10 flex items-center gap-2">
                    <BookOpen className="text-amber-500" size={20} /> Popular Books
                </h3>
                <div className="space-y-4 relative z-10">
                    {topBooks?.map((book: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border transition-all">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs">
                                #{idx + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-foreground line-clamp-1">{book.title}</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                {book.count}
                            </div>
                        </div>
                    ))}
                    {(!topBooks || topBooks.length === 0) && (
                        <p className="text-muted-foreground text-xs font-bold uppercase text-center py-10 tracking-widest">No data</p>
                    )}
                </div>
            </div>

            {/* Security Ledger (Super Admin Only) */}
            {isSuperAdmin && (
                <div className="glass-card rounded-[3rem] border border-border bg-card p-8 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-2xl rounded-full translate-x-16 -translate-y-16" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <ShieldAlert className="text-rose-500" size={20} /> Recent Security Logs
                        </h3>
                        <Link href="/logs" className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-all">
                            <Eye size={16} />
                        </Link>
                    </div>
                    <div className="space-y-4 relative z-10">
                        {securityEvents?.map((event: any) => (
                            <div key={event.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border transition-all">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${event.level === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    <AlertTriangle size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[10px] text-foreground uppercase tracking-wider truncate">{event.action}</p>
                                    <p className="text-[9px] text-muted-foreground/70 truncate">{event.email}</p>
                                </div>
                            </div>
                        ))}
                        {(!securityEvents || securityEvents.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Lock className="text-emerald-500 animate-pulse" size={32} />
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center">Secured</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
