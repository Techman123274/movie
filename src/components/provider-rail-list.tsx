import type { ProviderRail } from "@/lib/types";
import { MediaRail } from "@/components/media-rail";

type ProviderRailListProps = {
  rails: ProviderRail[];
};

export function ProviderRailList({ rails }: ProviderRailListProps) {
  return (
    <div className="space-y-10">
      {rails.map((rail) => (
        <MediaRail
          key={rail.id}
          rail={{
            id: rail.id,
            title: rail.title,
            eyebrow: rail.eyebrow,
            items: rail.items,
          }}
        />
      ))}
    </div>
  );
}
