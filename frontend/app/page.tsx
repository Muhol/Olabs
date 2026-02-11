'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2, Activity } from 'lucide-react';
import { fetchAnalytics, fetchBorrowHistory, fetchCurrentUser } from '@/lib/api';

// Modular Components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { AdminInsights } from '@/components/dashboard/AdminInsights';
import { SuperAdminPanel } from '@/components/dashboard/SuperAdminPanel';
import { ActivityLedger } from '@/components/dashboard/ActivityLedger';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';

export default function DashboardPage() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                console.warn('[DASHBOARD] Token not available yet, skipping fetch');
                setLoading(false);
                return;
            }

            const [analyticsData, historyData, profileData] = await Promise.all([
                fetchAnalytics(token),
                fetchBorrowHistory(token, 0, 5),
                fetchCurrentUser(token)
            ]);

            setAnalytics(analyticsData);
            setRecentActivity(historyData.items);
            setUserProfile(profileData);
        } catch (err) {
            setError('Failed to establish connection with the central command core.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={64} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={24} className="text-secondary animate-pulse" />
                    </div>
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-xs">Loading Dashboard...</p>
            </div>
        );
    }

    const role = userProfile?.role || 'librarian';

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Top Bar / Welcome */}
            <DashboardHeader 
                role={role} 
                userName={user?.fullName || userProfile?.full_name} 
                onRefresh={loadDashboardData} 
            />

            {/* Quick Stats Grid */}
            <StatsGrid role={role} stats={analytics?.stats} />

            {/* Insights Row for Admin/Super Admin */}
            {(role === 'admin' || role === 'SUPER_ADMIN') && (
                <AdminInsights 
                    trends={analytics?.trends} 
                    topBooks={analytics?.top_books} 
                    securityEvents={analytics?.recent_security_events}
                    isSuperAdmin={role === 'SUPER_ADMIN'} 
                />
            )}

            {/* Super Admin Special Panel */}
            {role === 'SUPER_ADMIN' && (
                <SuperAdminPanel 
                    pendingRegistrations={analytics?.stats?.pending_registrations} 
                    systemConfig={analytics?.system_config} 
                />
            )}

            {/* Main Action Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ActivityLedger 
                    role={role} 
                    recentActivity={recentActivity} 
                    recentAssignments={analytics?.recent_assignments}
                    teacherStats={analytics?.stats} 
                />
                
                <QuickActionsPanel role={role} />
            </div>

            {/* Bottom Status Ticker */}
            <div className="p-1.5 rounded-[1.5rem] bg-muted border border-border flex items-center gap-4 overflow-hidden relative">
                <div className="px-4 py-2 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-xl relative z-10 shadow-lg shadow-primary/20">
                    System Status
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="whitespace-nowrap flex gap-12 animate-marquee">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground shrink-0">
                                <span>System: Online</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span>Database: Synced</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                <span>Safety: Secured</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
