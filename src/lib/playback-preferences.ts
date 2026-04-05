export const PREFERRED_PROVIDER_STORAGE_KEY = "subflix-preferred-playback-provider";
export const AUTOPLAY_NEXT_STORAGE_KEY = "subflix-autoplay-next-enabled";

export function readAutoplayNextPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem(AUTOPLAY_NEXT_STORAGE_KEY);

  if (stored === null) {
    return true;
  }

  return stored !== "false";
}

export function writeAutoplayNextPreference(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTOPLAY_NEXT_STORAGE_KEY, String(enabled));
}
