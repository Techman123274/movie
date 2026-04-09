const readEnv = (...keys) => {
  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const readStorage = (key) => {
  if (typeof window === "undefined") {
    return "";
  }

  const value = window.localStorage.getItem(key);
  return typeof value === "string" ? value.trim() : "";
};

const readCsvEnv = (...keys) =>
  readEnv(...keys)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const DEFAULT_ADMIN_EMAILS = ["backwood.tayz@gmail.com"];

export const clerkPublishableKey = readEnv(
  "VITE_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
);

export const supabaseUrl = readEnv(
  "VITE_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL"
);

export const supabaseAnonKey = readEnv(
  "VITE_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export const supabaseJwtTemplate = readEnv(
  "VITE_CLERK_SUPABASE_JWT_TEMPLATE",
  "NEXT_PUBLIC_CLERK_SUPABASE_JWT_TEMPLATE"
) || "supabase";

export const adminEmails = [...new Set([
  ...DEFAULT_ADMIN_EMAILS,
  ...readCsvEnv(
    "VITE_ADMIN_EMAILS",
    "NEXT_PUBLIC_ADMIN_EMAILS"
  ),
])];

export const isAdminEmail = (email = "") =>
  Boolean(email) && adminEmails.includes(String(email).trim().toLowerCase());

export const tmdbApiKey = () =>
  readEnv(
    "VITE_TMDB_API_KEY",
    "NEXT_PUBLIC_TMDB_API_KEY",
    "TMDB_API_KEY"
  ) || readStorage("tmdb_api_key");

export const tmdbReadAccessToken = () =>
  readEnv(
    "VITE_TMDB_READ_ACCESS_TOKEN",
    "NEXT_PUBLIC_TMDB_READ_ACCESS_TOKEN",
    "TMDB_READ_ACCESS_TOKEN"
  ) || readStorage("tmdb_read_access_token");

export const hasTmdbCredentials = () =>
  Boolean(tmdbApiKey() || tmdbReadAccessToken());

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
