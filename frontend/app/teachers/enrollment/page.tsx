'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Users,
    Loader2,
    XCircle,
    Building2,
    Layers,
    BookOpen,
    CheckCircle2,
    Search,
    ChevronLeft,
    ChevronRight,
    Check,
    ArrowRight
} from 'lucide-react';
import { fetchStudents, fetchSubjectsByClassAndStream, enrollStudentsToSubject, fetchEnrolledStudentIds } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassEnrollmentPage() {
    const { getToken } = useAuth();
    const { systemUser, userRole } = useUserContext();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Enrollment Modal State
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollingSubject, setEnrollingSubject] = useState<any>(null);
    const [enrollingStudents, setEnrollingStudents] = useState<any[]>([]);
    const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
    const [enrollModalPage, setEnrollModalPage] = useState(0);
    const [enrollModalTotal, setEnrollModalTotal] = useState(0);
    const [enrollModalLimit] = useState(10);
    const [isEnrollDataLoading, setIsEnrollDataLoading] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [search, setSearch] = useState('');

    const classId = systemUser?.assigned_class_id;
    const streamId = systemUser?.assigned_stream_id;

    useEffect(() => {
        if (systemUser) {
            const hasAccess =
                userRole === 'SUPER_ADMIN' ||
                userRole === 'teacher' ||
                (userRole === 'admin' && systemUser.subroles &&
                    (systemUser.subroles.includes('all') || systemUser.subroles.includes('teacher')));

            if (hasAccess) {
                if (classId) {
                    loadSubjects();
                } else {
                    setLoading(false);
                }
            } else {
                setError("Access denied. This page is only accessible to teachers with assigned classes.");
                setLoading(false);
            }
        }
    }, [systemUser, classId, streamId]);

    const loadSubjects = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            
            console.log('🔍 [Enrollment] Fetching subjects for classId:', classId);
            console.log('🔍 [Enrollment] Teacher streamId:', streamId);
            
            // Use the new dedicated endpoint to fetch subjects by class and stream
            const classSubjects = await fetchSubjectsByClassAndStream(token, classId!, streamId);
            console.log('📚 [Enrollment] Subjects fetched:', classSubjects);
            console.log('📊 [Enrollment] Total subjects:', classSubjects.length);
            
            setSubjects(classSubjects);
        } catch (err) {
            console.error('❌ [Enrollment] Error loading subjects:', err);
            setError('Failed to load subjects for your class.');
        } finally {
            setLoading(false);
        }
    };

    const openEnrollModal = async (subject: any) => {
        setEnrollingSubject(subject);
        setIsEnrollModalOpen(true);
        setEnrollModalPage(0);
        setEnrolledStudentIds([]);

        setIsEnrollDataLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const ids = await fetchEnrolledStudentIds(token, subject.id);
            setEnrolledStudentIds(ids);
            await loadEnrollmentData(subject, 0);
        } catch (err) {
            console.error(err);
        } finally {
            setIsEnrollDataLoading(false);
        }
    };

    const loadEnrollmentData = async (subject: any, page: number) => {
        setIsEnrollDataLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchStudents(token, page * enrollModalLimit, enrollModalLimit, '', subject.class_id, subject.stream_id);
            setEnrollingStudents(data.items);
            setEnrollModalTotal(data.total);
            setEnrollModalPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setIsEnrollDataLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!enrollingSubject) return;
        setIsEnrolling(true);
        try {
            const token = await getToken();
            if (!token) return;
            await enrollStudentsToSubject(token, enrollingSubject.id, enrolledStudentIds);
            setIsEnrollModalOpen(false);
            loadSubjects(); // Refresh counts
        } catch (err) {
            console.error(err);
            alert('Failed to update enrollment');
        } finally {
            setIsEnrolling(false);
        }
    };

    if (loading && !subjects.length) {
        return (
            <div className="h-96 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Enrollment Portal...</p>
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
                    You haven't been assigned to a class or stream yet. Enrollment management is only available to assigned class teachers.
                </p>
            </div>
        );
    }

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Building2 size={14} /> Subject Enrollment Portal
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
                        Enroll Students
                    </h1>
                    <p className="text-muted-foreground font-medium tracking-tight">
                        Manage subject registrations for students in your assigned class.
                    </p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-32 py-4 rounded-2xl bg-card border border-border text-foreground font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                    />
                    <button
                        className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <Search size={14} /> Search
                    </button>
                </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.length === 0 ? (
                    <div className="col-span-full p-20 text-center glass-card rounded-[3rem] border border-dashed border-border">
                        <BookOpen size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">No subjects found</p>
                    </div>
                ) : (
                    filteredSubjects.map((subject) => (
                        <motion.div
                            key={subject.id}
                            whileHover={{ y: -5 }}
                            className="glass-card p-8 rounded-[2.5rem] border border-border bg-card flex flex-col shadow-xl"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                    <BookOpen size={28} />
                                </div>
                                {subject.is_compulsory && (
                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest">Compulsory</span>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-foreground uppercase mb-2 line-clamp-1">{subject.name}</h3>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users size={16} />
                                    <span className="font-black text-foreground">{subject.student_count}</span>
                                    <span className="font-bold">Enrolled</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-border" />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase text-[10px] font-black">
                                    <Layers size={14} /> {subject.stream_name || 'All Streams'}
                                </div>
                            </div>

                            <button
                                onClick={() => openEnrollModal(subject)}
                                className="mt-auto w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                Manage Enrollment
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Enrollment Modal */}
            <AnimatePresence>
                {isEnrollModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEnrollModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-border bg-card p-0 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                            <div className="p-8 pb-4 border-b border-border bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                                            {enrollingSubject?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{enrollingSubject?.name}</h3>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                                Enrollment <div className="w-1 h-1 rounded-full bg-border"></div> {enrollingSubject?.stream_name || 'All Streams'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEnrollModalOpen(false)} className="p-4 bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-2xl transition-all">
                                        <XCircle size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Select Students</h4>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-colors">Select All in stream</span>
                                        <div
                                            onClick={async () => {
                                                const token = await getToken();
                                                if (!token || !enrollingSubject) return;
                                                setIsEnrollDataLoading(true);
                                                try {
                                                    const data = await fetchStudents(token, 0, 1000, '', enrollingSubject.class_id, enrollingSubject.stream_id);
                                                    const allIds = data.items.map((s: any) => s.id);
                                                    if (enrolledStudentIds.length >= data.total && data.total > 0) {
                                                        setEnrolledStudentIds([]);
                                                    } else {
                                                        setEnrolledStudentIds(allIds);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setIsEnrollDataLoading(false);
                                                }
                                            }}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${enrolledStudentIds.length >= enrollModalTotal && enrollModalTotal > 0 ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'}`}
                                        >
                                            {enrolledStudentIds.length >= enrollModalTotal && enrollModalTotal > 0 && <Check size={14} className="text-white" />}
                                        </div>
                                    </label>
                                </div>

                                {isEnrollDataLoading ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-primary" size={40} />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fetching students...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {enrollingStudents.map((student) => {
                                            const isSelected = enrolledStudentIds.includes(student.id);
                                            return (
                                                <div
                                                    key={student.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setEnrolledStudentIds(enrolledStudentIds.filter(id => id !== student.id));
                                                        } else {
                                                            setEnrolledStudentIds([...enrolledStudentIds, student.id]);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/30 border-border hover:border-primary/30'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                            {student.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{student.full_name}</p>
                                                            <p className="text-[9px] text-muted-foreground font-black uppercase">{student.admission_number}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-8 pt-4 border-t border-border bg-muted/20 space-y-4">
                                {enrollModalTotal > enrollModalLimit && (
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            disabled={enrollModalPage === 0 || isEnrollDataLoading}
                                            onClick={() => loadEnrollmentData(enrollingSubject, enrollModalPage - 1)}
                                            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                            Page {enrollModalPage + 1} of {Math.ceil(enrollModalTotal / enrollModalLimit)}
                                        </span>
                                        <button
                                            disabled={(enrollModalPage + 1) * enrollModalLimit >= enrollModalTotal || isEnrollDataLoading}
                                            onClick={() => loadEnrollmentData(enrollingSubject, enrollModalPage + 1)}
                                            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setIsEnrollModalOpen(false)} className="flex-1 py-4 bg-muted text-foreground font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-muted/80 transition-all">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEnroll}
                                        disabled={isEnrolling}
                                        className="flex-[2] py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
                                    >
                                        {isEnrolling ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                        Save Enrollment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
