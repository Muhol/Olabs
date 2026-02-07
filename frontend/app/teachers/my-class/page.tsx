'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Users,
    UserCircle2,
    RefreshCw,
    Loader2,
    XCircle,
    Building2,
    Layers,
    BarChart3
} from 'lucide-react';
import { fetchStudents, fetchClasses, fetchStreams } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import StudentDetailsModal from '@/components/modals/StudentDetailsModal';

export default function MyClassPage() {
    const { getToken } = useAuth();
    const { systemUser, userRole } = useUserContext();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const [assignmentInfo, setAssignmentInfo] = useState<{ className: string; streamName: string } | null>(null);

    const classId = systemUser?.assigned_class_id;
    const streamId = systemUser?.assigned_stream_id;

    useEffect(() => {
        if (systemUser && (userRole === 'teacher' || userRole === 'admin' || userRole === 'SUPER_ADMIN')) {
            loadData();
            if (classId) {
                loadAssignmentInfo();
            }
        } else if (systemUser) {
            setError("Only teachers can access this view.");
            setLoading(false);
        }
    }, [systemUser, classId, streamId]);

    const loadAssignmentInfo = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const [classes, streams] = await Promise.all([
                fetchClasses(token),
                fetchStreams(token, classId)
            ]);
            const cls = classes.find((c: any) => c.id === classId);
            const stm = streams.find((s: any) => s.id === streamId);
            setAssignmentInfo({
                className: cls?.name || 'Unknown Class',
                streamName: stm?.name || 'All Streams'
            });
        } catch (err) {
            console.error("Failed to load assignment names", err);
        }
    };

    const loadData = async () => {
        if (!classId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            
            // Fetch students filtered by the teacher's class and stream
            const data = await fetchStudents(
                token, 
                0, 
                100, 
                '', 
                classId, 
                streamId || undefined
            );
            setStudents(data.items);
        } catch (err) {
            setError('Failed to load your class students.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !students.length) {
        return (
            <div className="h-96 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Class Records...</p>
            </div>
        );
    }

    if (!classId && !loading) {
        return (
            <div className="p-12 text-center glass-card rounded-[3rem] border border-white/10 bg-card">
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-500/20 mx-auto mb-6">
                    <XCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase mb-2">No Class Assigned</h2>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    You haven't been assigned to a class or stream yet. Please contact the administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Building2 size={14} /> My Assigned Class
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
                        {assignmentInfo?.className} <span className="text-muted-foreground/30 font-normal">/</span> {assignmentInfo?.streamName}
                    </h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Monitor and manage students in your assigned stream.</p>
                </div>

                <button onClick={loadData} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95 self-start md:self-center">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border border-white/10 bg-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Total Students</p>
                        <p className="text-2xl font-black text-foreground">{students.length}</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-white/10 bg-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Cleared</p>
                        <p className="text-2xl font-black text-foreground">
                            {students.filter(s => s.is_cleared).length}
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border border-white/10 bg-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-500/20">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Pending Clearance</p>
                        <p className="text-2xl font-black text-foreground">
                            {students.filter(s => !s.is_cleared).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Student Table */}
            <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Admission No.</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Student Name</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stream</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest text-xs">
                                        No students found in this stream
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => setViewingStudent(student)}
                                        className="hover:bg-muted/30 transition-colors group border-b border-border/50 cursor-pointer"
                                    >
                                        <td className="px-8 py-4">
                                            <span className="font-black text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                                {student.admission_number}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                    <UserCircle2 size={24} />
                                                </div>
                                                <div className="font-black text-foreground text-base leading-none">{student.full_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2 text-primary font-black text-xs">
                                                <Layers size={14} /> {student.stream || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            {student.is_cleared ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">Cleared</span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {viewingStudent && (
                    <StudentDetailsModal 
                        student={viewingStudent} 
                        onClose={() => setViewingStudent(null)} 
                        tokenGetter={getToken}
                        onUpdate={loadData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
