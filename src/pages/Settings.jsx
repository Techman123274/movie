import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Film,
  KeyRound,
  MonitorPlay,
  BellRing,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";
import { hasTmdbCredentials, tmdbApiKey, tmdbReadAccessToken } from "@/lib/env";
import { getProfileBadge, readPreference, removePreference, writePreference } from "@/lib/preferences";
import { addFriend, listFriends, removeFriend, SOCIAL_CHANGED_EVENT } from "@/lib/social";

const sections = [
  { id: "account", label: "Account", icon: UserCircle2 },
  { id: "social", label: "Social", icon: Users },
  { id: "playback", label: "Playback", icon: MonitorPlay },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "library", label: "Library", icon: Film },
  { id: "developer", label: "Developer", icon: SlidersHorizontal },
];

export default function SettingsPage() {
  const { user, activeProfile, onSwitchProfile, isAdmin } = useOutletContext() || {};
  const [activeSection, setActiveSection] = useState("account");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [autoplayPreviews, setAutoplayPreviews] = useState(true);
  const [autoplayNextEpisode, setAutoplayNextEpisode] = useState(true);
  const [saveWatchHistory, setSaveWatchHistory] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [friends, setFriends] = useState([]);
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
      setFriends([]);
      return undefined;
    }

    let cancelled = false;

    const loadFriends = async () => {
      const nextFriends = await listFriends().catch(() => []);
      if (!cancelled) {
        setFriends(nextFriends);
      }
    };

    loadFriends();
    window.addEventListener(SOCIAL_CHANGED_EVENT, loadFriends);
    return () => {
      cancelled = true;
      window.removeEventListener(SOCIAL_CHANGED_EVENT, loadFriends);
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

  const handleAddFriend = async (event) => {
    event.preventDefault();
    if (!friendEmail.trim()) {
      return;
    }

    try {
      setSocialBusy(true);
      await addFriend({
        user,
        email: friendEmail,
        name: friendName,
      });
      setFriendEmail("");
      setFriendName("");
      setSocialMessage("Friend added to your activity circle.");
    } catch (error) {
      setSocialMessage(error?.message || "Could not add that friend yet.");
    } finally {
      setSocialBusy(false);
      window.setTimeout(() => setSocialMessage(""), 2200);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    try {
      setSocialBusy(true);
      await removeFriend(friendshipId);
      setSocialMessage("Friend removed.");
    } catch {
      setSocialMessage("Could not remove that friend yet.");
    } finally {
      setSocialBusy(false);
      window.setTimeout(() => setSocialMessage(""), 2200);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-14 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-[#E50914] mb-3">Subflix</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
              <p className="text-gray-400 mt-2 max-w-2xl">
                Manage your account, profile behavior, and playback preferences in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 min-w-[260px]">
              <p className="text-gray-500 text-xs uppercase tracking-[0.25em] mb-1">Active Profile</p>
              <p className="text-white text-lg font-semibold">{profileName}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email || "Signed in"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-[#101010] p-3 h-fit sticky top-24">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-colors ${
                    isActive ? "bg-white text-black" : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
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
                  description="Personalize how Subflix feels when you open it."
                  icon={UserCircle2}
                >
                  <SettingsRow label="Profile type" value={profileType} muted={`Allowed content: ${profileMaturity}`} />
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
                      onClick={onSwitchProfile}
                      className="self-start bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Manage Profiles
                    </button>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="self-start rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Open Admin Panel
                    </Link>
                  )}
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
                  value="Netflix-inspired dark"
                  muted="Optimized for cinematic browsing"
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
                <form onSubmit={handleAddFriend} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_auto]">
                    <input
                      type="email"
                      value={friendEmail}
                      onChange={(event) => setFriendEmail(event.target.value)}
                      placeholder="friend@email.com"
                      className="rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#E50914]"
                    />
                    <input
                      type="text"
                      value={friendName}
                      onChange={(event) => setFriendName(event.target.value)}
                      placeholder="Display name (optional)"
                      className="rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-[#E50914]"
                    />
                    <button
                      type="submit"
                      disabled={socialBusy}
                      className="rounded-xl bg-[#E50914] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c40812] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add Friend
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Friends you add can appear in your Home recommendations through likes, ratings, watchlist saves, and watch starts.
                  </p>
                </form>

                {socialMessage && (
                  <p className="text-sm text-[#86efac]">{socialMessage}</p>
                )}

                <div className="space-y-3">
                  {friends.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-sm text-gray-500">
                      Add a few friends to unlock the Friends Activity row on Home.
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">
                            {friend.friend_name || friend.friend_email}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">{friend.friend_email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition-colors hover:border-white/20 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    ))
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
                    onClick={requestBrowserNotifications}
                    className="self-start bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
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
                        onClick={saveTmdbKey}
                        className="bg-[#E50914] hover:bg-[#c40812] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
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
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6 md:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#E50914]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">{eyebrow}</p>
          <h2 className="text-white text-2xl font-bold">{title}</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SettingsRow({ label, value, muted }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {muted && <p className="text-gray-500 text-xs mt-1">{muted}</p>}
      </div>
      <p className="text-gray-300 text-sm">{value}</p>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`inline-flex h-8 w-14 items-center rounded-full px-1 transition-colors shrink-0 ${
          checked ? "bg-[#E50914] justify-end" : "bg-white/10 justify-start"
        }`}
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
