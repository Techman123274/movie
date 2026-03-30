type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <section className="surface rounded-[28px] p-8">
      <h2 className="display-font text-3xl text-white">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{message}</p>
    </section>
  );
}
