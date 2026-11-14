import {
  BudgetIcon,
  CalendarIcon,
  CastleIcon,
  CheckIcon,
  GuestsIcon,
  SparkleIcon,
  VendorsIcon,
} from "@/components/icons";
import { Countdown } from "@/components/countdown";
import { WEDDING } from "@/lib/wedding";

const STATS = [
  {
    label: "Guests invited",
    value: "0",
    note: "Guest list is empty",
    Icon: GuestsIcon,
  },
  {
    label: "RSVPs confirmed",
    value: "0",
    note: "Awaiting replies",
    Icon: CheckIcon,
  },
  {
    label: "Vendors booked",
    value: "0",
    note: "No vendors yet",
    Icon: VendorsIcon,
  },
  {
    label: "Budget tracked",
    value: "€0",
    note: "Estimated vs. actual",
    Icon: BudgetIcon,
  },
] as const;

const NEXT_STEPS = [
  "Confirm the guest list",
  "Book the remaining vendors",
  "Finalize the menu and dietary options",
  "Design and send the invitations",
] as const;

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold-ink">
            <SparkleIcon className="h-4 w-4" />
            {WEDDING.venue} · {WEDDING.location}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none text-forest sm:text-5xl">
            Our Wedding
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <CalendarIcon className="h-4 w-4 text-gold" />
            {WEDDING.longDateLabel} · Ceremony at {WEDDING.ceremonyTime}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-parchment bg-cream/60 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-forest/80">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Planning in progress
        </span>
      </header>

      <Countdown />

      <section aria-label="At a glance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map(({ label, value, note, Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-parchment/80 bg-white/70 p-5 shadow-sm transition-colors hover:border-gold/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted">
                    {label}
                  </p>
                  <p className="mt-3 font-display text-4xl leading-none text-forest">
                    {value}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-forest/70">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">{note}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          These numbers will populate once the Supabase tables are connected.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-parchment/80 bg-white/70 p-6 sm:p-8 lg:col-span-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-forest">Next steps</h2>
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.22em] text-muted">
              To do
            </span>
          </div>
          <ul className="mt-5 divide-y divide-parchment/70">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-parchment bg-ivory font-display text-sm text-forest/60">
                  {index + 1}
                </span>
                <span className="text-sm text-forest/85">{step}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            A starting checklist — it will become editable once the planner is
            wired up.
          </p>
        </section>

        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-parchment/80 bg-cream/70 p-6 sm:p-8 lg:col-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-gold/20"
          />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-ivory/80 text-forest">
              <CastleIcon className="h-5 w-5" />
            </span>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.26em] text-gold-ink">
              The venue
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-forest">
              {WEDDING.venue}
            </h2>
            <p className="mt-1 text-sm text-muted">{WEDDING.location}</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-forest/70">
              A historic castle in the Transylvanian countryside — the backdrop
              for our celebration.
            </p>
          </div>
          <dl className="relative mt-8 space-y-3 border-t border-parchment pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Date</dt>
              <dd className="font-medium text-forest">{WEDDING.dateLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ceremony</dt>
              <dd className="font-medium text-forest">
                {WEDDING.ceremonyTime}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Setting</dt>
              <dd className="font-medium text-forest">Castle &amp; grounds</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
