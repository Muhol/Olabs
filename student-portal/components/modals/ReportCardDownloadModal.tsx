'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Download,
    Loader2,
    FileText,
    Award,
    AlertCircle,
    Calendar,
    ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchJSON } from '@/lib/api';

interface ReportCardDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
    EE: 'bg-emerald-500',
    ME: 'bg-secondary',
    AE: 'bg-amber-500',
    BE: 'bg-rose-500',
};

const LEVEL_NAMES: Record<string, string> = {
    EE: 'Exceeding Expectation',
    ME: 'Meeting Expectation',
    AE: 'Approaching Expectation',
    BE: 'Below Expectation',
};

export default function ReportCardDownloadModal({ isOpen, onClose }: ReportCardDownloadModalProps) {
    const [availableTerms, setAvailableTerms] = useState<{ term: string, year: number }[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<{ term: string, year: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadAvailableTerms();
        }
    }, [isOpen]);

    const loadAvailableTerms = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchJSON('/api/student/portal/report-card/available-terms');
            setAvailableTerms(data);
            if (data.length > 0) {
                setSelectedPeriod(data[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load available report cards');
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallLevel = (data: any) => {
        const scores: number[] = [];
        const map: Record<string, number> = { EE: 4, ME: 3, AE: 2, BE: 1 };

        // 1. Subject levels
        data.subjects.forEach((s: any) => {
            if (s.performance_level && map[s.performance_level]) {
                scores.push(map[s.performance_level]);
            }
        });

        // 2. Competencies & Values
        if (data.term_report?.entries) {
            data.term_report.entries.forEach((e: any) => {
                if (e.level && map[e.level]) {
                    scores.push(map[e.level]);
                }
            });
        }

        if (scores.length === 0) return 'ME';
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avg >= 3.5) return 'EE';
        if (avg >= 2.5) return 'ME';
        if (avg >= 1.5) return 'AE';
        return 'BE';
    };

    const handleDownload = async () => {
        if (!selectedPeriod) return;
        setDownloading(true);
        setError(null);
        try {
            const data = await fetchJSON(`/api/student/portal/report-card?term=${selectedPeriod.term}&year=${selectedPeriod.year}`);

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;

            // Header band
            doc.setFillColor(16, 185, 129);
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('TERM REPORT CARD', pageWidth / 2, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${data.term.toUpperCase()} – ${data.year}`, pageWidth / 2, 30, { align: 'center' });

            let y = 50;

            // Learner details
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.text('LEARNER DETAILS', margin, y); y += 4;
            autoTable(doc, {
                body: [
                    ['Learner Name', data.student.full_name],
                    ['Admission Number', data.student.admission_number],
                    ['Grade', data.student.grade],
                    ['Term', `${data.term} – ${data.year}`],
                    ['Class Teacher', data.student.class_teacher]
                ],
                startY: y,
                theme: 'grid',
                styles: { fontSize: 9 },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [249, 250, 251], cellWidth: 50 } }
            });
            y = (doc as any).lastAutoTable.finalY + 10;

            // Section A: Subjects
            doc.text('SECTION A: SUBJECT PERFORMANCE', margin, y); y += 4;
            autoTable(doc, {
                head: [['Subject', 'Level', 'Comment']],
                body: data.subjects.map((s: any) => [
                    s.subject_name,
                    s.performance_level || '-',
                    s.remarks || ''
                ]),
                startY: y,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 55, fontStyle: 'bold' },
                    1: { cellWidth: 20, halign: 'center' }
                }
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('EE - Exceeding  |  ME - Meeting  |  AE - Approaching  |  BE - Below Expectation', margin, y);
            y += 10;

            // Sections B & C: Dynamic items
            const tr = data.term_report;
            const entries = tr?.entries || [];

            const competencies = entries.filter((e: any) => e.item?.type === 'competency');
            const vals = entries.filter((e: any) => e.item?.type === 'value');

            if (competencies.length > 0 || vals.length > 0) {
                doc.setFontSize(11);
                doc.setTextColor(31, 41, 55);
                doc.text('COMPETENCIES & VALUES', margin, y); y += 4;

                const leftRows = competencies.map((e: any) => [e.item.name, e.level || '-']);
                const rightRows = vals.map((e: any) => [e.item.name, e.level || '-']);
                const maxRows = Math.max(leftRows.length, rightRows.length);
                const combined = Array.from({ length: maxRows }, (_, i) => [
                    leftRows[i]?.[0] ?? '', leftRows[i]?.[1] ?? '',
                    rightRows[i]?.[0] ?? '', rightRows[i]?.[1] ?? ''
                ]);

                autoTable(doc, {
                    head: [['Competency', 'Level', 'Value', 'Level']],
                    body: combined,
                    startY: y,
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] },
                    styles: { fontSize: 8 },
                    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 50 }, 3: { cellWidth: 18, halign: 'center' } }
                });
                y = (doc as any).lastAutoTable.finalY + 10;
            }

            // Section D: Attendance
            doc.setFontSize(11);
            doc.setTextColor(31, 41, 55);
            doc.text('SECTION D: ATTENDANCE', margin, y); y += 4;
            autoTable(doc, {
                head: [['Term Days', 'Days Present', 'Days Absent']],
                body: [[tr?.total_days ?? '-', tr?.present_days ?? '-', (tr?.total_days ?? 0) - (tr?.present_days ?? 0)]],
                startY: y,
                theme: 'grid',
                styles: { fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [100, 116, 139] }
            });
            y = (doc as any).lastAutoTable.finalY + 12;

            // Comments
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text("Class Teacher's Comment:", margin, y);
            doc.setFont('helvetica', 'normal');
            doc.text(tr?.teacher_comment || 'N/A', margin + 50, y, { maxWidth: 120 });
            y += 12;
            doc.setFont('helvetica', 'bold');
            doc.text("Head Teacher's Comment:", margin, y);
            doc.setFont('helvetica', 'normal');

            const overallLvl = calculateOverallLevel(data);
            const autoComment = data.htc_templates[overallLvl] || 'Strive for excellence.';
            doc.text(autoComment, margin + 50, y, { maxWidth: 120 });

            doc.save(`${data.student.full_name.replace(/\s+/g, '_')}_ReportCard_${data.term}_${data.year}.pdf`);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to generate report card');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8"
                    >
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                <Award size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Download Report Card</h3>
                            <p className="text-muted-foreground font-medium text-sm">
                                Select an academic period to generate your official transcript.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm font-bold">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fetching available records...</p>
                            </div>
                        ) : availableTerms.length > 0 ? (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Available Transcripts</label>
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availableTerms.map((period, idx) => (
                                        <button
                                            key={`${period.term}-${period.year}`}
                                            onClick={() => setSelectedPeriod(period)}
                                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group ${selectedPeriod?.term === period.term && selectedPeriod?.year === period.year
                                                ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20'
                                                : 'bg-muted/30 border-border hover:border-primary/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedPeriod?.term === period.term && selectedPeriod?.year === period.year
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary border border-border'
                                                    }`}>
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className={`font-black uppercase tracking-tight ${selectedPeriod?.term === period.term && selectedPeriod?.year === period.year
                                                        ? 'text-primary'
                                                        : 'text-foreground'
                                                        }`}>{period.term}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{period.year} Academic Year</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className={
                                                selectedPeriod?.term === period.term && selectedPeriod?.year === period.year
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground group-hover:text-primary transition-colors'
                                            } />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-[2rem] space-y-3">
                                <FileText className="mx-auto text-muted-foreground/30" size={48} />
                                <p className="text-sm font-bold text-muted-foreground">No official report cards found for your account.</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleDownload}
                                disabled={downloading || !selectedPeriod}
                                className="w-full py-5 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {downloading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download PDF Report
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={downloading}
                                className="w-full py-4 text-muted-foreground font-black uppercase text-[10px] tracking-widest hover:text-foreground transition-all"
                            >
                                Close
                            </button>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-3 rounded-2xl bg-muted/50 border border-border text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
