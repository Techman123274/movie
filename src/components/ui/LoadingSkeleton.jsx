export function HeroSkeleton() {
  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] animate-pulse">
      <div className="absolute bottom-24 left-4 md:left-16 max-w-lg space-y-4">
        <div className="h-12 w-96 bg-[#1a1a1a] rounded" />
        <div className="h-4 w-full bg-[#1a1a1a] rounded" />
        <div className="h-4 w-3/4 bg-[#1a1a1a] rounded" />
        <div className="flex gap-3 mt-6">
          <div className="h-10 w-24 bg-[#1a1a1a] rounded" />
          <div className="h-10 w-32 bg-[#1a1a1a] rounded" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="flex gap-2 px-4 md:px-12 overflow-hidden">
      {Array(count).fill(0).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded bg-[#1a1a1a] animate-pulse"
          style={{ width: "clamp(140px, 15vw, 200px)", aspectRatio: "2/3" }}
        />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse mb-4 mx-4 md:mx-12" />
      <CardSkeleton />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] animate-pulse">
      <div className="w-full h-[50vh] bg-[#1a1a1a]" />
      <div className="px-4 md:px-12 py-8 space-y-4">
        <div className="h-10 w-64 bg-[#1a1a1a] rounded" />
        <div className="h-4 w-full max-w-2xl bg-[#1a1a1a] rounded" />
        <div className="h-4 w-3/4 max-w-xl bg-[#1a1a1a] rounded" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-28 bg-[#1a1a1a] rounded" />
          <div className="h-10 w-32 bg-[#1a1a1a] rounded" />
        </div>
      </div>
    </div>
  );
}

export function SearchCardSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="rounded bg-[#1a1a1a] animate-pulse" style={{ aspectRatio: "2/3" }} />
      ))}
    </div>
  );
}