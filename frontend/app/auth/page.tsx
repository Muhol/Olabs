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
    Zap, 
    Layers,
    ChevronLeft
} from 'lucide-react';
import { checkAuthPolicy } from '@/lib/api';

export default function AuthPage() {
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

            // If registering, check general policy first
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
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (err: any) {
            console.error("[AUTH] Google Redirect Error:", err);
            setError('Failed to initialize Google security protocol. Please try again.');
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
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                await setSignInActive({ session: result.createdSessionId });
                router.push('/');
            } else {
                console.log(result);
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
        setLoading(true);
        setError('');

        try {
            // Check policy before creating Clerk account
            const policy = await checkAuthPolicy(email);
            if (!policy.allowed) {
                setError(policy.reason || 'Registration is currently restricted.');
                setLoading(false);
                return;
            }

            await signUp.create({
                emailAddress: email,
                password,
            });

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
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

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
        <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden font-nunito relative">
            {/* Background Animated Glows (Project specific) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-700" />
            
            {/* Main Container */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-[1000px] h-[750px] glass-card rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(16,185,129,0.05)] bg-white/5 backdrop-blur-3xl"
            >
                {/* 1. Login Half */}
                <div className={`w-full md:w-1/2 h-full flex items-center justify-center p-8 transition-opacity duration-300 ${!isLogin && !verifying ?'opacity-0 pointer-events-none md:opacity-50' : 'opacity-100'}`}>
                    <div className="w-full max-w-sm">
                        {verifying ? (
                            <VerificationForm 
                                code={code} 
                                setCode={setCode} 
                                error={error} 
                                loading={loading} 
                                handleVerification={handleVerification}
                                setVerifying={setVerifying}
                            />
                        ) : (
                            <>
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Systems Access</h3>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Protocol Delta-V • Verify ID</p>
                                </div>

                                <form onSubmit={handleSignIn} className="space-y-6">
                                    <Input 
                                        label="Archive Email"
                                        type="email"
                                        icon={<Mail size={18} />}
                                        value={email}
                                        onChange={(e: any) => setEmail(e.target.value)}
                                        placeholder="admin@arch.org"
                                    />
                                    <Input 
                                        label="Security Key"
                                        type="password"
                                        icon={<Lock size={18} />}
                                        value={password}
                                        onChange={(e: any) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />

                                    {error && isLogin && <ErrorMessage message={error} />}

                                    <button 
                                        type="submit" 
                                        disabled={loading || !isLogin}
                                        className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading && isLogin ? <Loader2 className="animate-spin" size={18} /> : <>Initialize Access <ArrowRight size={16} /></>}
                                    </button>
                                </form>

                                <div className="mt-8 mb-8 flex items-center gap-4">
                                    <div className="flex-1 h-px bg-white/5" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">or use biometric profile</span>
                                    <div className="flex-1 h-px bg-white/5" />
                                </div>

                                <GoogleButton loading={loadingSocial} onClick={signInWithGoogle} />
                                
                                <button onClick={() => setIsLogin(false)} className="md:hidden w-full mt-6 text-primary font-black uppercase text-[10px] tracking-widest text-center">
                                    Need New Access? Register Protocol
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Signup Half */}
                <div className={`w-full md:w-1/2 h-full flex items-center justify-center p-8 transition-opacity duration-300 ${isLogin || verifying ? 'opacity-0 pointer-events-none md:opacity-50' : 'opacity-100'}`}>
                    <div className="w-full max-w-sm">
                        <div className="mb-10 text-center md:text-left">
                            <h3 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Archive Entry</h3>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Protocol Omega • Enrollment</p>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-6">
                            <Input 
                                label="New ID Identifier"
                                type="email"
                                icon={<Mail size={18} />}
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="cadet@arch.org"
                            />
                            <Input 
                                label="Establish Security Key"
                                type="password"
                                icon={<Lock size={18} />}
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                placeholder="Min 8 characters"
                            />

                            {error && !isLogin && !verifying && <ErrorMessage message={error} />}

                            <button 
                                type="submit" 
                                disabled={loading || isLogin}
                                className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading && !isLogin ? <Loader2 className="animate-spin" size={18} /> : <>Generate Protocol <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        <div className="mt-8 mb-8 flex items-center gap-4">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">external intake</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <GoogleButton loading={loadingSocial} onClick={signInWithGoogle} isRegister />

                        <button onClick={() => setIsLogin(true)} className="md:hidden w-full mt-6 text-primary font-black uppercase text-[10px] tracking-widest text-center">
                            Already Authorized? Return to Command
                        </button>
                    </div>
                </div>

                {/* 3. Toggle Panel (Desktop Overlay) */}
                <motion.div 
                    initial={false}
                    animate={{ x: isLogin ? '100%' : '0%' }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-primary to-secondary z-30 flex-col items-center justify-center p-12 text-white text-center shadow-2xl"
                    style={{ borderRadius: isLogin ? '0 3rem 3rem 0' : '3rem 0 0 3rem' }}
                >
                    <div className="space-y-8 max-w-xs">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/30 animate-float shadow-2xl overflow-hidden p-4">
                             {/* Use the app logo placeholder L */}
                             <div className="w-full h-full rounded-2xl bg-white/20 flex items-center justify-center font-black text-4xl">L</div>
                        </div>
                        
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                                {isLogin ? 'Ready to Deploy?' : 'Join the Archives'}
                            </h2>
                            <p className="text-white/80 font-bold text-sm tracking-wide leading-relaxed">
                                {isLogin 
                                    ? 'Initialize your credentials and access the quantum library archives.' 
                                    : 'Establish your digital identity and become a part of the professional network.'}
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setVerifying(false);
                                setError('');
                            }}
                            className="w-full py-4 bg-white text-primary font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                            {isLogin ? 'Register New Access' : 'Return to Security Gate'}
                        </button>
                    </div>
                    
                    {/* Branding footer in panel */}
                    <div className="absolute bottom-10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">L</div>
                        <span className="font-black tracking-widest text-[10px]">STAR PRO • SECURITY V4</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Global Logo & Footer */}
            <div className="absolute top-8 left-8 flex items-center gap-3 z-50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black text-white shadow-xl shadow-primary/20">
                    L
                </div>
                <span className="font-black tracking-tight text-xl text-white">STAR PRO</span>
            </div>
            
            <p className="absolute bottom-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] z-50 px-4 text-center">
                Authorized Personnel Only • Digital Fingerprint Logged
            </p>
        </div>
    );
}

