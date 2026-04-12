import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BrandWordmark from "@/components/layout/BrandWordmark";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileEditorModal from "@/components/profile/ProfileEditorModal";
import {
  AVATAR_ASSETS_CHANGED_EVENT,
  backfillProfileAvatarAsset,
  listAvatarAssets,
} from "@/lib/avatar-assets";
import { getProfileBadge } from "@/lib/preferences";

export default function ManageProfiles({ onDone }) {
  const [profiles, setProfiles] = useState([]);
  const [avatarAssets, setAvatarAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [deletingProfileId, setDeletingProfileId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      setLoading(true);
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        if (!cancelled) {
          setProfiles([]);
          setAvatarAssets([]);
          setLoading(false);
        }
        return;
      }

      const assets = await listAvatarAssets().catch(() => []);
      const rows = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);
      const nextProfiles = await Promise.all(
        rows.map((profile) => backfillProfileAvatarAsset(profile, assets))
      );

      if (!cancelled) {
        setAvatarAssets(assets);
        setProfiles(nextProfiles);
        setLoading(false);
      }
    };

    loadProfiles();
    const handleAvatarAssetsChanged = () => loadProfiles();
    window.addEventListener(AVATAR_ASSETS_CHANGED_EVENT, handleAvatarAssetsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AVATAR_ASSETS_CHANGED_EVENT, handleAvatarAssetsChanged);
    };
  }, []);

  const reloadProfiles = async () => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      setProfiles([]);
      return;
    }
    setLoading(true);
    const assets = await listAvatarAssets().catch(() => []);
    const rows = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);
    const nextProfiles = await Promise.all(rows.map((profile) => backfillProfileAvatarAsset(profile, assets)));
    setAvatarAssets(assets);
    setProfiles(nextProfiles);
    setLoading(false);
  };

  const handleDelete = async (profile) => {
    setDeletingProfileId(profile.id);
    await base44.entities.Profile.delete(profile.id).catch(() => null);
    setDeletingProfileId(null);
    await reloadProfiles();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--app-bg)] text-white">
      <div className="mx-auto min-h-[var(--app-viewport-height)] w-full max-w-6xl px-4 pb-[calc(var(--app-safe-bottom)+1rem)] pt-[calc(var(--app-safe-top)+0.85rem)] md:px-6 md:pt-8">
        <div className="sticky top-[var(--app-safe-top)] z-10 mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[color:rgb(8_8_8_/_0.82)] px-4 py-3 backdrop-blur-xl">
          <BrandWordmark className="text-2xl md:text-3xl" showMode />
          <button
            type="button"
            onClick={onDone}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
          >
            Done
          </button>
        </div>

        <div className="mx-auto w-full max-w-5xl pb-8">
          <div className="mb-8 text-center md:mb-10">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--brand)]">Profiles</p>
            <h1 className="text-3xl font-light tracking-tight md:text-5xl">Manage Profiles</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
              Switch artwork, upload new profile pictures, and fine-tune what each profile can watch.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 justify-items-center gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {profiles.map((profile) => (
                <div key={profile.id} className="group flex w-[152px] flex-col items-center gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(profile)}
                      className="overflow-hidden rounded-md transition-transform hover:scale-[1.02]"
                    >
                      <ProfileAvatar profile={profile} avatarAssets={avatarAssets} size={132} className="rounded-md" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(profile)}
                      disabled={deletingProfileId === profile.id}
                      className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white opacity-100 transition-opacity hover:border-red-400 hover:text-red-300 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white">{profile.name}</p>
                    {getProfileBadge(profile) && (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--brand)]">
                        {getProfileBadge(profile)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {profiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => setEditingProfile({})}
                  className="flex w-[152px] flex-col items-center gap-3"
                >
                  <div className="flex h-[132px] w-[132px] items-center justify-center rounded-md border-2 border-dashed border-white/20 bg-white/[0.03] transition-colors hover:border-white/45 hover:bg-white/[0.05]">
                    <UserPlus className="h-10 w-10 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400">Add Profile</p>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
