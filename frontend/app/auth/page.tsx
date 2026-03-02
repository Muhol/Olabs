'use client';

import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    UserPlus,
    LogIn,
} from 'lucide-react';
import { checkAuthPolicy } from '@/lib/api';

export default function AuthPage() {
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingSocial, setLoadingSocial] = useState(false);
    const [error, setError] = useState('');

    // --- Google OAuth Logic ---
    const signInWithGoogle = async () => {
        try {
            const activeStrategy = isLogin ? (isSignInLoaded ? signIn : null) : (isSignUpLoaded ? signUp : null);

            if (!activeStrategy) {
                setError('Authentication engine not yet initialized. Please wait.');
                return;
            }

            setLoadingSocial(true);
            setError('');

            if (!isLogin) {
                const policy = await checkAuthPolicy();
                if (!policy.allowed) {
                    setError(policy.reason || 'Public registration is currently restricted.');
                    setLoadingSocial(false);
                    return;
                }
            }

            await activeStrategy.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: `${window.location.origin}/sso-callback`,
                redirectUrlComplete: window.location.origin,
            });
        } catch (err: any) {
            const detail = err.errors?.[0]?.message || err.message || 'Unknown initialization error';
            setError(`Security protocol failed: ${detail}. Please refresh and try again.`);
            setLoadingSocial(false);
        }
    };

    // --- Sign In Logic ---
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignInLoaded) return;
        setLoading(true);
        setError('');
        try {
            const result = await signIn.create({ identifier: email, password });
            if (result.status === 'complete') {
                await setSignInActive({ session: result.createdSessionId });
                router.push('/');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    // --- Sign Up Logic ---
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignUpLoaded) return;

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const policy = await checkAuthPolicy(email);
            if (!policy.allowed) {
                setError(policy.reason || 'Registration is currently restricted.');
                setLoading(false);
                return;
            }
            await signUp.create({ emailAddress: email, password });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setVerifying(true);
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // --- Verification Logic ---
    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSignUpLoaded) return;
        setLoading(true);
        setError('');
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
            if (completeSignUp.status === 'complete') {
                await setSignUpActive({ session: completeSignUp.createdSessionId });
                router.push('/');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-google-sans overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>

            {/* ── LEFT PANEL: Image (2/3 width, desktop only) ── */}
            <div className="hidden lg:block lg:w-2/3 relative overflow-hidden">
                <Image
                    src="/loginbg.jpg"
                    alt="School environment"
                    fill
                    priority
                    className="object-cover"
                />
                {/* Gradient overlay for depth */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(135deg, color-mix(in srgb, black, transparent 30%) 0%, color-mix(in srgb, var(--secondary), transparent 50%) 100%)',
                    }}
                />

                {/* Branding overlay on image */}
                <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
                    {/* Top logo */}
                    <div className="flex items-center gap-4">
                        {/* <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}
                        >
                            <Image src="/icon.png" alt="Logo" width={36} height={36} className="object-contain" />
                        </div> */}
                        <span className=" tracking-[0.2em] uppercase text-sm text-white/90">
                            Admin Portal
                        </span>
                    </div>

                    {/* Bottom tagline */}
                    <div className="space-y-3">
                        <h1 className="text-5xl tracking-tight text-white leading-tight">
                            Academic<br />
                            <span style={{textShadow: '0 0 40px rgba(255,255,255,0.4)' }}>
                                Management
                            </span>
                        </h1>
                        <p className="text-white/70 text-base font-medium max-w-xs leading-relaxed">
                            Authorized access for academic staff to manage students, classes, and school operations.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                                Authorized Staff Only
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL: Auth Section (1/3 width desktop, full on mobile) ── */}
            <div
                className="flex-1 lg:w-1/3 flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
                style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}
            >
                {/* Subtle background glow for right panel */}
                <div
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: 'var(--primary)' }}
                />
                <div
                    className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
                    style={{ background: 'var(--secondary)' }}
                />

                {/* Mobile-only logo */}
                <div className="lg:hidden flex items-center gap-3 mb-8">
                    {/* <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ background: 'var(--primary)', boxShadow: '0 0 20px color-mix(in srgb, var(--primary), transparent 40%)' }}
                    >
                        <Image src="/icon.png" alt="Logo" width={30} height={30} className="object-contain" />
                    </div> */}
                    <span className="tracking-widest uppercase text-3xl" style={{ color: 'var(--foreground)' }}>
                        Admin Portal
                    </span>
                </div>

                {/* Auth Card */}
                <div className="w-full max-w-sm px-6 relative z-10">

                    <AnimatePresence mode="wait">
                        {verifying ? (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                <VerificationForm
                                    code={code}
                                    setCode={setCode}
                                    error={error}
                                    loading={loading}
                                    handleVerification={handleVerification}
                                    setVerifying={setVerifying}
                                />
                            </motion.div>
                        ) : isLogin ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Header */}
                                <div className="mb-8 flex flex-col items-center">
                                    {/* <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                                        style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)' }}
                                    >
                                        <LogIn size={22} style={{ color: 'var(--primary)' }} />
                                    </div> */}
                                    {/* <h2 className="text-4xl uppercase tracking-tight " style={{ color: 'var(--foreground)' }}>
                                       Login
                                    </h2> */}
                                    {/* <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                        Authorized Academic Portal
                                    </p> */}
                                </div>

                                <form onSubmit={handleSignIn} className="space-y-5">
                                    <AuthInput
                                        label="Email Address"
                                        type="email"
                                        icon={<Mail size={16} />}
                                        value={email}
                                        onChange={(e: any) => setEmail(e.target.value)}
                                        placeholder="teacher@school.org"
                                    />
                                    <AuthInput
                                        label="Password"
                                        type="password"
                                        icon={<Lock size={16} />}
                                        value={password}
                                        onChange={(e: any) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />

                                    {error && <ErrorMessage message={error} />}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                            color: 'var(--primary-foreground)',
                                            boxShadow: '0 4px 24px color-mix(in srgb, var(--primary), transparent 50%)',
                                        }}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Sign In <ArrowRight size={16} /></>}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-4">
                                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                                        or
                                    </span>
                                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                                </div>

                                <GoogleButton loading={loadingSocial} onClick={signInWithGoogle} />

                                <button
                                    onClick={() => { setIsLogin(false); setError(''); }}
                                    className="w-full mt-6 text-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80"
                                    style={{ color: 'var(--muted-foreground)' }}
                                >
                                    No account?{' '}
                                    <span style={{ color: 'var(--primary)' }}>Register here</span>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="signup"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Header */}
                                {/* <div className="mb-8">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                                        style={{ background: 'color-mix(in srgb, var(--secondary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--secondary), transparent 60%)' }}
                                    >
                                        <UserPlus size={22} style={{ color: 'var(--secondary)' }} />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase" style={{ color: 'var(--foreground)' }}>
                                        Account Setup
                                    </h2>
                                    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                        Staff Enrollment Portal
                                    </p>
                                </div> */}

                                <form onSubmit={handleSignUp} className="space-y-5">
                                    <AuthInput
                                        label="Email Address"
                                        type="email"
                                        icon={<Mail size={16} />}
                                        value={email}
                                        onChange={(e: any) => setEmail(e.target.value)}
                                        placeholder="new-staff@school.org"
                                    />
                                    <AuthInput
                                        label="Create Password"
                                        type="password"
                                        icon={<Lock size={16} />}
                                        value={password}
                                        onChange={(e: any) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
                                    />
                                    <AuthInput
                                        label="Confirm Password"
                                        type="password"
                                        icon={<Lock size={16} />}
                                        value={confirmPassword}
                                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your password"
                                        matchError={confirmPassword.length > 0 && password !== confirmPassword}
                                    />

                                    {error && <ErrorMessage message={error} />}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                            color: 'var(--primary-foreground)',
                                            boxShadow: '0 4px 24px color-mix(in srgb, var(--secondary), transparent 50%)',
                                        }}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Complete Enrollment <ArrowRight size={16} /></>}
                                    </button>
                                </form>

                                <div className="my-6 flex items-center gap-4">
                                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                                        or
                                    </span>
                                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                                </div>

                                <GoogleButton loading={loadingSocial} onClick={signInWithGoogle} isRegister />

                                <button
                                    onClick={() => { setIsLogin(true); setError(''); }}
                                    className="w-full mt-6 text-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-80"
                                    style={{ color: 'var(--muted-foreground)' }}
                                >
                                    Already authorized?{' '}
                                    <span style={{ color: 'var(--primary)' }}>Sign in</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <p
                    className="absolute bottom-6 text-[9px] font-black uppercase tracking-[0.3em] px-4 text-center"
                    style={{ color: 'var(--muted-foreground)' }}
                >
                    Authorized Academic Staff Only • Access Logged
                </p>
            </div>
        </div>
    );
}

