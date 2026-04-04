import { updateRegionAction } from "@/app/actions";
import type { ProfileRecord } from "@/lib/types";

type RegionFormProps = {
  profile: ProfileRecord;
  returnTo: string;
};

export function RegionForm({ profile, returnTo }: RegionFormProps) {
  return (
    <form action={updateRegionAction} className="surface rounded-[28px] p-6">
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Playback region</p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-medium text-white">{profile.name}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Choose the region Subflix should use when surfacing where a title can be watched. This keeps provider availability and storefront results closer to your real viewing options.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(214,179,109,0.24)] bg-[rgba(214,179,109,0.08)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
          Current region: {profile.providerRegion}
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="profileId" value={profile.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input
          type="text"
          name="providerRegion"
          defaultValue={profile.providerRegion}
          maxLength={2}
          className="surface min-h-12 flex-1 rounded-full px-5 text-sm uppercase tracking-[0.2em] text-white outline-none"
          aria-label="Playback region"
        />
        <button className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white">
          Save region
        </button>
      </div>
    </form>
  );
}
