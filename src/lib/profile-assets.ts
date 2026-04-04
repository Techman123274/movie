export const PROFILE_AVATAR_OPTIONS = [
  { id: "cinema", label: "Cinema", src: "/avatars/cinema-mask.svg" },
  { id: "ember", label: "Ember", src: "/avatars/ember-glow.svg" },
  { id: "nova", label: "Nova", src: "/avatars/nova-pop.svg" },
  { id: "gold", label: "Gold", src: "/avatars/gold-lounge.svg" },
  { id: "night", label: "Night", src: "/avatars/night-run.svg" },
  { id: "mint", label: "Mint", src: "/avatars/mint-wave.svg" },
] as const;

export const DEFAULT_PROFILE_AVATAR = PROFILE_AVATAR_OPTIONS[0].src;

export function isImageAvatar(avatar: string) {
  return (
    avatar.startsWith("/") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:image/")
  );
}

export function isSupportedAvatarValue(avatar: string) {
  return isImageAvatar(avatar) || avatar.trim().length <= 2;
}
