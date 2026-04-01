export default function Loading() {
  return (
    <div className="page-shell">
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 pb-28 sm:gap-12 sm:px-8 sm:py-10 sm:pb-32 md:pb-10">
        <section className="skeleton-block min-h-[460px] rounded-[36px] border border-white/8 sm:min-h-[520px]" />

        <section className="space-y-5">
          <div className="space-y-3">
            <div className="skeleton-block h-3 w-32 rounded-full" />
            <div className="skeleton-block h-10 w-72 rounded-full" />
            <div className="skeleton-block h-4 w-full max-w-2xl rounded-full" />
          </div>
          <div className="hide-scrollbar flex gap-4 overflow-hidden pb-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`featured-card-${index}`}
                className="skeleton-block aspect-[2/3] w-[176px] min-w-[176px] rounded-[28px] sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]"
              />
            ))}
          </div>
        </section>

        {Array.from({ length: 2 }).map((_, railIndex) => (
          <section key={`rail-${railIndex}`} className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-3">
                <div className="skeleton-block h-3 w-28 rounded-full" />
                <div className="skeleton-block h-9 w-64 rounded-full" />
                <div className="skeleton-block h-4 w-full max-w-xl rounded-full" />
              </div>
              <div className="hidden gap-2 md:flex">
                <div className="skeleton-block h-11 w-11 rounded-full" />
                <div className="skeleton-block h-11 w-11 rounded-full" />
              </div>
            </div>
            <div className="hide-scrollbar flex gap-4 overflow-hidden pb-4">
              {Array.from({ length: 6 }).map((_, cardIndex) => (
                <div
                  key={`rail-${railIndex}-card-${cardIndex}`}
                  className="skeleton-block aspect-[2/3] w-[176px] min-w-[176px] rounded-[28px] sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]"
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
