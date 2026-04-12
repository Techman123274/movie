import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Download,
  Globe,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Tv,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { base44 } from "@/api/base44Client";
import { fetchPublicSiteSettings, getDefaultSiteSettings } from "@/lib/admin-config";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { useAppTheme } from "@/lib/theme";
import {
  getByGenre,
  getPopularMovies,
  getPopularTV,
  getTrending,
  tmdbConfigured,
  tmdbOriginal,
  tmdbW500,
} from "@/lib/tmdb";
import { SUPPORT_PAGES } from "@/lib/support-pages";

const PROMO_SLOTS = [
  { label: "Featured Film", accent: "bg-[#ffb34d]", audience: "standard" },
  { label: "Tonight's Hit", accent: "bg-[#E50914]", audience: "standard" },
  { label: "Series Spotlight", accent: "bg-[#83b4ff]", audience: "standard" },
  { label: "Kids Mix", accent: "bg-[#ff8b5f]", audience: "kids" },
];

const FALLBACK_PROMOS = [
  { title: "Featured Film", meta: "TMDB pick", slotLabel: "Featured Film", accent: "bg-[#ffb34d]", audience: "standard" },
  { title: "Tonight's Hit", meta: "Blockbuster", slotLabel: "Tonight's Hit", accent: "bg-[#E50914]", audience: "standard" },
  { title: "Series Spotlight", meta: "Binge-worthy", slotLabel: "Series Spotlight", accent: "bg-[#83b4ff]", audience: "standard" },
  { title: "Kids Mix", meta: "Family favourites", slotLabel: "Kids Mix", accent: "bg-[#ff8b5f]", audience: "kids" },
];

const VALUE_POINTS = [
  { label: "4K + HDR ready", icon: Tv },
  { label: "Cancel anytime", icon: ShieldCheck },
  { label: "Download and go", icon: Download },
  { label: "Watch on any screen", icon: Globe },
];

const FEATURE_ROWS = [
  {
    title: "Enjoy on your TV",
    desc: "Watch on smart TVs, game consoles, streaming sticks, and every big screen in the house with a polished living-room experience.",
    eyebrow: "Big-screen ready",
    reverse: false,
    stats: ["4K supported", "Living room UI", "Profiles + watchlists"],
    visualTitle: "Living Room Mode",
    visualSubtitle: "Launch straight into a cinematic home screen.",
  },
  {
    title: "Download your shows to watch offline",
    desc: "Save films and episodes for travel days, commutes, or late-night catch-ups without chasing a signal.",
    eyebrow: "Offline viewing",
    reverse: true,
    stats: ["Fast downloads", "Resume anywhere", "Works profile by profile"],
    visualTitle: "Always ready",
    visualSubtitle: "A clean download flow built for phones and tablets.",
  },
  {
    title: "Watch everywhere",
    desc: "Move from phone to tablet to laptop without losing your place, your profile, or the titles waiting in your list.",
    eyebrow: "Any device",
    reverse: false,
    stats: ["Phone + tablet", "Laptop + desktop", "Same account, same progress"],
    visualTitle: "One account, every screen",
    visualSubtitle: "Your watch history and recommendations travel with you.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What is Subflix?",
    answer:
      "Subflix is a streaming-style movie and TV experience with profiles, recommendations, watch history, curated kids content, and a polished browse flow designed to feel familiar from the first click.",
  },
  {
    question: "Can I watch on multiple devices?",
    answer:
      "Yes. The landing experience is built around the idea that your library, progress, and profile preferences should feel consistent whether you open Subflix on a TV, laptop, tablet, or phone.",
  },
  {
    question: "Is there a kids experience?",
    answer:
      "Yes. Kids profiles are designed to surface family-friendly content, safer recommendations, and a cleaner browsing experience that stays separate from standard profiles.",
  },
  {
    question: "How do I get started?",
    answer:
      "Enter your email and choose Get Started, or use Sign In if you already have an account. Both buttons keep the current login flow in place and send you through the existing authentication setup.",
  },
  {
    question: "Where can I get help?",
    answer:
      "Support pages for FAQ, Help Center, Ways to Watch, Privacy, Contact Us, Speed Test, and Legal Notices are all linked in the footer so you can jump directly to the page you need.",
  },
];

