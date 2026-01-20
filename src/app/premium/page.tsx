"use client";
import React from "react";
import { Crown, Zap, Globe, Cpu, ChevronRight } from "lucide-react";
import { useWardenTheme } from "@/component/ThemeContext";

export default function PremiumPage() {
  const { theme } = useWardenTheme();

  return (
    <div className="flex flex-col gap-24 mt-8 pb-32 animate-pageIn max-w-[1440px] mx-auto min-h-screen border-t border-white/20 pt-12">
      {/* HEADER SECTION */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <Crown
            size={28}
            className={
              theme === "cobalt" ? "text-amber-400" : "text-orange-500"
            }
            style={{ filter: `drop-shadow(0 0 10px var(--accent-glow))` }}
          />
          <h2
            className="text-xs font-black uppercase tracking-[0.6em]"
            style={{ color: "var(--accent)" }}
          >
            Elite Protocol
          </h2>
        </div>
        <h1 className="text-7xl lg:text-9xl font-black text-white italic tracking-tighter uppercase leading-[0.8] max-w-5xl">
          Extend Your <br />{" "}
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}
          >
            Authority
          </span>
        </h1>
      </section>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-12 gap-0 border-t border-white/10 pt-20">
        <aside className="col-span-12 lg:col-span-3 pr-10 border-r border-white/10">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">
            Availability
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: "var(--accent)",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
            <p
              className="text-2xl font-black italic uppercase tracking-tighter"
              style={{ color: "var(--accent)" }}
            >
              Premium Link Required
            </p>
          </div>
        </aside>

        <div className="col-span-12 lg:col-span-9 pl-16 grid grid-cols-1 md:grid-cols-2 gap-20">
          <FeatureBlock
            title="Cloud Handshake"
            desc="Synchronize focus perimeters across all your institutional devices."
            icon={<Globe size={18} />}
          />
          <FeatureBlock
            title="Heuristic AI"
            desc="Predictive analysis to stop distractions before they happen."
            icon={<Cpu size={18} />}
          />
          <FeatureBlock
            title="Network Warden"
            desc="Lock down your entire home network during deep work sessions."
            icon={<Zap size={18} />}
          />
          <FeatureBlock
            title="Deep Analytics"
            desc="Export professional-grade focus reports to your CSE mentors."
            icon={<ChevronRight size={18} />}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureBlock({ title, desc, icon }: any) {
  return (
    <div className="group space-y-4 border-l-2 border-white/5 pl-8 hover:border-white/40 transition-all duration-500">
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">
          {title}
        </h4>
      </div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
