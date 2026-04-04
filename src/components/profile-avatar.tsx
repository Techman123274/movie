import Image from "next/image";
import { isImageAvatar } from "@/lib/profile-assets";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  avatar: string;
  name: string;
  accent: string;
  className?: string;
  textClassName?: string;
  sizes?: string;
};

export function ProfileAvatar({
  avatar,
  name,
  accent,
  className,
  textClassName,
  sizes = "72px",
}: ProfileAvatarProps) {
  const imageAvatar = isImageAvatar(avatar);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] text-white shadow-[0_18px_34px_rgba(0,0,0,0.28)]",
        className,
      )}
      style={imageAvatar ? undefined : { backgroundColor: accent }}
    >
      {imageAvatar ? (
        <Image src={avatar} alt={`${name} avatar`} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center font-semibold", textClassName)}>{avatar}</div>
      )}
    </div>
  );
}
