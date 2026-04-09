import { createClient } from "@supabase/supabase-js";
import { getAuthAdapter, waitForAuthLoaded } from "@/lib/auth-adapter";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseJwtTemplate,
  supabaseUrl,
} from "@/lib/env";

const ENTITY_TABLES = {
  Profile: "profiles",
  WatchHistory: "watch_history",
  Watchlist: "watchlist",
};

const ADMIN_ENTITY_TABLES = {
  AdminNotification: "admin_notifications",
  AdminFeaturedEntry: "admin_featured_entries",
  AdminSiteSetting: "admin_site_settings",
};

const SORT_FIELD_MAP = {
  created_date: "created_at",
  updated_date: "updated_at",
};

const ENTITY_UNIQUE_FIELDS = {
  Profile: ["name", "avatar_color", "avatar_index"],
  WatchHistory: ["tmdb_id", "media_type", "season_number", "episode_number"],
  Watchlist: ["tmdb_id", "media_type"],
  AdminNotification: ["title", "publish_at"],
  AdminFeaturedEntry: ["tmdb_id", "media_type", "entry_type", "group_name", "audience"],
  AdminSiteSetting: ["setting_key"],
};

const isBrowser = typeof window !== "undefined";
const unavailableRemoteTables = new Set();

const createAuthError = () => {
  return Object.assign(new Error("Authentication required"), { status: 401 });
};

const createAdminError = () => {
  return Object.assign(new Error("Admin access required"), { status: 403 });
};

const isMissingRemoteTableError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") && message.includes("does not exist") ||
    details.includes("schema cache")
  );
};

const markTableUnavailableIfMissing = (table, error) => {
  if (table && isMissingRemoteTableError(error)) {
    unavailableRemoteTables.add(table);
  }
};

const getCurrentUser = async () => {
  const state = await waitForAuthLoaded();
  if (!state.user) {
    throw createAuthError();
  }
  return state.user;
};

const getCurrentAdminUser = async () => {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    throw createAdminError();
  }
  return user;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const getStorageKey = (entityName, userId) => `cinestream:${entityName}:${userId}`;
const getAdminStorageKey = (entityName) => `cinestream:admin:${entityName}`;

const readLocalRows = (entityName, userId) => {
  if (!isBrowser) {
    return [];
  }

  const raw = window.localStorage.getItem(getStorageKey(entityName, userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalRows = (entityName, userId, rows) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(getStorageKey(entityName, userId), JSON.stringify(rows));
};

const readLocalAdminRows = (entityName) => {
  if (!isBrowser) {
    return [];
  }

  const raw = window.localStorage.getItem(getAdminStorageKey(entityName));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalAdminRows = (entityName, rows) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(getAdminStorageKey(entityName), JSON.stringify(rows));
};

const createLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizeSort = (sort) => {
  const sortKey = typeof sort === "string" ? sort : "-created_date";
  const desc = sortKey.startsWith("-");
  const rawField = sortKey.replace(/^-/, "");

  return {
    ascending: !desc,
    field: SORT_FIELD_MAP[rawField] || rawField,
  };
};

const sortLocalRows = (rows, sort) => {
  const { ascending, field } = normalizeSort(sort);
  const sorted = [...rows].sort((a, b) => {
    const aValue = a[field] ?? "";
    const bValue = b[field] ?? "";

    if (aValue === bValue) {
      return 0;
    }

    return aValue > bValue ? 1 : -1;
  });

  return ascending ? sorted : sorted.reverse();
};

const filterLocalRows = (rows, filters = {}) =>
  rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      if (key === "created_by") {
        return true;
      }

      return row[key] === value;
    })
  );

const getEntitySignature = (entityName, row) => {
  const uniqueFields = ENTITY_UNIQUE_FIELDS[entityName] || ["id"];
  return uniqueFields.map((field) => String(row?.[field] ?? "")).join("::");
};

const mergeEntityRows = (entityName, remoteRows = [], localRows = []) => {
  const merged = new Map();

  [...localRows, ...remoteRows].forEach((row) => {
    if (!row) {
      return;
    }

    const idKey = row.id ? `id:${row.id}` : null;
    const signatureKey = `sig:${getEntitySignature(entityName, row)}`;

    if (idKey && merged.has(idKey)) {
      merged.set(idKey, { ...merged.get(idKey), ...row });
      return;
    }

    if (merged.has(signatureKey)) {
      const existing = merged.get(signatureKey);
      const nextRow = { ...existing, ...row };
      if (idKey) {
        merged.delete(signatureKey);
        merged.set(idKey, nextRow);
      } else {
        merged.set(signatureKey, nextRow);
      }
      return;
    }

    merged.set(idKey || signatureKey, row);
  });

  return [...merged.values()];
};

const createSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      fetch: async (url, options = {}) => {
        const headers = new Headers(options.headers);
        const getToken = getAuthAdapter().getToken;
        const token = getToken
          ? await getToken({ template: supabaseJwtTemplate }).catch(() => null)
          : null;

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
};

const canUseRemoteTable = (table) =>
  Boolean(table && isSupabaseConfigured && !unavailableRemoteTables.has(table));

const createEntityClient = (entityName) => {
  const table = ENTITY_TABLES[entityName];

  return {
    async list(sort = "-created_date", limit = 100) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);

      if (!canUseRemoteTable(table)) {
        return sortLocalRows(localRows, sort).slice(0, limit);
      }

      try {
        const client = createSupabaseClient();
        const { ascending, field } = normalizeSort(sort);
        const { data, error } = await client
          .from(table)
          .select("*")
          .eq("user_id", user.id)
          .order(field, { ascending })
          .limit(limit);

        if (error) {
          throw error;
        }

        const mergedRows = mergeEntityRows(entityName, data || [], localRows);
        writeLocalRows(entityName, user.id, mergedRows);
        return sortLocalRows(mergedRows, sort).slice(0, limit);
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        return sortLocalRows(localRows, sort).slice(0, limit);
      }
    },

    async filter(filters = {}) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);

      if (!canUseRemoteTable(table)) {
        return filterLocalRows(localRows, filters);
      }

      try {
        const client = createSupabaseClient();
        let query = client.from(table).select("*").eq("user_id", user.id);

        Object.entries(filters).forEach(([key, value]) => {
          if (key === "created_by") {
            return;
          }

          query = query.eq(key, value);
        });

        const { data, error } = await query;
        if (error) {
          throw error;
        }

        const filteredLocalRows = filterLocalRows(localRows, filters);
        const mergedRows = mergeEntityRows(entityName, data || [], filteredLocalRows);
        writeLocalRows(entityName, user.id, mergeEntityRows(entityName, data || [], localRows));
        return mergedRows;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        return filterLocalRows(localRows, filters);
      }
    },

    async create(payload) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);
      const now = new Date().toISOString();
      const record = {
        ...clone(payload),
        created_at: now,
        created_by: user.email,
        updated_at: now,
        user_id: user.id,
      };

      if (!canUseRemoteTable(table)) {
        const localRecord = { id: createLocalId(), ...record };
        writeLocalRows(entityName, user.id, mergeEntityRows(entityName, [localRecord], localRows));
        return localRecord;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(table)
          .insert(record)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        writeLocalRows(entityName, user.id, mergeEntityRows(entityName, [data], localRows));
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const localRecord = { id: createLocalId(), ...record };
        writeLocalRows(entityName, user.id, mergeEntityRows(entityName, [localRecord], localRows));
        return localRecord;
      }
    },

    async update(id, payload) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);
      const changes = {
        ...clone(payload),
        updated_at: new Date().toISOString(),
      };

      if (!canUseRemoteTable(table)) {
        const updatedRows = localRows.map((row) =>
          row.id === id ? { ...row, ...changes } : row
        );
        writeLocalRows(entityName, user.id, updatedRows);
        return updatedRows.find((row) => row.id === id) || null;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(table)
          .update(changes)
          .eq("id", id)
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        const updatedRows = localRows.map((row) => (row.id === id ? data : row));
        writeLocalRows(entityName, user.id, updatedRows);
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const updatedRows = localRows.map((row) =>
          row.id === id ? { ...row, ...changes } : row
        );
        writeLocalRows(entityName, user.id, updatedRows);
        return updatedRows.find((row) => row.id === id) || null;
      }
    },

    async delete(id) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);
      const updatedRows = localRows.filter((row) => row.id !== id);

      if (!canUseRemoteTable(table)) {
        writeLocalRows(entityName, user.id, updatedRows);
        return true;
      }

      try {
        const client = createSupabaseClient();
        const { error } = await client
          .from(table)
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        writeLocalRows(entityName, user.id, updatedRows);
        return true;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        writeLocalRows(entityName, user.id, updatedRows);
        return true;
      }
    },
  };
};

