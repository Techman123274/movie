// @ts-nocheck
import { base44 } from "@/api/base44Client";
import {
  AVATAR_COLORS,
  DEFAULT_PROFILE_AVATAR_INDEX,
  LOCAL_BUILTIN_AVATAR_ASSETS,
  SVG_AVATAR_COUNT,
} from "@/lib/avatar-options";

export const AVATAR_ASSETS_CHANGED_EVENT = "subflix:avatar-assets-changed";

const isBrowser = typeof window !== "undefined";

const emitAvatarAssetChanged = (detail) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new CustomEvent(AVATAR_ASSETS_CHANGED_EVENT, { detail }));
};

export const getDefaultAvatarColor = (index = 0) =>
  AVATAR_COLORS[((index % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length];

export const getAvatarAssetForProfile = (profile, avatarAssets = []) => {
  if (!profile) {
    return null;
  }

  if (profile.avatar_asset_id) {
    const directMatch = avatarAssets.find((asset) => asset.id === profile.avatar_asset_id);
    if (directMatch) {
      return directMatch;
    }
  }

  if (profile.avatar_asset_url) {
    return {
      id: profile.avatar_asset_id || `profile-snapshot-${profile.id || profile.name || "avatar"}`,
      asset_kind: profile.avatar_asset_id ? "builtin" : "upload",
      public_url: profile.avatar_asset_url,
      label: profile.avatar_asset_label || `${profile.name || "Profile"} avatar`,
      legacy_avatar_index: profile.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX,
    };
  }

  if (profile.avatar_index >= SVG_AVATAR_COUNT) {
    return avatarAssets.find((asset) => Number(asset.legacy_avatar_index) === Number(profile.avatar_index)) || null;
  }

  return null;
};

export const getProfileAvatarProps = (profile, avatarAssets = []) => {
  const asset = getAvatarAssetForProfile(profile, avatarAssets);

  return {
    asset,
    avatarColor: profile?.avatar_color || getDefaultAvatarColor(profile?.avatar_index ?? 0),
    avatarIndex: profile?.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX,
    imageUrl: asset?.public_url || profile?.avatar_asset_url || null,
    label: asset?.label || profile?.avatar_asset_label || `${profile?.name || "Profile"} avatar`,
  };
};

export const buildProfileAvatarSelection = (profile, avatarAssets = []) => {
  const asset = getAvatarAssetForProfile(profile, avatarAssets);

  return {
    assetId: asset?.id || profile?.avatar_asset_id || null,
    assetUrl: asset?.public_url || profile?.avatar_asset_url || null,
    assetLabel: asset?.label || profile?.avatar_asset_label || "",
    avatarIndex: profile?.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX,
    avatarColor: profile?.avatar_color || getDefaultAvatarColor(profile?.avatar_index ?? 0),
  };
};

export const createProfilePayloadWithAvatar = ({
  baseProfile = {},
  avatarSelection = {},
  name,
  isKids,
  maturityRating,
}) => ({
  ...baseProfile,
  name,
  avatar_color: avatarSelection.avatarColor || baseProfile.avatar_color || AVATAR_COLORS[0],
  avatar_index: avatarSelection.avatarIndex ?? baseProfile.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX,
  avatar_asset_id: avatarSelection.assetId || null,
  avatar_asset_url: avatarSelection.assetUrl || null,
  avatar_asset_label: avatarSelection.assetLabel || null,
  is_kids: Boolean(isKids),
  maturity_rating: maturityRating,
});

export const listAvatarAssets = async () => {
  const rows = await base44.avatars.list().catch(() => []);
  const merged = new Map();

  [...LOCAL_BUILTIN_AVATAR_ASSETS, ...(rows || [])].forEach((asset) => {
    if (!asset?.id) {
      return;
    }
    merged.set(asset.id, {
      ...asset,
      asset_kind: asset.asset_kind || "builtin",
      is_active: asset.is_active !== false,
    });
  });

  return [...merged.values()].sort((a, b) => {
    const kindA = a.asset_kind === "upload" ? 1 : 0;
    const kindB = b.asset_kind === "upload" ? 1 : 0;
    if (kindA !== kindB) {
      return kindA - kindB;
    }

    return String(a.label || "").localeCompare(String(b.label || ""));
  });
};

export const uploadAvatarAsset = async (file, label = "") => {
  const asset = await base44.avatars.upload(file, label);
  emitAvatarAssetChanged({ action: "uploaded", asset });
  return asset;
};

export const deleteAvatarAsset = async (id) => {
  await base44.avatars.delete(id);
  emitAvatarAssetChanged({ action: "deleted", assetId: id });
  return true;
};

export const backfillProfileAvatarAsset = async (profile, avatarAssets = []) => {
  if (!profile?.id || profile.avatar_asset_id || profile.avatar_asset_url) {
    return profile;
  }

  const matchingBuiltin = avatarAssets.find(
    (asset) => Number(asset.legacy_avatar_index) === Number(profile.avatar_index)
  );

  if (!matchingBuiltin) {
    return profile;
  }

  const updated = await base44.entities.Profile.update(profile.id, {
    avatar_asset_id: matchingBuiltin.id,
    avatar_asset_url: matchingBuiltin.public_url,
    avatar_asset_label: matchingBuiltin.label,
  }).catch(() => null);

  return updated || {
    ...profile,
    avatar_asset_id: matchingBuiltin.id,
    avatar_asset_url: matchingBuiltin.public_url,
    avatar_asset_label: matchingBuiltin.label,
  };
};
