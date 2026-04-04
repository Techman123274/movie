import Link from "next/link";
import { notFound } from "next/navigation";
import { CastStrip } from "@/components/cast-strip";
import { DetailHero } from "@/components/detail-hero";
import { EpisodeBrowser } from "@/components/episode-browser";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { ProviderBadges } from "@/components/provider-badges";
import { TitleFactsPanel } from "@/components/title-facts-panel";
import { TitleTrailerPanel } from "@/components/title-trailer-panel";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getProfileFeedback, getResumeTarget, getWatchlist } from "@/lib/persistence";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { buildMediaKey, parsePositiveInt, resolveSeasonSelection } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type DetailPageProps = {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
  searchParams: Promise<{
    season?: string;
  }>;
};

export default async function DetailPage({ params, searchParams }: DetailPageProps) {
  const [{ mediaType, id }, query] = await Promise.all([params, searchParams]);

  if (mediaType !== "movie" && mediaType !== "tv") {
    notFound();
  }

  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const detail = await withMinimumDelay(getMediaDetail(mediaType as MediaType, Number(id), viewer.providerRegion));

  if (!detail) {
    return (
      <PageFrame activeHref={mediaType === "movie" ? "/movies" : "/shows"}>
        <UnavailablePanel
          title="Title details are unavailable."
          message="The details for this title could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  const [watchlist, resumeTarget] = viewer.activeProfile
    ? await Promise.all([
        getWatchlist(viewer.activeProfile.id),
        getResumeTarget(viewer.activeProfile.id, detail.id, detail.mediaType),
      ])
    : [[], null];
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const inWatchlist = watchlistKeys.includes(buildMediaKey(detail.mediaType, detail.id));
  const feedback = viewer.activeProfile
    ? await getProfileFeedback(viewer.activeProfile.id, detail.id, detail.mediaType)
    : null;
  const selectedSeasonNumber =
    mediaType === "tv"
      ? resolveSeasonSelection({
          seasons: detail.seasons,
          requestedSeasonNumber: parsePositiveInt(query.season),
          resumeSeasonNumber: resumeTarget?.seasonNumber,
        })
      : undefined;
  const season =
    mediaType === "tv" && selectedSeasonNumber
      ? await getSeasonEpisodes(detail.id, selectedSeasonNumber)
      : undefined;

  return (
    <PageFrame activeHref={mediaType === "movie" ? "/movies" : "/shows"}>
      <DetailHero
        item={detail}
        profileId={viewer.activeProfile?.id ?? null}
        inWatchlist={inWatchlist}
        resumeTarget={resumeTarget}
        feedback={feedback?.value ?? null}
      />
      <TitleFactsPanel item={detail} />
      <TitleTrailerPanel trailers={detail.trailers} />
      <ProviderBadges providers={detail.providers} />
      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-strong rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Watch together</p>
          <h2 className="display-font mt-4 text-4xl text-white">This title now lives inside a more social viewing flow.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
            Profiles stay personal, but watchlists, recent activity, and quick reactions now help the app surface stronger group picks for the next movie night.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2">
              {viewer.profiles.length} profile{viewer.profiles.length === 1 ? "" : "s"} in the mix
            </span>
            <span className="theme-chip rounded-full px-4 py-2 text-[var(--color-brand-strong)]">
              Reactions shape discovery
            </span>
          </div>
        </div>
        <div className="surface rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Keep the room aligned</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <div className="rounded-[22px] bg-black/20 px-4 py-4">
              Save it to the watchlist so it stays in the shared orbit for later.
            </div>
            <div className="rounded-[22px] bg-black/20 px-4 py-4">
              Use reactions after watching to teach the app which kinds of picks this profile wants more of.
            </div>
            <div className="rounded-[22px] bg-black/20 px-4 py-4">
              Switch profiles if someone else is choosing tonight, then come right back to this title.
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/account" className="theme-button-primary rounded-full px-4 py-2 text-sm font-semibold">
              Open My Profile
            </Link>
            <Link href="/profiles" className="theme-button-secondary rounded-full px-4 py-2 text-sm text-white">
              Switch profiles
            </Link>
          </div>
        </div>
      </section>
      {season && detail.seasons ? (
        <EpisodeBrowser
          tvId={detail.id}
          seasons={detail.seasons}
          selectedSeason={season}
          resumeTarget={resumeTarget}
        />
      ) : null}
      <CastStrip cast={detail.cast} />
      <MediaRail
        rail={{
          id: "related",
          title: "You may also like",
          eyebrow: "More from the vault",
          description: "Close the loop with related titles while this story is still top of mind.",
          items: detail.related,
        }}
        profileId={viewer.activeProfile?.id ?? null}
        watchlistKeys={watchlistKeys}
      />
    </PageFrame>
  );
}
