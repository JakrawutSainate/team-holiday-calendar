'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface TopNavBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
}

export default function TopNavBar({ onSearch, placeholder = 'Search...' }: TopNavBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-12 w-full h-16 border-b border-outline-variant dark:border-[#2d2f39] bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-outline text-[20px]">
            search
          </span>
          <input
            type="text"
            className="w-full bg-surface-container-low dark:bg-[#0d0e12] border border-outline-variant dark:border-[#2d2f39] rounded-full pl-10 pr-4 py-1.5 font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-white dark:focus:border-white transition-all placeholder:text-outline text-on-surface"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white transition-colors text-sm font-medium">Dashboard</a>
          <a href="#" className="text-primary dark:text-white border-b-2 border-primary dark:border-white pb-1 text-sm font-semibold">Team</a>
          <a href="#" className="text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white transition-colors text-sm font-medium">Policy</a>
          <a href="#" className="text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white transition-colors text-sm font-medium">Insights</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {/* Theme Switcher Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="material-symbols-outlined text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white p-2 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </button>
          )}
          <button className="material-symbols-outlined text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white p-2 transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-white p-2 transition-colors">
            help_outline
          </button>
        </div>
        <button className="px-4 py-2 bg-primary dark:bg-white text-on-primary dark:text-black rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer">
          Request Leave
        </button>
      </div>
    </header>
  );
}
