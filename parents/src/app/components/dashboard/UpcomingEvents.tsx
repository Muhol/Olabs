type Event = {
    date: string;
    title: string;
    time: string;
};

export default function UpcomingEvents({ events }: { events: Event[] }) {
    return (
        <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
                <button className="text-sm font-medium text-foreground/60 hover:text-foreground">View Calendar</button>
            </div>
            <div className="divide-y divide-border/30">
                {events.map((event, i) => (
                    <div key={i} className="p-6 hover:bg-background/50 transition-colors flex gap-4 items-start">
                        <div className="bg-orange-accent/10 border border-orange-accent/30 rounded-md p-2 text-center min-w-[60px]">
                            <span className="block text-xs font-semibold text-orange-accent uppercase tracking-wider">{event.date.split(' ')[0]}</span>
                            <span className="block text-xl font-bold text-orange-accent">{event.date.split(' ')[1]}</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">{event.title}</h3>
                            <p className="text-sm text-foreground/60 mt-1 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                {event.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
