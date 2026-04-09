import { Link } from "react-router-dom";
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
    <footer className="bg-[radial-gradient(circle_at_top,#151515_0%,#0a0a0a_65%)] border-t border-white/5 mt-16 px-4 md:px-12 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <p className="text-[#E50914] font-black text-3xl tracking-tight">SUBFLIX</p>
            <p className="text-gray-400 text-sm mt-3 max-w-lg">
              Support, privacy, legal, and device help pages for the full Subflix experience.
            </p>
          </div>
          <Link
            to="/help-center"
            className="self-start md:self-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors"
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
                  className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
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
