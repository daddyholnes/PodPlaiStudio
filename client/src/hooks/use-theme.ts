// Re-export the theme context hook to maintain backward compatibility
import { useThemeContext } from '../contexts/theme-context';

interface UseThemeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  appearance: 'light' | 'dark' | 'system';
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void;
}

export function useTheme(): UseThemeReturn {
  const { isDark, appearance, setAppearance } = useThemeContext();
  
  const toggleDarkMode = () => {
    setAppearance(isDark ? 'light' : 'dark');
  };
  
  return {
    isDarkMode: isDark,
    toggleDarkMode,
    appearance,
    setAppearance
  };
}