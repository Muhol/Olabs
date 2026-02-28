export default function AlertsSection() {
    return (
        <section className="bg-red-accent/10 border border-red-accent/30 p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 bg-red-accent text-white rounded-md shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-red-accent">Outstanding Fees Reminder</h2>
                    <p className="text-foreground/80 mt-1 text-sm sm:text-base">
                        You have an outstanding balance of <strong>$450.00</strong> for the current term. Please clear this by Friday to avoid late fees.
                    </p>
                    <button className="mt-4 px-6 py-2 bg-red-accent text-white font-medium rounded-md hover:opacity-90 transition-opacity w-full sm:w-auto">
                        View Invoice
                    </button>
                </div>
            </div>
        </section>
    );
}
