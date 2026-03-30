export default function Loading() {
  return (
    <div className="page-shell">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8">
        <div className="h-[380px] animate-pulse rounded-[40px] bg-white/6" />
        <div className="h-10 w-60 animate-pulse rounded-full bg-white/6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-[28px] bg-white/6" />
          ))}
        </div>
      </main>
    </div>
  );
}
