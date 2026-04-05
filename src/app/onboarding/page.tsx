import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { ProfileOnboardingForm } from "@/components/profile-onboarding-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { hasSupabaseAdminCredentials, hasSupabaseCredentials } from "@/lib/env";
import { getProfilesForUser } from "@/lib/persistence";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { userId } = await auth();
  const params = await searchParams;

  if (!userId) {
    redirect("/");
  }

  if (!hasSupabaseCredentials() || !hasSupabaseAdminCredentials()) {
    return (
      <PageFrame analyticsPath="/onboarding">
        <UnavailablePanel
          title="Profile onboarding is unavailable."
          message="Profile setup is temporarily unavailable. Please try again shortly."
        />
      </PageFrame>
    );
  }

  const profileLookup = await getProfilesForUser(userId);
  const profiles = profileLookup.profiles;

  if (profiles.length) {
    redirect("/browse");
  }

  if (profileLookup.readinessIssue === "missing-profiles-table" || params.error === "missing-profiles-table") {
    return (
      <PageFrame analyticsPath="/onboarding">
        <UnavailablePanel
          title="Profile setup is unavailable."
          message="We could not finish account setup right now. Please try again shortly."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame analyticsPath="/onboarding">
      <PageHero
        eyebrow="Onboarding"
        title="Create the profile that sets the tone for your watch experience."
        description="Choose a name, look, and region, then jump straight into a more personal home screen."
      />
      {params.error ? (
        <section className="surface rounded-[28px] p-5 text-sm leading-6 text-[var(--color-danger)]">
          {params.error === "invalid-profile"
            ? "The submitted profile data was invalid. Please review the form and try again."
            : "We could not create your profile right now. Please try again."}
        </section>
      ) : null}
      <ProfileOnboardingForm />
    </PageFrame>
  );
}
