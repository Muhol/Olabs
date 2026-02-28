import Link from "next/link";

type Announcement = {
    title: string;
    date: string;
    excerpt: string;
    hasImage: boolean;
    imageName: string | null;
};

export default function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
    return (
        <div className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/30 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
                <Link href="/announcements" className="text-sm font-medium text-foreground/60 hover:text-foreground">View All</Link>
            </div>
            <div className="divide-y divide-border/30">
                {announcements.map((announcement, i) => (
                    <div key={i} className="hover:bg-background/50 transition-colors">
                        {announcement.hasImage ? (
                            <div>
                                <div className="relative w-full h-52 bg-background/50 overflow-hidden">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                                        <span className="text-6xl">📰</span>
                                        <div className="w-2/3 h-3 bg-foreground/30 rounded mt-4 mb-2"></div>
                                        <div className="w-1/2 h-3 bg-foreground/30 rounded mb-2"></div>
                                        <div className="w-3/4 h-3 bg-foreground/30 rounded"></div>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                    <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-foreground text-sm">{announcement.imageName}</p>
                                            <p className="text-xs text-foreground/60">Image Preview</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1.5 bg-card/80 backdrop-blur border border-border/30 text-foreground font-medium text-xs rounded-md hover:bg-card transition-colors flex items-center gap-1.5 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                                Download
                                            </button>
                                            <Link href="/announcements" className="px-3 py-1.5 bg-red-accent text-white font-medium text-xs rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
                                                View Full
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 pt-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                                        <span className="text-xs font-medium text-foreground/50 whitespace-nowrap ml-3">{announcement.date}</span>
                                    </div>
                                    <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{announcement.excerpt}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                                    <span className="text-xs font-medium text-foreground/50 ml-3 whitespace-nowrap">{announcement.date}</span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-2">{announcement.excerpt}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
