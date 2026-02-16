'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Wrench,
    Calendar,
    Plus,
    Users,
    Loader2,
    ChevronRight,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Trash,
    Filter,
    X,
    ShieldAlert,
    RefreshCw,
    UserCircle2,
    TriangleAlert,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchClasses, fetchStreams, bulkCreateTimetableSlots, fetchStudents, resetStudentAccount } from '@/lib/api';
import TimetableModal from '@/components/admin/TimetableModal';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
];

export default function AdminFunctionsPage() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState<'timetabling' | 'account-management'>('timetabling');
    const [classes, setClasses] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Bulk creation modal state
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    const [bulkSlot, setBulkSlot] = useState({
        start_time: '08:00',
        end_time: '09:00',
        type: 'lesson'
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [deleteFilters, setDeleteFilters] = useState({
        stream_id: 'none',
        day_of_week: 'none',
        start_time: '',
        end_time: ''
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });
    const [isClearing, setIsClearing] = useState(false);
    const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
    const [wipeConfirmationText, setWipeConfirmationText] = useState('');

    // Stream Timetable Modal
    const [selectedStream, setSelectedStream] = useState<any>(null);

    // Account Management State
    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [confirmingResetStudent, setConfirmingResetStudent] = useState<any>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            if (!t) return;

            const [classesData, streamsData] = await Promise.all([
                fetchClasses(t),
                fetchStreams(t)
            ]);

            setClasses(classesData);
            setStreams(streamsData);
        } catch (err) {
            console.error('Failed to load admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingBulk(true);
        try {
            // Create slots for ALL streams and ALL days (1-6)
            const slots = [];
            for (const stream of streams) {
                for (let day = 1; day <= 6; day++) {
                    slots.push({
                        stream_id: stream.id,
                        subject_id: null, // Global slots are usually breaks or placeholders
                        start_time: bulkSlot.start_time,
                        end_time: bulkSlot.end_time,
                        day_of_week: day,
                        type: bulkSlot.type
                    });
                }
            }

            const activeToken = await getToken();
            if (!activeToken) throw new Error("Authentication failed");

            await bulkCreateTimetableSlots(activeToken, slots);
            setStatus({ type: 'success', message: `Successfully deployed ${slots.length} slots across ${streams.length} streams.` });
        } catch (err: any) {
            console.error('Global bulk creation failed', err);
            setStatus({ type: 'error', message: err.message || 'Failed to execute global bulk creation.' });
        } finally {
            setIsSavingBulk(false);
        }
    };

    const handleClearAllTimetables = () => {
        setIsWipeModalOpen(true);
        setWipeConfirmationText('');
    };

    const executeWipe = async () => {
        if (wipeConfirmationText !== "DELETE ALL TIMETABLES") return;
        
        setIsClearing(true);
        setStatus({ type: 'none', message: '' });
        try {
            const activeToken = await getToken();
            if (!activeToken) throw new Error("Authentication failed");

            // Empty filters = delete everything
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/timetable/bulk`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${activeToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // Delete all
            });

            setStatus({ type: 'success', message: 'All timetable data has been purged successfully.' });
            setIsWipeModalOpen(false);
        } catch (err: any) {
            console.error('Purge failed', err);
            setStatus({ type: 'error', message: 'System purge failed: ' + err.message });
        } finally {
            setIsClearing(false);
        }
    };

    const handleResetFilters = () => {
        setDeleteFilters({
            stream_id: 'none',
            day_of_week: 'none',
            start_time: '',
            end_time: ''
        });
    };

    const handleFilteredDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeletingBulk(true);
        setStatus({ type: 'none', message: '' });

        try {
            const activeToken = await getToken();
            if (!activeToken) throw new Error("Authentication failed");

            if (deleteFilters.stream_id === 'none' && deleteFilters.day_of_week === 'none' && !deleteFilters.start_time && !deleteFilters.end_time) {
                setStatus({ type: 'error', message: 'Please select at least one filter or choose "ALL" for wide deletion.' });
                setIsDeletingBulk(false);
                return;
            }

            const filters: any = {};
            if (deleteFilters.stream_id !== 'all' && deleteFilters.stream_id !== 'none') filters.stream_id = deleteFilters.stream_id;
            if (deleteFilters.day_of_week !== 'all' && deleteFilters.day_of_week !== 'none') filters.day_of_week = parseInt(deleteFilters.day_of_week);
            if (deleteFilters.start_time) filters.start_time = deleteFilters.start_time;
            if (deleteFilters.end_time) filters.end_time = deleteFilters.end_time;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/timetable/bulk`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${activeToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });
            const data = await response.json();

            setStatus({ type: 'success', message: data.message || 'Bulk deletion completed.' });
            handleResetFilters(); // Auto-clear filters on success
        } catch (err: any) {
            console.error('Filtered delete failed', err);
            setStatus({ type: 'error', message: 'Failed to execute filtered deletion: ' + err.message });
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const handleStudentSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentSearch.trim()) return;
        
        setSearching(true);
        setStatus({ type: 'none', message: '' });
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication failed");
            
            const data = await fetchStudents(token, 0, 10, studentSearch);
            setSearchResults(data.items);
        } catch (err: any) {
            console.error('Student search failed', err);
            setStatus({ type: 'error', message: 'Failed to find students: ' + err.message });
        } finally {
            setSearching(false);
        }
    };

    const handleResetAccount = async (student: any) => {
        setResettingId(student.id);
        setStatus({ type: 'none', message: '' });
        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication failed");
            
            await resetStudentAccount(token, student.id);
            setStatus({ type: 'success', message: `Account for ${student.full_name} has been reset successfully.` });
            
            // Update local state if needed (e.g., mark as not activated)
            setSearchResults(prev => prev.map(s => s.id === student.id ? { ...s, activated: false } : s));
            setConfirmingResetStudent(null);
        } catch (err: any) {
            console.error('Reset failed', err);
            setStatus({ type: 'error', message: 'Account reset failed: ' + err.message });
        } finally {
            setResettingId(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={64} />
                <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-xs">Initializing Admin Core...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <Wrench size={14} /> System Operations
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Admin Functions</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Advanced tools for institutional management and automation.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-muted p-1.5 rounded-[1.4rem] border border-border self-start">
                <button
                    onClick={() => setActiveTab('timetabling')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'timetabling' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Timetabling
                </button>
                <button
                    onClick={() => setActiveTab('account-management')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'account-management' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Account Management
                </button>
            </div>

            {/* Main Content Area */}
            {activeTab === 'timetabling' && (
                <div className="space-y-8">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glass-card rounded-[2rem] border border-border bg-card/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-tight">Global Schedule Control</h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Deploy slots across the entire institution</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setStatus({ type: 'none', message: '' });
                                    setIsBulkModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={16} /> Global Bulk Create
                            </button>
                            <button
                                onClick={() => {
                                    setStatus({ type: 'none', message: '' });
                                    setIsDeleteModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Filter size={16} /> Targeted Remove
                            </button>
                            <button
                                onClick={handleClearAllTimetables}
                                disabled={isClearing}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                            >
                                {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
                                Wipe All Data
                            </button>
                        </div>
                    </div>

                    {/* Classes & Streams Grid */}
                    <div className="space-y-12">
                        {classes.map(cls => (
                            <div key={cls.id} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground whitespace-nowrap">{cls.name}</h2>
                                    <div className="h-px w-full bg-border"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {streams.filter(s => s.class_id === cls.id).map(stream => (
                                        <motion.div
                                            key={stream.id}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            onClick={() => setSelectedStream({ ...stream, class_name: cls.name })}
                                            className="p-6 glass-card rounded-[2rem] border border-border bg-card hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors flex items-center justify-center text-muted-foreground group-hover:text-primary">
                                                        <Users size={24} />
                                                    </div>
                                                    <div className="p-2 opacity-0 group-hover:opacity-100 transition-all bg-primary/10 rounded-lg">
                                                        <ChevronRight className="text-primary" size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black tracking-tight text-foreground">{stream.name}</h4>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Open Timetable</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'account-management' && (
                <div className="space-y-8">
                    {/* Warning Banner */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-start gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                            <TriangleAlert size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Security Protocol Warning</h4>
                            <p className="text-sm text-foreground/80 font-medium">
                                Resetting an account is a destructive action. The student's current password will be <strong>deleted</strong> and they will be forced to complete the <strong>onboarding process</strong> again. Use this only for recovery purposes.
                            </p>
                        </div>
                    </motion.div>

                    {/* Search Section */}
                    <section className="p-8 glass-card rounded-[2.5rem] border border-border bg-card/50 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                                    <UserCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Student Account Recovery</h3>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Search and reset student credentials for re-onboarding</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleStudentSearch} className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or admission number..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-2xl py-5 pl-14 pr-6 font-bold text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={searching}
                                className="absolute right-3 top-2 bottom-2 px-6 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                            </button>
                        </form>
                    </section>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {searchResults.map((student) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 glass-card rounded-[2rem] border border-border bg-card space-y-6 group hover:border-primary/30 transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                                                    <UserCircle2 size={24} />
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${student.activated ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                                    {student.activated ? 'Activated' : 'Reset / Pending'}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black tracking-tight text-foreground line-clamp-1">{student.full_name}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{student.admission_number}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/30 p-3 rounded-xl border border-border">
                                                <span className="flex items-center gap-1.5"><ShieldAlert size={12} className="text-secondary" /> {student.full_class || 'No Class'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setConfirmingResetStudent(student)}
                                            disabled={resettingId === student.id}
                                            className="w-full py-3 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-xl border border-secondary/20 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"
                                        >
                                            {resettingId === student.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <RefreshCw size={14} /> Reset Account
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : studentSearch && !searching ? (
                            <div className="p-20 text-center glass-card rounded-[3rem] border border-dashed border-border bg-card/30">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                                    <Search size={32} />
                                </div>
                                <h3 className="font-black text-lg uppercase tracking-tight text-muted-foreground/50">No Students Found</h3>
                                <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">Check the admission number or name and try again</p>
                            </div>
                        ) : !searching && (
                            <div className="p-20 text-center bg-muted/10 rounded-[3rem] border border-dashed border-border">
                                <p className="text-muted-foreground/40 font-black uppercase tracking-[0.3em] text-xs">Enter a name or admission number to start searching</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Global Bulk Create Modal */}
            <AnimatePresence>
                {isBulkModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Plus size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Global Bulk Setup</h3>
                                <p className="text-muted-foreground font-medium text-sm">Create a timeslot for ALL streams (Monday - Saturday)</p>
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

                            <form onSubmit={handleGlobalBulkCreate} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex bg-muted p-1 rounded-2xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setBulkSlot(prev => ({ ...prev, type: 'lesson' }))}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkSlot.type === 'lesson' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}
                                        >
                                            Lesson
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBulkSlot(prev => ({ ...prev, type: 'break' }))}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkSlot.type === 'break' ? 'bg-amber-500 text-white shadow-lg' : 'text-muted-foreground'}`}
                                        >
                                            Break
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={bulkSlot.start_time}
                                                onChange={e => setBulkSlot(prev => ({ ...prev, start_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">End Time</label>
                                            <input
                                                type="time"
                                                value={bulkSlot.end_time}
                                                onChange={e => setBulkSlot(prev => ({ ...prev, end_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-border">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                            <CheckCircle2 size={14} /> Automation Report
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-2">
                                            This action will generate <strong>{streams.length * 6}</strong> slots across the entire system.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsBulkModalOpen(false)}
                                        className="flex-1 py-4 border border-border rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingBulk}
                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSavingBulk ? <Loader2 size={16} className="animate-spin" /> : 'Execute'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Targeted Deletion Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                                    <Trash size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Targeted Deletion</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-muted-foreground font-medium text-sm">Remove slots matching specific criteria</p>
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        (Clear Filters)
                                    </button>
                                </div>
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

                            <form onSubmit={handleFilteredDelete} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stream Coverage</label>
                                        <select
                                            value={deleteFilters.stream_id}
                                            onChange={e => setDeleteFilters(prev => ({ ...prev, stream_id: e.target.value }))}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-rose-500 outline-none transition-all"
                                        >
                                            <option value="none">--- SELECT STREAM ---</option>
                                            <option value="all">ALL STREAMS</option>
                                            {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Day Coverage</label>
                                        <select
                                            value={deleteFilters.day_of_week}
                                            onChange={e => setDeleteFilters(prev => ({ ...prev, day_of_week: e.target.value }))}
                                            className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-rose-500 outline-none transition-all"
                                        >
                                            <option value="none">--- SELECT DAY ---</option>
                                            <option value="all">ALL DAYS (MON-SAT)</option>
                                            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time (Optional)</label>
                                            <input
                                                type="time"
                                                value={deleteFilters.start_time}
                                                onChange={e => setDeleteFilters(prev => ({ ...prev, start_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">End Time (Optional)</label>
                                            <input
                                                type="time"
                                                value={deleteFilters.end_time}
                                                onChange={e => setDeleteFilters(prev => ({ ...prev, end_time: e.target.value }))}
                                                className="w-full p-4 rounded-2xl bg-muted border border-border font-black text-sm focus:border-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-rose-500/5 rounded-2xl border border-dashed border-rose-500/20">
                                        <p className="text-[10px] text-rose-500/60 font-bold text-center">
                                            Warning: This will delete all slots matching these exact filters.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 py-4 border border-border rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDeletingBulk}
                                        className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDeletingBulk ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Deletion'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Wipe Confirmation Modal */}
            <AnimatePresence>
                {isWipeModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsWipeModalOpen(false)}
                            className="absolute inset-0 bg-red-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-rose-500/30 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                                    <AlertCircle size={40} className="text-rose-600" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">System Wipe</h3>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        This action cannot be undone. This will permanently delete <span className="text-rose-500 font-bold">ALL timetable slots</span> in the entire system.
                                    </p>
                                </div>

                                <div className="w-full space-y-4 bg-muted/30 p-6 rounded-2xl border border-border">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-left">
                                        Type <span className="text-foreground select-all">DELETE ALL TIMETABLES</span> to confirm
                                    </label>
                                    <input 
                                        type="text" 
                                        value={wipeConfirmationText}
                                        onChange={(e) => setWipeConfirmationText(e.target.value)}
                                        placeholder="DELETE ALL TIMETABLES"
                                        className="w-full p-4 rounded-xl bg-background border border-border font-bold text-center text-sm focus:border-rose-500 outline-none transition-all placeholder:text-muted-foreground/30"
                                        autoComplete="off"
                                        onPaste={(e) => e.preventDefault()}
                                    />
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setIsWipeModalOpen(false)}
                                        disabled={isClearing}
                                        className="flex-1 py-4 border border-border rounded-xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeWipe}
                                        disabled={wipeConfirmationText !== "DELETE ALL TIMETABLES" || isClearing}
                                        className="flex-[1.5] py-4 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isClearing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Wipe'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stream Timetable Modal */}
            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {confirmingResetStudent && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setConfirmingResetStudent(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-amber-500/30 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                                    <TriangleAlert size={40} className="text-amber-600" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Account Reset</h3>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        You are about to reset the account for <span className="text-foreground font-black">{confirmingResetStudent.full_name}</span>.
                                    </p>
                                </div>

                                <div className="w-full bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 text-left space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600">
                                        <ShieldAlert size={14} /> Critical Consequences
                                    </div>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                                            Active password will be permanently deleted
                                        </li>
                                        <li className="flex items-start gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                                            Student will be logged out of all devices
                                        </li>
                                        <li className="flex items-start gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                                            Mandatory re-onboarding required
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setConfirmingResetStudent(null)}
                                        disabled={!!resettingId}
                                        className="flex-1 py-4 border border-border rounded-xl font-black uppercase text-xs tracking-widest hover:bg-muted transition-all disabled:opacity-50"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={() => handleResetAccount(confirmingResetStudent)}
                                        disabled={!!resettingId}
                                        className="flex-[1.5] py-4 bg-amber-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-600/20 hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {resettingId ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Reset'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TimetableModal
                isOpen={!!selectedStream}
                onClose={() => setSelectedStream(null)}
                stream={selectedStream}
            />
        </div>
    );
}
