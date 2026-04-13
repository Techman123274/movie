import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import AvatarAssetPicker from "@/components/profile/AvatarAssetPicker";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import {
  buildProfileAvatarSelection,
  createProfilePayloadWithAvatar,
  getDefaultAvatarColor,
  uploadAvatarAsset,
} from "@/lib/avatar-assets";
import { AVATAR_COLORS, DEFAULT_PROFILE_AVATAR_INDEX } from "@/lib/avatar-options";
import { MATURITY_OPTIONS } from "@/lib/preferences";

export default function ProfileEditorModal({
  profile,
  avatarAssets = [],
  onSave,
  onClose,
}) {
  const [name, setName] = useState(profile?.name || "");
  const [color, setColor] = useState(profile?.avatar_color || AVATAR_COLORS[0]);
  const [selectedLegacyIndex, setSelectedLegacyIndex] = useState(profile?.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX);
  const [selectedAssetId, setSelectedAssetId] = useState(profile?.avatar_asset_id || null);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState(profile?.avatar_asset_url || null);
  const [selectedAssetLabel, setSelectedAssetLabel] = useState(profile?.avatar_asset_label || "");
  const [isKids, setIsKids] = useState(Boolean(profile?.is_kids));
  const [maturityRating, setMaturityRating] = useState(profile?.maturity_rating || "all");
  const [saving, setSaving] = useState(false);
  const [availableAssets, setAvailableAssets] = useState(avatarAssets);

  useEffect(() => {
    setAvailableAssets(avatarAssets);
    const selection = buildProfileAvatarSelection(profile, avatarAssets);
    setSelectedAssetId(selection.assetId);
    setSelectedAssetUrl(selection.assetUrl);
    setSelectedAssetLabel(selection.assetLabel);
    setSelectedLegacyIndex(selection.avatarIndex);
    setColor(selection.avatarColor || getDefaultAvatarColor(selection.avatarIndex));
  }, [profile, avatarAssets]);

  const selectedProfilePreview = {
    ...profile,
    name: name || profile?.name || "Profile",
    avatar_color: color,
    avatar_index: selectedLegacyIndex,
    avatar_asset_id: selectedAssetId,
    avatar_asset_url: selectedAssetUrl,
    avatar_asset_label: selectedAssetLabel,
  };

  const handleUpload = async (file) => {
    const asset = await uploadAvatarAsset(file, `${name || "Profile"} upload`).catch(() => null);
    if (!asset) {
      return;
    }

    setAvailableAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setSelectedAssetId(asset.id);
    setSelectedAssetUrl(asset.public_url);
    setSelectedAssetLabel(asset.label);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    const payload = createProfilePayloadWithAvatar({
      baseProfile: profile,
      avatarSelection: {
        assetId: selectedAssetId,
        assetUrl: selectedAssetUrl,
        assetLabel: selectedAssetLabel,
        avatarColor: color,
        avatarIndex: selectedLegacyIndex,
      },
      name: name.trim(),
      isKids,
      maturityRating: isKids && maturityRating === "all" ? "older_kids" : maturityRating,
    });

    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 px-4 pb-[calc(var(--app-safe-bottom)+0.75rem)] pt-[calc(var(--app-safe-top)+0.75rem)]">
      <div className="mx-auto flex h-full w-full max-w-xl items-start justify-center">
        <motion.div
          className="flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel-bg)] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-bold text-white">{profile?.id ? "Edit Profile" : "Add Profile"}</h2>
            <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-6 flex justify-center">
              <ProfileAvatar profile={selectedProfilePreview} avatarAssets={availableAssets} size={100} className="rounded-xl" />
            </div>

            <div className="mb-5">
              <label className="mb-1 block text-sm text-gray-400">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition-colors focus:border-[var(--brand)]"
                placeholder="Profile name"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm text-gray-400">Accent color</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((nextColor) => (
                  <button
                    key={nextColor}
                    type="button"
                    onClick={() => setColor(nextColor)}
                    className="h-9 w-9 rounded transition-transform hover:scale-110"
                    style={{
                      backgroundColor: nextColor,
                      outline: color === nextColor ? "3px solid white" : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <AvatarAssetPicker
                avatarAssets={availableAssets}
                avatarColor={color}
                selectedAssetId={selectedAssetId}
                selectedLegacyIndex={selectedLegacyIndex}
                onSelectAsset={(asset) => {
                  setSelectedAssetId(asset.id);
                  setSelectedAssetUrl(asset.public_url);
                  setSelectedAssetLabel(asset.label);
                  setSelectedLegacyIndex(asset.legacy_avatar_index ?? selectedLegacyIndex);
                }}
                onSelectLegacy={(legacyIndex) => {
                  setSelectedAssetId(null);
                  setSelectedAssetUrl(null);
                  setSelectedAssetLabel("");
                  setSelectedLegacyIndex(legacyIndex);
                }}
                onUpload={handleUpload}
                onDeleteAsset={(asset) => {
                  setAvailableAssets((current) => current.filter((item) => item.id !== asset.id));
                  if (selectedAssetId === asset.id) {
                    setSelectedAssetId(null);
                    setSelectedAssetUrl(null);
                    setSelectedAssetLabel("");
                  }
                }}
                allowDeleteUploads
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm text-gray-400">Profile Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsKids(false)}
                  className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                    !isKids ? "border-white bg-white text-black" : "border-white/10 text-gray-300 hover:border-white"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsKids(true);
                    if (maturityRating === "all") {
                      setMaturityRating("older_kids");
                    }
                  }}
                  className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isKids ? "border-white bg-white text-black" : "border-white/10 text-gray-300 hover:border-white"
                  }`}
                >
                  Kids
                </button>
              </div>
            </div>

            <div className="mb-1">
              <label className="mb-2 block text-sm text-gray-400">Allowed Maturity</label>
              <select
                value={isKids && maturityRating === "all" ? "older_kids" : maturityRating}
                onChange={(event) => setMaturityRating(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-base text-white outline-none transition-colors focus:border-[var(--brand)]"
              >
                {MATURITY_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={isKids && option.value === "all"}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/25 px-5 py-4">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 font-bold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-gray-300 transition-colors hover:border-white hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
