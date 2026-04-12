import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "./ContentCard";
import { useAppTheme } from "@/lib/theme";

export default function ContentRow({ title, items = [], loading = false, layout = "row" }) {
  const rowRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.rowVariant === "hulu";

  const scroll = (direction) => {
    const row = rowRef.current;
    if (!row) {
      return;
    }

    const scrollAmount = row.clientWidth * (isHulu ? 0.92 : 0.8);
    row.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });

    window.setTimeout(() => {
      setShowLeft(row.scrollLeft > 0);
      setShowRight(row.scrollLeft < row.scrollWidth - row.clientWidth - 10);
    }, 400);
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return undefined;
    }

    const syncArrows = () => {
      setShowLeft(row.scrollLeft > 0);
      setShowRight(row.scrollLeft < row.scrollWidth - row.clientWidth - 10);
    };

    syncArrows();
    window.addEventListener("resize", syncArrows);

    return () => {
      window.removeEventListener("resize", syncArrows);
    };
  }, [items.length]);

  if (loading) {
    return (
      <div className={isHulu ? "mb-10 px-4 md:px-12" : "mb-8"}>
        <div className={`animate-pulse rounded ${isHulu ? "mb-4 h-4 w-56 bg-white/10" : "mx-4 mb-4 h-5 w-48 bg-[#1a1a1a] md:mx-12"}`} />
        <div className={`flex gap-3 overflow-hidden ${isHulu ? "" : "px-4 md:px-12"}`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`flex-shrink-0 animate-pulse rounded-2xl ${isHulu ? "w-[240px] bg-white/10" : "w-[132px] bg-[#1a1a1a] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]"}`}
              style={{ aspectRatio: isHulu ? "16 / 9" : "2 / 3" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <section className={`group/row ${isHulu ? "mb-8 px-4 md:px-12" : "mb-7 md:mb-8"}`}>
      <div className={`${isHulu ? "mb-4 flex items-end justify-between gap-4" : ""}`}>
        <div>
          <h2 className={`font-semibold text-white transition-colors hover:text-gray-200 ${isHulu ? "text-xl md:text-2xl" : "mb-3 px-4 text-lg md:px-12 md:text-xl"}`}>
            {title}
          </h2>
          {isHulu && (
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/42">
              {items.length} picks
            </p>
          )}
        </div>
      </div>

      <div className="relative" style={{ overflowX: "clip" }}>
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className={`absolute left-0 top-0 z-30 hidden items-center justify-center transition-opacity md:flex ${isHulu ? "bottom-0 w-14 rounded-l-2xl bg-[linear-gradient(90deg,rgba(7,12,9,0.92)_0%,rgba(7,12,9,0.04)_100%)] opacity-100" : "bottom-[80px] w-12 bg-black/60 opacity-0 hover:bg-black/80 group-hover/row:opacity-100"}`}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className={`absolute right-0 top-0 z-30 hidden items-center justify-center transition-opacity md:flex ${isHulu ? "bottom-0 w-14 rounded-r-2xl bg-[linear-gradient(270deg,rgba(7,12,9,0.92)_0%,rgba(7,12,9,0.04)_100%)] opacity-100" : "bottom-[80px] w-12 bg-black/60 opacity-0 hover:bg-black/80 group-hover/row:opacity-100"}`}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        )}

        <div
          ref={rowRef}
          className={`scrollbar-hide flex snap-x gap-3 overflow-x-auto ${isHulu ? "rounded-2xl" : "px-4 md:px-12"}`}
          style={isHulu ? undefined : { paddingBottom: "100px", marginBottom: "-100px" }}
          onScroll={(event) => {
            const target = event.currentTarget;
            setShowLeft(target.scrollLeft > 0);
            setShowRight(target.scrollLeft < target.scrollWidth - target.clientWidth - 10);
          }}
        >
          {items.map((item) => (
            <ContentCard
              key={`${item.id}-${item.media_type}`}
              item={item}
              layout={layout}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
