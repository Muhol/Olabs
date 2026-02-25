'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, CheckCircle2, Layout } from 'lucide-react';
import { fetchSubjectRubrics, bulkCreateRubrics } from '@/lib/api';

interface CompetencyRubricConfigProps {
    subjectId: string;
    subject: any;
    competencies: any[];
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
}

export default function CompetencyRubricConfig({
    subjectId,
    subject,
    competencies,
    tokenGetter,
    onClose
}: CompetencyRubricConfigProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [descriptors, setDescriptors] = useState<Record<string, {
        ee: string;
        me: string;
        ae: string;
        be: string;
    }>>({});

    useEffect(() => {
        loadExistingRubric();
    }, [subjectId]);

    const loadExistingRubric = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            const rubrics = await fetchSubjectRubrics(token, subjectId);

            if (rubrics && rubrics.length > 0) {
                const newDescriptors: any = {};
                rubrics.forEach((r: any) => {
                    const compId = r.competency_id;
                    const level = r.performance_level.toLowerCase();
                    if (!newDescriptors[compId]) {
                        newDescriptors[compId] = { ee: '', me: '', ae: '', be: '' };
                    }
                    newDescriptors[compId][level] = r.descriptor || '';
                });
                setDescriptors(newDescriptors);
            }
        } catch (err) {
            console.error('Failed to load rubric:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            const rubricData: { competency_id: string; performance_level: string; descriptor: string }[] = [];
            for (const compId in descriptors) {
                const levels = ['EE', 'ME', 'AE', 'BE'];
                levels.forEach(level => {
                    const desc = (descriptors[compId] as any)[level.toLowerCase()];
                    if (desc) {
                        rubricData.push({
                            competency_id: compId,
                            performance_level: level,
                            descriptor: desc
                        });
                    }
                });
            }

            if (rubricData.length === 0) {
                throw new Error("Please enter at least one descriptor.");
            }

            await bulkCreateRubrics(token, rubricData);
            setSuccess('Rubric saved successfully!');
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to save rubric.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateDescriptor = (compId: string, level: 'ee' | 'me' | 'ae' | 'be', val: string) => {
        setDescriptors(prev => ({
            ...prev,
            [compId]: {
                ...prev[compId],
                [level]: val
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[85vh] bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-border bg-muted/20 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <Layout size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">Rubric Configuration</h3>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">{subject?.subject_name} • Define Success Criteria</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Syncing Framework...</p>
                        </div>
                    ) : (
                        competencies.map((comp) => (
                            <div key={comp.id} className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-black">
                                        {comp.name.charAt(0)}
                                    </div>
                                    <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{comp.name}</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'ee', label: 'EE (Exceeding Expectations)', color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                                        { id: 'me', label: 'ME (Meeting Expectations)', color: 'text-indigo-600', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
                                        { id: 'ae', label: 'AE (Approaching Expectations)', color: 'text-amber-600', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
                                        { id: 'be', label: 'BE (Below Expectations)', color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-500/20' }
                                    ].map((level) => (
                                        <div key={level.id} className={`${level.bg} ${level.border} border p-5 rounded-[2rem] space-y-3`}>
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${level.color}`}>
                                                {level.label}
                                            </label>
                                            <textarea
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 min-h-[80px] text-foreground/80 placeholder:text-muted-foreground/30 resize-none"
                                                placeholder="Describe achievement criteria..."
                                                value={descriptors[comp.id]?.[level.id as keyof typeof descriptors[string]] || ''}
                                                onChange={(e) => updateDescriptor(comp.id, level.id as any, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 animate-in slide-in-from-left duration-300">
                                <AlertCircle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-emerald-500 animate-in slide-in-from-left duration-300">
                                <CheckCircle2 size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{success}</span>
                            </div>
                        )}
                        {!error && !success && (
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-50">
                                Tip: These criteria will be visible to students on their report cards.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-3xl bg-muted text-muted-foreground text-xs font-black uppercase tracking-widest hover:bg-muted/80 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="flex items-center gap-3 px-10 py-4 rounded-3xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {submitting ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Save size={16} />
                            )}
                            {submitting ? 'Saving Framework...' : 'Establish Rubric'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
