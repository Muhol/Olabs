'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
    Shield,
    UserPlus,
    ToggleRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { fetchConfig, updateConfig, fetchCurrentUser } from '@/lib/api';

import { useUserContext } from '@/context/UserContext';

export default function SettingsPage() {
    const { getToken } = useAuth();
    const { isLoaded, user } = useUser();

    // Consume Global User Context
    const { systemUser, loadingSystemUser } = useUserContext();

    const [config, setConfig] = useState<any>(null);
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
                const configData = await fetchConfig(token);
                setConfig(configData);
            }
        } catch (err: any) {
            setError('Failed to load system configuration settings');
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
            setError('Failed to update system settings');
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
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Loading Settings...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <ShieldCheck size={14} /> System Core Settings
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase">Access Control</h1>
                    <p className="text-slate-400 font-medium tracking-tight">Manage user registration policies and system protocols.</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10  rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} /> Refresh Settings
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in slide-in-from-top-4">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${config?.allow_public_signup ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                        <ToggleRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Intake</p>
                        <p className="text-2xl font-black ">{config?.allow_public_signup ? 'ACTIVE' : 'OFFLINE'}</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-500/10 text-slate-500 border-slate-500/20 rounded-2xl flex items-center justify-center border">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Guard</p>
                        <p className="text-2xl font-black ">RELIABLE</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl">
                {/* Configuration Panel */}
                <div className="space-y-6">
                    <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h3 className="font-black uppercase tracking-widest text-xs text-primary">Registration Protocols</h3>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Toggle 1 */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold  text-sm">Public Intake</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Allow anyone to register</p>
                                </div>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleTogglePolicy('allow_public_signup', !config?.allow_public_signup)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config?.allow_public_signup ? 'bg-primary' : 'bg-slate-800'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config?.allow_public_signup ? 'translate-x-6' : 'translate-x-1'}`} />
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
                            Disabling Public Intake is the most secure configuration for institutional deployment. This will prevent new accounts from being created.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
