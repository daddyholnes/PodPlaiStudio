import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme appearance types
type ThemeAppearance = 'light' | 'dark' | 'system';

// Theme context interface
interface ThemeContextType {
  appearance: ThemeAppearance;
  setAppearance: (appearance: ThemeAppearance) => void;
  isDark: boolean;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Create the provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get the system preference for dark mode
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Initialize the appearance state from localStorage or default to system
  const [appearance, setAppearance] = useState<ThemeAppearance>(
    () => (localStorage.getItem('theme-appearance') as ThemeAppearance) || 'system'
  );
  
  // Calculate whether to use dark mode based on the appearance setting
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (appearance === 'system') {
      return prefersDark;
    }
    return appearance === 'dark';
  });
  
  // Update the dark mode state when appearance changes
  useEffect(() => {
    if (appearance === 'system') {
      setIsDark(prefersDark);
    } else {
      setIsDark(appearance === 'dark');
    }
    
    // Save the appearance setting to localStorage
    localStorage.setItem('theme-appearance', appearance);
  }, [appearance, prefersDark]);
  
  // Update the HTML class when dark mode changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (appearance === 'system') {
        setIsDark(e.matches);
      }
    };
    
    // Add the event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [appearance]);
  
  return (
    <ThemeContext.Provider value={{ appearance, setAppearance, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Create a hook to use the context
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}