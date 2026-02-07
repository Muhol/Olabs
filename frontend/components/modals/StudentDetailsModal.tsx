'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    User, 
    BookOpen, 
    History, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Building2,
    Layers,
    BadgeCheck,
    Loader2
} from 'lucide-react';
import { fetchBorrowHistory, clearStudent, returnBook } from '@/lib/api';

interface StudentDetailsModalProps {
    student: any;
    onClose: () => void;
    tokenGetter: () => Promise<string | null>;
    onUpdate?: () => void; // Optional callback to refresh parent
}

export default function StudentDetailsModal({ student, onClose, tokenGetter, onUpdate }: StudentDetailsModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [returningId, setReturningId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalBorrowed: 0,
        currentlyHolding: 0,
        overdue: 0
    });
    const [localStudent, setLocalStudent] = useState(student);

    useEffect(() => {
        loadHistory();
    }, [student.id]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            const data = await fetchBorrowHistory(token, 0, 100, '', student.id);
            setHistory(data.items);
            
            // Calculate stats
            const currentlyHolding = data.items.filter((r: any) => r.status === 'borrowed').length;
            const overdue = data.items.filter((r: any) => {
                const now = new Date();
                const dueDate = new Date(r.due_date);
                return r.status === 'borrowed' && dueDate < now;
            }).length;

            setStats({
                totalBorrowed: data.total,
                currentlyHolding,
                overdue
            });
        } catch (err) {
            console.error('Failed to load borrowing history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearance = async () => {
        if (!confirm('Are you sure you want to clear this student? This action is permanent.')) return;
        
        setClearing(true);
        try {
            const token = await tokenGetter();
            if (!token) return;
            await clearStudent(token, student.id);
            setLocalStudent({ ...localStudent, is_cleared: true, cleared_at: new Date().toISOString() });
            if (onUpdate) onUpdate();
        } catch (err: any) {
            alert(err.message || 'Clearance failed');
        } finally {
            setClearing(false);
        }
    };

    const handleReturn = async (transactionId: string) => {
        if (!confirm('Mark this book as returned?')) return;
        setReturningId(transactionId);
        try {
            const token = await tokenGetter();
            if (!token) return;
            await returnBook(token, transactionId);
            loadHistory();
            if (onUpdate) onUpdate();
        } catch (err: any) {
            alert(err.message || 'Return failed');
        } finally {
            setReturningId(null);
        }
    };

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
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 20, scale: 0.95 }} 
                className="relative w-full max-w-4xl glass-card rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header Section */}
                <div className="p-8 border-b border-border bg-muted/30 relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-20 h-20 rounded-3xl bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                            <User size={40} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">{localStudent.full_name}</h2>
                                {localStudent.is_cleared ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <BadgeCheck size={12} /> Cleared
                                    </div>
                                ) : (
                                    <BadgeCheck size={20} className="text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-secondary" /> {localStudent.class_name || 'No Class'}</span>
                                <span className="flex items-center gap-1.5"><Layers size={14} className="text-primary" /> {localStudent.stream || localStudent.full_class || 'No Stream'}</span>
                                <span className="flex items-center gap-1.5 text-secondary">ADM: {localStudent.admission_number}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-6 rounded-[2rem] bg-secondary/10 border border-secondary/20 space-y-2">
                            <div className="flex justify-between items-center">
                                <History size={20} className="text-secondary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Lifetime</span>
                            </div>
                            <div className="text-3xl font-black text-foreground">{stats.totalBorrowed}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Books Borrowed</div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                            <div className="flex justify-between items-center">
                                <BookOpen size={20} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Active</span>
                            </div>
                            <div className="text-3xl font-black text-foreground">{stats.currentlyHolding}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Holding</div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 space-y-2">
                            <div className="flex justify-between items-center">
                                <AlertCircle size={20} className="text-rose-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Alert</span>
                            </div>
                            <div className="text-3xl font-black text-foreground">{stats.overdue}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overdue Books</div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                <History className="text-secondary" size={20} /> Borrowing History
                            </h3>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1.5 rounded-lg border border-border">
                                {history.length} RECORDS FOUND
                            </div>
                        </div>

                        <div className="border border-border rounded-3xl overflow-hidden bg-muted/10">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Book Title</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Borrow Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Return Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <Loader2 className="animate-spin text-secondary mx-auto mb-4" size={32} />
                                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Retrieving Records...</p>
                                            </td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Clear Record Profile</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">No transactions found for this student</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((record) => (
                                            <tr key={record.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-4 text-center">
                                                    {record.status === 'returned' ? (
                                                        <div className="inline-flex p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                            <CheckCircle2 size={16} />
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex p-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 shadow-lg shadow-secondary/5 animate-pulse">
                                                            <Clock size={16} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground line-clamp-1">{record.book}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                        <Calendar size={12} /> {new Date(record.borrow_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-xs font-black uppercase tracking-tighter flex items-center gap-1.5 ${
                                                        record.status === 'borrowed' && new Date(record.due_date) < new Date() 
                                                        ? 'text-rose-500' 
                                                        : 'text-muted-foreground'
                                                    }`}>
                                                        {new Date(record.due_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.return_date ? (
                                                        <div className="text-xs font-bold text-emerald-500">
                                                            {new Date(record.return_date).toLocaleDateString()}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Outstanding</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {record.status === 'borrowed' && (
                                                        <button 
                                                            onClick={() => handleReturn(record.id)}
                                                            disabled={returningId === record.id}
                                                            className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-lg border border-secondary/20 transition-all active:scale-95 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            {returningId === record.id ? <Loader2 size={10} className="animate-spin" /> : 'Return'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border bg-muted/30 flex justify-between items-center">
                    <div>
                        {!localStudent.is_cleared && (
                            <button 
                                onClick={handleClearance}
                                disabled={clearing || stats.currentlyHolding > 0}
                                className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl border border-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {clearing ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} 
                                {stats.currentlyHolding > 0 ? 'Clearance Blocked' : 'Approve Clearance'}
                            </button>
                        )}
                        {localStudent.is_cleared && (
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Cleared on {new Date(localStudent.cleared_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-secondary text-secondary-foreground font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        Close Profile
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
