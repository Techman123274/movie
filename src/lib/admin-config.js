import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

const DEFAULT_SITE_SETTINGS = {
  home_curation_mode: "hybrid",
  home_curated_row_title: "Staff Picks",
  notification_center_title: "Notifications",
  notification_center_subtitle: "New releases, trending drops, and updates",
  update_mode_enabled: "false",
  update_mode_title: "Subflix is updating",
  update_mode_message:
    "We are rolling out a fresh update right now. Please check back in a few minutes.",
  landing_tagline:
    "Big premieres, comfort rewatches, kids picks, and smarter recommendations in one premium streaming experience.",
};

const DEFAULT_ADMIN_NOTIFICATIONS = [
  {
    id: "app-update-settings",
    title: "Subflix update",
    body: "Kids profiles, maturity controls, and release alerts are now available.",
    type: "update",
    audience: "global",
    created_at: "2026-04-09T00:00:00.000Z",
  },
  {
    id: "app-update-support-center",
    title: "Support pages are live",
    body: "FAQ, Help Center, Privacy, Legal Notices, Contact Us, and Speed Test are now available in the footer.",
    type: "update",
    audience: "global",
    created_at: "2026-04-10T00:00:00.000Z",
  },
];

const ENTITY_NAMES = {
  notifications: "AdminNotification",
  featured: "AdminFeaturedEntry",
  settings: "AdminSiteSetting",
};

const isBrowser = typeof window !== "undefined";

const getLocalAdminKey = (entityName) => `cinestream:admin:${entityName}`;

const readLocalAdminRows = (entityName) => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getLocalAdminKey(entityName));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const createPublicClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
};

const isLiveWindow = (startsAt, endsAt) => {
  const now = Date.now();
  if (startsAt && new Date(startsAt).getTime() > now) {
    return false;
  }
  if (endsAt && new Date(endsAt).getTime() < now) {
    return false;
  }
  return true;
};

const matchesAudience = (audience, profile) => {
  if (!audience || audience === "global") {
    return true;
  }

  if (audience === "kids") {
    return Boolean(profile?.is_kids);
  }

  if (audience === "standard") {
    return !profile?.is_kids;
  }

  return true;
};

const readSupabaseRows = async (table, orderField = "updated_at") => {
  const client = createPublicClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client.from(table).select("*").order(orderField, { ascending: false });
  if (error) {
    throw error;
  }

  return data || [];
};

export const getDefaultSiteSettings = () => ({ ...DEFAULT_SITE_SETTINGS });

export const fetchPublicSiteSettings = async () => {
  const fallbackRows = readLocalAdminRows(ENTITY_NAMES.settings);
  let rows = [];

  try {
    rows = await readSupabaseRows("admin_site_settings");
  } catch {
    rows = fallbackRows;
  }

  const nextSettings = { ...DEFAULT_SITE_SETTINGS };
  (rows || [])
    .filter((row) => row?.is_public !== false)
    .forEach((row) => {
      if (!row?.setting_key) {
        return;
      }
      nextSettings[row.setting_key] = row.setting_value ?? "";
    });

  return nextSettings;
};

export const fetchPublicAdminNotifications = async (profile) => {
  const fallbackRows = readLocalAdminRows(ENTITY_NAMES.notifications);
  let rows = [];

  try {
    rows = await readSupabaseRows("admin_notifications", "publish_at");
  } catch {
    rows = fallbackRows;
  }

  const liveRows = (rows || []).filter(
    (row) =>
      row?.is_active !== false &&
      matchesAudience(row?.audience, profile) &&
      isLiveWindow(row?.publish_at || row?.created_at, row?.ends_at)
  );

  if (!liveRows.length) {
    return DEFAULT_ADMIN_NOTIFICATIONS.filter((row) => matchesAudience(row.audience, profile));
  }

  return liveRows
    .map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.notification_type || row.type || "update",
      audience: row.audience || "global",
      created_at: row.publish_at || row.created_at || new Date().toISOString(),
      media_type: row.media_type || null,
      tmdb_id: row.tmdb_id || null,
    }))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
};

export const fetchPublicFeaturedEntries = async (profile) => {
  const fallbackRows = readLocalAdminRows(ENTITY_NAMES.featured);
  let rows = [];

  try {
    rows = await readSupabaseRows("admin_featured_entries");
  } catch {
    rows = fallbackRows;
  }

  return (rows || [])
    .filter(
      (row) =>
        row?.is_active !== false &&
        matchesAudience(row?.audience, profile) &&
        isLiveWindow(row?.starts_at, row?.ends_at)
    )
    .sort((a, b) => {
      const sortDiff = Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
      if (sortDiff !== 0) {
        return sortDiff;
      }

      return String(b?.updated_at || "").localeCompare(String(a?.updated_at || ""));
    });
};

export const entryToMediaItem = (entry) => ({
  id: entry.tmdb_id,
  tmdb_id: entry.tmdb_id,
  title: entry.title,
  name: entry.title,
  media_type: entry.media_type,
  poster_path: entry.poster_path,
  backdrop_path: entry.backdrop_path,
  overview: entry.overview,
  release_date: entry.release_date,
  first_air_date: entry.media_type === "tv" ? entry.release_date : undefined,
  vote_average: entry.vote_average,
  genre_ids: entry.genre_ids || [],
});

export const buildCuratedHomeState = (entries, defaultRowTitle = DEFAULT_SITE_SETTINGS.home_curated_row_title) => {
  const heroItems = [];
  const rowMap = new Map();

  (entries || []).forEach((entry) => {
    const item = entryToMediaItem(entry);
    if (entry.entry_type === "hero") {
      heroItems.push(item);
      return;
    }

    const groupName = entry.group_name || defaultRowTitle;
    if (!rowMap.has(groupName)) {
      rowMap.set(groupName, []);
    }
    rowMap.get(groupName).push(item);
  });

  const rows = [...rowMap.entries()].map(([title, items]) => ({
    title,
    items,
  }));

  return {
    heroItems,
    rows,
  };
};
