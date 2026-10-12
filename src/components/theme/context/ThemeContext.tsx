// src/components/theme/context/ThemeContext.tsx
//
// Same isHydrated pattern as AuthContext: the real value can only be
// known client-side (localStorage), so server-rendered markup and the
// first client render both assume the default ("dark", matching the
// app's one pre-existing palette) and only switch over once mounted.
// The inline script in layout.tsx (see lib/theme.ts's
// noFlashThemeScript) has already set the DOM attribute before this
// ever runs — this context exists so the Settings UI has a value to
// read/toggle, not to apply the theme itself.

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTheme, getStoredTheme, storeTheme, type Theme } from "@/lib/theme";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Reconcile with whatever the no-flash inline script already
  // applied to the DOM before React hydrated, rather than the state
  // initializer above (which can't safely read localStorage during
  // server rendering).
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) setThemeState(stored);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    storeTheme(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
