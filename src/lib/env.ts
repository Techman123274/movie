function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function parseList(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

export const env = {
  tmdbApiKey: process.env.TMDB_API_KEY,
  tmdbReadToken: process.env.TMDB_READ_ACCESS_TOKEN,
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  playback: {
    enabledProviders: parseList(
      process.env.NEXT_PUBLIC_ENABLED_PLAYBACK_PROVIDERS || "vidlink,moviesapi",
    ),
    validatedProviders: parseList(process.env.NEXT_PUBLIC_VALIDATED_PLAYBACK_PROVIDERS),
    strictAdFree: parseBoolean(process.env.NEXT_PUBLIC_STRICT_AD_FREE, true),
  },
  defaultProviderRegion: process.env.NEXT_PUBLIC_DEFAULT_PROVIDER_REGION || "US",
  sports: {
    streamcenterBaseUrl: process.env.NEXT_PUBLIC_STREAMCENTER_URL || "https://streamcenter.live/",
  },
};

export function hasTmdbCredentials() {
  return Boolean(env.tmdbApiKey || env.tmdbReadToken);
}

export function hasClerkCredentials() {
  return Boolean(env.clerk.publishableKey && env.clerk.secretKey);
}

export function hasSupabaseCredentials() {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

export function hasSupabaseAdminCredentials() {
  return Boolean(env.supabase.url && env.supabase.serviceRoleKey);
}
