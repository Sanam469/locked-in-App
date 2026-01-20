"use client";
import { usePathname } from "next/navigation";
import { useWardenTheme } from "@/component/ThemeContext";
import { Zap, Moon } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useWardenTheme();

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
        onClick={toggleTheme}
        className="flex items-center gap-3 px-4 py-2 border border-white/10 hover:border-white/20 transition-all group rounded-lg bg-black/20"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Mode: {theme}
        </span>
        <div
          className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${
            theme === "cobalt"
              ? "bg-blue-500 shadow-blue-500"
              : "bg-orange-600 shadow-orange-600"
          }`}
        />
      </button>
    </header>
  );
}
