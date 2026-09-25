import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'light' | 'dark';

/** Must match the key the pre-paint script in index.html reads. */
const STORAGE_KEY = 'ledger-theme';

interface ThemeContextType {
  theme: Theme;
  /** Resolved once on first launch from the OS preference. */
  systemTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** True once the user has made an explicit choice. */
  isOverridden: boolean;
  useSystemTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readSystemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // The pre-paint script has already stamped data-theme on <html>. Read it from
  // there rather than re-deriving, so React and the DOM can never disagree.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark';
    const current = document.documentElement.getAttribute('data-theme');
    return current === 'light' ? 'light' : 'dark';
  });

  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme);
  const [isOverridden, setIsOverridden] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark';
  });

  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#0B0B0F' : '#FAFAFB');
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* private mode — the in-memory theme still works for this session */
      }
      setIsOverridden(true);
    },
    [applyTheme],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // "Back to following the OS" — clears the override and re-reads the pref.
  const useSystemTheme = useCallback(() => {
    setSystemTheme(readSystemTheme());
    setThemeState(readSystemTheme());
    applyTheme(readSystemTheme());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setIsOverridden(false);
  }, [applyTheme]);

  // Track OS changes, but only while the user has NOT overridden manually.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? 'light' : 'dark';
      setSystemTheme(next);
      if (!isOverridden) {
        setThemeState(next);
        applyTheme(next);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isOverridden, applyTheme]);

  const value = useMemo(
    () => ({ theme, systemTheme, setTheme, toggleTheme, isOverridden, useSystemTheme }),
    [theme, systemTheme, setTheme, toggleTheme, isOverridden, useSystemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
