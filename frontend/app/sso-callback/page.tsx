import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-nunito">
        <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Archive Credentials...</p>
        </div>
        <AuthenticateWithRedirectCallback />
    </div>
  );
}
