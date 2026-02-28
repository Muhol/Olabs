'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bell,
    Send,
    Loader2,
    AlertCircle,
    Users,
    BookOpen,
    Layers,
    School,
    Search,
    ChevronDown,
    Check
} from 'lucide-react';
import {
    createAnnouncement,
    fetchClasses,
    fetchStreams,
    fetchAllSubjects,
    fetchUserDetail
} from '@/lib/api';
import { useUserContext } from '@/context/UserContext';

interface CreateAnnouncementModalProps {
    tokenGetter: () => Promise<string | null>;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateAnnouncementModal({
    tokenGetter,
    onClose,
    onSuccess
}: CreateAnnouncementModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'SCHOOL' | 'STREAM' | 'SUBJECT' | 'STAFF'>('SCHOOL');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [streamId, setStreamId] = useState('');
    const [subjectId, setSubjectId] = useState('');

    const { userRole, systemUser } = useUserContext();
    const [userDetails, setUserDetails] = useState<any>(null);

    // List States
    const [classes, setClasses] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    // Combobox State
    const [subjectSearch, setSubjectSearch] = useState('');
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);

    useEffect(() => {
        loadMetadata();
    }, []);

    // Effect to set initial category based on role
    useEffect(() => {
        if (userRole === 'teacher') {
            setCategory('STREAM');
        } else {
            setCategory('SCHOOL');
        }
    }, [userRole]);



    // Effect to reset targets when category changes
    useEffect(() => {
        setSelectedClassId('');
        setStreamId('');
        setSubjectId('');
    }, [category]);

    const loadMetadata = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;

            // 1. Fetch Teacher Details if role is teacher
            if (userRole === 'teacher' && systemUser?.id) {
                const details = await fetchUserDetail(token, systemUser.id);
                setUserDetails(details);

                // Auto-select stream for class teachers
                if (details.assigned_stream_id) {
                    setSelectedClassId(details.assigned_class_id);
                    setStreamId(details.assigned_stream_id);
                }
            }

            // 2. Fetch Global Metadata only for Admins (or if needed for fallback)
            if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
                const [classesData, streamsData, subjectsData] = await Promise.all([
                    fetchClasses(token),
                    fetchStreams(token),
                    fetchAllSubjects(token)
                ]);