// --- Sub-components ---

function AuthInput({ label, icon, matchError, ...props }: any) {
    return (
        <div className="space-y-1.5 text-left">
            <label
                className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 block"
                style={{ color: 'var(--muted-foreground)' }}
            >
                {label}
            </label>
            <div className="relative group">
                <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]"
                    style={{ color: 'var(--muted-foreground)' }}
                >
                    {icon}
                </div>
                <input
                    {...props}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm outline-none transition-all"
                    style={{
                        backgroundColor: 'var(--muted)',
                        border: matchError ? '1px solid var(--destructive)' : '1px solid var(--border)',
                        color: 'var(--foreground)',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = matchError ? 'var(--destructive)' : 'var(--primary)';
                        e.currentTarget.style.boxShadow = matchError
                            ? '0 0 0 3px color-mix(in srgb, var(--destructive), transparent 80%)'
                            : '0 0 0 3px color-mix(in srgb, var(--primary), transparent 80%)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = matchError ? 'var(--destructive)' : 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
            </div>
            {matchError && (
                <p className="text-[10px] font-bold ml-1 animate-slide-in" style={{ color: 'var(--destructive)' }}>
                    Passwords do not match
                </p>
            )}
        </div>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div
            className="p-3.5 rounded-xl flex items-center gap-3 text-xs font-bold animate-slide-in"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--destructive), transparent 88%)',
                border: '1px solid color-mix(in srgb, var(--destructive), transparent 60%)',
                color: 'var(--destructive)',
            }}
        >
            <AlertCircle size={15} />
            {message}
        </div>
    );
}

