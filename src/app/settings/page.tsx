"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Fingerprint,
  Code,
  Hash,
  User,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    userId: "LOADING...",
    username: "LOADING...",
    email: "LOADING...",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      const api = (window as any).electronAPI;
      if (!api) return;

      // 1. Ensure the Main process knows who we are (Persistence)
      const savedEmail = localStorage.getItem("warden_user_email");
      if (savedEmail) {
        await api.syncSession(savedEmail);

        // 2. Now fetch the actual profile details
        const result = await api.getProfile();
        if (result.success) {
          setProfile(result.data);
        }
      }
    };

    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      const electron = (window as any).electronAPI;

      // 1. Tell the Main Process to wipe global.currentUserId
      if (electron?.logout) {
        await electron.logout();
      }

      // 2. Terminate the session cookie so Middleware blocks access
      document.cookie =
        "warden_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

      // 3. Clear local storage to prevent data leakage between users
      localStorage.clear();
      sessionStorage.clear();

      // 4. Return to the auth gate
      router.push("/auth");
    } catch (err) {
      console.error("Logout error:", err);
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
            value="Next.js / Electron"
          />
        </div>
      </aside>

      {/* RIGHT: 80% GLOWY SYSTEM CONFIG */}
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

          <div className="space-y-4 max-w-2xl">
            <DataRow
              icon={<Hash size={18} />}
              label="System User ID"
              value={profile.userId}
              glowColor="blue"
            />
            <DataRow
              icon={<User size={18} />}
              label="Username"
              value={profile.username}
              glowColor="purple"
            />
            <DataRow
              icon={<Mail size={18} />}
              label="Primary Email"
              value={profile.email}
              glowColor="emerald"
            />
          </div>
        </section>

        {/* LOGOUT ACTION */}
        <div className="pt-12 border-t border-white/10 max-w-2xl">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-6 border-2 border-red-500/10 hover:border-red-600 bg-red-500/5 hover:bg-red-600 transition-all group duration-300"
          >
            <div className="flex items-center gap-6">
              <LogOut
                size={22}
                className="text-red-500 group-hover:text-white transition-colors"
              />
              <div className="text-left">
                <span className="block text-xs font-black text-white uppercase tracking-[0.4em]">
                  Terminate Application Session
                </span>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-red-100 transition-colors">
                  Logout and return to authentication gate
                </span>
              </div>
            </div>
            <ShieldCheck
              size={20}
              className="text-red-500/30 group-hover:text-white transition-all"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- UI COMPONENTS --- */

function DataRow({ icon, label, value, glowColor }: any) {
  // Glow Mapping for a "High-Tech" feel
  const glowStyles: any = {
    blue: "group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-blue-500",
    purple:
      "group-hover:border-purple-500/50 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] text-purple-500",
    emerald:
      "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-500",
  };

  const textGlow: any = {
    blue: "group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    purple: "group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    emerald: "group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  };

  return (
    <div className="group relative flex items-center justify-between p-7 transition-all duration-500 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] overflow-hidden">
      {/* GLOWING ACCENT LINE */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-500 bg-neutral-800 ${glowStyles[glowColor].split(" ")[0]}`}
      />

      <div className="flex items-center gap-6 relative z-10">
        <div
          className={`transition-all duration-500 group-hover:scale-110 ${glowStyles[glowColor].split(" ").pop()}`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] group-hover:text-neutral-300 transition-colors">
            {label}
          </span>
        </div>
      </div>

      <span
        className={`text-xl font-bold text-white uppercase italic tracking-tighter transition-all duration-500 ${textGlow[glowColor]}`}
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
        <p className="text-sm font-bold text-white uppercase tracking-tighter italic">
          {value}
        </p>
      </div>
    </div>
  );
}
