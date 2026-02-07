'use client';

import React, { useState } from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import BorrowModal from './BorrowModal';

interface BookProps {
  book: any;
  onRefresh?: () => void;
}

const BookCard: React.FC<BookProps> = ({ book, onRefresh }) => {
  const { user } = useUser();
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  
  const userRole = (user?.publicMetadata?.role as string) || 'student';
  const canBorrow = ['librarian', 'admin', 'SUPER_ADMIN'].includes(userRole);

  return (
    <div className="group glass-card rounded-2xl p-6 transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] cursor-pointer flex flex-col h-full overflow-hidden">
      <div className="bg-gradient-to-br from-primary to-secondary h-44 rounded-xl mb-4 flex items-center justify-center text-white shadow-inner relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <BookOpen size={56} className="group-hover:scale-110 transition-transform duration-500 z-10" />
      </div>
      
      <div className="mb-3 text-center">
        <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-md font-mono text-[10px] border border-secondary/20 font-bold">
          # {book.book_id}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
          {book.title}
        </h3>
        <p className="text-slate-500 mb-4 text-xs font-medium">{book.author}</p>
        
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] uppercase font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700">
            {book.subject}
          </span>
          <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-lg border ${
            book.available 
              ? 'bg-primary/10 text-primary border-primary/30' 
              : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
          }`}>
            {book.available ? 'AUTHORIZED' : 'OUT OF STOCK'}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Inventory</span>
            <span className="text-secondary">{book.total_copies} Units</span>
          </div>
          
          <div className="w-full bg-secondary/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ${
                book.borrowed_copies >= book.total_copies ? 'bg-rose-500' : 'bg-gradient-to-r from-primary to-secondary'
              }`}
              style={{ width: `${(book.borrowed_copies / book.total_copies) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest pt-1">
            <span className="text-slate-500">Allocation</span>
            <span className={book.borrowed_copies > 0 ? 'text-primary' : 'text-slate-600'}>
              {book.borrowed_copies} /{book.total_copies}
            </span>
          </div>
        </div>
      </div>

      {canBorrow && book.available && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsBorrowModalOpen(true);
          }}
          className="w-full py-3 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded-xl font-black tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 hover:shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
        >
          <ShieldCheck size={14} /> AUTHORIZE BORROW
        </button>
      )}

      <BorrowModal 
        book={book} 
        isOpen={isBorrowModalOpen} 
        onClose={() => setIsBorrowModalOpen(false)}
        onRefresh={() => onRefresh && onRefresh()}
      />
    </div>
  );
};

export default BookCard;
