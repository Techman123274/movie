import Link from "next/link";

const footerLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/movies", label: "Movies" },
  { href: "/shows", label: "Series" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Providers" },
  { href: "/search", label: "Search" },
  { href: "/account", label: "Account" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-7xl px-4 pb-10 sm:px-8">
      <div className="surface rounded-[28px] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display-font text-2xl text-white">Subflix</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Subflix.tech brings movies, series, and sports into one cleaner streaming experience.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--color-text-muted)] transition hover:text-white"
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
