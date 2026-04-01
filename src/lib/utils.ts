import { clsx, type ClassValue } from "clsx";
import type { MediaType, SeasonSummary } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatYear(date?: string) {
  if (!date) {
    return "TBA";
  }

  return new Date(date).getFullYear().toString();
}

export function formatRating(value?: number) {
  if (!value) {
    return "New";
  }

  return `${value.toFixed(1)} / 10`;
}

export function formatRuntime(runtime?: number) {
  if (!runtime) {
    return "Unknown runtime";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatMediaLabel(mediaType: "movie" | "tv") {
  return mediaType === "movie" ? "Movie" : "Series";
}

export function buildMediaKey(mediaType: MediaType, mediaId: number) {
  return `${mediaType}-${mediaId}`;
}

export function buildWatchHref(
  mediaType: "movie" | "tv",
  mediaId: number,
  seasonNumber?: number,
  episodeNumber?: number,
) {
  const basePath = `/${mediaType}/${mediaId}/watch`;

  if (mediaType !== "tv") {
    return basePath;
  }

  const searchParams = new URLSearchParams();

  if (seasonNumber) {
    searchParams.set("season", String(seasonNumber));
  }

  if (episodeNumber) {
    searchParams.set("episode", String(episodeNumber));
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function formatEpisodeLabel(seasonNumber?: number, episodeNumber?: number) {
  if (!seasonNumber || !episodeNumber) {
    return null;
  }

  return `S${seasonNumber} E${episodeNumber}`;
}

export function parsePositiveInt(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
}

export function resolveSeasonSelection(options: {
  seasons?: SeasonSummary[];
  requestedSeasonNumber?: number;
  resumeSeasonNumber?: number;
}) {
  const availableSeasonNumbers = options.seasons?.map((season) => season.seasonNumber) ?? [];

  if (!availableSeasonNumbers.length) {
    return undefined;
  }

  if (
    options.requestedSeasonNumber !== undefined &&
    availableSeasonNumbers.includes(options.requestedSeasonNumber)
  ) {
    return options.requestedSeasonNumber;
  }

  if (options.resumeSeasonNumber !== undefined && availableSeasonNumbers.includes(options.resumeSeasonNumber)) {
    return options.resumeSeasonNumber;
  }

  return availableSeasonNumbers[0];
}
