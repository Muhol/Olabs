import React from 'react';
import { Plus, BookOpen, Users, Activity, ShieldCheck, History } from 'lucide-react';
import { ProtocolButton } from './ProtocolButton';

interface QuickActionsPanelProps {
    role: string;
}

export function QuickActionsPanel({ role }: QuickActionsPanelProps) {
    return (
        <div className="glass-card rounded-[3rem] border border-border bg-card p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-2xl rounded-full -translate-x-16 -translate-y-16" />

            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-10 relative z-10">Quick Actions</h3>

            <div className="space-y-4 relative z-10">
                {role === 'teacher' ? (
                    <>
                        <ProtocolButton color="primary" icon={<Plus />} label="New Assignment" href="/teachers/assignments" desc="Create task for students" />
                        <ProtocolButton color="secondary" icon={<BookOpen />} label="My Subjects" href="/teachers/my-class" desc="Manage assigned subjects" />
                        <ProtocolButton color="amber" icon={<Users />} label="View Students" href="/teachers/enrollment" desc="Check enrollment details" />
                        {/* <ProtocolButton color="rose" icon={<Activity />} label="Check Reports" href="/reports" desc="Performance overview" /> */}
                    </>
                ) : role === 'librarian' ? (
                    <>
                        <ProtocolButton color="primary" icon={<BookOpen />} label="Borrow Book" href="/inventory" desc="Issue a book to student" />
                        <ProtocolButton color="secondary" icon={<Users />} label="Add Student" href="/students" desc="Register new student" />
                        <ProtocolButton color="amber" icon={<Plus />} label="Add Book" href="/inventory" desc="Add new book to library" />
                        <ProtocolButton color="rose" icon={<History />} label="Borrow History" href="/history" desc="Check past transactions" />
                    </>
                ) : (
                    <>
                        <ProtocolButton color="primary" icon={<BookOpen />} label="Borrow Book" href="/inventory" desc="Issue a book to student" />
                        <ProtocolButton color="secondary" icon={<ShieldCheck />} label="Staff Management" href="/staff" desc="Manage school personnel" />
                        <ProtocolButton color="amber" icon={<Users />} label="Students" href="/students" desc="Manage student records" />
                        <ProtocolButton color="rose" icon={<Activity />} label="System Logs" href="/logs" desc="Check system logs" />
                    </>
                )}
            </div>
        </div>
    );
}