const createAdminEntityClient = (entityName) => {
  const table = ADMIN_ENTITY_TABLES[entityName];

  return {
    async list(sort = "-updated_at", limit = 100) {
      await getCurrentAdminUser();
      const localRows = readLocalAdminRows(entityName);

      if (!canUseRemoteTable(table)) {
        return sortLocalRows(localRows, sort).slice(0, limit);
      }

      try {
        const client = createSupabaseClient();
        const { ascending, field } = normalizeSort(sort);
        const { data, error } = await client
          .from(table)
          .select("*")
          .order(field, { ascending })
          .limit(limit);

        if (error) {
          throw error;
        }

        const mergedRows = mergeEntityRows(entityName, data || [], localRows);
        writeLocalAdminRows(entityName, mergedRows);
        return sortLocalRows(mergedRows, sort).slice(0, limit);
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        return sortLocalRows(localRows, sort).slice(0, limit);
      }
    },

    async filter(filters = {}) {
      await getCurrentAdminUser();
      const localRows = readLocalAdminRows(entityName);

      if (!canUseRemoteTable(table)) {
        return filterLocalRows(localRows, filters);
      }

      try {
        const client = createSupabaseClient();
        let query = client.from(table).select("*");

        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data, error } = await query;
        if (error) {
          throw error;
        }

        const filteredLocalRows = filterLocalRows(localRows, filters);
        const mergedRows = mergeEntityRows(entityName, data || [], filteredLocalRows);
        writeLocalAdminRows(entityName, mergeEntityRows(entityName, data || [], localRows));
        return mergedRows;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        return filterLocalRows(localRows, filters);
      }
    },

    async create(payload) {
      const user = await getCurrentAdminUser();
      const localRows = readLocalAdminRows(entityName);
      const now = new Date().toISOString();
      const record = {
        ...clone(payload),
        created_at: now,
        created_by: user.email,
        updated_at: now,
      };

      if (!canUseRemoteTable(table)) {
        const localRecord = { id: createLocalId(), ...record };
        writeLocalAdminRows(entityName, mergeEntityRows(entityName, [localRecord], localRows));
        return localRecord;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(table)
          .insert(record)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        writeLocalAdminRows(entityName, mergeEntityRows(entityName, [data], localRows));
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const localRecord = { id: createLocalId(), ...record };
        writeLocalAdminRows(entityName, mergeEntityRows(entityName, [localRecord], localRows));
        return localRecord;
      }
    },

    async update(id, payload) {
      await getCurrentAdminUser();
      const localRows = readLocalAdminRows(entityName);
      const changes = {
        ...clone(payload),
        updated_at: new Date().toISOString(),
      };

      if (!canUseRemoteTable(table)) {
        const updatedRows = localRows.map((row) =>
          row.id === id ? { ...row, ...changes } : row
        );
        writeLocalAdminRows(entityName, updatedRows);
        return updatedRows.find((row) => row.id === id) || null;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(table)
          .update(changes)
          .eq("id", id)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        const updatedRows = localRows.map((row) => (row.id === id ? data : row));
        writeLocalAdminRows(entityName, updatedRows);
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const updatedRows = localRows.map((row) =>
          row.id === id ? { ...row, ...changes } : row
        );
        writeLocalAdminRows(entityName, updatedRows);
        return updatedRows.find((row) => row.id === id) || null;
      }
    },

    async delete(id) {
      await getCurrentAdminUser();
      const localRows = readLocalAdminRows(entityName);
      const updatedRows = localRows.filter((row) => row.id !== id);

      if (!canUseRemoteTable(table)) {
        writeLocalAdminRows(entityName, updatedRows);
        return true;
      }

      try {
        const client = createSupabaseClient();
        const { error } = await client.from(table).delete().eq("id", id);

        if (error) {
          throw error;
        }

        writeLocalAdminRows(entityName, updatedRows);
        return true;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        writeLocalAdminRows(entityName, updatedRows);
        return true;
      }
    },
  };
};

