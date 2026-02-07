'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Search,
    Users,
    Edit,
    Loader2,
    XCircle,
    UserCircle2,
    RefreshCw,
    ShieldCheck,
    Briefcase,
    Check
} from 'lucide-react';
import { fetchStaff, updateUserRole, fetchClasses, fetchStreams } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function StaffPage() {
    const { getToken } = useAuth();
    const { userRole, systemUser } = useUserContext();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'verified' | 'unapproved'>('verified');

    // Modal Error States
    const [roleError, setRoleError] = useState('');

    // Role Editing State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Class/Stream Data
    const [classes, setClasses] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStreamId, setSelectedStreamId] = useState('');

    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, search ? 500 : 0);
        
        // Initial load of classes for the modal
        if (isSuperAdmin || isAdmin) {
            loadMetaData();
        }

        return () => clearTimeout(timer);
    }, [activeTab, search]);

    const loadMetaData = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const [classesData, streamsData] = await Promise.all([
                fetchClasses(token),
                fetchStreams(token)
            ]);
            setClasses(classesData);
            setStreams(streamsData);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchStaff(token, search, activeTab);
            setUsers(data);
        } catch (err) {
            setError('Failed to load staff data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setActionLoading(true);
        setRoleError('');
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication failed");

            await updateUserRole(
                token, 
                editingUser.id, 
                selectedRole, 
                selectedRole === 'teacher' ? selectedClassId : undefined, 
                selectedRole === 'teacher' ? selectedStreamId : undefined
            );

            setIsEditModalOpen(false);
            setEditingUser(null);
            loadData();
        } catch (err: any) {
            setRoleError(err.message || 'Failed to update role.');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setSelectedRole(user.role);
        setSelectedClassId(user.assigned_class_id || '');
        setSelectedStreamId(user.assigned_stream_id || '');
        setIsEditModalOpen(true);
        setRoleError('');
    };

    const availableRoles = [
        { value: 'librarian', label: 'Librarian' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'none', label: 'None / Deactivated' },
        ...(isSuperAdmin ? [
            { value: 'admin', label: 'Admin' },
            { value: 'SUPER_ADMIN', label: 'Super Admin' }
        ] : [])
    ];

    const filteredUsers = users;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Briefcase size={14} /> Staff Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Staff & Roles</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Manage user roles and permissions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex bg-muted p-1.5 rounded-[1.4rem] border border-border self-start">
                    <button onClick={() => setActiveTab('verified')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'verified' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                        Verified Staff
                    </button>
                    <button onClick={() => setActiveTab('unapproved')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'unapproved' ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                        Unapproved Access
                    </button>
                </div>

                <div className="relative flex-1 group">
                    <button onClick={loadData} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary hover:text-primary transition-colors z-10">
                        <Search size={20} />
                    </button>
                    <input type="text" placeholder="Search staff via name or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50" />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                    <XCircle size={16} /> {error}
                </div>
            )}

            <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Staff Member</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Role</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Staff...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <p className="font-black uppercase tracking-widest text-slate-600">No staff found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group border-b border-border/50">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all"><UserCircle2 size={24} /></div>
                                                <div className="font-black text-foreground text-base leading-none">{user.full_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm font-bold text-muted-foreground">{user.email}</td>
                                        <td className="px-8 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.role === 'SUPER_ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    user.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                        user.role === 'teacher' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                            user.role === 'none' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                                                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                {user.role === 'SUPER_ADMIN' && <ShieldCheck size={10} className="mr-1" />}
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            {/* Logic: 
                                                - Super Admin can edit anyone (except maybe themselves if separate logic, but here allowed).
                                                - Admin can edit anyone EXCEPT Super Admin and other Admins.
                                            */}
                                            {(isSuperAdmin || (isAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'admin')) && (
                                                <button onClick={() => openEditModal(user)} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 border border-border">
                                                    Manage Role
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Role Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingUser && (
                    <div className="fixed inset-0 h-screen z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2rem] border border-border bg-card p-8 shadow-2xl">
                            <h3 className="text-2xl font-black text-foreground uppercase mb-6 flex items-center gap-2">
                                <Briefcase className="text-primary" /> Update Role
                            </h3>

                            {roleError && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                    <XCircle size={14} /> {roleError}
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-muted/50 rounded-2xl border border-border">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target User</p>
                                <p className="text-lg font-black text-foreground">{editingUser.full_name}</p>
                                <p className="text-xs text-muted-foreground">{editingUser.email}</p>
                            </div>

                            <form onSubmit={handleUpdateRole} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select New Role</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableRoles.map((role) => (
                                            <label key={role.value} className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedRole === role.value ? 'bg-primary/10 border-primary text-primary' : 'bg-input border-border text-muted-foreground hover:border-primary/30'}`}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.value}
                                                    checked={selectedRole === role.value}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-4 h-4 text-primary bg-transparent border-primary focus:ring-offset-0 focus:ring-0 mr-2 accent-primary"
                                                />
                                                <span className="font-bold text-sm uppercase tracking-wide">{role.label}</span>
                                                {selectedRole === role.value && <Check size={16} className="ml-auto" />}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Teacher Specific Fields */}
                                    {selectedRole === 'teacher' && (
                                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Assigned Class</label>
                                                <select
                                                    value={selectedClassId}
                                                    onChange={(e) => {
                                                        setSelectedClassId(e.target.value);
                                                        setSelectedStreamId('');
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm"
                                                    required
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Assigned Stream</label>
                                                <select
                                                    value={selectedStreamId}
                                                    onChange={(e) => setSelectedStreamId(e.target.value)}
                                                    className="w-full p-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm"
                                                    disabled={!selectedClassId}
                                                    required
                                                >
                                                    <option value="">Select Stream</option>
                                                    {streams.filter(s => s.class_id === selectedClassId).map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-muted text-muted-foreground hover:text-foreground font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95">Cancel</button>
                                    <button disabled={actionLoading} type="submit" className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Role'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

