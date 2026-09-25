import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

export function ThemeToggle({ className, variant = "outline", size = "icon" }) {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`h-9 w-9 relative transition-colors ${className || ''}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
