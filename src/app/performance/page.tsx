"use client";
import { Target, Zap, Activity, ShieldAlert, BarChart3 } from "lucide-react";
import { useWardenTheme } from "@/component/ThemeContext";

export default function PerformancePage() {
  const { theme } = useWardenTheme();

  return (
    <div className="grid grid-cols-12 gap-0 mt-8 pb-32 animate-pageIn w-full min-h-screen border-t dynamic-border">
      {/* LEFT: TELEMETRY (25% / 3 cols) */}
      <aside className="col-span-12 lg:col-span-3 pr-10 border-r dynamic-border pt-12 space-y-12">
        <div className="space-y-10">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
            Telemetry
          </h3>
          <div className="space-y-10">
            <StatDetail label="Success Rate" value="94%" />
            <StatDetail label="Total Focus" value="128h" />
            <StatDetail label="Current Streak" value="12D" highlight />
          </div>
        </div>
      </aside>

      {/* RIGHT: INTENSITY GRAPH (75% / 9 cols) */}
      <div className="col-span-12 lg:col-span-9 pl-16 pt-12 space-y-24">
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">
              Focus Intensity Graph
            </h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Jan 08 - Jan 15
            </span>
          </div>

          <div className="h-80 flex items-end justify-between border-b-2 dynamic-border pb-4 relative">
            {[40, 70, 45, 90, 65, 80, 30].map((h, i) => (
              <div
                key={i}
                className="w-full mx-4 flex flex-col items-center gap-6 group"
              >
                <div
                  className="w-full bg-white/5 transition-all relative overflow-hidden"
                  style={{ height: `${h}%` }}
                >
                  {/* Dynamic Accent Bar */}
                  <div
                    className="absolute top-0 left-0 w-full h-[2px] shadow-[0_0_15px_var(--accent)]"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                </div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-tighter italic">
                  D{i + 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatDetail({ label, value, highlight }: any) {
  return (
    <div className="space-y-2 border-l-2 dynamic-border pl-4 transition-colors">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      <p
        className="text-4xl font-black italic tracking-tighter text-white"
        style={{ color: highlight ? "var(--accent)" : "white" }}
      >
        {value}
      </p>
    </div>
  );
}
