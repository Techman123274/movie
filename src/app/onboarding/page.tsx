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
      <PageFrame>
        <UnavailablePanel
          title="Profile onboarding is unavailable."
          message="Real user onboarding needs Supabase read and service-role credentials."
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
      <PageFrame>
        <UnavailablePanel
          title="Profiles table is missing."
          message="Apply the SQL in supabase/schema.sql to your Supabase project so the public.profiles table and provider_region column exist before onboarding can create a profile."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHero
        eyebrow="Onboarding"
        title="Create the profile that powers your v1 experience."
        description="Pick a name, accent, and region once, then jump straight into browse with a cleaner account setup."
      />
      {params.error ? (
        <section className="surface rounded-[28px] p-5 text-sm leading-6 text-[var(--color-danger)]">
          {params.error === "invalid-profile"
            ? "The submitted profile data was invalid. Please review the form and try again."
            : `Onboarding error: ${params.error}`}
        </section>
      ) : null}
      <ProfileOnboardingForm />
    </PageFrame>
  );
}
