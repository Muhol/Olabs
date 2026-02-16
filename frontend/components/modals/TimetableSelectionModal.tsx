import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Loader2, Zap, GraduationCap, AlertCircle, Check } from 'lucide-react';
import { fetchTimetableByStream } from '@/lib/api';

interface TimetableSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (slotId: string) => void;
    streamId: string;
    subjectId: string;
    tokenGetter: () => Promise<string | null>;
}

export default function TimetableSelectionModal({
    isOpen,
    onClose,
    onSelect,
    streamId,
    subjectId,
    tokenGetter
}: TimetableSelectionModalProps) {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmSlot, setConfirmSlot] = useState<any>(null);

    useEffect(() => {
        if (isOpen && streamId) {
            loadTimetable();
        }
    }, [isOpen, streamId]);

    const loadTimetable = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await tokenGetter();
            if (!token) return;
            const data = await fetchTimetableByStream(token, streamId);
            setTimetable(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slot: any) => {
        if (slot.subject_id !== subjectId) {
            // Shake effect or localized error could go here
            return; 
        }
        setConfirmSlot(slot);
    };

    const handleConfirm = () => {
        if (confirmSlot) {
            onSelect(confirmSlot.id);
            setConfirmSlot(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-5xl max-h-[600px] flex-1  rounded-[2rem] border border-border shadow-2xl flex flex-col relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20">
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" /> Select Class Session
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                            Please select the timetable slot for this attendance record.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X size={24} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto h-full p-6 bg-background/50">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-primary mb-4" size={40} />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Timetable...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col items-center text-center">
                            <AlertCircle size={32} className="mb-2" />
                            <p className="font-bold">{error}</p>
                            <button onClick={loadTimetable} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase">Retry</button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto h-full pb-4">
                            <div className="min-w-max space-y-6 pl-4 pr-4">
                                {[
                                    { id: 1, name: 'Monday' },
                                    { id: 2, name: 'Tuesday' },
                                    { id: 3, name: 'Wednesday' },
                                    { id: 4, name: 'Thursday' },
                                    { id: 5, name: 'Friday' },
                                    { id: 6, name: 'Saturday' }
                                ].map((day) => {
                                    const daySlots = timetable.filter((s: any) => s.day_of_week === day.id)
                                        .sort((a: any, b: any) => a.start_time.padStart(5, '0').localeCompare(b.start_time.padStart(5, '0')));

                                    if (daySlots.length === 0) return null;

                                    return (
                                        <div key={day.id} className="group relative flex flex-row gap-6">
                                            {/* Day Label - Sticky Left */}
                                            <div className="md:w-24 shrink-0 sticky left-0 z-10 pt-2">
                                                <div className="px-3 py-1 rounded-lg bg-primary/10 backdrop-blur-md border border-primary/20 text-primary w-full text-center md:text-left shadow-sm">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{day.name.substring(0, 3)}</span>
                                                </div>
                                                <div className="hidden md:block h-full w-px bg-gradient-to-b from-primary/20 to-transparent ml-5 mt-1" />
                                            </div>

                                            {/* Slots - Unified Row */}
                                            <div className="flex gap-2">
                                                {daySlots.map((slot: any) => {
                                                    const isBreak = slot.type === 'break';
                                                    const isMatchingSubject = slot.subject_id === subjectId;
                                                    
                                                    // Base styling
                                                    let bgClass = "bg-card";
                                                    let borderClass = "border-border";
                                                    let opacityClass = "opacity-50 grayscale cursor-not-allowed"; // Default to disabled/mismatch behavior
                                                    
                                                    if (isBreak) {
                                                        bgClass = "bg-orange-500/10";
                                                        borderClass = "border-orange-500/20";
                                                        opacityClass = "opacity-100"; // Breaks are visible but maybe not clickable for attendance?
                                                    } else if (isMatchingSubject) {
                                                        bgClass = "bg-blue-500/10";
                                                        borderClass = "border-blue-500/20";
                                                        opacityClass = "opacity-100 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer";
                                                    }

                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            onClick={() => !isBreak && isMatchingSubject && handleSlotClick(slot)}
                                                            className={`min-w-[140px] p-2.5 rounded-xl border transition-all duration-300 relative group/slot
                                                                ${bgClass} ${borderClass} ${opacityClass}
                                                                ${confirmSlot?.id === slot.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}
                                                            `}
                                                        >
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest tabular-nums bg-muted px-1.5 py-0.5 rounded border border-border">
                                                                        {slot.start_time} - {slot.end_time}
                                                                    </span>
                                                                    {isBreak && <span className="text-[7px] font-bold text-orange-500 uppercase tracking-wider">Break</span>}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className={`font-black uppercase tracking-tight leading-tight line-clamp-1 text-[11px] ${isMatchingSubject ? 'text-blue-600' : (isBreak ? 'text-orange-600' : 'text-muted-foreground')}`}>
                                                                        {slot.subject_name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {!isMatchingSubject && !isBreak && (
                                                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">Wrong Subject</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirmation Overlay */}
                {confirmSlot && (
                    <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                         <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card w-full max-w-sm rounded-2xl border border-primary/20 shadow-2xl p-6 space-y-4"
                        >
                            <div className="flex items-center gap-3 text-primary">
                                <AlertCircle size={24} />
                                <h3 className="font-black uppercase tracking-tight text-lg">Confirm Selection</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Use <strong>{confirmSlot.subject_name}</strong> on <strong>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][confirmSlot.day_of_week - 1]}</strong> at <strong>{confirmSlot.start_time}</strong>?
                            </p>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setConfirmSlot(null)}
                                    className="flex-1 px-4 py-2 rounded-xl font-bold uppercase text-xs tracking-wider text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 px-4 py-2 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
