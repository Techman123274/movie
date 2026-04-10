import { Link } from "react-router-dom";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { SUPPORT_PAGES } from "@/lib/support-pages";

const FOOTER_COLUMNS = [
  ["FAQ", "Help Center"],
  ["Ways to Watch", "Privacy"],
  ["Contact Us", "Speed Test"],
  ["Legal Notices"],
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/5 bg-[var(--footer-bg)] px-4 py-12 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <BrandWordmark className="text-3xl" showMode />
            <p className="mt-3 max-w-lg text-sm text-[var(--text-secondary)]">
              Support, privacy, legal, and device help pages for the full Subflix experience.
            </p>
          </div>
          <Link
            to="/help-center"
            className="self-start rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/30 hover:text-white md:self-auto"
          >
            Open Help Center
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.join("-")} className="flex flex-col gap-3">
              {column.map((label) => (
                <Link
                  key={label}
                  to={SUPPORT_PAGES.find((page) => page.label === label)?.path || "/"}
                  className="text-sm text-gray-500 transition-colors hover:text-gray-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="h-px bg-white/5 mb-6" />
        <p className="text-gray-600 text-xs">Copyright {year} Subflix. All rights reserved.</p>
      </div>
    </footer>
  );
}
