'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Plus,
    Search,
    Users,
    GraduationCap,
    Edit,
    Trash2,
    Loader2,
    ArrowRight,
    XCircle,
    Building2,
    Hash,
    UserCircle2,
    RefreshCw,
    Layers,
    ChevronRight,
    Settings2,
    BarChart3,
    PieChart,
    ArrowUpRight
} from 'lucide-react';
import {
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    fetchClasses,
    createClass,
    deleteClass,
    fetchStreams,
    createStream,
    updateStream,
    deleteStream,
    promoteStudents
} from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import StudentDetailsModal from '@/components/modals/StudentDetailsModal';

export default function StudentsPage() {
    const { getToken } = useAuth();
    const { userRole } = useUserContext();
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');

    // Modals
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form States
    const [studentFormData, setStudentFormData] = useState({
        full_name: '',
        admission_number: '',
        class_id: '',
        stream_id: '',
        stream: ''
    });
    const [selectedClassStreams, setSelectedClassStreams] = useState<any[]>([]);
    const [isStreamsModalOpen, setIsStreamsModalOpen] = useState(false);
    const [managingClass, setManagingClass] = useState<any>(null);
    const [skip, setSkip] = useState(0);
    const [limit] = useState(15);
    const [totalStudents, setTotalStudents] = useState(0);
    const [className, setClassName] = useState('');

    // Modal Error States
    const [studentError, setStudentError] = useState('');
    const [classError, setClassError] = useState('');

    // Filtering State
    const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
    const [selectedStreamFilter, setSelectedStreamFilter] = useState<string | null>(null);

    const canManage = ['admin', 'SUPER_ADMIN'].includes(userRole);

    // Scroll Lock when any modal is open
    useScrollLock(isStudentModalOpen || isClassModalOpen || isStreamsModalOpen || !!viewingStudent);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [skip, search, selectedClassFilter, selectedStreamFilter]);

    // Reset page on search
    useEffect(() => {
        setSkip(0);
    }, [search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const [studentsData, classesData] = await Promise.all([
                fetchStudents(token, skip, limit, search, selectedClassFilter || undefined, selectedStreamFilter || undefined),
                fetchClasses(token)
            ]);
            setStudents(studentsData.items);
            setTotalStudents(studentsData.total);
            setClasses(classesData);
        } catch (err) {
            setError('Failed to load student data.');
        } finally {
            setLoading(false);
        }
    };

    const handleClassFilter = (classId: string) => {
        if (selectedClassFilter === classId && !selectedStreamFilter) {
            setSelectedClassFilter(null); // Deselect if clicking same class
        } else {
            setSelectedClassFilter(classId);
            setSelectedStreamFilter(null); // Reset stream when switching class
        }
        setSkip(0);
    };

    const handleStreamFilter = (e: React.MouseEvent, classId: string, streamId: string) => {
        e.stopPropagation(); // Prevent triggering class filter
        if (selectedStreamFilter === streamId) {
            setSelectedStreamFilter(null);
            // Optionally keep class selected or deselect all? Let's keep class selected
        } else {
            setSelectedClassFilter(classId); // Ensure parent class is selected
            setSelectedStreamFilter(streamId);
        }
        setSkip(0);
    };


    const handleSaveStudent = async (e: React.FormEvent) => {
        e.preventDefault();
    setActionLoading(true);
    setStudentError('');
    try {
        const token = await getToken();
        if (!token) {
            setStudentError('Authentication required. Please refresh the page.');
            setActionLoading(false);
            return;
        }

        if (editingStudent) {
            await updateStudent(token, editingStudent.id, studentFormData);
        } else {
            await createStudent(token, studentFormData);
        }

        setIsStudentModalOpen(false);
        setEditingStudent(null);
        resetStudentForm();
        loadData();
    } catch (err: any) {
        setStudentError(err.message || 'Operation failed.');
    } finally {
        setActionLoading(false);
    }
};

const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
        const token = await getToken();
        if (!token) return;
        await createClass(token, className);
        setClassName('');
        setIsClassModalOpen(false);
        loadData();
    } catch (err: any) {
        setClassError('Class creation failed.');
    } finally {
        setActionLoading(false);
    }
};

const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
        const token = await getToken();
        if (!token) return;
        await deleteStudent(token, id);
        loadData();
    } catch (err: any) {
        setError(err.message || 'Delete failed.');
    }
};

const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? All streams must be deleted first, and it must have no students.')) return;
    try {
        const token = await getToken();
        if (!token) return;
        await deleteClass(token, id);
        loadData();
    } catch (err: any) {
        setError(err.message || 'Delete failed.');
    }
};

