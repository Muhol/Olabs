"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Loader2 className="w-8 h-8 text-primary animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                Initializing Portal
            </p>
        </div>
    );
}
