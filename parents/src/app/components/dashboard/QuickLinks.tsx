import Link from "next/link";

type QuickLink = {
    title: string;
    icon: string;
    href: string;
};

export default function QuickLinks({ links }: { links: QuickLink[] }) {
    return (
        <div className="bg-card border border-border/30 rounded-lg shadow-sm border-b border-border/30">
            <div className="p-6 border-b border-border/30">
                <h2 className="text-xl font-semibold text-foreground">Quick Links</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                {links.map((link, i) => (
                    <Link key={i} href={link.href} className="flex flex-col items-center text-center p-3 rounded-md hover:bg-background/50 transition-colors border border-transparent hover:border-border/30">
                        <span className="text-2xl mb-2">{link.icon}</span>
                        <span className="text-xs font-medium text-foreground/80">{link.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
