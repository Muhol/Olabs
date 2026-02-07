'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
    Shield, 
    UserPlus, 
    UserMinus, 
    Mail, 
    ToggleLeft, 
    ToggleRight, 
    Search,
    Plus,
    Trash2,
    ShieldCheck,
    AlertCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { fetchConfig, updateConfig, fetchWhitelist, addToWhitelist, removeFromWhitelist, fetchCurrentUser } from '@/lib/api';

import { useUserContext } from '@/context/UserContext';

export default function SettingsPage() {
    const { getToken } = useAuth();
    const { isLoaded, user } = useUser();
    
    // Consume Global User Context
    const { systemUser, loadingSystemUser } = useUserContext();
    
    const [config, setConfig] = useState<any>(null);
    const [whitelist, setWhitelist] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const isSuperAdmin = systemUser?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (isLoaded && user && !loadingSystemUser) {
            loadData();
        } else if (isLoaded && !user) {
            setLoading(false);
        }
    }, [isLoaded, user, loadingSystemUser]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            
            // Only if super admin, fetch system configs
            if (systemUser?.role === 'SUPER_ADMIN') {
                const [configData, whitelistData] = await Promise.all([
                    fetchConfig(token),
                    fetchWhitelist(token)
                ]);
                
                setConfig(configData);
                setWhitelist(whitelistData);
            }
        } catch (err: any) {
            setError('Failed to load system archive configurations');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePolicy = async (key: string, value: boolean) => {
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const updates = { [key]: value };
            const updated = await updateConfig(token, updates);
            setConfig(updated);
        } catch (err: any) {
            setError('Failed to update system protocol');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            await addToWhitelist(token, newEmail);
            setNewEmail('');
            loadData();
        } catch (err: any) {
            setError('Failed to authorize new email vector');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveEmail = async (email: string) => {
        if (!confirm(`Are you sure you want to de-authorize ${email}?`)) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            await removeFromWhitelist(token, email);
            loadData();
        } catch (err: any) {
            setError('Failed to remove email authorization');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                    <Shield size={40} />
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
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Scanning System Metadata...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <ShieldCheck size={14} /> System Core Settings
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase">Access Control Matrix</h1>
                    <p className="text-slate-400 font-medium tracking-tight">Manage registration protocols and authorized archival vectors.</p>
                </div>
                <button 
                    onClick={loadData}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} /> Synchronize Protocols
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in slide-in-from-top-4">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h3 className="font-black uppercase tracking-widest text-xs text-primary">Registration Protocols</h3>
                        </div>
                        <div className="p-6 space-y-8">
                            
                            {/* Toggle 1 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white text-sm">Public Intake</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Allow anyone to register</p>
                                </div>
                                <button 
                                    disabled={actionLoading}
                                    onClick={() => handleTogglePolicy('allow_public_signup', !config.allow_public_signup)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.allow_public_signup ? 'bg-primary' : 'bg-slate-800'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.allow_public_signup ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Toggle 2 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white text-sm">Strict Whitelist</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Verification via authorized list</p>
                                </div>
                                <button 
                                    disabled={actionLoading}
                                    onClick={() => handleTogglePolicy('require_whitelist', !config.require_whitelist)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.require_whitelist ? 'bg-primary' : 'bg-slate-800'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.require_whitelist ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                            <Shield size={16} />
                            <span className="font-black uppercase tracking-widest text-[10px]">Protocol Advisory</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Disabling Public Intake while requiring Strict Whitelist is the most secure configuration for institutional deployment.
                        </p>
                    </div>
                </div>

                {/* Whitelist Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="font-black uppercase tracking-widest text-xs text-primary">Authorized Archival Vectors (Whitelist)</h3>
                            <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">{whitelist.length} Authorized Units</button>
                        </div>
                        
                        <div className="p-6 bg-white/[0.02] border-b border-white/5">
                            <form onSubmit={handleAddEmail} className="flex gap-4">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input 
                                        type="email" 
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Authorize new email vector..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <button 
                                    disabled={actionLoading || !newEmail}
                                    type="submit"
                                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Plus size={16} /> Authorize Unit
                                </button>
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Identity</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Authorization Date</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {whitelist.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-20 text-center space-y-4">
                                                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 mx-auto border border-white/5">
                                                    <Mail size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-black uppercase tracking-tighter">No vectors authorized</p>
                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Protocol strictly relies on global intake settings</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        whitelist.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] group transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                            <Mail size={14} />
                                                        </div>
                                                        <span className="text-white font-bold text-sm tracking-tight">{item.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                                                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        disabled={actionLoading}
                                                        onClick={() => handleRemoveEmail(item.email)}
                                                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
