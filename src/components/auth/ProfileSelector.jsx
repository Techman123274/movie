import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ManageProfiles from "@/pages/ManageProfiles";
import { AvatarArt, AVATAR_COLORS, AVATAR_OPTIONS } from "@/lib/avatar-options";
import { getProfileBadge, MATURITY_OPTIONS } from "@/lib/preferences";

function ProfileAvatar({ profile, index, onClick, isSelecting, isSelected }) {
  const color = profile.avatar_color || AVATAR_COLORS[index % AVATAR_COLORS.length];
  const svgIdx = profile.avatar_index ?? (index % AVATAR_OPTIONS.length);

  return (
    <motion.div
      className="flex flex-col items-center gap-3 cursor-pointer select-none"
      onClick={() => !isSelecting && onClick(profile, index)}
      initial={{ opacity: 0, y: 30 }}
      animate={isSelecting && !isSelected ? { opacity: 0.15, scale: 0.9 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="relative rounded overflow-hidden"
        style={{ width: 140, height: 140 }}
        whileHover={!isSelecting ? { scale: 1.06 } : {}}
        animate={isSelected ? { scale: 1.06 } : {}}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full h-full overflow-hidden" style={{ backgroundColor: color }}>
          <AvatarArt avatarIndex={svgIdx} color={color} />
        </div>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="absolute inset-0 border-[3px] border-white pointer-events-none rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <span
        className="text-sm font-normal tracking-wide transition-colors duration-150"
        style={{ color: isSelected ? "#fff" : "#808080" }}
      >
        {profile.name}
      </span>
      {getProfileBadge(profile) && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#E50914]">
          {getProfileBadge(profile)}
        </span>
      )}
    </motion.div>
  );
}

export default function ProfileSelector({ user, onProfileSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [managing, setManaging] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    setLoading(true);
    if (!user) { setLoading(false); return; }
    const data = await base44.entities.Profile.filter({ created_by: user.email }).catch(() => []);

    // If no profiles exist yet, create a default one
    if (data.length === 0) {
      const defaultProfile = await base44.entities.Profile.create({
        name: firstName,
        avatar_color: AVATAR_COLORS[0],
        avatar_index: 0,
      }).catch(() => null);
      setProfiles(defaultProfile ? [defaultProfile] : []);
    } else {
      setProfiles(data);
    }
    setLoading(false);
  };

  const handleSelect = (profile, index) => {
    if (selecting) return;
    setSelecting(true);
    setSelectedIndex(index);
    setTimeout(() => onProfileSelect(profile), 950);
  };

  if (managing) {
    return <ManageProfiles onDone={() => { setManaging(false); loadProfiles(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: "#141414" }}>
      {/* Logo */}
      <div className="absolute top-6 left-8 md:top-8 md:left-12">
        <span className="font-black tracking-tight select-none text-[#E50914] text-3xl">SUBFLIX</span>
      </div>

      <motion.h1
        className="text-white font-light mb-12 text-center"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        Who's watching?
      </motion.h1>

      {loading ? (
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="flex flex-wrap items-start justify-center gap-4 md:gap-6 px-6">
          {profiles.map((profile, i) => (
            <ProfileAvatar
              key={profile.id}
              profile={profile}
              index={i}
              onClick={handleSelect}
              isSelecting={selecting}
              isSelected={selectedIndex === i}
            />
          ))}

          {/* Add profile button */}
          {profiles.length < 5 && !selecting && (
            <motion.div
              className="flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => setAddingProfile(true)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: profiles.length * 0.07, duration: 0.4 }}
            >
              <div
                className="rounded border-2 border-dashed border-gray-600 hover:border-white flex items-center justify-center transition-colors"
                style={{ width: 140, height: 140 }}
              >
                <Plus className="w-12 h-12 text-gray-500" />
              </div>
              <span className="text-sm text-gray-600">Add Profile</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Manage Profiles button */}
      {!selecting && (
        <motion.button
          onClick={() => setManaging(true)}
          className="mt-14 px-7 py-2 text-sm uppercase tracking-[0.18em] border transition-colors duration-200"
          style={{ borderColor: "#808080", color: "#808080" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#808080"; e.currentTarget.style.color = "#808080"; }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          Manage Profiles
        </motion.button>
      )}

      {/* Inline Add Profile modal */}
      {addingProfile && (
        <AddProfileModal
          onSave={async (data) => {
            await base44.entities.Profile.create(data);
            setAddingProfile(false);
            loadProfiles();
          }}
          onClose={() => setAddingProfile(false)}
        />
      )}
    </div>
  );
}

function AddProfileModal({ onSave, onClose }) {
  const COLORS = ["#2d67b5","#c6432a","#5b6e3f","#8c5ebf","#1a8a6e","#c48a12","#b53060","#2a7a9b"];
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [svgIndex, setSvgIndex] = useState(0);
  const [isKids, setIsKids] = useState(false);
  const [maturityRating, setMaturityRating] = useState("all");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
      <motion.div
        className="bg-[#1a1a1a] rounded-lg w-full max-w-md p-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Add Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <div className="rounded overflow-hidden" style={{ width: 100, height: 100, backgroundColor: color }}>
            <AvatarArt avatarIndex={svgIndex} color={color} />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-gray-400 text-sm mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#333] text-white px-4 py-3 rounded border border-gray-600 focus:border-white outline-none text-base"
            placeholder="Profile name"
            maxLength={20}
            autoFocus
          />
        </div>

        <div className="mb-5">
          <label className="text-gray-400 text-sm mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-9 h-9 rounded transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: color === c ? "3px solid white" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((_, i) => (
              <div key={i} onClick={() => setSvgIndex(i)} className="cursor-pointer rounded overflow-hidden transition-transform hover:scale-110"
                style={{ width: 44, height: 44, backgroundColor: color, outline: svgIndex === i ? "3px solid white" : "none", outlineOffset: 2 }}>
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
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-40">
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
