import { Star } from "lucide-react";

export default function RatingStars({
  value = 0,
  onChange,
  size = "md",
  disabled = false,
  showLabel = true,
}) {
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const numericValue = Number(value) || 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const filled = starValue <= numericValue;

          return (
            <button
              key={starValue}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(starValue)}
              className={`transition-transform ${disabled ? "cursor-default" : "hover:scale-110"}`}
              aria-label={`Rate ${starValue} out of 5`}
            >
              <Star
                className={`${iconSize} ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/30"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm text-white/70">
          {numericValue > 0 ? `${numericValue}/5` : "No rating yet"}
        </span>
      )}
    </div>
  );
}
