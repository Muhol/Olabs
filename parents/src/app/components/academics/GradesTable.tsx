type Grade = { subject: string; grade: string; score: string };

export default function GradesTable({ grades, termName }: { grades: Grade[]; termName: string }) {
    return (
        <section className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border/30 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-foreground">{termName} Summary</h2>
                    <button className="text-sm font-medium text-red-accent hover:opacity-80">Download PDF</button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-sm border-b border-border/30">
                                <th className="px-5 py-3 font-semibold text-foreground/80">Subject</th>
                                <th className="px-5 py-3 font-semibold text-foreground/80 whitespace-nowrap">Assessment Type</th>
                                <th className="px-5 py-3 font-semibold text-foreground/80 text-right w-24">Grade</th>
                                <th className="px-5 py-3 font-semibold text-foreground/80 text-right w-24">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {grades.map((item, i) => (
                                <tr key={i} className="hover:bg-background/50 transition-colors">
                                    <td className="px-5 py-4 text-foreground font-medium">{item.subject}</td>
                                    <td className="px-5 py-4 text-foreground/60 text-sm">Continuous Assessment</td>
                                    <td className="px-5 py-4 text-foreground font-bold text-right">{item.grade}</td>
                                    <td className="px-5 py-4 text-orange-accent font-medium text-right">{item.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
