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
    BarChart3,
    BookOpen,
    CheckCircle2
} from 'lucide-react';
import { fetchStudents, fetchClasses, fetchStreams, getTeacherSubjectAssignments } from '@/lib/api';
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

    // Subjects tab state
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('subjects');
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    const classId = systemUser?.assigned_class_id;
    const streamId = systemUser?.assigned_stream_id;

    // Set default tab based on assignment status
    useEffect(() => {
        if (systemUser) {
            setActiveTab(systemUser.assigned_class_id ? 'students' : 'subjects');
        }
    }, [systemUser?.id]);

    useEffect(() => {
        if (systemUser) {
            // Check if user has access to My Class page
            // Allowed: SUPER_ADMIN, teacher, or admin with 'all' or 'teacher' subrole
            const hasAccess =
                userRole === 'SUPER_ADMIN' ||
                userRole === 'teacher' ||
                (userRole === 'admin' && systemUser.subroles &&
                    (systemUser.subroles.includes('all') || systemUser.subroles.includes('teacher')));

            if (hasAccess) {
                loadData();
                loadTeacherSubjects();
                if (classId) {
                    loadAssignmentInfo();
                }
            } else {
                setError("Access denied. This page is only accessible to teachers, super admins, and admins with teacher management permissions.");
                setLoading(false);
            }
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
            setStudents([]);
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

    const loadTeacherSubjects = async () => {
        if (!systemUser?.id) return;

        setSubjectsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // Fetch all teacher's subject assignments
            const allAssignments = await getTeacherSubjectAssignments(token, systemUser.id);

            // Show all subjects regardless of class/stream
            setTeacherSubjects(allAssignments);
        } catch (err) {
            console.error('Failed to load teacher subjects:', err);
        } finally {
            setSubjectsLoading(false);
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

    const isPrivileged = userRole === 'SUPER_ADMIN' ||
        userRole === 'teacher' ||
        (userRole === 'admin' && systemUser?.subroles &&
            (systemUser.subroles.includes('all') || systemUser.subroles.includes('teacher')));

    if (!classId && !loading && !isPrivileged) {
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
                        {classId ? (
                            <>
                                {assignmentInfo?.className} <span className="text-muted-foreground/30 font-normal">/</span> {assignmentInfo?.streamName}
                            </>
                        ) : (
                            "No Assigned Class"
                        )}
                    </h1>
                    <p className="text-muted-foreground font-medium tracking-tight">
                        {classId
                            ? "Monitor and manage students in your assigned stream."
                            : "View your subject assignments and student performance."
                        }
                    </p>
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

            {/* Tab Switcher */}
            <div className="flex gap-2 p-2 bg-muted/30 rounded-2xl border border-border w-fit">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'students'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Users size={16} />
                    Students {selectedSubject && `(Filtered)`}
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'subjects'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <BookOpen size={16} />
                    My Subjects
                </button>
            </div>

            {/* Selected Subject Filter Badge */}
            {selectedSubject && activeTab === 'students' && (
                <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <BookOpen size={20} className="text-primary" />
                    <div className="flex-1">
                        <p className="text-xs font-black uppercase text-primary">Filtering by Subject</p>
                        <p className="text-sm font-bold text-foreground">
                            {(() => {
                                const s = teacherSubjects.find(subj => subj.subject_id === selectedSubject);
                                if (!s) return 'Loading...';
                                return `${s.subject_name} (${s.class_name}${s.stream_name ? ` / ${s.stream_name}` : ''})`;
                            })()}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            setSelectedSubject(null);
                            await loadData(); // Reset to primary class
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase hover:bg-primary/90 transition-all"
                    >
                        Clear Filter
                    </button>
                </div>
            )}


            {/* Student Table */}
            {activeTab === 'students' && (
                <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card relative">
                    {loading && (
                        <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <Loader2 className="animate-spin text-primary mb-4" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Updating Records...</p>
                        </div>
                    )}
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
                                {students
                                    .filter(student => {
                                        // Filter by selected subject if one is selected
                                        if (!selectedSubject) return true;

                                        // Find the selected subject object to check if it's compulsory
                                        const subject = teacherSubjects.find(s => s.subject_id === selectedSubject);

                                        // If subject is compulsory, show all students (assuming all in class take it)
                                        if (subject?.is_compulsory) return true;

                                        // Otherwise, check for explicit assignment
                                        return student.subjects?.some((s: any) => s.id === selectedSubject);
                                    })
                                    .length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest text-xs">
                                            {selectedSubject ? 'No students taking this subject' : 'No students found in this stream'}
                                        </td>
                                    </tr>
                                ) : (
                                    students
                                        .filter(student => {
                                            if (!selectedSubject) return true;
                                            const subject = teacherSubjects.find(s => s.subject_id === selectedSubject);
                                            if (subject?.is_compulsory) return true;
                                            return student.subjects?.some((s: any) => s.id === selectedSubject);
                                        })
                                        .map((student) => (
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
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
                <div className="space-y-6">
                    {subjectsLoading ? (
                        <div className="glass-card p-12 rounded-[3rem] border border-border">
                            <div className="h-64 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Subjects...</p>
                            </div>
                        </div>
                    ) : teacherSubjects.length === 0 ? (
                        <div className="glass-card p-12 rounded-[3rem] border border-border text-center">
                            <div className="w-20 h-20 bg-slate-500/10 text-slate-500 rounded-3xl flex items-center justify-center border border-slate-500/20 mx-auto mb-6">
                                <BookOpen size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-foreground uppercase mb-2">No Subjects Assigned</h3>
                            <p className="text-muted-foreground font-medium max-w-md mx-auto">
                                You haven't been assigned any subjects for this class/stream yet.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground font-medium">
                                    You teach <span className="font-black text-primary">{teacherSubjects.length}</span> subject{teacherSubjects.length !== 1 ? 's' : ''} in this class
                                </p>
                            </div>

                            <div className="space-y-12">
                                {Object.entries(
                                    teacherSubjects.reduce((acc: any, subject) => {
                                        const key = `${subject.class_name}${subject.stream_name ? ` / ${subject.stream_name}` : ' / All Streams'}`;
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(subject);
                                        return acc;
                                    }, {})
                                ).map(([category, subjects]: [string, any]) => (
                                    <div key={category} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-border" />
                                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
                                                <Building2 size={12} className="text-primary" /> {category}
                                            </h4>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {subjects.map((subject: any) => {
                                                const studentCount = subject.student_count;
                                                const isCurrentClass = subject.class_id === classId;
                                                const isSelected = selectedSubject === subject.subject_id;

                                                return (
                                                    <motion.div
                                                        key={subject.id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={async () => {
                                                            setActiveTab('students');
                                                            setSelectedSubject(subject.subject_id);

                                                            // Check if we are currently displaying the class and stream this subject belongs to
                                                            const isCorrectContext = students.length > 0 && 
                                                                students[0].class_id === subject.class_id && 
                                                                (subject.stream_id ? students[0].stream_id === subject.stream_id : !students[0].stream_id);

                                                            if (!isCorrectContext) {
                                                                setLoading(true);
                                                                try {
                                                                    const token = await getToken();
                                                                    if (token) {
                                                                        const data = await fetchStudents(
                                                                            token, 0, 100, '', subject.class_id, subject.stream_id || undefined
                                                                        );
                                                                        setStudents(data.items);
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Failed to switch class context", err);
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }
                                                        }}
                                                        className={`glass-card p-6 rounded-[2rem] border cursor-pointer transition-all ${isSelected
                                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                                : 'border-border hover:border-primary/30 bg-card'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isSelected
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-primary/10 text-primary border-primary/20'
                                                                }`}>
                                                                <BookOpen size={24} />
                                                            </div>
                                                            {isSelected && (
                                                                <div className="flex items-center gap-1 text-primary">
                                                                    <CheckCircle2 size={16} />
                                                                    <span className="text-[9px] font-black uppercase">Selected</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <h3 className="text-xl font-black text-foreground uppercase mb-2 line-clamp-2">
                                                            {subject.subject_name}
                                                        </h3>

                                                        <div className="flex items-center gap-4 text-sm mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <Users size={16} className="text-muted-foreground" />
                                                                <span className="font-black text-foreground">{studentCount}</span>
                                                                <span className="text-muted-foreground font-medium">student{studentCount !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 border-t border-border">
                                                            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                <span>Click to view Students</span>
                                                                <RefreshCw size={10} />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

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
