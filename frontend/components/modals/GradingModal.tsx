'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Calendar,
    Award,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Save,
    TrendingUp,
    FileText,
    Zap
} from 'lucide-react';
import {
    createCompetencyAssessment,
    createSubjectSummary,
    createExamResult,
    fetchSubjectExams,
    recalculateSubjectSummaries,
    fetchTermExams,
} from '@/lib/api';

interface GradingModalProps {
    student: any;
    subject: any;
    subjectId: string;
    competencies: any[];
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function GradingModal({
    student,
    subject,
    subjectId,
    competencies,
    tokenGetter,
    onClose,
    onSuccess
}: GradingModalProps) {
    const [gradingType, setGradingType] = useState<'competency' | 'summary' | 'exam'>('competency');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form State
    const [term, setTerm] = useState('');
    const [year, setYear] = useState(0);
    const [availableTerms, setAvailableTerms] = useState<any[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [performanceLevel, setPerformanceLevel] = useState('ME');
    const [remarks, setRemarks] = useState('');
    const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>(
        competencies.length > 0 ? competencies[0].id : ''
    );
    const [examType, setExamType] = useState('Mid-term'); // Legacy string
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [exams, setExams] = useState<any[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [marks, setMarks] = useState<number>(0);
    const [overallPerformance, setOverallPerformance] = useState('ME');
    const [teacherComment, setTeacherComment] = useState('');

    useEffect(() => {
        const initDefaults = async () => {
            try {
                const token = await tokenGetter();
                if (!token) return;
                const terms = await fetchTermExams(token);
                setAvailableTerms(terms);
                await loadExams();
            } catch (err) {
                console.error("Failed to load global terms", err);
            }
        };
        initDefaults();
    }, [tokenGetter]);

    useEffect(() => {
        if (!isFirstLoad && term && year && subjectId) {
            loadExams();
        }
    }, [term, year, subjectId]);

    const loadExams = async () => {
        setLoadingExams(true);
        try {
            const token = await tokenGetter();
            if (!token) return;

            // Call API with optional term/year. Backend provides defaults if missing.
            const data = await fetchSubjectExams(token, subjectId, term || undefined, year || 0);

            // Sync term and year if this is the first load
            if (isFirstLoad && data.length > 0) {
                const first = data[0].term_exam;
                if (first) {
                    setTerm(first.term);
                    setYear(first.year);
                }
                setIsFirstLoad(false);
            }

            setExams(data);
            if (data.length > 0) {
                setSelectedExamId(data[0].id);
                setExamType(data[0].name);
            }
        } catch (err) {
            console.error('Failed to load exams:', err);
        } finally {
            setLoadingExams(false);
        }
    };



    const isReadOnly = (() => {
        if (gradingType === 'summary') {
            // Read-only if ANY exam in this term is completed OR if no exams (can't determine, assume not read-only for now)
            return exams.some(e => e.term_exam?.edit_status === 'completed');
        }
        const activeExam = exams.find(e => e.id === selectedExamId);
        return activeExam?.term_exam?.edit_status === 'completed';
    })();

    const levels = [
        { id: 'EE', name: 'Exceeding', color: 'bg-emerald-500', text: 'text-emerald-500' },
        { id: 'ME', name: 'Meeting', color: 'bg-blue-500', text: 'text-blue-500' },
        { id: 'AE', name: 'Approaching', color: 'bg-amber-500', text: 'text-amber-500' },
        { id: 'BE', name: 'Below', color: 'bg-rose-500', text: 'text-rose-500' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = await tokenGetter();
            if (!token) return;

            if (gradingType === 'competency') {
                if (!selectedExamId) throw new Error('Please select an exam to link this assessment to.');
                await createCompetencyAssessment(token, {
                    student_id: student.id,
                    subject_id: subjectId,
                    competency_id: selectedCompetencyId,
                    exam_id: selectedExamId,
                    term,
                    year,
                    performance_level: performanceLevel,
                    remarks
                });
            } else if (gradingType === 'summary') {
                await createSubjectSummary(token, {
                    student_id: student.id,
                    subject_id: subjectId,
                    term,
                    year,
                    overall_performance: overallPerformance,
                    teacher_comment: teacherComment
                });
            } else if (gradingType === 'exam') {
                if (!selectedExamId) throw new Error('Please select an exam.');
                await createExamResult(token, {
                    student_id: student.id,
                    subject_id: subjectId,
                    term,
                    year,
                    exam_id: selectedExamId,
                    marks,
                    performance_level: performanceLevel,
                    remarks
                });
                // Auto-recalculate the subject term summary after saving an exam result
                try {
                    await recalculateSubjectSummaries(token, subjectId, term, year);
                } catch (calcErr) {
                    console.warn('Summary auto-calculation skipped:', calcErr);
                }
            }

            setSuccess('Result committed successfully');
            if (onSuccess) onSuccess();
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to submit grading.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/70"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Compact Header */}
                <div className="p-6 border-b border-border bg-muted/20 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground md:top-6 md:right-6"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center text-lg font-black shadow-lg shadow-primary/20">
                            {student.full_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{student.full_name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{subject?.subject_name} • ADM: {student.admission_number}</p>
                        </div>
                    </div>
                </div>

                {/* Sub-tabs for Grading Types */}
                <div className="px-6 py-3 bg-muted/10 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'competency', label: 'Competency', icon: Award },
                        { id: 'exam', label: 'Exam Result', icon: TrendingUp },
                        { id: 'summary', label: 'Final Summary', icon: FileText }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setGradingType(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${gradingType === tab.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Compact Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Common Context Fields */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Term</label>
                            <select
                                value={term}
                                onChange={e => setTerm(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                            >
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Year</label>
                            <select
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                            >
                                {Array.from(new Set(availableTerms.map(t => t.year))).sort((a, b) => b - a).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                                {(!availableTerms.some(t => t.year === year) && year !== 0) && (
                                    <option value={year}>{year}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {isReadOnly && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-500">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Read Only - Exam is marked as COMPLETED</span>
                        </div>
                    )}

                    {/* Dynamic Sections based on type */}
                    {gradingType === 'competency' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Target Competency</label>
                                <select
                                    value={selectedCompetencyId}
                                    onChange={e => setSelectedCompetencyId(e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary disabled:opacity-50"
                                >
                                    {competencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    {competencies.length === 0 && <option disabled>No competencies linked</option>}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Evidence Source (Exam)</label>
                                <select
                                    value={selectedExamId}
                                    onChange={e => setSelectedExamId(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                                >
                                    {exams.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                                    ))}
                                    {exams.length === 0 && !loadingExams && <option disabled>No exams found for this term</option>}
                                    {loadingExams && <option disabled>Loading exams...</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Performance Level</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {levels.map(lvl => (
                                        <button
                                            key={lvl.id}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setPerformanceLevel(lvl.id)}
                                            className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${performanceLevel === lvl.id
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-border bg-muted/20 hover:border-slate-300'
                                                } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className={`text-base font-black ${performanceLevel === lvl.id ? 'text-primary' : 'text-muted-foreground'}`}>{lvl.id}</span>
                                            <span className="text-[7px] font-black uppercase tracking-tight text-muted-foreground/60">{lvl.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary h-20 resize-none disabled:opacity-50"
                                    placeholder="Evidence of competency..."
                                />
                            </div>
                        </div>
                    )}

                    {gradingType === 'exam' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Selected Exam</label>
                                    <select
                                        value={selectedExamId}
                                        onChange={e => {
                                            setSelectedExamId(e.target.value);
                                            const exam = exams.find(ex => ex.id === e.target.value);
                                            if (exam) setExamType(exam.name);
                                        }}
                                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold"
                                    >
                                        {exams.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                                        ))}
                                        {exams.length === 0 && !loadingExams && <option disabled>No exams found for this term</option>}
                                        {loadingExams && <option disabled>Loading exams...</option>}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Score (100%)</label>
                                    <input
                                        type="number"
                                        value={marks}
                                        onChange={e => setMarks(Number(e.target.value))}
                                        disabled={isReadOnly}
                                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Equated performance</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {levels.map(lvl => (
                                        <button
                                            key={lvl.id}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setPerformanceLevel(lvl.id)}
                                            className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${performanceLevel === lvl.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border bg-muted/20'
                                                } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className={`text-base font-black ${performanceLevel === lvl.id ? 'text-primary' : 'text-muted-foreground'}`}>{lvl.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {gradingType === 'summary' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Overall Term Result</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {levels.map(lvl => (
                                        <button
                                            key={lvl.id}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setOverallPerformance(lvl.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${overallPerformance === lvl.id
                                                ? 'border-primary bg-primary/5 shadow-inner'
                                                : 'border-border bg-muted/20'
                                                } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg ${lvl.color} flex items-center justify-center text-white font-black text-[10px]`}>
                                                {lvl.id}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{lvl.name}</span>
                                            {overallPerformance === lvl.id && <Zap size={10} className="text-primary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Summative Comments</label>
                                <textarea
                                    value={teacherComment}
                                    onChange={e => setTeacherComment(e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary h-24 resize-none disabled:opacity-50"
                                    placeholder="Brief summative report..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Messages & Actions */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-rose-500/10 border border-border rounded-xl flex items-center gap-2 text-rose-500">
                                <AlertCircle size={14} />
                                <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-emerald-500/10 border border-border rounded-xl flex items-center gap-2 text-emerald-500">
                                <CheckCircle2 size={14} />
                                <p className="text-[10px] font-black uppercase tracking-tight">{success}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isReadOnly && (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Commit Results
                        </button>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
