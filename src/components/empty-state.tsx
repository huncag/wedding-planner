import type { ComponentType, SVGProps } from "react";

export function EmptyState({
  Icon,
  title,
  description,
  hint,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-parchment bg-white/50 px-6 py-16 text-center sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-cream/70 to-transparent"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-cream text-forest shadow-sm">
          <Icon className="h-7 w-7" />
        </span>
        <h2 className="mt-6 font-display text-2xl text-forest">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        {hint ? (
          <p className="mt-6 rounded-xl border border-parchment bg-ivory px-4 py-2.5 text-xs leading-relaxed text-forest/60">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
