import Link from "next/link";

export default function NewsletterBanner() {
    return (
        <section className="bg-orange-accent text-white p-6 rounded-lg relative overflow-hidden shadow-sm">
            <div className="absolute -right-16 -top-16 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase">New Newsletter</span>
                        <span className="text-sm font-medium opacity-80">Oct 20, 2026</span>
                    </div>
                    <h2 className="text-xl font-bold mb-1">End of Term 1 Review &amp; Holiday Schedules</h2>
                    <p className="text-white/90 font-medium">Read the principal&apos;s latest update covering academic highlights and December dates.</p>
                </div>
                <Link href="/announcements" className="shrink-0 bg-white text-orange-accent hover:bg-white/90 px-6 py-2.5 rounded-md font-bold transition-colors text-center shadow-sm w-full sm:w-auto mt-4 sm:mt-0">
                    Read Newsletter
                </Link>
            </div>
        </section>
    );
}
