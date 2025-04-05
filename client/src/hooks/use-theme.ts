import { useState, useEffect, useCallback } from 'react';

interface UseThemeResult {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export function useTheme(): UseThemeResult {
  // Check if dark mode is stored in localStorage, otherwise check system preference
  const getInitialMode = (): boolean => {
    const stored = localStorage.getItem('theme-mode');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialMode);

  // Update the DOM when dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const setDarkMode = useCallback((isDark: boolean) => {
    setIsDarkMode(isDark);
  }, []);

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  };
}
