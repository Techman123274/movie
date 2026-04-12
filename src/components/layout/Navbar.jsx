import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Clock,
  Film,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Tv,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  fetchNotifications,
  getUnreadNotifications,
  markNotificationsSeen,
  sendBrowserNotifications,
} from "@/lib/notifications";
import { PREFERENCE_CHANGED_EVENT, readPreference } from "@/lib/preferences";
import { fetchPublicSiteSettings, getDefaultSiteSettings } from "@/lib/admin-config";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import BrandWordmark from "@/components/layout/BrandWordmark";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAppTheme } from "@/lib/theme";

export default function Navbar({ user, activeProfile, onSwitchProfile }) {
  const { theme, setTheme } = useAppTheme();
  const isHulu = theme === "hulu";
  const topNavRef = useRef(null);
  const mobileTabRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    readPreference("subflix_notifications_enabled", "true") !== "false"
  );
  const [notificationCopy, setNotificationCopy] = useState(getDefaultSiteSettings());
  const navigate = useNavigate();
  const location = useLocation();
  const browseType = new URLSearchParams(location.search).get("type");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const syncShellMetrics = () => {
      const topHeight = Math.round(topNavRef.current?.getBoundingClientRect().height || 72);
      const showMobileTabs = mediaQuery.matches && Boolean(user);
      const bottomHeight = showMobileTabs
        ? Math.round(mobileTabRef.current?.getBoundingClientRect().height || 92)
        : 0;

      root.style.setProperty("--app-nav-height", `${topHeight}px`);
      root.style.setProperty("--app-tabbar-height", `${bottomHeight}px`);
    };

    syncShellMetrics();

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => syncShellMetrics())
      : null;

    if (topNavRef.current) {
      resizeObserver?.observe(topNavRef.current);
    }
    if (mobileTabRef.current) {
      resizeObserver?.observe(mobileTabRef.current);
    }

    window.addEventListener("resize", syncShellMetrics);
    window.addEventListener("orientationchange", syncShellMetrics);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncShellMetrics);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(syncShellMetrics);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncShellMetrics);
      window.removeEventListener("orientationchange", syncShellMetrics);
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncShellMetrics);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(syncShellMetrics);
      }
      root.style.setProperty("--app-nav-height", "72px");
      root.style.setProperty("--app-tabbar-height", "0px");
    };
  }, [location.pathname, location.search, scrolled, showMobileMenu, user]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      const enabled = readPreference("subflix_notifications_enabled", "true") !== "false";
      if (!active) {
        return;
      }

      setNotificationsEnabled(enabled);
      if (!enabled) {
        setNotifications([]);
        return;
      }

      const items = await fetchNotifications(activeProfile);
      if (!active) {
        return;
      }

      setNotifications(items);
      await sendBrowserNotifications(
        items,
        enabled && readPreference("subflix_browser_notifications", "false") === "true"
      );
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 1000 * 60 * 3);

    const handleFocusRefresh = () => {
      loadNotifications();
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [activeProfile?.id, activeProfile?.name]);

  useEffect(() => {
    let active = true;

    fetchPublicSiteSettings()
      .then((settings) => {
        if (active) {
          setNotificationCopy(settings);
        }
      })
      .catch(() => {
        if (active) {
          setNotificationCopy(getDefaultSiteSettings());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePreferenceChange = (event) => {
      const key = event.detail?.key;
      if (key !== "subflix_notifications_enabled" && key !== "subflix_browser_notifications") {
        return;
      }

      const enabled = readPreference("subflix_notifications_enabled", "true") !== "false";
      setNotificationsEnabled(enabled);
      if (!enabled) {
        setNotifications([]);
        setShowNotifications(false);
        return;
      }

      fetchNotifications(activeProfile).then((items) => {
        setNotifications(items);
      });
    };

    window.addEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChange);
    return () => window.removeEventListener(PREFERENCE_CHANGED_EVENT, handlePreferenceChange);
  }, [activeProfile]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMobileMenu(false);
  }, [location.pathname, location.search]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleLogout = () => {
    setShowMobileMenu(false);
    base44.auth.logout();
  };

  const handleThemeToggle = () => {
    setTheme(theme === "netflix" ? "hulu" : "netflix");
  };

  const handleOpenNotifications = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);
    setShowUserMenu(false);
    if (nextOpen && notificationsEnabled) {
      markNotificationsSeen(activeProfile, notifications);
    }
  };

  const unreadCount = getUnreadNotifications(activeProfile, notifications).length;

  const isLinkActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/browse?type=movie") {
      return location.pathname === "/browse" && browseType === "movie";
    }

    if (path === "/browse?type=tv") {
      return location.pathname === "/browse" && browseType === "tv";
    }

    return location.pathname === path;
  };

  const primaryLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "Movies", path: "/browse?type=movie", icon: Film },
    { label: "TV Shows", path: "/browse?type=tv", icon: Tv },
    { label: "My List", path: "/my-list", icon: Bookmark },
    { label: "Social", path: "/social", icon: Users },
  ];

  const mobileBottomLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "Movies", path: "/browse?type=movie", icon: Film },
    { label: "TV", path: "/browse?type=tv", icon: Tv },
    { label: "Search", path: "/search", icon: Search },
  ];

  const mobileMenuLinks = [
    { label: "Social", path: "/social", icon: MessageCircle },
    { label: "My List", path: "/my-list", icon: Bookmark },
    { label: "Watch History", path: "/history", icon: Clock },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <>
      <nav
        ref={topNavRef}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-white/10 bg-[color:rgb(8_8_8_/_0.9)] shadow-[0_12px_30px_rgba(0,0,0,0.38)] backdrop-blur-xl"
            : isHulu
              ? "border-white/5 bg-[linear-gradient(180deg,rgba(7,12,9,0.94)_0%,rgba(7,12,9,0.5)_72%,transparent_100%)] backdrop-blur-md"
              : "border-transparent bg-gradient-to-b from-black/82 to-transparent backdrop-blur-sm"
        }`}
      >
        <div className={`flex items-center justify-between px-4 md:px-12 ${isHulu ? "pb-3 pt-[calc(var(--app-safe-top)+0.45rem)] md:py-3" : "pb-3 pt-[calc(var(--app-safe-top)+0.35rem)] md:py-4"}`}>
          <div className={`flex items-center ${isHulu ? "gap-3 md:gap-6" : "gap-4 md:gap-8"}`}>
            <BrandWordmark className={isHulu ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} />

            <div className={`hidden md:flex items-center ${isHulu ? "gap-4" : "gap-5"}`}>
              {primaryLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors hover:text-white ${
                    isLinkActive(link.path) ? "text-white" : "text-gray-300"
                  } ${isHulu ? "text-[13px] font-semibold uppercase tracking-[0.16em]" : "text-sm font-medium"} ${
                    isLinkActive(link.path) && isHulu ? "text-[var(--brand)]" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={`flex items-center ${isHulu ? "gap-2 md:gap-3" : "gap-3 md:gap-4"}`}>
            <div className="hidden md:flex md:items-center">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className={`flex items-center rounded ${isHulu ? "border border-white/10 bg-white/[0.04] px-3 py-2" : "border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur"}`}>
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Titles, people, genres"
                      className="bg-transparent text-white text-sm outline-none w-32 md:w-48 placeholder-gray-500"
                      onBlur={() => {
                        if (!searchQuery) {
                          setShowSearch(false);
                        }
                      }}
                    />
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowSearch(true)} className="text-white hover:text-gray-300 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="relative hidden md:block">
              <button onClick={handleOpenNotifications} className="relative text-white hover:text-gray-300 transition-colors">
                <Bell className="w-5 h-5" />
                {notificationsEnabled && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-[var(--brand-contrast)]">
                    {Math.min(unreadCount, 9)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-10 z-50 max-h-[420px] w-[min(360px,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[var(--panel-bg)] p-3 shadow-2xl">
                  <div className="flex items-center justify-between px-2 py-2 border-b border-white/10 mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {notificationCopy.notification_center_title || "Notifications"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {notificationCopy.notification_center_subtitle || "New releases, trending drops, and updates"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2">
                    {!notificationsEnabled && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-4">
                        <p className="text-white text-sm font-medium">Notifications are turned off</p>
                        <p className="text-gray-400 text-xs mt-1">
                          Re-enable them in Settings to get new release alerts and app updates again.
                        </p>
                      </div>
                    )}

                    {notificationsEnabled && notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.media_type && item.tmdb_id) {
                            navigate(`/${item.media_type}/${item.tmdb_id}`);
                          }
                          setShowNotifications(false);
                        }}
                        className="w-full text-left rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white text-sm font-medium">{item.title}</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.body}</p>
                          </div>
                          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                            {item.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <>
                <div className="relative hidden md:block">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 group">
                    {activeProfile ? (
                      <ProfileAvatar profile={activeProfile} size={32} className="rounded" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--brand)] text-sm font-bold text-[var(--brand-contrast)]">
                        {user.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-white transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showUserMenu && (
                    <div className={`absolute right-0 top-12 z-50 w-56 rounded border border-white/10 bg-[var(--panel-bg)] py-2 shadow-2xl ${isHulu ? "rounded-2xl" : ""}`}>
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white text-sm font-medium truncate">{activeProfile?.name || user.full_name || "User"}</p>
                        <p className="text-gray-400 text-xs truncate">{user.email}</p>
                      </div>

                      {onSwitchProfile && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSwitchProfile();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full"
                        >
                          <span className="w-4 h-4 flex items-center justify-center text-xs">P</span>
                          Switch Profile
                        </button>
                      )}

                      <Link
                        to="/my-list"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Bookmark className="w-4 h-4" />
                        My List
                      </Link>

                      <Link
                        to="/history"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Clock className="w-4 h-4" />
                        Watch History
                      </Link>

                      {user?.is_admin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleThemeToggle();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <span className="w-4 text-center text-xs font-semibold">{theme === "netflix" ? "H" : "N"}</span>
                        Switch to {theme === "netflix" ? "Hulu" : "Netflix"} mode
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="flex md:hidden items-center justify-center"
                  aria-label="Open profile menu"
                >
                  {activeProfile ? (
                    <ProfileAvatar profile={activeProfile} size={36} className="rounded-sm ring-1 ring-white/20 transition-transform hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[var(--brand)] text-sm font-bold text-[var(--brand-contrast)] ring-1 ring-white/20">
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="rounded bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {user && (
        <>
          <div ref={mobileTabRef} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(var(--app-safe-bottom)+0.5rem)] md:hidden">
            <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[color:rgb(10_10_10_/_0.82)] shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
              {mobileBottomLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-[1rem] px-2 py-2 text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <button
                onClick={() => setShowMobileMenu(true)}
                className={`flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-[1rem] px-2 py-2 text-[11px] font-medium transition-colors ${
                  showMobileMenu
                    ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>
            </div>
          </div>

          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetContent side="left" className="flex h-[var(--app-viewport-height)] w-[88vw] max-w-sm flex-col overflow-hidden border-white/10 bg-[var(--panel-bg)] p-0 text-white">
              <SheetHeader className="shrink-0 border-b border-white/10 px-5 pb-5 pt-[calc(var(--app-safe-top)+1.1rem)] text-left">
                <SheetTitle className="text-white">
                  <BrandWordmark asText showMode />
                </SheetTitle>
                <div className="mt-3 flex items-center gap-3">
                  {activeProfile ? (
                    <ProfileAvatar profile={activeProfile} size={44} className="rounded" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-[var(--brand)] text-sm font-bold text-[var(--brand-contrast)]">
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {activeProfile?.name || user.full_name || "User"}
                    </p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-3 py-4 pb-4">
                <div className="space-y-1">
                  {mobileMenuLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isLinkActive(link.path);

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                          active ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}

                  {onSwitchProfile && (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onSwitchProfile();
                      }}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-xs">P</span>
                      <span>Switch Profile</span>
                    </button>
                  )}

                  <button
                    onClick={handleThemeToggle}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <span className="w-4 text-center text-xs font-semibold">{theme === "netflix" ? "H" : "N"}</span>
                    <span>Switch to {theme === "netflix" ? "Hulu" : "Netflix"} mode</span>
                  </button>

                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                        isLinkActive("/admin")
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        {notificationCopy.notification_center_title || "Notifications"}
                      </p>
                      {notificationsEnabled && unreadCount > 0 && (
                        <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-contrast)]">
                          {Math.min(unreadCount, 9)} new
                        </span>
                      )}
                    </div>

                    {!notificationsEnabled && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
                        Notifications are turned off in Settings.
                      </div>
                    )}

                    {notificationsEnabled && notifications.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.media_type && item.tmdb_id) {
                            navigate(`/${item.media_type}/${item.tmdb_id}`);
                          }
                          setShowMobileMenu(false);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{item.body}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                            {item.type}
                          </span>
                        </div>
                      </button>
                    ))}

                    {notificationsEnabled && notifications.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
                        No new notifications right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-white/10 bg-[var(--panel-bg)] px-3 pb-[calc(var(--app-safe-bottom)+0.75rem)] pt-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  );
}
