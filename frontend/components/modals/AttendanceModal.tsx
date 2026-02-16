import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Clock, AlertCircle, Save, Loader2, Calendar } from 'lucide-react';
import { submitAttendance, fetchAttendanceSession, fetchSessionRecords, fetchStudents } from '@/lib/api';
import TimetableSelectionModal from './TimetableSelectionModal';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    // students prop removed
    subjectId: string;
    streamId?: string; // Optional: class-wide subjects might not have stream context immediately available
    subjectName: string;
    className: string;
    tokenGetter: () => Promise<string | null>;
    onSuccess?: () => void;
}

export default function AttendanceModal({
    isOpen,
    onClose,
    subjectId,
    streamId,
    subjectName,
    className,
    tokenGetter,
    onSuccess
}: AttendanceModalProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Timetable Selection State
    const [timetableSlotId, setTimetableSlotId] = useState<string | null>(null);
    const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && subjectId) {
            loadAttendance(date);
        }
    }, [isOpen, subjectId, date]);

    useEffect(() => {
        // Calculate stats whenever attendance data changes
        const newStats = { present: 0, absent: 0, late: 0, excused: 0 };
        Object.values(attendanceData).forEach(status => {
            if (status === 'present') newStats.present++;
            else if (status === 'absent') newStats.absent++;
            else if (status === 'late') newStats.late++;
            else if (status === 'excused') newStats.excused++;
        });
        setStats(newStats);
    }, [attendanceData]);

    const loadAttendance = async (selectedDate: string) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            // Fetch students and session in parallel
            const [studentsResponse, session] = await Promise.all([
                fetchStudents(token, 0, 200, '', undefined, undefined, subjectId),
                fetchAttendanceSession(token, subjectId, selectedDate)
            ]);

            const fetchedStudents = studentsResponse.items || [];
            setStudents(fetchedStudents);

            // Initialize all students as present by default if no record exists
            const initialData: Record<string, string> = {};
            fetchedStudents.forEach((s: any) => {
                initialData[s.id] = 'present';
            });

            if (session) {
                setTimetableSlotId(session.timetable_slot_id || null);
                const records = await fetchSessionRecords(token, session.id);
                records.forEach((r: any) => {
                    initialData[r.student_id] = r.status;
                });
            } else {
                setTimetableSlotId(null);
            }

            setAttendanceData(initialData);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const markAll = (status: string) => {
        const newData: Record<string, string> = {};
        students.forEach(s => {
            newData[s.id] = status;
        });
        setAttendanceData(newData);
    };

    const handleSubmit = async () => {
        // Validation: Require Timetable Slot
        if (!timetableSlotId) {
            if (streamId) {
                setIsTimetableModalOpen(true);
                return;
            } else {
                // Fallback for non-stream contexts or just warn
                alert("Please select a valid stream context first (Dev Note: Ensure streamId is passed)");
                return;
            }
        }

        proceedSubmit(timetableSlotId);
    };

    const handleTimetableSelect = (slotId: string) => {
        setTimetableSlotId(slotId);
        setIsTimetableModalOpen(false);
        proceedSubmit(slotId);
    };

    const proceedSubmit = async (slotId: string) => {
        setSubmitting(true);
        setError('');
        setSuccessMessage('');
        try {
            const token = await tokenGetter();
            if (!token) return;

            const payload = {
                subject_id: subjectId,
                timetable_slot_id: slotId,
                date: date,
                students: Object.entries(attendanceData).map(([studentId, status]) => ({
                    student_id: studentId,
                    status: status
                }))
            };

            await submitAttendance(token, payload);
            setSuccessMessage('Attendance saved successfully! You can continue marking or close this modal.');
            if (onSuccess) onSuccess();
            // Don't close modal - let teacher continue working
        } catch (err: any) {
            setError(err.message || 'Failed to submit attendance');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2rem] border border-border shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                {className}
                            </span>
                            <span className="text-muted-foreground text-xs font-bold">•</span>
                            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{subjectName}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Calendar size={14} />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-foreground font-black focus:ring-0 cursor-pointer"
                                />
                            </h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={24} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="px-6 py-4 bg-card border-b border-border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Present: {stats.present}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-500">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            Absent: {stats.absent}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Late: {stats.late}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => markAll('present')}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                            Mark All Present
                        </button>
                        <button
                            onClick={() => markAll('absent')}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                            Mark All Absent
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-primary mb-4" size={40} />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Class List...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col items-center text-center">
                            <AlertCircle size={32} className="mb-2" />
                            <p className="font-bold">{error}</p>
                            <button onClick={() => loadAttendance(date)} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase">Retry</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {students.map((student) => {
                                const status = attendanceData[student.id] || 'present';
                                return (
                                    <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                {student.admission_number.slice(-3)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{student.full_name}</p>
                                                <p className="text-[10px] items-center text-muted-foreground uppercase tracking-wider">{student.admission_number}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 bg-background p-1 rounded-lg border border-border">
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'present')}
                                                className={`p-2 rounded-md transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Present"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                                className={`p-2 rounded-md transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Absent"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'late')}
                                                className={`p-2 rounded-md transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Late"
                                            >
                                                <Clock size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'excused')}
                                                className={`p-2 rounded-md transition-all ${status === 'excused' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Excused"
                                            >
                                                <AlertCircle size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                    {(successMessage || error) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="px-6 py-4 border-t border-border"
                        >
                            {successMessage && (
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-3">
                                    <Check size={20} className="shrink-0" />
                                    <p className="font-bold text-sm">{successMessage}</p>
                                    <button
                                        onClick={() => setSuccessMessage('')}
                                        className="ml-auto p-1 hover:bg-emerald-500/20 rounded-full transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            {error && (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p className="font-bold text-sm">{error}</p>
                                    <button
                                        onClick={() => setError('')}
                                        className="ml-auto p-1 hover:bg-rose-500/20 rounded-full transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground font-medium">
                        {students.length} students enrolled
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || loading}
                            className="px-8 py-3 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Attendance
                        </button>
                    </div>
                </div>
            </motion.div>

            <TimetableSelectionModal
                isOpen={isTimetableModalOpen}
                onClose={() => setIsTimetableModalOpen(false)}
                onSelect={handleTimetableSelect}
                streamId={streamId || ''}
                subjectId={subjectId}
                tokenGetter={tokenGetter}
            />
        </div>
    );
}
