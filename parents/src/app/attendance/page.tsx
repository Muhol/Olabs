export default function AttendancePage() {
    const attendanceData = [
        { date: "Oct 12, 2026", status: "Present", info: "On time" },
        { date: "Oct 13, 2026", status: "Present", info: "On time" },
        { date: "Oct 14, 2026", status: "Absent", info: "Excused - Medical" },
        { date: "Oct 15, 2026", status: "Present", info: "Arrived Late (8:15 AM)" },
        { date: "Oct 16, 2026", status: "Present", info: "On time" },
    ];

    return (
        <div className="bg-background flex flex-col items-center py-12 px-6">
            <header className="w-full max-w-4xl mb-8">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Attendance Record</h1>
                <p className="text-foreground/60 mt-1 font-medium">Monitor daily presence and absence history.</p>
            </header>

            <main className="w-full max-w-4xl space-y-8">
                {/* Child Selector (Static) */}
                <section className="flex flex-wrap gap-4 mb-4">
                    <button className="px-6 py-2 bg-card text-foreground border border-border/30 font-medium rounded-lg hover:bg-border/50 transition-colors shrink-0">Alice (Grade 8)</button>
                    <button className="px-6 py-2 bg-orange-accent text-white font-medium rounded-lg shrink-0">Leo (Grade 5)</button>
                </section>

                {/* Stats Summary */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border/30 p-6 rounded-lg text-center shadow-sm">
                        <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-2">Days Present</p>
                        <p className="text-3xl font-bold text-green-600">42</p>
                    </div>
                    <div className="bg-card border border-border/30 p-6 rounded-lg text-center shadow-sm">
                        <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-2">Days Absent</p>
                        <p className="text-3xl font-bold text-red-accent">3</p>
                    </div>
                    <div className="bg-card border border-border/30 p-6 rounded-lg text-center shadow-sm">
                        <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-2">Attendance Rate</p>
                        <p className="text-3xl font-bold text-foreground">93%</p>
                    </div>
                </section>

                {/* Activity Log */}
                <section className="bg-card border border-border/30 rounded-lg shadow-sm w-full overflow-hidden">
                    <div className="p-6 border-b border-border/30">
                        <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 text-sm border-b border-border/30">
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium whitespace-nowrap">Date</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium">Status & Info</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium text-right w-32">Record</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {attendanceData.map((record, i) => (
                                    <tr key={i} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4 text-foreground font-medium whitespace-nowrap">{record.date}</td>
                                        <td className="px-6 py-4 text-foreground/80 text-sm">{record.info}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${record.status === 'Present' ? 'bg-green-100/50 text-green-700 border border-green-200/30' : 'bg-red-accent/10 text-red-accent border border-red-accent/30'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
