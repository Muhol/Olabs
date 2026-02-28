type AttendanceRecord = {
    date: string;
    status: string;
    info: string;
};

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
    return (
        <section className="bg-card border border-border/30 rounded-lg shadow-sm w-full overflow-hidden">
            <div className="p-6 border-b border-border/30">
                <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-background/50 text-sm border-b border-border/30">
                            <th className="px-6 py-3 font-semibold text-foreground/80 whitespace-nowrap">Date</th>
                            <th className="px-6 py-3 font-semibold text-foreground/80">Status &amp; Info</th>
                            <th className="px-6 py-3 font-semibold text-foreground/80 text-right w-32">Record</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {records.map((record, i) => (
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
    );
}
