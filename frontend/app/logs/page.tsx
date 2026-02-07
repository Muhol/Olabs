'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
    ShieldAlert, 
    Terminal, 
    Search, 
    Filter, 
    Download, 
    RefreshCw, 
    Clock, 
    User, 
    Activity,
    Info,
    AlertTriangle,
    XCircle,
    Loader2
} from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { fetchLogs } from '@/lib/api';

export default function LogsPage() {
    const { getToken } = useAuth();
    const { isLoaded, user } = useUser();
    const { systemUser } = useUserContext();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total_events: 0,
        security_alerts: 0,
        critical_failures: 0
    });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    const isSuperAdmin = systemUser?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (isLoaded && isSuperAdmin) {
            loadData();
        } else if (isLoaded && !isSuperAdmin) {
            setLoading(false);
        }
    }, [isLoaded, isSuperAdmin]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const data = await fetchLogs(token, filter === 'ALL' ? undefined : filter, search);
            setLogs(data.items);
            setStats(data.stats);
        } catch (err) {
            console.error('Failed to load logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && isSuperAdmin) {
            const delayDebounceFn = setTimeout(() => {
                loadData();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [search, filter]);

    if (!isSuperAdmin) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                    <ShieldAlert size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Access Denied</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Section restricted to Level 5 Personnel (SUPER_ADMIN)</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-primary gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Loading System Activity...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Terminal size={14} /> System Audit Trail
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase">System Audit</h1>
                    <p className="text-slate-400 font-medium tracking-tight">Review school library operations, user actions, and security events.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest transition-all">
                        <Download size={14} /> Export Logs
                    </button>
                    <button 
                        onClick={loadData} 
                        className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Events</p>
                        <p className="text-2xl font-black text-white">{stats.total_events}</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Alerts</p>
                        <p className="text-2xl font-black text-white">{stats.security_alerts}</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Critical Failures</p>
                        <p className="text-2xl font-black text-white">{stats.critical_failures}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs by action, user, or details..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-primary outline-none transition-all shadow-inner"
                    />
                </div>
                <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                    {['ALL', 'INFO', 'WARNING', 'ERROR'].map((l) => (
                        <button
                            key={l}
                            onClick={() => setFilter(l)}
                            className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all ${
                                filter === l ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Severity</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Action Type</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Initiator</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Target</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                            log.level === 'INFO' ? 'bg-blue-500/10 text-blue-500' :
                                            log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-rose-500/10 text-rose-500'
                                        }`}>
                                            {log.level === 'INFO' && <Info size={12} />}
                                            {log.level === 'WARNING' && <AlertTriangle size={12} />}
                                            {log.level === 'ERROR' && <XCircle size={12} />}
                                            {log.level}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-white font-black text-xs tracking-tight">{log.action}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                                <User size={12} className="text-slate-400" />
                                            </div>
                                            <span className="text-slate-300 font-bold text-xs">{log.user_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {log.target_user ? (
                                                <>
                                                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                                                        <Activity size={10} className="text-primary" />
                                                    </div>
                                                    <span className="text-primary font-black text-[10px] uppercase tracking-tighter">{log.target_user}</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-600 font-bold text-[10px] uppercase">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-400 font-medium text-xs max-w-md truncate group-hover:text-slate-200 transition-colors">
                                            {log.details}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                                            <Clock size={12} />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
