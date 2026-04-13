const STANDALONE_QUERY = "(display-mode: standalone)";

const getViewportHeight = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const visualHeight = window.visualViewport?.height;
  if (typeof visualHeight === "number" && Number.isFinite(visualHeight)) {
    return Math.round(visualHeight);
  }

  return Math.round(window.innerHeight || 0);
};

const applyViewportHeight = () => {
  if (typeof document === "undefined") {
    return;
  }

  const nextHeight = getViewportHeight();
  if (nextHeight > 0) {
    document.documentElement.style.setProperty("--app-viewport-height", `${nextHeight}px`);
  }
};

const applyStandaloneState = () => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const isStandalone = window.matchMedia(STANDALONE_QUERY).matches || window.navigator.standalone === true;
  document.documentElement.setAttribute("data-standalone", isStandalone ? "true" : "false");
};

export const initializeAppShell = () => {
  if (typeof window === "undefined") {
    return () => {};
  }

  let rafId = 0;
  const mediaQuery = window.matchMedia(STANDALONE_QUERY);

  const syncLayout = () => {
    rafId = 0;
    applyViewportHeight();
    applyStandaloneState();
  };

  const scheduleSync = () => {
    if (rafId) {
      return;
    }

    rafId = window.requestAnimationFrame(syncLayout);
  };

  scheduleSync();

  window.addEventListener("resize", scheduleSync);
  window.addEventListener("orientationchange", scheduleSync);
  window.addEventListener("pageshow", scheduleSync);
  document.addEventListener("visibilitychange", scheduleSync);
  window.visualViewport?.addEventListener("resize", scheduleSync);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", scheduleSync);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(scheduleSync);
  }

  return () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    window.removeEventListener("resize", scheduleSync);
    window.removeEventListener("orientationchange", scheduleSync);
    window.removeEventListener("pageshow", scheduleSync);
    document.removeEventListener("visibilitychange", scheduleSync);
    window.visualViewport?.removeEventListener("resize", scheduleSync);

    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", scheduleSync);
    } else if (typeof mediaQuery.removeListener === "function") {
      mediaQuery.removeListener(scheduleSync);
    }
  };
};
