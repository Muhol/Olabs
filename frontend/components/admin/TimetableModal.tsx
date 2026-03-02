'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Calendar,
    X,
    Plus,
    Clock,
    Trash2,
    Loader2,
    BookOpen,
    AlertCircle,
    XCircle,
    RefreshCcw,
    User,
    RotateCcw,
    RefreshCcw as RefreshCcwIcon
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetableByStream, fetchSubjectsByClassAndStream, bulkCreateTimetableSlots, deleteTimetableSlot, updateTimetableSlot, bulkUpdateTimetableSlots } from '@/lib/api';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
];

interface TimetableModalProps {
    isOpen: boolean;
    onClose: () => void;
    stream: any;
}

export default function TimetableModal({ isOpen, onClose, stream }: TimetableModalProps) {
    const { getToken } = useAuth();
    const [timetable, setTimetable] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New slot state
    const [newSlot, setNewSlot] = useState({
        subject_id: '',
        start_time: '08:00',
        end_time: '09:00',
        days: [] as number[],
        type: 'lesson'
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSlot, setEditingSlot] = useState<any>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Edit Mode & Painting State
    const [isEditing, setIsEditing] = useState(false);
    const [activePaintSubjectId, setActivePaintSubjectId] = useState<string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<{ [slotId: string]: string | null }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && stream) {
            loadStreamData();
            setIsEditing(false); // Reset on open
        }
    }, [isOpen, stream]);

    const loadStreamData = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            if (!t) return;

            const [timetableData, subjectsData] = await Promise.all([
                fetchTimetableByStream(t, stream.id),
                fetchSubjectsByClassAndStream(t, stream.class_id, stream.id)
            ]);
            setTimetable(timetableData);
            setSubjects(subjectsData);
        } catch (err) {
            console.error('Failed to load timetable data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSlot.days.length === 0) return;
        setIsSubmitting(true);
        setStatus({ type: 'none', message: '' });

        try {
            const slotsToCreate = newSlot.days.map(day => ({
                stream_id: stream.id,
                subject_id: newSlot.subject_id || null,
                start_time: newSlot.start_time,
                end_time: newSlot.end_time,
                day_of_week: day,
                type: newSlot.type
            }));

            const t = await getToken();
            if (!t) throw new Error("Authentication failed");

            await bulkCreateTimetableSlots(t, slotsToCreate);
            setStatus({ type: 'success', message: `Successfully added ${slotsToCreate.length} slots.` });

            // Just reset the form but keep the modal open and show success
            setNewSlot(prev => ({
                ...prev,
                days: [],
                subject_id: ''
            }));
            loadStreamData();
        } catch (err: any) {
            console.error('Failed to create slots', err);
            setStatus({ type: 'error', message: err.message || 'Workflow failed.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSubject = async (slotId: string, subjectId: string) => {
        if (!isEditing) {
            setIsUpdating(true);
            try {
                const t = await getToken();
                if (!t) throw new Error("Auth failed");

                await updateTimetableSlot(t, slotId, { subject_id: subjectId || null });
                loadStreamData();
                setEditingSlot(null);
            } catch (err: any) {
                console.error('Update failed', err);
                setStatus({ type: 'error', message: err.message || 'Update failed.' });
            } finally {
                setIsUpdating(false);
            }
        } else {
            // In hybrid bulk edit mode, just mark as pending
            setPendingChanges(prev => ({
                ...prev,
                [slotId]: subjectId || null
            }));
            setEditingSlot(null);
        }
    };

    const handleSlotClick = (slot: any) => {
        if (!isEditing || slot.type === 'break') return;

        if (activePaintSubjectId && activePaintSubjectId !== 'clear') {
            // Painting Mode (only for actual subjects)
            setPendingChanges(prev => ({
                ...prev,
                [slot.id]: activePaintSubjectId
            }));
        } else {
            // Modal Selection Mode (Triggers if activePaintSubjectId is null OR 'clear')
            setEditingSlot(slot);
            const isPending = pendingChanges.hasOwnProperty(slot.id);
            setSelectedSubjectId(isPending ? pendingChanges[slot.id] : slot.subject_id);
        }
    };

    const handleSaveChanges = async () => {
        const updates = Object.entries(pendingChanges).map(([id, subject_id]) => ({
            id,
            subject_id
        }));

        if (updates.length === 0) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            const t = await getToken();
            if (!t) throw new Error("Auth failed");

            await bulkUpdateTimetableSlots(t, updates);
            setStatus({ type: 'success', message: `Saved ${updates.length} changes.` });
            setPendingChanges({});
            setIsEditing(false);
            setActivePaintSubjectId(null);
            loadStreamData();
        } catch (err: any) {
            console.error('Batch save failed', err);
            setStatus({ type: 'error', message: err.message || 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscardChanges = () => {
        if (Object.keys(pendingChanges).length > 0 && !confirm("Discard all unsaved changes?")) return;
        setPendingChanges({});
        setIsEditing(false);
        setActivePaintSubjectId(null);
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm("Remove this entry from the schedule?")) return;

        setIsDeleting(slotId);
        try {
            const t = await getToken();
            if (!t) throw new Error("Auth failed");
            await deleteTimetableSlot(t, slotId);
            loadStreamData();
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleClearDay = async (dayId: number, dayName: string) => {
        if (!confirm(`Wipe all slots for ${dayName}?`)) return;

        try {
            const t = await getToken();
            if (!t) throw new Error("Auth failed");

            // Filters: stream_id and day_of_week
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/timetable/bulk`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${t}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stream_id: stream.id,
                    day_of_week: dayId
                })
            });

            loadStreamData();
        } catch (err) {
            console.error('Clear day failed', err);
        }
    };

    const toggleDay = (dayId: number) => {
        setNewSlot(prev => ({
            ...prev,
            days: prev.days.includes(dayId)
                ? prev.days.filter(id => id !== dayId)
                : [...prev.days, dayId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={Object.keys(pendingChanges).length > 0 ? undefined : onClose}
                className="absolute inset-0 bg-black/80"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] glass-card rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex flex-wrap items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex w-10 h-10 rounded-xl bg-primary/10 text-primary items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                                {stream.full_name || (stream.class_name ? `${stream.class_name} ${stream.name}` : stream.name)} Timetable
                            </h3>
                            <p className="text-muted-foreground font-medium text-[10px]">Manage weekly schedule and session timings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDiscardChanges}
                                    className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border transition-all active:scale-95"
                                >
                                    <XCircle size={16} /> Discard
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving || Object.keys(pendingChanges).length === 0}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Save {Object.keys(pendingChanges).length > 0 ? `(${Object.keys(pendingChanges).length})` : ''}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border transition-all active:scale-95"
                                >
                                    <BookOpen size={16} /> Edit Slots
                                </button>
                                <button
                                    onClick={() => {
                                        setStatus({ type: 'none', message: '' });
                                        setIsAdding(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus size={16} /> Add Timeslot
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 absolute md:relative top-2 right-2 md:top-0 md:right-0 hover:bg-red-500/30 hover:text-red-500 active:bg-red-500/30 active:text-red-500 rounded-xl transition-all ml-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Subject Palette (When Editing) */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-muted/30 border-b border-border"
                        >
                            <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-4">Subject Palette</h4>
                                    <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Select subject then click slots</p>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                    <button
                                        onClick={() => setActivePaintSubjectId(activePaintSubjectId === 'clear' ? null : 'clear')}
                                        className={`shrink-0 px-3 py-2 rounded-lg border-2 transition-all font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 ${activePaintSubjectId === 'clear'
                                            ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20'
                                            : 'bg-card text-muted-foreground border-dashed border-border hover:border-rose-500/50'
                                            }`}
                                    >
                                        <X size={12} /> Clear
                                    </button>
                                    <div className="w-px h-8 bg-border mx-1" />
                                    {subjects.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setActivePaintSubjectId(activePaintSubjectId === sub.id ? null : sub.id)}
                                            className={`shrink-0 px-4 py-2 rounded-lg border-2 transition-all font-black uppercase text-[9px] tracking-widest ${activePaintSubjectId === sub.id
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                                : 'bg-card text-foreground border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Retrieving Schedule...</p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {DAYS.map(day => {
                                const daySlots = timetable.filter(s => s.day_of_week === day.id)
                                    .sort((a, b) => a.start_time.padStart(5, '0').localeCompare(b.start_time.padStart(5, '0')));

                                return (
                                    <div key={day.id} className="group relative w-max flex flex-row gap-3 md:gap-4">
                                        <div className="w-28  sticky top-0 left-0 z-20 flex flex-col items-center md:items-start shrink-0">
                                            <div className="px-3 py-1 rounded-lg backdrop-blur-sm bg-primary/20 border border-primary/60 text-primary w-full max-w-[150px] text-center md:text-left flex items-center justify-between shadow-sm">
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{day.name}</span>
                                                {isEditing && daySlots.length > 0 && (
                                                    <button
                                                        onClick={() => handleClearDay(day.id, day.name)}
                                                        className="md:hidden p-1 text-rose-500 hover:bg-rose-500/10 rounded-md"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            {isEditing && daySlots.length > 0 && (
                                                <button
                                                    onClick={() => handleClearDay(day.id, day.name)}
                                                    className="hidden md:flex mt-2 items-center gap-1.5 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                                                >
                                                    <Trash2 size={9} /> Wipe Day
                                                </button>
                                            )}
                                            <div className="hidden md:block h-full w-px bg-gradient-to-b from-primary/20 to-transparent ml-5 mt-1" />
                                        </div>

                                        <div className="flex-1 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                                            <div className="flex gap-3 min-w-max pb-2">
                                                {daySlots.length === 0 ? (
                                                    <div className="py-2 px-6 rounded-xl border border-dashed border-border opacity-30 flex items-center gap-2">
                                                        <Clock size={12} className="text-muted-foreground" />
                                                        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground italic">Free</span>
                                                    </div>
                                                ) : (
                                                    daySlots.map(slot => {
                                                        const isPending = pendingChanges.hasOwnProperty(slot.id);
                                                        const currentSubjectId = isPending ? pendingChanges[slot.id] : slot.subject_id;
                                                        const subject = subjects.find(s => s.id === currentSubjectId);

                                                        return (
                                                            <div
                                                                key={slot.id}
                                                                onClick={() => handleSlotClick(slot)}
                                                                className={`min-w-[150px] group/slot p-3 rounded-xl border transition-all relative ${isEditing && slot.type !== 'break' ? 'cursor-pointer' : ''
                                                                    } ${isPending
                                                                        ? 'border-emerald-500 bg-emerald-500/5 shadow-lg ring-2 ring-emerald-500/20'
                                                                        : slot.type === 'break'
                                                                            ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                                                                            : 'bg-muted/30 border-border hover:border-primary/40 hover:shadow-md'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-1 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                                                        <Clock size={8} />
                                                                        {slot.start_time} - {slot.end_time}
                                                                    </div>
                                                                    {isPending && (
                                                                        <span className="px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-100 flex items-center gap-0.5">
                                                                            <RefreshCcw size={7} /> New
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <h5 className={`font-black uppercase tracking-tight leading-tight mb-1 truncate ${slot.type === 'break' ? 'text-amber-600 text-[10px]' : 'text-foreground text-xs'
                                                                    }`}>
                                                                    {slot.type === 'break' ? 'Break' : (subject?.name || 'Free Session')}
                                                                </h5>

                                                                {slot.teacher_name && slot.type !== 'break' && !isPending && (
                                                                    <div className="flex items-center gap-1.5 opacity-70">
                                                                        <User size={9} className="text-primary" />
                                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                                                                            {slot.teacher_name}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {isEditing && (
                                                                    <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover/slot:opacity-100 transition-all">
                                                                        {isPending && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPendingChanges(prev => {
                                                                                        const next = { ...prev };
                                                                                        delete next[slot.id];
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                                className="p-1.5 bg-slate-500 text-white rounded-lg shadow-lg hover:bg-slate-600"
                                                                                title="Undo Change"
                                                                            >
                                                                                <RotateCcw size={10} />
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteSlot(slot.id);
                                                                            }}
                                                                            disabled={isDeleting === slot.id}
                                                                            className="p-1.5 bg-rose-500 text-white z-20  top-0 right-2 rounded-lg shadow-lg hover:scale-110 active:scale-95"
                                                                            title="Delete Slot"
                                                                        >
                                                                            {isDeleting === slot.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add Slot Modal Sub-layer */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-foreground/60"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-3xl space-y-8"
                        >
                            <div className="text-center">
                                <h4 className="text-xl font-black uppercase tracking-tight">New Timeslot</h4>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Add sessions to {stream.name}'s schedule</p>
                            </div>

                            <form onSubmit={handleAddSlot} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex bg-muted p-1 rounded-2xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setNewSlot(prev => ({ ...prev, type: 'lesson' }))}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newSlot.type === 'lesson' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}
                                        >
                                            Lesson
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewSlot(prev => ({ ...prev, type: 'break' }))}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newSlot.type === 'break' ? 'bg-amber-500 text-white shadow-lg' : 'text-muted-foreground'}`}
                                        >
                                            Break
                                        </button>
                                    </div>

                                    {newSlot.type === 'lesson' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                                            <select
                                                value={newSlot.subject_id}
                                                onChange={e => setNewSlot(prev => ({ ...prev, subject_id: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-bold text-sm focus:border-primary outline-none transition-all"
                                            >
                                                <option value="">Select Subject (Optional)</option>
                                                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={newSlot.start_time}
                                                onChange={e => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-bold text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">End Time</label>
                                            <input
                                                type="time"
                                                value={newSlot.end_time}
                                                onChange={e => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-bold text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS.map(day => (
                                                <button
                                                    key={day.id}
                                                    type="button"
                                                    onClick={() => toggleDay(day.id)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${newSlot.days.includes(day.id)
                                                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                                        : 'bg-muted border-border text-muted-foreground'
                                                        }`}
                                                >
                                                    {day.name.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-4 border border-border rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={newSlot.days.length === 0 || isSubmitting}
                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Create Slot'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Subject Assignment Modal */}
            <AnimatePresence>
                {editingSlot && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingSlot(null)}
                            className="absolute inset-0 bg-background/60"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm glass-card rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl space-y-6"
                        >
                            <div className="text-center space-y-1">
                                <h4 className="text-xl font-black uppercase tracking-tight">Assign Subject</h4>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    {DAYS.find(d => d.id === editingSlot.day_of_week)?.name} | {editingSlot.start_time}-{editingSlot.end_time}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedSubjectId('')}
                                    className={`w-full p-4 rounded-xl border border-dashed font-black uppercase text-[10px] tracking-widest transition-all ${!selectedSubjectId ? 'bg-primary/5 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                                >
                                    No Subject (Free)
                                </button>

                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {subjects.map(sub => (
                                        <button
                                            key={sub.id}
                                            disabled={isUpdating}
                                            onClick={() => setSelectedSubjectId(sub.id)}
                                            className={`w-full p-4 rounded-xl border text-left font-bold text-xs transition-all flex items-center justify-between ${selectedSubjectId === sub.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-muted/50 border-border hover:border-primary/40'}`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingSlot(null)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdateSubject(editingSlot.id, selectedSubjectId || '')}
                                    disabled={isUpdating}
                                    className="flex-[2] py-4 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

