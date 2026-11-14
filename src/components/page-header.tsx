import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold-ink">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none text-forest sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
      {action}
      {badge ? (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-parchment bg-cream/60 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-forest/80">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {badge}
        </span>
      ) : null}
    </header>
  );
}
