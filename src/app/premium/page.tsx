"use client";
import React from "react";
import { Crown, Zap, Globe, Cpu, ChevronRight, Lock } from "lucide-react";
import { useWardenTheme } from "@/component/ThemeContext";

export default function PremiumPage() {
  const { theme } = useWardenTheme();

  return (
    <div className="relative min-h-screen ">
      {/* 1. THE HEAVY GLASS RESTRAINT */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
        {/* EXTREME FROSTED GLASS - HEAVY BLUR */}
        <div className="absolute inset-0 backdrop-blur-[15px] " />

        {/* ETCHED LOCK & PROTOCOL TEXT */}
        <div className="relative flex flex-col items-center gap-10 animate-slowFloat">
          {/* The Lock - Clinical & Sharp */}
          <div className="relative">
            <Lock
              size={100}
              className="text-white/90 relative z-10"
              strokeWidth={0.5}
            />
          </div>

          {/* Clinical Typography - Archives Style */}
          <div className="text-center space-y-4 relative z-10">
            <div className="space-y-1">
              <p className="text-4xl font-light uppercase tracking-[0.4em] text-white/95">
                Premium Required
              </p>
              <p className="text-[9px] font-black text-white/75 uppercase tracking-[1em] pl-[1em]">
                Authorization_RESTRICTED
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 opacity-40">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE CONTENT (Buried deep behind the frost) */}
      <div className="flex flex-col gap-24 mt-8 pb-32 max-w-[1440px] mx-auto pt-12 px-8 lg:px-16 transition-all duration-700">
        <section className="space-y-10">
          <div className="flex items-center gap-4">
            <Crown
              size={28}
              className={
                theme === "cobalt" ? "text-amber-400" : "text-orange-500"
              }
            />
            <h2
              className="text-xs font-black uppercase tracking-[0.6em]"
              style={{ color: "var(--accent)" }}
            >
              Elite Protocol
            </h2>
          </div>
          <h1 className="text-7xl lg:text-9xl font-black text-gray-500 italic tracking-tighter uppercase leading-[0.8] max-w-5xl">
            Extend Your <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}
            >
              Authority
            </span>
          </h1>
        </section>

        <div className="grid grid-cols-12 gap-0 border-t border-white/10 pt-20">
          <aside className="col-span-3 pr-10 border-r border-white/10">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-4">
              Availability
            </p>
            <p className="text-xl font-light uppercase tracking-[0.2em] text-white/70">
              MOBILE CAGE- UNDER MAINTAINANCE
            </p>
          </aside>

          <div className="col-span-9 pl-16 grid grid-cols-1 md:grid-cols-2 gap-20">
            <FeatureBlock
              title="Cloud Handshake"
              desc="Synchronize focus perimeters across devices."
              icon={<Globe size={18} />}
            />
            <FeatureBlock
              title="Heuristic AI"
              desc="Predictive analysis to stop distractions."
              icon={<Cpu size={18} />}
            />
            <FeatureBlock
              title="Network Warden"
              desc="Lock down your entire home network."
              icon={<Zap size={18} />}
            />
            <FeatureBlock
              title="Deep Analytics"
              desc="Export professional-grade focus reports."
              icon={<ChevronRight size={18} />}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slowFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        .animate-slowFloat {
          animation: slowFloat 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function FeatureBlock({ title, desc, icon }: any) {
  return (
    <div className="group space-y-4 border-l-2 border-white/5 pl-8">
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h4 className="text-lg font-black text-gray-500 uppercase italic tracking-tighter">
          {title}
        </h4>
      </div>
      <p className="text-xs text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
