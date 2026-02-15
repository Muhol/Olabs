"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", admissionNumber);
      formData.append("password", password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/auth/login`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("student_token", data.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-1000" />

        <div className="relative text-center space-y-2 mb-10">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Student Portal</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admission Number</label>
            <input
              type="text"
              placeholder="ADM001"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl bg-muted border border-border text-foreground font-bold text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-black uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Login to Portal <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border text-center relative">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-loose">
            First time logging in? <br />
            <button
              onClick={() => router.push("/onboard")}
              className="text-primary hover:text-primary/80 font-black underline underline-offset-4 decoration-2 decoration-primary/50 transition-colors"
            >
              Activate Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
