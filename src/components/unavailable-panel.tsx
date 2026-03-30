type UnavailablePanelProps = {
  title: string;
  message: string;
};

export function UnavailablePanel({ title, message }: UnavailablePanelProps) {
  return (
    <section className="surface-strong rounded-[34px] p-8">
      <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-danger)]">Unavailable</p>
      <h1 className="display-font text-5xl text-white">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{message}</p>
    </section>
  );
}
