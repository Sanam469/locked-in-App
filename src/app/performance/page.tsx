"use client";
import React, { useEffect, useState } from "react";
import { TrendingUp, BarChart3, Target, Radio } from "lucide-react";

export default function PerformancePage() {
  const MAX_MINS = 300;
  const GOAL_MINS = 120;

  // 1. Updated state to include streak
  const [performanceData, setPerformanceData] = useState({
    currentWeek: new Array(10).fill(0),
    activeIndex: 8,
    rangeLabel: "Jan 15 - Jan 25",
    startDayNumber: 15,
    startMonthName: "Jan",
    streak: 0, // <--- New field added
  });

  const fetchPulse = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      const result = await api.getPerformancePulse();
      if (result.success) {
        setPerformanceData(result.data);
      }
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use the data from our new state object
  const {
    currentWeek,
    activeIndex,
    rangeLabel,
    startDayNumber,
    startMonthName,
    streak, // <--- Destructured here
  } = performanceData;

  const totalMins = currentWeek.reduce((a, b) => a + b, 0);
  const avgMins = Math.round(totalMins / currentWeek.length);
  const peakMins = Math.max(...currentWeek);

  const getDisplayDate = (startDay: number, month: string, index: number) => {
    const date = new Date(2026, 0, startDay + index);
    return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`;
  };

  return (
    <div className="w-full mx-auto min-h-screen p-8 lg:p-16 select-none text-white overflow-hidden font-sans ">
      {/* HEADER */}
      <header className="flex justify-between items-start mb-40">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(219,39,119,1)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-pink-300/50">
              locked_in
            </span>
          </div>
          <h1 className="text-7xl font-thin tracking-[-0.05em] leading-none text-white/20 uppercase">
            Focus{" "}
            <span className="font-black italic text-white tracking-tighter text-10xl">
              Archives
            </span>
          </h1>
        </div>
        <div className="flex gap-20">
          <DetailStat
            label="Telemetry_Range"
            value={rangeLabel}
            unit=""
            highlight={false}
          />
          {/* 2. REAL STREAK INTEGRATED HERE */}
          <DetailStat
            label="Active_Streak"
            value={(streak ?? 0).toString()} // Use ?? 0 as a safety net
            unit="DAYS"
            highlight
          />
        </div>
      </header>

      {/* PILLAR FIELD */}
      <section className="relative h-[450px] flex items-end justify-between w-full px-4 mb-32">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10" />
        {currentWeek.map((mins, i) => (
          <LiquidVial
            key={i}
            index={i}
            mins={mins}
            goal={GOAL_MINS}
            maxMins={MAX_MINS}
            isActive={i === activeIndex}
            displayDate={getDisplayDate(startDayNumber, startMonthName, i)}
          />
        ))}
      </section>

      {/* SUMMARY FOOTER */}
      <footer className="grid grid-cols-10 gap-0 border-t border-white/10 pt-10 mt-auto">
        <div className="col-span-10 flex justify-between items-center">
          <SummaryBlock
            icon={<TrendingUp size={14} className="text-yellow-500" />}
            label="Total_Volume"
            value={`${totalMins}m`}
            sub="Aggregate"
          />
          <div className="h-10 w-[1px] bg-white/5" />
          <SummaryBlock
            icon={<BarChart3 size={14} className="text-pink-500" />}
            label="Daily_Average"
            value={`${avgMins}m`}
            sub="Mean"
          />
          <div className="h-10 w-[1px] bg-white/5" />
          <SummaryBlock
            icon={<Target size={14} className="text-blue-500" />}
            label="Peak_Intensity"
            value={`${peakMins}m`}
            sub="Max Burst"
          />
          <div className="h-10 w-[1px] bg-white/5" />
          <div className="text-right">
            <span className="block text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
              System_Status
            </span>
            <span className="text-sm font-mono font-bold text-yellow-500 flex items-center gap-2">
              <Radio size={12} className="animate-pulse" /> ENFORCING
            </span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes liquidFill {
          0% {
            height: 0%;
            filter: brightness(0);
          }
          100% {
            filter: brightness(1);
          }
        }
        .animate-fill {
          animation: liquidFill 1.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// ... SummaryBlock, DetailStat, and LiquidVial remain UNTOUCHED below ...
function LiquidVial({
  index,
  mins,
  goal,
  maxMins,
  isActive,
  displayDate,
}: any) {
  const progress = Math.min((mins / maxMins) * 100, 100);
  return (
    <div className="relative group flex flex-col items-center h-full flex-1">
      <span
        className={`absolute -top-12 text-[10px] font-black tracking-widest transition-colors duration-500 ${isActive ? "text-yellow-500" : "text-white/50"}`}
      >
        {displayDate}
      </span>
      <div
        className={`absolute inset-x-2 lg:inset-x-4 top-0 bottom-0 border-x border-white/20 bg-white/[0.05] transition-colors duration-500 ${isActive ? "bg-yellow-500/[0.07] border-yellow-500/10" : ""}`}
      />
      <div className="relative w-[1px] h-full bg-white/5">
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] animate-fill rounded-t-full transition-all duration-700 ${isActive ? "bg-yellow-600 shadow-[0_0_35px_rgba(234,179,8,0.8),0_0_10px_rgba(234,179,8,1)]" : "bg-white/40"}`}
          style={{
            height: `${Math.max(progress, 2)}%`,
            animationDelay: `${index * 120}ms`,
          }}
        >
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isActive ? "bg-white shadow-[0_0_15px_white]" : "opacity-0"}`}
          />
        </div>
        <div
          className="absolute -left-14 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0 flex flex-col items-end pointer-events-none"
          style={{ bottom: `${progress}%` }}
        >
          <span className="text-[18px] font-black italic tracking-tighter text-white leading-none">
            {mins}
          </span>
          <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest">
            MINS
          </span>
        </div>
      </div>
      <div
        className={`mt-10 transition-all duration-1000 ${isActive ? "opacity-100" : "opacity-10"}`}
      >
        <span
          className={`text-[9px] font-black uppercase tracking-[0.4em] ${isActive ? "text-yellow-500" : "text-white"}`}
        >
          SLOT_{index + 1}
        </span>
      </div>
    </div>
  );
}

function SummaryBlock({ icon, label, value, sub }: any) {
  return (
    <div className="flex items-center gap-6">
      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-sm">
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black text-white/20 uppercase tracking-widest">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black italic tracking-tighter text-white">
            {value}
          </span>
          <span className="text-[8px] font-bold text-white/10 uppercase tracking-tighter">
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, unit, highlight }: any) {
  return (
    <div className="text-right space-y-1">
      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em]">
        {label}
      </p>
      <p className="text-2xl tracking-[-0.02em]">
        <span
          className={`font-light uppercase tracking-[0.1em] ${highlight ? "font-black italic text-yellow-500" : "text-white/60 font-medium"}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[10px] text-white/20 ml-2 font-bold italic tracking-widest uppercase">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
