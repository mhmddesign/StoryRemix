"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark") ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.getItem("storyremix_theme"));
    
    const savedTheme = localStorage.getItem("storyremix_theme");
    if (savedTheme === "dark" || (!savedTheme && isDarkMode)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("storyremix_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("storyremix_theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
    </button>
  );
}