const handlePromote = async () => {
    if (!confirm('BEWARE: This will promote ALL students in "Form X" classes to the next level. Form 4 students will be cleared/graduated. This action is irreversible. Proceed?')) return;
    setActionLoading(true);
    try {
        const token = await getToken();
        if (!token) return;
        const result = await promoteStudents(token);
        alert(`Promotion Complete!\nPromoted: ${result.promoted}\nGraduated: ${result.graduated}\nErrors/Skipped: ${result.skipped_or_error}`);
        loadData();
    } catch (err: any) {
        setError(err.message || 'Promotion failed.');
    } finally {
        setActionLoading(false);
    }
};

const resetStudentForm = () => {
    setStudentFormData({
        full_name: '',
        admission_number: '',
        class_id: '',
        stream_id: '',
        stream: ''
    });
    setSelectedClassStreams([]);
};

const handleClassChange = async (classId: string) => {
    setStudentFormData(prev => ({ ...prev, class_id: classId, stream_id: '' }));
    if (classId) {
        try {
            const token = await getToken();
            if (token) {
                const streamsData = await fetchStreams(token, classId);
                setSelectedClassStreams(streamsData);
            }
        } catch (err) {
            console.error("Failed to load streams for class");
        }
    } else {
        setSelectedClassStreams([]);
    }
};

const filteredStudents = students;

const PaginationControls = () => (
    <div className="flex items-center justify-between px-8 py-4 bg-muted/30 border border-border rounded-[2rem] backdrop-blur-xl transition-colors">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Students: {Math.min(skip + 1, totalStudents)} - {Math.min(skip + limit, totalStudents)} of {totalStudents}
            {(selectedClassFilter || selectedStreamFilter) && (
                <button onClick={() => { setSelectedClassFilter(null); setSelectedStreamFilter(null); setSkip(0); }} className="ml-4 text-rose-500 hover:underline flex items-center gap-1">
                    <XCircle size={10} /> Clear Filters
                </button>
            )}
        </div>
        <div className="flex gap-2">
            <button
                disabled={skip === 0 || loading}
                onClick={() => setSkip(Math.max(0, skip - limit))}
                className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {loading && skip > 0 ? <Loader2 size={12} className="animate-spin" /> : null} Previous
            </button>
            <button
                disabled={skip + limit >= totalStudents || loading}
                onClick={() => setSkip(skip + limit)}
                className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                Next {loading && skip + limit < totalStudents ? <Loader2 size={12} className="animate-spin" /> : null}
            </button>
        </div>
    </div>
);

