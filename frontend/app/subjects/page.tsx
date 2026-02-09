'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Search,
    BookOpen,
    Plus,
    Trash2,
    Loader2,
    XCircle,
    UserCircle2,
    CheckCircle2,
    ShieldCheck,
    GraduationCap,
    Check,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Users
} from 'lucide-react';
import { fetchSubjects, createSubject, deleteSubject, updateSubject, fetchStaff, fetchStudents, assignSubjectsToStudent, assignSubjectsToTeacher, fetchClasses, fetchStreams, assignSubjectsToTeacherWithClasses, getTeacherSubjectAssignments, enrollStudentsToSubject, fetchEnrolledStudentIds } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubjectManagementPage() {
    const { getToken } = useAuth();
    const { userRole, systemUser } = useUserContext();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create Subject Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectClass, setNewSubjectClass] = useState('');
    const [newSubjectStreams, setNewSubjectStreams] = useState<string[]>([]);
    const [selectAllStreams, setSelectAllStreams] = useState(false);
    const [isCompulsory, setIsCompulsory] = useState(true);
    const [newSubjectTeacher, setNewSubjectTeacher] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);

    // Edit Subject Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [applyToAllStreams, setApplyToAllStreams] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    // Assignment States
    const [activeTab, setActiveTab] = useState<'subjects' | 'teachers' | 'students'>('subjects');
    const [staff, setStaff] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // Classes and Streams for dropdowns
    const [classes, setClasses] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);

    // Assignment Selection
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [subjectAssignments, setSubjectAssignments] = useState<Array<{ subject_id: string, class_id: string, stream_id?: string }>>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [modalSubjects, setModalSubjects] = useState<any[]>([]);
    const [assignmentTab, setAssignmentTab] = useState<'available' | 'assigned'>('available');
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [assignmentSearch, setAssignmentSearch] = useState('');

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

    // Tab Loading States
    const [staffLoading, setStaffLoading] = useState(false);
    const [studentsTabLoading, setStudentsTabLoading] = useState(false);

    const isAuthorized = userRole === 'SUPER_ADMIN' ||
        (userRole === 'admin' && (systemUser?.subroles?.includes('timetable_manager') || systemUser?.subroles?.includes('all')));

    useEffect(() => {
        loadData();
        loadClassesAndStreams();
    }, []);

    useEffect(() => {
        if (activeTab === 'teachers') loadStaff();
    }, [activeTab, search]);

    useEffect(() => {
        if (!isCreateModalOpen) {
            setCreateError(null);
        } else {
            // Load staff for the teacher dropdown when modal opens
            loadStaff();
        }
    }, [isCreateModalOpen]);

    useEffect(() => {
        if (!isEditModalOpen) setEditError(null);
    }, [isEditModalOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchSubjects(token);
            setSubjects(data);
        } catch (err) {
            setError('Failed to load subjects.');
        } finally {
            setLoading(false);
        }
    };

    const loadStaff = async () => {
        setStaffLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchStaff(token, search, 'verified');
            const teachingStaff = data.filter((user: any) => {
                if (user.role === 'SUPER_ADMIN' || user.role === 'teacher') return true;
                if (user.role === 'admin') {
                    const subroles = user.subroles || [];
                    return subroles.includes('teacher') || subroles.includes('all');
                }
                return false;
            });
            setStaff(teachingStaff);
        } catch (err) {
            console.error(err);
        } finally {
            setStaffLoading(false);
        }
    };

    const loadClassesAndStreams = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const classesData = await fetchClasses(token);
            setClasses(classesData);
        } catch (err) {
            console.error('Failed to load classes', err);
        }
    };

    const openEnrollModal = async (subject: any) => {
        setEnrollingSubject(subject);
        setIsEnrollModalOpen(true);
        setEnrollModalPage(0);
        setEnrolledStudentIds([]); // Clear while loading
        
        try {
            const token = await getToken();
            if (!token) return;
            const ids = await fetchEnrolledStudentIds(token, subject.id);
            setEnrolledStudentIds(ids);
            loadEnrollmentData(subject, 0);
        } catch (err) {
            console.error(err);
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
            loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to update enrollment');
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName || !newSubjectClass) return;

        setCreateError(null);
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const streamIdsToCreate = selectAllStreams
                ? streams.map(s => s.id)
                : newSubjectStreams.length > 0
                    ? newSubjectStreams
                    : [undefined];

            const promises = streamIdsToCreate.map(streamId =>
                createSubject(token, {
                    name: newSubjectName,
                    is_compulsory: isCompulsory,
                    class_id: newSubjectClass,
                    stream_id: streamId,
                    teacher_id: newSubjectTeacher || undefined
                })
            );

            await Promise.all(promises);

            setNewSubjectName('');
            setNewSubjectClass('');
            setNewSubjectStreams([]);
            setSelectAllStreams(false);
            setNewSubjectTeacher('');
            setIsCompulsory(true);
            setIsCreateModalOpen(false);
            loadData();
        } catch (err: any) {
            // console.error('Failed to create subjects:', err);
            let msg = 'Failed to create subject(s).';
            if (err.message && err.message.includes('409')) {
                msg = 'Subject with this name already exists in this class/stream.';
            } else if (err.message) {
                msg = err.message;
            }
            setCreateError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;

        setEditError(null);
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // Update the primary subject
            await updateSubject(token, editingSubject.id, {
                name: editingSubject.name,
                is_compulsory: editingSubject.is_compulsory,
                class_id: editingSubject.class_id,
                stream_id: editingSubject.stream_id || undefined
            });

            // If Apply to All Streams is checked, find siblings within the same class (using original data) and update them
            if (applyToAllStreams) {
                const originalSubject = subjects.find(s => s.id === editingSubject.id);
                if (originalSubject) {
                    // Find siblings: same class, same original name, different ID
                    const siblings = subjects.filter(s =>
                        s.class_id === originalSubject.class_id &&
                        s.name === originalSubject.name &&
                        s.id !== editingSubject.id
                    );

                    const promises = siblings.map(sibling =>
                        updateSubject(token, sibling.id, {
                            name: editingSubject.name, // Propagate new name
                            is_compulsory: editingSubject.is_compulsory, // Propagate compulsory status
                            class_id: sibling.class_id, // Keep original class
                            stream_id: sibling.stream_id || undefined // Keep original stream
                        })
                    );
                    await Promise.all(promises);
                }
            }

            setEditingSubject(null);
            setApplyToAllStreams(false);
            setIsEditModalOpen(false);
            loadData();
        } catch (err: any) {
            // console.error(err);
            let msg = 'Failed to update subject(s).';
            if (err.message && err.message.includes('409')) {
                msg = 'Subject with this name already exists in this class/stream.';
            } else if (err.message) {
                msg = err.message;
            }
            setEditError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        try {
            const token = await getToken();
            if (!token) return;
            await deleteSubject(token, id);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to delete subject');
        }
    };

    const openAssignModal = async (user: any) => {
        setSelectedUser(user);
        setModalSubjects([]);
        setAssignmentTab('available');
        setIsAssignModalOpen(true);

        if (activeTab === 'students') {
            // For students, just use simple subject IDs
            const subjectIds = user.subjects?.map((s: any) => s.id) || [];
            setSubjectAssignments(subjectIds.map((id: string) => ({ subject_id: id, class_id: '', stream_id: '' })));
        } else {
            // For teachers, load their class-based assignments
            setAssignmentsLoading(true);
            try {
                const token = await getToken();
                if (token) {
                    const [assignments, availableSubjects] = await Promise.all([
                        getTeacherSubjectAssignments(token, user.id),
                        fetchSubjects(token, user.id)
                    ]);
                    setSubjectAssignments(assignments);
                    setModalSubjects(availableSubjects);
                }
            } catch (err) {
                console.error('Failed to load teacher assignments:', err);
                setSubjectAssignments([]);
            } finally {
                setAssignmentsLoading(false);
            }
        }
    };

    const handleAssignSubjects = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            if (activeTab === 'students') {
                const subjectIds = subjectAssignments.map(a => a.subject_id);
                await assignSubjectsToStudent(token, selectedUser.id, subjectIds);
            } else {
                // For teachers, use the new class-based assignment API
                await assignSubjectsToTeacherWithClasses(token, selectedUser.id, subjectAssignments);
            }

            setIsAssignModalOpen(false);
            loadData(); // Ensure subject assignment metadata is updated
            if (activeTab === 'teachers') loadStaff();
        } catch (err: any) {
            setError(err.message || 'Assignment failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <XCircle size={64} className="text-rose-500" />
                <h1 className="text-2xl font-black uppercase">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to manage subjects.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <BookOpen size={14} /> Subject Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Curriculum</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Configure school subjects and assign them to staff & students.</p>
                </div>

                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus size={18} /> Create Subject
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-muted p-1.5 rounded-[1.4rem] border border-border self-start">
                <button onClick={() => setActiveTab('subjects')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'subjects' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                    Subjects List
                </button>
                <button onClick={() => setActiveTab('teachers')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-card text-foreground shadow-lg scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                    Teacher Assignments
                </button>
                <button onClick={() => setActiveTab('students')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'students' ? 'bg-card text-foreground shadow-lg scale-105' : 'text-muted-foreground hover:text-foreground'}`}>
                    Student Selection
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                    <XCircle size={16} /> {error}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card transition-colors">
                {activeTab === 'subjects' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="text-left border-b border-border">
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest">Name</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest">Class</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest">Stream</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest">Students</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest">Type</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-primary" size={48} />
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Loading subjects...</span>
                                        </div>
                                    </td></tr>
                                ) : subjects.length === 0 ? (
                                    <tr><td colSpan={5} className="py-32 text-center text-slate-500 font-bold uppercase tracking-widest">No subjects defined yet</td></tr>
                                ) : subjects.map((subj) => (
                                    <tr key={subj.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                                                    {subj.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-foreground text-sm">{subj.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-xs uppercase text-slate-600 dark:text-slate-400">
                                                {subj.class_name || 'All Classes'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-xs uppercase text-slate-600 dark:text-slate-400">
                                                {subj.stream_name || 'All Streams'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-muted-foreground" />
                                                <span className="font-black text-xs text-foreground">{subj.student_count}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${subj.is_compulsory ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                {subj.is_compulsory ? 'Compulsory' : 'Optional'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right flex justify-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    setEditingSubject({ ...subj });
                                                    if (subj.class_id) {
                                                        const token = await getToken();
                                                        if (token) {
                                                            const s = await fetchStreams(token, subj.class_id);
                                                            setStreams(s);
                                                        }
                                                    } else {
                                                        setStreams([]);
                                                    }
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            >
                                                <Pencil size={20} />
                                            </button>
                                            <button onClick={() => handleDeleteSubject(subj.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'teachers' ? (
                    <div className="p-8 space-y-6">
                        <div className="relative group max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder={`Search teachers...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        {staffLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <span className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Loading teacher data...</span>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground italic">No teachers found.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {staff.map((user) => (
                                    <motion.div key={user.id} whileHover={{ y: -5 }} className="p-6 bg-muted/30 border border-border rounded-3xl space-y-4 hover:border-primary/30 transition-all flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <ShieldCheck size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black tracking-tight text-foreground line-clamp-1">{user.full_name}</h3>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{user.role}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                                                {(user.assigned_subjects || []).length > 0 ? (
                                                    (user.assigned_subjects).map((s: any) => (
                                                        <span key={s.id} className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[8px] font-black uppercase border border-primary/10">{s.name}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] text-muted-foreground italic">No subjects assigned</span>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={() => openAssignModal(user)} className="w-full py-3 bg-card border border-border hover:border-primary/50 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95">
                                            Assign Subjects
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8">
                        {studentsTabLoading ? (
                            <div className="py-32 text-center text-slate-500 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-primary" size={48} />
                                Loading Curriculum...
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="relative group max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search subjects..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-12">
                                    {(() => {
                                        const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
                                        const grouped = filtered.reduce((acc: any, subj) => {
                                            const className = subj.class_name || 'All Classes';
                                            const streamName = subj.stream_name || 'Common / All Streams';
                                            if (!acc[className]) acc[className] = {};
                                            if (!acc[className][streamName]) acc[className][streamName] = [];
                                            acc[className][streamName].push(subj);
                                            return acc;
                                        }, {});

                                        if (filtered.length === 0) return <div className="py-20 text-center text-muted-foreground italic">No subjects found</div>;

                                        return Object.entries(grouped).map(([className, streams]: [string, any]) => (
                                            <div key={className} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground whitespace-nowrap">{className}</h2>
                                                    <div className="h-px w-full bg-border"></div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {Object.entries(streams).map(([streamName, streamSubjects]: [string, any]) => (
                                                        <div key={streamName} className="space-y-3">
                                                            <div className="flex items-center gap-2 px-2">
                                                                <div className="w-1 h-1 rounded-full bg-primary"></div>
                                                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{streamName}</span>
                                                            </div>
                                                            {streamSubjects.map((subj: any) => (
                                                                <motion.div
                                                                    key={subj.id}
                                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                                    onClick={() => openEnrollModal(subj)}
                                                                    className="p-5 bg-muted/20 border border-border rounded-2xl shadow-sm hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                                            {subj.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-foreground text-sm">{subj.name}</h4>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{subj.is_compulsory ? 'Compulsory' : 'Optional'}</p>
                                                                            <span className="text-muted-foreground/30">•</span>
                                                                            <div className="flex items-center gap-1 text-[10px] text-primary font-black">
                                                                                <Users size={10} />
                                                                                {subj.student_count} Enrolled
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-all bg-primary/10 p-2 rounded-lg">
                                                                        <Plus className="text-primary" size={16} />
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Subject Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Plus size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">New Subject</h3>
                                <p className="text-muted-foreground font-medium text-sm">Define a new subject for the curriculum.</p>
                            </div>

                            {createError && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    {createError}
                                </motion.div>
                            )}

                            <form onSubmit={handleAddSubject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject Name</label>
                                    <input
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder="e.g., Mathematics"
                                        className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-black text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Class</label>
                                        <select
                                            value={newSubjectClass}
                                            onChange={async (e) => {
                                                setNewSubjectClass(e.target.value);
                                                setNewSubjectStreams([]); // Reset streams
                                                setSelectAllStreams(false);
                                                if (e.target.value) {
                                                    const token = await getToken();
                                                    if (token) {
                                                        const s = await fetchStreams(token, e.target.value);
                                                        setStreams(s);
                                                    }
                                                } else {
                                                    setStreams([]);
                                                }
                                            }}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Streams</label>
                                        <div className="p-4 rounded-2xl bg-muted border border-border space-y-3 max-h-[200px] overflow-y-auto">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAllStreams}
                                                    onChange={(e) => setSelectAllStreams(e.target.checked)}
                                                    className="w-4 h-4 rounded bg-transparent border-2 border-primary focus:ring-0 focus:ring-offset-0 accent-primary"
                                                    disabled={!newSubjectClass || streams.length === 0}
                                                />
                                                <span className="font-bold text-xs uppercase text-foreground">All Streams</span>
                                            </div>

                                            {!selectAllStreams && (
                                                <div className="pl-2 space-y-2 border-l-2 border-border ml-2">
                                                    {streams.length === 0 ? (
                                                        <p className="text-[10px] text-muted-foreground italic pl-2">Select a class to view streams</p>
                                                    ) : (
                                                        streams.map((s) => (
                                                            <div key={s.id} className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={newSubjectStreams.includes(s.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setNewSubjectStreams([...newSubjectStreams, s.id]);
                                                                        } else {
                                                                            setNewSubjectStreams(newSubjectStreams.filter(id => id !== s.id));
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded bg-transparent border-2 border-current focus:ring-0 focus:ring-offset-0 accent-primary"
                                                                />
                                                                <span className="font-bold text-xs text-foreground">{s.name}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Teacher (Optional)</label>
                                        <select
                                            value={newSubjectTeacher}
                                            onChange={(e) => setNewSubjectTeacher(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">None (Assign later)</option>
                                            {staff.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Compulsory</p>
                                        <p className="text-[9px] text-muted-foreground">Every student must take this subject.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCompulsory(!isCompulsory)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${isCompulsory ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isCompulsory ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 bg-muted text-muted-foreground hover:text-foreground font-black uppercase text-xs tracking-widest rounded-xl transition-all">Cancel</button>
                                    <button disabled={actionLoading} type="submit" className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={16} /> : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Subjects Modal */}
            <AnimatePresence>
                {isAssignModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center border border-primary/20 flex-shrink-0">
                                    <GraduationCap size={32} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight line-clamp-1">{selectedUser.full_name}</h3>
                                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">{activeTab === 'teachers' ? 'Assign Subjects to Teacher' : 'Assign Subjects to Student'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="mb-6">
                                    <h3 className="text-sm font-black uppercase text-muted-foreground mb-3">Select Subjects</h3>

                                    {activeTab === 'teachers' && (
                                        <div className="flex bg-muted/50 p-1 rounded-2xl mb-6 border border-border">
                                            <button
                                                onClick={() => setAssignmentTab('available')}
                                                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    assignmentTab === 'available' 
                                                        ? 'bg-card text-primary shadow-sm ring-1 ring-border' 
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                Unassigned ({modalSubjects.filter(s => !s.assigned_teacher_id).length})
                                            </button>
                                            <button
                                                onClick={() => setAssignmentTab('assigned')}
                                                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    assignmentTab === 'assigned' 
                                                        ? 'bg-card text-primary shadow-sm ring-1 ring-border' 
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                Assigned ({modalSubjects.filter(s => s.assigned_teacher_id === selectedUser?.id).length})
                                            </button>
                                        </div>
                                    )}
                                   
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search subjects..." 
                                            value={assignmentSearch}
                                            onChange={(e) => setAssignmentSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                                        />
                                    </div>

                                    {assignmentsLoading ? (
                                        <div className="h-64 flex flex-col items-center justify-center">
                                            <Loader2 className="animate-spin text-primary mb-4" size={48} />
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Assignments...</p>
                                        </div>
                                    ) : activeTab === 'students' ? (
                                        // Class -> Stream -> Subject Grouping for Students
                                        <div className="space-y-6 max-h-[400px] overflow-y-auto p-1 pr-2">
                                            {(() => {
                                                // Filter first
                                                const filtered = subjects.filter(s => s.name.toLowerCase().includes(assignmentSearch.toLowerCase()));

                                                if (filtered.length === 0) {
                                                    return <p className="text-center text-muted-foreground text-xs p-4 italic">No matching subjects found.</p>;
                                                }

                                                // Group by Class -> Stream
                                                const grouped = filtered.reduce((acc: any, subj) => {
                                                    const className = subj.class_name || 'No Class';
                                                    // For sorting/display, we might want to handle 'Common' differently, but user asked for Stream grouping.
                                                    const streamName = subj.stream_name || 'Common / All Streams';
                                                    
                                                    if (!acc[className]) acc[className] = {};
                                                    if (!acc[className][streamName]) acc[className][streamName] = [];
                                                    
                                                    acc[className][streamName].push(subj);
                                                    return acc;
                                                }, {});

                                                return Object.entries(grouped).map(([className, streams]: [string, any]) => (
                                                    <div key={className} className="space-y-3">
                                                        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 py-2 border-b border-border/50 flex items-center gap-2">
                                                            <div className="h-4 w-1 bg-primary rounded-full"></div>
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{className}</h4>
                                                        </div>
                                                        
                                                        <div className="pl-3 space-y-4 border-l-2 border-border ml-1.5">
                                                            {Object.entries(streams).map(([streamName, streamSubjects]: [string, any]) => (
                                                                <div key={streamName} className="space-y-2">
                                                                    <h5 className="text-[10px] font-bold uppercase text-muted-foreground pl-2 flex items-center gap-2">
                                                                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                                                        {streamName}
                                                                    </h5>
                                                                    <div className="grid grid-cols-2 gap-2 pl-2">
                                                                        {streamSubjects.map((subj: any) => {
                                                                            const isSelected = subjectAssignments.some(a => a.subject_id === subj.id);
                                                                            return (
                                                                                <div
                                                                                    key={subj.id}
                                                                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 border-border text-slate-500 hover:border-primary/30'}`}
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            setSubjectAssignments(subjectAssignments.filter(a => a.subject_id !== subj.id));
                                                                                        } else {
                                                                                            setSubjectAssignments([...subjectAssignments, { subject_id: subj.id, class_id: '', stream_id: '' }]);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                                                                                    <span className="font-bold text-[10px] uppercase flex-1 line-clamp-1">{subj.name}</span>
                                                                                    {isSelected && <CheckCircle2 size={12} />}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    ) : (
                                        // Class/Stream selection for teachers
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1 pr-2">
                                            {(() => {
                                                // Group subjects
                                                const grouped = modalSubjects
                                                    .filter(subj => 
                                                        assignmentTab === 'available' 
                                                            ? !subj.assigned_teacher_id 
                                                            : subj.assigned_teacher_id === selectedUser.id
                                                    )
                                                    .reduce((acc: any, subj) => {
                                                        const name = subj.name;
                                                        if (!acc[name]) acc[name] = [];
                                                        acc[name].push(subj);
                                                        return acc;
                                                    }, {});

                                                // Filter groups
                                                const filteredGroups = Object.entries(grouped).filter(([name]) => 
                                                    (name as string).toLowerCase().includes(assignmentSearch.toLowerCase())
                                                );

                                                if (filteredGroups.length === 0) {
                                                    return <p className="text-center text-muted-foreground text-xs p-4 italic">No matching subjects found.</p>;
                                                }

                                                return filteredGroups.map(([name, groupSubjects]: [string, any]) => (
                                                    <div key={name} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-px flex-1 bg-border/50"></div>
                                                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{name}</span>
                                                            <div className="h-px flex-1 bg-border/50"></div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {groupSubjects.map((subj: any) => {
                                                                const isSelected = subjectAssignments.some(a => a.subject_id === subj.id);
                                                                
                                                                return (
                                                                    <div key={subj.id} className={`border transition-all rounded-xl p-3 flex items-center justify-between group ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border hover:border-primary/20'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-foreground">
                                                                                    {subj.class_name || 'All Classes'}
                                                                                </div>
                                                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                                    {subj.stream_name ? `Stream ${subj.stream_name}` : 'All Streams'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (isSelected) {
                                                                                    setSubjectAssignments(subjectAssignments.filter(a => a.subject_id !== subj.id));
                                                                                } else {
                                                                                    setSubjectAssignments([...subjectAssignments, {
                                                                                        subject_id: subj.id,
                                                                                        class_id: subj.class_id || '',
                                                                                        stream_id: subj.stream_id || undefined
                                                                                    }]);
                                                                                }
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                                                isSelected 
                                                                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                                                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                                            }`}
                                                                        >
                                                                            {isSelected ? 'Remove' : 'Assign'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-muted text-muted-foreground hover:text-foreground font-black uppercase text-xs tracking-widest rounded-xl transition-all">Cancel</button>
                                <button disabled={actionLoading} onClick={handleAssignSubjects} className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                                    {actionLoading ? <Loader2 className="animate-spin text-white" size={16} /> : 'Save Assignments'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Edit Subject Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingSubject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Pencil size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Edit Subject</h3>
                                <p className="text-muted-foreground font-medium text-sm">Update subject details.</p>
                            </div>

                            {editError && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    {editError}
                                </motion.div>
                            )}

                            <form onSubmit={handleUpdateSubject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject Name</label>
                                    <input
                                        type="text"
                                        value={editingSubject.name}
                                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                        placeholder="e.g., Mathematics"
                                        className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-black text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Class</label>
                                        <select
                                            value={editingSubject.class_id}
                                            onChange={async (e) => {
                                                const newClassId = e.target.value;
                                                setEditingSubject({ ...editingSubject, class_id: newClassId, stream_id: '' });
                                                setApplyToAllStreams(false);
                                                if (newClassId) {
                                                    const token = await getToken();
                                                    if (token) {
                                                        const s = await fetchStreams(token, newClassId);
                                                        setStreams(s);
                                                    }
                                                } else {
                                                    setStreams([]);
                                                }
                                            }}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Stream (Optional)</label>
                                        <select
                                            value={editingSubject.stream_id || ''}
                                            onChange={(e) => setEditingSubject({ ...editingSubject, stream_id: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
                                            disabled={!editingSubject.class_id}
                                        >
                                            <option value="">All Streams</option>
                                            {streams.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Compulsory</p>
                                        <p className="text-[9px] text-muted-foreground">Every student must take this subject.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingSubject({ ...editingSubject, is_compulsory: !editingSubject.is_compulsory })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editingSubject.is_compulsory ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingSubject.is_compulsory ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        checked={applyToAllStreams}
                                        onChange={(e) => setApplyToAllStreams(e.target.checked)}
                                        className="w-5 h-5 rounded-md bg-transparent border-2 border-primary focus:ring-0 focus:ring-offset-0 accent-primary"
                                        disabled={subjects.find(s => s.id === editingSubject.id)?.class_id !== editingSubject.class_id}
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Apply to All Streams</p>
                                        <p className="text-[9px] text-muted-foreground">Update all subjects with this name in this class.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-muted text-muted-foreground hover:text-foreground font-black uppercase text-xs tracking-widest rounded-xl transition-all">Cancel</button>
                                    <button disabled={actionLoading} type="submit" className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={16} /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Subject Enrollment Modal (Students) */}
            <AnimatePresence>
                {isEnrollModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEnrollModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-border bg-card p-0 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                            
                            {/* Modal Header */}
                            <div className="p-8 pb-4 border-b border-border bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                                            {enrollingSubject?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{enrollingSubject?.name}</h3>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                                {enrollingSubject?.class_name} <div className="w-1 h-1 rounded-full bg-border"></div> {enrollingSubject?.stream_name || 'All Streams'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEnrollModalOpen(false)} className="p-4 bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-2xl transition-all">
                                        <XCircle size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
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

                            {/* Modal Footer */}
                            <div className="p-8 pt-4 border-t border-border bg-muted/20 space-y-4">
                                {/* Pagination */}
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
