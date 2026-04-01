import type { TrailerVideo } from "@/lib/types";

type TitleTrailerPanelProps = {
  trailers: TrailerVideo[];
};

export function TitleTrailerPanel({ trailers }: TitleTrailerPanelProps) {
  if (!trailers.length) {
    return null;
  }

  const [heroTrailer, ...rest] = trailers;

  return (
    <section id="trailers" className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_0.75fr]">
      <div className="surface-strong overflow-hidden rounded-[30px]">
        <div className="border-b border-white/8 px-6 py-5">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Preview</p>
          <h2 className="display-font text-3xl text-white">{heroTrailer.name}</h2>
        </div>
        <div className="overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${heroTrailer.key}?rel=0&modestbranding=1`}
            title={heroTrailer.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>
      </div>

      <div className="surface rounded-[30px] p-5">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">More videos</p>
        <div className="grid gap-3">
          {[heroTrailer, ...rest].slice(0, 5).map((trailer) => (
            <a
              key={trailer.id}
              href={`https://www.youtube.com/watch?v=${trailer.key}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 transition hover:border-[rgba(214,179,109,0.35)] hover:text-white"
            >
              <p className="text-sm font-medium text-white">{trailer.name}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {trailer.type} {trailer.official ? "· Official" : ""}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
