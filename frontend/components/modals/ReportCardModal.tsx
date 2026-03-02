'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Download,
    Loader2,
    FileText,
    Award,
    AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchFullReportCard, fetchHeadTeacherComments } from '@/lib/api';

interface ReportCardModalProps {
    studentId: string;
    studentName: string;
    term: string;
    year: number;
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
    EE: 'bg-emerald-500',
    ME: 'bg-secondary',
    AE: 'bg-amber-500',
    BE: 'bg-rose-500',
};

export default function ReportCardModal({
    studentId,
    studentName,
    term,
    year,
    tokenGetter,
    onClose
}: ReportCardModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [htcTemplates, setHtcTemplates] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            const [report, templates] = await Promise.all([
                fetchFullReportCard(token, studentId, term, year),
                fetchHeadTeacherComments(token)
            ]);
            setData(report);
            const map: Record<string, string> = { EE: '', ME: '', AE: '', BE: '' };
            templates.forEach((t: any) => { map[t.level] = t.comment; });
            setHtcTemplates(map);
        } catch (err: any) {
            setError(err.message || 'Failed to load report card');
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallLevel = (reportData: any) => {
        if (!reportData) return 'ME';

        let totalScore = 0;
        let count = 0;
        const scoreLevels: Record<string, number> = { EE: 4, ME: 3, AE: 2, BE: 1 };

        // Subject scores
        (reportData.subjects || []).forEach((s: any) => {
            if (s.performance_level && scoreLevels[s.performance_level]) {
                totalScore += scoreLevels[s.performance_level];
                count++;
            }
        });

        // Competencies and Values
        (reportData.term_report?.entries || []).forEach((e: any) => {
            if (e.level && scoreLevels[e.level]) {
                totalScore += scoreLevels[e.level];
                count++;
            }
        });

        if (count === 0) return 'ME'; // fallback

        const avg = totalScore / count;
        if (avg >= 3.5) return 'EE';
        if (avg >= 2.5) return 'ME';
        if (avg >= 1.5) return 'AE';
        return 'BE';
    };

    const exportToPDF = () => {
        if (!data) return;
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
        doc.text(`${term.toUpperCase()} – ${year}`, pageWidth / 2, 30, { align: 'center' });

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
                ['Term', `${term} – ${year}`],
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
            body: data.subjects.map((s: any) => [s.subject_name, s.performance_level || '-', s.remarks || '']),
            startY: y,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 20, halign: 'center' } }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text('EE - Exceeding  |  ME - Meeting  |  AE - Approaching  |  BE - Below Expectation', margin, y);
        y += 10;

        // Sections B & C: Dynamic items
        const tr = data.term_report;
        const entryMap: Record<string, string> = {};
        (tr?.entries || []).forEach((e: any) => { entryMap[e.item_id] = e.level; });

        const competencies = (tr?.entries || []).filter((e: any) => e.item?.type === 'competency');
        const vals = (tr?.entries || []).filter((e: any) => e.item?.type === 'value');

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
        const autoComment = htcTemplates[overallLvl] || 'Strive for excellence.';
        doc.text(autoComment, margin + 50, y, { maxWidth: 120 });

        doc.save(`${studentName.replace(/\s+/g, '_')}_ReportCard_${term}_${year}.pdf`);
    };

    // Group entries by type for the preview
    const competencyEntries = data?.term_report?.entries?.filter((e: any) => e.item?.type === 'competency') ?? [];
    const valueEntries = data?.term_report?.entries?.filter((e: any) => e.item?.type === 'value') ?? [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b border-border bg-emerald-500 text-white relative flex items-start md:items-center justify-between shrink-0">
                    <div className="flex items-start md:items-center gap-6">
                        <div className="hidden md:block w-16 h-16 rounded-[2rem] bg-background/20 text-background flex items-center justify-center backdrop-blur-md">
                            <Award size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl text-background uppercase tracking-tighter">Student Report Card</h3>
                            <p className="text-xs text-background font-black uppercase tracking-[0.3em] opacity-80">{studentName} • {term} {year}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-2 right-2 md:relative md:top-0 md:right-0 p-2 hover:bg-rose-500/10 hover:text-rose-500 active:bg-rose-500/10 active:text-rose-500 rounded-full transition-colors"><X size={24} /></button>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-auto p-2 md:p-12 bg-muted/10">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Aggregating academic data...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <AlertCircle className="text-rose-500" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{error}</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-10">
                            {/* Paper preview */}
                            <div className="bg-card border border-border rounded-2xl shadow-xl p-4 md:p-12 space-y-10">
                                {/* Student details */}
                                <div className="grid grid-cols-2 gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {[
                                        { label: 'Learner Name', val: data.student.full_name },
                                        { label: 'Admission No.', val: data.student.admission_number },
                                        { label: 'Grade / Stream', val: `${data.student.grade} / ${data.student.stream}` },
                                        { label: 'Class Teacher', val: data.student.class_teacher }
                                    ].map(({ label, val }) => (
                                        <div key={label} className="space-y-1">
                                            <p className="opacity-60">{label}</p>
                                            <p className="text-foreground text-sm font-bold">{val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-border" />

                                {/* Section A */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center">Section A — Subject Performance</h4>
                                    <div className="border border-border rounded-2xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-muted/50 border-b border-border">
                                                <tr>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest">Subject</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-center">Level</th>
                                                    <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest">Comment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {data.subjects.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-5 py-6 text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">No subject results for this term yet</td></tr>
                                                ) : data.subjects.map((s: any) => (
                                                    <tr key={s.id}>
                                                        <td className="px-5 py-3 text-xs font-bold uppercase">{s.subject_name}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black text-white ${LEVEL_COLORS[s.performance_level] ?? 'bg-muted text-muted-foreground'}`}>
                                                                {s.performance_level || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-[10px] text-muted-foreground">{s.remarks || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Sections B & C */}
                                {(competencyEntries.length > 0 || valueEntries.length > 0) && (
                                    <div className="grid grid-cols-2 gap-10">
                                        {competencyEntries.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary">Core Competencies</h4>
                                                <div className="space-y-2">
                                                    {competencyEntries.map((e: any) => (
                                                        <div key={e.id} className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-muted-foreground">{e.item.name}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${LEVEL_COLORS[e.level] ?? 'bg-muted text-muted-foreground'}`}>{e.level || '-'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {valueEntries.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Social Values</h4>
                                                <div className="space-y-2">
                                                    {valueEntries.map((e: any) => (
                                                        <div key={e.id} className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-muted-foreground">{e.item.name}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${LEVEL_COLORS[e.level] ?? 'bg-muted text-muted-foreground'}`}>{e.level || '-'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attendance */}
                                {data.term_report && (
                                    <div className="grid grid-cols-3 gap-6 p-6 bg-muted/30 rounded-2xl border border-border">
                                        {[
                                            { label: 'Term Days', val: data.term_report.total_days ?? '-' },
                                            { label: 'Days Present', val: data.term_report.present_days ?? '-' },
                                            { label: 'Days Absent', val: (data.term_report.total_days ?? 0) - (data.term_report.present_days ?? 0) }
                                        ].map(({ label, val }) => (
                                            <div key={label} className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                                                <p className="text-2xl font-black text-foreground">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="space-y-6 bg-card border border-border rounded-2xl shadow-lg p-4 md:p-10">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class Teacher's Insight</h4>
                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 text-sm font-medium leading-relaxed italic text-foreground/80">
                                        "{data.term_report?.teacher_comment || 'No comment provided by the class teacher.'}"
                                    </div>
                                </div>
                                <div className="h-px bg-border/50" />
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Head Teacher's Comment</h4>
                                    <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 text-sm font-medium leading-relaxed text-foreground/90 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calculated Overall Level:</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${LEVEL_COLORS[calculateOverallLevel(data)]}`}>
                                                {calculateOverallLevel(data)}
                                            </span>
                                        </div>
                                        <p>"{htcTemplates[calculateOverallLevel(data)] || 'No official remark configured yet.'}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 md:p-8 border-t border-border bg-card flex flex-col gap-2 md:flex-row items-center justify-between shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        Export PDF for official print quality
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-2xl">Close</button>
                        <button
                            onClick={exportToPDF}
                            disabled={loading || !data}
                            className="px-5 py-4 bg-primary/30 border border-primary/50 text-primary font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-primary hover:text-background active:bg-primary active:text-background transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 disabled:opacity-50"
                        >
                            <Download size={18} />
                            Export PDF Report
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
