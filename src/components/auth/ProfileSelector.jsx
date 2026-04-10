import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ManageProfiles from "@/pages/ManageProfiles";
import BrandWordmark from "@/components/layout/BrandWordmark";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileEditorModal from "@/components/profile/ProfileEditorModal";
import {
  AVATAR_ASSETS_CHANGED_EVENT,
  backfillProfileAvatarAsset,
  listAvatarAssets,
} from "@/lib/avatar-assets";
import {
  AVATAR_COLORS,
  DEFAULT_PROFILE_AVATAR_INDEX,
} from "@/lib/avatar-options";
import { getProfileBadge } from "@/lib/preferences";

function SelectableProfileCard({
  profile,
  avatarAssets,
  index,
  onClick,
  isSelecting,
  isSelected,
}) {
  return (
    <motion.div
      className="flex cursor-pointer select-none flex-col items-center gap-3"
      onClick={() => !isSelecting && onClick(profile, index)}
      initial={{ opacity: 0, y: 30 }}
      animate={isSelecting && !isSelected ? { opacity: 0.15, scale: 0.94 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="relative overflow-hidden rounded-md"
        style={{ width: 140, height: 140 }}
        whileHover={!isSelecting ? { scale: 1.04 } : {}}
        animate={isSelected ? { scale: 1.05 } : {}}
        transition={{ duration: 0.2 }}
      >
        <ProfileAvatar profile={profile} avatarAssets={avatarAssets} size={140} className="rounded-md" />
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-md border-[3px] border-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <span className={`text-sm transition-colors ${isSelected ? "text-white" : "text-gray-400"}`}>
        {profile.name}
      </span>
      {getProfileBadge(profile) && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
          {getProfileBadge(profile)}
        </span>
      )}
    </motion.div>
  );
}

export default function ProfileSelector({ user, onProfileSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [avatarAssets, setAvatarAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [managing, setManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user) {
        setProfiles([]);
        setAvatarAssets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const assets = await listAvatarAssets().catch(() => []);
      const rows = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);

      let nextProfiles = rows;
      if (rows.length === 0) {
        const defaultAsset = assets.find((asset) => asset.asset_kind === "builtin") || null;
        const defaultProfile = await base44.entities.Profile.create({
          name: firstName,
          avatar_color: AVATAR_COLORS[0],
          avatar_index: defaultAsset?.legacy_avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX,
          avatar_asset_id: defaultAsset?.id || null,
          avatar_asset_url: defaultAsset?.public_url || null,
          avatar_asset_label: defaultAsset?.label || null,
        }).catch(() => null);
        nextProfiles = defaultProfile ? [defaultProfile] : [];
      } else {
        nextProfiles = await Promise.all(
          rows.map((profile) => backfillProfileAvatarAsset(profile, assets))
        );
      }

      if (!cancelled) {
        setAvatarAssets(assets);
        setProfiles(nextProfiles);
        setLoading(false);
      }
    };

    loadData();
    const handleAvatarAssetsChanged = () => loadData();
    window.addEventListener(AVATAR_ASSETS_CHANGED_EVENT, handleAvatarAssetsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AVATAR_ASSETS_CHANGED_EVENT, handleAvatarAssetsChanged);
    };
  }, [firstName, user]);

  const reloadProfiles = async () => {
    setLoading(true);
    const assets = await listAvatarAssets().catch(() => []);
    const rows = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);
    const nextProfiles = await Promise.all(rows.map((profile) => backfillProfileAvatarAsset(profile, assets)));
    setAvatarAssets(assets);
    setProfiles(nextProfiles);
    setLoading(false);
  };

  const handleSelect = (profile, index) => {
    if (selecting) {
      return;
    }

    setSelecting(true);
    setSelectedIndex(index);
    window.setTimeout(() => onProfileSelect(profile), 900);
  };

  if (managing) {
    return <ManageProfiles onDone={() => { setManaging(false); reloadProfiles(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--app-bg)] px-6">
      <div className="absolute left-8 top-6 md:left-12 md:top-8">
        <BrandWordmark className="text-3xl" showMode />
      </div>

      <motion.h1
        className="mb-12 text-center font-light text-white"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Who&apos;s watching?
      </motion.h1>

      {loading ? (
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
      ) : (
        <div className="flex flex-wrap items-start justify-center gap-4 px-2 md:gap-6">
          {profiles.map((profile, index) => (
            <SelectableProfileCard
              key={profile.id}
              profile={profile}
              avatarAssets={avatarAssets}
              index={index}
              onClick={handleSelect}
              isSelecting={selecting}
              isSelected={selectedIndex === index}
            />
          ))}

          {profiles.length < 5 && !selecting && (
            <motion.div
              className="flex cursor-pointer flex-col items-center gap-3"
              onClick={() => setEditingProfile({})}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: profiles.length * 0.06, duration: 0.35 }}
            >
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-md border-2 border-dashed border-white/20 bg-white/[0.03] transition-colors hover:border-white/45 hover:bg-white/[0.05]">
                <Plus className="h-12 w-12 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500">Add Profile</span>
            </motion.div>
          )}
        </div>
      )}

      {!selecting && (
        <motion.button
          onClick={() => setManaging(true)}
          className="mt-14 rounded border border-white/25 px-7 py-2 text-sm uppercase tracking-[0.18em] text-gray-300 transition-colors hover:border-white hover:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          Manage Profiles
        </motion.button>
      )}

      {editingProfile && (
        <ProfileEditorModal
          profile={editingProfile.id ? editingProfile : null}
          avatarAssets={avatarAssets}
          onSave={async (payload) => {
            if (editingProfile?.id) {
              await base44.entities.Profile.update(editingProfile.id, payload);
            } else {
              await base44.entities.Profile.create(payload);
            }
            setEditingProfile(null);
            await reloadProfiles();
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
}
