"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useWardenTheme } from "@/component/ThemeContext";
import { Zap, Moon } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme, isSyncing, setIsSyncing } = useWardenTheme();

  const getHeaderInfo = () => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "System Dashboard",
          sub: "Select your containment protocol.",
        };
      case "/performance":
        return {
          title: "Performance",
          sub: "Tracking focus metrics and breach attempts.",
        };
      default:
        return {
          title: "Locked-In",
          sub: "Account overview & session details",
        };
    }
  };

  const { title, sub } = getHeaderInfo();

  const handleToggle = () => {
    setIsSyncing(true);
    // Subtle delay for the "premium" system sync feel
    setTimeout(() => {
      toggleTheme();
      setIsSyncing(false);
    }, 800);
  };

  return (
    <header className="mb-12 flex justify-between items-start pl-16">

      <div>
        <div className="flex items-center gap-3">
          <div
            className="h-[1px] w-8 bg-blue-600"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
            {title}
          </h1>
        </div>
        <p className="text-[10px] font-bold text-neutral-500 ml-11 uppercase tracking-[0.2em]">
          {sub}
        </p>
      </div>

      {/* THE THEME TOGGLE */}
      <button
        onClick={handleToggle}
        disabled={isSyncing}
        className={`flex items-center gap-3 px-4 py-2 border transition-all group rounded-lg ${isSyncing
            ? "border-blue-500/50 bg-blue-500/10"
            : "border-white/10 hover:border-white/20 bg-black/20"
          }`}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
          {isSyncing ? "SYNCING..." : `Mode: ${theme}`}
        </span>
        <div
          className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-500 ${isSyncing
              ? "bg-white animate-ping"
              : theme === "cobalt"
                ? "bg-blue-500 shadow-blue-500 animate-pulse"
                : "bg-orange-600 shadow-orange-600 animate-pulse"
            }`}
        />
      </button>
    </header>
  );
}
