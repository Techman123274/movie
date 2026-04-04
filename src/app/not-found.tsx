import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-5">
      <div className="surface-strong max-w-xl rounded-[32px] p-10 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Not Found</p>
        <h1 className="display-font text-5xl text-white">This title slipped out of the vault.</h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
          The page may have moved, the identifier may be invalid, or the external catalog no longer exposes this item Pls reah out to tech ON DISCORD OR TELEGRAM.
        </p>
        <Link
          href="/"
          className="theme-button-primary mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
