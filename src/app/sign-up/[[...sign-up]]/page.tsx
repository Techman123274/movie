import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { CinematicGallery } from "@/components/cinematic-gallery";
import { recordSiteVisit } from "@/lib/site-analytics";
import { getHomePageData } from "@/lib/tmdb";

export default async function SignUpPage() {
  const { userId } = await auth();
  await recordSiteVisit({ path: "/sign-up", signedIn: Boolean(userId) });
  const data = await getHomePageData();

  return (
    <main className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.02fr)_430px]">
      <CinematicGallery
        items={data?.featuredSlides ?? []}
        eyebrow="Create account"
        title="A strong first impression starts before the browse page."
        description="Subflix stays image-led from the first visit through account creation, so the service already feels premium before the catalog opens."
      />
      <section className="surface-strong w-full rounded-[32px] p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Start Watching</p>
        <h1 className="display-font mt-3 text-4xl text-white">Create your Subflix account</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Create your account and move straight into a cleaner, more personal streaming experience.
        </p>
        <div className="mt-6">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/browse" />
        </div>
      </section>
    </main>
  );
}
