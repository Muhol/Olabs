'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Check,
    Loader2,
    BookOpen,
    Save,
    PlusCircle,
    Info,
    Plus,
    Trash2,
    Award
} from 'lucide-react';
import { updateExamCompetencies, createCompetencyWithRubrics } from '@/lib/api';

interface EditExamCompetenciesModalProps {
    exam: any;
    subjectId: string;
    allCompetencies: any[];
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    onSuccess: () => void;
}

interface NewCompetency {
    name: string;
    description: string;
    rubrics: {
        performance_level: 'EE' | 'ME' | 'AE' | 'BE';
        descriptor: string;
    }[];
}

export default function EditExamCompetenciesModal({
    exam,
    subjectId,
    allCompetencies,
    tokenGetter,
    onClose,
    onSuccess
}: EditExamCompetenciesModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(
        exam.competencies ? exam.competencies.map((c: any) => c.id) : []
    );
    const [newCompetencies, setNewCompetencies] = useState<NewCompetency[]>([]);

    const toggleCompetency = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const addNewCompField = () => {
        setNewCompetencies(prev => [...prev, {
            name: '',
            description: '',
            rubrics: [
                { performance_level: 'EE', descriptor: '' },
                { performance_level: 'ME', descriptor: '' },
                { performance_level: 'AE', descriptor: '' },
                { performance_level: 'BE', descriptor: '' }
            ]
        }]);
    };

    const removeNewCompField = (index: number) => {
        setNewCompetencies(prev => prev.filter((_, i) => i !== index));
    };

    const updateNewComp = (index: number, field: keyof NewCompetency, value: any) => {
        setNewCompetencies(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const updateRubric = (compIndex: number, rubricIndex: number, descriptor: string) => {
        setNewCompetencies(prev => {
            const next = [...prev];
            const nextRubrics = [...next[compIndex].rubrics];
            nextRubrics[rubricIndex] = { ...nextRubrics[rubricIndex], descriptor };
            next[compIndex] = { ...next[compIndex], rubrics: nextRubrics };
            return next;
        });
    };

    const handleSave = async () => {
        if (selectedIds.length === 0 && newCompetencies.length === 0) {
            setError('Please link at least one competency.');
            return;
        }

        // Validate new competencies
        for (const comp of newCompetencies) {
            if (!comp.name.trim()) {
                setError('New competencies must have a name.');
                return;
            }
        }

        setSubmitting(true);
        setError('');

        try {
            const token = await tokenGetter();
            if (!token) throw new Error('Not authenticated');

            // 1. Create new competencies if any
            const newlyCreatedIds: string[] = [];
            for (const comp of newCompetencies) {
                const created = await createCompetencyWithRubrics(token, {
                    ...comp,
                    subject_id: subjectId
                });
                newlyCreatedIds.push(created.id);
            }

            // 2. Update Exam Linkages
            const finalCompIds = [...selectedIds, ...newlyCreatedIds];
            await updateExamCompetencies(token, exam.id, finalCompIds);

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update competencies');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[85vh] bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-border bg-muted/20 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-3 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter ">Edit Competencies</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            Linking for: {exam.name} ({exam.term} {exam.year})
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                    {/* Existing Competencies */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={16} className="text-primary" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Adjust Subject Competencies</h4>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {allCompetencies.map(comp => (
                                <button
                                    key={comp.id}
                                    onClick={() => toggleCompetency(comp.id)}
                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${selectedIds.includes(comp.id)
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                >
                                    {selectedIds.includes(comp.id) ? <Check size={14} /> : <PlusCircle size={14} />}
                                    {comp.name}
                                </button>
                            ))}
                            {allCompetencies.length === 0 && (
                                <div className="text-[10px] font-black text-muted-foreground italic p-10 bg-muted/10 rounded-[2rem] border border-dashed border-border w-full text-center">
                                    No existing competencies found for this subject.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* New Competencies Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award size={16} className="text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Add New Competencies</h4>
                            </div>
                            <button
                                onClick={addNewCompField}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                            >
                                <Plus size={14} />
                                Create Competency
                            </button>
                        </div>

                        <div className="space-y-8">
                            {newCompetencies.map((comp, cIndex) => (
                                <div key={cIndex} className="p-8 bg-muted/30 border border-border rounded-[2rem] space-y-6 relative group">
                                    <button
                                        onClick={() => removeNewCompField(cIndex)}
                                        className="absolute top-6 right-6 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Competency Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Critical Thinking"
                                                value={comp.name}
                                                onChange={e => updateNewComp(cIndex, 'name', e.target.value)}
                                                className="w-full px-5 py-3 bg-background border border-border rounded-xl text-xs font-black outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Briefly describe what's being evaluated"
                                                value={comp.description}
                                                onChange={e => updateNewComp(cIndex, 'description', e.target.value)}
                                                className="w-full px-5 py-3 bg-background border border-border rounded-xl text-xs font-black outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-primary italic">Rubric Descriptors</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {comp.rubrics.map((rubric, rIndex) => (
                                                <div key={rubric.performance_level} className="space-y-2">
                                                    <div className="flex items-center justify-between ml-2">
                                                        <span className="text-[9px] font-black text-foreground">{rubric.performance_level}</span>
                                                        <span className="text-[7px] font-bold text-muted-foreground uppercase">
                                                            {rubric.performance_level === 'EE' && 'Exceeding'}
                                                            {rubric.performance_level === 'ME' && 'Meeting'}
                                                            {rubric.performance_level === 'AE' && 'Approaching'}
                                                            {rubric.performance_level === 'BE' && 'Below'}
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        placeholder={`Descriptor for ${rubric.performance_level}`}
                                                        value={rubric.descriptor}
                                                        onChange={e => updateRubric(cIndex, rIndex, e.target.value)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-[10px] font-medium outline-none focus:border-primary transition-all resize-none h-20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div>
                        {error && (
                            <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight bg-rose-500/10 px-4 py-2 rounded-lg">
                                {error}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-xl hover:bg-muted/80 transition-all font-black"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="px-8 py-3 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Update Linkages
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
