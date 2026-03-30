import { createInitialProfileAction } from "@/app/actions";

const accentOptions = ["#d6b36d", "#7fb6ff", "#8ad5bf", "#f2997b", "#c9a8ff"];

export function ProfileOnboardingForm() {
  return (
    <form action={createInitialProfileAction} className="surface-strong rounded-[34px] p-8">
      <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">First profile</p>
      <h1 className="display-font text-5xl text-white">Create the profile that drives your region and saved titles.</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">Profile name</span>
          <input
            name="name"
            required
            placeholder="Maya"
            className="surface min-h-12 w-full rounded-2xl px-4 text-white outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">Avatar initials</span>
          <input
            name="avatar"
            required
            maxLength={2}
            defaultValue="M"
            className="surface min-h-12 w-full rounded-2xl px-4 uppercase text-white outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">Maturity rating</span>
          <select
            name="maturityRating"
            defaultValue="TV-14"
            className="surface min-h-12 w-full rounded-2xl px-4 text-white outline-none"
          >
            <option value="PG">PG</option>
            <option value="PG-13">PG-13</option>
            <option value="TV-14">TV-14</option>
            <option value="TV-MA">TV-MA</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-muted)]">Provider region</span>
          <input
            name="providerRegion"
            required
            maxLength={2}
            defaultValue="US"
            className="surface min-h-12 w-full rounded-2xl px-4 uppercase tracking-[0.2em] text-white outline-none"
          />
        </label>
      </div>
      <div className="mt-6">
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">Accent color</p>
        <div className="flex flex-wrap gap-3">
          {accentOptions.map((accent, index) => (
            <label key={accent} className="cursor-pointer">
              <input
                type="radio"
                name="accent"
                value={accent}
                defaultChecked={index === 0}
                className="sr-only"
              />
              <span className="block h-10 w-10 rounded-full border border-white/12" style={{ backgroundColor: accent }} />
            </label>
          ))}
        </div>
      </div>
      <button className="mt-8 rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f]">
        Create profile
      </button>
    </form>
  );
}
