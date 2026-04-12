import { createClient } from "@supabase/supabase-js";
import { getAuthAdapter, waitForAuthLoaded } from "@/lib/auth-adapter";
import {
  isSupabaseConfigured,
  profileAvatarStorageBucket,
  supabaseAnonKey,
  supabaseJwtTemplate,
  supabaseUrl,
} from "@/lib/env";

const ENTITY_TABLES = {
  Profile: "profiles",
  WatchHistory: "watch_history",
  Watchlist: "watchlist",
  Rating: "ratings",
  Friendship: "friendships",
  SocialActivity: "social_activity",
  Comment: "comments",
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

const USER_PREFERENCES_TABLE = "user_preferences";
const PROFILE_AVATAR_ASSETS_TABLE = "profile_avatar_assets";
const FRIEND_REQUESTS_TABLE = "friend_requests";
const USER_PRESENCE_TABLE = "user_presence";
const CHAT_THREADS_TABLE = "chat_threads";
const CHAT_THREAD_MEMBERS_TABLE = "chat_thread_members";
const CHAT_MESSAGES_TABLE = "chat_messages";

const ENTITY_UNIQUE_FIELDS = {
  Profile: ["name", "avatar_color", "avatar_index"],
  WatchHistory: ["tmdb_id", "media_type", "season_number", "episode_number"],
  Watchlist: ["tmdb_id", "media_type"],
  Rating: ["tmdb_id", "media_type", "profile_id"],
  Friendship: ["friend_email"],
  SocialActivity: ["id"],
  Comment: ["id"],
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
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildPairKey = (emailA, emailB) => {
  const left = normalizeEmail(emailA);
  const right = normalizeEmail(emailB);
  if (!left || !right) {
    return "";
  }
  return left < right ? `${left}::${right}` : `${right}::${left}`;
};

const getStorageKey = (entityName, userId) => `cinestream:${entityName}:${userId}`;
const getAdminStorageKey = (entityName) => `cinestream:admin:${entityName}`;
const getSharedStorageKey = (entityName) => `cinestream:shared:${entityName}`;
const getAccountStorageKey = (namespace, userId) => `cinestream:account:${namespace}:${userId}`;

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

const readSharedRows = (entityName) => {
  if (!isBrowser) {
    return [];
  }

  const raw = window.localStorage.getItem(getSharedStorageKey(entityName));
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

const writeSharedRows = (entityName, rows) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(getSharedStorageKey(entityName), JSON.stringify(rows));
};

const readLocalAccountValue = (namespace, userId, fallback) => {
  if (!isBrowser) {
    return fallback;
  }

  const raw = window.localStorage.getItem(getAccountStorageKey(namespace, userId));
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeLocalAccountValue = (namespace, userId, value) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(getAccountStorageKey(namespace, userId), JSON.stringify(value));
};

const isSharedMirrorEntity = (entityName) =>
  entityName === "SocialActivity" || entityName === "Rating" || entityName === "Comment";

const createLocalId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const sanitizeFileName = (value) =>
  String(value || "avatar")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "avatar";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!isBrowser || typeof FileReader === "undefined") {
      reject(new Error("File uploads are not supported in this environment."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsDataURL(file);
  });

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

const mergeSharedEntityRows = (entityName, rows = []) => {
  if (!isSharedMirrorEntity(entityName) || rows.length === 0) {
    return;
  }

  writeSharedRows(
    entityName,
    mergeEntityRows(entityName, rows, readSharedRows(entityName))
  );
};

const removeSharedEntityRow = (entityName, id) => {
  if (!isSharedMirrorEntity(entityName)) {
    return;
  }

  writeSharedRows(
    entityName,
    readSharedRows(entityName).filter((row) => row.id !== id)
  );
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

const readLocalTheme = (userId) => {
  const stored = readLocalAccountValue("preferences", userId, {});
  return stored?.app_theme === "hulu" ? "hulu" : "netflix";
};

const writeLocalTheme = (userId, appTheme) => {
  const existing = readLocalAccountValue("preferences", userId, {});
  writeLocalAccountValue("preferences", userId, {
    ...existing,
    app_theme: appTheme === "hulu" ? "hulu" : "netflix",
    updated_at: new Date().toISOString(),
  });
};

const readLocalPresenceVisibility = (userId) => {
  const stored = readLocalAccountValue("preferences", userId, {});
  const value = String(stored?.presence_visibility || "").trim().toLowerCase();
  if (value === "friends" || value === "off" || value === "public") {
    return value;
  }
  return "public";
};

const writeLocalPresenceVisibility = (userId, presenceVisibility) => {
  const existing = readLocalAccountValue("preferences", userId, {});
  const nextValue = presenceVisibility === "friends" || presenceVisibility === "off" ? presenceVisibility : "public";
  writeLocalAccountValue("preferences", userId, {
    ...existing,
    presence_visibility: nextValue,
    updated_at: new Date().toISOString(),
  });
};

const readLocalAvatarAssets = (userId) =>
  readLocalAccountValue("avatar-assets", userId, []);

const writeLocalAvatarAssets = (userId, rows) => {
  writeLocalAccountValue("avatar-assets", userId, rows);
};

const mergeAvatarAssetRows = (remoteRows = [], localRows = []) => {
  const merged = new Map();

  [...localRows, ...remoteRows].forEach((row) => {
    if (!row?.id) {
      return;
    }

    merged.set(row.id, {
      ...merged.get(row.id),
      ...row,
      asset_kind: row.asset_kind || "upload",
      is_active: row.is_active !== false,
    });
  });

  return [...merged.values()];
};

const createRemoteProfileAvatarRow = async ({ user, file, label }) => {
  const client = createSupabaseClient();
  const extension = (file?.name?.split(".").pop() || "jpg").toLowerCase();
  const safeName = sanitizeFileName(file?.name || "avatar");
  const storagePath = `users/${user.id}/${Date.now()}-${safeName}.${extension}`;

  const { error: uploadError } = await client
    .storage
    .from(profileAvatarStorageBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file?.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = client
    .storage
    .from(profileAvatarStorageBucket)
    .getPublicUrl(storagePath);

  const record = {
    user_id: user.id,
    asset_kind: "upload",
    storage_path: storagePath,
    public_url: publicData?.publicUrl || null,
    label: label || file?.name || "Uploaded avatar",
    is_active: true,
  };

  const { data, error } = await client
    .from(PROFILE_AVATAR_ASSETS_TABLE)
    .insert(record)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const createLocalProfileAvatarRow = async ({ user, file, label }) => ({
  id: createLocalId(),
  user_id: user.id,
  asset_kind: "upload",
  storage_path: `local/users/${user.id}/${Date.now()}-${sanitizeFileName(file?.name || "avatar")}`,
  public_url: await readFileAsDataUrl(file),
  label: label || file?.name || "Uploaded avatar",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

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
        mergeSharedEntityRows(entityName, data || []);
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
        mergeSharedEntityRows(entityName, data || []);
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
        mergeSharedEntityRows(entityName, [localRecord]);
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
        mergeSharedEntityRows(entityName, [data]);
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const localRecord = { id: createLocalId(), ...record };
        writeLocalRows(entityName, user.id, mergeEntityRows(entityName, [localRecord], localRows));
        mergeSharedEntityRows(entityName, [localRecord]);
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
        const updatedRow = updatedRows.find((row) => row.id === id) || null;
        mergeSharedEntityRows(entityName, updatedRow ? [updatedRow] : []);
        return updatedRow;
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
        mergeSharedEntityRows(entityName, [data]);
        return data;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        const updatedRows = localRows.map((row) =>
          row.id === id ? { ...row, ...changes } : row
        );
        writeLocalRows(entityName, user.id, updatedRows);
        const updatedRow = updatedRows.find((row) => row.id === id) || null;
        mergeSharedEntityRows(entityName, updatedRow ? [updatedRow] : []);
        return updatedRow;
      }
    },

    async delete(id) {
      const user = await getCurrentUser();
      const localRows = readLocalRows(entityName, user.id);
      const updatedRows = localRows.filter((row) => row.id !== id);

      if (!canUseRemoteTable(table)) {
        writeLocalRows(entityName, user.id, updatedRows);
        removeSharedEntityRow(entityName, id);
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
        removeSharedEntityRow(entityName, id);
        return true;
      } catch (error) {
        markTableUnavailableIfMissing(table, error);
        console.warn(`[${entityName}] Falling back to local storage`, error);
        writeLocalRows(entityName, user.id, updatedRows);
        removeSharedEntityRow(entityName, id);
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

const sortByUpdatedDateDesc = (rows = []) =>
  [...rows].sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));

const filterRowsByFields = (rows = [], filters = {}) =>
  rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => row?.[key] === value)
  );

const querySharedEntityRows = async ({ entityName, limit = 40, filters = {}, sort = "-updated_date" } = {}) => {
  const table = ENTITY_TABLES[entityName];

  if (!canUseRemoteTable(table)) {
    return sortLocalRows(filterRowsByFields(readSharedRows(entityName), filters), sort).slice(0, limit);
  }

  try {
    const client = createSupabaseClient();
    const { ascending, field } = normalizeSort(sort);
    let query = client
      .from(table)
      .select("*")
      .order(field, { ascending })
      .limit(limit);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    mergeSharedEntityRows(entityName, data || []);
    return data || [];
  } catch (error) {
    markTableUnavailableIfMissing(table, error);
    console.warn(`[${entityName}] Falling back to shared local storage`, error);
    return sortLocalRows(filterRowsByFields(readSharedRows(entityName), filters), sort).slice(0, limit);
  }
};

const getFriendEmailsForCurrentUser = async () => {
  const user = await getCurrentUser().catch(() => null);
  const normalizedEmail = normalizeEmail(user?.email);

  const legacyFriendships = await createEntityClient("Friendship")
    .list("-updated_date", 100)
    .catch(() => []);

  const legacyEmails = legacyFriendships
    .map((entry) => normalizeEmail(entry.friend_email))
    .filter(Boolean);

  if (!normalizedEmail || !canUseRemoteTable(FRIEND_REQUESTS_TABLE)) {
    return [...new Set(legacyEmails)];
  }

  try {
    const client = createSupabaseClient();
    const { data, error } = await client
      .from(FRIEND_REQUESTS_TABLE)
      .select("*")
      .eq("status", "accepted")
      .or(`requester_email.eq.${normalizedEmail},addressee_email.eq.${normalizedEmail}`)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      throw error;
    }

    const requestEmails = (data || [])
      .map((row) => {
        const requester = normalizeEmail(row.requester_email);
        const addressee = normalizeEmail(row.addressee_email);
        if (!requester || !addressee) {
          return null;
        }
        return requester === normalizedEmail ? addressee : requester;
      })
      .filter(Boolean);

    return [...new Set([...legacyEmails, ...requestEmails])];
  } catch (error) {
    markTableUnavailableIfMissing(FRIEND_REQUESTS_TABLE, error);
    console.warn("[FriendRequests] Falling back to legacy friendships", error);
    return [...new Set(legacyEmails)];
  }
};

const querySocialActivityByEmails = async ({ actorEmails = [], limit = 40, filters = {} } = {}) => {
  if (actorEmails.length === 0) {
    return [];
  }

  const table = ENTITY_TABLES.SocialActivity;

  if (!canUseRemoteTable(table)) {
    return sortByUpdatedDateDesc(
      readSharedRows("SocialActivity").filter((row) => {
        if (!actorEmails.includes(normalizeEmail(row.actor_email))) {
          return false;
        }

        return Object.entries(filters).every(([key, value]) => row?.[key] === value);
      })
    ).slice(0, limit);
  }

  try {
    const client = createSupabaseClient();
    let query = client
      .from(table)
      .select("*")
      .in("actor_email", actorEmails)
      .order("updated_at", { ascending: false })
      .limit(limit);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    mergeSharedEntityRows("SocialActivity", data || []);
    return data || [];
  } catch (error) {
    markTableUnavailableIfMissing(table, error);
    console.warn("[SocialActivity] Falling back to local shared storage", error);
    return sortByUpdatedDateDesc(
      readSharedRows("SocialActivity").filter((row) => {
        if (!actorEmails.includes(normalizeEmail(row.actor_email))) {
          return false;
        }

        return Object.entries(filters).every(([key, value]) => row?.[key] === value);
      })
    ).slice(0, limit);
  }
};

const querySocialActivityAll = async ({ limit = 60, filters = {} } = {}) =>
  querySharedEntityRows({
    entityName: "SocialActivity",
    limit,
    filters,
    sort: "-updated_date",
  });

const logSocialActivity = async (payload = {}) => {
  const user = await getCurrentUser();
  const actorEmail = normalizeEmail(payload.actor_email || user.email);
  const actorName = payload.actor_name || user.full_name || actorEmail || "Subflix Member";
  const actorAvatarUrl = payload.actor_avatar_url || user.image_url || null;
  const client = createEntityClient("SocialActivity");
  const filters = {
    activity_type: payload.activity_type,
    tmdb_id: payload.tmdb_id,
    media_type: payload.media_type,
  };

  if (payload.profile_id) {
    filters.profile_id = payload.profile_id;
  }

  const existingEntries = await client.filter(filters).catch(() => []);
  const existingEntry = existingEntries.find(
    (entry) => normalizeEmail(entry.actor_email) === actorEmail
  );

  const record = {
    ...clone(payload),
    actor_email: actorEmail,
    actor_name: actorName,
    actor_avatar_url: actorAvatarUrl,
  };

  const nextEntry = existingEntry?.id
    ? await client.update(existingEntry.id, record).catch(() => null)
    : await client.create(record).catch(() => null);

  if (nextEntry) {
    mergeSharedEntityRows("SocialActivity", [nextEntry]);
  }

  return nextEntry;
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
    Rating: createEntityClient("Rating"),
    Friendship: createEntityClient("Friendship"),
    SocialActivity: createEntityClient("SocialActivity"),
    Comment: createEntityClient("Comment"),
  },
  social: {
    async logActivity(payload) {
      return logSocialActivity(payload);
    },
    async listFriendActivity(limit = 24) {
      const friendEmails = await getFriendEmailsForCurrentUser();
      return querySocialActivityByEmails({ actorEmails: friendEmails, limit });
    },
    async listTitleFriendActivity(tmdbId, mediaType, limit = 12) {
      const friendEmails = await getFriendEmailsForCurrentUser();
      return querySocialActivityByEmails({
        actorEmails: friendEmails,
        limit,
        filters: {
          tmdb_id: Number(tmdbId),
          media_type: mediaType,
        },
      });
    },
    async listGlobalActivity(limit = 60) {
      return querySocialActivityAll({ limit });
    },
    async listTitleActivity(tmdbId, mediaType, limit = 40) {
      return querySocialActivityAll({
        limit,
        filters: {
          tmdb_id: Number(tmdbId),
          media_type: mediaType,
        },
      });
    },
    async listTitleRatings(tmdbId, mediaType, limit = 40) {
      return querySharedEntityRows({
        entityName: "Rating",
        limit,
        filters: {
          tmdb_id: Number(tmdbId),
          media_type: mediaType,
        },
        sort: "-updated_date",
      });
    },
    async listTitleComments(tmdbId, mediaType, limit = 60) {
      return querySharedEntityRows({
        entityName: "Comment",
        limit,
        filters: {
          tmdb_id: Number(tmdbId),
          media_type: mediaType,
        },
        sort: "-updated_date",
      });
    },
    async listGlobalComments(limit = 60) {
      return querySharedEntityRows({
        entityName: "Comment",
        limit,
        sort: "-updated_date",
      });
    },
  },
  friends: {
    async listRequests(limit = 200) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);

      if (!normalizedEmail || !canUseRemoteTable(FRIEND_REQUESTS_TABLE)) {
        return { incoming: [], outgoing: [], accepted: [] };
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(FRIEND_REQUESTS_TABLE)
          .select("*")
          .or(`requester_email.eq.${normalizedEmail},addressee_email.eq.${normalizedEmail}`)
          .order("updated_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        const rows = data || [];
        const incoming = rows.filter((row) => normalizeEmail(row.addressee_email) === normalizedEmail && row.status === "pending");
        const outgoing = rows.filter((row) => normalizeEmail(row.requester_email) === normalizedEmail && row.status === "pending");
        const accepted = rows.filter((row) => row.status === "accepted");

        return { incoming, outgoing, accepted };
      } catch (error) {
        markTableUnavailableIfMissing(FRIEND_REQUESTS_TABLE, error);
        console.warn("[FriendRequests] listRequests failed", error);
        return { incoming: [], outgoing: [], accepted: [] };
      }
    },
    async sendRequest({ email, name = "" } = {}) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);
      const addresseeEmail = normalizeEmail(email);

      if (!addresseeEmail) {
        throw new Error("A valid email address is required.");
      }

      if (addresseeEmail === normalizedEmail) {
        throw new Error("You cannot add yourself as a friend.");
      }

      if (!canUseRemoteTable(FRIEND_REQUESTS_TABLE)) {
        throw new Error("Friend requests are unavailable (Supabase not configured).");
      }

      const payload = {
        requester_email: normalizedEmail,
        requester_name: String(name || "").trim() || user.full_name || normalizedEmail,
        requester_avatar_url: user.image_url || null,
        addressee_email: addresseeEmail,
        status: "pending",
        updated_at: new Date().toISOString(),
      };

      const client = createSupabaseClient();
      const { data, error } = await client
        .from(FRIEND_REQUESTS_TABLE)
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    async updateRequestStatus({ id, status }) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);
      const nextStatus = String(status || "").trim().toLowerCase();

      if (!id || !nextStatus) {
        throw new Error("Invalid friend request update.");
      }

      if (!canUseRemoteTable(FRIEND_REQUESTS_TABLE)) {
        throw new Error("Friend requests are unavailable (Supabase not configured).");
      }

      const allowed = new Set(["accepted", "declined", "cancelled", "blocked", "removed", "pending"]);
      if (!allowed.has(nextStatus)) {
        throw new Error("Unsupported friend request status.");
      }

      const client = createSupabaseClient();
      const { data, error } = await client
        .from(FRIEND_REQUESTS_TABLE)
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .or(`requester_email.eq.${normalizedEmail},addressee_email.eq.${normalizedEmail}`)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  },
  presence: {
    async upsert(payload = {}) {
      const user = await getCurrentUser();

      if (!canUseRemoteTable(USER_PRESENCE_TABLE)) {
        throw new Error("Presence is unavailable (Supabase not configured).");
      }

      const client = createSupabaseClient();
      const record = {
        user_id: user.id,
        user_email: normalizeEmail(user.email),
        ...payload,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from(USER_PRESENCE_TABLE)
        .upsert(record, { onConflict: "user_id" })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    async listByEmails(emails = [], limit = 200) {
      const safeEmails = [...new Set((emails || []).map(normalizeEmail).filter(Boolean))];
      if (safeEmails.length === 0) {
        return [];
      }

      if (!canUseRemoteTable(USER_PRESENCE_TABLE)) {
        return [];
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(USER_PRESENCE_TABLE)
          .select("*")
          .in("user_email", safeEmails)
          .order("updated_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        markTableUnavailableIfMissing(USER_PRESENCE_TABLE, error);
        console.warn("[Presence] listByEmails failed", error);
        return [];
      }
    },
  },
  chat: {
    async listMyThreads(limit = 80) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);

      if (!normalizedEmail || !canUseRemoteTable(CHAT_THREADS_TABLE) || !canUseRemoteTable(CHAT_THREAD_MEMBERS_TABLE)) {
        return [];
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(CHAT_THREADS_TABLE)
          .select("*, chat_thread_members!inner(member_email, role)")
          .eq("chat_thread_members.member_email", normalizedEmail)
          .order("last_message_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        return (data || []).map((row) => ({
          ...row,
          my_role: row.chat_thread_members?.[0]?.role || "member",
        }));
      } catch (error) {
        markTableUnavailableIfMissing(CHAT_THREADS_TABLE, error);
        console.warn("[Chat] listMyThreads failed", error);
        return [];
      }
    },
    async listThreadMembers(threadId) {
      if (!threadId || !canUseRemoteTable(CHAT_THREAD_MEMBERS_TABLE)) {
        return [];
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(CHAT_THREAD_MEMBERS_TABLE)
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        markTableUnavailableIfMissing(CHAT_THREAD_MEMBERS_TABLE, error);
        console.warn("[Chat] listThreadMembers failed", error);
        return [];
      }
    },
    async listThreadMessages(threadId, limit = 80) {
      if (!threadId || !canUseRemoteTable(CHAT_MESSAGES_TABLE)) {
        return [];
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(CHAT_MESSAGES_TABLE)
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true })
          .limit(limit);

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        markTableUnavailableIfMissing(CHAT_MESSAGES_TABLE, error);
        console.warn("[Chat] listThreadMessages failed", error);
        return [];
      }
    },
    async sendMessage({ threadId, messageText, senderName = "", senderAvatarUrl = null }) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);

      if (!threadId || !String(messageText || "").trim()) {
        throw new Error("Message text is required.");
      }

      if (!canUseRemoteTable(CHAT_MESSAGES_TABLE)) {
        throw new Error("Chat is unavailable (Supabase not configured).");
      }

      const client = createSupabaseClient();
      const payload = {
        thread_id: threadId,
        sender_email: normalizedEmail,
        sender_name: String(senderName || "").trim() || user.full_name || normalizedEmail,
        sender_avatar_url: senderAvatarUrl || user.image_url || null,
        message_text: String(messageText || "").trim(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from(CHAT_MESSAGES_TABLE)
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      await client
        .from(CHAT_THREADS_TABLE)
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", threadId)
        .catch(() => null);

      return data;
    },
    async getOrCreateDmThread(friendEmail) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);
      const normalizedFriend = normalizeEmail(friendEmail);
      const dmKey = buildPairKey(normalizedEmail, normalizedFriend);

      if (!dmKey) {
        throw new Error("A valid friend email is required.");
      }

      if (!canUseRemoteTable(CHAT_THREADS_TABLE)) {
        throw new Error("Chat is unavailable (Supabase not configured).");
      }

      const client = createSupabaseClient();
      const { data: existing, error: existingError } = await client
        .from(CHAT_THREADS_TABLE)
        .select("*")
        .eq("dm_key", dmKey)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing?.id) {
        return existing;
      }

      const { data: thread, error: threadError } = await client
        .from(CHAT_THREADS_TABLE)
        .insert({
          thread_type: "dm",
          dm_key: dmKey,
          created_by_email: normalizedEmail,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (threadError) {
        throw threadError;
      }

      await client
        .from(CHAT_THREAD_MEMBERS_TABLE)
        .insert([
          {
            thread_id: thread.id,
            member_email: normalizedEmail,
            role: "owner",
            updated_at: new Date().toISOString(),
          },
          {
            thread_id: thread.id,
            member_email: normalizedFriend,
            role: "member",
            updated_at: new Date().toISOString(),
          },
        ])
        .catch((error) => {
          throw error;
        });

      return thread;
    },
    async createGroupThread({ title = "", memberEmails = [] } = {}) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);
      const safeTitle = String(title || "").trim() || "New group";
      const members = [...new Set((memberEmails || []).map(normalizeEmail).filter(Boolean))]
        .filter((email) => email !== normalizedEmail);

      if (!canUseRemoteTable(CHAT_THREADS_TABLE)) {
        throw new Error("Chat is unavailable (Supabase not configured).");
      }

      const client = createSupabaseClient();
      const { data: thread, error: threadError } = await client
        .from(CHAT_THREADS_TABLE)
        .insert({
          thread_type: "group",
          title: safeTitle,
          created_by_email: normalizedEmail,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (threadError) {
        throw threadError;
      }

      const memberRows = [
        {
          thread_id: thread.id,
          member_email: normalizedEmail,
          role: "owner",
          updated_at: new Date().toISOString(),
        },
        ...members.map((email) => ({
          thread_id: thread.id,
          member_email: email,
          role: "member",
          updated_at: new Date().toISOString(),
        })),
      ];

      await client
        .from(CHAT_THREAD_MEMBERS_TABLE)
        .insert(memberRows)
        .catch((error) => {
          throw error;
        });

      return thread;
    },
    async leaveThread(threadId) {
      const user = await getCurrentUser();
      const normalizedEmail = normalizeEmail(user.email);

      if (!threadId || !canUseRemoteTable(CHAT_THREAD_MEMBERS_TABLE)) {
        return true;
      }

      const client = createSupabaseClient();
      await client
        .from(CHAT_THREAD_MEMBERS_TABLE)
        .delete()
        .eq("thread_id", threadId)
        .eq("member_email", normalizedEmail)
        .catch(() => null);

      return true;
    },
  },
  preferences: {
    async getAppTheme() {
      const user = await getCurrentUser();
      const localTheme = readLocalTheme(user.id);

      if (!canUseRemoteTable(USER_PREFERENCES_TABLE)) {
        return localTheme;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(USER_PREFERENCES_TABLE)
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const nextTheme = data?.app_theme === "hulu" ? "hulu" : "netflix";
        writeLocalTheme(user.id, nextTheme);
        return nextTheme;
      } catch (error) {
        markTableUnavailableIfMissing(USER_PREFERENCES_TABLE, error);
        console.warn("[Preferences] Falling back to local storage", error);
        return localTheme;
      }
    },
    async setAppTheme(appTheme) {
      const user = await getCurrentUser();
      const nextTheme = appTheme === "hulu" ? "hulu" : "netflix";
      writeLocalTheme(user.id, nextTheme);

      if (!canUseRemoteTable(USER_PREFERENCES_TABLE)) {
        return nextTheme;
      }

      try {
        const client = createSupabaseClient();
        const { error } = await client
          .from(USER_PREFERENCES_TABLE)
          .upsert({
            user_id: user.id,
            app_theme: nextTheme,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        markTableUnavailableIfMissing(USER_PREFERENCES_TABLE, error);
        console.warn("[Preferences] Falling back to local storage", error);
      }

      return nextTheme;
    },
    async getPresenceVisibility() {
      const user = await getCurrentUser();
      const localValue = readLocalPresenceVisibility(user.id);

      if (!canUseRemoteTable(USER_PREFERENCES_TABLE)) {
        return localValue;
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(USER_PREFERENCES_TABLE)
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const remoteValue = String(data?.presence_visibility || "").trim().toLowerCase();
        const nextValue = remoteValue === "friends" || remoteValue === "off" ? remoteValue : "public";
        writeLocalPresenceVisibility(user.id, nextValue);
        return nextValue;
      } catch (error) {
        markTableUnavailableIfMissing(USER_PREFERENCES_TABLE, error);
        console.warn("[Preferences] Falling back to local storage", error);
        return localValue;
      }
    },
    async setPresenceVisibility(presenceVisibility) {
      const user = await getCurrentUser();
      const nextValue = presenceVisibility === "friends" || presenceVisibility === "off" ? presenceVisibility : "public";
      writeLocalPresenceVisibility(user.id, nextValue);

      if (!canUseRemoteTable(USER_PREFERENCES_TABLE)) {
        return nextValue;
      }

      try {
        const client = createSupabaseClient();
        const { error } = await client
          .from(USER_PREFERENCES_TABLE)
          .upsert({
            user_id: user.id,
            presence_visibility: nextValue,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        markTableUnavailableIfMissing(USER_PREFERENCES_TABLE, error);
        console.warn("[Preferences] Falling back to local storage", error);
      }

      return nextValue;
    },
  },
  avatars: {
    async list() {
      const user = await getCurrentUser();
      const localRows = readLocalAvatarAssets(user.id);

      if (!canUseRemoteTable(PROFILE_AVATAR_ASSETS_TABLE)) {
        return localRows.filter((asset) => asset.is_active !== false);
      }

      try {
        const client = createSupabaseClient();
        const { data, error } = await client
          .from(PROFILE_AVATAR_ASSETS_TABLE)
          .select("*")
          .or(`user_id.is.null,user_id.eq.${user.id}`)
          .eq("is_active", true)
          .order("asset_kind", { ascending: true })
          .order("label", { ascending: true });

        if (error) {
          throw error;
        }

        const mergedRows = mergeAvatarAssetRows(data || [], localRows);
        writeLocalAvatarAssets(user.id, mergedRows);
        return mergedRows.filter((asset) => asset.is_active !== false);
      } catch (error) {
        markTableUnavailableIfMissing(PROFILE_AVATAR_ASSETS_TABLE, error);
        console.warn("[ProfileAvatarAssets] Falling back to local storage", error);
        return localRows.filter((asset) => asset.is_active !== false);
      }
    },
    async upload(file, label = "") {
      const user = await getCurrentUser();
      const localRows = readLocalAvatarAssets(user.id);

      try {
        if (!canUseRemoteTable(PROFILE_AVATAR_ASSETS_TABLE) || !isSupabaseConfigured) {
          throw new Error("Remote avatar storage unavailable.");
        }

        const remoteRow = await createRemoteProfileAvatarRow({ user, file, label });
        writeLocalAvatarAssets(user.id, mergeAvatarAssetRows([remoteRow], localRows));
        return remoteRow;
      } catch (error) {
        if (isMissingRemoteTableError(error)) {
          markTableUnavailableIfMissing(PROFILE_AVATAR_ASSETS_TABLE, error);
        }
        console.warn("[ProfileAvatarAssets] Falling back to local upload storage", error);
        const localRow = await createLocalProfileAvatarRow({ user, file, label });
        writeLocalAvatarAssets(user.id, mergeAvatarAssetRows([localRow], localRows));
        return localRow;
      }
    },
    async delete(id) {
      const user = await getCurrentUser();
      const localRows = readLocalAvatarAssets(user.id);
      const existingRow = localRows.find((row) => row.id === id) || null;
      const nextRows = localRows.filter((row) => row.id !== id);
      writeLocalAvatarAssets(user.id, nextRows);

      if (!existingRow || !canUseRemoteTable(PROFILE_AVATAR_ASSETS_TABLE) || String(id).startsWith("local_")) {
        return true;
      }

      try {
        const client = createSupabaseClient();
        const { error } = await client
          .from(PROFILE_AVATAR_ASSETS_TABLE)
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        if (existingRow.storage_path?.startsWith(`users/${user.id}/`)) {
          await client.storage
            .from(profileAvatarStorageBucket)
            .remove([existingRow.storage_path])
            .catch(() => null);
        }

        return true;
      } catch (error) {
        markTableUnavailableIfMissing(PROFILE_AVATAR_ASSETS_TABLE, error);
        console.warn("[ProfileAvatarAssets] Falling back to local delete", error);
        return true;
      }
    },
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
