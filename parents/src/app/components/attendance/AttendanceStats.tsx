type Stat = {
    label: string;
    value: string | number;
    colorClass: string;
};

export default function AttendanceStats({ stats }: { stats: Stat[] }) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="bg-card border border-border/30 p-6 rounded-lg text-center shadow-sm">
                    <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.colorClass}`}>{stat.value}</p>
                </div>
            ))}
        </section>
    );
}
