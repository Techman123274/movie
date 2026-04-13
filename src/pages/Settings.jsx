import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Film,
  KeyRound,
  LogOut,
  MonitorPlay,
  BellRing,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { hasTmdbCredentials, tmdbApiKey, tmdbReadAccessToken } from "@/lib/env";
import { getProfileBadge, readPreference, removePreference, writePreference } from "@/lib/preferences";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getOtherFriendEmail,
  listFriendRequests,
  removeFriend as removeFriendRequest,
  sendFriendRequest,
} from "@/lib/friends";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { useAppOutletContext } from "@/lib/outlet-context";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAppTheme } from "@/lib/theme";

const sections = [
  { id: "account", label: "Account", icon: UserCircle2 },
  { id: "social", label: "Social", icon: Users },
  { id: "playback", label: "Playback", icon: MonitorPlay },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "library", label: "Library", icon: Film },
  { id: "developer", label: "Developer", icon: SlidersHorizontal },
];

export default function SettingsPage() {
  const { user, activeProfile, onSwitchProfile, isAdmin } = useAppOutletContext();
  const { theme, themes, setTheme, saving: savingTheme } = useAppTheme();
  const [activeSection, setActiveSection] = useState("account");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [autoplayPreviews, setAutoplayPreviews] = useState(true);
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState(true);
  const [saveWatchHistory, setSaveWatchHistory] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [presenceVisibility, setPresenceVisibility] = useState("public");
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  const [socialMessage, setSocialMessage] = useState("");
  const [socialBusy, setSocialBusy] = useState(false);

  useEffect(() => {
    setApiKey(readPreference("tmdb_api_key", tmdbApiKey()));
    setAutoplayPreviews(readPreference("subflix_autoplay_previews", "true") !== "false");
    setAutoplayNextEpisode(readPreference("subflix_autoplay_next_episode", "true") !== "false");
    setSaveWatchHistory(readPreference("subflix_save_watch_history", "true") !== "false");
    setNotificationsEnabled(readPreference("subflix_notifications_enabled", "true") !== "false");
    setBrowserNotifications(readPreference("subflix_browser_notifications", "false") === "true");
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setFriendRequests({ incoming: [], outgoing: [], accepted: [] });
      return undefined;
    }

    let cancelled = false;

    const loadSocialState = async () => {
      const [requests, visibility] = await Promise.all([
        listFriendRequests().catch(() => ({ incoming: [], outgoing: [], accepted: [] })),
        base44.preferences.getPresenceVisibility().catch(() => "public"),
      ]);

      if (!cancelled) {
        setFriendRequests(requests);
        setPresenceVisibility(visibility);
      }
    };

    loadSocialState();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const profileName = activeProfile?.name || user?.full_name || "Member";
  const profileType = activeProfile?.is_kids ? "Kids profile" : "Standard profile";
  const profileMaturity = getProfileBadge(activeProfile) || "All maturity ratings";
  const tmdbStatus = useMemo(() => {
    if (tmdbReadAccessToken()) {
      return "Connected with TMDB read token";
    }
    if (apiKey || hasTmdbCredentials()) {
      return "Connected with TMDB API key";
    }
    return "Not configured";
  }, [apiKey]);

  const saveTmdbKey = () => {
    const nextValue = apiKey.trim();
    if (nextValue) {
      writePreference("tmdb_api_key", nextValue);
    } else {
      removePreference("tmdb_api_key");
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const updateToggle = (key, value, setter) => {
    setter(value);
    writePreference(key, value);
  };

  const requestBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      updateToggle("subflix_browser_notifications", true, setBrowserNotifications);
    }
  };

  const refreshFriendRequests = async () => {
    const requests = await listFriendRequests().catch(() => ({ incoming: [], outgoing: [], accepted: [] }));
    setFriendRequests(requests);
  };

  const handlePresenceVisibilityChange = async (nextValue) => {
    try {
      setSocialBusy(true);
      const savedValue = await base44.preferences.setPresenceVisibility(nextValue);
      setPresenceVisibility(savedValue);
      setSocialMessage("Presence setting saved.");
    } catch (error) {
      setSocialMessage(error?.message || "Could not save presence setting yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleAddFriend = async (event) => {
    event.preventDefault();
    if (!friendEmail.trim()) {
      return;
    }

    try {
      setSocialBusy(true);
      await sendFriendRequest({ email: friendEmail, name: friendName });
      setFriendEmail("");
      setFriendName("");
      setSocialMessage("Friend request sent.");
      await refreshFriendRequests();
    } catch (error) {
      setSocialMessage(error?.message || "Could not send that friend request yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setSocialBusy(true);
      await acceptFriendRequest(requestId);
      setSocialMessage("Friend request accepted.");
      await refreshFriendRequests();
    } catch (error) {
      setSocialMessage(error?.message || "Could not accept that request yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      setSocialBusy(true);
      await declineFriendRequest(requestId);
      setSocialMessage("Friend request declined.");
      await refreshFriendRequests();
    } catch (error) {
      setSocialMessage(error?.message || "Could not decline that request yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setSocialBusy(true);
      await cancelFriendRequest(requestId);
      setSocialMessage("Friend request cancelled.");
      await refreshFriendRequests();
    } catch (error) {
      setSocialMessage(error?.message || "Could not cancel that request yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleRemoveFriend = async (requestId) => {
    try {
      setSocialBusy(true);
      await removeFriendRequest(requestId);
      setSocialMessage("Friend removed.");
      await refreshFriendRequests();
    } catch (error) {
      setSocialMessage(error?.message || "Could not remove that friend yet.");
    } finally {
      setSocialBusy(false);
      if (typeof window !== "undefined") {
        window.setTimeout(() => setSocialMessage(""), 2200);
      }
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 pb-28 pt-20 md:px-12 md:pb-14 md:pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 md:mb-8">
          <div className="mb-3">
            <BrandWordmark className="text-2xl md:text-3xl" showMode />
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
                Manage your account, profile behavior, and playback preferences in one place.
              </p>
            </div>
            <div className="mt-3 w-full rounded-2xl border border-white/10 bg-[var(--panel-bg)] px-4 py-4 md:mt-0 md:min-w-[260px] md:px-5">
              <p className="mb-1 text-xs uppercase tracking-[0.22em] text-gray-500">Active Profile</p>
              <div className="mt-3 flex items-center gap-3">
                <ProfileAvatar profile={activeProfile} size={44} fallbackText={profileName} className="rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{profileName}</p>
                  <p className="truncate text-sm text-gray-400">{user?.email || "Signed in"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] md:hidden"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="scrollbar-hide flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#101010] p-2 lg:sticky lg:top-24 lg:block lg:h-fit lg:space-y-1 lg:overflow-visible lg:rounded-3xl lg:p-3">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex min-h-11 min-w-[150px] items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors lg:w-full lg:min-w-0 lg:rounded-2xl lg:px-4 lg:py-4 ${
                    isActive ? "bg-white text-black" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2 lg:gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </span>
                  <ChevronRight className="hidden w-4 h-4 lg:block" />
                </button>
              );
            })}
          </aside>

          <div className="space-y-6">
            {activeSection === "account" && (
              <>
                <SettingsCard
                  eyebrow="Membership"
                  title="Your Subflix account"
                  description="This is the main identity tied to watch history, profiles, and saved titles."
                  icon={ShieldCheck}
                >
                  <SettingsRow label="Display name" value={user?.full_name || "Not available"} />
                  <SettingsRow label="Email" value={user?.email || "Not available"} />
                  <SettingsRow label="Current profile" value={profileName} />
                </SettingsCard>

                <SettingsCard
                  eyebrow="Experience"
                  title="Profile behavior"
                  description="Personalize how the app looks and how this profile behaves when you open it."
                  icon={UserCircle2}
                >
                  <SettingsRow label="Profile type" value={profileType} muted={`Allowed content: ${profileMaturity}`} />
                  <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">App theme</p>
                        <p className="mt-1 text-xs text-gray-500">
                          This saves to your account and follows you across devices.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {themes.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setTheme(option.id)}
                            disabled={savingTheme}
                            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                              theme === option.id
                                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]"
                                : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ToggleRow
                    label="Autoplay previews"
                    description="Start teaser motion on featured titles while browsing."
                    checked={autoplayPreviews}
                    onChange={(value) =>
                      updateToggle("subflix_autoplay_previews", value, setAutoplayPreviews)
                    }
                  />
                  <ToggleRow
                    label="Autoplay next episode"
                    description="Move to the next episode automatically after playback finishes."
                    checked={autoplayNextEpisode}
                    onChange={(value) =>
                      updateToggle("subflix_autoplay_next_episode", value, setAutoplayNextEpisode)
                    }
                  />
                  {onSwitchProfile && (
                    <button
                      type="button"
                      onClick={onSwitchProfile}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 sm:w-auto"
                    >
                      Switch Profile
                    </button>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                    >
                      Open Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E50914]/40 bg-[#E50914]/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E50914]/20 sm:w-auto"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </SettingsCard>
              </>
            )}

            {activeSection === "playback" && (
              <SettingsCard
                eyebrow="Playback"
                title="How Subflix should play"
                description="These controls are stored locally in this browser."
                icon={MonitorPlay}
              >
                <ToggleRow
                  label="Keep watch history"
                  description="Store progress and recently watched titles for your account."
                  checked={saveWatchHistory}
                  onChange={(value) =>
                    updateToggle("subflix_save_watch_history", value, setSaveWatchHistory)
                  }
                />
                <SettingsRow
                  label="Primary player"
                  value="VidLink embed"
                  muted="Current playback provider configured in-app"
                />
                <SettingsRow
                  label="Theme"
                  value={theme === "hulu" ? "Hulu mode" : "Netflix mode"}
                  muted="This preference follows your account"
                />
              </SettingsCard>
            )}

            {activeSection === "social" && (
              <SettingsCard
                eyebrow="Social"
                title="Friends and activity"
                description="Build a lightweight social circle so Subflix can surface what your people liked, rated, and started watching."
                icon={Users}
              >
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">Presence visibility</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Controls who can see when you’re online and what you’re watching.
                      </p>
                    </div>
                    <select
                      value={presenceVisibility}
                      onChange={(event) => handlePresenceVisibilityChange(event.target.value)}
                      disabled={socialBusy}
                      className="min-h-11 w-full rounded-lg border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#E50914] md:w-auto"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends-only</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                </div>

                <Link
                  to="/social"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  Open Social Hub
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <form onSubmit={handleAddFriend} className="rounded-2xl border border-white/10 bg-black/20 p-3 md:p-4">
                  <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_auto]">
                    <input
                      type="email"
                      value={friendEmail}
                      onChange={(event) => setFriendEmail(event.target.value)}
                      placeholder="friend@email.com"
                      className="min-h-11 rounded-lg border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#E50914]"
                    />
                    <input
                      type="text"
                      value={friendName}
                      onChange={(event) => setFriendName(event.target.value)}
                      placeholder="Display name (optional)"
                      className="min-h-11 rounded-lg border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#E50914]"
                    />
                    <button
                      type="submit"
                      disabled={socialBusy}
                      className="min-h-11 rounded-lg bg-[#E50914] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c40812] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Send Request
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Your friend must accept before you can message them or see their presence.
                  </p>
                </form>

                {socialMessage && (
                  <p className="text-sm text-[#86efac]">{socialMessage}</p>
                )}

                <div className="space-y-3">
                  {friendRequests.incoming.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-sm font-semibold text-white">Incoming requests</p>
                      <div className="mt-3 space-y-3">
                        {friendRequests.incoming.map((request) => (
                          <div key={request.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {request.requester_name || request.requester_email}
                              </p>
                              <p className="truncate text-xs text-gray-500">{request.requester_email}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={socialBusy}
                                onClick={() => handleAcceptRequest(request.id)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-60"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={socialBusy}
                                onClick={() => handleDeclineRequest(request.id)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] disabled:opacity-60"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {friendRequests.outgoing.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-sm font-semibold text-white">Pending requests</p>
                      <div className="mt-3 space-y-3">
                        {friendRequests.outgoing.map((request) => (
                          <div key={request.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{request.addressee_email}</p>
                              <p className="truncate text-xs text-gray-500">Waiting for acceptance</p>
                            </div>
                            <button
                              type="button"
                              disabled={socialBusy}
                              onClick={() => handleCancelRequest(request.id)}
                              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-60 md:w-auto"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {friendRequests.accepted.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-gray-500">
                      No accepted friends yet.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-sm font-semibold text-white">Friends</p>
                      <div className="mt-3 space-y-3">
                        {friendRequests.accepted.map((request) => {
                          const otherEmail = getOtherFriendEmail(request, user?.email);
                          return (
                            <div key={request.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{otherEmail}</p>
                                <p className="truncate text-xs text-gray-500">Accepted</p>
                              </div>
                              <button
                                type="button"
                                disabled={socialBusy}
                                onClick={() => handleRemoveFriend(request.id)}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-60 md:w-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </SettingsCard>
            )}

            {activeSection === "notifications" && (
              <SettingsCard
                eyebrow="Notifications"
                title="Stay on top of new releases"
                description="Subflix can surface new movie drops, new episodes, and app updates in the bell menu and optionally in the browser."
                icon={BellRing}
              >
                <ToggleRow
                  label="In-app notifications"
                  description="Show release and update notifications in the navbar bell."
                  checked={notificationsEnabled}
                  onChange={(value) =>
                    updateToggle("subflix_notifications_enabled", value, setNotificationsEnabled)
                  }
                />
                <ToggleRow
                  label="Browser notifications"
                  description="Send desktop notifications when supported and allowed."
                  checked={browserNotifications}
                  onChange={(value) => {
                    if (value && notificationPermission !== "granted") {
                      requestBrowserNotifications();
                      return;
                    }
                    updateToggle("subflix_browser_notifications", value, setBrowserNotifications);
                  }}
                />
                <SettingsRow
                  label="Permission"
                  value={notificationPermission}
                  muted="Browser permission is required before desktop alerts can appear"
                />
                {notificationPermission !== "granted" && (
                  <button
                    type="button"
                    onClick={requestBrowserNotifications}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 sm:w-auto"
                  >
                    Allow Browser Notifications
                  </button>
                )}
              </SettingsCard>
            )}

            {activeSection === "library" && (
              <SettingsCard
                eyebrow="Library"
                title="Saved content controls"
                description="Your personal data is stored in Supabase when available, with local fallback during setup."
                icon={Film}
              >
                <SettingsRow
                  label="Watchlist"
                  value="Synced per account"
                  muted="Titles you save for later live here"
                />
                <SettingsRow
                  label="Watch history"
                  value={saveWatchHistory ? "Enabled" : "Paused"}
                  muted="Playback progress is tracked only when this is enabled"
                />
                <SettingsRow
                  label="Profiles"
                  value="Up to 5 profiles"
                  muted="Switch profiles from the avatar menu"
                />
              </SettingsCard>
            )}

            {activeSection === "developer" && (
              <>
                <SettingsCard
                  eyebrow="Developer"
                  title="TMDB connection"
                  description="Subflix uses TMDB for titles, artwork, search, and metadata."
                  icon={KeyRound}
                >
                  <SettingsRow
                    label="Connection status"
                    value={tmdbStatus}
                    muted={tmdbReadAccessToken() ? "Read access token detected in environment" : undefined}
                  />

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 mt-4">
                    <label className="block text-sm font-medium text-white mb-2">TMDB API key</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste a TMDB v3 API key for this browser"
                      className="w-full rounded-xl bg-[#181818] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#E50914] font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={saveTmdbKey}
                        className="min-h-11 w-full rounded-lg bg-[#E50914] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#c40812] sm:w-auto"
                      >
                        Save in Browser
                      </button>
                      {saved && (
                        <span className="inline-flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Saved
                        </span>
                      )}
                    </div>
                  </div>
                </SettingsCard>

                <SettingsCard
                  eyebrow="Notes"
                  title="Environment-aware setup"
                  description="You can run Subflix with env variables, browser overrides, or both."
                  icon={SettingsIcon}
                >
                  <SettingsRow
                    label="Env support"
                    value="TMDB_, NEXT_PUBLIC_, and VITE_ keys"
                  />
                  <SettingsRow
                    label="Recommended approach"
                    value="Use .env.local for shared defaults"
                    muted="Browser-saved key acts as a local override"
                  />
                </SettingsCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--card-bg)] p-4 md:rounded-3xl md:p-8">
      <div className="mb-5 flex items-start gap-3 md:mb-6 md:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 md:h-12 md:w-12">
          <Icon className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-gray-500 md:tracking-[0.3em]">{eyebrow}</p>
          <h2 className="text-xl font-bold leading-tight text-white md:text-2xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SettingsRow({ label, value, muted = "" }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        {muted && <p className="text-gray-500 text-xs mt-1">{muted}</p>}
      </div>
      <p className="min-w-0 break-words text-left text-sm text-gray-300 md:text-right">{value}</p>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="min-w-0 pr-2">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`inline-flex h-8 w-14 items-center rounded-full px-1 transition-colors shrink-0 ${
          checked ? "justify-end bg-[var(--brand)]" : "justify-start bg-white/10"
        }`}
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
