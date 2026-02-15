"use client";

import { useEffect, useState } from "react";
import {
    Award,
    PiSquare,
    TrendingUp,
    ChevronDown,
    Printer,
    FileSpreadsheet,
    Minus,
    Loader2,
    FileText,
    ShieldCheck,
    Zap
} from "lucide-react";

export default function StudentResults() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/portal/results`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setResults)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="space-y-16 animate-pulse">
            {[1, 2].map(i => (
                <div key={i} className="space-y-6">
                    <div className="h-10 w-64 bg-muted rounded-xl" />
                    <div className="h-96 bg-muted rounded-[3rem] border border-border" />
                </div>
            ))}
        </div>;
    }

    const years = Object.keys(results).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-16 animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                        <Award size={14} /> My Grades
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter">Academic Results</h1>
                    <p className="text-muted-foreground font-medium max-w-md">View your history of graded assessments and evaluations.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button className="px-8 py-4 bg-muted border border-border text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-muted/80 transition-all active:scale-95 flex items-center gap-3">
                        <Printer className="w-5 h-5 text-secondary" /> Export PDF Report
                    </button>
                    <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5" /> Download CSV
                    </button>
                </div>
            </div>

            {years.length > 0 ? (
                years.map(year => (
                    <div key={year} className="space-y-12">
                        <div className="flex items-center gap-8 group">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-border" />
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all duration-500">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-muted-foreground uppercase tracking-[0.2em]">{year} Academic Year</h2>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-border to-border" />
                        </div>

                        <div className="grid grid-cols-1 gap-16">
                            {Object.keys(results[year]).map((term, termIdx) => (
                                <div key={term} className="space-y-6">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-10 bg-primary rounded-full" />
                                            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">{term}</h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20 uppercase tracking-[0.1em]">
                                            <TrendingUp className="w-4 h-4" /> Good Standing
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 relative group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full translate-x-32 -translate-y-32" />

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left min-w-[900px]">
                                                <thead>
                                                    <tr className="bg-muted/40 border-b border-border">
                                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Subject</th>
                                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Exam Type</th>
                                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Marks</th>
                                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Grade</th>
                                                        <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {results[year][term].map((res: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-muted/30 transition-all group/row">
                                                            <td className="px-10 py-8">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover/row:bg-secondary/10 group-hover/row:text-secondary transition-all border border-border">
                                                                        <Zap size={18} />
                                                                    </div>
                                                                    <span className="font-black text-lg text-foreground uppercase tracking-tight">{res.subject}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-8">
                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                                                                    {res.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-10 py-8 text-center">
                                                                <div className="space-y-1">
                                                                    <span className={`text-2xl font-black tabular-nums ${res.marks >= 50 ? "text-emerald-500" : "text-rose-500"} drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]`}>
                                                                        {res.marks}
                                                                    </span>
                                                                    <span className="text-muted-foreground text-xs font-black uppercase tracking-tighter"> / 100</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-8 text-center text-xl font-black text-foreground uppercase">{res.grade || "-"}</td>
                                                            <td className="px-10 py-8">
                                                                <div className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-2 max-w-xs">{res.remarks || "No remarks provided."}</div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-32 bg-muted/10 border border-dashed border-border rounded-[3rem] text-center opacity-40 shadow-inner">
                    <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mb-6 text-muted-foreground shadow-xl border border-border">
                        <Award className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase mb-2">No Results Found</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground max-w-xs leading-loose">
                        Your academic transcript is currently empty. <br />
                        Results will appear here once exams are graded.
                    </p>
                </div>
            )}
        </div>
    );
}
