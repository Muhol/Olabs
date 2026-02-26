'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Bell,
    Plus,
    Trash2,
    Loader2,
    AlertCircle,
    Search,
    RefreshCw,
    School,
    Users,
    Layers,
    BookOpen,
    Calendar,
    Megaphone
} from 'lucide-react';
import { fetchAnnouncements, deleteAnnouncement } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import CreateAnnouncementModal from '@/components/modals/CreateAnnouncementModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementsPage() {
    const { getToken } = useAuth();
    const { userRole } = useUserContext();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const canDelete = ['admin', 'SUPER_ADMIN'].includes(userRole);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchAnnouncements(token);
            setAnnouncements(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load announcements.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to retract this announcement?')) return;
        setDeletingId(id);
        try {
            const token = await getToken();
            if (!token) return;
            await deleteAnnouncement(token, id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            alert(err.message || 'Retraction failed.');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase())
    );

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'SCHOOL': return School;
            case 'STAFF': return Users;
            case 'STREAM': return Layers;
            case 'SUBJECT': return BookOpen;
            default: return Bell;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'SCHOOL': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'STAFF': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'STREAM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'SUBJECT': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Megaphone size={14} /> Communication Hub
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Announcements</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Broadcast updates to classes, subjects, or the whole school.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} /> New Dispatch
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Search & Filters */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search announcements..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-sm font-bold focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="glass-card p-6 rounded-[2rem] border border-border bg-card space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Stats</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                                <div className="text-2xl font-black">{announcements.length}</div>
                                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Announcements</div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                                <div className="text-2xl font-black text-emerald-500">
                                    {announcements.filter(a => a.category === 'SCHOOL').length}
                                </div>
                                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">School-wide</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="xl:col-span-3 space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                            <Loader2 size={40} className="animate-spin text-primary" />
                            <p className="text-xs font-black uppercase tracking-widest">Scanning Communication Channels...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-4 text-rose-500">
                            <AlertCircle size={24} />
                            <div>
                                <p className="font-black uppercase text-xs tracking-widest">System Error</p>
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                <Megaphone size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest">No active dispatches found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAnnouncements.map((announcement, idx) => {
                                const Icon = getCategoryIcon(announcement.category);
                                return (
                                    <motion.div
                                        key={announcement.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group p-6 md:p-8 rounded-[2.5rem] bg-card border border-border hover:border-primary/30 transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 duration-500 ${getCategoryColor(announcement.category)}`}>
                                            <Icon size={24} />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight truncate">{announcement.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getCategoryColor(announcement.category)}`}>
                                                    {announcement.category}
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted-foreground font-medium line-clamp-2 md:line-clamp-1">{announcement.content}</p>

                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                    <Calendar size={12} />
                                                    {new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                                    <Users size={12} />
                                                    By {announcement.author_name}
                                                </div>
                                                {announcement.target_name && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                        <Layers size={12} />
                                                        Target: {announcement.target_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                disabled={deletingId === announcement.id}
                                                className="absolute top-4 right-4 md:static p-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            >
                                                {deletingId === announcement.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <CreateAnnouncementModal
                        tokenGetter={getToken}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={loadData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
