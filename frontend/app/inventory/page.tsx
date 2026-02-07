'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Plus,
    Search,
    Filter,
    BookOpen,
    Edit,
    Trash2,
    Loader2,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw
} from 'lucide-react';
import { fetchBooks, createBook, updateBook, deleteBook, borrowBook, fetchStudents } from '@/lib/api';
import { useUserContext } from '@/context/UserContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
    const { getToken } = useAuth();
    const { userRole } = useUserContext();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [skip, setSkip] = useState(0);
    const [limit] = useState(15);
    const [totalBooks, setTotalBooks] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Management State
    const [editingBook, setEditingBook] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formData, setFormData] = useState({
        book_id: '',
        title: '',
        author: '',
        category: '',
        subject: '',
        isbn: '',
        total_copies: 1
    });

    // Borrow State
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);
    const [admissionNumberSearch, setAdmissionNumberSearch] = useState('');
    const [foundStudent, setFoundStudent] = useState<any>(null);
    const [borrowLoading, setBorrowLoading] = useState(false);

    // Modal Error States
    const [modalError, setModalError] = useState('');
    const [borrowError, setBorrowError] = useState('');

    const isAuthorized = ['admin', 'SUPER_ADMIN', 'librarian'].includes(userRole);
    const canManage = ['admin', 'SUPER_ADMIN'].includes(userRole);

    // Scroll Lock when any modal is open
    useScrollLock(isModalOpen || isBorrowModalOpen);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadBooks();
        }, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [skip, search]);

    // Reset page on search
    useEffect(() => {
        setSkip(0);
    }, [search]);

    const loadBooks = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            if (!token) {
                console.warn('[INVENTORY] Token not available yet, skipping fetch');
                setLoading(false);
                return;
            }
            const data = await fetchBooks(token, skip, limit, search);
            setBooks(data.items);
            setTotalBooks(data.total);
        } catch (err) {
            setError('Failed to load books from library system.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setModalError('');
        try {
            const token = await getToken();
            if (!token) {
                setModalError('Authentication required. Please refresh the page.');
                setActionLoading(false);
                return;
            }

            if (editingBook) {
                await updateBook(token, editingBook.id, formData);
            } else {
                await createBook(token, formData);
            }

            setIsModalOpen(false);
            setEditingBook(null);
            resetForm();
            loadBooks();
        } catch (err: any) {
            setModalError(err.message || 'Operation failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this book from the library?')) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please refresh the page.');
                setActionLoading(false);
                return;
            }
            await deleteBook(token, id);
            loadBooks();
        } catch (err: any) {
            setError('Deletion failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSearchStudent = async () => {
        if (!admissionNumberSearch) return;
        setBorrowLoading(true);
        setBorrowError('');
        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please refresh the page.');
                setBorrowLoading(false);
                return;
            }
            // Use the search parameter to find the student on the server
            // Fetch with limit 1, as we expect a unique admission number or just need the first match
            const studentsData = await fetchStudents(token, 0, 5, admissionNumberSearch);
            
            // The search on the backend likely searches name and admission number.
            // We can double check if we got a match.
            const student = studentsData.items.find((s: any) => 
                s.admission_number.toLowerCase() === admissionNumberSearch.toLowerCase()
            );

            if (student) {
                setFoundStudent(student);
            } else {
                // If specific match not found but we got results, maybe the user typed a name?
                // But the UI says "Admission Number", so let's stick to strict matching or 
                // if the backend search is good enough, maybe we just take the first one?
                // For now, let's trust the backend search returns relevant results and we filter for exact admission number match to be safe, 
                // OR if the user intends to search by name too, we could allow that.
                // The input label says "Admission Number" so we should verify it matches.
                setBorrowError('Student not found with that Admission Number.');
            }
        } catch (err) {
            setBorrowError('Student lookup failed.');
        } finally {
            setBorrowLoading(false);
        }
    };

    const handleExecuteBorrow = async () => {
        if (!selectedBookForBorrow || !foundStudent) return;
        setBorrowLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required. Please refresh the page.');
                setBorrowLoading(false);
                return;
            }
            await borrowBook(token, selectedBookForBorrow.id, foundStudent.id);
            setIsBorrowModalOpen(false);
            setFoundStudent(null);
            setAdmissionNumberSearch('');
            loadBooks();
            loadBooks();
        } catch (err: any) {
            setBorrowError(err.message || 'Borrow failed.');
        } finally {
            setBorrowLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            book_id: '',
            title: '',
            author: '',
            category: '',
            subject: '',
            isbn: '',
            total_copies: 1
        });
    };

    const filteredBooks = books;

    const PaginationControls = () => (
        <div className="flex items-center justify-between px-8 py-4 bg-muted/30 border border-border rounded-[2rem] backdrop-blur-xl transition-colors">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Library Books: {Math.min(skip + 1, totalBooks)} - {Math.min(skip + limit, totalBooks)} of {totalBooks}
            </div>
            <div className="flex gap-2">
                <button
                    disabled={skip === 0 || loading}
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {loading && skip > 0 ? <Loader2 size={12} className="animate-spin" /> : null} Previous
                </button>
                <button
                    disabled={skip + limit >= totalBooks || loading}
                    onClick={() => setSkip(skip + limit)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    Next {loading && skip + limit < totalBooks ? <Loader2 size={12} className="animate-spin" /> : null}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <BookOpen size={14} /> Library Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Library Books</h1>
                    <p className="text-muted-foreground font-medium tracking-tight">Manage your library catalog and monitor book availability.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={loadBooks} className="p-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-all active:scale-95">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => { resetForm(); setEditingBook(null); setIsModalOpen(true); setModalError(''); }} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Plus size={18} /> Add New Book
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <button onClick={loadBooks} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary hover:text-primary transition-colors z-10">
                        <Search size={20} />
                    </button>
                    <input type="text" placeholder="Search by title, ID, or author..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadBooks()} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50" />
                </div>
                <button className="flex items-center gap-3 px-6 py-4 bg-muted border border-border text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-foreground hover:bg-muted/80 transition-all">
                    <Filter size={18} /> Advanced Filters
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                    <XCircle size={16} /> {error}
                </div>
            )}

            <div className="space-y-4">
                <PaginationControls />
                <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card transition-colors">
                    <AnimatePresence mode="wait">
                        <motion.div key={skip} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Book ID</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Book Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Category</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Availability</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                                                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Loading Library...</p>
                                            </td>
                                        </tr>
                                    ) : filteredBooks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <p className="font-black uppercase tracking-widest text-muted-foreground/60">No books found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBooks.map((book) => (
                                            <tr key={book.id} className="hover:bg-muted/30 transition-colors group border-b border-border/50">
                                                <td className="px-8 py-4">
                                                    <span className="font-black text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">{book.book_id}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-black text-foreground text-base leading-none group-hover:text-primary transition-colors">{book.title}</div>
                                                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{book.author}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-foreground/80">{book.category}</div>
                                                        {book.subject && <div className="text-[10px] font-black text-secondary uppercase tracking-widest">{book.subject}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all duration-1000 ${book.available ? 'bg-primary' : 'bg-rose-500'}`} style={{ width: `${(book.total_copies - book.borrowed_copies) / book.total_copies * 100}%` }} />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${book.available ? 'text-primary' : 'text-rose-500'}`}>{book.total_copies - book.borrowed_copies} / {book.total_copies} Available</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {book.available && (
                                                            <button onClick={() => { setSelectedBookForBorrow(book); setIsBorrowModalOpen(true); setBorrowError(''); setFoundStudent(null); setAdmissionNumberSearch(''); }} className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl border border-primary/20 transition-all active:scale-95">Borrow</button>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => { setEditingBook(book); setFormData(book); setIsModalOpen(true); setModalError(''); }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"><Edit size={16} /></button>
                                                            {canManage && <button onClick={() => handleDelete(book.id)} className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    </AnimatePresence>
                    <div className="bg-muted/30 border-t border-border">
                        <PaginationControls />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isBorrowModalOpen && (
                    <div className="fixed inset-0 h-screen z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBorrowModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md glass-card rounded-[2rem] md:rounded-[3rem] border border-border bg-card p-6 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary border border-primary/20 mx-auto mb-6"><Clock size={40} className="animate-pulse" /></div>
                                <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Borrow Book</h3>
                            </div>
                            {borrowError && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                    <XCircle size={14} /> {borrowError}
                                </div>
                            )}
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-muted border border-border">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selected Book</div>
                                    <div className="text-lg font-black text-foreground">{selectedBookForBorrow?.title}</div>
                                </div>
                                <Input label="Admission Number" value={admissionNumberSearch} onChange={(e: any) => setAdmissionNumberSearch(e.target.value)} placeholder="ADM/2024/..." />
                                <button onClick={handleSearchStudent} disabled={borrowLoading} className="w-full py-4 bg-muted border border-border text-foreground font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-muted/80 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30">
                                    {borrowLoading && !foundStudent ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Find Student
                                </button>
                                {foundStudent && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        <p className="text-emerald-500 font-black uppercase text-xs">Verified: {foundStudent.full_name}</p>
                                        <button onClick={handleExecuteBorrow} disabled={borrowLoading} className="w-full mt-4 py-4 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 hover:bg-emerald-600 flex items-center justify-center gap-2">
                                            {borrowLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                            Confirm Borrow
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 h-screen z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-200/80 dark:bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-lg glass-card rounded-[2rem] md:rounded-[3rem] border border-border bg-card p-6 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-3xl font-black text-foreground uppercase text-center mb-10">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
                            {modalError && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                    <XCircle size={14} /> {modalError}
                                </div>
                            )}
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Book ID" value={formData.book_id} onChange={(e: any) => setFormData({ ...formData, book_id: e.target.value })} disabled={!!editingBook} />
                                <Input label="Title" value={formData.title} onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} />
                                <Input label="Author" value={formData.author} onChange={(e: any) => setFormData({ ...formData, author: e.target.value })} />
                                <Input label="Category" value={formData.category} onChange={(e: any) => setFormData({ ...formData, category: e.target.value })} />
                                <Input label="Subject" value={formData.subject} onChange={(e: any) => setFormData({ ...formData, subject: e.target.value })} />
                                <Input label="ISBN" value={formData.isbn} onChange={(e: any) => setFormData({ ...formData, isbn: e.target.value })} />
                                <Input type="number" label="Copies" value={formData.total_copies} onChange={(e: any) => setFormData({ ...formData, total_copies: parseInt(e.target.value) })} />
                                <div className="md:col-span-2 pt-6 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-muted text-foreground font-black uppercase text-xs tracking-widest rounded-2xl transition-all active:scale-95 border border-border">Abort</button>
                                    <button disabled={actionLoading} type="submit" className="flex-2 py-4 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                        {editingBook ? 'Update Book' : 'Save Book'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Input({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <input {...props} className="w-full px-4 py-3.5 rounded-xl bg-input border border-border text-foreground font-bold text-sm focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50" />
        </div>
    );
}
