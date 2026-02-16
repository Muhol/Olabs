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
import { fetchJSON } from "@/lib/api";

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
    try {
      const data = await fetchJSON("/api/student/portal/subjects");
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const openSubjectDetails = async (id: string) => {
    setSelectedSubject(null);
    setIsModalOpen(true);
    setDetailsLoading(true);
    
    try {
      const data = await fetchJSON(`/api/student/portal/subjects/${id}`);
      setSelectedSubject(data);
    } catch (err) {
      console.error("Failed to load subject details:", err);
      setIsModalOpen(false); // Close modal on error
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            onClick={() => openSubjectDetails(sub.id)}
            className="group relative bg-card border border-border rounded-2xl p-5 hover:border-secondary/40 transition-all duration-500 cursor-pointer overflow-hidden shadow-lg shadow-black/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative space-y-4">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground border border-border group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:scale-110 transition-all duration-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">{sub.name}</h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] font-black uppercase tracking-wider">
                  <User size={10} className="text-primary" />
                  <span className="line-clamp-1">{sub.teacher_name}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-muted-foreground font-black text-[9px] uppercase tracking-widest group-hover:text-primary transition-colors">
                View Details
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
              className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 md:p-6 border-b border-border bg-muted/20 relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-all text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg shadow-secondary/20">
                    <BookOpen size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                        {detailsLoading ? "Loading..." : (selectedSubject?.name || "Subject")}
                      </h2>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                      {detailsLoading ? "Retrieving latest analytics..." : "Subject Overview / Performance"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
                {detailsLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={36} />
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Loading Subject Data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Metrics & Analytics */}
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-muted/40 border border-border p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-2 mb-5 text-sm">
                          <BarChart3 className="w-5 h-5 text-emerald-500" /> Performance Analysis
                        </h4>
                        <div className="flex items-end justify-between mb-3">
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Average Score</p>
                            <p className="text-3xl font-black text-emerald-500 tracking-tighter tabular-nums">{selectedSubject.performance_avg.toFixed(1)}%</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-500/70 font-black text-[10px]">
                            <TrendingUp size={14} /> Current Standing
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 p-0.5 border border-border">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${selectedSubject.performance_avg}%` }}
                          />
                        </div>
                      </section>

                      {/* Training Resources */}
                      <section className="space-y-4">
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1 text-sm">
                          <FileBox className="w-5 h-5 text-primary" /> Learning Resources
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedSubject.materials.length > 0 ? (
                            selectedSubject.materials.map((mat: any) => (
                              <div key={mat.id} className="p-4 bg-muted/40 border border-border rounded-xl hover:border-secondary/40 transition-all flex items-center justify-between group cursor-pointer backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-muted rounded-lg border border-border group-hover:text-primary transition-colors">
                                    {mat.file_type === "video" ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-1">{mat.title}</p>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.15em]">{mat.file_type}</p>
                                  </div>
                                </div>
                                <a href={mat.file_url} target="_blank" className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 p-8 text-center bg-muted/20 border border-dashed border-border rounded-xl opacity-60">
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">No Resources Available</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Secondary Metrics Column */}
                    <div className="space-y-6">
                      <section className="space-y-4">
                        <h4 className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.25em] px-1">
                          Recent Exams
                        </h4>
                        <div className="space-y-2">
                          {selectedSubject.exam_results.map((res: any) => (
                            <div key={res.id} className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div>
                                <p className="text-[9px] font-black text-foreground uppercase tracking-[0.1em] mb-0.5">{res.exam_type}</p>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">{res.term} {res.year}</p>
                              </div>
                              <span className="text-lg font-black text-emerald-500 tabular-nums group-hover:scale-110 transition-transform">{res.marks}%</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1 text-sm">
                          <ClipboardList className="w-5 h-5 text-amber-500" /> Subject Assignments
                        </h4>
                        <div className="space-y-2">
                          {selectedSubject.assignments.length > 0 ? (
                            selectedSubject.assignments.map((asgn: any) => (
                              <div key={asgn.id} className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                <div>
                                  <p className="text-[9px] font-black text-foreground uppercase tracking-[0.08em] mb-0.5">{asgn.title}</p>
                                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">
                                    Due: {new Date(asgn.due_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[7px] font-black uppercase text-amber-500">
                                  Pending
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center bg-muted/20 border border-dashed border-border rounded-xl opacity-60">
                              <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">No Assignments</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="font-black text-[10px] text-muted-foreground uppercase tracking-[0.25em] px-1">
                          Recent Announcements
                        </h4>
                        <div className="space-y-2">
                          {selectedSubject.announcements.map((ann: any) => (
                            <div key={ann.id} className="p-3 border-l-4 border-secondary bg-secondary/5 rounded-r-xl space-y-1.5">
                              <p className="text-[9px] font-black text-foreground uppercase tracking-[0.08em]">{ann.title}</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{ann.content}</p>
                              <p className="text-[7px] font-black text-muted-foreground uppercase tracking-wider pt-1">
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
              <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-secondary text-secondary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg shadow-secondary/20 transition-all hover:scale-105 active:scale-95"
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
