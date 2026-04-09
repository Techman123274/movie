import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "./ContentCard";

export default function ContentRow({ title, items = [], loading = false }) {
  const rowRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction) => {
    const row = rowRef.current;
    if (!row) return;
    const scrollAmount = row.clientWidth * 0.8;
    row.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    setTimeout(() => {
      setShowLeft(row.scrollLeft > 0);
      setShowRight(row.scrollLeft < row.scrollWidth - row.clientWidth - 10);
    }, 400);
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse mb-4 mx-4 md:mx-12" />
        <div className="flex gap-2 px-4 md:px-12 overflow-hidden">
          {Array(7).fill(0).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded bg-[#1a1a1a] animate-pulse"
              style={{ width: "clamp(140px, 15vw, 200px)", aspectRatio: "2/3" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="mb-8 group/row">
      <h2 className="text-white text-lg md:text-xl font-semibold px-4 md:px-12 mb-3 hover:text-gray-200 transition-colors">
        {title}
      </h2>

      {/* Outer wrapper: clips horizontal overflow but allows vertical overflow for hover cards */}
      <div className="relative" style={{ overflowX: "clip" }}>
        {/* Left arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 z-30 w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ bottom: "80px" }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Right arrow */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 z-30 w-12 bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ bottom: "80px" }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Scroll container — extra padding-bottom so hover cards expand without clipping */}
        <div
          ref={rowRef}
          className="flex gap-2 px-4 md:px-12 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: "100px", marginBottom: "-100px" }}
          onScroll={(e) => {
            setShowLeft(e.target.scrollLeft > 0);
            setShowRight(e.target.scrollLeft < e.target.scrollWidth - e.target.clientWidth - 10);
          }}
        >
          {items.map((item) => (
            <ContentCard key={`${item.id}-${item.media_type}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}