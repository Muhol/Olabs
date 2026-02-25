'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Loader2,
    AlertCircle,
    ChevronRight,
    Search,
    GraduationCap,
    LayoutGrid,
    ListFilter,
    TrendingUp
} from 'lucide-react';
import {
    fetchSubjectCompetencies,
    fetchStudents
} from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import GradingModal from '@/components/modals/GradingModal';
import HolisticGradingModal from '@/components/modals/HolisticGradingModal';
import CompetencyRubricConfig from '@/components/cbc/CompetencyRubricConfig';

interface GradingViewProps {
    subjectId: string;
    subject: any;
    tokenGetter: () => Promise<string | null>;
}

export default function GradingView({ subjectId, subject, tokenGetter }: GradingViewProps) {
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [competencies, setCompetencies] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [showHolisticModal, setShowHolisticModal] = useState(false);
    const [showRubricModal, setShowRubricModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadCompetencies();
        loadEnrolledStudents();
    }, [subjectId]);

    const loadCompetencies = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            const data = await fetchSubjectCompetencies(token, subjectId);
            setCompetencies(data);
        } catch (err) {
            console.error('Failed to load competencies:', err);
            setError('Could not load subject competencies.');
        } finally {
            setLoading(false);
        }
    };

    const loadEnrolledStudents = async () => {
        setStudentsLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            const data = await fetchStudents(token, 0, 500, '', undefined, undefined, subjectId);
            setStudents(data.items);
        } catch (err) {
            console.error('Failed to load enrolled students:', err);
            setError('Could not load students for this subject.');
        } finally {
            setStudentsLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Subject Framework...</p>
            </div>
        );
    }

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.admission_number.includes(studentSearch)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Stats Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary" /> Grading Console
                    </h2>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                        {subject?.subject_name} Framework <span className="w-1 h-1 rounded-full bg-primary" /> {students.length} Total Enrolled
                    </p>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <button
                        onClick={() => setShowRubricModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all active:scale-95"
                    >
                        <LayoutGrid size={14} /> Configure Rubric
                    </button>
                    <button
                        onClick={() => setShowHolisticModal(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        <TrendingUp size={14} /> Holistic Grading
                    </button>
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search student or ADM..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="px-2">
                {studentsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="py-32 text-center rounded-[3rem] border border-dashed border-border bg-card/50">
                        <AlertCircle className="text-muted-foreground/30 mx-auto mb-4" size={48} />
                        <h3 className="text-xl font-black text-foreground uppercase mb-2">No Students Found</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Try adjusting your search or enrollment framework.</p>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="flex flex-col gap-3"
                    >
                        {filteredStudents.map((student) => (
                            <motion.button
                                layout
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                whileHover={{ x: 8 }}
                                whileTap={{ scale: 0.995 }}
                                className="group glass-card p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all flex items-center gap-6 text-foreground text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    {student.full_name.charAt(0)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-base uppercase tracking-tight truncate">{student.full_name}</h4>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ADM: {student.admission_number}</span>
                                        <div className="w-1 h-1 rounded-full bg-border" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary">Ready to Assess</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pr-4">
                                    <div className="hidden sm:flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                                            <ListFilter size={10} className="text-primary" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Open Assessment</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Modal Logic */}
            <AnimatePresence>
                {selectedStudent && (
                    <GradingModal
                        student={selectedStudent}
                        subject={subject}
                        subjectId={subjectId}
                        competencies={competencies}
                        tokenGetter={tokenGetter}
                        onClose={() => setSelectedStudent(null)}
                        onSuccess={() => {
                            // Optional: Refresh any list or show global success toast
                        }}
                    />
                )}
                {showHolisticModal && (
                    <HolisticGradingModal
                        subjectId={subjectId}
                        subject={subject}
                        tokenGetter={tokenGetter}
                        onClose={() => setShowHolisticModal(false)}
                        onSuccess={() => {
                            // Refresh logic if needed
                        }}
                    />
                )}
                {showRubricModal && (
                    <CompetencyRubricConfig
                        subjectId={subjectId}
                        subject={subject}
                        competencies={competencies}
                        tokenGetter={tokenGetter}
                        onClose={() => setShowRubricModal(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
