export default function TeacherNote({ note }: { note: string }) {
    return (
        <div className="bg-card border border-border/30 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Teacher&apos;s Note</h3>
            <p className="text-foreground/80 leading-relaxed">{note}</p>
        </div>
    );
}
