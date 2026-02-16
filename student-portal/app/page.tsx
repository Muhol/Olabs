"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Clock,
  FileText,
  Zap,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Loader2,
  Wallet,
  CheckCircle2,
  User
} from "lucide-react";
import { fetchJSON } from "@/lib/api";

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await fetchJSON("/api/student/portal/dashboard");
        setData(dashboardData);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-3xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl border border-border" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-muted rounded-3xl border border-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Hero Welcome Section - Compact */}
      <section className="relative overflow-hidden bg-primary/30 rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/10 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -translate-x-8 translate-y-8" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-foreground font-black uppercase tracking-[0.3em] text-[9px]">
              <Zap size={12} className="animate-pulse" /> System Status: Online
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              Welcome Back, <br /> {data?.student_name || 'Student'}
            </h1>
            <p className="text-foreground/80 font-medium max-w-sm text-xs leading-relaxed">
              Your academic progress is being tracked. Current attendance record is at
              <span className="text-foreground font-black ml-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                {data.attendance_percentage.toFixed(1)}%
              </span>.
            </p>
          </div>

          {/* <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg flex flex-row items-center justify-between gap-8 lg:flex-col lg:items-end lg:gap-0 lg:p-6 lg:py-4">
            <div>
              <div className="text-[9px] font-black text-foreground/70 uppercase tracking-widest mb-0.5 lg:text-right">Balance Due</div>
              <div className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">KES {data.fee_balance.toLocaleString()}</div>
            </div>
            <div className="mt-0 lg:mt-3">
              <button className="px-5 py-2 bg-white text-primary font-black uppercase text-[9px] tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
                Pay Fees
              </button>
            </div>
          </div> */}
        </div>
      </section>

      {/* Tri-Metric Grid */}
      {/* Tri-Metric Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Upcoming Tasks", value: (data?.upcoming_assignments || []).length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Overdue Work", value: (data?.overdue_assignments || []).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Announcements", value: (data?.announcements || []).length, icon: Bell, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl bg-card border ${stat.border} hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md`}>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color} tracking-tighter leading-none`}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <div className={`absolute bottom-0 right-0 w-16 h-16 ${stat.bg} blur-2xl rounded-full translate-x-6 translate-y-6`} />
          </div>
        ))}
      </div>

      {/* Attendance Tracking Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight text-foreground">
              <CheckCircle2 className="w-6 h-6 text-primary" /> Attendance Overview
            </h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.1em]">Track your presence across all subjects</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Overall</div>
            <div className="text-2xl font-black text-primary tracking-tighter">{data?.attendance_percentage?.toFixed(1) || 0}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.subject_attendance || []).map((subject: any) => (
            <div key={subject.subject_id} className="group relative bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {subject.subject_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      <User size={10} className="text-primary" />
                      <span className="line-clamp-1">{subject.teacher_name}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg font-black text-lg tabular-nums ${
                    subject.attendance_percentage >= 75 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : subject.attendance_percentage >= 50
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    {subject.attendance_percentage?.toFixed(0) || 0}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2 p-0.5 border border-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        subject.attendance_percentage >= 75 
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                          : subject.attendance_percentage >= 50
                          ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      }`}
                      style={{ width: `${subject.attendance_percentage || 0}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                      <div className="text-xs font-black text-emerald-500 tabular-nums">{subject.present_count || 0}</div>
                      <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Present</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                      <div className="text-xs font-black text-rose-500 tabular-nums">{subject.absent_count || 0}</div>
                      <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Absent</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs font-black text-foreground tabular-nums">{subject.total_sessions || 0}</div>
                      <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Schedule Summary */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight text-foreground">
              <Clock className="w-5 h-5 text-primary" /> Today's Routine
            </h2>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full border border-border">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto relative ">
            {(data?.timetable_today || []).length > 0 ? (
              (data?.timetable_today || [])
                .sort((a: any, b: any) => a.start_time.padStart(5, '0').localeCompare(b.start_time.padStart(5, '0')))
                .map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg font-black text-[9px] text-muted-foreground tracking-tighter tabular-nums border border-border group-hover:bg-primary/5 group-hover:text-primary transition-colors w-12 text-center">
                      {item.start_time}
                    </div>
                    <div>
                      <p className="font-black text-foreground text-sm uppercase tracking-tight group-hover:text-primary transition-colors leading-none mb-1">{item.subject_name}</p>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                          {item.type === 'break' ? 'Recess' : 'Lesson'} • {item.end_time}
                        </p>
                        {item.teacher_name && (
                          <div className="flex items-center gap-1 opacity-70">
                            <div className="h-0.5 w-0.5 rounded-full bg-border md:block hidden" />
                            <GraduationCap size={9} className="text-primary" />
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                              {item.teacher_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.type !== 'break' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-20 text-center bg-muted/10 border border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center opacity-70">
                <Calendar className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No Classes Today</p>
              </div>
            )}
            {(data?.timetable_today || []).length > 0 && (
              <div className="w-full h-[100px] bg-gradient-to-t from-background to-transparent sticky -bottom-1 left-0 right-0"></div>
            )}
          </div>
        </section>

        {/* Broadcast Feed */}
        <section className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight text-foreground">
            <Bell className="w-5 h-5 text-primary" /> Announcements
          </h2>
          <div className="space-y-5">
            {(data?.announcements || []).length > 0 ? (
              (data?.announcements || []).map((ann: any) => (
                <div key={ann.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-secondary/30 transition-all shadow-sm">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[8px] font-black uppercase rounded border border-secondary/20 tracking-[0.1em]">
                        {ann.subject_name || "General"}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors uppercase leading-tight line-clamp-1">{ann.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">{ann.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center bg-muted/10 border border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center opacity-70">
                <Bell className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No New Announcements</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Full Weekly Timetabling Section */}
      <section className="space-y-4 overflow-x-auto pb-8">
        <div className="sticky left-0 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight text-foreground">
              <Calendar className="w-6 h-6 text-primary" /> Timetable
            </h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.1em]">Weekly academic plan for your stream</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Sync
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: 1, name: 'Monday' },
            { id: 2, name: 'Tuesday' },
            { id: 3, name: 'Wednesday' },
            { id: 4, name: 'Thursday' },
            { id: 5, name: 'Friday' },
            { id: 6, name: 'Saturday' }
          ].map((day) => {
            const daySlots = (data?.timetable_weekly || []).filter((s: any) => s.day_of_week === day.id)
              .sort((a: any, b: any) => a.start_time.padStart(5, '0').localeCompare(b.start_time.padStart(5, '0')));

            return (
              <div key={day.id} className="group relative flex flex-col md:flex-row gap-3 md:gap-6">
                {/* Vertical Day Indicator */}
                <div className="md:w-24 sticky top-0 left-0 flex flex-row md:flex-col items-center md:items-start shrink-0">
                  <div className="px-3 py-1 rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20 text-primary w-full text-center md:text-left">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{day.name.substring(0, 3)}</span>
                  </div>
                  <div className="hidden md:block h-full w-px bg-gradient-to-b from-primary/20 to-transparent ml-5 mt-1" />
                </div>

                {/* Horizontal Scrollable Slots Container */}
                <div className="flex-1 custom-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="flex gap-2 min-w-max">
                    {daySlots.length > 0 ? (
                      daySlots.map((slot: any) => (
                        <div
                          key={slot.id}
                          className={`min-w-[140px] p-2.5 rounded-xl border transition-all duration-300 group/slot ${slot.type === 'break'
                              ? 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                              : 'bg-card border-border shadow-sm hover:shadow-md hover:shadow-primary/5 hover:border-primary/40'
                            }`}
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest tabular-nums bg-muted px-1.5 py-0.5 rounded border border-border">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              {slot.type === 'break' && (
                                <Zap size={8} className="text-amber-500 animate-pulse" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className={`font-black uppercase tracking-tight leading-tight line-clamp-1 ${slot.type === 'break' ? 'text-amber-600 text-[9px]' : 'text-foreground text-[11px]'
                                }`}>
                                {slot.subject_name}
                              </p>
                              {slot.teacher_name && (
                                <div className="flex items-center gap-1 opacity-70">
                                  <GraduationCap size={8} className="text-primary" />
                                  <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[100px]">
                                    {slot.teacher_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 py-3 px-6 rounded-xl border border-dashed border-border opacity-30">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">No Sessions</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
