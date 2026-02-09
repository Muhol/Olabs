'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    FileText,
    Loader2,
    Plus,
    Calendar,
    CloudUpload,
    X,
    ChevronDown,
    ChevronRight,
    Search,
    Download,
    Trash2,
    BookOpen,
    Building2,
    Layers,
    Clock,
    CheckCircle2,
    Paperclip
} from 'lucide-react';
import { fetchAssignments, createAssignment, deleteAssignment, getTeacherSubjectAssignments } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function TeacherAssignmentsPage() {
    const { getToken } = useAuth();
    const { systemUser, userRole } = useUserContext();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        due_date: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    useEffect(() => {
        if (systemUser) {
            loadData();
        }
    }, [systemUser]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token || !systemUser) return;

            // 1. Fetch teacher's subject assignments
            const subjectData = await getTeacherSubjectAssignments(token, systemUser.id);
            setSubjects(subjectData);

            // 2. Fetch all assignments created by this teacher
            const assignmentData = await fetchAssignments(token, systemUser.id);
            setAssignments(assignmentData);

            // Auto-expand the first category if exists
            if (subjectData.length > 0) {
                const firstCat = `${subjectData[0].class_name}`;
                setExpandedCategories([firstCat]);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !newAssignment.title) return;

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) return;

            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('subject_id', selectedSubject.subject_id);
            if (newAssignment.due_date) {
                formData.append('due_date', new Date(newAssignment.due_date).toISOString());
            }
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            await createAssignment(token, formData);

            setNewAssignment({ title: '', description: '', due_date: '' });
            setSelectedFile(null);
            setIsCreateModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Failed to create assignment:', err);
            alert('Failed to create assignment. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;

        try {
            const token = await getToken();
            if (!token) return;
            await deleteAssignment(token, id);
            loadData();
        } catch (err) {
            console.error('Failed to delete assignment:', err);
        }
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    // Group subjects by Class -> Stream
    const groupedSubjects = subjects.reduce((acc: any, sub: any) => {
        const classKey = sub.class_name;
        if (!acc[classKey]) acc[classKey] = {};

        const streamKey = sub.stream_name || 'General';
        if (!acc[classKey][streamKey]) acc[classKey][streamKey] = [];

        acc[classKey][streamKey].push(sub);
        return acc;
    }, {});

    if (loading && subjects.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Assignment Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <FileText size={14} /> Assignment Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
                        My Assignments
                    </h1>
                    <p className="text-muted-foreground font-medium tracking-tight">
                        Create and manage curriculum tasks for your assigned subjects.
                    </p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" size={18} />
                    <input
                        type="text"
                        placeholder="Search subjects or titles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadData()}
                        className="w-full pl-12 pr-32 py-4 rounded-2xl bg-card border border-border text-foreground font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                    />
                    <button
                        onClick={loadData}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <Search size={14} /> Search
                    </button>
                </div>
            </div>

            {subjects.length === 0 ? (
                <div className="p-20 text-center glass-card rounded-[3rem] border border-dashed border-border">
                    <BookOpen size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                    <h3 className="text-xl font-black text-foreground uppercase mb-2">No Subject Assignments</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                        You haven't been assigned to teach any subjects yet. Contact an administrator to receive subject assignments.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedSubjects).map(([className, streams]: [string, any]) => (
                        <div key={className} className="space-y-4">
                            <button
                                onClick={() => toggleCategory(className)}
                                className="w-full flex items-center justify-between p-6 glass-card rounded-3xl border border-border bg-muted/30 hover:bg-muted/50 transition-all font-black uppercase tracking-tight text-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Building2 size={24} className="text-primary" />
                                    {className}
                                </div>
                                {expandedCategories.includes(className) ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                            </button>

                            <AnimatePresence>
                                {expandedCategories.includes(className) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-4 space-y-6"
                                    >
                                        {Object.entries(streams).map(([streamName, subjects]: [string, any]) => (
                                            <div key={streamName} className="space-y-4">
                                                <div className="flex items-center gap-2 px-2">
                                                    <Layers size={14} className="text-slate-400" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">{streamName} Stream</span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {subjects.map((sub: any) => {
                                                        const subjectAssignments = assignments.filter(a => a.subject_id === sub.subject_id);
                                                        return (
                                                            <div key={`${sub.subject_id}-${sub.class_id}`} className="glass-card rounded-[1.5rem] border border-border bg-card p-5 flex flex-col shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />

                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 font-black text-lg">
                                                                        {sub.subject_name.charAt(0)}
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-border">
                                                                        {subjectAssignments.length} Tasks
                                                                    </span>
                                                                </div>

                                                                <h3 className="text-base font-black text-foreground uppercase mb-1 line-clamp-1 group-hover:text-primary transition-colors">{sub.subject_name}</h3>

                                                                <div className="space-y-2 mb-4">
                                                                    {subjectAssignments.slice(0, 2).map((a) => (
                                                                        <div key={a.id} className="flex items-center justify-between group/item">
                                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                                <span className="text-xs font-bold truncate text-muted-foreground">{a.title}</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleDelete(a.id)}
                                                                                className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {subjectAssignments.length > 2 && (
                                                                        <p className="text-[9px] font-bold text-slate-400 italic">+{subjectAssignments.length - 2} more...</p>
                                                                    )}
                                                                    {subjectAssignments.length === 0 && (
                                                                        <p className="text-[10px] font-medium text-slate-400 italic">No tasks created yet.</p>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedSubject(sub);
                                                                        setIsCreateModalOpen(true);
                                                                    }}
                                                                    className="mt-auto w-full py-2.5 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                                >
                                                                    <Plus size={16} /> Add Assignment
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Assignment Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl glass-card rounded-[2.5rem] border border-border bg-card p-0 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                        >
                            <form onSubmit={handleCreateAssignment} className="flex flex-col h-full">
                                <div className="p-8 pb-4 border-b border-border bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                                                <Plus size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">New Assignment</h3>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                                    {selectedSubject?.subject_name} <div className="w-1 h-1 rounded-full bg-border"></div> {selectedSubject?.class_name} ({selectedSubject?.stream_name || 'All'})
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-4 bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-2xl transition-all">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Title</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. Unit 3 Review Questions"
                                            value={newAssignment.title}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-card border border-border text-foreground font-bold focus:border-primary outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Instructions / Description</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Provide detailed instructions for the students..."
                                            value={newAssignment.description}
                                            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-card border border-border text-foreground font-bold focus:border-primary outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Due Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    type="datetime-local"
                                                    value={newAssignment.due_date}
                                                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-card border border-border text-foreground font-bold focus:border-primary outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Resources</label>
                                            <label className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-secondary/5 border border-dashed border-secondary/30 text-secondary cursor-pointer hover:bg-secondary/10 transition-all font-bold text-sm">
                                                <CloudUpload size={20} />
                                                {selectedFile ? <span className="truncate max-w-[120px]">{selectedFile.name}</span> : 'Attach File'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pt-4 border-t border-border bg-muted/20">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-primary text-white rounded-3xl font-black uppercase text-sm tracking-[.25em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                        {isSubmitting ? 'Uploading to Cloudinary...' : 'Broadcast Assignment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assignment List for Selected Subjects (Bottom Section or Modal) */}
            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4 px-2">
                    <Clock size={20} className="text-primary" />
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Recent Activity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.length === 0 ? (
                        <div className="col-span-full py-12 text-center glass-card rounded-[2rem] border border-dashed border-border text-muted-foreground font-bold italic">
                            No assignments broadcasted recently.
                        </div>
                    ) : (
                        assignments.slice(0, 6).map((a) => (
                            <div key={a.id} className="glass-card p-6 rounded-[2rem] border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                        {a.subject_name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                        {format(new Date(a.created_at), 'MMM dd')}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-lg font-black text-foreground truncate">{a.title}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{a.description || 'No description provided.'}</p>
                                </div>

                                <div className="flex items-center justify-between mt-autp pt-4 border-t border-border">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                        <Calendar size={12} />
                                        Due {a.due_date ? format(new Date(a.due_date), 'MMM dd, HH:mm') : 'No Limit'}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {a.file_url && (
                                            <a
                                                href={a.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download={a.file_name || 'assignment-file'}
                                                className="flex items-center gap-2 px-3 py-2 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                                title={a.file_name}
                                            >
                                                <Download size={14} />
                                                Download
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
