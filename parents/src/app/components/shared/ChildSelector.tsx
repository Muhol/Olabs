type ChildSelectorProps = {
    children: { id: string; name: string; grade: string }[];
    activeId: string;
};

export default function ChildSelector({ children, activeId }: ChildSelectorProps) {
    return (
        <section className="flex flex-wrap gap-4 mb-4">
            {children.map((child) => (
                <button
                    key={child.id}
                    className={`px-6 py-2 font-medium rounded-lg shrink-0 transition-colors ${activeId === child.id
                            ? 'bg-red-accent text-white'
                            : 'bg-card text-foreground border border-border/30 hover:bg-border/50'
                        }`}
                >
                    {child.name} ({child.grade})
                </button>
            ))}
        </section>
    );
}
