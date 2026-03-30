import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, hasClerkCredentials, hasSupabaseAdminCredentials, hasSupabaseCredentials } from "@/lib/env";
import { ensureAppUser, getProfilesForUser } from "@/lib/persistence";
import type { CatalogUnavailableReason, ProfileRecord } from "@/lib/types";

export const ACTIVE_PROFILE_COOKIE = "luma_active_profile_id";

type ViewerContext = {
  userId: string | null;
  profiles: ProfileRecord[];
  activeProfile: ProfileRecord | null;
  providerRegion: string;
  isSignedIn: boolean;
  readinessIssue: CatalogUnavailableReason | null;
};

export async function getViewerContext(options?: { redirectToOnboarding?: boolean }): Promise<ViewerContext> {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      profiles: [],
      activeProfile: null,
      providerRegion: env.defaultProviderRegion,
      isSignedIn: false,
      readinessIssue: hasClerkCredentials() ? null : "not-signed-in",
    };
  }

  if (!hasSupabaseCredentials()) {
    return {
      userId,
      profiles: [],
      activeProfile: null,
      providerRegion: env.defaultProviderRegion,
      isSignedIn: true,
      readinessIssue: "missing-supabase-config",
    };
  }

  if (!hasSupabaseAdminCredentials()) {
    return {
      userId,
      profiles: [],
      activeProfile: null,
      providerRegion: env.defaultProviderRegion,
      isSignedIn: true,
      readinessIssue: "missing-service-role",
    };
  }

  const clerkUser = await currentUser();
  const userSync = await ensureAppUser(userId, clerkUser?.emailAddresses[0]?.emailAddress ?? null);

  if (!userSync.success) {
    return {
      userId,
      profiles: [],
      activeProfile: null,
      providerRegion: env.defaultProviderRegion,
      isSignedIn: true,
      readinessIssue: "missing-service-role",
    };
  }

  const profileLookup = await getProfilesForUser(userId);
  const profiles = profileLookup.profiles;
  const cookieStore = await cookies();
  const requestedProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  const activeProfile =
    profiles.find((profile) => profile.id === requestedProfileId) ??
    profiles[0] ??
    null;

  if (options?.redirectToOnboarding && profiles.length === 0) {
    redirect("/onboarding");
  }

  return {
    userId,
    profiles,
    activeProfile,
    providerRegion: activeProfile?.providerRegion ?? env.defaultProviderRegion,
    isSignedIn: true,
    readinessIssue: profileLookup.readinessIssue,
  };
}
