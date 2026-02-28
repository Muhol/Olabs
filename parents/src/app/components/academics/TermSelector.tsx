type Term = { name: string; active: boolean };

export default function TermSelector({ terms }: { terms: Term[] }) {
    return (
        <section className="md:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Past Terms</h3>
            {terms.map((term, i) => (
                <button key={i} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${term.active ? 'bg-red-accent/10 text-red-accent border border-red-accent/30' : 'bg-card text-foreground border border-border/30 hover:bg-border/50'}`}>
                    {term.name}
                </button>
            ))}
        </section>
    );
}
