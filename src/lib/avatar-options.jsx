const avatarImageModules = import.meta.glob("../assets/avatars/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const formatAvatarLabel = (path) =>
  path
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Profile avatar";

const IMAGE_AVATAR_OPTIONS = Object.entries(avatarImageModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([path, src]) => ({
    type: "image",
    src,
    alt: `${formatAvatarLabel(path)} profile avatar`,
    file_name: path.split("/").pop() || "",
  }));

export const SVG_AVATAR_OPTIONS = [
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="38" r="22" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="95" rx="35" ry="28" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="36" r="20" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="93" rx="33" ry="26" fill="rgba(255,255,255,0.85)" />
        <rect x="32" y="52" width="36" height="4" rx="2" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="36" r="20" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="93" rx="33" ry="26" fill="rgba(255,255,255,0.85)" />
        <rect x="28" y="18" width="44" height="8" rx="4" fill="rgba(255,255,255,0.85)" />
        <rect x="22" y="24" width="56" height="5" rx="2.5" fill="rgba(255,255,255,0.7)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="36" r="20" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="93" rx="33" ry="26" fill="rgba(255,255,255,0.85)" />
        <path d="M30 32 Q50 18 70 32" stroke="rgba(255,255,255,0.85)" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <polygon points="50,15 61,35 83,38 67,54 71,76 50,65 29,76 33,54 17,38 39,35" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <polygon points="50,10 85,50 50,90 15,50" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="45" r="25" fill="rgba(255,255,255,0.85)" />
        <polygon points="25,30 35,10 45,30" fill="rgba(255,255,255,0.85)" />
        <polygon points="55,30 65,10 75,30" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="90" rx="28" ry="18" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
  {
    type: "svg",
    content: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <circle cx="50" cy="52" r="20" fill="rgba(255,255,255,0.85)" />
        <polygon points="20,45 35,20 50,38 65,20 80,45 80,55 20,55" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="50" cy="92" rx="30" ry="20" fill="rgba(255,255,255,0.85)" />
      </svg>
    ),
  },
];

export const AVATAR_COLORS = [
  "#2d67b5", "#c6432a", "#5b6e3f", "#8c5ebf",
  "#1a8a6e", "#c48a12", "#b53060", "#2a7a9b",
];

export const SVG_AVATAR_COUNT = SVG_AVATAR_OPTIONS.length;
export const AVATAR_OPTIONS = [...SVG_AVATAR_OPTIONS, ...IMAGE_AVATAR_OPTIONS];
export const DEFAULT_PROFILE_AVATAR_INDEX = SVG_AVATAR_OPTIONS.length;
export const AVATAR_IMAGE_FOLDER = "src/assets/avatars";

export const LOCAL_BUILTIN_AVATAR_ASSETS = IMAGE_AVATAR_OPTIONS.map((option, index) => ({
  id: `local-builtin-${index + 1}`,
  asset_kind: "builtin",
  public_url: option.src,
  storage_path: `system/${option.file_name}`,
  label: option.alt,
  legacy_avatar_index: SVG_AVATAR_OPTIONS.length + index,
  is_active: true,
}));

export const getLegacyAvatarOption = (avatarIndex = 0) => {
  if (!AVATAR_OPTIONS.length) {
    return null;
  }

  if (avatarIndex >= SVG_AVATAR_OPTIONS.length && IMAGE_AVATAR_OPTIONS.length > 0) {
    const imageOffset = (avatarIndex - SVG_AVATAR_OPTIONS.length) % IMAGE_AVATAR_OPTIONS.length;
    return IMAGE_AVATAR_OPTIONS[(imageOffset + IMAGE_AVATAR_OPTIONS.length) % IMAGE_AVATAR_OPTIONS.length];
  }

  const safeIndex = ((avatarIndex % AVATAR_OPTIONS.length) + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length;
  return AVATAR_OPTIONS[safeIndex];
};

export function AvatarArt({ avatarIndex = 0, color = AVATAR_COLORS[0] }) {
  const option = getLegacyAvatarOption(avatarIndex) || SVG_AVATAR_OPTIONS[0];

  if (option?.type === "image") {
    return (
      <img
        src={option.src}
        alt={option.alt}
        className="h-full w-full object-cover"
        draggable="false"
      />
    );
  }

  return (
    <div className="h-full w-full" style={{ backgroundColor: color }}>
      {option?.content}
    </div>
  );
}
