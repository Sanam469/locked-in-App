"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWardenTheme } from "@/component/ThemeContext";
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
  FolderSearch,
} from "lucide-react";

export default function DashboardPage() {
  const { theme, isLocking, setIsLocking } = useWardenTheme();
  const [url, setUrl] = useState("");
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [logs, setLogs] = useState<{ msg: string; type: "info" | "success" | "error" }[]>([
    { msg: "SYSTEM_READY: KERNEL_UPLINK_STABLE", type: "info" }
  ]);
  const [minutes, setMinutes] = useState(60);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [recentPaths, setRecentPaths] = useState<{ target_site: string }[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastLoggedUrl = useRef("");
  const lastLoggedMinutes = useRef(60);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const logMessage = (msg: string, type: "info" | "success" | "error" = "info") => {
    setLogs((prev) => [...prev.slice(-6), { msg: `:: ${msg}`, type }]);
  };

  const parseLog = (text: string, type: "info" | "success" | "error") => {
    const parts = text.split(/([:_|\s])/);
    return parts.map((part, i) => {
      const upper = part.toUpperCase();
      const isStatusSuccess = ["SUCCESS", "VERIFIED", "STABLE", "ENGAGED", "RESTORED", "READY", "ACTIVE", "STAGED", "ENFORCED"].some(k => upper.includes(k));
      const isStatusError = ["ERROR", "FAILURE", "REJECTED", "ABORTED", "CRITICAL", "BREACHED"].some(k => upper.includes(k));
      const isProtocol = ["SYSTEM", "ENGINE", "PROTOCOL", "BYPASS", "SOCKET", "KERNEL", "AUTH", "WARDEN"].some(k => upper.includes(k));

      if (isStatusSuccess) return <span key={i} className="text-[#4EC9B0]">{part}</span>;
      if (isStatusError) return <span key={i} className="text-[#F44747]">{part}</span>;
      if (isProtocol) return <span key={i} className="text-[#DCDCAA] font-black">{part}</span>;
      
      return <span key={i} className="opacity-80">{part}</span>;
    });
  };

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
            target_site: url, // USE FULL URL
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
        
        if (api.getRecentPaths) {
          const nodesResult = await api.getRecentPaths();
          if (nodesResult?.success) {
            setRecentPaths(nodesResult.nodes || []);
          }
        }
      }
    };

    initAndFetchStats();

    let timerInterval: NodeJS.Timeout;
    if (isLocked && secondsLeft > 0) {
      timerInterval = setInterval(
        () => setSecondsLeft((prev) => prev - 1),
        1000,
      );
    }
    return () => {
      clearInterval(timerInterval);
    };
  }, [isLocked, secondsLeft]);

  const handleLoginPreparation = async () => {
    if (url.trim() === "") {
      logMessage("AUTH_ERROR: TARGET URL REQUIRED", "error");
      return alert("PLEASE INPUT TARGET URL FIRST");
    }
    logMessage(`ENGINE_INIT: ${getDomain(url)} | ${minutes} MIN`);
    logMessage("INITIALIZING_GOOGLE_AUTH...");
    const api = (window as any).electronAPI;
    if (api) {
      try {
        const success = await api.prepareLogin(url);
        if (success) {
          setIsAuthenticated(true);
          logMessage("GOOGLE_SESSION_VERIFIED", "success");
        } else {
          logMessage("AUTH_ABORTED: USER_CANCELLED", "error");
        }
      } catch (err: any) {
        logMessage(`AUTH_CRITICAL_FAILURE: ${err.message}`, "error");
      }
    }
  };

  const handleUrlLogin = async () => {
    if (url.trim() === "") {
      logMessage("HANDSHAKE_ERROR: TARGET URL REQUIRED", "error");
      return alert("PLEASE INPUT TARGET URL FIRST");
    }
    logMessage(`ENGINE_INIT: ${getDomain(url)} | ${minutes} MIN`);
    logMessage(`INITIALIZING_HANDSHAKE: ${getDomain(url)}`);
    const api = (window as any).electronAPI;
    if (api) {
      try {
        const success = await api.prepareUrlLogin(url);
        if (success === true) {
          setIsAuthenticated(true);
          logMessage("SOCKET_HANDSHAKE_STABLE", "success");
        } else {
          setIsAuthenticated(false);
          logMessage("HANDSHAKE_REJECTED: AUTH_MISSING", "error");
          alert("Login failed. You must stay logged in to engage the cage.");
        }
      } catch (err: any) {
        logMessage(`SOCKET_CRITICAL_ERROR: ${err.message}`, "error");
      }
    }
  };

  const handleFileSelection = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      logMessage("OPENING_NATIVE_FILE_PICKER...");
      try {
        const filePath = await api.selectFile();
        if (filePath) {
          setUrl(filePath);
          logMessage(`LOCAL_FILE_STAGED: ${filePath.split('/').pop()}`, "success");
        } else {
          logMessage("FILE_PICKER_ACTION_CANCELLED", "info");
        }
      } catch (err: any) {
        logMessage(`FS_ERROR: ${err.message}`, "error");
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

  // AUTO-RESET AUTH ON URL CHANGE
  useEffect(() => {
    if (url.toLowerCase().startsWith("file:///")) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [url]);

  // Track Theme Changes
  useEffect(() => {
    logMessage(`SYSTEM_THEME_SWAP: ${theme.toUpperCase()} ACTIVE`);
  }, [theme]);

  const [isEngaging, setIsEngaging] = useState(false);

  const handleInitialize = () => {
    if (!isAuthenticated || isEngaging) return;
    setIsEngaging(true);
    setIsLocking(true); // TRIGGER GLOBAL OVERLAY
    logMessage("INITIALIZING_CORE_ISOLATION_SEQUENCE...");
    
    // START BACKEND IMMEDIATELY (Simultaneous Loading)
    setIsLocked(true);
    setIsEngaging(false);
    setSecondsLeft(minutes * 60);
    const api = (window as any).electronAPI;
    if (api) {
      try {
        api.engage({ url, duration: minutes });
        logMessage("LOCKDOWN_PROTOCOL_ENGAGED", "success");
      } catch (err: any) {
        logMessage(`ENGINE_ABORT: ${err.message}`, "error");
        setIsLocked(false);
        setIsLocking(false);
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min((todayMinutes / 360) * 100, 100);

  const getDomain = (inputUrl: string) => {
    if (!inputUrl) return "NONE";
    if (inputUrl.startsWith("file:///")) return "LOCAL_FILE";
    try {
      return new URL(inputUrl).hostname.toUpperCase();
    } catch {
      return inputUrl.length > 20 ? inputUrl.substring(0, 20) + "..." : inputUrl;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen px-10 pt-12 pb-32 animate-pageIn">
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
        <div className="h-1.5 w-full bg-slate-200/20 border dynamic-border rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-0 border-t dynamic-border">
        {/* CLEAN SIDEBAR */}
        <aside className="col-span-12 lg:col-span-3 pr-10 border-r dynamic-border pt-12 space-y-12">
          {/* RECENT PATHS: SLEEK CHIPS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe size={14} className="text-blue-600" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                Recent Paths
              </h3>
            </div>
            
            <div className="flex flex-col gap-3">
              {recentPaths.length > 0 ? recentPaths.map((node, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setUrl(node.target_site);
                    logMessage(`TARGET_RESTORED: ${getDomain(node.target_site)}`, "info");
                  }}
                  className="w-full px-6 py-5 bg-white border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all flex flex-col gap-1.5 group animate-pageIn text-left overflow-hidden relative first:rounded-t-2xl last:rounded-b-2xl"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Ultra-Sleek Left Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-950 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 group-hover:text-blue-600 transition-colors">
                      {getDomain(node.target_site)}
                    </span>
                    <div className="p-1 rounded-full bg-zinc-50 group-hover:bg-blue-50 transition-colors">
                       <ChevronRight size={10} className="text-zinc-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                  
                  <span className="text-[11px] font-medium text-zinc-500 leading-tight truncate w-full group-hover:text-zinc-800 transition-colors">
                    {node.target_site}
                  </span>
                </button>
              )) : (
                <div className="w-full py-12 px-8 border border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/20">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.4em]">
                    Standby For Data
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ENGINE CONSOLE: COMPACT & FLOATING */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal size={14} className="text-blue-600" />
                <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">
                  Engine Console
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Live</span>
              </div>
            </div>

            <div className="relative group">
              {/* VS CODE THEME TERMINAL: INTEGRATED LOOK (NO HOVER SHADOW) */}
              <div className="relative h-72 bg-[#1e1e1e] border-2 border-[#2d2d2d] rounded-xl p-8 shadow-2xl overflow-hidden flex flex-col font-mono transition-colors duration-500">
                {/* Header Dots */}
                <div className="flex gap-1.5 mb-6 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <div className="text-[11px] space-y-5 uppercase font-bold relative z-10 overflow-y-auto no-scrollbar">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className="flex gap-4 items-start group/line animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    >
                      <span className="text-[#555] select-none text-[9px] mt-1 text-right w-6">
                        {i + 1}
                      </span>
                      <div
                        className={`leading-relaxed transition-colors duration-300 font-mono tracking-tight text-[#DCDCAA]/90`}
                      >
                        {parseLog(log.msg, log.type)}
                        {i === logs.length - 1 && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-[#DCDCAA] animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
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
            <div className="relative z-20 border-b dynamic-border pb-2 focus-within:border-blue-600 transition-all max-w-lg">
              <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.5em] block mb-2">
                Target Session URL
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="HTTPS://LEETCODE.COM/..."
                  className="bg-transparent text-lg font-mono font-bold w-full outline-none text-slate-900 placeholder:text-slate-300"
                />
                <button 
                  onClick={handleFileSelection}
                  className="p-2 hover:bg-white/5 rounded-sm transition-colors group/file text-slate-400 hover:text-blue-600"
                  title="Open Local File (PDF/Image)"
                >
                  <FolderSearch size={20} className="transition-transform group-hover/file:scale-110" />
                </button>
              </div>
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
                url.toLowerCase().startsWith("https://") || url.toLowerCase().startsWith("file://")
                  ? "opacity-100"
                  : "opacity-20 grayscale pointer-events-none"
              }`}
            >
              {/* MANUAL BYPASS: ONLY CLICKS IF URL IS VALID */}
              <div
                onClick={() => {
                  if (url.toLowerCase().startsWith("https://") && !isLocked) {
                    const newState = !isAuthenticated;
                    setIsAuthenticated(newState);
                    logMessage(`PROTOCOL_BYPASS_${newState ? "ENGAGED" : "RELEASED"}`, newState ? "success" : "info");
                    logMessage(`TARGET: ${getDomain(url)} | DURATION: ${minutes} MIN`);
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
                {/* ENGAGE BUTTON: Premium Polish */}
                <button
                  onClick={handleInitialize}
                  disabled={!isAuthenticated || isLocked || isEngaging}
                  className={`group relative w-70 h-full min-h-[140px] transition-all duration-500 border-2 flex flex-col items-center justify-center gap-2 overflow-hidden ${
                    isAuthenticated && !isLocked && !isEngaging
                      ? "bg-transparent border-green-600 shadow-[0_0_30px_rgba(22,163,74,0.15)] hover:bg-green-600"
                      : isEngaging
                      ? "bg-green-900/20 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]"
                      : "bg-slate-900/50 border-white/5 cursor-not-allowed grayscale"
                  }`}
                  style={{
                    clipPath:
                      "polygon(0 0, 92% 0, 100% 20%, 100% 100%, 8% 100%, 0 80%)",
                  }}
                >
                  {isEngaging ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="tech-spinner scale-150 mb-2" />
                      <div className="text-center relative z-10 animate-pulse">
                        <span className="block text-[11px] font-black uppercase tracking-[0.6em] text-white">
                          INITIALIZING_HUD
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-1 block text-white/50">
                          Establishing Secure Handshake
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Zap
                        size={24}
                        className={`transition-all duration-500 ${
                          (isAuthenticated && !isLocked)
                            ? "text-green-500 group-hover:text-white animate-pulse"
                            : "text-slate-800"
                        }`}
                      />
                      <div className="text-center relative z-10">
                        <span
                          className={`block text-[11px] font-black uppercase tracking-[0.6em] transition-all duration-500 ${
                            (isAuthenticated && !isLocked)
                              ? "text-green-500 group-hover:text-white"
                              : "text-slate-700"
                          }`}
                        >
                          {isLocked ? "LOCKDOWN ACTIVE" : "ENGAGE PROTOCOL"}
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase tracking-widest mt-1 block ${
                            (isAuthenticated && !isLocked)
                              ? "text-green-500/50 group-hover:text-white/50"
                              : "text-slate-800"
                          }`}
                        >
                          Clearance Level 4 Verified
                        </span>
                      </div>
                    </>
                  )}

                  {/* ACTIVE SCANLINE */}
                  {isAuthenticated && !isLocked && !isEngaging && (
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
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scanline-fast {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
        .animate-scanline-fast {
          animation: scanline-fast 0.5s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
