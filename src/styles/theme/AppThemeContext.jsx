import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "papertech_darkMode";

const AppThemeContext = createContext(null);

function readInitialTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedValue !== null) {
    return storedValue === "true";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyThemeToDocument(isDark) {
  if (typeof document === "undefined") {
    return;
  }

  const themeName = isDark ? "dark" : "light";
  document.documentElement.dataset.theme = themeName;
  document.body.dataset.theme = themeName;
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
}

export function AppThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(readInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, String(darkMode));
    applyThemeToDocument(darkMode);
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleTheme: () => setDarkMode((currentValue) => !currentValue),
    }),
    [darkMode],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
