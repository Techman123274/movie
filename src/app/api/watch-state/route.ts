import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clearWatchProgress, completeWatch, getProfileForUser, recordWatchStart } from "@/lib/persistence";

const watchStateSchema = z.object({
  profileId: z.string().trim().min(1),
  mediaId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  seasonNumber: z.number().int().positive().optional(),
  episodeNumber: z.number().int().positive().optional(),
  event: z.enum(["start", "complete", "clear"]),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = watchStateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watch state payload." }, { status: 400 });
  }

  const profile = await getProfileForUser(parsed.data.profileId, userId);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const payload = {
    profileId: parsed.data.profileId,
    mediaId: parsed.data.mediaId,
    mediaType: parsed.data.mediaType,
    seasonNumber: parsed.data.seasonNumber,
    episodeNumber: parsed.data.episodeNumber,
  };

  const result =
    parsed.data.event === "start"
      ? await recordWatchStart(payload)
      : parsed.data.event === "complete"
        ? await completeWatch(payload)
        : await clearWatchProgress(payload);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
