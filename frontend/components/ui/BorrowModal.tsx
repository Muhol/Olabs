'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck, AlertCircle, Book } from 'lucide-react';
import { fetchStudents, borrowBook } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

interface BorrowModalProps {
  book: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void; // Changed from onSuccess to onRefresh
}

const BorrowModal: React.FC<BorrowModalProps> = ({ book, isOpen, onClose, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const { getToken } = useAuth();

  const searchStudents = async () => {
    if (!searchTerm) return;
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetchStudents(token || '');
      // Handle paginated response
      const results = response.items || [];
      setStudents(results.filter((s: any) =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (studentId: string) => {
    try {
      setBorrowing(true);
      const token = await getToken();
      await borrowBook(token || '', book.id, studentId);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBorrowing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Authorize Borrowing</h2>
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Book size={16} /> {book.title}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search Student (Name or Admission #)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold focus:border-primary outline-none transition-all"
              />
              <button
                onClick={searchStudents}
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Scan Matrix'}
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-primary/30 transition-all group"
                >
                  <div>
                    <p className="font-black text-sm uppercase">{student.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">ID: {student.admission_number}</p>
                  </div>
                  <button
                    onClick={() => handleBorrow(student.id)}
                    disabled={borrowing}
                    className="px-6 py-2 bg-slate-200 dark:bg-white/10 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Authorize
                  </button>
                </div>
              ))}
              {students.length === 0 && !loading && searchTerm && (
                <p className="text-center py-8 text-xs font-bold text-slate-500 uppercase tracking-widest italic">No matching student records found</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={18} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
            By authorizing this transaction, you confirm student eligibility and assume responsibility for asset tracking.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BorrowModal;
