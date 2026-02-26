import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-google-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Authenticating Staff Identity...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
