import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Bookmark, ChevronDown, Clock, LayoutDashboard, LogOut, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AvatarArt, AVATAR_COLORS } from "@/lib/avatar-options";
import {
  fetchNotifications,
  getUnreadNotifications,
  markNotificationsSeen,
  sendBrowserNotifications,
} from "@/lib/notifications";
import { PREFERENCE_CHANGED_EVENT, readPreference } from "@/lib/preferences";
import { fetchPublicSiteSettings, getDefaultSiteSettings } from "@/lib/admin-config";

export default function Navbar({ user, activeProfile, onSwitchProfile }) {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    readPreference("subflix_notifications_enabled", "true") !== "false"
  );
  const [notificationCopy, setNotificationCopy] = useState(getDefaultSiteSettings());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    base44.auth.logout();
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

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Movies", path: "/browse?type=movie" },
    { label: "TV Shows", path: "/browse?type=tv" },
    { label: "My List", path: "/my-list" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0a0a0a] shadow-lg" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex-shrink-0">
            <span className="text-[#E50914] font-black text-2xl md:text-3xl tracking-tight select-none">
              SUBFLIX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  location.pathname === link.path ? "text-white" : "text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="md:hidden relative">
            <button className="flex items-center gap-1 text-sm text-white">
              Browse <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="flex items-center bg-black/80 border border-white/40 rounded px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Titles, people, genres"
                  className="bg-transparent text-white text-sm outline-none w-48 placeholder-gray-500"
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

          <div className="relative hidden sm:block">
            <button
              onClick={handleOpenNotifications}
              className="relative text-white hover:text-gray-300 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notificationsEnabled && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#E50914] text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {Math.min(unreadCount, 9)}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-[360px] max-h-[420px] overflow-y-auto bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
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
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#E50914] mt-1">
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
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 group">
                {activeProfile ? (
                  <div
                    className="w-8 h-8 rounded overflow-hidden"
                    style={{ backgroundColor: activeProfile.avatar_color || AVATAR_COLORS[0] }}
                  >
                    <AvatarArt
                      avatarIndex={activeProfile.avatar_index ?? 0}
                      color={activeProfile.avatar_color || AVATAR_COLORS[0]}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded bg-[#E50914] flex items-center justify-center text-white font-bold text-sm">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 bg-[#1a1a1a] border border-white/10 rounded shadow-2xl py-2 z-50">
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
                    <span className="w-4 h-4 flex items-center justify-center text-xs">S</span>
                    Settings
                  </Link>

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
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-[#E50914] hover:bg-[#c40812] text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
