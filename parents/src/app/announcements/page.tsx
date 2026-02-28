export default function AnnouncementsPage() {
    const parentAnnouncements = [
        {
            id: "notice-001",
            title: "End of Term 1 Newsletter & Holiday Schedule",
            date: "Oct 20, 2026",
            excerpt: "Please find attached the comprehensive review of Term 1, including academic highlights and the official dates for the December holiday break.",
            hasAttachment: true,
            attachmentType: "image",
            attachmentName: "newsletter_preview.jpg",
            isImportant: true,
            read: false
        },
        {
            id: "notice-002",
            title: "Updated School Drop-Off Traffic Flow",
            date: "Oct 18, 2026",
            excerpt: "Due to ongoing roadworks on Elm Street, we have temporarily adjusted the morning drop-off routes outside the main gates.",
            hasAttachment: false,
            attachmentType: null,
            attachmentName: null,
            isImportant: false,
            read: true
        },
        {
            id: "notice-003",
            title: "Required Medical Forms for Grade 8 Field Trip",
            date: "Oct 12, 2026",
            excerpt: "All Grade 8 parents must print, sign, and return the attached medical clearance form by next Friday for the upcoming Science Centre trip.",
            hasAttachment: true,
            attachmentType: "pdf",
            attachmentName: "Scanned_Medical_Form_G8.pdf",
            isImportant: true,
            read: true
        }
    ];

    return (
        <div className="bg-background flex flex-col items-center py-12 px-6">
            <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Announcements</h1>
                    <p className="text-foreground/60 mt-1 font-medium">Official newsletters, notices, and scanned documents from Olabs.</p>
                </div>
            </header>

            <main className="w-full max-w-4xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-card border border-border/30 p-2 rounded-lg gap-2 overflow-x-auto remove-scrollbar">
                    <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-red-accent/10 border border-red-accent/30 text-red-accent font-medium rounded-md text-sm whitespace-nowrap">All News</button>
                        <button className="px-4 py-1.5 text-foreground/70 hover:text-foreground font-medium rounded-md text-sm transition-colors whitespace-nowrap">Important</button>
                        <button className="px-4 py-1.5 text-foreground/70 hover:text-foreground font-medium rounded-md text-sm transition-colors whitespace-nowrap">Attachments</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {parentAnnouncements.map((notice) => (
                        <article key={notice.id} className={`bg-card border rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${!notice.read ? 'border-orange-accent/50' : 'border-border/30'}`}>
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        {!notice.read && <span className="h-2 w-2 rounded-full bg-orange-accent"></span>}
                                        <h2 className={`text-xl font-semibold ${!notice.read ? 'text-foreground' : 'text-foreground/80'}`}>
                                            {notice.title}
                                        </h2>
                                    </div>
                                    <span className="text-sm font-medium text-foreground/50 whitespace-nowrap">{notice.date}</span>
                                </div>

                                <p className="text-foreground/70 leading-relaxed mb-6">
                                    {notice.excerpt}
                                </p>

                                {notice.hasAttachment && notice.attachmentType === 'image' && (
                                    <div className="mt-4 relative w-full h-80 bg-background/50 border border-border/30 rounded-lg overflow-hidden group">
                                        {/* Mock Image Content */}
                                        <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                            <div className="text-6xl mb-4">📰</div>
                                            <div className="w-2/3 h-4 bg-foreground/20 rounded mb-2"></div>
                                            <div className="w-1/2 h-4 bg-foreground/20 rounded mb-2"></div>
                                            <div className="w-3/4 h-4 bg-foreground/20 rounded"></div>
                                        </div>

                                        {/* Gradient Overlay & Buttons */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none transition-opacity duration-300"></div>
                                        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col sm:flex-row items-end justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-foreground text-sm shadow-sm">{notice.attachmentName}</p>
                                                <p className="text-xs text-foreground/80 font-medium">Image Preview</p>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <button className="flex-1 sm:flex-none px-4 py-2 bg-card/80 backdrop-blur border border-border/30 text-foreground font-medium text-sm rounded-md hover:bg-card transition-colors flex items-center justify-center gap-2 shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                                    Download
                                                </button>
                                                <button className="flex-1 sm:flex-none px-4 py-2 bg-red-accent text-white font-medium text-sm rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5" /></svg>
                                                    View Full
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {notice.hasAttachment && notice.attachmentType === 'pdf' && (
                                    <div className="mt-4 p-4 bg-background border border-border/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="shrink-0 w-12 h-16 bg-card border border-border/50 rounded shadow-sm flex items-center justify-center text-foreground/20">
                                            📄
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-semibold text-foreground">{notice.attachmentName}</p>
                                            <p className="text-xs text-foreground/50 mt-1">PDF Document</p>
                                        </div>
                                        <button className="shrink-0 px-4 py-2 bg-card border border-border/30 text-foreground font-medium text-sm rounded-md hover:bg-border/50 transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                            Download
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}
