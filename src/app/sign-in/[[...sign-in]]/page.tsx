import { SignIn } from "@clerk/nextjs";
import { CinematicGallery } from "@/components/cinematic-gallery";
import { getHomePageData } from "@/lib/tmdb";

export default async function SignInPage() {
  const data = await getHomePageData();

  return (
    <main className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.02fr)_430px]">
      <CinematicGallery
        items={data?.featuredSlides ?? []}
        eyebrow="Member access"
        title="Your next watch should already look worth opening."
        description="Rich artwork on the way in, profiles and progress on the way back out. The whole sign-in flow should still feel like part of the product."
      />
      <section className="surface-strong w-full rounded-[32px] p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Welcome Back</p>
        <h1 className="display-font mt-3 text-4xl text-white">Log in to Subflix</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Sign in to unlock profiles, continue watching, and a more personal home screen.
        </p>
        <div className="mt-6">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/browse" />
        </div>
      </section>
    </main>
  );
}
