import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-8">
      <section className="surface-strong w-full max-w-md rounded-[32px] p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Welcome Back</p>
        <h1 className="display-font mt-3 text-4xl text-white">Log in to Subflix</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Sign in with Clerk to access profiles, continue watching, and region-aware discovery.
        </p>
        <div className="mt-6">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/browse" />
        </div>
      </section>
    </main>
  );
}
