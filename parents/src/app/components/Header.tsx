"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className={`w-full bg-card border-b border-border/30 sticky ${isMobileMenuOpen ? 'bg-background' : 'backdrop-blur-sm'} top-0 z-50`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo & Desktop Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tight text-red-accent shrink-0 z-50">
                        Olabs
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/announcements" className="text-sm font-medium text-foreground/80 hover:text-foreground">Announcements</Link>
                        <Link href="/academics" className="text-sm font-medium text-foreground/80 hover:text-foreground">Academics</Link>
                        <Link href="/attendance" className="text-sm font-medium text-foreground/80 hover:text-foreground">Attendance</Link>
                        <Link href="/finances" className="text-sm font-medium text-foreground/80 hover:text-foreground">Finances</Link>
                        <Link href="/uniform-shop" className="text-sm font-medium text-foreground/80 hover:text-foreground">Uniform Shop</Link>
                    </nav>
                </div>

                {/* Desktop Actions & Mobile Menu Toggle */}
                <div className="flex items-center gap-4 z-50">
                    <div className="hidden md:flex items-center gap-4">
                        <button className="text-sm font-medium text-foreground/80 hover:text-foreground">
                            Settings
                        </button>
                        <div className="h-9 w-9 rounded-lg bg-orange-accent/10 border border-orange-accent/30 flex items-center justify-center font-bold text-sm text-orange-accent cursor-pointer hover:bg-orange-accent/20 transition-colors">
                            SJ
                        </div>
                    </div>

                    <button
                        className="md:hidden p-2 -mr-2 text-foreground hover:bg-background/50 rounded-md transition-colors"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg- backdrop-blur-sm border-b border-border/30 shadow-lg px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <nav className="flex flex-col gap-4">
                        {/* <Link href="/" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Overview</Link> */}
                        <Link href="/announcements" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Announcements</Link>
                        <Link href="/academics" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Academics</Link>
                        <Link href="/attendance" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Attendance</Link>
                        <Link href="/finances" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Finances</Link>
                        <Link href="/uniform-shop" onClick={toggleMobileMenu} className="text-lg font-medium text-foreground/90 hover:text-foreground">Uniform Shop</Link>
                    </nav>
                    <div className="h-px w-full bg-border/30 my-2"></div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-accent/10 border border-orange-accent/30 flex items-center justify-center font-bold text-orange-accent shrink-0">
                            SJ
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">Sarah Johnson</span>
                            <button className="text-sm font-medium text-foreground/60 hover:text-foreground text-left">
                                Account Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
