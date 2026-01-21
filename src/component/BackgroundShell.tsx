"use client";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useWardenTheme } from "@/component/ThemeContext";

export default function BackgroundShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useWardenTheme();

  return (
    <div
      className={`relative min-h-screen transition-colors duration-700 flex flex-col overflow-hidden isolate ${
        theme === "cobalt" ? "bg-[#1e222b]" : "bg-[#050505]"
      }`}
    >
      {/* 1. DYNAMIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {theme === "cobalt" ? (
          <>
            <div className="absolute inset-0 animate-slowWave bg-[radial-gradient(circle_at_50%_50%,#2d364d_0%,#1e222b_35%,#161b22_70%,#1e222b_100%)] opacity-40 blur-[100px]" />
            <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.15),transparent_70%)]" />
          </>
        ) : (
          <>
            {/* THE EFFECT: Deep Charcoal to Obsidian Sink */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 40%, #050505 100%)`,
              }}
            />

            {/* Subtle Top "Glow" for Depth (No Orange) */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
          </>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
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
          --cobalt: #3b82f6;
          --warden: #ea580c;
        }

        .theme-cobalt {
          --accent: var(--cobalt);
          /* Very faint white for dark blue bg */
          --line-color: rgba(255, 255, 255, 0.12);
        }

        .theme-warden {
          --accent: var(--warden);
          /* Crisp but transparent white for black bg */
          --line-color: rgba(255, 255, 255, 0.12);
        }
        .dynamic-border {
          border-color: var(--line-color) !important;
          transition: border-color 0.7s ease;
        }

        .text-slate-900,
        .text-slate-800,
        .text-blue-950,
        .text-black {
          color: #ffffff !important;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }

        .text-slate-400,
        .text-slate-500,
        .text-neutral-500 {
          color: #e2e8f0 !important;
        }

        .text-blue-600,
        .text-red-600 {
          color: var(--accent) !important;
        }

        @keyframes slowWave {
          0% {
            transform: translate(-5%, -5%) rotate(0deg);
          }
          50% {
            transform: translate(5%, 5%) rotate(5deg);
          }
          100% {
            transform: translate(-5%, -5%) rotate(0deg);
          }
        }
        .animate-slowWave {
          animation: slowWave 25s ease-in-out infinite;
          filter: blur(100px);
        }
        @keyframes pageIn {
          from {
            opacity: 0;
            filter: blur(12px);
            transform: scale(0.99) translateY(10px);
          }
          to {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1) translateY(0);
          }
        }

        .animate-pageIn {
          animation: pageIn 1000ms cubic-bezier(0.19, 1, 0.22, 1) both;
        }

        main {
          will-change: transform, opacity, filter;
        }
      `}</style>
    </div>
  );
}
