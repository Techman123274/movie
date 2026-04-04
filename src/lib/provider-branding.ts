export type ProviderPresentation = {
  label: string;
  tagline: string;
  gradient: string;
  glow: string;
};

function normalizeProviderName(name: string) {
  return name.trim().toLowerCase();
}

export function getProviderPresentation(name: string): ProviderPresentation {
  const normalized = normalizeProviderName(name);

  if (normalized.includes("netflix")) {
    return {
      label: "Netflix",
      tagline: "Big franchise energy, prestige drops, and the endless-next-watch machine.",
      gradient: "linear-gradient(135deg, rgba(123, 7, 16, 0.96), rgba(24, 7, 9, 0.94))",
      glow: "rgba(229, 9, 20, 0.28)",
    };
  }

  if (normalized.includes("hulu")) {
    return {
      label: "Hulu",
      tagline: "Fresh TV, lean comedies, and fast binge picks.",
      gradient: "linear-gradient(135deg, rgba(6, 92, 55, 0.96), rgba(7, 17, 12, 0.94))",
      glow: "rgba(30, 255, 140, 0.22)",
    };
  }

  if (normalized.includes("disney")) {
    return {
      label: "Disney+",
      tagline: "Franchises, comfort rewatches, and blockbuster family nights.",
      gradient: "linear-gradient(135deg, rgba(13, 49, 110, 0.96), rgba(6, 11, 24, 0.94))",
      glow: "rgba(105, 170, 255, 0.22)",
    };
  }

  if (normalized.includes("apple")) {
    return {
      label: "Apple TV+",
      tagline: "Minimal, premium, and packed with high-end originals.",
      gradient: "linear-gradient(135deg, rgba(59, 59, 62, 0.96), rgba(9, 9, 11, 0.94))",
      glow: "rgba(255, 255, 255, 0.18)",
    };
  }

  if (normalized.includes("paramount")) {
    return {
      label: "Paramount+",
      tagline: "Studio comfort food, network favorites, and franchise staples.",
      gradient: "linear-gradient(135deg, rgba(10, 66, 143, 0.96), rgba(7, 13, 29, 0.94))",
      glow: "rgba(79, 145, 255, 0.22)",
    };
  }

  if (normalized.includes("max") || normalized.includes("hbo")) {
    return {
      label: "Max",
      tagline: "Prestige television, dark thrillers, and heavy-hitter movie nights.",
      gradient: "linear-gradient(135deg, rgba(59, 38, 96, 0.96), rgba(11, 7, 20, 0.94))",
      glow: "rgba(170, 110, 255, 0.22)",
    };
  }

  if (normalized.includes("crunchy")) {
    return {
      label: "Crunchyroll",
      tagline: "Anime-first nights, long arcs, and high-energy fandom picks.",
      gradient: "linear-gradient(135deg, rgba(183, 74, 8, 0.96), rgba(26, 10, 6, 0.94))",
      glow: "rgba(255, 150, 67, 0.24)",
    };
  }

  if (normalized.includes("tubi")) {
    return {
      label: "Tubi",
      tagline: "Unexpected free picks, deep cuts, and low-commitment discovery.",
      gradient: "linear-gradient(135deg, rgba(84, 28, 115, 0.96), rgba(17, 8, 27, 0.94))",
      glow: "rgba(203, 106, 255, 0.22)",
    };
  }

  if (normalized.includes("zeus")) {
    return {
      label: "Zeus",
      tagline: "Reality-heavy, loud, and made for high-drama watch sessions.",
      gradient: "linear-gradient(135deg, rgba(111, 65, 11, 0.96), rgba(21, 13, 6, 0.94))",
      glow: "rgba(255, 196, 83, 0.2)",
    };
  }

  if (normalized.includes("kayo")) {
    return {
      label: "Kayo",
      tagline: "Sports-first energy with nonstop live-event momentum.",
      gradient: "linear-gradient(135deg, rgba(17, 103, 85, 0.96), rgba(7, 18, 16, 0.94))",
      glow: "rgba(61, 236, 196, 0.22)",
    };
  }

  return {
    label: name,
    tagline: "A focused service lane with the strongest available movies and series underneath.",
    gradient: "linear-gradient(135deg, rgba(34, 34, 38, 0.96), rgba(9, 9, 11, 0.94))",
    glow: "rgba(255, 255, 255, 0.12)",
  };
}
