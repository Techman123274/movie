import Link from "next/link";

type RouteLinkRowProps = {
  items: Array<{
    href: string;
    label: string;
  }>;
};

export function RouteLinkRow({ items }: RouteLinkRowProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="surface rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white hover:bg-white/10"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
