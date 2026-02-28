'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    GraduationCap,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
    Calendar,
    ChevronLeft,
    CheckCircle,
    Lock,
    RefreshCw,
    X
} from 'lucide-react';
import Link from 'next/link';
import { fetchTermExams, createTermExam, deleteTermExam, updateTermExam, batchUpdateTermExams } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExamSettingsPage() {
    const { getToken } = useAuth();
    const { systemUser } = useUserContext();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [term, setTerm] = useState('Term 1');
    const [year, setYear] = useState(new Date().getFullYear());

    // Batch Update Modal State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchTerm, setBatchTerm] = useState('Term 1');
    const [batchYear, setBatchYear] = useState(new Date().getFullYear());
    const [batchStatus, setBatchStatus] = useState('current');
    const [batchLoading, setBatchLoading] = useState(false);

    // const canAccess = systemUser?.role === 'SUPER_ADMIN';
    const canAccess = systemUser?.role === 'SUPER_ADMIN' || (systemUser?.role === 'admin' && systemUser?.subroles?.includes('all'));


    useEffect(() => {
        if (canAccess) {
            loadExams();
        }
    }, [canAccess]);

    const loadExams = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const data = await fetchTermExams(token);
            setExams(data);
        } catch (err: any) {
            setError('Failed to load global exams');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) return;
            await createTermExam(token, { name, term, year });
            setName('');
            await loadExams();
        } catch (err: any) {
            setError(err.message || 'Failed to create exam');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this exam type? This will only remove the template, not existing results.')) return;

        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            await deleteTermExam(token, id);
            await loadExams();
        } catch (err: any) {
            setError('Failed to delete exam');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'current' ? 'completed' : 'current';
        if (!confirm(`Are you sure you want to mark this exam as ${newStatus.toUpperCase()}?`)) return;

        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            await updateTermExam(token, id, { edit_status: newStatus });
            await loadExams();
        } catch (err: any) {
            setError('Failed to update exam status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBatchUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setBatchLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) return;
            await batchUpdateTermExams(token, {
                term: batchTerm,
                year: batchYear,
                edit_status: batchStatus
            });
            setShowBatchModal(false);
            await loadExams();
        } catch (err: any) {
            setError(err.message || 'Failed to batch update exams');
        } finally {
            setBatchLoading(false);
        }
    };

    if (!canAccess) {
        return (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                    <GraduationCap size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Access Denied</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Section restricted to Level 5 Personnel (SUPER_ADMIN)</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link href="/settings" className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
                        <ChevronLeft size={14} /> Back to Settings
                    </Link>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <GraduationCap size={14} /> Global Assessment Protocols
                    </div>
                    <h1 className="text-4xl font-black tracking-tight uppercase">Uniform Exams</h1>
                    <p className="text-slate-400 font-medium tracking-tight">Define standard exam types for institutional uniformity.</p>
                </div>
                <button
                    onClick={() => setShowBatchModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                    <RefreshCw size={14} />
                    Batch Update Status
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 ">
                    <div className="glass-card bg-foreground/5 rounded-3xl border border-foreground/15 overflow-hidden sticky top-8">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h3 className="font-black uppercase tracking-widest text-xs text-primary">Deploy New Protocol</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Exam Name</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Mid-term"
                                    className="w-full bg-background border border-foreground/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Academic Term</label>
                                    <select
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                        className="w-full bg-background border border-foreground/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                                    >
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3">Term 3</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Year</label>
                                    <input
                                        type="number"
                                        required
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        className="w-full bg-background border border-foreground/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                Create Exam
                            </button>
                        </form>
                    </div>
                </div>

                {/* Exam List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between ml-2">
                        <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500 ">Exams</h3>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{exams.length} Identified</span>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-500">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Data...</p>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="h-64 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-400">No Exam Protocols Defined</h4>
                                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-1">Start by creating a standard Institutional exam template</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {Object.entries(
                                exams.reduce((acc: Record<string, any[]>, exam: any) => {
                                    const year = exam.year || 'Unknown Year';
                                    if (!acc[year]) acc[year] = [];
                                    acc[year].push(exam);
                                    return acc;
                                }, {} as Record<string, any[]>)
                            ).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearExams]) => (
                                <div key={year} className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-[1px] flex-1 bg-foreground/10" />
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-secondary bg-secondary/5 px-6 py-3 rounded-full border border-secondary/10">
                                            <Calendar size={14} />
                                            Academic Year {year}
                                        </h4>
                                        <div className="h-[1px] flex-1 bg-foreground/10" />
                                    </div>

                                    <div className="space-y-12">
                                        {Object.entries(
                                            (yearExams as any[]).reduce((acc: Record<string, any[]>, exam: any) => {
                                                const term = exam.term || 'Unknown Term';
                                                if (!acc[term]) acc[term] = [];
                                                acc[term].push(exam);
                                                return acc;
                                            }, {} as Record<string, any[]>)
                                        ).sort(([a], [b]) => b.localeCompare(a)).map(([term, termExams]) => (
                                            <div key={term} className="space-y-4">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {term}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(termExams as any[]).map((exam: any) => (
                                                        <div key={exam.id} className="glass-card p-6 rounded-3xl border border-foreground/15 hover:border-primary/30 transition-all group relative">
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-3">
                                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                                        <GraduationCap size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                                                            {exam.name}
                                                                            {exam.edit_status === 'completed' && (
                                                                                <span className="flex items-center gap-1 text-[8px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20">
                                                                                    <Lock size={10} />
                                                                                    Completed
                                                                                </span>
                                                                            )}
                                                                            {(!exam.edit_status || exam.edit_status === 'current') && (
                                                                                <span className="flex items-center gap-1 text-[8px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                                    <CheckCircle size={10} />
                                                                                    Current
                                                                                </span>
                                                                            )}
                                                                        </h4>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDelete(exam.id)}
                                                                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center justify-between">
                                                                <button
                                                                    onClick={() => handleToggleStatus(exam.id, exam.edit_status || 'current')}
                                                                    disabled={actionLoading}
                                                                    className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors disabled:opacity-50"
                                                                >
                                                                    Change Status
                                                                </button>
                                                                <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest"></span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                            <AlertCircle size={16} />
                            <span className="font-black uppercase tracking-widest text-[10px]">Administrative Note</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                            These protocols become available to all teachers when creating new subject assessments. Completed exams cannot be graded to prevent modifying historical records. Deleting a protocol removes it from future selection but does not impact historical data.
                        </p>
                    </div>
                </div>
            </div>

            {/* Batch Update Modal */}
            <AnimatePresence>
                {showBatchModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBatchModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-8"
                        >
                            <button
                                onClick={() => setShowBatchModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6 space-y-2 text-center">
                                <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <RefreshCw size={28} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Batch Update</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Update the status of all exams for a specific term and year.</p>
                            </div>

                            <form onSubmit={handleBatchUpdate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Term</label>
                                        <select
                                            value={batchTerm}
                                            onChange={(e) => setBatchTerm(e.target.value)}
                                            className="w-full border border-foreground/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                        >
                                            <option value="Term 1">Term 1</option>
                                            <option value="Term 2">Term 2</option>
                                            <option value="Term 3">Term 3</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Year</label>
                                        <input
                                            type="number"
                                            required
                                            value={batchYear}
                                            onChange={(e) => setBatchYear(parseInt(e.target.value))}
                                            className="w-full bg-white/5 border border-foreground/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Status</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all ${batchStatus === 'current' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-foreground/15 bg-white/5 text-slate-400'}`}>
                                            <input type="radio" name="status" value="current" checked={batchStatus === 'current'} onChange={(e) => setBatchStatus(e.target.value)} className="hidden" />
                                            <CheckCircle size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Current</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all ${batchStatus === 'completed' ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-foreground/15 bg-white/5 text-slate-400'}`}>
                                            <input type="radio" name="status" value="completed" checked={batchStatus === 'completed'} onChange={(e) => setBatchStatus(e.target.value)} className="hidden" />
                                            <Lock size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Completed</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={batchLoading}
                                    className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-50 mt-4"
                                >
                                    {batchLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                    Apply Updates
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
