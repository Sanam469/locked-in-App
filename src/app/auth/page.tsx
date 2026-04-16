"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  // AUTO-LOGIN: Check for existing session on mount
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const savedEmail = localStorage.getItem("warden_user_email");
        const hasCookie = document.cookie.includes("warden_session_token=active");

        if (savedEmail && hasCookie) {
          const api = (window as any).electronAPI;
          if (api) {
            const result = await api.syncSession(savedEmail);
            if (result?.success) {
              router.push("/dashboard");
              return; // Don't set checkingSession to false — we're navigating away
            }
          }
        }
      } catch (err) {
        console.error("Auto-login check failed:", err);
      }
      setCheckingSession(false);
    };

    tryAutoLogin();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsAuthenticating(true);
    try {
      let result;
      // Using 'any' here to bypass the TypeScript Window interface check
      const electron = (window as unknown as { electronAPI: { login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>; signUp: (credentials: { email: string; password: string; username: string }) => Promise<{ success: boolean; error?: string }> } }).electronAPI;

      // Add a slight artificial delay for the "sexy" loading effect
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (isLogin) {
        result = await electron.login({ email, password });
      } else {
        result = await electron.signUp({ email, password, username });
      }

      if (result && result.success) {
        // Success! Move to the dashboard
        const MAX_AGE = 60 * 60 * 24 * 400;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 400);
        localStorage.setItem("warden_user_email", email);
        document.cookie = `warden_session_token=active; path=/; max-age=${MAX_AGE}; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
        router.push("/dashboard");
      } else {
        setError(result?.error || "Authentication Failed");
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error("IPC Bridge Error:", err);
      setError("System Connection Error");
      setIsAuthenticating(false);
    }
  };

  // Don't flash the login form while we check for an existing session
  if (checkingSession) {
    return <div className="min-h-[85vh]" />;
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-transparent font-sans">
      <div className="w-full max-w-lg px-8 py-10">
        <div className="mb-14 text-center">
          <h2 className="text-5xl font-light text-white tracking-tight">
            {isLogin ? "Login" : "Sign Up"}
          </h2>
          <p className="text-blue-500/60 text-base mt-3 font-medium uppercase tracking-[0.2em]">
            {isLogin ? "Welcome Back" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          {!isLogin && (
            <div className="flex items-center border-b border-white/10 py-6 group">
              <label className="w-36 text-sm font-bold uppercase tracking-wider text-blue-600/90">
                Username
              </label>
              <div className="h-8 w-[1px] bg-white/20 mx-6"></div>
              <input
                type="text"
                className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-800 text-lg"
                placeholder="Enter username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-center border-b border-white/10 py-6 group">
            <label className="w-36 text-sm font-bold uppercase tracking-wider text-blue-600/90">
              Email
            </label>
            <div className="h-8 w-[1px] bg-white/20 mx-6"></div>
            <input
              type="email"
              className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-800 text-lg"
              placeholder="operator@system.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center border-b border-white/10 py-6 group">
            <label className="w-36 text-sm font-bold uppercase tracking-wider text-blue-600/90">
              Password
            </label>
            <div className="h-8 w-[1px] bg-white/20 mx-6"></div>
            <input
              type="password"
              className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-800 text-lg"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="mt-8 text-center">
              <p className="text-red-400 text-xs font-medium italic">{error}</p>
            </div>
          )}

          <div className="pt-12 flex justify-center">
            <button
              type="submit"
              disabled={isAuthenticating}
              className={`flex items-center gap-4 px-6 py-3 border border-transparent hover:border-white/5 hover:bg-white/5 rounded-sm transition-all duration-300 ${
                isAuthenticating 
                ? "text-neutral-600 cursor-wait" 
                : "text-blue-500/60 hover:text-blue-400 group"
              }`}
            >
              {isAuthenticating ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Authenticating...</span>
                </div>
              ) : (
                <>
                  {isLogin ? <LogIn size={14} /> : <UserPlus size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    {isLogin ? "Access System" : "Create Account"}
                  </span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform opacity-30" />
                </>
              )}
            </button>
          </div>
        </form>

        <style jsx>{`
          }
          .animate-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `}</style>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
 