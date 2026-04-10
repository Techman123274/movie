import { Upload } from "lucide-react";
import { AvatarArt, SVG_AVATAR_COUNT } from "@/lib/avatar-options";
import { deleteAvatarAsset } from "@/lib/avatar-assets";

export default function AvatarAssetPicker({
  avatarAssets = [],
  avatarColor,
  selectedAssetId,
  selectedLegacyIndex,
  onSelectAsset,
  onSelectLegacy,
  onUpload,
  onDeleteAsset,
  allowDeleteUploads = false,
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm text-gray-400">Database avatars</label>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]">
            <Upload className="h-4 w-4" />
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onUpload?.(file);
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {avatarAssets.map((asset) => {
            const isSelected = selectedAssetId === asset.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelectAsset?.(asset)}
                className={`relative h-12 w-12 overflow-hidden rounded-lg border transition-transform hover:scale-105 ${
                  isSelected ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.2)]" : "border-white/10"
                }`}
                title={asset.label}
              >
                <img src={asset.public_url} alt={asset.label} className="h-full w-full object-cover" />
                {allowDeleteUploads && asset.asset_kind === "upload" && (
                  <span
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      await deleteAvatarAsset(asset.id).catch(() => null);
                      onDeleteAsset?.(asset);
                    }}
                    className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-black/70 text-[10px] text-white"
                  >
                    x
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-400">Classic avatars</label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: SVG_AVATAR_COUNT }).map((_, index) => {
            const isSelected = selectedAssetId == null && Number(selectedLegacyIndex) === index;
            return (
              <button
                key={`legacy-${index}`}
                type="button"
                onClick={() => onSelectLegacy?.(index)}
                className={`h-12 w-12 overflow-hidden rounded-lg border transition-transform hover:scale-105 ${
                  isSelected ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.2)]" : "border-white/10"
                }`}
                style={{ backgroundColor: avatarColor }}
              >
                <AvatarArt avatarIndex={index} color={avatarColor} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
