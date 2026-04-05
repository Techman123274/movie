import Link from "next/link";

type SiteMaintenanceScreenProps = {
  message: string;
  updatedAt: string;
  showAdminLink?: boolean;
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SiteMaintenanceScreen({
  message,
  updatedAt,
  showAdminLink = false,
}: SiteMaintenanceScreenProps) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <div className="maintenance-shell surface-strong relative w-full max-w-4xl overflow-hidden rounded-[36px] p-8 sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.16),transparent_42%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.38em] text-[var(--color-brand-strong)]">Under construction</p>
          <h1 className="display-font mt-5 text-5xl leading-none text-white sm:text-7xl">
            Subflix is being tuned behind the curtain.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
            {message}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="surface rounded-[24px] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Status</p>
              <p className="mt-2 text-xl text-white">Maintenance mode is live</p>
            </div>
            <div className="surface rounded-[24px] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Last update</p>
              <p className="mt-2 text-xl text-white">{formatUpdatedAt(updatedAt)}</p>
            </div>
            <div className="surface rounded-[24px] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Return path</p>
              <p className="mt-2 text-xl text-white">Check back shortly</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="theme-button-secondary rounded-full px-6 py-3 text-sm text-white">
              Refresh home
            </Link>
            {showAdminLink ? (
              <Link href="/admin" className="theme-button-primary rounded-full px-6 py-3 text-sm font-semibold">
                Open admin console
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
