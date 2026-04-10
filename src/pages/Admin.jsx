import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Clapperboard,
  Film,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  MonitorPlay,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { getDefaultSiteSettings } from "@/lib/admin-config";
import { searchMulti, tmdbW185 } from "@/lib/tmdb";
import { useAppTheme } from "@/lib/theme";

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: Clapperboard },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Site Settings", icon: Settings2 },
];

const audiences = [
  { value: "global", label: "Global" },
  { value: "standard", label: "Standard" },
  { value: "kids", label: "Kids" },
];

const notificationTypes = ["update", "release", "editorial", "system"];

const emptyNotificationDraft = () => ({
  id: "",
  title: "",
  body: "",
  notification_type: "update",
  audience: "global",
  publish_at: "",
  ends_at: "",
  is_active: true,
});

const emptyContentDraft = () => ({
  id: "",
  title: "",
  tmdb_id: "",
  media_type: "movie",
  poster_path: "",
  backdrop_path: "",
  overview: "",
  release_date: "",
  vote_average: "",
  genre_ids: [],
  entry_type: "hero",
  group_name: "",
  audience: "global",
  badge_text: "",
  sort_order: 0,
  starts_at: "",
  ends_at: "",
  is_active: true,
});

const toDateTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const fromDateTimeInputValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleString();
};

