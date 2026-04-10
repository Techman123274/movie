import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AvatarArt, AVATAR_COLORS, AVATAR_OPTIONS, DEFAULT_PROFILE_AVATAR_INDEX } from "@/lib/avatar-options";
import { getProfileBadge, MATURITY_OPTIONS } from "@/lib/preferences";

function AvatarPreview({ color, svgIndex, size = 80 }) {
  return (
    <div className="rounded overflow-hidden flex-shrink-0" style={{ width: size, height: size, backgroundColor: color }}>
      <AvatarArt avatarIndex={svgIndex} color={color} />
    </div>
  );
}

function EditProfileModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile?.name || "");
  const [color, setColor] = useState(profile?.avatar_color || AVATAR_COLORS[0]);
  const [svgIndex, setSvgIndex] = useState(profile?.avatar_index ?? DEFAULT_PROFILE_AVATAR_INDEX);
  const [isKids, setIsKids] = useState(Boolean(profile?.is_kids));
  const [maturityRating, setMaturityRating] = useState(profile?.maturity_rating || "all");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      avatar_color: color,
      avatar_index: svgIndex,
      is_kids: isKids,
      maturity_rating: isKids && maturityRating === "all" ? "older_kids" : maturityRating,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <motion.div
        className="bg-[#1a1a1a] rounded-lg w-full max-w-md p-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">{profile?.id ? "Edit Profile" : "Add Profile"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <AvatarPreview color={color} svgIndex={svgIndex} size={100} />
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className="text-gray-400 text-sm mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#333] text-white px-4 py-3 rounded border border-gray-600 focus:border-white outline-none text-base"
            placeholder="Profile name"
            maxLength={20}
          />
        </div>

        {/* Color picker */}
        <div className="mb-5">
          <label className="text-gray-400 text-sm mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: color === c ? "3px solid white" : "none", outlineOffset: 2 }}
              />
            ))}
          </div>
        </div>

        {/* Avatar picker */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((_, i) => (
              <div
                key={i}
                onClick={() => setSvgIndex(i)}
                className="cursor-pointer rounded overflow-hidden transition-transform hover:scale-110"
                title={AVATAR_OPTIONS[i]?.alt || `Avatar option ${i + 1}`}
                style={{
                  width: 44, height: 44, backgroundColor: color,
                  outline: svgIndex === i ? "3px solid white" : "none", outlineOffset: 2
                }}
              >
                <AvatarArt avatarIndex={i} color={color} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-gray-400 text-sm mb-2 block">Profile Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsKids(false)}
              className={`rounded border px-4 py-3 text-sm transition-colors ${
                !isKids ? "border-white bg-white text-black" : "border-gray-600 text-gray-300 hover:border-white"
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
              className={`rounded border px-4 py-3 text-sm transition-colors ${
                isKids ? "border-white bg-white text-black" : "border-gray-600 text-gray-300 hover:border-white"
              }`}
            >
              Kids
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Allowed Maturity</label>
          <select
            value={isKids && maturityRating === "all" ? "older_kids" : maturityRating}
            onChange={(e) => setMaturityRating(e.target.value)}
            className="w-full bg-[#333] text-white px-4 py-3 rounded border border-gray-600 focus:border-white outline-none text-base"
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
          <p className="text-xs text-gray-500 mt-2">
            Kids profiles are limited to kid-friendly content and can use stricter ratings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded border border-gray-600 text-gray-300 hover:border-white hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ManageProfiles({ onDone }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return;
    const data = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);
    setProfiles(data);
    setLoading(false);
  };

  const handleAdd = async (data) => {
    await base44.entities.Profile.create(data);
    await loadProfiles();
    setShowAddModal(false);
  };

  const handleEdit = async (data) => {
    await base44.entities.Profile.update(editingProfile.id, data);
    await loadProfiles();
    setEditingProfile(null);
  };

  const handleDelete = async (profile) => {
    setDeleting(profile.id);
    await base44.entities.Profile.delete(profile.id);
    await loadProfiles();
    setDeleting(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: "#141414" }}>
      {/* Logo */}
      <div className="absolute top-6 left-8">
        <span className="font-black tracking-tight select-none text-[#E50914] text-3xl">SUBFLIX</span>
      </div>

      <h1 className="text-white text-4xl font-light mb-10">Manage Profiles</h1>

      {loading ? (
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="flex flex-wrap justify-center gap-4 mb-10 px-6 max-w-3xl">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col items-center gap-2 group/card">
              <div className="relative">
                <AvatarPreview
                  color={profile.avatar_color || AVATAR_COLORS[0]}
                  svgIndex={profile.avatar_index ?? 0}
                  size={120}
                />
                {/* Edit overlay */}
                <div
                  onClick={() => setEditingProfile(profile)}
                  className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all cursor-pointer flex items-center justify-center rounded"
                >
                  <span className="text-white text-xs font-semibold opacity-0 group-hover/card:opacity-100 transition-opacity">Edit</span>
                </div>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(profile)}
                  disabled={deleting === profile.id}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
              <span className="text-gray-400 text-sm">{profile.name}</span>
              {getProfileBadge(profile) && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#E50914]">
                  {getProfileBadge(profile)}
                </span>
              )}
            </div>
          ))}

          {/* Add new */}
          {profiles.length < 5 && (
            <div
              onClick={() => setShowAddModal(true)}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className="w-[120px] h-[120px] rounded border-2 border-dashed border-gray-600 hover:border-white flex items-center justify-center transition-colors">
                <Plus className="w-10 h-10 text-gray-500 group-hover:text-white" />
              </div>
              <span className="text-gray-500 text-sm">Add Profile</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onDone}
        className="px-8 py-2.5 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
      >
        Done
      </button>

      {/* Modals */}
      {showAddModal && (
        <EditProfileModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {editingProfile && (
        <EditProfileModal profile={editingProfile} onSave={handleEdit} onClose={() => setEditingProfile(null)} />
      )}
    </div>
  );
}
