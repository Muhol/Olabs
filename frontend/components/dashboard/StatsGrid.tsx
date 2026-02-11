import React from 'react';
import { BookOpen, Users, TrendingUp, Clock, Library, UserCircle, GraduationCap, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { StatsCard } from './StatsCard';

interface StatsGridProps {
    role: string;
    stats: any;
}

export function StatsGrid({ role, stats }: StatsGridProps) {
    if (!stats) return null;

    return (
        <div className={`grid grid-cols-2 ${role === 'SUPER_ADMIN' ? 'md:grid-cols-3 lg:grid-cols-6' : role === 'teacher' ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
            {role === 'teacher' ? (
                <>
                    <StatsCard icon={<BookOpen />} label="My Subjects" value={stats.total_subjects} color="primary" />
                    <StatsCard icon={<Users />} label="Class Students" value={stats.class_students} color="secondary" />
                    <StatsCard icon={<GraduationCap />} label="Total Students" value={stats.total_students} color="amber" />
                    <StatsCard icon={<TrendingUp />} label="Assignments" value={stats.total_assignments} color="primary" />
                    <StatsCard icon={<Clock />} label="Active Tasks" value={stats.active_assignments} color="rose" />
                </>
            ) : role === 'SUPER_ADMIN' ? (
                <>
                    <StatsCard icon={<Library />} label="Total Books" value={stats.total_books} color="primary" compact />
                    <StatsCard icon={<UserCircle />} label="Approved Staff" value={stats.total_staff} color="secondary" compact />
                    <StatsCard icon={<GraduationCap />} label="Total Students" value={stats.total_students} color="amber" compact />
                    <StatsCard icon={<Activity />} label="System Load" value={stats.total_assignments + stats.total_subjects} color="rose" compact />
                    <StatsCard icon={<AlertTriangle />} label="Pending" value={stats.pending_registrations} color="amber" compact />
                    <StatsCard icon={<ShieldAlert />} label="Security" value={stats.critical_logs_count} color="rose" compact />
                </>
            ) : role === 'admin' ? (
                <>
                    <StatsCard icon={<Library />} label="Total Books" value={stats.total_books} color="primary" />
                    <StatsCard icon={<UserCircle />} label="Total Staff" value={stats.total_staff} color="secondary" />
                    <StatsCard icon={<GraduationCap />} label="Total Students" value={stats.total_students} color="amber" />
                    <StatsCard icon={<Activity />} label="System Load" value={stats.total_assignments + stats.total_subjects} color="rose" />
                </>
            ) : (
                <>
                    <StatsCard icon={<BookOpen />} label="Total Books" value={stats.total_books} color="primary" />
                    <StatsCard icon={<Users />} label="Total Students" value={stats.total_students} color="secondary" />
                    <StatsCard icon={<TrendingUp />} label="Active Borrows" value={stats.active_borrows} color="amber" />
                    <StatsCard icon={<Clock />} label="Overdue Books" value={stats.overdue_count} color="rose" />
                </>
            )}
        </div>
    );
}
