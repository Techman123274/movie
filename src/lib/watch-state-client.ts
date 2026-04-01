import type { MediaType, WatchStateEvent } from "@/lib/types";

export async function postWatchState(payload: {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds?: number;
  event: WatchStateEvent;
}) {
  const response = await fetch("/api/watch-state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Watch state request failed.");
  }
}
