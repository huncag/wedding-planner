import { cookies } from "next/headers";
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
import {
  CURRENCY_COOKIE,
  convertAmount,
  formatMoney,
  isCurrency,
  type Currency,
} from "@/lib/currency";
import { getFxSnapshot } from "@/lib/fx";
import { syncRsvpGuests } from "@/lib/guests-sync";
import { createClient } from "@/lib/supabase/server";
import { WEDDING } from "@/lib/wedding";

type NextStep = {
  label: string;
  detail: string;
  done: boolean;
};

export default async function OverviewPage() {
  const supabase = await createClient();

  await syncRsvpGuests(supabase);

  const [cookieStore, fx, guestsResult, vendorsResult, budgetResult] =
    await Promise.all([
      cookies(),
      getFxSnapshot(),
      supabase.from("guests").select("*"),
      supabase.from("vendors").select("*"),
      supabase.from("budget").select("estimated_cost, estimated_currency"),
    ]);

  const storedCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const currency: Currency = isCurrency(storedCurrency) ? storedCurrency : "RON";

  const guestRows = (guestsResult.data ?? []) as {
    rsvp_status: "pending" | "attending" | "declined";
    party_size: number | string | null;
    confirmed_count: number | string | null;
    invite_sent: boolean | null;
    meal_preference: string | null;
    dietary_restrictions: string | null;
  }[];
  const parties = guestRows.length;
  const invitedPeople = guestRows.reduce((total, guest) => {
    const size = Number(guest.party_size ?? 1);

    return total + (Number.isFinite(size) && size > 0 ? Math.round(size) : 1);
  }, 0);
  const attendingPeople = guestRows.reduce((total, guest) => {
    if (guest.rsvp_status !== "attending") {
      return total;
    }

    const size = Number(guest.party_size ?? 1);
    const confirmed = Number(guest.confirmed_count ?? size);

    return total + (Number.isFinite(confirmed) && confirmed > 0
      ? Math.round(confirmed)
      : 0);
  }, 0);
  const pendingParties = guestRows.filter(
    (guest) => guest.rsvp_status === "pending",
  ).length;
  const declinedParties = guestRows.filter(
    (guest) => guest.rsvp_status === "declined",
  ).length;
  const invitesSent = guestRows.filter((guest) => guest.invite_sent).length;
  const attendingGroups = guestRows.filter(
    (guest) => guest.rsvp_status === "attending",
  );
  const mealsMissing = attendingGroups.filter(
    (guest) => !guest.meal_preference,
  ).length;
  const dietaryNotes = guestRows.filter((guest) =>
    (guest.dietary_restrictions ?? "").trim(),
  ).length;

  const vendorStatuses = (vendorsResult.data ?? []) as {
    status: string;
    agreed: boolean | null;
  }[];
  const vendorsBooked = vendorStatuses.filter(
    (vendor) => vendor.status === "booked" || vendor.status === "completed",
  ).length;
  const vendorsAgreed = vendorStatuses.filter(
    (vendor) => vendor.agreed,
  ).length;
  const vendorsOpen = vendorStatuses.length - vendorsBooked;

  const budgetRows = (budgetResult.data ?? []) as {
    estimated_cost: number | string;
    estimated_currency: Currency;
  }[];
  const budgetTotal = budgetRows.reduce((total, row) => {
    const amount = Number(row.estimated_cost);

    return Number.isFinite(amount)
      ? total +
          convertAmount(amount, row.estimated_currency, currency, fx.rate)
      : total;
  }, 0);

  const stats = [
    {
      label: "Guests invited",
      value: String(invitedPeople),
      note:
        parties === 0
          ? "Guest list is empty"
          : `${parties} invitation groups · ${declinedParties} declined`,
      Icon: GuestsIcon,
    },
    {
      label: "Coming",
      value: String(attendingPeople),
      note:
        parties === 0
          ? "Awaiting replies"
          : `${pendingParties} groups still to reply`,
      Icon: CheckIcon,
    },
    {
      label: "Vendors booked",
      value: `${vendorsBooked} / ${vendorStatuses.length}`,
      note:
        vendorStatuses.length === 0
          ? "No vendors yet"
          : `${vendorsAgreed} agreed`,
      Icon: VendorsIcon,
    },
    {
      label: "Budget tracked",
      value: formatMoney(budgetTotal, currency),
      note: `${budgetRows.length} line ${
        budgetRows.length === 1 ? "item" : "items"
      } · estimated`,
      Icon: BudgetIcon,
    },
  ] as const;

  const nextSteps: NextStep[] = [
    {
      label: "Confirm the guest list",
      detail:
        parties === 0
          ? "No invitation groups yet"
          : pendingParties === 0
            ? "Every group has replied"
            : `${pendingParties} of ${parties} groups still to reply`,
      done: parties > 0 && pendingParties === 0,
    },
    {
      label: "Book the remaining vendors",
      detail:
        vendorStatuses.length === 0
          ? "No vendors yet"
          : vendorsOpen === 0
            ? "Every vendor is booked"
            : `${vendorsOpen} of ${vendorStatuses.length} still open`,
      done: vendorStatuses.length > 0 && vendorsOpen === 0,
    },
    {
      label: "Finalize the menu and dietary options",
      detail:
        attendingGroups.length === 0
          ? dietaryNotes > 0
            ? `${dietaryNotes} dietary ${dietaryNotes === 1 ? "note" : "notes"} to review`
            : "Waiting for the first replies"
          : `${mealsMissing} of ${attendingGroups.length} meal choices missing · ${dietaryNotes} dietary ${
              dietaryNotes === 1 ? "note" : "notes"
            }`,
      done: attendingGroups.length > 0 && mealsMissing === 0,
    },
    {
      label: "Design and send the invitations",
      detail:
        parties === 0
          ? "No invitation groups yet"
          : `${invitesSent} of ${parties} groups sent`,
      done: parties > 0 && invitesSent === parties,
    },
  ];

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
          {stats.map(({ label, value, note, Icon }) => (
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
          Live totals from your planner — RSVP replies, vendors and the budget
          feed these cards.
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
            {nextSteps.map((step, index) => (
              <li key={step.label} className="flex items-start gap-4 py-3.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm ${
                    step.done
                      ? "border-forest/25 bg-forest/10 text-forest"
                      : "border-parchment bg-ivory text-forest/60"
                  }`}
                >
                  {step.done ? <CheckIcon className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${
                      step.done ? "text-muted line-through" : "text-forest/85"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] text-muted">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Live progress — each step updates as replies, bookings and
            invitations come in.
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
