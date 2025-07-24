import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (newTheme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: '#1e40af',
  secondary: '#0ea5e9',
  accent: '#f97316',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  card: '#ffffff',
  headerBg: '#1e40af',
  headerText: '#ffffff',
  tabActive: '#1e40af',
  tabInactive: '#9ca3af',
};

const darkColors = {
  primary: '#3b82f6',
  secondary: '#06b6d4',
  accent: '#fb923c',
  background: '#111827',
  surface: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  border: '#374151',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  card: '#1f2937',
  headerBg: '#1f2937',
  headerText: '#f9fafb',
  tabActive: '#3b82f6',
  tabInactive: '#6b7280',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}