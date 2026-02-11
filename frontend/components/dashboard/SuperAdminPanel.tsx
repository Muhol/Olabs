import React from 'react';
import { ShieldAlert, AlertTriangle, Lock, UserCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SuperAdminPanelProps {
    pendingRegistrations: number;
    systemConfig: any;
}

export function SuperAdminPanel({ pendingRegistrations, systemConfig }: SuperAdminPanelProps) {
    if (pendingRegistrations === 0 && !systemConfig) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRegistrations > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 p-6 rounded-[2.5rem] bg-amber-500 border border-amber-600 flex items-center justify-between gap-6 shadow-2xl shadow-amber-500/20">
                        <div className="flex items-center gap-6 text-white">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <UserCircle size={32} />
                            </div>
                            <div>
                                <p className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Pending Approvals</p>
                                <h3 className="text-2xl font-black">{pendingRegistrations} Users Awaiting Access</h3>
                            </div>
                        </div>
                        <Link href="/staff?filter=unapproved" className="px-6 py-3 bg-white text-amber-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-white/90 transition-all active:scale-95">
                            Review Now
                        </Link>
                    </motion.div>
                )}

                <div className={`p-6 rounded-[2.5rem] border flex items-center justify-between gap-6 ${systemConfig?.allow_public_signup ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    <div className="flex items-center gap-4">
                        {systemConfig?.allow_public_signup ? <Lock size={20} className="opacity-50" /> : <ShieldAlert size={20} className="opacity-50" />}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Public Signup</p>
                            <p className="font-black text-sm uppercase">{systemConfig?.allow_public_signup ? 'Enabled' : 'Disabled'}</p>
                        </div>
                    </div>
                    <Link href="/settings" className="p-2 transition-all hover:translate-x-1">
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {pendingRegistrations === 0 && (
                    <div className="p-6 rounded-[2.5rem] bg-muted/50 border border-border flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <ShieldAlert size={20} className="opacity-50" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Security Status</p>
                                <p className="font-black text-sm uppercase">All Systems Nominal</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
