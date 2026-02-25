'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Megaphone,
    Bell,
    School,
    Users,
    Layers,
    BookOpen,
    ArrowRight,
    Loader2,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { fetchAnnouncements } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function AnnouncementFeed({ role }: { role: string }) {
    const { getToken } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnnouncements = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const data = await fetchAnnouncements(token);
                
                // Filter: Admin/SuperAdmin sees everything EXCEPT Subject announcements
                const filtered = (role === 'admin' || role === 'SUPER_ADMIN')
                    ? data.filter((a: any) => a.category !== 'SUBJECT')
                    : data;

                // Keep only the most recent 5
                setAnnouncements(filtered.slice(0, 5));
            } catch (err) {
                console.error('Failed to load dashboard announcements:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAnnouncements();
    }, [getToken]);

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
            case 'SCHOOL': return 'text-emerald-500';
            case 'STAFF': return 'text-rose-500';
            case 'STREAM': return 'text-amber-500';
            case 'SUBJECT': return 'text-blue-500';
            default: return 'text-primary';
        }
    };

    if (loading) {
        return (
            <div className="glass-card p-8 rounded-[2.5rem] border border-border bg-card flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-primary/40" size={32} />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Scanning Dispatches...</p>
            </div>
        );
    }

    return (
        <div className=" p-8 rounded-[2.5rem] border border-border bg-card flex flex-col h-full group/card transition-all hover:border-primary/20">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Megaphone size={14} className="group-hover/card:rotate-12 transition-transform" /> Communication Hub
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Recent Announcements</h2>
                </div>
                <Link
                    href="/announcements"
                    className="p-2 bg-muted hover:bg-primary hover:text-white rounded-xl transition-all group/link"
                >
                    <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto">
                {announcements.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center opacity-30 gap-3 border-2 border-dashed border-border rounded-[2rem]">
                        <Bell size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest">No active dispatches</p>
                    </div>
                ) : (
                    announcements.map((announcement, idx) => {
                        const Icon = getCategoryIcon(announcement.category);
                        return (
                            <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group/item flex items-center gap-4 p-4 rounded-3xl hover:bg-muted/50 transition-all border border-transparent hover:border-border"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm ${getCategoryColor(announcement.category)}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black uppercase tracking-tight truncate flex-1">{announcement.title}</h4>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 shrink-0">
                                            {new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium line-clamp-1 mt-0.5">{announcement.content}</p>
                                </div>
                                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                            </motion.div>
                        );
                    })
                )}
              <div className="w-full z-10 h-[100px] bg-gradient-to-t from-background to-transparent sticky -bottom-1 left-0 right-0"></div>

            </div>

            <Link
                href="/announcements"
                className="mt-6 flex items-center justify-center gap-2 py-4 bg-muted/50 hover:bg-muted rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all"
            >
                View Broadcast History
            </Link>
        </div>
    );
}
