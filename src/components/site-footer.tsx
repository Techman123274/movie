import Link from "next/link";

const footerLinks = [
  { href: "/account", label: "My Profile" },
  { href: "/profiles", label: "Profiles" },
  { href: "/settings", label: "Settings" },
  { href: "/providers", label: "Where to Watch" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-7xl px-4 pb-10 sm:px-8">
      <div className="surface-strong rounded-[28px] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="display-font text-2xl text-white">Subflix</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Streaming mode</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Pick up where you left off, manage your profiles, and keep your favorite titles close.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="theme-nav-link rounded-full px-3 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
