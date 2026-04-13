import { cn } from "@/lib/utils";

export default function PlaybackProgressBar({ progress = 0, className = "" }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  if (safeProgress <= 0) {
    return null;
  }

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-black/45", className)}>
      <div
        className="h-full rounded-full bg-[#E50914] transition-[width] duration-300"
        style={{ width: `${Math.max(2, safeProgress)}%` }}
      />
    </div>
  );
}
