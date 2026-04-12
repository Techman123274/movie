import { ShieldAlert } from "lucide-react";

export default function ProfileRestrictionNotice({
  profile,
  title = "This title is locked for this profile",
  description = "Switch to a less restricted profile to keep watching.",
  actionLabel = "Go Back",
  onAction,
}) {
  return (
    <div className="flex min-h-[var(--app-viewport-height)] items-center justify-center bg-[var(--app-bg)] px-4 py-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-black/45 backdrop-blur-sm p-8 md:p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <ShieldAlert className="h-8 w-8 text-[var(--brand)]" />
        </div>
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[var(--brand)]">Profile Lock</p>
        <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight mb-3">{title}</h1>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">{description}</p>
        {profile?.name && (
          <p className="text-gray-500 text-sm mb-8">
            Active profile: <span className="text-gray-300">{profile.name}</span>
          </p>
        )}
        {onAction && (
          <button
            onClick={onAction}
            className="bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
