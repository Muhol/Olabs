'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    Plus,
    BookOpen,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetableByStream, fetchSubjectsByClassAndStream, bulkCreateTimetableSlots, deleteTimetableSlot, updateTimetableSlot } from '@/lib/api';

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
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

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
        setIsUpdating(true);
        try {
            const t = await getToken();
            if (!t) throw new Error("Auth failed");

            await updateTimetableSlot(t, slotId, { subject_id: subjectId || null });
            loadStreamData();
            setEditingSlot(null);
        } catch (err) {
            console.error('Update failed', err);
        } finally {
            setIsUpdating(false);
        }
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
                onClick={onClose}
                className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] glass-card rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                                {stream.full_name || (stream.class_name ? `${stream.class_name} ${stream.name}` : stream.name)} Timetable
                            </h3>
                            <p className="text-muted-foreground font-medium text-xs">Manage weekly schedule and session timings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`flex items-center gap-2 px-4 py-3 font-black uppercase text-[10px] tracking-widest rounded-xl border transition-all active:scale-95 ${isEditing ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20' : 'bg-muted hover:bg-muted/80 text-foreground border-border'}`}
                        >
                            {isEditing ? <CheckCircle2 size={16} /> : <BookOpen size={16} />} 
                            {isEditing ? 'Done Editing' : 'Edit Slots'}
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
                        <button onClick={onClose} className="p-3 hover:bg-muted rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Retrieving Schedule...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {/* FIRST LOOP: DAYS */}
                            {DAYS.map(day => {
                                const daySlots = timetable.filter(s => s.day_of_week === day.id)
                                    .sort((a, b) => a.start_time.padStart(5, '0').localeCompare(b.start_time.padStart(5, '0')));

                                return (
                                    <div key={day.id} className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{day.name}</h4>
                                            <div className="flex items-center gap-2">

                                                {daySlots.length > 0 && isEditing && (
                                                    <button
                                                        onClick={() => handleClearDay(day.id, day.name)}
                                                        className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-all"
                                                        title={`Wipe ${day.name}`}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* NESTED LOOP: SLOTS */}
                                            {daySlots.length === 0 ? (
                                                <div className="p-6 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
                                                    <Clock size={16} className="mb-2" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Free Day</span>
                                                </div>
                                            ) : (
                                                daySlots.map(slot => (
                                                    <div
                                                        key={slot.id}
                                                        onClick={() => {
                                                            if (isEditing && slot.type === 'lesson') {
                                                                setEditingSlot(slot);
                                                                setSelectedSubjectId(slot.subject_id || '');
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border transition-all relative group ${isEditing ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : ''} ${slot.type === 'break'
                                                            ? 'bg-amber-500/5 border-amber-500/10'
                                                            : 'bg-muted/30 border-border shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                                <Clock size={10} />
                                                                {slot.start_time} - {slot.end_time}
                                                            </div>
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${slot.type === 'break' ? 'text-amber-600 bg-amber-100' : 'text-primary bg-primary/10'
                                                                }`}>
                                                                {slot.type}
                                                            </span>
                                                        </div>
                                                        <h5 className="font-bold text-sm text-foreground truncate">
                                                            {slot.type === 'break' ? 'Break' : (subjects.find(sub => sub.id === slot.subject_id)?.name || 'Free')}
                                                        </h5>

                                                        {isEditing && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteSlot(slot.id);
                                                                }}
                                                                disabled={isDeleting === slot.id}
                                                                className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {isDeleting === slot.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
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

                            {status.type !== 'none' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                                        }`}
                                >
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <p className="text-[10px] font-black uppercase tracking-wider">{status.message}</p>
                                    <button onClick={() => setStatus({ type: 'none', message: '' })} className="ml-auto p-1 hover:bg-black/5 rounded-lg">
                                        <XCircle size={14} />
                                    </button>
                                </motion.div>
                            )}

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
                            className="absolute inset-0 bg-foreground/60"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-6"
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
                                    className={`w-full p-4 rounded-2xl border border-dashed font-black uppercase text-[10px] tracking-widest transition-all ${selectedSubjectId === '' ? 'bg-primary/5 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                                >
                                    No Subject (Free)
                                </button>

                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {subjects.map(sub => (
                                        <button
                                            key={sub.id}
                                            disabled={isUpdating}
                                            onClick={() => setSelectedSubjectId(sub.id)}
                                            className={`w-full p-4 rounded-2xl border text-left font-bold text-xs transition-all flex items-center justify-between ${selectedSubjectId === sub.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-muted/50 border-border hover:border-primary/40'}`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingSlot(null)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdateSubject(editingSlot.id, selectedSubjectId || '')}
                                    disabled={isUpdating || selectedSubjectId === (editingSlot.subject_id || '')}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Assignment'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
