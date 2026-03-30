import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function getSupabaseReadClient() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    return null;
  }

  return createClient(env.supabase.url, env.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAdminClient() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    return null;
  }

  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
