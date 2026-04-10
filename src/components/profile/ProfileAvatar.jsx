import { AvatarArt } from "@/lib/avatar-options";
import { getProfileAvatarProps } from "@/lib/avatar-assets";

export default function ProfileAvatar({
  profile,
  avatarAssets = [],
  size = 40,
  className = "",
  fallbackText = "",
}) {
  const { avatarColor, avatarIndex, imageUrl, label } = getProfileAvatarProps(profile, avatarAssets);

  return (
    <div
      className={`overflow-hidden rounded ${className}`.trim()}
      style={{ width: size, height: size, backgroundColor: avatarColor }}
      aria-label={label}
      title={label}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full object-cover"
          draggable="false"
        />
      ) : profile ? (
        <AvatarArt avatarIndex={avatarIndex} color={avatarColor} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--brand)] text-sm font-bold text-white">
          {String(fallbackText || "U").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
