'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    History,
    Search,
    Filter,
    Calendar,
    User,
    Book,
    ArrowUpRight,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    RefreshCw,
    RotateCcw
} from 'lucide-react';
import { fetchBorrowHistory, returnBook } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
    const { getToken } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadHistory();
        }, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [skip, search, filter]);

    // Reset page on search or filter change
    useEffect(() => {
        setSkip(0);
    }, [search, filter]);

    const loadHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) {
                console.warn('[HISTORY] Token not available yet, skipping fetch');
                setLoading(false);
                return;
            }
            const data = await fetchBorrowHistory(token, skip, limit, search);
            setHistory(data.items);
            setTotalRecords(data.total);
        } catch (err) {
            setError('Failed to load history records.');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (id: string) => {
        setActionLoading(id);
        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please refresh the page.');
                setActionLoading(null);
                return;
            }
            await returnBook(token, id);
            loadHistory();
        } catch (err: any) {
            setError(err.message || 'Return protocol execution failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredHistory = history.filter(item => {
        const matchesFilter = filter === 'all' || item.status === filter;
        return matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'returned': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'overdue': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'returned': return <CheckCircle2 size={14} />;
            case 'overdue': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const PaginationControls = () => (
        <div className="flex items-center justify-between px-8 py-4 bg-muted/30 border border-border rounded-[2rem] backdrop-blur-xl transition-colors">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Records: {Math.min(skip + 1, totalRecords)} - {Math.min(skip + limit, totalRecords)} of {totalRecords}
            </div>
            <div className="flex gap-2">
                <button 
                    disabled={skip === 0 || loading}
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {loading && skip > 0 ? <Loader2 size={12} className="animate-spin" /> : null} Previous
                </button>
                <button 
                    disabled={skip + limit >= totalRecords || loading}
                    onClick={() => setSkip(skip + limit)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    Next {loading && skip + limit < totalRecords ? <Loader2 size={12} className="animate-spin" /> : null}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">
                        <History size={14} /> Borrow History
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">History</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">View all borrowing and return records.</p>
                </div>

                <button onClick={loadHistory} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95 self-start md:self-center">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="relative flex-1 group">
                    <button onClick={loadHistory} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-amber-500 hover:text-amber-500 transition-colors z-10">
                        <Search size={20} />
                    </button>
                    <input type="text" placeholder="Search records by book title or student name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadHistory()} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-sm focus:border-amber-500 outline-none transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div className="flex bg-muted p-1.5 rounded-2xl border border-border transition-colors">
                    {['all', 'borrowed', 'returned', 'overdue'].map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-muted-foreground hover:text-foreground'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <PaginationControls />
                <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Book Title</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Student</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date / Due Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center text-muted-foreground uppercase font-black text-[10px] tracking-[0.3em]"><Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={40} />Loading History...</td>
                                    </tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center text-slate-600 uppercase font-black tracking-widest text-sm">No history records found</td>
                                    </tr>
                                ) : (
                                    filteredHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-amber-500/50 group-hover:bg-amber-500 group-hover:text-amber-foreground transition-all"><Book size={20} /></div>
                                                    <div className="font-black text-foreground text-base leading-none">{item.book}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-foreground/80 text-sm flex items-center gap-2"><User size={14} className="text-muted-foreground" /> {item.student}</div>
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.class}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80"><Calendar size={12} /> Out: {new Date(item.borrow_date).toLocaleDateString()}</div>
                                                    <div className={`flex items-center gap-2 text-[11px] font-bold ${item.status === 'overdue' ? 'text-rose-500' : 'text-muted-foreground'}`}><ArrowUpRight size={12} /> Due: {new Date(item.due_date).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(item.status)}`}>{getStatusIcon(item.status)} {item.status}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {item.status !== 'returned' && (
                                                    <button onClick={() => handleReturn(item.id)} disabled={actionLoading === item.id} className="flex items-center gap-2 ml-auto px-4 py-2 bg-muted hover:bg-emerald-500 text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-border hover:border-emerald-500 transition-all active:scale-95 disabled:opacity-50">{actionLoading === item.id ? <Loader2 className="animate-spin" size={14} /> : <><RotateCcw size={14} /> Execute Return</>}</button>
                                                )}
                                                {item.status === 'returned' && <div className="text-[10px] font-bold text-slate-600 uppercase italic">Closed: {new Date(item.return_date).toLocaleDateString()}</div>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-muted/30 border-t border-border">
                        <PaginationControls />
                    </div>
                </div>
            </div>
        </div>
    );
}
