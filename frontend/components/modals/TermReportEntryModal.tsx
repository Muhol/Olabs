'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Brain,
    Heart,
    Calendar,
    MessageSquare,
    User,
    Settings2
} from 'lucide-react';
import { fetchFullReportCard, saveTermReport, fetchReportItems, fetchTermExams, fetchPreferredTerm } from '@/lib/api';

interface ReportItem {
    id: string;
    name: string;
    type: 'competency' | 'value';
    description?: string;
    order: number;
}

interface TermReportEntryModalProps {
    studentId: string;
    studentName: string;
    term: string;
    year: number;
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    onSuccess?: () => void;
}

const CBC_LEVELS = [
    { code: 'EE', color: 'bg-emerald-500', hover: 'hover:bg-emerald-500' },
    { code: 'ME', color: 'bg-secondary', hover: 'hover:bg-secondary' },
    { code: 'AE', color: 'bg-amber-500', hover: 'hover:bg-amber-500' },
    { code: 'BE', color: 'bg-rose-500', hover: 'hover:bg-rose-500' }
];

export default function TermReportEntryModal({
    studentId,
    studentName,
    term,
    year,
    tokenGetter,
    onClose,
    onSuccess
}: TermReportEntryModalProps) {
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | undefined>();
    const [availableTerms, setAvailableTerms] = useState<any[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [competencies, setCompetencies] = useState<ReportItem[]>([]);
    const [values, setValues] = useState<ReportItem[]>([]);
    const [entries, setEntries] = useState<Record<string, string | null>>({});
    const [attendance, setAttendance] = useState({ total_days: 60, present_days: 60 });
    const [teacherComment, setTeacherComment] = useState('');
    const [existingReportId, setExistingReportId] = useState<string | null>(null);

    useEffect(() => {
        const initDefaults = async () => {
            try {
                const token = await tokenGetter();
                if (!token) return;

                // Just fetch available terms for the filter dropdown
                const terms = await fetchTermExams(token);
                setAvailableTerms(terms);
            } catch (err) {
                console.error("Failed to load global terms", err);
            }
        };
        initDefaults();
        load(); // Trigger initial load with defaults
    }, [tokenGetter]);

    useEffect(() => {
        if (!isFirstLoad && selectedTerm && selectedYear) {
            load();
        }
    }, [selectedTerm, selectedYear]);

    const isEditable = availableTerms.find(e => e.term === selectedTerm && e.year === selectedYear)?.edit_status === 'current';

    const load = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;

            // Load all report items and existing report in parallel
            // If selectedTerm/Year are missing, backend uses defaults
            const [itemsAll, reportData] = await Promise.all([
                fetchReportItems(token),
                fetchFullReportCard(token, studentId, selectedTerm || undefined, selectedYear)
            ]);

            // Sync filter state with actual data returned by backend if first load
            if (isFirstLoad) {
                setSelectedTerm(reportData.term);
                setSelectedYear(reportData.year);
                setIsFirstLoad(false);
            }

            const comps = itemsAll.filter((i: ReportItem) => i.type === 'competency');
            const vals = itemsAll.filter((i: ReportItem) => i.type === 'value');
            setCompetencies(comps);
            setValues(vals);

            if (reportData.term_report) {
                const report = reportData.term_report;
                setExistingReportId(report.id);
                setAttendance({ total_days: report.total_days ?? 60, present_days: report.present_days ?? 60 });
                setTeacherComment(report.teacher_comment ?? '');
                // Build entry map from existing entries
                const entryMap: Record<string, string | null> = {};
                (report.entries || []).forEach((e: any) => {
                    entryMap[e.item_id] = e.level;
                });
                setEntries(entryMap);
            } else {
                // Reset states if no report exists for the selected term/year
                setExistingReportId(null);
                setAttendance({ total_days: 60, present_days: 60 });
                setTeacherComment('');
                setEntries({});
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const setLevel = (itemId: string, level: string) => {
        if (!isEditable) return;
        setEntries(prev => ({
            ...prev,
            [itemId]: prev[itemId] === level ? null : level  // toggle off if same
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            const entryList = Object.entries(entries)
                .filter(([, level]) => level !== null)
                .map(([item_id, level]) => ({ item_id, level }));

            await saveTermReport(token, {
                student_id: studentId,
                term: selectedTerm,
                year: selectedYear,
                total_days: attendance.total_days,
                present_days: attendance.present_days,
                teacher_comment: teacherComment,
                entries: entryList
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save term report');
        } finally {
            setSaving(false);
        }
    };

    const renderLevelButtons = (item: ReportItem) => (
        <div key={item.id} className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.name}</p>
            <div className="flex gap-2">
                {CBC_LEVELS.map((level) => {
                    const selected = entries[item.id] === level.code;
                    return (
                        <button
                            key={level.code}
                            onClick={() => setLevel(item.id, level.code)}
                            disabled={!isEditable}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selected
                                ? `${level.color} text-white border-transparent shadow-lg scale-[1.04]`
                                : 'bg-muted/40 text-muted-foreground border-border hover:border-muted-foreground/40'
                                } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {level.code}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const noItemsConfigured = !loading && competencies.length === 0 && values.length === 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[90vh] bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-border bg-muted/20 relative shrink-0">
                    <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                        <X size={24} />
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-secondary text-white flex items-center justify-center shadow-xl shadow-secondary/20">
                            <User size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">{studentName}</h3>
                            <div className="flex items-center gap-3">
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-secondary">
                                    Term Report Entry
                                </p>
                                {!isEditable && !loading && (
                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                        Read Only (Session Closed)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4 ml-auto mr-12">
                            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-2xl border border-border">
                                <Calendar size={14} className="text-secondary ml-2" />
                                <select
                                    value={selectedTerm}
                                    onChange={e => setSelectedTerm(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                >
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer border-l border-border pl-2"
                                >
                                    {Array.from(new Set(availableTerms.map(t => t.year))).sort((a, b) => b - a).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                    {(!availableTerms.some(t => t.year === selectedYear) && selectedYear) && (
                                        <option value={selectedYear}>{selectedYear}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-12 space-y-12">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-secondary" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Synchronizing records...</p>
                        </div>
                    ) : noItemsConfigured ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                                <Settings2 size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tighter">No Report Items Configured</h4>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground max-w-xs mx-auto leading-loose">
                                    An administrator must first add Core Competencies and Values in the Admin Panel before teachers can fill term reports.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Section B – Competencies */}
                            {competencies.length > 0 && (
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                                            <Brain size={20} />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Core Competencies Development</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {competencies.map(renderLevelButtons)}
                                    </div>
                                </section>
                            )}

                            {/* Section C – Values */}
                            {values.length > 0 && (
                                <section className="space-y-8 pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner">
                                            <Heart size={20} />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Values & Social Development</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {values.map(renderLevelButtons)}
                                    </div>
                                </section>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
                                {/* Section D – Attendance */}
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                                            <Calendar size={20} />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Attendance Record</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Term Days</label>
                                            <input
                                                type="number"
                                                value={attendance.total_days}
                                                disabled={!isEditable}
                                                onChange={(e) => setAttendance(a => ({ ...a, total_days: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl text-xs font-black outline-none focus:border-secondary transition-all shadow-inner disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Days Present</label>
                                            <input
                                                type="number"
                                                value={attendance.present_days}
                                                disabled={!isEditable}
                                                onChange={(e) => setAttendance(a => ({ ...a, present_days: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-6 py-4 bg-muted/50 border border-border rounded-2xl text-xs font-black outline-none focus:border-secondary transition-all shadow-inner disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Teacher's Comment */}
                                <section className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                                            <MessageSquare size={20} />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">Class Teacher's Comment</h4>
                                    </div>
                                    <textarea
                                        value={teacherComment}
                                        disabled={!isEditable}
                                        onChange={(e) => setTeacherComment(e.target.value)}
                                        placeholder={isEditable ? "Enter overall observation and recommendations..." : "No comment entered."}
                                        rows={4}
                                        className="w-full px-6 py-4 bg-muted/50 border border-border rounded-[2rem] text-xs font-medium leading-relaxed outline-none focus:border-secondary transition-all shadow-inner resize-none disabled:opacity-50"
                                    />
                                </section>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
                    {error ? (
                        <div className="flex items-center gap-2 text-rose-500">
                            <AlertCircle size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-secondary">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Changes are saved per student per term</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-muted/80 transition-all">
                            Cancel
                        </button>
                        {isEditable && (
                            <button
                                onClick={handleSave}
                                disabled={saving || loading || noItemsConfigured}
                                className="px-12 py-4 bg-secondary text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-secondary/20 flex items-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Term Report
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
