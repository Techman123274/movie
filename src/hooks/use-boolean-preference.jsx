import { useEffect, useMemo, useState } from "react";
import { PREFERENCE_CHANGED_EVENT, readPreference } from "@/lib/preferences";

const normalizeDefault = (defaultValue) => {
  if (typeof defaultValue === "string") {
    return defaultValue === "false" ? "false" : "true";
  }
  return defaultValue === false ? "false" : "true";
};

export function useBooleanPreference(key, defaultValue = true) {
  const fallback = useMemo(() => normalizeDefault(defaultValue), [defaultValue]);
  const [enabled, setEnabled] = useState(() => readPreference(key, fallback) !== "false");

  useEffect(() => {
    setEnabled(readPreference(key, fallback) !== "false");

    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePreferenceChanged = (event) => {
      const detail = event?.detail;
      if (!detail || detail.key !== key) {
        return;
      }
      const nextValue = detail.value ?? readPreference(key, fallback);
      setEnabled(String(nextValue) !== "false");
    };

    window.addEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);
    return () => window.removeEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChanged);
  }, [key, fallback]);

  return enabled;
}

