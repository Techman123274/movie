"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createProfileForUser,
  ensureAppUser,
  setProfileFeedback,
  toggleWatchlist,
  updateProfileRegion,
} from "@/lib/persistence";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/viewer";
import type { FeedbackValue, MediaType } from "@/lib/types";

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(32),
  avatar: z.string().trim().min(1).max(2),
  accent: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/),
  maturityRating: z.string().trim().min(2).max(10),
  providerRegion: z.string().trim().length(2),
});

const feedbackValues = new Set<FeedbackValue>(["like", "dislike", "not_interested"]);

export async function createInitialProfileAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  const userSync = await ensureAppUser(userId, clerkUser?.emailAddresses[0]?.emailAddress ?? null);

  if (!userSync.success) {
    redirect(`/onboarding?error=${encodeURIComponent(userSync.error)}`);
  }

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    avatar: formData.get("avatar"),
    accent: formData.get("accent"),
    maturityRating: formData.get("maturityRating"),
    providerRegion: formData.get("providerRegion"),
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid-profile");
  }

  const profileId = crypto.randomUUID();
  const result = await createProfileForUser({
    id: profileId,
    user_id: userId,
    name: parsed.data.name,
    avatar: parsed.data.avatar.toUpperCase(),
    accent: parsed.data.accent,
    maturity_rating: parsed.data.maturityRating,
    provider_region: parsed.data.providerRegion.toUpperCase(),
  });

  if (!result.success) {
    const errorParam = result.readinessIssue === "missing-profiles-table" ? "missing-profiles-table" : result.error;
    redirect(`/onboarding?error=${encodeURIComponent(errorParam)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect("/browse");
}

export async function switchActiveProfileAction(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const returnTo = String(formData.get("returnTo") || "/profiles");

  if (!profileId) {
    redirect(returnTo);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect(returnTo);
}

export async function updateRegionAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const profileId = String(formData.get("profileId") || "");
  const returnTo = String(formData.get("returnTo") || "/settings");
  const providerRegion = String(formData.get("providerRegion") || "").toUpperCase();

  if (!profileId || providerRegion.length !== 2) {
    redirect(`${returnTo}?error=invalid-region`);
  }

  const result = await updateProfileRegion(profileId, userId, providerRegion);

  if (!result.success) {
    redirect(`${returnTo}?error=region-update-failed`);
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleWatchlistAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/account");
  }

  const profileId = String(formData.get("profileId") || "");
  const returnTo = String(formData.get("returnTo") || "/");
  const mediaId = Number(formData.get("mediaId"));
  const mediaType = String(formData.get("mediaType")) as MediaType;

  if (!profileId || !mediaId || (mediaType !== "movie" && mediaType !== "tv")) {
    redirect(returnTo);
  }

  await toggleWatchlist(profileId, mediaId, mediaType);
  revalidatePath(returnTo);
  revalidatePath("/account");
  redirect(returnTo);
}

export async function setTitleFeedbackAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/account");
  }

  const profileId = String(formData.get("profileId") || "");
  const returnTo = String(formData.get("returnTo") || "/");
  const mediaId = Number(formData.get("mediaId"));
  const mediaType = String(formData.get("mediaType")) as MediaType;
  const valueRaw = String(formData.get("value") || "");
  const value = feedbackValues.has(valueRaw as FeedbackValue) ? (valueRaw as FeedbackValue) : null;

  if (!profileId || !mediaId || (mediaType !== "movie" && mediaType !== "tv")) {
    redirect(returnTo);
  }

  await setProfileFeedback({
    profileId,
    mediaId,
    mediaType,
    value,
  });

  revalidatePath(returnTo);
  revalidatePath("/browse");
  revalidatePath("/account");
  redirect(returnTo);
}
