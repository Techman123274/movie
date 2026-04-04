import { updateProfileAvatarAction } from "@/app/actions";
import { ProfileAvatarPicker } from "@/components/profile-avatar-picker";

type ProfileAvatarSettingsFormProps = {
  profileId: string;
  currentAvatar: string;
};

export function ProfileAvatarSettingsForm({ profileId, currentAvatar }: ProfileAvatarSettingsFormProps) {
  return (
    <form action={updateProfileAvatarAction} className="surface rounded-[28px] p-6">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="returnTo" value="/settings" />
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Profile avatar</p>
      <h2 className="text-xl font-medium text-white">Choose a preset or upload your own image</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        The active profile image appears in the account views and in the header so the app feels more personal.
      </p>
      <div className="mt-5">
        <ProfileAvatarPicker initialAvatar={currentAvatar} />
      </div>
      <button className="theme-button-primary mt-6 rounded-full px-5 py-3 text-sm font-semibold">
        Save avatar
      </button>
    </form>
  );
}