                setClasses(classesData);
                setStreams(streamsData);
                setSubjects(subjectsData);
            }
        } catch (err) {
            console.error('Failed to load metadata:', err);
            setError('Failed to load target options.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const token = await tokenGetter();
            if (!token) throw new Error('Authentication required');

            const payload: any = {
                title,
                content,
                category
            };

            if (category === 'STREAM') {
                if (!streamId) throw new Error('Please select a target stream');
                payload.stream_id = streamId;
                const targetStream = streams.find(s => s.id === streamId);
                if (targetStream) payload.class_id = targetStream.class_id;
            } else if (category === 'SUBJECT') {
                if (!subjectId) throw new Error('Please select a target subject');
                payload.subject_id = subjectId;
            }

            await createAnnouncement(token, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to dispatch announcement.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 "
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
                <div className="p-6 md:p-8 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">New Announcement</h3>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Central Dispatch Core</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4 rounded-b-[2.5rem] transition-all animate-in fade-in">
                            <div className="relative flex justify-center items-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Bell size={32} className="text-primary animate" />
                                </div>
                                <Loader2 className="absolute animate-spin text-primary" size={50} />
                            </div>
                            <div className="text-center">
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Announcement Title</label>
                            <input
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-3 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30"
                                placeholder="Enter a descriptive title..."
                            />
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dispatch Category</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {[
                                    { id: 'SCHOOL', label: 'School', icon: School, roles: ['admin', 'SUPER_ADMIN'] },
                                    { id: 'STAFF', label: 'Staff Only', icon: Users, roles: ['admin', 'SUPER_ADMIN'] },
                                    {
                                        id: 'STREAM',
                                        label: 'Stream',
                                        icon: Layers,
                                        roles: ['admin', 'SUPER_ADMIN', 'teacher'],
                                        tag: userRole === 'teacher' && userDetails?.assigned_stream_id ? 'Class' : null
                                    },
                                    {
                                        id: 'SUBJECT',
                                        label: 'Subject',
                                        icon: BookOpen,
                                        roles: ['admin', 'SUPER_ADMIN', 'teacher'],
                                        tag: userRole === 'teacher' && (userDetails?.subject_assignments?.length > 0) ? 'Subj' : null
                                    },
                                ].filter(cat => cat.roles.includes(userRole || '')).map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id as any)}
                                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 group relative ${category === cat.id
                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                                            }`}
                                    >
                                        {cat.tag && (
                                            <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest border shadow-sm ${category === cat.id ? 'bg-white text-primary border-white' : 'bg-primary text-white border-primary'
                                                }`}>
                                                {cat.tag}
                                            </span>
                                        )}
                                        <cat.icon size={16} className={category === cat.id ? 'text-primary-foreground' : 'text-primary transition-transform group-hover:scale-110'} />
                                        <span className="text-[9px] font-black uppercase tracking-tight text-center">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Targets */}
                        {category === 'STREAM' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Select Class</label>
                                    <select
                                        required
                                        value={selectedClassId}
                                        disabled={userRole === 'teacher' && !!userDetails?.assigned_class_id}
                                        onChange={e => {
                                            setSelectedClassId(e.target.value);
                                            setStreamId(''); // Reset stream when class changes
                                        }}
                                        className="w-full bg-muted/50 border border-border rounded-2xl px-4 md:px-5 py-3 text-xs md:text-sm font-bold focus:border-primary outline-none transition-all appearance-none disabled:opacity-80"
                                    >
                                        <option value="">Choose Class</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Select Stream</label>
                                    <select
                                        required
                                        disabled={!selectedClassId || (userRole === 'teacher' && !!userDetails?.assigned_stream_id)}
                                        value={streamId}
                                        onChange={e => setStreamId(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-2xl px-4 md:px-5 py-3 text-xs md:text-sm font-bold focus:border-primary outline-none transition-all appearance-none disabled:opacity-80"
                                    >
                                        <option value="">{selectedClassId ? 'Choose Stream' : 'Select Class'}</option>
                                        {streams.filter(s => s.class_id === selectedClassId).map(stream => (
                                            <option key={stream.id} value={stream.id}>
                                                {stream.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {category === 'SUBJECT' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300 relative">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Target Subject</label>

                                <div className="relative group/combo">
                                    <div className={`relative flex items-center transition-all ${isSubjectOpen ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''}`}>
                                        <div className="absolute left-4 text-muted-foreground transition-colors group-focus-within/combo:text-primary">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search Subject, Class or Stream..."
                                            value={subjectId ?
                                                (userRole === 'teacher' && userDetails?.subject_assignments ?
                                                    userDetails.subject_assignments.find((sa: any) => sa.subject_id === subjectId)?.subject_name + ' (' + userDetails.subject_assignments.find((sa: any) => sa.subject_id === subjectId)?.class_name + ' ' + (userDetails.subject_assignments.find((sa: any) => sa.subject_id === subjectId)?.stream_name || '') + ')'
                                                    : subjects.find(s => (s.subject_id || s.id) === subjectId)?.name + ' (' + subjects.find(s => (s.subject_id || s.id) === subjectId)?.class_name + (subjects.find(s => (s.subject_id || s.id) === subjectId)?.stream_name ? ' ' + subjects.find(s => (s.subject_id || s.id) === subjectId)?.stream_name : '') + ')'
                                                )
                                                : subjectSearch
                                            }
                                            onFocus={() => {
                                                setIsSubjectOpen(true);
                                                if (subjectId) {
                                                    setSubjectSearch('');
                                                    setSubjectId('');
                                                }
                                            }}
                                            onChange={(e) => {
                                                setSubjectSearch(e.target.value);
                                                setSubjectId('');
                                                setIsSubjectOpen(true);
                                            }
                                            }
                                            className="w-full bg-muted/50 border border-border rounded-2xl pl-11 pr-12 py-3 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                                            className="absolute right-4 p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                                        >
                                            <ChevronDown size={18} className={`transition-transform duration-300 ${isSubjectOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isSubjectOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-[100] overflow-hidden max-h-[240px] flex flex-col"
                                            >
                                                <div className="overflow-y-auto custom-scrollbar">
                                                    {(userRole === 'teacher' ? userDetails?.subject_assignments || [] : subjects)
                                                        .filter((s: any) => {
                                                            const searchTerms = subjectSearch.toLowerCase().split(' ').filter(term => term.length > 0);
                                                            if (searchTerms.length === 0) return true;

                                                            const name = (s.subject_name || s.name || '').toLowerCase();
                                                            const cls = (s.class_name || '').toLowerCase();
                                                            const strm = (s.stream_name || '').toLowerCase();

                                                            // Every search term must match at least one of the fields
                                                            return searchTerms.every(term =>
                                                                name.includes(term) || cls.includes(term) || strm.includes(term)
                                                            );
                                                        }).length === 0 ? (
                                                        <div className="p-8 text-center flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                                <Search size={20} />
                                                            </div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No subjects found</p>
                                                        </div>
                                                    ) : (
                                                        (userRole === 'teacher' ? userDetails?.subject_assignments || [] : subjects)
                                                            .filter((s: any) => {
                                                                const searchTerms = subjectSearch.toLowerCase().split(' ').filter(term => term.length > 0);
                                                                if (searchTerms.length === 0) return true;

                                                                const name = (s.subject_name || s.name || '').toLowerCase();
                                                                const cls = (s.class_name || '').toLowerCase();
                                                                const strm = (s.stream_name || '').toLowerCase();

                                                                return searchTerms.every(term =>
                                                                    name.includes(term) || cls.includes(term) || strm.includes(term)
                                                                );
                                                            })
                                                            .map((s: any) => {
                                                                const sid = s.subject_id || s.id;
                                                                const isSelected = subjectId === sid;
                                                                return (
                                                                    <button
                                                                        key={sid}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSubjectId(sid);
                                                                            setSubjectSearch('');
                                                                            setIsSubjectOpen(false);
                                                                        }}
                                                                        className={`w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${isSelected ? 'bg-primary/5' : ''}`}
                                                                    >
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className={`text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-primary' : ''}`}>
                                                                                {s.subject_name || s.name}
                                                                            </span>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                                {s.class_name} {s.stream_name ? `• ${s.stream_name}` : ''}
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && <Check size={16} className="text-primary" />}
                                                                    </button>
                                                                );
                                                            })
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dispatch Content</label>
                            <textarea
                                required
                                rows={4}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-4 text-xs md:text-sm font-medium focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 resize-none"
                                placeholder="Compose your announcement message..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Dispatching...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Dispatch Announcement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
