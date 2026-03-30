import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-8">
      <section className="surface-strong w-full max-w-md rounded-[32px] p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Start Watching</p>
        <h1 className="display-font mt-3 text-4xl text-white">Create your Subflix account</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          Set up Clerk sign-up so mobile and desktop users can move straight into the app after creating an account.
        </p>
        <div className="mt-6">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/browse" />
        </div>
      </section>
    </main>
  );
}
