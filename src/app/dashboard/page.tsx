"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Terminal,
  Zap,
  Lock,
  Activity,
  ShieldCheck,
  Cpu,
  Key,
  Globe,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(60);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);

  // ADD THIS INSIDE YOUR DashboardPage COMPONENT
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;

    if (isLocked && secondsLeft > 0) {
      // Every 60 seconds, sync 1 minute of focus to the DB
      heartbeatInterval = setInterval(async () => {
        const api = (window as any).electronAPI;
        if (api) {
          // We prepare the local timestamp to match the Performance Page query
          const localTimestamp = new Date()
            .toLocaleString("sv-SE")
            .replace(" ", "T");

          await api.saveSessionData({
            actual_minutes: 1, // Add 1 minute to the total
            start_time: localTimestamp,
            target_site: getDomain(url),
            goal_minutes: minutes,
            status: "SUCCESS",
          });

          // Optionally refresh the "System Enforcement Quota" bar locally
          setTodayMinutes((prev) => prev + 1);
        }
      }, 60000);
    }

    return () => clearInterval(heartbeatInterval);
  }, [isLocked, url, minutes]);

  useEffect(() => {
    const initAndFetchStats = async () => {
      const api = (window as any).electronAPI;
      if (!api) return;

      const savedEmail = localStorage.getItem("warden_user_email");

      if (savedEmail) {
        await api.syncSession(savedEmail);
        const result = await api.getDailyStats();
        if (result?.success) {
          setTodayMinutes(result.minutes || 0);
        }
      }
    };

    initAndFetchStats();

    const logInterval = setInterval(() => {
      const msgs = [
        "ENFORCING_COBALT_CAGE",
        "ENCRYPTION_LAYER_STABLE",
        "MONITORING_THREAD_PRIORITY",
        "UPLINK_VERIFIED",
      ];
      setLogs((prev) => [
        ...prev.slice(-2),
        `:: ${msgs[Math.floor(Math.random() * msgs.length)]}`,
      ]);
    }, 4000);

    let timerInterval: NodeJS.Timeout;
    if (isLocked && secondsLeft > 0) {
      timerInterval = setInterval(
        () => setSecondsLeft((prev) => prev - 1),
        1000,
      );
    }
    return () => {
      clearInterval(logInterval);
      clearInterval(timerInterval);
    };
  }, [isLocked, secondsLeft]);

  const handleLoginPreparation = async () => {
    if (url.trim() === "") return alert("PLEASE INPUT TARGET URL FIRST");
    setLogs((prev) => [...prev, ":: INITIALIZING_GOOGLE_AUTH..."]);
    const api = (window as any).electronAPI;
    if (api) {
      const success = await api.prepareLogin(url);
      if (success) {
        setIsAuthenticated(true);
        setLogs((prev) => [...prev, ":: GOOGLE_SESSION_VERIFIED"]);
      }
    }
  };

  const handleUrlLogin = async () => {
    if (url.trim() === "") return alert("PLEASE INPUT TARGET URL FIRST");
    setLogs((prev) => [...prev, ":: INITIALIZING_TARGET_HANDSHAKE..."]);
    const api = (window as any).electronAPI;
    if (api) {
      const success = await api.prepareUrlLogin(url);
      if (success === true) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        alert("Login failed. You must stay logged in to engage the cage.");
      }
    }
  };

  const applyInertia = () => {
    if (!scrollRef.current || isDragging.current) return;
    velocity.current *= 0.95;
    scrollRef.current.scrollLeft += velocity.current;
    if (Math.abs(velocity.current) > 0.1)
      rafId.current = requestAnimationFrame(applyInertia);
    else velocity.current = 0;
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const currentMin = Math.round(scrollRef.current.scrollLeft / 20) + 1;
      setMinutes(Math.max(1, Math.min(180, currentMin)));
    }
  };

  const startDragging = (e: React.MouseEvent) => {
    if (isLocked) return;
    isDragging.current = true;
    lastX.current = e.pageX;
    velocity.current = 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  const stopDragging = () => {
    isDragging.current = false;
    applyInertia();
  };

  const moveWheel = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current || isLocked) return;
    const delta = lastX.current - e.pageX;
    lastX.current = e.pageX;
    velocity.current = delta * 1.5;
    scrollRef.current.scrollLeft += delta;
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = (60 - 1) * 20;
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleInitialize = () => {
    if (!isAuthenticated) return;
    setIsLocked(true);
    setSecondsLeft(minutes * 60);
    const api = (window as any).electronAPI;
    if (api) api.engage({ url, duration: minutes });
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min((todayMinutes / 360) * 100, 100);

  const getDomain = (inputUrl: string) => {
    try {
      return new URL(inputUrl).hostname.toUpperCase();
    } catch {
      return "TARGET SITE";
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen px-10 pt-12 pb-32 animate-pageIn select-none">
      <section className="pb-12">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">
              System Enforcement Quota
            </h3>
            <p className="text-4xl font-black text-slate-900 italic tracking-tighter">
              {Math.round(progressPercent)}%
              <span className="text-xs text-slate-400 not-italic font-bold ml-3">
                / 360 MIN LIMIT
              </span>
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">
            {todayMinutes} MINS ENFORCED
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-200 border dynamic-border rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-0 border-t dynamic-border">
        {/* CLEAN SIDEBAR */}
        <aside className="col-span-12 lg:col-span-3 pr-10 border-r dynamic-border pt-12 space-y-16">
          <div className="space-y-10 text-xs font-bold uppercase">
            <h3 className="text-sm font-black text-slate-400 tracking-[0.3em]">
              Hardware Health
            </h3>
            <div className="flex justify-between text-slate-900">
              <span>Kernel</span>
              <span className="text-blue-600">Stable</span>
            </div>
            <div className="flex justify-between text-slate-900">
              <span>Status</span>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-10 border-t dynamic-border">
            <div className="flex items-center gap-3">
              <Smartphone size={18} className="text-blue-600" />
              <span className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">
                Mobile Cage
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
              Under maintainace - will be avaiable soon
            </p>
          </div>

          <section className="pt-10 border-t border-[var(--line-color)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Terminal size={14} className="text-blue-600 relative z-10" />
                  <div className="absolute inset-0 bg-blue-600/20 blur-sm rounded-full animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">
                  Kernel Output
                </span>
              </div>
              {/* Live Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">
                  Live Feed
                </span>
                <div className="w-1 h-1 bg-green-600 rounded-full animate-ping" />
              </div>
            </div>

            {/* THE SEXY TERMINAL BOX */}
            <div className="relative group">
              {/* Background Glass Layer */}
              <div className="absolute -inset-2 bg-gradient-to-b from-blue-600/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-black/40 backdrop-blur-md border border-white/5 rounded-sm p-7 w-62 overflow-hidden">
                {/* Subtle Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-20" />

                <div className="font-mono text-[9px] space-y-3 uppercase font-bold relative z-10">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 items-start group/line">
                      <span className="text-red-600/40 select-none">
                        [{i + 104}]
                      </span>
                      <p
                        className={`leading-relaxed transition-colors duration-300 ${
                          i === logs.length - 1
                            ? "text-green-600 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                            : "text-slate-500 group-hover/line:text-slate-300"
                        }`}
                      >
                        {log}
                        {i === logs.length - 1 && (
                          <span className="inline-block w-1.5 h-3 ml-1 bg-green-600 animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* CLEAN MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-9 pl-16 pt-12 space-y-12">
          <h4 className="text-5xl lg:text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-[0.8]">
            Initialize <span className="text-blue-600">Warden Cage</span>
          </h4>

          <div className="max-w-2xl space-y-16">
            <div className="border-b dynamic-border pb-2 focus-within:border-blue-600 transition-all max-w-lg">
              <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.5em] block mb-2">
                Target Session URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="HTTPS://LEETCODE.COM/..."
                className="bg-transparent text-lg font-mono font-bold w-full outline-none text-slate-900 placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-12 gap-8 items-center bg-transparent py-4">
              <div className="col-span-4 space-y-1 border-r dynamic-border">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  {isLocked ? "Lock Time" : "Duration"}
                </h3>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-6xl font-black font-mono text-slate-900 tracking-tighter italic tabular-nums">
                    {isLocked ? formatTime(secondsLeft) : minutes}
                  </h1>
                  {!isLocked && (
                    <span className="text-sm font-black text-blue-600 uppercase italic">
                      Min
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-8 relative px-4">
                <div
                  className={`relative w-full h-20 flex items-center select-none overflow-hidden transition-all ${isLocked ? "opacity-20 grayscale pointer-events-none" : "opacity-100"}`}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 h-full w-[1.5px] bg-white z-30" />
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onMouseDown={startDragging}
                    onMouseLeave={stopDragging}
                    onMouseUp={stopDragging}
                    onMouseMove={moveWheel}
                    className="w-full h-full overflow-x-scroll no-scrollbar flex items-end gap-[4px] px-[50%] snap-x cursor-grab"
                    style={{
                      scrollSnapType: isDragging.current
                        ? "none"
                        : "x mandatory",
                    }}
                  >
                    {Array.from({ length: 181 }, (_, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-4 flex-shrink-0 w-4 snap-center"
                      >
                        {i % 10 === 0 && i !== 0 ? (
                          <span
                            className={`text-[9px] font-black font-mono ${minutes === i ? "text-blue-600" : "text-slate-300"}`}
                          >
                            {i}
                          </span>
                        ) : (
                          <div className="h-4" />
                        )}
                        <div
                          className={`w-[1px] transition-all ${minutes === i ? "h-12 bg-white" : i % 5 === 0 ? "h-6 bg-slate-200" : "h-3 bg-slate-100"}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION ZONE: BALANCED & CLEAR */}
            {/* ACTION ZONE */}
            <div
              className={`pt-10 border-t border-[var(--line-color)] space-y-8 transition-all duration-700 ${
                url.toLowerCase().startsWith("https://")
                  ? "opacity-100"
                  : "opacity-20 grayscale pointer-events-none"
              }`}
            >
              {/* MANUAL BYPASS: ONLY CLICKS IF URL IS VALID */}
              <div
                onClick={() => {
                  if (url.toLowerCase().startsWith("https://") && !isLocked) {
                    setIsAuthenticated(!isAuthenticated);
                  }
                }}
                className="flex items-center gap-6 cursor-pointer group w-fit select-none"
              >
                <div className="relative flex items-center justify-center w-10 h-10">
                  <div
                    className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-700 ${isAuthenticated ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                  />

                  <div
                    className={`relative z-10 transition-all duration-500 ease-out flex items-center justify-center ${isAuthenticated ? "translate-x-1" : "-translate-x-1"}`}
                  >
                    <Zap
                      size={18}
                      className={`transition-all duration-500 ${
                        isAuthenticated
                          ? "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] fill-yellow-500"
                          : "text-slate-700 group-hover:text-slate-500"
                      }`}
                    />
                    <div className="absolute -right-4 flex flex-col gap-1">
                      <div
                        className={`w-2 h-[1px] transition-all duration-300 ${isAuthenticated ? "bg-yellow-500 w-4" : "bg-slate-800"}`}
                      />
                      <div
                        className={`w-2 h-[1px] transition-all duration-500 ${isAuthenticated ? "bg-yellow-400 w-6" : "bg-slate-800"}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500 ${isAuthenticated ? "text-yellow-500" : "text-slate-600 group-hover:text-slate-400"}`}
                  >
                    Manual Bypass
                  </span>
                  <span className="text-[7px] text-slate-700 font-bold uppercase tracking-widest -mt-1">
                    {isAuthenticated
                      ? "ENCRYPTION TERMINATED"
                      : "REQUIRES SECURE PROTOCOL (HTTPS://)"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-8">
                <div className="flex flex-col gap-4 flex-1">
                  {/* G-SUITE LOGIN */}
                  <button
                    disabled={
                      !url.toLowerCase().startsWith("https://") ||
                      isAuthenticated
                    }
                    onClick={handleLoginPreparation}
                    className={`group/btn relative flex items-center justify-between px-6 py-5 transition-all duration-500 overflow-hidden ${
                      isAuthenticated
                        ? "bg-transparent opacity-30"
                        : "bg-[#080808] hover:bg-[#0c0c0c] border-l border-white/5 hover:border-blue-600/50 cursor-pointer shadow-[10px_0_30px_-15px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div
                        className={`p-2 rounded-sm border transition-all duration-500 ${isAuthenticated ? "border-slate-800" : "border-white/5 bg-white/5"}`}
                      >
                        <Key
                          size={14}
                          className={
                            isAuthenticated ? "text-slate-800" : "text-blue-600"
                          }
                        />
                      </div>
                      <div className="text-left">
                        <span
                          className={`block text-[11px] font-black uppercase tracking-[0.2em] ${isAuthenticated ? "text-slate-800" : "text-slate-200"}`}
                        >
                          G-Suite Authorization
                        </span>
                        <span className="text-[7px] text-slate-700 font-bold uppercase tracking-widest">
                          Awaiting Protocol Verification
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-slate-800" />
                  </button>

                  {/* SOCKET AUTH */}
                  <button
                    disabled={
                      !url.toLowerCase().startsWith("https://") ||
                      isAuthenticated
                    }
                    onClick={handleUrlLogin}
                    className={`group/btn relative flex items-center justify-between px-6 py-5 transition-all duration-500 overflow-hidden ${
                      isAuthenticated
                        ? "bg-transparent opacity-30"
                        : "bg-[#080808] hover:bg-[#0c0c0c] border-l border-white/5 hover:border-blue-600/50 cursor-pointer shadow-[10px_0_30px_-15px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div
                        className={`p-2 rounded-sm border transition-all duration-500 ${isAuthenticated ? "border-slate-800" : "border-white/5 bg-white/5"}`}
                      >
                        <Globe
                          size={14}
                          className={
                            isAuthenticated ? "text-slate-800" : "text-blue-600"
                          }
                        />
                      </div>
                      <div className="text-left">
                        <span
                          className={`block text-[11px] font-black uppercase tracking-[0.2em] ${isAuthenticated ? "text-slate-800" : "text-slate-200"}`}
                        >
                          {getDomain(url)} Socket
                        </span>
                        <span className="text-[7px] text-slate-700 font-bold uppercase tracking-widest">
                          Handshake Standby
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-slate-800" />
                  </button>
                </div>
                {/* ENGAGE BUTTON: UNTOUCHED PER INSTRUCTION */}
                <button
                  onClick={handleInitialize}
                  disabled={!isAuthenticated || isLocked}
                  className={`group relative w-70 h-full min-h-[140px] transition-all duration-500 border-2 flex flex-col items-center justify-center gap-2 ${
                    isAuthenticated && !isLocked
                      ? "bg-transparent border-green-600 shadow-[0_0_30px_rgba(22,163,74,0.15)] hover:bg-green-600"
                      : "bg-slate-900/50 border-white/5 cursor-not-allowed grayscale"
                  }`}
                  style={{
                    clipPath:
                      "polygon(0 0, 92% 0, 100% 20%, 100% 100%, 8% 100%, 0 80%)",
                  }}
                >
                  <Zap
                    size={24}
                    className={`transition-all duration-500 ${
                      isAuthenticated && !isLocked
                        ? "text-green-500 group-hover:text-white animate-pulse"
                        : "text-slate-800"
                    }`}
                  />
                  <div className="text-center">
                    <span
                      className={`block text-[11px] font-black uppercase tracking-[0.6em] ${
                        isAuthenticated && !isLocked
                          ? "text-green-500 group-hover:text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {isLocked ? "LOCKDOWN ACTIVE" : "ENGAGE PROTOCOL"}
                    </span>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-widest mt-1 block ${
                        isAuthenticated && !isLocked
                          ? "text-green-500/50 group-hover:text-white/50"
                          : "text-slate-800"
                      }`}
                    >
                      Clearance Level 4 Verified
                    </span>
                  </div>
                  {isAuthenticated && !isLocked && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-green-400/30 animate-scanline pointer-events-none" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scanline {
          0% {
            top: 0%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
