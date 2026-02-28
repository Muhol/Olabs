'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Users,
    Calendar,
    Search,
    Download,
    Loader2,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchClassScoreSheet, fetchTermExams } from '@/lib/api';

interface ClassScoreSheetModalProps {
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    initialTerm?: string;
    initialYear?: number;
}

export default function ClassScoreSheetModal({
    tokenGetter,
    onClose,
    initialTerm = `Term ${Math.ceil((new Date().getMonth() + 1) / 4)}`,
    initialYear = new Date().getFullYear()
}: ClassScoreSheetModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [term, setTerm] = useState('');
    const [year, setYear] = useState(0);
    const [availableTerms, setAvailableTerms] = useState<any[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState<{ students: any[], subjects: any[] }>({ students: [], subjects: [] });

    useEffect(() => {
        const initDefaults = async () => {
            try {
                const token = await tokenGetter();
                if (!token) return;
                const terms = await fetchTermExams(token);
                setAvailableTerms(terms);
            } catch (err) {
                console.error("Failed to load global terms", err);
            }
        };
        initDefaults();
    }, [tokenGetter]);

    useEffect(() => {
        if (isFirstLoad || (term && year)) {
            loadData();
        }
    }, [term, year]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            const sheetData = await fetchClassScoreSheet(token, term || undefined, year || undefined);
            
            // Sync from backend on first load
            if (isFirstLoad) {
                setTerm(sheetData.term);
                setYear(sheetData.year);
                setIsFirstLoad(false);
            }
            setData(sheetData);
        } catch (err: any) {
            setError(err.message || 'Failed to load class score sheet');
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title & Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Emerald 500
        doc.text('CLASS MASTER SCORE SHEET', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${term} | Academic Year ${year}`, pageWidth / 2, 28, { align: 'center' });

        // Prepare table data
        const tableHeaders = ['Admission', 'Student Name', ...data.subjects.map(s => s.name)];
        const tableRows = data.students.map(student => [
            student.admission_number,
            student.full_name,
            ...data.subjects.map(sub => student.results[sub.id] || '-')
        ]);

        autoTable(doc, {
            head: [tableHeaders],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: [255, 255, 255],
                fontSize: 7,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 7,
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold', cellWidth: 20 },
                1: { halign: 'left', fontStyle: 'bold', cellWidth: 40 }
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            }
        });

        doc.save(`ClassScoreSheet_${term}_${year}.pdf`);
    };

    const filteredStudents = data.students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admission_number.includes(searchQuery)
    );

    const levelColors: Record<string, string> = {
        'EE': 'bg-emerald-500 text-white',
        'ME': 'bg-secondary text-white',
        'AE': 'bg-amber-500 text-white',
        'BE': 'bg-rose-500 text-white',
        '-': 'bg-muted text-muted-foreground'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-7xl h-[90vh] bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 md:p-8 flex flex-col border-b border-border bg-muted/20 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-1 hover:bg-red-500 rounded-full transition-colors text-muted-foreground hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col gap-6 pt-6 md:pt-0">
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">Class Score Sheet</h3>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-secondary">
                                Consolidated Academic Records
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-2xl border border-border w-full lg:w-auto overflow-x-auto no-scrollbar">
                                <Calendar size={14} className="text-secondary ml-2 flex-shrink-0" />
                                <select
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                >
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer border-l border-border pl-2"
                                >
                                    {Array.from(new Set(availableTerms.map(t => t.year))).sort((a, b) => b - a).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                    {(!availableTerms.some(t => t.year === year) && year !== 0) && (
                                        <option value={year}>{year}</option>
                                    )}
                                </select>
                            </div>

                            <div className="relative w-full lg:w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-secondary transition-all w-full"
                                />
                            </div>

                            <button
                                onClick={exportToPDF}
                                disabled={loading || data.students.length === 0}
                                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
                            >
                                <Download size={14} />
                                Export Master Sheet
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto overflow-y-aut bg-card/50">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-secondary" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Compiling class records...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner">
                                <AlertCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tighter">Access Denied or Error</h4>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground max-w-md mx-auto">
                                    {error}
                                </p>
                            </div>
                        </div>
                    ) : data.students.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                                <Users size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase tracking-tighter">No Class Record Found</h4>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground max-w-md mx-auto">
                                    We couldn't find any students assigned to your class for {term}, {year}.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 md:p-8">
                            <div className="border border-border rounded-2xl overflow-hidden bg-muted/10 shadow-sm overflow-x-auto">
                                <table className="w-full border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky left-0 bg-muted/50 z-10">
                                                Student Information
                                            </th>
                                            {data.subjects.map(subject => (
                                                <th key={subject.id} className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[120px]">
                                                    {subject.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-secondary/[0.02] transition-colors group">
                                                <td className="px-6 py-4 sticky left-0 bg-card group-hover:bg-secondary/[0.02] z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-[10px] shadow-inner">
                                                            {student.full_name.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black uppercase tracking-tight text-foreground">{student.full_name}</span>
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{student.admission_number}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {data.subjects.map(subject => {
                                                    const level = student.results[subject.id] || '-';
                                                    return (
                                                        <td key={subject.id} className="px-6 py-4 text-center">
                                                            <div className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition-all ${levelColors[level]}`}>
                                                                {level}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-border bg-muted/20 flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Exceeding Expectation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-secondary shadow-sm shadow-secondary/20" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meeting Expectation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Approaching Expectation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Below Expectation</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full xl:w-auto px-10 py-4 bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-muted/80 transition-all shadow-lg"
                    >
                        Close Portal
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
