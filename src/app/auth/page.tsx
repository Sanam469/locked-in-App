"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      let result;
      // Using 'any' here to bypass the TypeScript Window interface check
      const electron = (window as any).electronAPI;

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
      }
    } catch (err) {
      console.error("IPC Bridge Error:", err);
      setError("System Connection Error");
    }
  };

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
                onChange={(e: any) => setUsername(e.target.value)}
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
              onChange={(e: any) => setEmail(e.target.value)}
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
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="mt-8 text-center">
              <p className="text-red-400 text-xs font-medium italic">{error}</p>
            </div>
          )}

          <div className="pt-12">
            <button
              type="submit"
              className="w-full py-5 bg-blue-600 text-white rounded-full font-semibold text-base hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </div>
        </form>

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