function GoogleButton({ loading, onClick, isRegister }: { loading: boolean; onClick: () => void; isRegister?: boolean }) {
    return (
        <button
            type="button"
            disabled={loading}
            onClick={onClick}
            className="w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-3 group"
            style={{
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ring)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
                    <span className="uppercase text-[10px] tracking-[0.2em] font-black" style={{ color: 'var(--muted-foreground)' }}>
                        Verifying Identity...
                    </span>
                </div>
            ) : (
                <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="uppercase text-[10px] tracking-[0.2em] font-black">
                        {isRegister ? 'Register with Google' : 'Sign in with Google'}
                    </span>
                </>
            )}
        </button>
    );
}

function VerificationForm({ code, setCode, error, loading, handleVerification, setVerifying }: any) {
    return (
        <div>
            <div className="mb-8">
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)' }}
                >
                    <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-2xl font-black tracking-tight uppercase" style={{ color: 'var(--foreground)' }}>
                    Identity Check
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Security code sent to your email
                </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-5">
                <div className="space-y-1.5">
                    <label
                        className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 block"
                        style={{ color: 'var(--muted-foreground)' }}
                    >
                        Verification Code
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e: any) => setCode(e.target.value)}
                        placeholder="· · · · · ·"
                        className="w-full py-5 rounded-xl font-black text-3xl tracking-[0.5em] text-center outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--muted)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--primary), transparent 80%)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {error && <ErrorMessage message={error} />}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'var(--primary-foreground)',
                        boxShadow: '0 4px 24px color-mix(in srgb, var(--primary), transparent 50%)',
                    }}
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Complete Enrollment <ShieldCheck size={16} /></>}
                </button>

                <button
                    type="button"
                    onClick={() => setVerifying(false)}
                    className="w-full text-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-70"
                    style={{ color: 'var(--muted-foreground)' }}
                >
                    Return to Registration
                </button>
            </form>
        </div>
    );
}
