"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    PiSquare,
    Wallet,
    LogOut,
    User,
    Menu,
    X,
    GraduationCap
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Subjects", href: "/subjects", icon: BookOpen },
    { name: "Assignments", href: "/assignments", icon: FileText },
    { name: "Exam Results", href: "/results", icon: PiSquare },
    // { name: "Fees", href: "/fees", icon: Wallet },
];

export function LayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        setIsNavigating(true);
        const timer = setTimeout(() => setIsNavigating(false), 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (mediaQuery.matches) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        };

        // Initial check
        handleChange();

        // Listen for changes
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        if (!token && !pathname.includes("/login") && !pathname.includes("/onboard")) {
            router.push("/login");
            return;
        }

        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Unauthorized");
                    return res.json();
                })
                .then((data) => {
                    setStudent(data);
                    setIsLoaded(true);
                })
                .catch(() => {
                    localStorage.removeItem("student_token");
                    if (!pathname.includes("/login") && !pathname.includes("/onboard")) {
                        router.push("/login");
                    }
                });
        } else {
            setIsLoaded(true);
        }
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem("student_token");
        router.push("/login");
    };

    if (!isLoaded && !pathname.includes("/login") && !pathname.includes("/onboard")) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Hide sidebar on login and onboard pages
    if (pathname.includes("/login") || pathname.includes("/onboard")) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative">
            {isNavigating && (
                <div className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden">
                    <div className="h-full bg-primary animate-loading-bar shadow-[0_0_10px_theme(colors.primary)]" />
                </div>
            )}
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    <span className="font-bold tracking-tight">Student Portal</span>
                </div>
                <button onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background z-[60] lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 w-72 bg-background border-r border-border z-[70] transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
                                <GraduationCap className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">Student Portal</span>
                        </div>
                        <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                  `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "group-hover:text-foreground transition-colors"}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-border space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                                {student?.profile_photo ? (
                                    <img src={student.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{student?.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{student?.admission_number}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all group"
                        >
                            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:pl-72 min-h-screen">
                <div className="p-2 lg:p-4 w-full mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
