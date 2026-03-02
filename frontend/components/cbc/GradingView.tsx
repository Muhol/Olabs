'use client';

import { useState } from 'react';
import {
    Loader2,
    AlertCircle,
    ChevronRight,
    Search,
    GraduationCap,
    LayoutGrid,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HolisticGradingModal from '@/components/modals/HolisticGradingModal';

interface GradingViewProps {
    teacherSubjects: any[];
    loading: boolean;
    tokenGetter: () => Promise<string | null>;
}

export default function GradingView({ teacherSubjects, loading, tokenGetter }: GradingViewProps) {
    const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
    const [showHolisticModal, setShowHolisticModal] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState('');

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading Subjects...</p>
            </div>
        );
    }

    const filteredSubjects = teacherSubjects.filter(s =>
        s.subject_name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.class_name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        (s.stream_name && s.stream_name.toLowerCase().includes(subjectSearch.toLowerCase()))
    );

    const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
        const className = subject.class_name;
        const streamName = subject.stream_name || 'All Streams';

        if (!acc[className]) {
            acc[className] = {};
        }
        if (!acc[className][streamName]) {
            acc[className][streamName] = [];
        }
        acc[className][streamName].push(subject);
        return acc;
    }, {} as Record<string, Record<string, any[]>>);

    const handleSubjectClick = (subject: any) => {
        setSelectedSubject(subject);
        setShowHolisticModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="space-y-2">
                    <h2 className="text-3xl  text-foreground uppercase tracking-tight flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary" /> Grading Console
                    </h2>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                        Select a Subject to begin Assessment 
                    </p>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" /> {teacherSubjects.length} Total Assigned
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full ml-auto">
                    <div className="relative group w-full min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search subjects or classes..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-card border border-border rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Subjects List (Grouped) */}
            <div className="px-2 space-y-12">
                {Object.keys(groupedSubjects).length === 0 ? (
                    <div className="py-32 text-center rounded-[3rem] border border-dashed border-border bg-card/50">
                        <AlertCircle className="text-muted-foreground/30 mx-auto mb-4" size={48} />
                        <h3 className="text-xl font-black text-foreground uppercase mb-2">No Subjects Found</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Try adjusting your search or contact the administrator.</p>
                    </div>
                ) : (
                    Object.entries(groupedSubjects).map(([className, streams]) => (
                        <div key={className} className="space-y-8">
                            {/* Class Header */}
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                                <h3 className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-primary/20">
                                    {className}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                            </div>

                            <div className="space-y-6 pl-4 border-l-2 border-border/50">
                                {Object.entries(streams as Record<string, any[]>).map(([streamName, subjects]) => (
                                    <div key={streamName} className="space-y-4">
                                        {/* Stream Subheader */}
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <TrendingUp size={16} className="text-primary" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">{streamName}</h4>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>

                                        <motion.div
                                            layout
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                        >
                                            {(subjects as any[]).map((subject) => (
                                                <motion.button
                                                    layout
                                                    key={subject.id}
                                                    onClick={() => handleSubjectClick(subject)}
                                                    whileHover={{ scale: 1.02, x: 4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="group glass-card p-6 rounded-[2rem] border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col gap-4 text-foreground text-left"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                            <LayoutGrid size={24} />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                                                                <TrendingUp size={10} className="text-primary" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Grade Holistic</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h4 className="font-black text-xl uppercase tracking-tight line-clamp-2">{subject.subject_name}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary">{subject.student_count} Students Enrolled</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">Open Assessment Module</span>
                                                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Logic */}
            <AnimatePresence>
                {showHolisticModal && selectedSubject && (
                    <HolisticGradingModal
                        subjectId={selectedSubject.subject_id}
                        subject={selectedSubject}
                        tokenGetter={tokenGetter}
                        onClose={() => {
                            setShowHolisticModal(false);
                            setSelectedSubject(null);
                        }}
                        onSuccess={() => {
                            // Refresh logic if needed
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
