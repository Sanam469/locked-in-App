"use client";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import LockdownOverlay from "./LockdownOverlay";
import { useWardenTheme } from "@/component/ThemeContext";

export default function BackgroundShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, isSyncing } = useWardenTheme();

  return (
    <div
      className={`relative min-h-screen transition-colors duration-1000 flex flex-col overflow-hidden isolate ${
        theme === "cobalt" ? "bg-[#0f121a]" : "bg-[#050505]"
      }`}
    >
      {/* 0. FULL SCREEN OVERLAYS */}
      <LockdownOverlay />
      {isSyncing && (
        <div className="fixed inset-0 z-[9999] bg-white/5 backdrop-blur-[2px] animate-pulse pointer-events-none" />
      )}

      {/* 1. DYNAMIC BACKGROUND LAYER - PREMIUM TECH MESH */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {theme === "cobalt" ? (
          <>
            <div className="absolute inset-0 bg-[#07090e]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0c0f1a_0%,#07090e_80%)]" />
            
            {/* Reduced Brightness Sapphire Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)] blur-[120px] animate-blob-drift" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(139,92,246,0.05)_0%,transparent_70%)] blur-[100px] animate-blob-drift-reverse" />
            
            <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] bg-[radial-gradient(circle,rgba(59,130,246,0.03)_0%,transparent_60%)] blur-[90px] animate-slow-float" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#060606]" />
            {/* Base Depth - Back to Grey-Black Obsidian */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0f0f0f_0%,#060606_80%)]" />
            
            {/* Reduced Brightness Ember Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(234,88,12,0.08)_0%,transparent_70%)] blur-[120px] animate-blob-drift" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(239,68,68,0.05)_0%,transparent_70%)] blur-[100px] animate-blob-drift-reverse" />
            
            <div className="absolute top-[40%] left-[20%] w-[35%] h-[35%] bg-[radial-gradient(circle,rgba(249,115,22,0.03)_0%,transparent_60%)] blur-[90px] animate-slow-float" />
          </>
        )}
      </div>

      {/* 2. TECHNICAL GRID & HUD TEXTURE - FULL APP SPAN */}
      <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.4]">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(var(--line-color) 1px, transparent 1px), linear-gradient(90deg, var(--line-color) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* 3. VIGNETTE & GRAIN */}
      <div className="absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] z-[3]"
        style={{
          backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 md:px-12 py-10 flex flex-col grow animate-pageIn">
        <Header />
        <main className="grow w-full flex flex-col pt-4">{children}</main>
        <Footer />
      </div>

      <style jsx global>{`
        :root {
          --cobalt: #2563eb;
          --warden: #c2410c;
        }

        .theme-cobalt {
          --bg-primary: radial-gradient(circle at 50% 50%, #121216 0%, #000000 100%);
          --accent: var(--cobalt);
          --line-color: rgba(255, 255, 255, 0.08);
          --accent-glow: rgba(59, 130, 246, 0.3);
        }

        .theme-warden {
          --bg-primary: radial-gradient(circle at 50% 50%, #15151a 0%, #000000 100%);
          --accent: var(--warden);
          --line-color: rgba(255, 255, 255, 0.08);
          --accent-glow: rgba(234, 88, 12, 0.3);
        }

        .dynamic-border {
          border-color: var(--line-color) !important;
          transition: border-color 0.7s ease;
        }

        /* TEXT RENDERING BOOST */
        .text-slate-900, .text-slate-800, .text-blue-950, .text-black, .text-white {
          color: #ffffff !important;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .text-slate-400, .text-slate-500, .text-neutral-500 {
          color: #94a3b8 !important;
          letter-spacing: 0.05em;
        }

        /* THEME ACCENT MAPPING */
        .text-blue-600, .text-blue-500, .text-red-600 {
          color: var(--accent) !important;
          filter: drop-shadow(0 0 4px var(--accent-glow));
        }

        /* LOGIN TEXT: WHITE ONLY */
        .text-blue-600\/90, .text-blue-500\/60, .text-red-600\/90 {
          color: #ffffff !important;
          opacity: 0.9;
        }

        .bg-blue-600, .bg-blue-500, .bg-red-600 {
          background-color: var(--accent) !important;
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .border-blue-600, .border-blue-500, .border-blue-600\/50 {
          border-color: var(--accent) !important;
        }

        .shadow-blue-500, .shadow-blue-600 {
          --tw-shadow-color: var(--accent-glow) !important;
          --tw-shadow: 0 0 25px var(--accent-glow) !important;
        }

        /* ANIMATIONS */
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(8%, 12%) scale(1.15); }
          66% { transform: translate(-4%, 15%) scale(0.9); }
        }
        @keyframes blob-drift-reverse {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          33% { transform: translate(-12%, -8%) scale(0.95); }
          66% { transform: translate(8%, -15%) scale(1.05); }
        }
        @keyframes slow-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15%, -10%); }
        }
        @keyframes slow-float-reverse {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10%, 15%); }
        }
        @keyframes scan-y {
          0% { transform: translateY(-30vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes slowPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        .animate-blob-drift { animation: blob-drift 25s ease-in-out infinite; }
        .animate-blob-drift-reverse { animation: blob-drift-reverse 30s ease-in-out infinite; }
        .animate-slow-float { animation: slow-float 22s ease-in-out infinite; }
        .animate-slow-float-reverse { animation: slow-float-reverse 28s ease-in-out infinite; }
        .animate-scan-y { animation: scan-y 10s linear infinite; }
        .animate-slowPulse { animation: slowPulse 12s ease-in-out infinite; }

        @keyframes pageIn {
          from {
            opacity: 0;
            filter: blur(20px) brightness(0.5);
            transform: scale(0.97) translateY(30px);
          }
          to {
            opacity: 1;
            filter: blur(0px) brightness(1);
            transform: scale(1) translateY(0);
          }
        }

        .animate-pageIn {
          animation: pageIn 1400ms cubic-bezier(0.19, 1, 0.22, 1) both;
        }

        main {
          will-change: transform, opacity, filter;
        }

        /* CUSTOM UTILITIES */
        .glass-panel {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid var(--line-color);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .tech-spinner {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--accent);
          border-bottom-color: var(--accent);
          animation: tech-spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          position: relative;
        }
        .tech-spinner:before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid var(--accent);
          opacity: 0.3;
          animation: tech-pulse 2s ease-in-out infinite;
        }
        @keyframes tech-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes tech-pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
