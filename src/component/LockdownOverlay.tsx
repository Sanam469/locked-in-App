"use client";
import React, { useState, useEffect } from "react";
import { useWardenTheme } from "./ThemeContext";

export default function LockdownOverlay() {
  const { isLocking, setIsLocking } = useWardenTheme();
  const [status, setStatus] = useState("INITIALIZING_PROTOCOL");

  useEffect(() => {
    if (isLocking) {
      const timers = [
        setTimeout(() => setStatus("DEPLOYING_CAGE"), 1200),
        setTimeout(() => setStatus("KERNEL_ISOLATION_ACTIVE"), 2500),
        setTimeout(() => setStatus("SYSTEM_LOCKED"), 3800),
      ];
      
      const mainTimeout = setTimeout(() => {
        setIsLocking(false);
      }, 5000);

      return () => {
        timers.forEach(clearTimeout);
        clearTimeout(mainTimeout);
      };
    }
  }, [isLocking, setIsLocking]);

  if (!isLocking) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white/5 backdrop-blur-[10px] animate-pulse pointer-events-none">
      <div className="flex flex-col items-center gap-6">
        <div className="tech-spinner scale-[2]" />
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            {status}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
            Protocol: Alpha Enforcement
          </p>
        </div>
      </div>
    </div>
  );
}
