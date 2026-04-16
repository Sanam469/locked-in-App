"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWardenTheme } from "@/component/ThemeContext";
import {
  LayoutDashboard,
  Activity,
  Crown,
  Settings,
  Menu,
  X,
  Lock,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useWardenTheme();

  if (pathname === "/session" || pathname === "/auth") return null;

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Performance", path: "/performance", icon: <Activity size={20} /> },
    { name: "Premium", path: "/premium", icon: <Crown size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* 1. Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-10 left-10 z-[60] p-2.5 rounded-xl border dynamic-border bg-neutral-900/80 text-neutral-400 hover:text-white transition-all backdrop-blur-md hover:scale-105 active:scale-95"
      >
        <Menu size={22} />
      </button>

      {/* 2. Soft Overlay */}
      <div
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-700 ease-in-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. Sidebar - No Border, Deep Black */}
      <aside
        className={`fixed top-0 left-0 z-[80] h-full w-[30%] min-w-[320px] p-12 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] bg-black ${
          isOpen ? "translate-x-0" : "-translate-x-full shadow-none"
        } ${isOpen ? "shadow-[30px_0_60px_rgba(0,0,0,0.8)]" : ""}`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-10 right-10 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Branding */}
        <div className="flex items-center gap-3 mb-20 mt-4">
          <div
            className="p-2 rounded-xl text-white shadow-lg transition-colors duration-500"
            style={{
              backgroundColor: "var(--accent)",
              boxShadow: `0 10px 20px -5px var(--accent-glow)`,
            }}
          >
            <Lock size={20} />
          </div>
          <span className="text-xl font-black italic tracking-tighter uppercase text-neutral-100">
            Locked-In
          </span>
        </div>

        {/* Nav Links */}
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  setTimeout(() => setIsOpen(false), 150);
                }}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white/5 border dynamic-border text-white"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                }`}
              >
                <span style={{ color: isActive ? "var(--accent)" : "inherit" }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-12 left-12">
          <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-[0.3em]">
            NIT Srinagar · CSE
          </p>
        </div>
      </aside>
    </>
  );
}
