"use client";

import { useEffect, useState } from "react";
import {
    Wallet,
    History,
    Download,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    FileText,
    CreditCard,
    Building,
    Loader2,
    Calendar
} from "lucide-react";

export default function StudentFees() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/portal/ledger`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const filteredHistory = data?.history.filter((item: any) =>
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (loading) {
        return <div className="space-y-12 animate-pulse">
            <div className="h-48 bg-muted rounded-[3rem] border border-border" />
            <div className="h-96 bg-muted rounded-[3rem] border border-border" />
        </div>;
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                        <Wallet size={14} /> My Finances
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter">Finance Overview</h1>
                    <p className="text-muted-foreground font-medium max-w-md">Track your school fees, payments, and account balance in real-time.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button className="px-8 py-4 bg-muted border border-border text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-muted/80 transition-all active:scale-95 flex items-center gap-3">
                        <Download className="w-5 h-5 text-secondary" /> Download Statement
                    </button>
                    <button className="px-10 py-5 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-secondary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                        <CreditCard className="w-5 h-5" /> Make Payment
                    </button>
                </div>
            </div>

            {/* Financial Core Metrics */}
            <section className="relative overflow-hidden bg-card border border-border rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-black/5 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full translate-x-24 -translate-y-24" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center text-secondary-foreground shadow-2xl shadow-secondary/20 shadow-inner">
                            <Wallet size={40} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Current Balance</p>
                            <h2 className="text-5xl font-black text-foreground tracking-tighter tabular-nums">KES {data.balance.toLocaleString()}</h2>
                        </div>
                    </div>
                    <div className="h-16 w-[1px] bg-border hidden md:block" />
                    <div className="grid grid-cols-2 gap-12 text-center md:text-left">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Fees</p>
                            <p className="text-xl font-black text-foreground/70 tabular-nums">KES {data.history.reduce((acc: number, item: any) => item.type === 'charge' ? acc + item.amount : acc, 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Paid</p>
                            <p className="text-xl font-black text-primary tabular-nums">KES {data.history.reduce((acc: number, item: any) => item.type === 'payment' ? acc + item.amount : acc, 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transaction Ledger */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-4">
                        <History className="text-secondary" size={24} /> Transaction History
                    </h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-muted-foreground uppercase tracking-widest shadow-xl"
                        />
                    </div>
                </div>

                <div className="bg-card/40 border border-border rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border">
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Type</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Date</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Description</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-all group">
                                            <td className="px-10 py-8 text-center">
                                                <div className={`inline-flex p-3 rounded-xl border ${item.type === 'charge' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary/10 text-primary border-primary/20'} group-hover:scale-110 transition-transform`}>
                                                    {item.type === 'charge' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-sm font-black text-muted-foreground tabular-nums uppercase tracking-widest">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <p className="font-black text-lg text-foreground uppercase tracking-tight">{item.description}</p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.type === 'charge' ? 'Fee Charge' : 'Payment Received'}</p>
                                                </div>
                                            </td>
                                            <td className={`px-10 py-8 text-right text-xl font-black tabular-nums ${item.type === 'charge' ? 'text-foreground' : 'text-primary'}`}>
                                                {item.type === 'charge' ? '-' : '+'} KES {item.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center opacity-40">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <FileText className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No Transactions Recorded</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
