"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWardenTheme } from "@/component/ThemeContext";
import {
  LogOut,
  Fingerprint,
  Code,
  Hash,
  User,
  Mail,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useWardenTheme();
  const [profile, setProfile] = useState({
    userId: "loading...",
    username: "loading...",
    email: "loading...",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      const api = (window as any).electronAPI;
      if (!api) return;

      const savedEmail = localStorage.getItem("warden_user_email");
      if (savedEmail) {
        await api.syncSession(savedEmail);
        const result = await api.getProfile();
        if (result.success) {
          setProfile(result.data);
        }
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const electron = (window as any).electronAPI;
      
      // Delay to show the sexy terminal termination state
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (electron?.logout) await electron.logout();
      document.cookie =
        "warden_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      localStorage.clear();
      sessionStorage.clear();
      router.push("/auth");
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-0 mt-8 pb-32 animate-pageIn max-w-[1440px] mx-auto min-h-screen border-t border-white/20">
      {/* LEFT: 20% IDENTITY BLOCK */}
      <aside className="col-span-12 lg:col-span-3 pr-10 border-r border-white/20 pt-12 space-y-16">
        <div className="space-y-6">
          <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            NIT
            <br />
            Srinagar
          </h2>
          <p className="text-xs font-black text-red-600 uppercase tracking-[0.4em]">
            Er. Sanamdeep Singh
          </p>
        </div>

        <div className="space-y-8 pt-10 border-t border-white/10">
          <IdentityItem
            icon={<Fingerprint size={18} />}
            label="Student_ID"
            value="2024BCSE027"
          />
          <IdentityItem
            icon={<Code size={18} />}
            label="Dev_Stack"
            value="Next.js / Electron / SQLite"
          />
        </div>
      </aside>

      {/* RIGHT: 80% SYSTEM CONFIG */}
      <div className="col-span-12 lg:col-span-9 pl-16 pt-12 space-y-12">
        <section className="space-y-10">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">
              User Administrative Details
            </h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Verified records from the local Warden database
            </p>
          </div>

          {/* DYNAMIC REGISTRY CARD */}
          <div
            className={`max-w-2xl rounded-sm overflow-hidden transition-all duration-700 border ${
              theme === "cobalt"
                ? "bg-black border-white/10 shadow-none" // MacBook Terminal Style
                : "bg-white border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)]" // Your White Page
            }`}
          >
            {/* WINDOW HEADER */}
            <div
              className={`px-6 py-3 border-b transition-colors duration-700 flex justify-between items-center ${
                theme === "cobalt"
                  ? "bg-[#111] border-white/5"
                  : "bg-neutral-200 border-neutral-200"
              }`}
            >
              <span
                className={`text-[10px] font-black uppercase tracking-[0.4em] ${
                  theme === "cobalt" ? "text-white/40" : "text-neutral-900"
                }`}
                style={{ color: theme === "cobalt" ? "" : "#171717" }}
              >
                USER_DATABASE_SHEET
              </span>
              <div className="flex gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${theme === "cobalt" ? "bg-white/10" : "bg-neutral-400"}`}
                />
                <div
                  className={`w-2 h-2 rounded-full ${theme === "cobalt" ? "bg-white/20" : "bg-neutral-700"}`}
                />
              </div>
            </div>

            {/* DATA ROWS CONTAINER */}
            <div
              className={`divide-y transition-colors duration-700 ${
                theme === "cobalt" ? "divide-white/5" : "divide-neutral-300"
              }`}
            >
              <DataRow
                icon={<Hash size={18} />}
                label="System User ID"
                value={profile.userId}
                iconColor={
                  theme === "cobalt" ? "text-white/40" : "text-neutral-600"
                }
                theme={theme}
              />
              <DataRow
                icon={<User size={18} />}
                label="Operator Username"
                value={profile.username}
                iconColor={
                  theme === "cobalt" ? "text-white/40" : "text-neutral-600"
                }
                theme={theme}
              />
              <DataRow
                icon={<Mail size={18} />}
                label="Primary Relay Email"
                value={profile.email}
                iconColor={
                  theme === "cobalt" ? "text-white/40" : "text-neutral-600"
                }
                theme={theme}
              />
            </div>
          </div>
        </section>

        {/* LOGOUT ACTION: Minimalist & Sleek Redesign */}
        <div className="pt-12 flex justify-start items-center max-w-2xl">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-4 px-6 py-3 border border-transparent hover:border-white/5 hover:bg-white/5 rounded-sm transition-all duration-300 ${
              isLoggingOut 
              ? "text-neutral-600 cursor-wait" 
              : "text-neutral-500 hover:text-red-500 group"
            }`}
          >
            {isLoggingOut ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logging out...</span>
              </div>
            ) : (
              <>
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logout Session</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DataRow({ icon, label, value, iconColor, theme }: any) {
  return (
    <div
      className={`group flex items-center justify-between p-7 transition-colors duration-200 ${
        theme === "cobalt" ? "hover:bg-white/[0.02]" : "hover:bg-neutral-100"
      }`}
    >
      <div className="flex items-center gap-6">
        <div
          className={`${iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-[9px] font-black uppercase tracking-[0.3em] ${
              theme === "cobalt" ? "text-white/20" : "text-neutral-400"
            }`}
            style={{ color: theme === "cobalt" ? "a3a3a3" : "#888888" }}
          >
            {label}
          </span>
        </div>
      </div>
      <span
        className="text-lg font-medium lowercase tracking-tight transition-colors duration-500"
        style={{ color: theme === "cobalt" ? "#ffffff" : "#0a0a0a" }}
      >
        {value}
      </span>
    </div>
  );
}

function IdentityItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-neutral-600">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-medium text-white lowercase tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
