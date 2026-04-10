import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const APP_THEME_STORAGE_KEY = "subflix_app_theme_preview";

export const APP_THEMES = {
  netflix: {
    id: "netflix",
    label: "Netflix",
    wordmark: "SUBFLIX",
    modeLabel: "Cinema",
    shellVariant: "netflix",
    heroVariant: "netflix",
    rowVariant: "netflix",
    cardVariant: "netflix",
    detailVariant: "netflix",
    playerVariant: "netflix",
    loadingVariant: "netflix",
  },
  hulu: {
    id: "hulu",
    label: "Hulu",
    wordmark: "subflix",
    modeLabel: "Stream",
    shellVariant: "hulu",
    heroVariant: "hulu",
    rowVariant: "hulu",
    cardVariant: "hulu",
    detailVariant: "hulu",
    playerVariant: "hulu",
    loadingVariant: "hulu",
  },
};

const ThemeContext = createContext(null);

const readThemePreview = () => {
  if (typeof window === "undefined") {
    return "netflix";
  }

  const stored = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
  return stored === "hulu" ? "hulu" : "netflix";
};

const persistThemePreview = (theme) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
};

const applyThemeToDocument = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-app-theme", theme);
  document.body.setAttribute("data-app-theme", theme);
};

export function AppThemeProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const [theme, setThemeState] = useState(readThemePreview);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyThemeToDocument(theme);
    persistThemePreview(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const loadTheme = async () => {
      if (isLoadingAuth) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setThemeState(readThemePreview());
          setReady(true);
        }
        return;
      }

      const preferenceTheme = await base44.preferences.getAppTheme().catch(() => readThemePreview());
      if (!cancelled) {
        setThemeState(preferenceTheme === "hulu" ? "hulu" : "netflix");
        setReady(true);
      }
    };

    loadTheme();

    return () => {
      cancelled = true;
    };
  }, [user, isLoadingAuth]);

  const setTheme = async (nextTheme) => {
    const normalizedTheme = nextTheme === "hulu" ? "hulu" : "netflix";
    setThemeState(normalizedTheme);
    persistThemePreview(normalizedTheme);

    if (!user) {
      return normalizedTheme;
    }

    try {
      setSaving(true);
      await base44.preferences.setAppTheme(normalizedTheme);
    } finally {
      setSaving(false);
    }

    return normalizedTheme;
  };

  const value = useMemo(
    () => ({
      ready,
      saving,
      theme,
      setTheme,
      themeDefinition: APP_THEMES[theme] || APP_THEMES.netflix,
      themes: Object.values(APP_THEMES),
    }),
    [ready, saving, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};
