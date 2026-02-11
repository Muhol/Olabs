import React from 'react';
import { History, BookOpen, Clock, Users, TrendingUp } from 'lucide-react';

interface ActivityLedgerProps {
    role: string;
    recentActivity: any[];
    recentAssignments?: any[];
    teacherStats?: any;
}

export function ActivityLedger({ role, recentActivity, recentAssignments, teacherStats }: ActivityLedgerProps) {
    return (
        <div className="lg:col-span-2 glass-card rounded-[3rem] border border-border bg-card p-6 md:p-10 flex flex-col shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-x-32 -translate-y-32" />

            <div className="flex items-center justify-between mb-10 relative z-10">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    {role === 'teacher' ? (
                        <><BookOpen className="text-primary" /> My Curriculum</>
                    ) : (
                        <><History className="text-primary" /> Recent Activity</>
                    )}
                </h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl border border-border">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Feed</span>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                {role === 'teacher' ? (
                    (!recentAssignments || recentAssignments.length === 0) ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                <BookOpen size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-center">No assignments posted yet</p>
                        </div>
                    ) : (
                        recentAssignments.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center gap-6 p-4 rounded-[2rem] bg-muted/20 border border-transparent hover:border-border hover:bg-muted/40 transition-all group/item">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all bg-primary/10 text-primary border-primary/20">
                                    <BookOpen size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-black text-foreground text-base tracking-tight truncate">{assignment.title}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap ml-4">
                                            {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No Due Date'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                                            {assignment.subject} • <span className="text-primary">{assignment.class}</span>
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border text-emerald-500 border-emerald-500/10">
                                            Active
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    recentActivity.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                <History size={32} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-center">No recent entries in ledger</p>
                        </div>
                    ) : (
                        recentActivity.map((log: any) => (
                            <div key={log.id} className="flex items-center gap-6 p-4 rounded-[2rem] bg-muted/20 border border-transparent hover:border-border hover:bg-muted/40 transition-all group/item">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${log.status === 'returned' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {log.status === 'returned' ? <TrendingUp size={20} /> : <Clock size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-black text-foreground text-base tracking-tight">{log.book}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {new Date(log.borrow_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.borrow_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                                            {log.student} • <span className="text-primary">{log.class}</span>
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${log.status === 'returned' ? 'text-emerald-500 border-emerald-500/10' : 'text-amber-500 border-amber-500/10'}`}>
                                            {log.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
