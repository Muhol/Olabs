'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Users,
    Calendar,
    Save,
    Plus,
    Loader2,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Search,
    Trash2,
    Pencil,
    FileText,
    Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    fetchStudents,
    fetchExamResults,
    fetchSubjectTermResults,
    fetchSubjectCompetencies,
    fetchSubjectRubrics,
    fetchStudentAssessments,
    fetchSubjectAssessments,
    bulkCreateExamResults,
    fetchSubjectExams,
    createExam,
    deleteExam,
    fetchTermExams,
    fetchPreferredTerm
} from '@/lib/api';
import AddExamModal from './AddExamModal';
import EditExamCompetenciesModal from './EditExamCompetenciesModal';

interface HolisticGradingModalProps {
    subjectId: string;
    subject: any;
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function HolisticGradingModal({
    subjectId,
    subject,
    tokenGetter,
    onClose,
    onSuccess
}: HolisticGradingModalProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [term, setTerm] = useState('');
    const [year, setYear] = useState(0);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]); // Array of Exam objects
    const [maxScores, setMaxScores] = useState<Record<string, number>>({});
    const [weights, setWeights] = useState<Record<string, number>>({});
    const [grades, setGrades] = useState<Record<string, Record<string, number | null>>>({});
    const [summaries, setSummaries] = useState<Record<string, { remarks: string, competency_score: number | string, performance_level?: string }>>({});
    const [competencies, setCompetencies] = useState<any[]>([]);
    const [rubric, setRubric] = useState<any>(null);
    const [assessments, setAssessments] = useState<Record<string, Record<string, Record<string, string>>>>({}); // studentId -> examId -> compId -> level
    const [activeCBC, setActiveCBC] = useState<{ studentId: string, examId: string } | null>(null);
    const [showAddExamModal, setShowAddExamModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const [examToDelete, setExamToDelete] = useState<any | null>(null);
    const [showEditCompetenciesModal, setShowEditCompetenciesModal] = useState(false);
    const [examToEdit, setExamToEdit] = useState<any | null>(null);
    const [availableTerms, setAvailableTerms] = useState<any[]>([]);



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
    }, [subjectId, term, year]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            // Fetch enrolled students
            const studentsData = await fetchStudents(token, 0, 500, '', undefined, undefined, subjectId);
            setStudents(studentsData.items);

            // Fetch subject competencies and rubrics
            const comps = await fetchSubjectCompetencies(token, subjectId);
            setCompetencies(comps);

            const rubrics = await fetchSubjectRubrics(token, subjectId);
            if (rubrics && rubrics.length > 0) {
                setRubric(rubrics[0]);
            }

            // Fetch subject exams
            // If term/year missing, backend uses current default
            let examsData = await fetchSubjectExams(token, subjectId, term || undefined, year || undefined);

            // Sync term/year if first load
            if (isFirstLoad && examsData.length > 0) {
                const first = examsData[0].term_exam;
                if (first) {
                    setTerm(first.term);
                    setYear(first.year);
                }
                setIsFirstLoad(false);
            }

            setExams(examsData);

            // Fetch existing exam results for this term/year
            const results = await fetchExamResults(token, undefined, subjectId, term || undefined, year || undefined);

            // Map results to grades state: studentId -> {examId: marks}
            const initialGrades: Record<string, Record<string, number>> = {};
            const initialMaxScores: Record<string, number> = {};
            const initialWeights: Record<string, number> = {};

            results.forEach((r: any) => {
                const examId = r.exam_id;
                if (!initialGrades[r.student_id]) {
                    initialGrades[r.student_id] = {};
                }
                initialGrades[r.student_id][examId] = r.marks;

                // Track max scores and weights per exam
                if (r.max_score !== undefined && r.max_score !== null) {
                    initialMaxScores[examId] = r.max_score;
                }
                if (r.weight !== undefined && r.weight !== null) {
                    initialWeights[examId] = r.weight;
                }
            });

            setGrades(initialGrades);
            setMaxScores(initialMaxScores);
            setWeights(initialWeights);

            // Fetch summaries
            const summaryResults = await fetchSubjectTermResults(token, subjectId, term || undefined, year || undefined);
            
            // Further sync term/year if examsData was empty but summaryResults has them
            if (isFirstLoad && summaryResults.length > 0) {
                setTerm(summaryResults[0].term);
                setYear(summaryResults[0].year);
                setIsFirstLoad(false);
            }

            const initialSummaries: Record<string, { remarks: string, competency_score: number | string, performance_level?: string }> = {};
            summaryResults.forEach((s: any) => {
                initialSummaries[s.student_id] = {
                    remarks: s.remarks || '',
                    competency_score: s.competency_score !== null ? s.competency_score : '',
                    performance_level: s.performance_level || ''
                };
            });
            setSummaries(initialSummaries);

            // Fetch competency assessments for all students in this subject/term/year
            const subjectAssessments = await fetchSubjectAssessments(token, subjectId, term || undefined, year || undefined);
            const initialAssessments: Record<string, Record<string, Record<string, string>>> = {};
            subjectAssessments.forEach((a: any) => {
                const studentId = a.student_id;
                const examId = a.exam_id;
                const compId = a.competency_id;

                if (!initialAssessments[studentId]) initialAssessments[studentId] = {};
                if (!initialAssessments[studentId][examId]) initialAssessments[studentId][examId] = {};
                initialAssessments[studentId][examId][compId] = a.performance_level;
            });
            setAssessments(initialAssessments);
        } catch (err: any) {
            console.error('Failed to load grading data:', err);
            setError('Could not load students or existing grades.');
        } finally {
            setLoading(false);
        }
    };

    const isEditable = availableTerms.find(t => t.term === term && t.year === year)?.edit_status === 'current';

    const handleGradeChange = (studentId: string, examId: string, value: string) => {
        const marks = parseFloat(value);
        const maxScore = maxScores[examId];

        if (maxScore && !isNaN(marks) && marks > maxScore) {
            return;
        }

        if (!isEditable) return;
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [examId]: value === '' ? null : marks
            }
        }));
        setHasChanges(true);
    };

    const handleSummaryChange = (studentId: string, field: 'remarks' | 'competency_score' | 'performance_level', value: any) => {
        if (!isEditable) return;
        setSummaries(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { remarks: '', competency_score: '', performance_level: '' }),
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const handleAssessmentChange = (studentId: string, examId: string, compId: string, level: string) => {
        if (!isEditable) return;
        setAssessments(prev => {
            const next = { ...prev };
            if (!next[studentId]) next[studentId] = {};
            if (!next[studentId][examId]) next[studentId][examId] = {};
            next[studentId][examId][compId] = level;
            return next;
        });
        setHasChanges(true);
    };

    const handleMaxScoreChange = (examId: string, value: string) => {
        const score = parseFloat(value);
        if (!isNaN(score) && score > 0) {
            setMaxScores(prev => ({
                ...prev,
                [examId]: score
            }));
        } else if (value === '') {
            setMaxScores(prev => {
                const newScores = { ...prev };
                delete newScores[examId];
                return newScores;
            });
        }
    };

    const handleWeightChange = (examId: string, value: string) => {
        const weight = parseFloat(value);
        if (!isNaN(weight) && weight >= 0) {
            setWeights(prev => ({
                ...prev,
                [examId]: weight
            }));
        } else if (value === '') {
            setWeights(prev => {
                const newWeights = { ...prev };
                delete newWeights[examId];
                return newWeights;
            });
        }
    };

    const getTotalWeight = () => {
        return exams.reduce((sum, exam) => sum + (weights[exam.id] || 0), 0);
    };

    const calculateTotal = (studentId: string): string | null => {
        let total = 0;
        let missingMark = false;

        exams.forEach(exam => {
            const mark = grades[studentId]?.[exam.id];
            const max = maxScores[exam.id];
            const weight = weights[exam.id];

            if (mark === undefined || mark === null) {
                missingMark = true;
            } else if (max && weight) {
                total += (Number(mark) / max) * weight;
            }
        });

        if (missingMark) return null;
        return total.toFixed(2);
    };

    const levelToNumeric = (level: string): number => {
        switch (level) {
            case 'EE': return 4;
            case 'ME': return 3;
            case 'AE': return 2;
            case 'BE': return 1;
            default: return 0;
        }
    };

    const numericToLevel = (value: number): string => {
        if (value >= 3.25) return 'EE';
        if (value >= 2.50) return 'ME';
        if (value >= 1.75) return 'AE';
        if (value >= 1.00) return 'BE';
        return '-';
    };

    const calculateOverallCompetency = (studentId: string): string => {
        const studentAssessments = assessments[studentId];
        if (!studentAssessments) return '-';

        // 1. Group by competency and calculate final level for each
        const compFinalLevels: Record<string, string> = {};
        const compValues: Record<string, number[]> = {};

        // Filter studentAssessments to ONLY include examIds present in the CURRENT exams list
        const currentExamIds = exams.map(e => e.id);

        Object.keys(studentAssessments).forEach(examId => {
            if (!currentExamIds.includes(examId)) return;

            Object.keys(studentAssessments[examId]).forEach(compId => {
                const level = studentAssessments[examId][compId];
                if (!compValues[compId]) compValues[compId] = [];
                compValues[compId].push(levelToNumeric(level));
            });
        });

        const competencyAverages: number[] = [];
        Object.keys(compValues).forEach(compId => {
            const values = compValues[compId];
            if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const finalLevel = numericToLevel(avg);
                if (finalLevel !== '-') {
                    compFinalLevels[compId] = finalLevel;
                    competencyAverages.push(levelToNumeric(finalLevel));
                }
            }
        });

        // 2. Average those final levels to get subject grade
        if (competencyAverages.length === 0) return '-';
        const overallAvg = competencyAverages.reduce((a, b) => a + b, 0) / competencyAverages.length;
        return numericToLevel(overallAvg);
    };

    const handleCloseAttempt = () => {
        setShowCloseConfirmation(true);
    };

    const addExamColumn = () => {
        if (!isEditable) return;
        setShowAddExamModal(true);
    };

    const handleExamCreated = (newExam: any) => {
        setExams([...exams, newExam]);
        // Refresh competencies as well in case new ones were created
        loadData();
    };

    const removeExamColumn = (examId: string) => {
        if (!isEditable) return;
        const examObject = exams.find(e => e.id === examId);
        if (examObject) {
            setExamToDelete(examObject);
        }
    };

    const confirmDeleteExam = async () => {
        if (!examToDelete) return;

        try {
            const token = await tokenGetter();
            if (!token) return;

            setSubmitting(true);
            await deleteExam(token, examToDelete.id);
            setExams(exams.filter(e => e.id !== examToDelete.id));
            setSuccess('Exam deleted successfully');
            setExamToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete exam');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = await tokenGetter();
            if (!token) return;

            const resultsToSave: any[] = [];
            const summariesToSave: any[] = [];

            // 1. Exam Results
            Object.keys(grades).forEach(studentId => {
                Object.keys(grades[studentId]).forEach(examId => {
                    if (exams.some(e => e.id === examId)) {
                        resultsToSave.push({
                            student_id: studentId,
                            subject_id: subjectId,
                            term,
                            year,
                            exam_id: examId,
                            marks: grades[studentId][examId],
                            max_score: maxScores[examId],
                            weight: weights[examId]
                        });
                    }
                });
            });

            // 2. Term Summaries
            // Ensure we cover all students who have either numeric grades, summaries, or competency assessments
            const studentIdsToProcess = new Set([
                ...Object.keys(grades),
                ...Object.keys(summaries),
                ...Object.keys(assessments)
            ]);

            studentIdsToProcess.forEach(studentId => {
                const s = summaries[studentId] || { remarks: '', competency_score: '', performance_level: '' };
                const studentTotal = calculateTotal(studentId);
                const overallCompGrade = calculateOverallCompetency(studentId);

                if (s.remarks || s.competency_score !== '' || studentTotal !== null || overallCompGrade !== '-') {
                    summariesToSave.push({
                        student_id: studentId,
                        subject_id: subjectId,
                        term,
                        year,
                        remarks: s.remarks,
                        competency_score: s.competency_score === '' ? null : parseFloat(s.competency_score.toString()),
                        total_score: studentTotal ? parseFloat(studentTotal) : null,
                        performance_level: overallCompGrade === '-' ? null : overallCompGrade
                    });
                }
            });

            // 3. Competency Assessments
            const assessmentsToSave: any[] = [];
            Object.keys(assessments).forEach(studentId => {
                Object.keys(assessments[studentId]).forEach(examId => {
                    Object.keys(assessments[studentId][examId]).forEach(compId => {
                        assessmentsToSave.push({
                            student_id: studentId,
                            subject_id: subjectId,
                            competency_id: compId,
                            term,
                            year,
                            exam_id: examId,
                            performance_level: assessments[studentId][examId][compId]
                        });
                    });
                });
            });

            if (resultsToSave.length === 0 && summariesToSave.length === 0 && assessmentsToSave.length === 0) {
                setError('No data to save.');
                setSubmitting(false);
                return;
            }

            await bulkCreateExamResults(token, resultsToSave, summariesToSave, assessmentsToSave);
            setSuccess('All data saved successfully!');
            setHasChanges(false);
            if (onSuccess) onSuccess();
            onClose();
            // Don't auto-close on auto-save, but maybe the user wants it?
            // "prevent losing progress" implies they are still working.
            // Let's only close if it's NOT an auto-save?
            // For now, I'll remove the auto-close to be safe, or just keep it for manual save.
            // Actually, handleSave is used for both. I'll add a parameter 'isAutoSave'.
        } catch (err: any) {
            setError(err.message || 'Failed to save grades.');
        } finally {
            setSubmitting(false);

        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        const totalWeight = getTotalWeight();
        const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

        // Title and Metadata
        doc.setFontSize(20);
        doc.text(`SCORE SHEET: ${subject?.subject_name}`, 14, 20);

        doc.setFontSize(10);
        const classInfo = subject?.class_name ? `Class: ${subject.class_name}` : '';
        const streamInfo = subject?.stream_name ? ` | Stream: ${subject.stream_name}` : '';
        doc.text(`${classInfo}${streamInfo}`, 14, 26);
        doc.text(`${term} | Academic Year ${year}`, 14, 32);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

        // Prepare Table Data
        const tableHeaders = [
            'Student Name',
            'Admission No.',
            ...exams.map(exam => {
                const max = maxScores[exam.id] ? ` (/${maxScores[exam.id]})` : '';
                const weight = weights[exam.id] ? ` [${weights[exam.id]}%]` : '';
                return `${exam.name}${max}${weight}`;
            }),
            `Total (${totalWeight}%)`,
            'Competency',
            'Overall Remarks'
        ];

        const tableRows = filteredStudents.map(student => [
            student.full_name,
            student.admission_number,
            ...exams.map(exam => grades[student.id]?.[exam.id]?.toString() || '-'),
            calculateTotal(student.id) || 'N/A',
            calculateOverallCompetency(student.id),
            summaries[student.id]?.remarks || '-'
        ]);

        autoTable(doc, {
            head: [tableHeaders],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: {
                fillColor: [16, 185, 129], // Primary color (Emerald 500 equivalent)
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
                1: { halign: 'left', cellWidth: 30 }
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            }
        });

        doc.save(`${subject?.subject_name}_${term}_${year}_ScoreSheet.pdf`);
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admission_number.includes(searchQuery)
    );

    const isExamReadOnly = (examId: string) => {
        if (!isEditable) return true;
        return exams.find(e => e.id === examId)?.term_exam?.edit_status === 'completed';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseAttempt}
                className="absolute inset-0 bg-black/80"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border bg-muted/20 relative">
                    {!isEditable && !loading && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-b-2xl shadow-lg flex items-center gap-2 whitespace-nowrap">
                            <Lock size={12} />
                            Read Only Mode – Term Session Closed
                        </div>
                    )}

                    <button
                        onClick={handleCloseAttempt}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-red-500 rounded-full transition-colors text-muted-foreground hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col gap-6">
                        <div className="space-y-1 text-center md:text-left pt-4 md:pt-0">
                            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">Grading</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                {subject?.subject_name} • {subject?.class_name} {subject?.stream_name}
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-2xl border border-border w-full lg:w-auto overflow-x-auto no-scrollbar">
                                <Calendar size={14} className="text-primary ml-2 flex-shrink-0" />
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
                                    className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all w-full"
                                />
                            </div>

                            <button
                                onClick={exportToPDF}
                                disabled={loading || students.length === 0}
                                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                                title="Download PDF Score Sheet"
                            >
                                <FileText size={14} />
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading ...</p>
                        </div>
                    ) : (
                        <div className="inline-block min-w-full align-middle border border-border rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 first:rounded-tl-2xl">Student Details</th>
                                        {exams.map(exam => (
                                            <th key={exam.id} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 group min-w-[140px]">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {exam.name}
                                                        {isExamReadOnly(exam.id) && <Lock size={12} className="text-amber-500" />}
                                                        {!isExamReadOnly(exam.id) && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setExamToEdit(exam);
                                                                        setShowEditCompetenciesModal(true);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-secondary hover:text-indigo-600 transition-all"
                                                                    title="Edit Competencies"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeExamColumn(exam.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-all"
                                                                    title="Delete Assessment"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full justify-center">
                                                        <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1 border border-border" title="Max Score (Out of)">
                                                            <span className="text-[8px] text-muted-foreground">/</span>
                                                            <input
                                                                type="number"
                                                                placeholder="100"
                                                                value={maxScores[exam.id] || ''}
                                                                onChange={e => handleMaxScoreChange(exam.id, e.target.value)}
                                                                disabled={isExamReadOnly(exam.id)}
                                                                className="w-8 bg-transparent text-center outline-none text-[9px] font-black disabled:opacity-50"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1 border border-border" title="Weight %">
                                                            <span className="text-[8px] text-muted-foreground">%</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={weights[exam.id] || ''}
                                                                onChange={e => handleWeightChange(exam.id, e.target.value)}
                                                                disabled={isExamReadOnly(exam.id)}
                                                                className="w-8 bg-transparent text-center outline-none text-[9px] font-black disabled:opacity-50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 min-w-[100px]">
                                            <div className="flex flex-col items-center">
                                                <span>Total</span>
                                                <span className={`text-[8px] ${Math.abs(getTotalWeight() - 100) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    ({getTotalWeight()}%)
                                                </span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 min-w-[80px]">
                                            Comp.
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 min-w-[200px]">
                                            Overall Remarks
                                        </th>
                                        <th className="px-6 py-4 text-center bg-muted/30 last:rounded-tr-2xl">
                                            <button
                                                onClick={addExamColumn}
                                                disabled={!isEditable}
                                                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm disabled:opacity-50"
                                                title="Add Exam Column"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                        {student.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black uppercase text-foreground">{student.full_name}</div>
                                                        <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                            ADM: {student.admission_number} • {student.class_name} {student.stream}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {exams.map(exam => (
                                                <td key={exam.id} className="px-6 py-4 text-center">
                                                    <div
                                                        className="relative group cursor-pointer hover:bg-indigo-50/50 rounded-xl transition-colors p-2"
                                                        onClick={() => setActiveCBC({ studentId: student.id, examId: exam.id })}
                                                    >
                                                        <input
                                                            type="number"
                                                            value={grades[student.id]?.[exam.id] ?? ''}
                                                            onChange={e => handleGradeChange(student.id, exam.id, e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            disabled={isExamReadOnly(exam.id)}
                                                            placeholder="-"
                                                            className={`w-20 px-3 py-2 text-center bg-card border rounded-xl text-xs font-black focus:ring-4 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${maxScores[exam.id] && (grades[student.id]?.[exam.id] || 0) > maxScores[exam.id]
                                                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 text-rose-500'
                                                                : 'border-border focus:border-primary focus:ring-primary/5'
                                                                }`}
                                                        />
                                                        {maxScores[exam.id] && (
                                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none text-[8px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                /{maxScores[exam.id]}
                                                            </div>
                                                        )}
                                                        {competencies.length > 0 && (
                                                            <div
                                                                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 p-1 rounded-lg shadow-lg border transition-all z-10 ${assessments[student.id]?.[exam.id]
                                                                    ? 'bg-secondary border-secondary text-white'
                                                                    : 'bg-card border-border text-muted-foreground opacity-0 group-hover:opacity-100'
                                                                    }`}
                                                            >
                                                                <CheckCircle2 size={8} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-center">
                                                <div className={`w-20 mx-auto px-3 py-2 rounded-xl text-xs font-black ${calculateTotal(student.id)
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-muted/30 text-muted-foreground'
                                                    }`}>
                                                    {calculateTotal(student.id) || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    const level = calculateOverallCompetency(student.id);
                                                    const levelColors: Record<string, string> = {
                                                        'EE': 'bg-emerald-500 text-white',
                                                        'ME': 'bg-secondary text-white',
                                                        'AE': 'bg-amber-500 text-white',
                                                        'BE': 'bg-rose-500 text-white',
                                                        '-': 'bg-muted text-muted-foreground'
                                                    };
                                                    return (
                                                        <div className={`w-12 mx-auto px-2 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition-all ${levelColors[level] || 'bg-muted'}`}>
                                                            {level}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <textarea
                                                    value={summaries[student.id]?.remarks ?? ''}
                                                    onChange={e => handleSummaryChange(student.id, 'remarks', e.target.value)}
                                                    placeholder="Overall Teacher Remarks..."
                                                    className="w-full px-3 py-2 bg-card border border-border rounded-xl text-[10px] font-medium outline-none focus:border-primary transition-all resize-none h-10"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="py-20 text-center">
                                    <AlertCircle className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Students Matching Search</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-border bg-muted/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-4">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl">
                                    <AlertCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{error}</span>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleCloseAttempt}
                            className="px-8 py-2 bg-muted text-muted-foreground font-black uppercase text-xs tracking-widest rounded-xl hover:bg-muted/80 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSave()}
                            disabled={submitting || loading}
                            className="px-8 py-2 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showAddExamModal && (
                        <AddExamModal
                            subjectId={subjectId}
                            term={term}
                            year={year}
                            existingCompetencies={competencies}
                            existingExams={exams}
                            tokenGetter={tokenGetter}
                            onClose={() => setShowAddExamModal(false)}
                            onSuccess={handleExamCreated}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showEditCompetenciesModal && examToEdit && (
                        <EditExamCompetenciesModal
                            exam={examToEdit}
                            subjectId={subjectId}
                            allCompetencies={competencies}
                            tokenGetter={tokenGetter}
                            onClose={() => {
                                setShowEditCompetenciesModal(false);
                                setExamToEdit(null);
                            }}
                            onSuccess={() => {
                                loadData();
                                setSuccess(`Competencies for ${examToEdit.name} updated successfully`);
                                setTimeout(() => setSuccess(''), 3000);
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Competency Evaluation Popover */}
                <AnimatePresence>
                    {activeCBC && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveCBC(null)}
                                className="absolute inset-0 bg-black/60"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden shadow-secondary/10"
                            >
                                <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-secondary/30 border border-secondary/50 text-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-foreground">Competency Evaluation</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                {students.find(s => s.id === activeCBC.studentId)?.full_name} • {activeCBC.examId}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveCBC(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {(() => {
                                        const activeExam = exams.find(e => e.id === activeCBC.examId);
                                        const examCompetencies = activeExam?.competencies || [];

                                        if (examCompetencies.length === 0) {
                                            return (
                                                <div className="py-10 text-center space-y-3">
                                                    <AlertCircle className="mx-auto text-muted-foreground/30" size={32} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                                                        No competencies linked to this exam.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return examCompetencies.map((comp: any) => {
                                            const currentLevel = assessments[activeCBC.studentId]?.[activeCBC.examId]?.[comp.id];
                                            const activeRubric = comp.rubrics?.find((r: any) => r.performance_level === currentLevel);

                                            return (
                                                <div key={comp.id} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground">{comp.name}</h5>
                                                        <div className="flex gap-1">
                                                            {['EE', 'ME', 'AE', 'BE'].map(level => (
                                                                <button
                                                                    key={level}
                                                                    disabled={isExamReadOnly(activeCBC.examId)}
                                                                    onClick={() => handleAssessmentChange(activeCBC.studentId, activeCBC.examId, comp.id, level)}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${currentLevel === level
                                                                        ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-110'
                                                                        : 'bg-muted text-muted-foreground hover:bg-secondary/10'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                >
                                                                    {level}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {activeRubric && (
                                                        <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 animate-in fade-in slide-in-from-top-1 duration-300">
                                                            <p className="text-[8px] font-black text-indigo-600 uppercase mb-1 tracking-widest">Descriptor:</p>
                                                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                                                {activeRubric.descriptor || 'No descriptor defined for this level.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {!currentLevel && (
                                                        <p className="text-[9px] text-muted-foreground/60 italic px-1">
                                                            Select a level to view achievement criteria...
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                                    <button
                                        onClick={() => setActiveCBC(null)}
                                        className="px-8 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-secondary/10"
                                    >
                                        Done Evaluation
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Exam Delete Confirmation Modal */}
                <AnimatePresence>
                    {examToDelete && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setExamToDelete(null)}
                                className="absolute inset-0 bg-black/60 "
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden shadow-rose-500/10"
                            >
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                                        <AlertTriangle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Delete Exam Column?</h3>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground leading-loose">
                                            This will immediately and permanently delete "{examToDelete.name}" and all related grades/competency assessments for ALL students. This cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={confirmDeleteExam}
                                            disabled={submitting}
                                            className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                            {submitting ? 'Deleting...' : 'Yes, Delete Completely'}
                                        </button>
                                        <button
                                            onClick={() => setExamToDelete(null)}
                                            disabled={submitting}
                                            className="w-full py-4 bg-muted text-muted-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-muted/80 transition-all font-black"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showCloseConfirmation && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCloseConfirmation(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden shadow-rose-500/10"
                            >
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                                        <AlertTriangle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Unsaved Changes</h3>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground leading-loose">
                                            You have pending modifications. Do you want to save them before closing?
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={async () => {
                                                await handleSave();
                                                onClose();
                                            }}
                                            disabled={submitting}
                                            className="w-full py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            {submitting ? 'Saving...' : 'Save & Close'}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            disabled={submitting}
                                            className="w-full py-4 bg-rose-500/10 text-rose-500 font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            onClick={() => setShowCloseConfirmation(false)}
                                            disabled={submitting}
                                            className="w-full py-4 bg-muted text-muted-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-muted/80 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
