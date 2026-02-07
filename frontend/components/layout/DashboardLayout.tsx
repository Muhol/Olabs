'use client';

import React, { useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    History,
    FileText,
    Settings,
    ShieldAlert,
    LogOut,
    Menu,
    X,
    Briefcase
} from 'lucide-react';
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['librarian', 'admin', 'SUPER_ADMIN'] },
    { icon: BookOpen, label: 'Library Books', href: '/inventory', roles: ['librarian', 'admin', 'SUPER_ADMIN'] },
    { icon: Users, label: 'Students', href: '/students', roles: ['librarian', 'admin', 'SUPER_ADMIN'] },
    { icon: Briefcase, label: 'Staff', href: '/staff', roles: ['admin', 'SUPER_ADMIN'] },
    { icon: History, label: 'History', href: '/history', roles: ['librarian', 'admin', 'SUPER_ADMIN'] },
    { icon: FileText, label: 'Reports', href: '/reports', roles: ['librarian', 'admin', 'SUPER_ADMIN'] },
    { icon: ShieldAlert, label: 'System Logs', href: '/logs', roles: ['SUPER_ADMIN'] },
    { icon: Settings, label: 'Settings', href: '/settings', roles: ['admin', 'SUPER_ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for mobile-first approach
    
    // Set initial state based on screen size - COLLAPSED BY DEFAULT AS REQUESTED
    /* React.useEffect(() => {
        if (window.innerWidth >= 1024) {
             setIsSidebarOpen(true);
        }
    }, []); */
    const { isLoaded, user } = useUser();
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [targetHref, setTargetHref] = useState<string | null>(null);

    // Reset navigation state when path changes
    React.useEffect(() => {
        setIsNavigating(false);
        setTargetHref(null);
    }, [pathname]);
    
    // Consume Global User Context
    const { systemUser, userRole, loadingSystemUser } = useUserContext();

    // Automatically sync with system theme preference
    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Set initial theme based on system preference
        if (mediaQuery.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Listen for system theme changes
        const handleChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // If it's the auth page or sso callback, we don't want the dashboard layout
    if (pathname === '/auth' || pathname === '/sso-callback') {
        return <>{children}</>;
    }



    const isLoading = !isLoaded || (user && loadingSystemUser);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (userRole === 'none') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
                <div className="max-w-md w-full glass-card p-8 rounded-[2.5rem] border border-border text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                        <ShieldAlert size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Account Pending</h1>
                        <p className="text-muted-foreground font-medium mt-2">
                            Your account is waiting for administrator approval.
                        </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-2xl border border-border text-xs font-bold text-muted-foreground">
                        Please contact the school administration to have your role assigned.
                    </div>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-background text-black dark:text-white transition-colors duration-300">
            {/* Top Navigation Progress Bar */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div 
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary z-[100] origin-left shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                )}
            </AnimatePresence>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 lg:top-4 h-full lg:h-[calc(100vh-2rem)] z-50 transform ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'} transition-all duration-300 backdrop-blur lg:m-4 rounded-r-2xl lg:rounded-2xl bg-background/80 lg:bg-white/50 dark:lg:bg-slate-700/0 border-r border-border lg:border-none shadow-2xl lg:shadow-none flex flex-col`}>
                <div className="p-6 flex items-center justify-between overflow-hidden">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'lg:hidden'}`}>
                        {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black">
                            L
                        </div> */}
                        <span className="font-black tracking-tight text-lg">Olabs </span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg lg:hidden">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    {sidebarItems.map((item, idx) => {
                        // While loading, we show items that are common to all staff
                        if (!isLoading && !item.roles.includes(userRole)) return null;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                onClick={() => {
                                    if (pathname !== item.href) {
                                        setIsNavigating(true);
                                        setTargetHref(item.href);
                                    }
                                }}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-all group relative ${
                                    pathname === item.href 
                                        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5' 
                                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'
                                }`}
                            >
                                <div className="relative">
                                    <item.icon size={22} className={`${pathname === item.href ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                                    {isNavigating && targetHref === item.href && (
                                        <motion.div 
                                            layoutId="nav-loader"
                                            className="absolute -inset-1 border-2 border-primary border-t-transparent rounded-full animate-spin"
                                        />
                                    )}
                                </div>
                                <span className={`font-bold tracking-wide ${!isSidebarOpen && 'lg:hidden'}`}>
                                    {item.label}
                                </span>
                                {!isSidebarOpen && (
                                    <span className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block whitespace-nowrap z-50 font-bold">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <header className="h-16 lg:h-20 sticky top-0 lg:top-4 z-40 flex items-center justify-between px-4 lg:px-8 lg:m-4 lg:rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-slate-700/5 shadow-sm border-b lg:border-none border-border">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-black tracking-wide hidden sm:block">
                            DASHBOARD
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Logged in as</span>
                            <span className="text-sm font-black text-primary">{isLoading ? 'Authenticating...' : userRole.replace('_', ' ')}</span>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
                    <div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
