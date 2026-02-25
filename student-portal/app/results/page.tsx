"use client";

import { useEffect, useState } from "react";
import { Printer, Loader2, FileText } from "lucide-react";
import { fetchJSON } from "@/lib/api";
import ReportCardDownloadModal from "@/components/modals/ReportCardDownloadModal";

const LEVEL_TAG: Record<string, string> = {
    EE: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    ME: "bg-blue-100 text-blue-700 border border-blue-300",
    AE: "bg-amber-100 text-amber-700 border border-amber-300",
    BE: "bg-rose-100 text-rose-700 border border-rose-300",
    "N/A": "bg-gray-100 text-gray-500 border border-gray-200"
};

export default function StudentResults() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        fetchJSON("/api/student/portal/results")
            .then(setResults)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const years = Object.keys(results).sort((a, b) => b.localeCompare(a));

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Academic Results</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Your term-by-term performance record</p>
                </div>
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Printer size={15} /> Download Report Card
                </button>
            </div>

            {years.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
                    <FileText size={40} className="text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-semibold text-muted-foreground">No results yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Results will appear here once grading is complete.</p>
                </div>
            ) : (
                years.map(year => (
                    <div key={year} className="space-y-8">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                            {year} Academic Year
                        </h2>

                        {Object.keys(results[year]).sort((a, b) => b.localeCompare(a)).map(term => {
                            const termData = results[year][term];
                            const exams: string[] = termData.exams;
                            const subjects: any[] = termData.subjects;

                            return (
                                <div key={term}>
                                    <h3 className="text-sm font-bold text-foreground mb-2">{term}</h3>

                                    <div className="overflow-x-auto rounded-lg border border-border">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-muted/50">
                                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border w-40">
                                                        Subject
                                                    </th>
                                                    {exams.map(exam => (
                                                        <th key={exam} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border border-l text-center">
                                                            {exam}
                                                        </th>
                                                    ))}
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border border-l text-center">
                                                        Avg %
                                                    </th>
                                                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border border-l text-center">
                                                        Grade
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {subjects.map((sub: any, i: number) => (
                                                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-2.5 font-medium text-foreground text-xs">
                                                            {sub.name}
                                                        </td>
                                                        {exams.map(exam => (
                                                            <td key={exam} className="px-4 py-2.5 text-center border-l border-border text-xs tabular-nums text-muted-foreground">
                                                                {sub.scores[exam] !== undefined
                                                                    ? sub.scores[exam].toFixed(1)
                                                                    : <span className="text-muted-foreground/30">—</span>
                                                                }
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-2.5 text-center border-l border-border text-xs tabular-nums font-semibold text-foreground">
                                                            {sub.average !== undefined && sub.average !== null
                                                                ? `${sub.average.toFixed(1)}%`
                                                                : <span className="text-muted-foreground/30">—</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center border-l border-border">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${LEVEL_TAG[sub.grade] || LEVEL_TAG["N/A"]}`}>
                                                                {sub.grade || "N/A"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}

            <ReportCardDownloadModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
}