return (
    <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-secondary font-black uppercase tracking-[0.3em] text-[10px]">
                    <Users size={14} /> Student Management
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Students</h1>
                <p className="text-muted-foreground font-medium tracking-tight">Manage student enrollment and class assignments.</p>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={loadData} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                {canManage && (
                    <div className="flex gap-2">
                        <button onClick={() => { setIsClassModalOpen(true); setClassError(''); }} className="px-5 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-xs tracking-widest rounded-xl border border-border transition-all active:scale-95">
                            New Class
                        </button>
                        <button onClick={() => { resetStudentForm(); setEditingStudent(null); setIsStudentModalOpen(true); setStudentError(''); }} className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus size={18} /> Add Student
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Quick Analytics Sector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 scrollbar-hide overflow-x-auto pb-4">
            {classes.map((cls, idx) => (
                <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleClassFilter(cls.id)}
                    className={`min-w-[300px] p-6 rounded-[2.5rem] border backdrop-blur-2xl transition-all group relative overflow-hidden cursor-pointer ${selectedClassFilter === cls.id
                            ? 'bg-secondary/10 border-secondary ring-2 ring-secondary/20'
                            : 'border-white/10 bg-slate-200 dark:bg-slate-500/5 hover:border-secondary/30'
                        }`}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/20 shadow-inner group-hover:scale-110 transition-transform">
                            <BarChart3 size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Students</div>
                            <div className="text-3xl font-black text-foreground group-hover:text-secondary transition-colors">{cls.student_count}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center justify-between gap-2">
                                <span>{cls.name} <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Enrollment</span></span>
                                {canManage && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setManagingClass(cls); setIsStreamsModalOpen(true); }}
                                        className="p-1.5 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-lg border border-secondary/20 transition-all active:scale-95"
                                        title="Add Stream"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </h3>
                            <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-secondary shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${Math.min(100, (cls.student_count / 100) * 100)}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {cls.streams.map((s: any) => (
                                <div
                                    key={s.id}
                                    onClick={(e) => handleStreamFilter(e, cls.id, s.id)}
                                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${selectedStreamFilter === s.id
                                            ? 'bg-secondary text-secondary-foreground border-secondary'
                                            : 'bg-muted/50 border-border hover:border-secondary/30'
                                        }`}
                                >
                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">{s.name}</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-foreground">{s.count}</span>
                                        <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-0.5">
                                            <ArrowUpRight size={8} /> {Math.round((s.count / (cls.student_count || 1)) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex bg-muted p-1.5 rounded-[1.4rem] border border-border self-start">
                <button onClick={() => setActiveTab('students')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'students' ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                    Active Students
                </button>
                <button onClick={() => setActiveTab('classes')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'classes' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                    Classes
                </button>
            </div>

            {activeTab === 'classes' && canManage && (
                <button 
                    disabled={actionLoading}
                    onClick={handlePromote}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                    Promote All To Next Level
                </button>
            )}

            <div className="relative flex-1 group">
                <button onClick={loadData} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-secondary hover:text-secondary transition-colors z-10">
                    <Search size={20} />
                </button>
                <input type="text" placeholder="Search students by name or admission number..." value={search} onChange={(e: any) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData()} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all placeholder:text-muted-foreground/50" />
            </div>
        </div>

        {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                <XCircle size={16} /> {error}
            </div>
        )}

        {activeTab === 'students' && (
            <div className="space-y-4">
                <PaginationControls />
                <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card transition-colors">
                    <AnimatePresence mode="wait">
                        <motion.div key={skip} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Admission No.</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Student Name</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Class</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stream</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <Loader2 className="animate-spin text-secondary mx-auto mb-4" size={40} />
                                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Students...</p>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center">
                                                <p className="font-black uppercase tracking-widest text-slate-600">No students found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr 
                                                key={student.id} 
                                                onClick={() => setViewingStudent(student)}
                                                className="hover:bg-muted/30 transition-colors group border-b border-border/50 cursor-pointer"
                                            >
                                                <td className="px-8 py-4"><span className="font-black text-xs text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20">{student.admission_number}</span></td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-secondary/20 group-hover:text-secondary transition-all"><UserCircle2 size={24} /></div>
                                                        <div className="font-black text-foreground text-base leading-none">{student.full_name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={14} className="text-muted-foreground" />
                                                        <div className="text-sm font-bold text-foreground/80">{student.class_name || 'Unassigned'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-2 text-primary font-black text-xs"><Layers size={14} />{student.full_class || student.stream || 'N/A'}</div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    {student.is_cleared ? (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">Cleared</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canManage && (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setStudentFormData(student); handleClassChange(student.class_id); setIsStudentModalOpen(true); }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all active:scale-90"><Edit size={16} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }} className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"><Trash2 size={16} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    </AnimatePresence>
                    <div className="bg-muted/30 border-t border-border">
                        <PaginationControls />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'classes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className="glass-card p-8 rounded-[2rem] border border-border bg-card hover:border-primary/50 transition-all group overflow-hidden relative flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative space-y-6 flex-1">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20"><Hash size={24} /></div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Students</div>
                                    <div className="text-2xl font-black text-foreground">{cls.student_count}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">{cls.name}</h4>
                                {canManage && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"
                                        title="Delete Class"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-1">Class</p>
                            <div className="space-y-3 pt-4 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Streams</div>
                                    {canManage && <button onClick={() => { setManagingClass(cls); setIsStreamsModalOpen(true); }} className="text-[10px] font-black text-secondary hover:underline flex items-center gap-1">Manage <Settings2 size={10} /></button>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {cls.streams.map((s: any) => (
                                        <div key={s.id} className="bg-muted p-2 rounded-lg border border-border">
                                            <div className="text-[9px] font-black text-muted-foreground uppercase truncate">{s.name}</div>
                                            <div className="text-sm font-black text-foreground">{s.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {isStudentModalOpen && (
            <div className="fixed inset-0 h-screen z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStudentModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-lg glass-card rounded-[2rem] md:rounded-[3rem] border border-border bg-card p-6 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary border border-secondary/20 mx-auto mb-4"><GraduationCap size={30} /></div>
                        <h3 className="text-3xl font-black text-foreground uppercase">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                    </div>
                        {studentError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                <XCircle size={14} /> {studentError}
            </div>
        )}
        <form onSubmit={handleSaveStudent} className="space-y-6">
            <Input label="Full Name" value={studentFormData.full_name} onChange={(e: any) => setStudentFormData({ ...studentFormData, full_name: e.target.value })} placeholder="John Doe" />
            <Input label="Admission Number" value={studentFormData.admission_number} onChange={(e: any) => setStudentFormData({ ...studentFormData, admission_number: e.target.value })} placeholder="ADM/2024/001" />
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Class</label>
                <select value={studentFormData.class_id} onChange={(e: any) => handleClassChange(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm focus:border-secondary outline-none transition-all appearance-none"><option value="" className="bg-card">Unassigned</option>{classes.map(c => <option key={c.id} value={c.id} className="bg-card">{c.name}</option>)}</select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stream</label>
                <select value={studentFormData.stream_id} onChange={(e: any) => setStudentFormData({ ...studentFormData, stream_id: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm focus:border-secondary outline-none transition-all appearance-none disabled:opacity-30" disabled={!studentFormData.class_id}><option value="" className="bg-card">None/Unassigned</option>{selectedClassStreams.map(s => <option key={s.id} value={s.id} className="bg-card">{s.name}</option>)}</select>
                {!studentFormData.class_id && <p className="text-[9px] text-muted-foreground/60 ml-1 uppercase font-black tracking-widest">Select a class first</p>}
            </div>
            <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="flex-1 py-4 bg-white/5 border border-border font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95">Abort</button>
                <button disabled={actionLoading} type="submit" className="flex-2 py-4 bg-secondary text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <>Save Student <ArrowRight size={18} /></>}
                </button>
            </div>
        </form>

            </motion.div>
        </div>
    )}

{
    isClassModalOpen && (
        <div className="fixed inset-0 h-screen z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClassModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-md glass-card rounded-[2rem] md:rounded-[3rem] border border-border bg-card p-6 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-3xl font-black text-foreground uppercase text-center mb-10">Create New Class</h3>
                {classError && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                        <XCircle size={14} /> {classError}
                    </div>
                )}
                <form onSubmit={handleCreateClass} className="space-y-6">
                    <Input label="Class Name" value={className} onChange={(e: any) => setClassName(e.target.value)} placeholder="Form 1, Year 10, etc." />
                    <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => setIsClassModalOpen(false)} className="flex-1 py-4 bg-white/5 border border-border font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95">Abort</button>
                        <button disabled={actionLoading} type="submit" className="flex-2 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Class'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

{
    isStreamsModalOpen && managingClass && (
        <StreamsModal className_={managingClass.name} classId={managingClass.id} onClose={() => { setIsStreamsModalOpen(false); setManagingClass(null); loadData(); }} tokenGetter={getToken} />
    )
}

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
        </div >
    );
}

function StreamsModal({ className_, classId, onClose, tokenGetter }: any) {
    const [streams, setStreams] = useState<any[]>([]);
    const [newStreamName, setNewStreamName] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [streamError, setStreamError] = useState('');

    useEffect(() => { loadStreams(); }, []);

    const loadStreams = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            const data = await fetchStreams(token, classId);
            setStreams(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStreamName.trim()) return;
        setAdding(true);
        setStreamError('');
        try {
            const token = await tokenGetter();
            await createStream(token, { name: newStreamName, class_id: classId });
            setNewStreamName('');
            loadStreams();
        } catch (err) { setStreamError('Failed to create stream.'); } finally { setAdding(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this stream? It must have no students.')) return;
        setStreamError('');
        try {
            const token = await tokenGetter();
            await deleteStream(token, id);
            loadStreams();
        } catch (err: any) { 
            setStreamError(err.message || 'Delete failed.'); 
        }
    };

    return (
        <div className="fixed inset-0 h-screen z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-200/80 dark:bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card rounded-[2rem] md:rounded-[3rem] border border-border bg-card p-6 md:p-10 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-1">Manage Streams</div>
                        <h3 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">{className_} <span className="text-muted-foreground/30">/</span> Streams</h3>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                </div>
                {streamError && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                        <XCircle size={14} /> {streamError}
                    </div>
                )}
                <form onSubmit={handleAdd} className="flex gap-3 mb-8">
                    <input type="text" placeholder="New Stream Name (e.g. A, B, North)" value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)} className="flex-1 px-5 py-4 rounded-2xl bg-input border border-border text-foreground font-bold text-sm focus:border-secondary outline-none transition-all placeholder:text-muted-foreground/50" />
                    <button disabled={adding} type="submit" className="px-6 py-4 bg-secondary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">{adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />} Add</button>
                </form>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-12 text-center"><Loader2 className="animate-spin text-muted-foreground mx-auto mb-2" size={30} /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Loading Streams...</p></div>
                    ) : streams.length === 0 ? (
                        <div className="py-12 text-center bg-muted/30 border border-dashed border-border rounded-2xl"><Layers className="text-muted-foreground mx-auto mb-2" size={30} /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">No streams found</p></div>
                    ) : (
                        streams.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-5 bg-muted rounded-[1.5rem] border border-border group hover:border-secondary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black group-hover:bg-secondary group-hover:text-white transition-all">{s.name.charAt(0)}</div>
                                    <div>
                                        <div className="text-sm font-black text-foreground">{s.name}</div>
                                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{className_} {s.name}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(s.id)} className="p-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-8 pt-8 border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-8 py-4 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95">Close</button>
                </div>
            </motion.div>
        </div>
    );
}

function Input({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <input {...props} className="w-full px-4 py-3.5 rounded-xl bg-input border border-border text-foreground font-bold text-sm focus:border-secondary outline-none transition-all placeholder:text-muted-foreground/50" />
        </div>
    );
}
