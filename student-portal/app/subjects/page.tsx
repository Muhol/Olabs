"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  User,
  BarChart3,
  Bell,
  FileText,
  Award,
  ExternalLink,
  ChevronRight,
  PlayCircle,
  FileBox,
  X,
  Loader2,
  TrendingUp,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const token = localStorage.getItem("student_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/portal/subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSubjects(data);
    setLoading(false);
  };

  const openSubjectDetails = async (id: string) => {
    setSelectedSubject(null);
    setIsModalOpen(true);
    setDetailsLoading(true);
    const token = localStorage.getItem("student_token");
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/student/portal/subjects/${id}`;
    console.log("Fetching subject details from:", url);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Fetch failed with status:", res.status, errorData);
        throw new Error(`Status ${res.status}: ${JSON.stringify(errorData)}`);
      }
      const data = await res.json();
      setSelectedSubject(data);
    } catch (err) {
      console.error("Caught fetch error:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-[2.5rem] border border-border" />)}
    </div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
          <BookOpen size={14} /> My Subjects
        </div>
        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Enrolled Subjects</h1>
        {/* <p className="text-muted-foreground font-medium max-w-md">Access your curriculum, performance metrics, and learning resources.</p> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            onClick={() => openSubjectDetails(sub.id)}
            className="group relative bg-card border border-border rounded-[2.5rem] p-8 hover:border-secondary/40 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl shadow-black/5"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative space-y-6">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground border border-border group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:scale-110 transition-all duration-500">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{sub.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  <User size={12} className="text-primary" />
                  {sub.teacher_name}
                </div>
              </div>
              <div className="pt-6 border-t border-border/50 flex items-center justify-between text-muted-foreground font-black text-[10px] uppercase tracking-widest group-hover:text-primary transition-colors">
                View Details
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-5xl bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-12 border-b border-border bg-muted/20 relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-8 right-8 p-3 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground"
                >
                  <X size={28} />
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-secondary flex items-center justify-center text-secondary-foreground shadow-xl shadow-secondary/20 shadow-inner">
                    <BookOpen size={40} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter">
                        {detailsLoading ? "Loading..." : (selectedSubject?.name || "Subject")}
                      </h2>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                      {detailsLoading ? "Retrieving latest analytics..." : "Subject Overview / Performance"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                {detailsLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Loading Subject Data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Metrics & Analytics */}
                    <div className="lg:col-span-2 space-y-12">
                      <section className="bg-muted/40 border border-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-3 mb-8">
                          <BarChart3 className="w-6 h-6 text-emerald-500" /> Performance Analysis
                        </h4>
                        <div className="flex items-end justify-between mb-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Average Score</p>
                            <p className="text-5xl font-black text-emerald-500 tracking-tighter tabular-nums">{selectedSubject.performance_avg.toFixed(1)}%</p>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-500/70 font-black text-xs">
                            <TrendingUp size={16} /> Current Standing
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 p-1 border border-border">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            style={{ width: `${selectedSubject.performance_avg}%` }}
                          />
                        </div>
                      </section>

                      {/* Training Resources */}
                      <section className="space-y-6">
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-3 px-2">
                          <FileBox className="w-6 h-6 text-primary" /> Learning Resources
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedSubject.materials.length > 0 ? (
                            selectedSubject.materials.map((mat: any) => (
                              <div key={mat.id} className="p-6 bg-muted/40 border border-border rounded-2xl hover:border-secondary/40 transition-all flex items-center justify-between group cursor-pointer backdrop-blur-md">
                                <div className="flex items-center gap-5">
                                  <div className="p-3 bg-muted rounded-xl border border-border group-hover:text-primary transition-colors">
                                    {mat.file_type === "video" ? <PlayCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight line-clamp-1">{mat.title}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{mat.file_type}</p>
                                  </div>
                                </div>
                                <a href={mat.file_url} target="_blank" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 p-12 text-center bg-muted/20 border border-dashed border-border rounded-[2rem] opacity-60">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No Resources Available</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Secondary Metrics Column */}
                    <div className="space-y-12">
                      <section className="space-y-6">
                        <h4 className="font-black text-[11px] text-muted-foreground uppercase tracking-[0.3em] px-1">
                          Recent Exams
                        </h4>
                        <div className="space-y-3">
                          {selectedSubject.exam_results.map((res: any) => (
                            <div key={res.id} className="p-5 bg-muted/40 border border-border rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div>
                                <p className="text-[10px] font-black text-foreground uppercase tracking-[0.15em] mb-1">{res.exam_type}</p>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{res.term} {res.year}</p>
                              </div>
                              <span className="text-xl font-black text-emerald-500 tabular-nums group-hover:scale-110 transition-transform">{res.marks}%</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-3 px-2">
                          <ClipboardList className="w-6 h-6 text-amber-500" /> Subject Assignments
                        </h4>
                        <div className="space-y-4">
                          {selectedSubject.assignments.length > 0 ? (
                            selectedSubject.assignments.map((asgn: any) => (
                              <div key={asgn.id} className="p-5 bg-muted/40 border border-border rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                <div>
                                  <p className="text-[10px] font-black text-foreground uppercase tracking-[0.1em] mb-1">{asgn.title}</p>
                                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                    Due: {new Date(asgn.due_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] font-black uppercase text-amber-500">
                                  Pending
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl opacity-60">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">No Assignments</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h4 className="font-black text-[11px] text-muted-foreground uppercase tracking-[0.3em] px-1">
                          Recent Announcements
                        </h4>
                        <div className="space-y-4">
                          {selectedSubject.announcements.map((ann: any) => (
                            <div key={ann.id} className="p-5 border-l-4 border-secondary bg-secondary/5 rounded-r-2xl space-y-2">
                              <p className="text-[10px] font-black text-foreground uppercase tracking-[0.1em]">{ann.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest pt-2">
                                {new Date(ann.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-border bg-muted/20 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-5 bg-secondary text-secondary-foreground font-black uppercase text-xs tracking-[0.25em] rounded-2xl shadow-xl shadow-secondary/20 transition-all hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
