import { updateRegionAction } from "@/app/actions";
import type { ProfileRecord } from "@/lib/types";

type RegionFormProps = {
  profile: ProfileRecord;
  returnTo: string;
};

export function RegionForm({ profile, returnTo }: RegionFormProps) {
  return (
    <form action={updateRegionAction} className="surface rounded-[24px] p-5">
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Provider region</p>
      <h3 className="text-lg font-medium text-white">{profile.name}</h3>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="profileId" value={profile.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input
          type="text"
          name="providerRegion"
          defaultValue={profile.providerRegion}
          maxLength={2}
          className="surface min-h-12 flex-1 rounded-full px-5 text-sm uppercase tracking-[0.2em] text-white outline-none"
        />
        <button className="rounded-full bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-[#07111f]">
          Save region
        </button>
      </div>
    </form>
  );
}
