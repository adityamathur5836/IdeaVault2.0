'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle({ variant = 'ghost', size = 'sm', className = '' }) {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleToggle}
        className={`transition-all duration-200 hover:scale-105 ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
      </Button>
    </div>
  );
}

export function ThemeSelector({ className = '' }) {
  const { theme, setLightTheme, setDarkTheme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`}>
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={setLightTheme}
        className="h-8 w-8 p-0"
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={setDarkTheme}
        className="h-8 w-8 p-0"
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ThemeToggle;
