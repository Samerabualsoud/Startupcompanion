import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

/** The resolved theme actually applied to the DOM (never 'system'). */
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  /** The user-selected mode: 'light' | 'dark' | 'system' */
  mode: ThemeMode;
  /** The actual theme applied to the DOM */
  theme: ResolvedTheme;
  /** Cycle through light → dark → system */
  toggleTheme?: () => void;
  /** Directly set a mode */
  setMode?: (mode: ThemeMode) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  switchable?: boolean;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-mode") as ThemeMode | null;
      // Migrate legacy 'theme' key
      if (!stored) {
        const legacy = localStorage.getItem("theme") as ThemeMode | null;
        if (legacy === "light" || legacy === "dark") return legacy;
      }
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(mode)
  );

  // Apply the resolved theme to <html> and persist mode
  useEffect(() => {
    const apply = (m: ThemeMode) => {
      const resolved = resolveTheme(m);
      setResolvedTheme(resolved);
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    apply(mode);

    if (switchable) {
      localStorage.setItem("theme-mode", mode);
    }

    // When mode is 'system', listen for OS changes
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode, switchable]);

  const toggleTheme = switchable
    ? () => {
        setModeState(prev => {
          if (prev === "light") return "dark";
          if (prev === "dark") return "system";
          return "light";
        });
      }
    : undefined;

  const setMode = switchable
    ? (m: ThemeMode) => setModeState(m)
    : undefined;

  return (
    <ThemeContext.Provider
      value={{ mode, theme: resolvedTheme, toggleTheme, setMode, switchable }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
