export const SUPPORT_PAGES = [
  {
    path: "/faq",
    label: "FAQ",
    title: "Frequently Asked Questions",
    intro: "Quick answers for the most common questions about using Subflix, profiles, streaming, and account access.",
    sections: [
      {
        heading: "How do profiles work?",
        body: "Each account can create up to five profiles. Profiles keep their own watchlists, history, maturity settings, and kids restrictions so everyone can browse separately.",
      },
      {
        heading: "Why do some titles disappear on kids profiles?",
        body: "Kids profiles only show titles that pass the active content filter. Mature genres, adult metadata, and known adult animated shows are blocked automatically.",
      },
      {
        heading: "Do I need a TMDB key?",
        body: "Yes. Subflix uses TMDB to load artwork, metadata, search, and recommendations. You can connect it in Settings.",
      },
      {
        heading: "Can I use browser notifications?",
        body: "Yes. Enable notifications in Settings and allow permission when your browser asks for it.",
      },
    ],
  },
  {
    path: "/help-center",
    label: "Help Center",
    title: "Help Center",
    intro: "Find support for setup, playback, profiles, notifications, and everyday account questions.",
    sections: [
      {
        heading: "Getting started",
        body: "Open Settings, connect TMDB, create profiles, and start browsing. If you are using PowerShell on Windows, use npm.cmd commands when script execution is blocked.",
      },
      {
        heading: "Playback help",
        body: "If a title will not play, try refreshing the page, switching profiles, or checking whether that title is restricted by the active maturity setting.",
      },
      {
        heading: "Profile help",
        body: "You can create standard or kids profiles, switch between them from the avatar menu, and manage maturity settings from profile management.",
      },
      {
        heading: "Notifications help",
        body: "Release alerts and update notifications can be enabled or disabled in Settings. Browser notifications also require permission from your browser.",
      },
    ],
  },
  {
    path: "/ways-to-watch",
    label: "Ways to Watch",
    title: "Ways to Watch",
    intro: "Subflix is designed to work well across desktop and mobile browsers with a streaming-first layout.",
    sections: [
      {
        heading: "Desktop browsers",
        body: "Use modern versions of Chrome, Edge, Firefox, or Safari for the best playback and notification support.",
      },
      {
        heading: "Mobile browsers",
        body: "Subflix adapts for smaller screens so browsing, profile switching, and playback controls remain usable on phones and tablets.",
      },
      {
        heading: "Recommended setup",
        body: "For the best experience, keep your browser up to date, allow autoplay where supported, and use a stable connection for HD playback.",
      },
    ],
  },
  {
    path: "/privacy",
    label: "Privacy",
    title: "Privacy",
    intro: "Subflix stores only the data needed to personalize your experience and keep profiles working smoothly.",
    sections: [
      {
        heading: "What is stored",
        body: "Depending on your setup, Subflix may store watch history, watchlist items, active profile selection, local settings, and notification preferences.",
      },
      {
        heading: "Local browser storage",
        body: "Some settings, such as playback preferences and browser notification state, are stored locally in your browser for faster access.",
      },
      {
        heading: "Third-party services",
        body: "Subflix uses TMDB for catalog metadata and may use authentication or database providers such as Clerk and Supabase depending on your configuration.",
      },
    ],
  },
  {
    path: "/contact-us",
    label: "Contact Us",
    title: "Contact Us",
    intro: "Need a hand? Reach out with setup issues, playback problems, or account questions.",
    sections: [
      {
        heading: "Support email",
        body: "support@subflix.app",
      },
      {
        heading: "What to include",
        body: "Tell us what page you were on, what profile type you were using, what you expected to happen, and what actually happened.",
      },
      {
        heading: "Response time",
        body: "For most product questions, expect a response within one to two business days.",
      },
    ],
  },
  {
    path: "/speed-test",
    label: "Speed Test",
    title: "Speed Test",
    intro: "A steady connection helps Subflix load artwork faster and keep playback smoother.",
    sections: [
      {
        heading: "Recommended speed",
        body: "For a comfortable HD streaming experience, aim for a stable broadband connection and avoid heavy downloads in the background.",
      },
      {
        heading: "If playback buffers",
        body: "Try pausing other downloads, moving closer to your router, or refreshing the player after your network settles.",
      },
      {
        heading: "Browser checks",
        body: "Close unused tabs, restart the browser if playback feels sluggish, and make sure hardware acceleration is enabled where appropriate.",
      },
    ],
  },
  {
    path: "/legal-notices",
    label: "Legal Notices",
    title: "Legal Notices",
    intro: "Important legal and attribution information for the Subflix app experience.",
    sections: [
      {
        heading: "Trademark notice",
        body: "Subflix is an independent project experience and is not affiliated with Netflix. Names, brands, and services referenced in the app belong to their respective owners.",
      },
      {
        heading: "Catalog attribution",
        body: "Movie and TV metadata, images, and related catalog information may be provided by TMDB depending on your app configuration.",
      },
      {
        heading: "No warranty",
        body: "The app is provided as-is for personal use and testing. Availability, providers, and metadata may change over time.",
      },
    ],
  },
];

export const getSupportPageByPath = (pathname) =>
  SUPPORT_PAGES.find((page) => page.path === pathname) || null;