const dedupeTitles = (items) => {
  const seen = new Set();
  return (items || []).filter((item) => {
    const mediaType = item.media_type || (item.title ? "movie" : "tv");
    const key = `${mediaType}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return Boolean(item?.backdrop_path || item?.poster_path);
  });
};

const formatPromoMeta = (item, slot) => {
  const mediaType = item.media_type === "tv" ? "Series" : "Film";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  if (slot.audience === "kids") {
    return year ? `${mediaType} • ${year} • Kids Pick` : `${mediaType} • Kids Pick`;
  }
  return year ? `${mediaType} • ${year}` : mediaType;
};

const mapPromoItem = (item, slot) => ({
  id: item?.id || `${slot.label.toLowerCase().replace(/\s+/g, "-")}-fallback`,
  title: item?.title || item?.name || slot.label,
  meta: item ? formatPromoMeta(item, slot) : slot.audience === "kids" ? "Family favourites" : "TMDB pick",
  poster_path: item?.poster_path || null,
  backdrop_path: item?.backdrop_path || null,
  slotLabel: slot.label,
  accent: slot.accent,
  audience: slot.audience,
});

export default function SignIn() {
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
  const [email, setEmail] = useState("");
  const [siteSettings, setSiteSettings] = useState(getDefaultSiteSettings());
  const [featuredPromos, setFeaturedPromos] = useState(FALLBACK_PROMOS);
  const [heroBackdrop, setHeroBackdrop] = useState("");
  const footerLinks = SUPPORT_PAGES.map((page) => page.label);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    fetchPublicSiteSettings()
      .then((settings) => {
        if (active) {
          setSiteSettings(settings);
        }
      })
      .catch(() => {
        if (active) {
          setSiteSettings(getDefaultSiteSettings());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadFeaturedPromos = async () => {
      if (!tmdbConfigured()) {
        return;
      }

      try {
        const [trending, popularMovies, popularTV, familyMovies, kidsTV] = await Promise.all([
          getTrending("all", "week").catch(() => ({ results: [] })),
          getPopularMovies().catch(() => ({ results: [] })),
          getPopularTV().catch(() => ({ results: [] })),
          getByGenre(10751, "movie").catch(() => ({ results: [] })),
          getByGenre(10762, "tv").catch(() => ({ results: [] })),
        ]);

        const standardPool = dedupeTitles([
          ...(trending.results || []).map((item) => ({
            ...item,
            media_type: item.media_type || (item.title ? "movie" : "tv"),
          })),
          ...(popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
          ...(popularTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
        ]).filter((item) => item.adult !== true);

        const kidsPool = dedupeTitles([
          ...(familyMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
          ...(kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
        ]).filter((item) => item.adult !== true);

        const nextPromos = [
          mapPromoItem(standardPool[0], PROMO_SLOTS[0]),
          mapPromoItem(standardPool[1] || standardPool[0], PROMO_SLOTS[1]),
          mapPromoItem(standardPool[2] || standardPool[1] || standardPool[0], PROMO_SLOTS[2]),
          mapPromoItem(kidsPool[0] || familyMovies.results?.[0] || kidsTV.results?.[0], PROMO_SLOTS[3]),
        ];

        if (!active) {
          return;
        }

        setFeaturedPromos(nextPromos);
        setHeroBackdrop(
          tmdbOriginal(
            nextPromos.find((item) => item.backdrop_path)?.backdrop_path ||
              standardPool[0]?.backdrop_path ||
              ""
          ) || ""
        );
      } catch {
        if (!active) {
          return;
        }
        setFeaturedPromos(FALLBACK_PROMOS);
        setHeroBackdrop("");
      }
    };

    loadFeaturedPromos();

    return () => {
      active = false;
    };
  }, []);

  const handleGetStarted = (event) => {
    event.preventDefault();
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-[var(--app-bg)] text-white">
      <section className={`relative isolate overflow-hidden ${isHulu ? "mx-4 mt-[calc(var(--app-safe-top)+1rem)] rounded-[28px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:mx-8 md:mt-20 lg:mx-12" : "border-b border-white/10"} landing-hero-bg`}>
        {heroBackdrop && (
          <div className="absolute inset-0">
            <img
              src={heroBackdrop}
              alt="Featured Subflix background"
              className="h-full w-full object-cover object-center opacity-35"
            />
          </div>
        )}
        <div className="absolute inset-0 landing-grid-fade opacity-30" />
        <div className="absolute inset-0 landing-vignette" />
        <div className="absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full landing-spotlight opacity-90 md:h-[28rem] md:w-[28rem]" />
        {!isHulu && <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#7d0f19]/30 blur-3xl" />}
        {!isHulu && <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-[#32070d]/50 blur-3xl" />}

        <div className={`absolute hidden md:block ${isHulu ? "right-6 top-24 left-[54%]" : "top-24 md:left-[34%] md:right-[-4%] md:px-4 lg:left-[42%] lg:right-[-2%] lg:px-0 xl:left-[40%]"}`}>
          <div className="grid grid-cols-4 gap-4 opacity-95">
            {featuredPromos.map((poster, index) => (
              <motion.div
                key={`${poster.slotLabel}-${poster.id}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 36, rotate: index % 2 === 0 ? -5 : 5 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, rotate: index % 2 === 0 ? -4 : 4 }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: "easeOut" }}
                className="relative h-[24rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#1a1a1a_0%,#050505_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              >
                {poster.poster_path || poster.backdrop_path ? (
                  <img
                    src={tmdbW500(poster.poster_path || poster.backdrop_path)}
                    alt={poster.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.1)_20%,rgba(0,0,0,0.78)_72%,rgba(0,0,0,0.95)_100%)]" />
                <div className="absolute inset-0 landing-panel-shine" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/70">
                    <span>{poster.slotLabel}</span>
                    <span className={`h-2 w-2 rounded-full ${poster.accent}`} />
                  </div>
                  <div>
                    <p className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-white/55">
                      {poster.audience === "kids" ? "Featured kids pick" : "Featured title"}
                    </p>
                    <h3 className="text-3xl font-black tracking-tight">{poster.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{poster.meta}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <nav className={`relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-[calc(var(--app-safe-top)+0.75rem)] md:px-12 md:pt-6 lg:px-16 ${isHulu ? "pb-5" : "pb-6"}`}>
          <BrandWordmark className="text-3xl md:text-4xl" showMode />
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className={`bg-[var(--brand)] text-sm font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isHulu ? "rounded-full px-5 py-2.5" : "rounded px-5 py-2"}`}
          >
            Sign In
          </button>
        </nav>

        <div className={`relative z-10 mx-auto flex w-full max-w-7xl px-6 md:px-12 lg:px-16 ${isHulu ? "min-h-[min(82vh,760px)] items-center pb-14 pt-14 md:pt-16" : "min-h-[calc(var(--app-viewport-height)-5rem)] items-end pb-14 pt-24 md:pb-20 md:pt-32 lg:pb-24"}`}>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className={`max-w-3xl ${isHulu ? "rounded-[26px] border border-white/10 bg-[rgba(8,14,11,0.72)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:max-w-[34rem] md:p-8" : "md:max-w-[29rem] lg:max-w-[33rem] xl:max-w-[36rem]"}`}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[var(--brand)]" />
              Stream your next obsession
            </div>

            <h1 className="max-w-[11ch] text-[clamp(2.6rem,6vw,4.75rem)] font-black leading-[0.95] tracking-tight text-white">
              Unlimited movies, TV shows, and a home screen that feels made for tonight.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/80 md:text-xl">
              {siteSettings.landing_tagline || "Big premieres, comfort rewatches, kids picks, and smarter recommendations in one premium streaming experience."}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-lg">
              Ready to watch? Enter your email to create or restart your membership.
            </p>

            <form onSubmit={handleGetStarted} className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="landing-email">
                Email address
              </label>
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className={`min-h-14 flex-1 border border-white/20 bg-black/[0.55] px-5 text-base text-white placeholder:text-white/45 backdrop-blur-md transition-colors focus:border-white focus:outline-none focus:ring-2 focus:ring-white/[0.35] ${isHulu ? "rounded-full" : "rounded"}`}
              />
              <button
                type="submit"
                className={`inline-flex min-h-14 items-center justify-center gap-2 bg-[var(--brand)] px-8 text-lg font-bold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isHulu ? "rounded-full" : "rounded"}`}
              >
                Get Started
                <ChevronRight className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/70">
              {VALUE_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <span
                    key={point.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-[var(--brand)]" />
                    {point.label}
                  </span>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className={`border-b border-white/10 px-6 py-8 md:px-10 md:py-10 ${isHulu ? "bg-[#07100d]" : "bg-[#080808]"}`}>
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["New releases weekly", "Fresh picks on your home screen"],
            ["Profiles that feel personal", "Recommendations adapt to who is watching"],
            ["Kids mode included", "Safer rows and family-first browsing"],
            ["My List + history", "Pick up where you left off"],
            ["Built-in support pages", "FAQ, contact, speed test, and more"],
            ["Streaming-style polish", "Dark UI with a cinematic feel"],
          ].map(([title, subtitle]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] px-5 py-5"
            >
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm text-white/55">{subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">Why Subflix</p>
            <h2 className="mt-4 text-[clamp(2rem,4.8vw,3.6rem)] font-black tracking-tight">
              More than a login screen. It should feel like movie night already started.
            </h2>
          </div>

          <div className="space-y-16 md:space-y-20">
            {FEATURE_ROWS.map((feature, index) => (
              <div key={feature.title}>
                <div className="landing-section-divider mx-auto mb-10 h-px max-w-6xl opacity-80" />
                <div
                  className={`grid items-center gap-10 ${feature.reverse ? "md:grid-cols-[1.1fr_0.9fr]" : "md:grid-cols-[0.9fr_1.1fr]"}`}
                >
                  <div className={feature.reverse ? "md:order-2" : ""}>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-4 text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-tight tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-5 max-w-xl text-lg text-white/[0.72]">
                      {feature.desc}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {feature.stats.map((stat) => (
                        <span
                          key={stat}
                          className="rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm text-white/75"
                        >
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={feature.reverse ? "md:order-1" : ""}>
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.04 }}
                      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,#241317_0%,#111111_42%,#080808_100%)] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
                    >
                      <div className="rounded-[1.5rem] border border-white/10 bg-black/80 p-4 md:p-5">
                        <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-white/45">
                          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                          <span>Subflix preview</span>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,#3d0d14_0%,#11080a_65%,#050505_100%)] p-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Now Playing</p>
                                <p className="mt-2 text-2xl font-black">{feature.visualTitle}</p>
                              </div>
                              <MonitorPlay className="h-7 w-7 text-white/70" />
                            </div>
                            <p className="mt-10 max-w-xs text-sm text-white/65">{feature.visualSubtitle}</p>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((slot) => (
                              <div
                                key={slot}
                                className="rounded-[1.2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_100%)] p-3"
                              >
                                <div className="mb-8 aspect-[3/4] rounded-[0.9rem] bg-[linear-gradient(180deg,rgba(229,9,20,0.45)_0%,rgba(20,20,20,0.92)_100%)]" />
                                <div className="h-2 rounded-full bg-white/20" />
                                <div className="mt-2 h-2 w-3/4 rounded-full bg-white/10" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[radial-gradient(circle_at_top,#171717_0%,#090909_62%,#050505_100%)] px-6 py-16 md:px-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">Frequently Asked Questions</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-black tracking-tight">
              Questions? We’ve got answers.
            </h2>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/[0.55] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-6">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.question} value={item.question} className="border-white/10">
                  <AccordionTrigger className="py-5 text-lg font-semibold text-white hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-3xl pb-5 text-base leading-7 text-white/70">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-10 text-center">
            <p className="mb-6 text-base text-white/[0.72]">
              Ready to watch? Enter your email to create or restart your membership.
            </p>
            <form onSubmit={handleGetStarted} className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="landing-email-footer">
                Email address
              </label>
              <input
                id="landing-email-footer"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="min-h-14 flex-1 rounded border border-white/[0.18] bg-[#151515] px-5 text-base text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/25"
              />
              <button
                type="submit"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded bg-[var(--brand)] px-8 text-lg font-bold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Get Started
                <ChevronRight className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-black px-6 py-12 text-sm text-white/55 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-base text-white/65">Questions? Contact us.</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-y-4">
            {footerLinks.map((link) => (
              <Link
                key={link}
                to={SUPPORT_PAGES.find((page) => page.label === link)?.path || "/"}
                className="text-sm text-white/55 transition-colors hover:text-white hover:underline"
              >
                {link}
              </Link>
            ))}
          </div>

          <div className="landing-section-divider mt-10 h-px opacity-60" />
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--brand)]">SUBFLIX</p>
            <p className="text-xs text-white/40">Copyright © {new Date().getFullYear()} Subflix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
