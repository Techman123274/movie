"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { DEFAULT_PROFILE_AVATAR, PROFILE_AVATAR_OPTIONS } from "@/lib/profile-assets";
import { cn } from "@/lib/utils";

type ProfileAvatarPickerProps = {
  name?: string;
  initialAvatar?: string;
};

async function fileToAvatarDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image could not be loaded."));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);
    return canvas.toDataURL("image/webp", 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfileAvatarPicker({
  name = "avatar",
  initialAvatar = DEFAULT_PROFILE_AVATAR,
}: ProfileAvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCustomAvatar =
    selectedAvatar.startsWith("data:image/") && !PROFILE_AVATAR_OPTIONS.some((option) => option.src === selectedAvatar);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose a PNG, JPG, WEBP, or another image file.");
      return;
    }

    try {
      const nextAvatar = await fileToAvatarDataUrl(file);
      setSelectedAvatar(nextAvatar);
      setError(null);
    } catch {
      setError("That image could not be prepared. Try another file.");
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={selectedAvatar} />
      <div className="grid gap-3 sm:grid-cols-3">
        {PROFILE_AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selectedAvatar === avatar.src;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => {
                setSelectedAvatar(avatar.src);
                setError(null);
              }}
              className={cn(
                "surface text-left rounded-[24px] border border-white/10 p-4 transition",
                isSelected && "border-[var(--color-brand-line)] bg-[var(--color-brand-soft)]",
              )}
            >
              <span className="flex items-center gap-3">
                <ProfileAvatar
                  avatar={avatar.src}
                  name={avatar.label}
                  accent="#1b1b1f"
                  className="h-14 w-14 rounded-[18px]"
                  sizes="56px"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{avatar.label}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    Preset
                  </span>
                </span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "surface rounded-[24px] border border-dashed border-white/14 p-4 text-left transition hover:border-white/22",
            isCustomAvatar && "border-[var(--color-brand-line)] bg-[var(--color-brand-soft)]",
          )}
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-black/20">
              {isCustomAvatar ? (
                <ProfileAvatar
                  avatar={selectedAvatar}
                  name="Custom avatar"
                  accent="#1b1b1f"
                  className="h-14 w-14 rounded-[18px]"
                  sizes="56px"
                />
              ) : (
                <ImagePlus size={22} className="text-[var(--color-brand-strong)]" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">Upload your own</span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                PNG, JPG, WEBP
              </span>
            </span>
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        Upload any square or portrait image and Subflix will crop it into a profile avatar.
      </p>
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
