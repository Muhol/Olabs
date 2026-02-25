import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Users, Activity, ShieldCheck, History, FileText, Megaphone } from 'lucide-react';
import { ProtocolButton } from './ProtocolButton';
import ClassScoreSheetModal from '../modals/ClassScoreSheetModal';
import { useAuth } from '@clerk/nextjs';

interface QuickActionsPanelProps {
    role: string;
}

export function QuickActionsPanel({ role }: QuickActionsPanelProps) {
    const { getToken } = useAuth();
    const [showScoreSheet, setShowScoreSheet] = useState(false);

    return (
        <div className="glass-card rounded-[3rem] border border-border bg-card p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-2xl rounded-full -translate-x-16 -translate-y-16" />

            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-10 relative z-10">Quick Actions</h3>

            <div className="space-y-4 relative z-10">
                {role === 'teacher' ? (
                    <>
                        <ProtocolButton color="primary" icon={<Plus />} label="New Assignment" href="/teachers/assignments" desc="Create task for students" />
                        <ProtocolButton color="secondary" icon={<Megaphone />} label="New Dispatch" href="/announcements" desc="Broadcast update to school" />
                        <ProtocolButton color="amber" icon={<BookOpen />} label="My Subjects" href="/teachers/my-class" desc="Manage assigned subjects" />
                        <button
                            onClick={() => setShowScoreSheet(true)}
                            className="w-full flex items-center gap-6 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all group/btn shadow-sm"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-indigo-500 transition-all">
                                <FileText size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black uppercase tracking-tighter text-lg leading-none mb-1">Class Score Sheet</h4>
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Consolidated Records</p>
                            </div>
                        </button>
                        <ProtocolButton color="amber" icon={<Users />} label="View Students" href="/teachers/enrollment" desc="Check enrollment details" />
                        {/* <ProtocolButton color="rose" icon={<Activity />} label="Check Reports" href="/reports" desc="Performance overview" /> */}
                    </>
                ) : role === 'librarian' ? (
                    <>
                        <ProtocolButton color="primary" icon={<BookOpen />} label="Borrow Book" href="/inventory" desc="Issue a book to student" />
                        <ProtocolButton color="secondary" icon={<Megaphone />} label="New Dispatch" href="/announcements" desc="Broadcast update to school" />
                        <ProtocolButton color="secondary" icon={<Users />} label="Add Student" href="/students" desc="Register new student" />
                        <ProtocolButton color="amber" icon={<Plus />} label="Add Book" href="/inventory" desc="Add new book to library" />
                        <ProtocolButton color="rose" icon={<History />} label="Borrow History" href="/history" desc="Check past transactions" />
                    </>
                ) : (
                    <>
                        <ProtocolButton color="primary" icon={<BookOpen />} label="Borrow Book" href="/inventory" desc="Issue a book to student" />
                        <ProtocolButton color="secondary" icon={<ShieldCheck />} label="Staff Management" href="/staff" desc="Manage school personnel" />
                        <ProtocolButton color="amber" icon={<Users />} label="Students" href="/students" desc="Manage student records" />
                        <ProtocolButton color="secondary" icon={<Megaphone />} label="New Dispatch" href="/announcements" desc="Broadcast update to school" />
                        <ProtocolButton color="rose" icon={<Activity />} label="System Logs" href="/logs" desc="Check system logs" />
                    </>
                )}
            </div>

            <AnimatePresence>
                {showScoreSheet && (
                    <ClassScoreSheetModal
                        tokenGetter={getToken}
                        onClose={() => setShowScoreSheet(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