// --- Sub-components ---

function Input({ label, icon, ...props }: any) {
    return (
        <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">
                    {icon}
                </div>
                <input 
                    {...props}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-800"
                />
            </div>
        </div>
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {message}
        </div>
    );
}

function GoogleButton({ loading, onClick, isRegister }: { loading: boolean, onClick: () => void, isRegister?: boolean }) {
    return (
        <button 
            type="button"
            disabled={loading}
            onClick={onClick}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
        >
            {loading ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={18} />
                    <span className="uppercase text-[10px] tracking-[0.2em] font-black text-slate-400">Verifying Protocol...</span>
                </div>
            ) : (
                <>
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="uppercase text-[10px] tracking-[0.2em] font-black">
                        {isRegister ? 'Register with Google Security' : 'Verify Archive Google ID'}
                    </span>
                </>
            )}
        </button>
    );
}

function VerificationForm({ code, setCode, error, loading, handleVerification, setVerifying }: any) {
    return (
        <div className="animate-in zoom-in-95 duration-500">
            <div className="mb-10 text-center md:text-left">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Identity Check</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Verification code sent to email</p>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 text-left block">Enter Verification Vector</label>
                    <input 
                        type="text" 
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e: any) => setCode(e.target.value)}
                        placeholder="· · · · · ·"
                        className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-3xl tracking-[0.5em] text-center focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-800"
                    />
                </div>

                {error && <ErrorMessage message={error} />}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Verify Archive Identity <ShieldCheck size={16} /></>}
                </button>
                
                <button 
                    type="button"
                    onClick={() => setVerifying(false)}
                    className="w-full text-slate-500 text-[10px] uppercase font-black tracking-widest hover:text-white transition-colors"
                >
                    Back to initial configuration
                </button>
            </form>
        </div>
    );
}
