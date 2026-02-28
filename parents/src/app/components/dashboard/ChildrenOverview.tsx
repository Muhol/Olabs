type Child = {
    id: string;
    name: string;
    grade: string;
    status: string;
    recentGrade: string;
    avatarColor?: string;
};

export default function ChildrenOverview({ children }: { children: Child[] }) {
    return (
        <section>
            <h2 className="text-xl font-semibold text-foreground mb-6">Your Children</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => (
                    <div key={child.id} className="border border-border/30 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold text-xl ${child.avatarColor ?? 'bg-border/50 text-foreground'}`}>
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">{child.name}</h3>
                                <p className="text-foreground/60">{child.grade}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-background border border-border/30 rounded-md">
                                <span className="text-foreground/70 font-medium text-sm">Daily Attendance</span>
                                <span className={`font-semibold text-sm ${child.status.includes('Absent') ? 'text-red-accent' : 'text-green-600'}`}>
                                    {child.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-background border border-border/30 rounded-md">
                                <span className="text-foreground/70 font-medium text-sm">Recent Assessment</span>
                                <span className="font-semibold text-orange-accent">{child.recentGrade}</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2 border border-border/30 font-medium text-foreground rounded-md hover:bg-border/50 transition-colors">
                            View Full Profile
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
