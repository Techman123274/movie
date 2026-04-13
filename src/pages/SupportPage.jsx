import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  CircleHelp,
  ContactRound,
  FileLock2,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { SUPPORT_PAGES } from "@/lib/support-pages";

const PAGE_META = {
  "/faq": {
    icon: CircleHelp,
    accent: "from-[#6d141a]/80 via-[#2a0c10] to-[#0a0a0a]",
    tag: "FAQ",
  },
  "/help-center": {
    icon: Wrench,
    accent: "from-[#68200f]/80 via-[#23110c] to-[#0a0a0a]",
    tag: "Help",
  },
  "/ways-to-watch": {
    icon: MonitorSmartphone,
    accent: "from-[#0d3553]/80 via-[#0c1a24] to-[#0a0a0a]",
    tag: "Devices",
  },
  "/privacy": {
    icon: ShieldCheck,
    accent: "from-[#14452f]/80 via-[#0d1b15] to-[#0a0a0a]",
    tag: "Privacy",
  },
  "/contact-us": {
    icon: ContactRound,
    accent: "from-[#4f1236]/80 via-[#1e0b16] to-[#0a0a0a]",
    tag: "Contact",
  },
  "/legal-notices": {
    icon: FileLock2,
    accent: "from-[#4d450e]/80 via-[#191708] to-[#0a0a0a]",
    tag: "Legal",
  },
};

export default function SupportPage({ page, standalone = false }) {
  const [openFaq, setOpenFaq] = useState(0);

  if (!page) {
    return null;
  }

  const meta = PAGE_META[page.path] || PAGE_META["/faq"];
  const Icon = meta.icon;

  return (
    <div className={`min-h-[var(--app-viewport-height)] bg-[var(--app-bg)] text-white ${standalone ? "" : "app-page app-page-animate"}`}>
      {standalone && (
        <div className="border-b border-white/10 px-4 pb-6 pt-[calc(var(--app-safe-top)+1rem)] md:px-12">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <BrandWordmark className="text-3xl" />
            <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors">
              Back
            </Link>
          </div>
        </div>
      )}

      <section className={`px-4 md:px-12 py-12 bg-gradient-to-b ${meta.accent}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[var(--brand)]">{meta.tag}</p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">{page.title}</h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">{page.intro}</p>
            </div>
            <div className="w-20 h-20 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center">
              <Icon className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {SUPPORT_PAGES.filter((supportPage) => supportPage.path !== "/speed-test").map((supportPage) => (
              <Link
                key={supportPage.path}
                to={supportPage.path}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  supportPage.path === page.path
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/20 text-gray-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {supportPage.label}
              </Link>
            ))}
            <Link
              to="/speed-test"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-gray-300 hover:border-white/30 hover:text-white transition-colors"
            >
              Speed Test
            </Link>
          </div>
        </div>
      </section>

      <div className="px-4 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          {page.path === "/faq" && (
            <div className="grid gap-4">
              {page.sections.map((section, index) => {
                const isOpen = openFaq === index;
                return (
                  <section
                    key={section.heading}
                    className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">Question</p>
                        <h2 className="text-xl font-bold">{section.heading}</h2>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6">
                        <div className="h-px bg-white/10 mb-5" />
                        <p className="text-gray-300 leading-relaxed">{section.body}</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {page.path === "/help-center" && (
            <div className="grid gap-4 md:grid-cols-2">
              {page.sections.map((section) => (
                <InfoCard key={section.heading} heading={section.heading} body={section.body} />
              ))}
              <InfoCard
                heading="Quick actions"
                body="Open Settings for notifications and playback preferences, use Manage Profiles for kids restrictions, and connect TMDB if your catalog looks empty."
              />
              <InfoCard
                heading="Need more help?"
                body="Use the Contact Us page to send a support request with your device, browser, profile type, and the page where the issue happened."
              />
            </div>
          )}

          {page.path === "/ways-to-watch" && (
            <div className="grid gap-4 md:grid-cols-3">
              <DeviceCard title="Desktop" subtitle="Chrome, Edge, Firefox, Safari" note={page.sections[0]?.body} />
              <DeviceCard title="Mobile" subtitle="Phones and tablets" note={page.sections[1]?.body} />
              <DeviceCard title="Best Experience" subtitle="Updated browser + stable network" note={page.sections[2]?.body} />
            </div>
          )}

          {page.path === "/privacy" && (
            <div className="grid gap-4 md:grid-cols-3">
              {page.sections.map((section) => (
                <PolicyCard key={section.heading} heading={section.heading} body={section.body} />
              ))}
            </div>
          )}

          {page.path === "/contact-us" && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-3">Contact</p>
                <h2 className="text-2xl font-bold mb-4">Talk to the Subflix team</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Reach out for setup help, playback issues, profile questions, or legal/footer requests.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href="mailto:support@subflix.app?subject=Subflix%20Support"
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/25 transition-colors"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[var(--brand)]" />
                      <p className="font-semibold">Email support</p>
                    </div>
                    <p className="text-gray-400 text-sm">support@subflix.app</p>
                  </a>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold mb-2">Include in your message</p>
                    <p className="text-gray-400 text-sm">Browser, page, profile type, and a short description of the problem.</p>
                  </div>
                </div>
              </section>
              <div className="grid gap-4">
                {page.sections.map((section) => (
                  <InfoCard key={section.heading} heading={section.heading} body={section.body} />
                ))}
              </div>
            </div>
          )}

          {page.path === "/legal-notices" && (
            <div className="grid gap-4">
              {page.sections.map((section) => (
                <section
                  key={section.heading}
                  className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6 md:p-8"
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-3">Notice</p>
                  <h2 className="text-2xl font-bold mb-3">{section.heading}</h2>
                  <p className="text-gray-300 leading-relaxed max-w-4xl">{section.body}</p>
                </section>
              ))}
            </div>
          )}

          {!["/faq", "/help-center", "/ways-to-watch", "/privacy", "/contact-us", "/legal-notices"].includes(page.path) && (
            <div className="grid gap-4 md:grid-cols-2">
              {page.sections.map((section) => (
                <InfoCard key={section.heading} heading={section.heading} body={section.body} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ heading, body }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-3">Guide</p>
      <h2 className="text-xl font-bold mb-3">{heading}</h2>
      <p className="text-gray-300 leading-relaxed">{body}</p>
    </section>
  );
}

function DeviceCard({ title, subtitle, note }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4">
        <MonitorSmartphone className="w-5 h-5 text-[var(--brand)]" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-4">{subtitle}</p>
      <p className="text-gray-300 leading-relaxed">{note}</p>
    </section>
  );
}

function PolicyCard({ heading, body }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#141414_0%,#0f0f0f_100%)] p-6">
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-4">
        <ShieldCheck className="w-5 h-5 text-[var(--brand)]" />
      </div>
      <h2 className="text-xl font-bold mb-3">{heading}</h2>
      <p className="text-gray-300 leading-relaxed">{body}</p>
    </section>
  );
}
