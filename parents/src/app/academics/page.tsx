export default function AcademicsPage() {
    const semesters = [
        { name: "Term 1, 2026", active: true },
        { name: "Term 2, 2025", active: false },
        { name: "Term 1, 2025", active: false },
    ];

    const grades = [
        { subject: "Mathematics", grade: "A", score: "92%" },
        { subject: "English Language", grade: "B+", score: "88%" },
        { subject: "Integrated Science", grade: "A-", score: "90%" },
        { subject: "Social Studies", grade: "B", score: "84%" }
    ];

    return (
        <div className="bg-background flex flex-col items-center py-12 px-6">
            <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Academics Overview</h1>
                    <p className="text-foreground/60 mt-1 font-medium">Review report cards, subject grades, and term summaries.</p>
                </div>
            </header>

            <main className="w-full max-w-4xl space-y-8">
                {/* Child Selector (Static) */}
                <section className="flex flex-wrap gap-4 mb-4">
                    <button className="px-6 py-2 bg-red-accent text-white font-medium rounded-lg shrink-0">Alice (Grade 8)</button>
                    <button className="px-6 py-2 bg-card text-foreground border border-border/30 font-medium rounded-lg hover:bg-border/50 transition-colors shrink-0">Leo (Grade 5)</button>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Term Selector Sidebar */}
                    <section className="md:col-span-1 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Past Terms</h3>
                        {semesters.map((term, i) => (
                            <button key={i} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${term.active ? 'bg-red-accent/10 text-red-accent border border-red-accent/30' : 'bg-card text-foreground border border-border/30 hover:bg-border/50'}`}>
                                {term.name}
                            </button>
                        ))}
                    </section>

                    {/* Grades View */}
                    <section className="md:col-span-2 space-y-6">
                        <div className="bg-card border border-border/30 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-foreground">Term 1 Summary</h2>
                                <button className="text-sm font-medium text-red-accent hover:opacity-80">Download PDF</button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-border/30">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-background/50 text-sm border-b border-border/30">
                                            <th className="px-5 py-3 font-semibold text-foreground/80 font-medium">Subject</th>
                                            <th className="px-5 py-3 font-semibold text-foreground/80 font-medium whitespace-nowrap">Assessment Type</th>
                                            <th className="px-5 py-3 font-semibold text-foreground/80 font-medium text-right w-24">Grade</th>
                                            <th className="px-5 py-3 font-semibold text-foreground/80 font-medium text-right w-24">Score</th>
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

                        <div className="bg-card border border-border/30 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Teacher&apos;s Note</h3>
                            <p className="text-foreground/80 leading-relaxed">
                                Alice has shown remarkable improvement this term, particularly in her analytical skills during Science experiments. She is encouraged to participate a bit more actively in Social Studies group discussions.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
