export default function FinancesPage() {
    const transactions = [
        { id: "INV-2026-003", desc: "Term 1 Tuition Fee - Alice", date: "Sep 01, 2026", amount: "$450.00", status: "Unpaid" },
        { id: "REC-2025-081", desc: "Library Fee - Leo", date: "Aug 15, 2026", amount: "$25.00", status: "Paid" },
        { id: "REC-2025-045", desc: "Term 3 Tuition Fee (Previous) - Alice", date: "May 02, 2026", amount: "$420.00", status: "Paid" },
    ];

    return (
        <div className="bg-background flex flex-col items-center py-12 px-6">
            <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Finances & Fees</h1>
                    <p className="text-foreground/60 mt-1 font-medium">Manage pending invoices and view payment history.</p>
                </div>
                <button className="px-6 py-2 bg-red-accent text-white font-medium rounded-lg hover:opacity-90 w-full md:w-auto">
                    Make a Payment
                </button>
            </header>

            <main className="w-full max-w-4xl space-y-8">

                {/* Balance Overview */}
                <section className="bg-card border border-border/30 p-8 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-2">Total Outstanding Balance</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-red-accent">$450.00</span>
                            <span className="text-foreground/60 font-medium">Due in 5 days</span>
                        </div>
                    </div>
                    <div className="w-full md:w-auto p-4 bg-orange-accent/10 border border-orange-accent/30 rounded-md">
                        <p className="text-sm text-orange-accent font-medium">
                            Payment plan options are available. Contact the bursar.
                        </p>
                    </div>
                </section>

                {/* Invoices List */}
                <section className="bg-card border border-border/30 rounded-lg shadow-sm w-full overflow-hidden">
                    <div className="p-6 border-b border-border/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                        <button className="text-sm font-medium text-foreground/60 hover:text-foreground self-start sm:self-auto">Filter</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 text-sm border-b border-border/30">
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium whitespace-nowrap">Invoice ID</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium">Description</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium whitespace-nowrap">Date</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium text-right">Amount</th>
                                    <th className="px-6 py-3 font-semibold text-foreground/80 font-medium text-right w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {transactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4 text-foreground/60 text-sm whitespace-nowrap font-mono">{tx.id}</td>
                                        <td className="px-6 py-4 text-foreground font-medium">{tx.desc}</td>
                                        <td className="px-6 py-4 text-foreground/80 text-sm whitespace-nowrap">{tx.date}</td>
                                        <td className="px-6 py-4 text-foreground font-bold text-right">{tx.amount}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${tx.status === 'Paid' ? 'bg-green-100/50 text-green-700 border border-green-200/30' : 'bg-red-accent/10 text-red-accent border border-red-accent/30'}`}>
                                                {tx.status}
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
