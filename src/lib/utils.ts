import { clsx, type ClassValue } from "clsx";

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
