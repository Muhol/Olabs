"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, CheckCircle2, ArrowRight, ShieldCheck, Loader2, XCircle } from "lucide-react";

export default function StudentOnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/auth/onboard/verify?admission_number=${admissionNumber}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Verification failed");
      }

      const data = await response.json();
      setFullName(data.full_name);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/auth/onboard/activate?admission_number=${admissionNumber}&new_password=${password}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Activation failed");
      }

      const data = await response.json();
      localStorage.setItem("student_token", data.access_token);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans text-foreground">
      <div className="w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[100px] rounded-full translate-x-12 -translate-y-12" />

        <div className="relative text-center space-y-4 mb-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-[1.5rem] border border-border flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110">
            {step === 3 ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <GraduationCap className="w-8 h-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
            {step === 1 && "Activate Account"}
            {step === 2 && "Set Password"}
            {step === 3 && "Setup Complete"}
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.25em] leading-relaxed max-w-[280px] mx-auto">
            {step === 1 && "Enter your admission number to get started"}
            {step === 2 && `Welcome, ${fullName}. Create your password.`}
            {step === 3 && "Your account is ready. You can now log in."}
          </p>
        </div>

        <div className="relative">
          {step === 1 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Admission No.</label>
                <input
                  type="text"
                  placeholder="ADM/X/000"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  required
                  className="w-full px-6 py-5 rounded-2xl bg-muted/50 border border-border text-foreground font-bold text-sm focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                />
              </div>
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-[10px] font-black uppercase tracking-wider">
                  <XCircle size={14} /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Verify Identity <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleActivate} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Create Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-5 rounded-2xl bg-muted/50 border border-border text-foreground font-bold text-sm focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-6 py-5 rounded-2xl bg-muted/50 border border-border text-foreground font-bold text-sm focus:border-primary outline-none transition-all"
                />
              </div>
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-[10px] font-black uppercase tracking-wider">
                  <XCircle size={14} /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Create Account <ShieldCheck className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] text-center space-y-4">
                <p className="text-emerald-500 font-bold text-sm">Account Activated Successfully!</p>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-loose">
                  Your student account has been set up. <br />
                  You can now access the portal.
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step < 3 && (
            <div className="mt-10 pt-8 border-t border-border text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-muted-foreground hover:text-foreground text-[9px] font-black uppercase tracking-widest transition-colors duration-300"
              >
                Cancel & Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
