"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "cobalt" | "warden";

const ThemeContext = createContext({
  theme: "cobalt" as Theme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize from localStorage if it exists, otherwise default to cobalt
  const [theme, setTheme] = useState<Theme>("cobalt");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("warden-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "cobalt" ? "warden" : "cobalt";
    setTheme(newTheme);
    localStorage.setItem("warden-theme", newTheme); // 2. Save choice
  };

  // Prevent "flicker" by not rendering until we know the saved theme
  if (!isLoaded) return <div className="bg-[#0b0b0e] min-h-screen" />;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`theme-${theme}`}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useWardenTheme = () => useContext(ThemeContext);
