type Assignment = {
    subject: string;
    task: string;
    due: string;
    child: string;
    urgent: boolean;
};

export default function PendingAssignments({ assignments }: { assignments: Assignment[] }) {
    return (
        <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden md:col-span-2">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Pending Assignments</h2>
                <button className="text-sm font-medium text-foreground/60 hover:text-foreground">View All</button>
            </div>
            <div className="divide-y divide-border/30">
                {assignments.map((assignment, i) => (
                    <div key={i} className="p-4 hover:bg-background/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">{assignment.subject}</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-border/50 text-foreground/70 whitespace-nowrap">{assignment.child}</span>
                            </div>
                            <span className="text-sm text-foreground/80 mt-1">{assignment.task}</span>
                        </div>
                        <div className={`text-sm font-medium whitespace-nowrap ${assignment.urgent ? 'text-red-accent' : 'text-foreground/60'}`}>
                            Due {assignment.due}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
