"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Download,
    CalendarDays,
    ExternalLink,
    Loader2
} from "lucide-react";

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        const token = localStorage.getItem("student_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/portal/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAssignments([...data.upcoming_assignments, ...data.overdue_assignments]);
        setLoading(false);
    };

    const getStatusBadge = (dueDate: string) => {
        const now = new Date();
        const due = new Date(dueDate);
        if (due < now) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/5">
                    Overdue Assignment
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
                Upcoming Task
            </div>
        );
    };

    if (loading) {
        return <div className="space-y-8 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-[2.5rem] border border-border" />)}
        </div>;
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                    <FileText size={14} /> My Coursework
                </div>
                <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Active Assignments</h1>
                {/* <p className="text-muted-foreground font-medium max-w-md">Track your project deadlines, submission requirements, and task status.</p> */}
            </div>

            <div className="space-y-6">
                {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <div key={assignment.id} className="group relative bg-card border border-border rounded-[2.5rem] p-8 md:p-10 hover:border-secondary/30 transition-all duration-500 overflow-hidden shadow-2xl shadow-black/5">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[100px] rounded-full translate-x-12 -translate-y-12" />

                            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 bg-muted rounded-[1.5rem] flex items-center justify-center text-muted-foreground border border-border group-hover:bg-secondary/10 group-hover:text-secondary group-hover:scale-110 transition-all duration-500 shrink-0">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">{assignment.title}</h3>
                                            {getStatusBadge(assignment.due_date)}
                                        </div>
                                        <p className="text-muted-foreground font-medium text-sm line-clamp-2 max-w-2xl leading-relaxed">{assignment.description}</p>
                                        <div className="flex flex-wrap items-center gap-6 pt-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                                                <Clock className="w-4 h-4 text-primary" /> Deadline: {new Date(assignment.due_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                                                <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Status: Pending Submission
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 lg:self-center">
                                    {assignment.file_url && (
                                        <a
                                            href={assignment.file_url}
                                            target="_blank"
                                            className="px-6 py-4 bg-muted hover:bg-muted/80 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border transition-all active:scale-95 flex items-center gap-3"
                                        >
                                            <Download className="w-4 h-4" /> Resources
                                        </a>
                                    )}
                                    <button className="px-10 py-5 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-secondary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                                        Submit Task <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-32 bg-muted/10 border border-dashed border-border rounded-[3rem] text-center opacity-40 shadow-inner">
                        <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mb-6 text-muted-foreground shadow-xl border border-border">
                            <CalendarDays className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground uppercase mb-2">No Active Assignments</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground max-w-xs leading-loose">
                            You have no pending assignments at the moment. <br />
                            Check back later for new tasks.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