export default function AdminPage() {
  const { user, isAdmin, logout } = useAuth();
  const { theme } = useAppTheme();
  const [activeSection, setActiveSection] = useState("overview");
  const [dashboard, setDashboard] = useState({
    metrics: {
      totalUsers: 0,
      totalProfiles: 0,
      totalWatchlistItems: 0,
      totalHistoryEvents: 0,
      activeAnnouncements: 0,
      activeFeaturedEntries: 0,
    },
    topTitles: [],
    recentActivity: [],
    userSummaries: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [featuredEntries, setFeaturedEntries] = useState([]);
  const [siteSettingsRows, setSiteSettingsRows] = useState([]);
  const [notificationDraft, setNotificationDraft] = useState(emptyNotificationDraft());
  const [contentDraft, setContentDraft] = useState(emptyContentDraft());
  const [siteSettingsForm, setSiteSettingsForm] = useState(getDefaultSiteSettings());

  const userSummaryRows = useMemo(
    () => (dashboard.userSummaries || []).slice(0, 8),
    [dashboard.userSummaries]
  );

  const loadAdminData = async () => {
    setLoading(true);
    setStatusMessage("");

    try {
      const [dashboardData, adminNotifications, adminFeaturedEntries, adminSiteSettings] =
        await Promise.all([
          base44.admin.getDashboardData(),
          base44.admin.entities.AdminNotification.list("-publish_at", 50),
          base44.admin.entities.AdminFeaturedEntry.list("sort_order", 100),
          base44.admin.entities.AdminSiteSetting.list("setting_key", 50),
        ]);

      setDashboard(dashboardData);
      setNotifications(adminNotifications);
      setFeaturedEntries(adminFeaturedEntries);
      setSiteSettingsRows(adminSiteSettings);
      setSiteSettingsForm({
        ...getDefaultSiteSettings(),
        ...Object.fromEntries(
          (adminSiteSettings || []).map((row) => [row.setting_key, row.setting_value ?? ""])
        ),
      });
    } catch (error) {
      setStatusMessage(error?.message || "We couldn’t load the admin workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadAdminData();
  }, [isAdmin]);

  const resetNotificationDraft = () => setNotificationDraft(emptyNotificationDraft());
  const resetContentDraft = () => setContentDraft(emptyContentDraft());

  const handleSearchCatalog = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchMulti(searchQuery.trim());
      setSearchResults(
        (results.results || []).filter((item) => item.media_type === "movie" || item.media_type === "tv").slice(0, 8)
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    setContentDraft((current) => ({
      ...current,
      title: item.title || item.name || "",
      tmdb_id: item.id,
      media_type: item.media_type || (item.title ? "movie" : "tv"),
      poster_path: item.poster_path || "",
      backdrop_path: item.backdrop_path || "",
      overview: item.overview || "",
      release_date: item.release_date || item.first_air_date || "",
      vote_average: item.vote_average || "",
      genre_ids: item.genre_ids || [],
    }));
  };

  const handleSaveNotification = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");

    const payload = {
      title: notificationDraft.title.trim(),
      body: notificationDraft.body.trim(),
      notification_type: notificationDraft.notification_type,
      audience: notificationDraft.audience,
      publish_at: fromDateTimeInputValue(notificationDraft.publish_at) || new Date().toISOString(),
      ends_at: fromDateTimeInputValue(notificationDraft.ends_at),
      is_active: notificationDraft.is_active,
      media_type: null,
      tmdb_id: null,
    };

    try {
      if (notificationDraft.id) {
        await base44.admin.entities.AdminNotification.update(notificationDraft.id, payload);
      } else {
        await base44.admin.entities.AdminNotification.create(payload);
      }
      resetNotificationDraft();
      await loadAdminData();
      setStatusMessage("Notification center updated.");
    } catch (error) {
      setStatusMessage(error?.message || "Notification save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNotificationNow = async () => {
    setSaving(true);
    setStatusMessage("");

    const payload = {
      title: notificationDraft.title.trim(),
      body: notificationDraft.body.trim(),
      notification_type: notificationDraft.notification_type,
      audience: notificationDraft.audience,
      publish_at: new Date().toISOString(),
      ends_at: fromDateTimeInputValue(notificationDraft.ends_at),
      is_active: true,
      media_type: null,
      tmdb_id: null,
    };

    try {
      if (notificationDraft.id) {
        await base44.admin.entities.AdminNotification.update(notificationDraft.id, payload);
      } else {
        await base44.admin.entities.AdminNotification.create(payload);
      }
      resetNotificationDraft();
      await loadAdminData();
      setStatusMessage("Notification sent to users now.");
    } catch (error) {
      setStatusMessage(error?.message || "Immediate send failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditNotification = (item) => {
    setNotificationDraft({
      id: item.id,
      title: item.title || "",
      body: item.body || "",
      notification_type: item.notification_type || item.type || "update",
      audience: item.audience || "global",
      publish_at: toDateTimeInputValue(item.publish_at || item.created_at),
      ends_at: toDateTimeInputValue(item.ends_at),
      is_active: item.is_active !== false,
    });
    setActiveSection("notifications");
  };

  const handleToggleNotification = async (item) => {
    setSaving(true);
    try {
      await base44.admin.entities.AdminNotification.update(item.id, {
        is_active: item.is_active === false,
      });
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    setSaving(true);
    try {
      await base44.admin.entities.AdminNotification.delete(id);
      await loadAdminData();
      if (notificationDraft.id === id) {
        resetNotificationDraft();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeaturedEntry = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");

    const payload = {
      title: contentDraft.title.trim(),
      tmdb_id: Number(contentDraft.tmdb_id),
      media_type: contentDraft.media_type,
      poster_path: contentDraft.poster_path || "",
      backdrop_path: contentDraft.backdrop_path || "",
      overview: contentDraft.overview || "",
      release_date: contentDraft.release_date || "",
      vote_average: contentDraft.vote_average ? Number(contentDraft.vote_average) : null,
      genre_ids: contentDraft.genre_ids || [],
      entry_type: contentDraft.entry_type,
      group_name:
        contentDraft.entry_type === "row"
          ? contentDraft.group_name.trim() || siteSettingsForm.home_curated_row_title || "Staff Picks"
          : "",
      audience: contentDraft.audience,
      badge_text: contentDraft.badge_text.trim(),
      sort_order: Number(contentDraft.sort_order || 0),
      starts_at: fromDateTimeInputValue(contentDraft.starts_at),
      ends_at: fromDateTimeInputValue(contentDraft.ends_at),
      is_active: contentDraft.is_active,
    };

    try {
      if (contentDraft.id) {
        await base44.admin.entities.AdminFeaturedEntry.update(contentDraft.id, payload);
      } else {
        await base44.admin.entities.AdminFeaturedEntry.create(payload);
      }
      resetContentDraft();
      setSearchResults([]);
      setSearchQuery("");
      await loadAdminData();
      setStatusMessage("Homepage curation updated.");
    } catch (error) {
      setStatusMessage(error?.message || "Content entry save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditFeaturedEntry = (item) => {
    setContentDraft({
      id: item.id,
      title: item.title || "",
      tmdb_id: item.tmdb_id || "",
      media_type: item.media_type || "movie",
      poster_path: item.poster_path || "",
      backdrop_path: item.backdrop_path || "",
      overview: item.overview || "",
      release_date: item.release_date || "",
      vote_average: item.vote_average || "",
      genre_ids: item.genre_ids || [],
      entry_type: item.entry_type || "hero",
      group_name: item.group_name || "",
      audience: item.audience || "global",
      badge_text: item.badge_text || "",
      sort_order: item.sort_order || 0,
      starts_at: toDateTimeInputValue(item.starts_at),
      ends_at: toDateTimeInputValue(item.ends_at),
      is_active: item.is_active !== false,
    });
    setActiveSection("content");
  };

  const handleToggleFeaturedEntry = async (item) => {
    setSaving(true);
    try {
      await base44.admin.entities.AdminFeaturedEntry.update(item.id, {
        is_active: item.is_active === false,
      });
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeaturedEntry = async (id) => {
    setSaving(true);
    try {
      await base44.admin.entities.AdminFeaturedEntry.delete(id);
      await loadAdminData();
      if (contentDraft.id === id) {
        resetContentDraft();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSiteSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");

    const entries = Object.entries(siteSettingsForm);

    try {
      for (const [settingKey, settingValue] of entries) {
        const existing = siteSettingsRows.find((row) => row.setting_key === settingKey);
        const payload = {
          setting_key: settingKey,
          setting_value: String(settingValue ?? ""),
          is_public: true,
          label: settingKey,
        };

        if (existing) {
          await base44.admin.entities.AdminSiteSetting.update(existing.id, payload);
        } else {
          await base44.admin.entities.AdminSiteSetting.create(payload);
        }
      }

      await loadAdminData();
      setStatusMessage("Site settings synced to the app.");
    } catch (error) {
      setStatusMessage(error?.message || "Site settings failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--card-bg)] p-8 md:p-12">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <ShieldAlert className="h-7 w-7 text-[var(--brand)]" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand)]">Restricted Area</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">This admin panel is only available to allowlisted Subflix operators.</h1>
          <p className="mt-4 max-w-2xl text-base text-white/70">
            Sign in with an allowlisted admin email, or head back to the member experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="rounded bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-200">
              Return Home
            </Link>
            <button
              onClick={() => logout()}
              className="rounded border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <div className="border-b border-white/10 bg-[var(--card-bg)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <BrandWordmark className="text-3xl md:text-4xl" showMode />
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Advanced Control Room</h1>
            <p className="mt-3 max-w-2xl text-white/65">
              Curate the homepage, schedule announcements, monitor activity, and tune site-wide behavior from one {theme === "hulu" ? "Hulu-inspired" : "cinematic"} back office.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadAdminData}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4" />
              Member App
            </Link>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:px-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-[var(--panel-bg)] p-3 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.26em] text-white/35">Operator</p>
            <p className="mt-2 text-lg font-semibold">{user?.full_name || user?.email || "Admin"}</p>
            <p className="text-sm text-white/45">{user?.email}</p>
          </div>

          <div className="mt-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          {statusMessage && (
            <div className="rounded-2xl border border-[#E50914]/20 bg-[#E50914]/10 px-4 py-3 text-sm text-white/85">
              {statusMessage}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center rounded-[2rem] border border-white/10 bg-[#101010]">
              <Loader2 className="h-10 w-10 animate-spin text-[#E50914]" />
            </div>
          ) : (
            <>
              {activeSection === "overview" && <OverviewSection dashboard={dashboard} />}

              {activeSection === "content" && (
                <ContentSection
                  searching={searching}
                  saving={saving}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  contentDraft={contentDraft}
                  siteSettingsForm={siteSettingsForm}
                  featuredEntries={featuredEntries}
                  onSearchQueryChange={setSearchQuery}
                  onSearch={handleSearchCatalog}
                  onSelectResult={handleSelectSearchResult}
                  onDraftChange={setContentDraft}
                  onSave={handleSaveFeaturedEntry}
                  onReset={resetContentDraft}
                  onEdit={handleEditFeaturedEntry}
                  onToggle={handleToggleFeaturedEntry}
                  onDelete={handleDeleteFeaturedEntry}
                />
              )}

              {activeSection === "notifications" && (
                <NotificationsSection
                  saving={saving}
                  notificationDraft={notificationDraft}
                  notifications={notifications}
                  onDraftChange={setNotificationDraft}
                  onSave={handleSaveNotification}
                  onReset={resetNotificationDraft}
                  onEdit={handleEditNotification}
                  onSendNow={handleSendNotificationNow}
                  onToggle={handleToggleNotification}
                  onDelete={handleDeleteNotification}
                />
              )}

              {activeSection === "users" && <UsersSection userSummaryRows={userSummaryRows} />}

              {activeSection === "settings" && (
                <SettingsSection
                  saving={saving}
                  siteSettingsForm={siteSettingsForm}
                  onChange={setSiteSettingsForm}
                  onSave={handleSaveSiteSettings}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#131313_0%,#0a0a0a_100%)] p-6 md:p-7">
      <p className="text-xs uppercase tracking-[0.3em] text-[#E50914]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm text-white/60">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/75">{label}</span>
      {children}
    </label>
  );
}

function OverviewSection({ dashboard }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Total users", dashboard.metrics.totalUsers, Users],
          ["Profiles", dashboard.metrics.totalProfiles, Film],
          ["Watchlist items", dashboard.metrics.totalWatchlistItems, Sparkles],
          ["History events", dashboard.metrics.totalHistoryEvents, MonitorPlay],
          ["Live announcements", dashboard.metrics.activeAnnouncements, BellRing],
          ["Featured entries", dashboard.metrics.activeFeaturedEntries, Clapperboard],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#151515_0%,#0d0d0d_100%)] p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.22em] text-white/40">{label}</p>
              <Icon className="h-5 w-5 text-[#E50914]" />
            </div>
            <p className="mt-5 text-4xl font-black tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          eyebrow="Now trending"
          title="Most watched titles"
          description="Recent viewing data pulled from watch history across the app."
        >
          <div className="space-y-3">
            {(dashboard.topTitles || []).map((item) => (
              <div key={`${item.media_type}-${item.title}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/40">{item.media_type}</p>
                </div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-sm text-white/70">{item.count} plays</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Watch activity"
          title="Recent member sessions"
          description="A read-only operational feed of the latest watch events."
        >
          <div className="space-y-3">
            {(dashboard.recentActivity || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-white/45">User {item.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#E50914]">{item.media_type}</p>
                    <p className="mt-1 text-xs text-white/45">{item.progress_percent || 0}% complete</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function ContentSection({
  searching,
  saving,
  searchQuery,
  searchResults,
  contentDraft,
  siteSettingsForm,
  featuredEntries,
  onSearchQueryChange,
  onSearch,
  onSelectResult,
  onDraftChange,
  onSave,
  onReset,
  onEdit,
  onToggle,
  onDelete,
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Panel
        eyebrow="Curation Studio"
        title="Program the homepage"
        description="Search TMDB titles, choose where they appear, and control which audience sees them."
      >
        <form onSubmit={onSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search TMDB for a movie or show"
            className="admin-input min-h-12 flex-1"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#E50914] px-4 text-sm font-semibold text-white hover:bg-[#c40812]"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {searchResults.map((item) => (
              <button
                key={`${item.media_type}-${item.id}`}
                type="button"
                onClick={() => onSelectResult(item)}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 text-left hover:border-[#E50914]/40 hover:bg-white/[0.04]"
              >
                <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#111]">
                  {item.poster_path ? (
                    <img src={tmdbW185(item.poster_path)} alt={item.title || item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/35">No art</div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{item.title || item.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/40">{item.media_type}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Selected title">
              <input
                value={contentDraft.title}
                onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="TMDB ID">
              <input
                value={contentDraft.tmdb_id}
                onChange={(event) => onDraftChange((current) => ({ ...current, tmdb_id: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Media type">
              <select
                value={contentDraft.media_type}
                onChange={(event) => onDraftChange((current) => ({ ...current, media_type: event.target.value }))}
                className="admin-input"
              >
                <option value="movie">Movie</option>
                <option value="tv">TV</option>
              </select>
            </Field>
            <Field label="Placement">
              <select
                value={contentDraft.entry_type}
                onChange={(event) => onDraftChange((current) => ({ ...current, entry_type: event.target.value }))}
                className="admin-input"
              >
                <option value="hero">Hero</option>
                <option value="row">Row</option>
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={contentDraft.audience}
                onChange={(event) => onDraftChange((current) => ({ ...current, audience: event.target.value }))}
                className="admin-input"
              >
                {audiences.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Row title">
              <input
                value={contentDraft.group_name}
                onChange={(event) => onDraftChange((current) => ({ ...current, group_name: event.target.value }))}
                placeholder="Used when placement is Row"
                className="admin-input"
              />
            </Field>
            <Field label="Badge text">
              <input
                value={contentDraft.badge_text}
                onChange={(event) => onDraftChange((current) => ({ ...current, badge_text: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={contentDraft.sort_order}
                onChange={(event) => onDraftChange((current) => ({ ...current, sort_order: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Starts at">
              <input
                type="datetime-local"
                value={contentDraft.starts_at}
                onChange={(event) => onDraftChange((current) => ({ ...current, starts_at: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Ends at">
              <input
                type="datetime-local"
                value={contentDraft.ends_at}
                onChange={(event) => onDraftChange((current) => ({ ...current, ends_at: event.target.value }))}
                className="admin-input"
              />
            </Field>
          </div>

          <Field label="Overview">
            <textarea
              value={contentDraft.overview}
              onChange={(event) => onDraftChange((current) => ({ ...current, overview: event.target.value }))}
              rows={4}
              className="admin-input resize-none"
            />
          </Field>

          <p className="text-xs uppercase tracking-[0.22em] text-white/35">
            Default row title: {siteSettingsForm.home_curated_row_title || "Staff Picks"}
          </p>

          <label className="inline-flex items-center gap-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={contentDraft.is_active}
              onChange={(event) => onDraftChange((current) => ({ ...current, is_active: event.target.checked }))}
              className="h-4 w-4 accent-[#E50914]"
            />
            Make this homepage entry active immediately
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c40812]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {contentDraft.id ? "Update Entry" : "Create Entry"}
            </button>
            <button type="button" onClick={onReset} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]">
              Clear Form
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        eyebrow="Live queue"
        title="Featured entries"
        description="Everything currently scheduled for homepage heroes and curated rails."
      >
        <div className="space-y-3">
          {featuredEntries.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/40">
                    {item.entry_type} · {item.audience} {item.group_name ? `· ${item.group_name}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    Starts {formatDate(item.starts_at)} · Ends {formatDate(item.ends_at)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active === false ? "bg-white/[0.06] text-white/45" : "bg-[#E50914]/15 text-[#ff7e86]"}`}>
                  {item.is_active === false ? "Paused" : "Live"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(item)} className="admin-action">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={() => onToggle(item)} className="admin-action">
                  <Sparkles className="h-4 w-4" />
                  {item.is_active === false ? "Activate" : "Pause"}
                </button>
                <button type="button" onClick={() => onDelete(item.id)} className="admin-action text-[#ff9ba2]">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function NotificationsSection({
  saving,
  notificationDraft,
  notifications,
  onDraftChange,
  onSave,
  onReset,
  onEdit,
  onSendNow,
  onToggle,
  onDelete,
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel
        eyebrow="Announcement Composer"
        title="Program the notification feed"
        description="Create app updates, editorial notices, and system announcements that appear in the member bell."
      >
        <form onSubmit={onSave} className="space-y-4">
          <Field label="Title">
            <input
              value={notificationDraft.title}
              onChange={(event) => onDraftChange((current) => ({ ...current, title: event.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Body">
            <textarea
              value={notificationDraft.body}
              onChange={(event) => onDraftChange((current) => ({ ...current, body: event.target.value }))}
              rows={4}
              className="admin-input resize-none"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Type">
              <select
                value={notificationDraft.notification_type}
                onChange={(event) => onDraftChange((current) => ({ ...current, notification_type: event.target.value }))}
                className="admin-input"
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={notificationDraft.audience}
                onChange={(event) => onDraftChange((current) => ({ ...current, audience: event.target.value }))}
                className="admin-input"
              >
                {audiences.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Publish at">
              <input
                type="datetime-local"
                value={notificationDraft.publish_at}
                onChange={(event) => onDraftChange((current) => ({ ...current, publish_at: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="End at">
              <input
                type="datetime-local"
                value={notificationDraft.ends_at}
                onChange={(event) => onDraftChange((current) => ({ ...current, ends_at: event.target.value }))}
                className="admin-input"
              />
            </Field>
          </div>

          <label className="inline-flex items-center gap-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={notificationDraft.is_active}
              onChange={(event) => onDraftChange((current) => ({ ...current, is_active: event.target.checked }))}
              className="h-4 w-4 accent-[#E50914]"
            />
            Publish this announcement
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/65">
            Use `Send To Users Now` for an immediate in-app alert. Members with browser notifications enabled will receive it the next time the app refreshes or regains focus.
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c40812]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {notificationDraft.id ? "Update Notification" : "Create Notification"}
            </button>
            <button
              type="button"
              onClick={onSendNow}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E50914]/35 bg-[#E50914]/12 px-5 py-3 text-sm font-semibold text-white hover:bg-[#E50914]/18"
            >
              <BellRing className="h-4 w-4" />
              Send To Users Now
            </button>
            <button type="button" onClick={onReset} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]">
              Reset
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        eyebrow="Live feed"
        title="Scheduled announcements"
        description="These items merge into the member notification center alongside TMDB-driven release alerts."
      >
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-white/65">{item.body}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/35">
                    {item.notification_type || item.type} · {item.audience || "global"} · {formatDate(item.publish_at || item.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active === false ? "bg-white/[0.06] text-white/45" : "bg-[#E50914]/15 text-[#ff7e86]"}`}>
                  {item.is_active === false ? "Paused" : "Live"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(item)} className="admin-action">
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button type="button" onClick={() => onToggle(item)} className="admin-action">
                  <BellRing className="h-4 w-4" />
                  {item.is_active === false ? "Activate" : "Pause"}
                </button>
                <button type="button" onClick={() => onDelete(item.id)} className="admin-action text-[#ff9ba2]">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function UsersSection({ userSummaryRows }) {
  return (
    <Panel
      eyebrow="Read-only analytics"
      title="User and profile oversight"
      description="This v1 panel is observational only. It surfaces usage and profile counts without directly mutating accounts."
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
        <div className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.7fr_1fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/40">
          <span>User</span>
          <span>Profiles</span>
          <span>Watchlist</span>
          <span>History</span>
          <span>Last activity</span>
        </div>
        <div className="divide-y divide-white/8">
          {userSummaryRows.map((item) => (
            <div key={item.userId} className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-4 text-sm text-white/75">
              <span className="truncate font-medium text-white">{item.userId}</span>
              <span>{item.profiles}</span>
              <span>{item.watchlistItems}</span>
              <span>{item.historyItems}</span>
              <span>{formatDate(item.lastActivity)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function SettingsSection({ saving, siteSettingsForm, onChange, onSave }) {
  return (
    <Panel
      eyebrow="Global controls"
      title="Site-wide settings"
      description="These values are stored as shared admin settings and are consumed by the landing page, homepage, and notification center."
    >
      <form onSubmit={onSave} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Homepage curation mode">
            <select
              value={siteSettingsForm.home_curation_mode}
              onChange={(event) => onChange((current) => ({ ...current, home_curation_mode: event.target.value }))}
              className="admin-input"
            >
              <option value="hybrid">Hybrid</option>
              <option value="curated">Curated only</option>
            </select>
          </Field>
          <Field label="Curated row title">
            <input
              value={siteSettingsForm.home_curated_row_title}
              onChange={(event) => onChange((current) => ({ ...current, home_curated_row_title: event.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Notification center title">
            <input
              value={siteSettingsForm.notification_center_title}
              onChange={(event) => onChange((current) => ({ ...current, notification_center_title: event.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Notification center subtitle">
            <input
              value={siteSettingsForm.notification_center_subtitle}
              onChange={(event) => onChange((current) => ({ ...current, notification_center_subtitle: event.target.value }))}
              className="admin-input"
            />
          </Field>
        </div>

        <div className="rounded-[1.5rem] border border-[#E50914]/18 bg-[#E50914]/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff7d85]">Update Mode</p>
          <label className="mt-4 inline-flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={String(siteSettingsForm.update_mode_enabled).toLowerCase() === "true"}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  update_mode_enabled: event.target.checked ? "true" : "false",
                }))
              }
              className="h-4 w-4 accent-[#E50914]"
            />
            Put the site into update mode for non-admin users
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Update mode title">
              <input
                value={siteSettingsForm.update_mode_title}
                onChange={(event) => onChange((current) => ({ ...current, update_mode_title: event.target.value }))}
                className="admin-input"
              />
            </Field>
            <Field label="Update mode message">
              <textarea
                value={siteSettingsForm.update_mode_message}
                onChange={(event) => onChange((current) => ({ ...current, update_mode_message: event.target.value }))}
                rows={3}
                className="admin-input resize-none"
              />
            </Field>
          </div>
        </div>

        <Field label="Landing page tagline">
          <textarea
            value={siteSettingsForm.landing_tagline}
            onChange={(event) => onChange((current) => ({ ...current, landing_tagline: event.target.value }))}
            rows={4}
            className="admin-input resize-none"
          />
        </Field>

        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c40812]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Site Settings
        </button>
      </form>
    </Panel>
  );
}