const getAdminDashboardData = async () => {
  await getCurrentAdminUser();
  if (!isSupabaseConfigured) {
    return {
      metrics: {
        totalUsers: 0,
        totalProfiles: 0,
        totalWatchlistItems: 0,
        totalHistoryEvents: 0,
        activeAnnouncements: readLocalAdminRows("AdminNotification").filter((row) => row.is_active !== false).length,
        activeFeaturedEntries: readLocalAdminRows("AdminFeaturedEntry").filter((row) => row.is_active !== false).length,
      },
      topTitles: [],
      recentActivity: [],
      userSummaries: [],
    };
  }

  const client = createSupabaseClient();
  const safeSelectAll = async (table) => {
    if (!canUseRemoteTable(table)) {
      return [];
    }

    const { data, error } = await client.from(table).select("*");
    if (error) {
      markTableUnavailableIfMissing(table, error);
      if (isMissingRemoteTableError(error)) {
        return [];
      }
      throw error;
    }

    return data || [];
  };

  const [profiles, watchlist, history, notifications, featured] = await Promise.all([
    safeSelectAll("profiles"),
    safeSelectAll("watchlist"),
    safeSelectAll("watch_history"),
    safeSelectAll("admin_notifications"),
    safeSelectAll("admin_featured_entries"),
  ]);

  const userIds = new Set([
    ...profiles.map((row) => row.user_id),
    ...watchlist.map((row) => row.user_id),
    ...history.map((row) => row.user_id),
  ].filter(Boolean));

  const titleCounts = new Map();
  history.forEach((entry) => {
    const key = `${entry.media_type || "movie"}:${entry.tmdb_id || entry.title}`;
    const current = titleCounts.get(key) || {
      title: entry.title,
      media_type: entry.media_type,
      count: 0,
    };
    current.count += 1;
    titleCounts.set(key, current);
  });

  const userSummariesMap = new Map();
  const ensureUserSummary = (userId) => {
    if (!userSummariesMap.has(userId)) {
      userSummariesMap.set(userId, {
        userId,
        profiles: 0,
        watchlistItems: 0,
        historyItems: 0,
        lastActivity: null,
      });
    }
    return userSummariesMap.get(userId);
  };

  profiles.forEach((row) => {
    const summary = ensureUserSummary(row.user_id);
    summary.profiles += 1;
    summary.lastActivity =
      !summary.lastActivity || String(row.updated_at).localeCompare(String(summary.lastActivity)) > 0
        ? row.updated_at
        : summary.lastActivity;
  });
  watchlist.forEach((row) => {
    const summary = ensureUserSummary(row.user_id);
    summary.watchlistItems += 1;
    summary.lastActivity =
      !summary.lastActivity || String(row.updated_at).localeCompare(String(summary.lastActivity)) > 0
        ? row.updated_at
        : summary.lastActivity;
  });
  history.forEach((row) => {
    const summary = ensureUserSummary(row.user_id);
    summary.historyItems += 1;
    summary.lastActivity =
      !summary.lastActivity || String(row.updated_at).localeCompare(String(summary.lastActivity)) > 0
        ? row.updated_at
        : summary.lastActivity;
  });

  const recentActivity = [...history]
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      title: entry.title,
      media_type: entry.media_type,
      updated_at: entry.updated_at,
      progress_percent: entry.progress_percent,
    }));

  return {
    metrics: {
      totalUsers: userIds.size,
      totalProfiles: profiles.length,
      totalWatchlistItems: watchlist.length,
      totalHistoryEvents: history.length,
      activeAnnouncements: notifications.filter((row) => row.is_active !== false).length,
      activeFeaturedEntries: featured.filter((row) => row.is_active !== false).length,
    },
    topTitles: [...titleCounts.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    recentActivity,
    userSummaries: [...userSummariesMap.values()].sort((a, b) =>
      String(b.lastActivity || "").localeCompare(String(a.lastActivity || ""))
    ),
  };
};

export const base44 = {
  auth: {
    async me() {
      return getCurrentUser();
    },
    async logout(redirectUrl = window.location.origin) {
      return getAuthAdapter().signOut?.(redirectUrl);
    },
    redirectToLogin(redirectUrl = window.location.href) {
      return getAuthAdapter().openSignIn?.(redirectUrl);
    },
  },
  entities: {
    Profile: createEntityClient("Profile"),
    WatchHistory: createEntityClient("WatchHistory"),
    Watchlist: createEntityClient("Watchlist"),
  },
  admin: {
    getDashboardData: getAdminDashboardData,
    entities: {
      AdminNotification: createAdminEntityClient("AdminNotification"),
      AdminFeaturedEntry: createAdminEntityClient("AdminFeaturedEntry"),
      AdminSiteSetting: createAdminEntityClient("AdminSiteSetting"),
    },
  },
};
