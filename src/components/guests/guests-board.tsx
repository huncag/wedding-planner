"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CheckIcon,
  CloseIcon,
  GuestsIcon,
  RefreshIcon,
  TrashIcon,
} from "@/components/icons";
import {
  formatSubmittedAt,
  mealLabel,
  summarizeRsvps,
  type RsvpSubmission,
} from "@/lib/rsvp";
import { createClient } from "@/lib/supabase/client";

const POLL_INTERVAL_MS = 20_000;
const TOAST_DURATION_MS = 7_000;

type Connection = "connecting" | "live" | "polling";
type FilterId = "all" | "attending" | "declined" | "unhandled";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All replies" },
  { id: "attending", label: "Attending" },
  { id: "declined", label: "Declined" },
  { id: "unhandled", label: "To review" },
];

function newestFirst(list: readonly RsvpSubmission[]): RsvpSubmission[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );
}

function mergeSubmission(
  list: readonly RsvpSubmission[],
  submission: RsvpSubmission,
): RsvpSubmission[] {
  return newestFirst([
    submission,
    ...list.filter((item) => item.id !== submission.id),
  ]);
}

/** Polling only replaces state when something actually changed. */
function sameSubmissions(
  a: readonly RsvpSubmission[],
  b: readonly RsvpSubmission[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (item, index) =>
      item.id === b[index].id &&
      item.handled === b[index].handled &&
      item.submitted_at === b[index].submitted_at,
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="rounded-2xl border border-parchment/80 bg-white/70 p-4 shadow-sm">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl leading-none text-forest">
        {value}
      </p>
      <p className="mt-2 text-[0.7rem] leading-snug text-muted">{note}</p>
    </article>
  );
}

function ReplyCard({
  submission,
  highlighted,
  busy,
  onToggleHandled,
  onDelete,
}: {
  submission: RsvpSubmission;
  highlighted: boolean;
  busy: boolean;
  onToggleHandled: (submission: RsvpSubmission) => void;
  onDelete: (submission: RsvpSubmission) => void;
}) {
  const meal = mealLabel(submission.meal_preference);
  const tel = submission.phone?.replace(/[^\d+]/g, "");

  return (
    <li
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        highlighted
          ? "border-gold/70 bg-cream/60"
          : submission.handled
            ? "border-parchment/70 bg-white/50"
            : "border-parchment/90 bg-white/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-display text-2xl leading-tight text-forest">
              {submission.name}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] ${
                submission.attending
                  ? "border-forest/20 bg-forest/10 text-forest"
                  : "border-parchment bg-cream/70 text-muted"
              }`}
            >
              {submission.attending ? "Attending" : "Declined"}
            </span>
            {submission.handled ? (
              <span className="rounded-full border border-parchment bg-ivory px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-muted">
                Handled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-gold-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                New
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {submission.email ? (
              <a
                href={`mailto:${submission.email}`}
                className="underline-offset-4 hover:text-forest hover:underline"
              >
                {submission.email}
              </a>
            ) : null}
            {submission.phone ? (
              <a
                href={`tel:${tel}`}
                className="underline-offset-4 hover:text-forest hover:underline"
              >
                {submission.phone}
              </a>
            ) : null}
            {!submission.email && !submission.phone ? (
              <span>No contact details</span>
            ) : null}
          </div>
        </div>

        <time
          dateTime={submission.submitted_at}
          className="shrink-0 text-[0.7rem] text-muted"
        >
          {formatSubmittedAt(submission.submitted_at)}
        </time>
      </div>

      {submission.attending ? (
        <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-parchment/60 pt-3 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-muted">Meal</dt>
            <dd className="font-medium text-forest">{meal ?? "Not chosen"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Plus-one</dt>
            <dd className="min-w-0 break-words font-medium text-forest">
              {submission.plus_one_name?.trim() || "None"}
            </dd>
          </div>
          {submission.dietary_restrictions?.trim() ? (
            <div className="flex gap-2 sm:col-span-2">
              <dt className="shrink-0 text-muted">Dietary</dt>
              <dd className="break-words text-forest/90">
                {submission.dietary_restrictions}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {submission.message?.trim() ? (
        <blockquote className="mt-4 rounded-xl border-l-2 border-gold/50 bg-cream/30 px-4 py-3 text-sm leading-relaxed text-forest/80">
          {submission.message}
        </blockquote>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-parchment/60 pt-3">
        <button
          type="button"
          onClick={() => onToggleHandled(submission)}
          disabled={busy}
          aria-pressed={submission.handled}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-wait disabled:opacity-60 ${
            submission.handled
              ? "border-forest/20 bg-forest/10 text-forest hover:bg-forest/15"
              : "border-parchment bg-ivory text-muted hover:border-gold/60 hover:text-forest"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
          {submission.handled ? "Handled" : "Mark handled"}
        </button>

        <button
          type="button"
          onClick={() => onDelete(submission)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-muted underline-offset-4 transition-colors hover:text-gold-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-wait disabled:opacity-60"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </li>
  );
}

export function GuestsBoard({
  initialSubmissions,
  initialError = null,
}: {
  initialSubmissions: RsvpSubmission[];
  initialError?: string | null;
}) {
  const [submissions, setSubmissions] =
    useState<RsvpSubmission[]>(initialSubmissions);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [filter, setFilter] = useState<FilterId>("all");
  const [toast, setToast] = useState<{
    id: string;
    name: string;
    attending: boolean;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Server render and hydration use the relative path; after hydration the
  // absolute URL is shown. useSyncExternalStore avoids a setState-in-effect.
  const rsvpUrl = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/rsvp`,
    () => "/rsvp",
  );

  const summary = useMemo(() => summarizeRsvps(submissions), [submissions]);
  const unhandled = useMemo(
    () => submissions.filter((submission) => !submission.handled).length,
    [submissions],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Realtime: new replies and handled changes appear instantly.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const channel = supabase
      .channel("rsvp-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvp_submissions" },
        (payload: RealtimePostgresChangesPayload<RsvpSubmission>) => {
          if (!active) {
            return;
          }

          if (payload.eventType === "INSERT") {
            const submission = payload.new as RsvpSubmission;
            setSubmissions((current) => mergeSubmission(current, submission));
            setToast({
              id: submission.id,
              name: submission.name,
              attending: submission.attending,
            });
          } else if (payload.eventType === "UPDATE") {
            const submission = payload.new as RsvpSubmission;
            setSubmissions((current) => mergeSubmission(current, submission));
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Partial<RsvpSubmission>;
            setSubmissions((current) =>
              current.filter((item) => item.id !== deleted.id),
            );
          }
        },
      )
      .subscribe((status: string) => {
        if (!active) {
          return;
        }

        setConnection(status === "SUBSCRIBED" ? "live" : "polling");
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  // Polling fallback: keeps the inbox fresh when Realtime is unavailable.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const refresh = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const { data, error } = await supabase
        .from("rsvp_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (cancelled || error || !data) {
        return;
      }

      const next = data as RsvpSubmission[];
      setSubmissions((current) =>
        sameSubmissions(current, next) ? current : next,
      );
    };

    void refresh();

    const interval = window.setInterval(
      () => void refresh(),
      POLL_INTERVAL_MS,
    );
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleCopyLink = async () => {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      setCopyError("Copy failed — select the link above and copy it manually.");
    }
  };

  const handleToggleHandled = async (submission: RsvpSubmission) => {
    const nextHandled = !submission.handled;
    setBusyId(submission.id);
    setActionError(null);
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id ? { ...item, handled: nextHandled } : item,
      ),
    );

    const { error } = await createClient()
      .from("rsvp_submissions")
      .update({ handled: nextHandled })
      .eq("id", submission.id);

    if (error) {
      setSubmissions((current) =>
        current.map((item) =>
          item.id === submission.id
            ? { ...item, handled: submission.handled }
            : item,
        ),
      );
      setActionError("Could not update that reply. Please try again.");
    }

    setBusyId(null);
  };

  const handleDelete = async (submission: RsvpSubmission) => {
    const confirmed = window.confirm(
      `Delete the reply from ${submission.name}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(submission.id);
    setActionError(null);
    setSubmissions((current) =>
      current.filter((item) => item.id !== submission.id),
    );

    const { error } = await createClient()
      .from("rsvp_submissions")
      .delete()
      .eq("id", submission.id);

    if (error) {
      setSubmissions((current) => mergeSubmission(current, submission));
      setActionError("Could not delete that reply. Please try again.");
    }

    setBusyId(null);
  };

  const counts: Record<FilterId, number> = {
    all: submissions.length,
    attending: summary.attending,
    declined: summary.declined,
    unhandled,
  };

  const visible = submissions.filter((submission) => {
    if (filter === "attending") {
      return submission.attending;
    }

    if (filter === "declined") {
      return !submission.attending;
    }

    if (filter === "unhandled") {
      return !submission.handled;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-start gap-3 rounded-2xl border border-gold/40 bg-forest px-4 py-3 text-ivory shadow-xl"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-light">
            <CheckIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-gold-light">
              New RSVP
            </p>
            <p className="mt-0.5 text-sm">
              <span className="font-medium">{toast.name}</span>{" "}
              {toast.attending ? "is coming." : "cannot make it."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ivory/70 transition-colors hover:bg-white/10 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-parchment/80 bg-cream/50 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.22em] text-gold-ink">
              Public RSVP link
            </p>
            <span
              title={
                connection === "live"
                  ? "Connected to Supabase Realtime"
                  : connection === "connecting"
                    ? "Opening the live connection"
                    : "Realtime unavailable — the inbox refreshes every 20 seconds"
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] ${
                connection === "live"
                  ? "border-forest/20 bg-forest/10 text-forest"
                  : "border-gold/40 bg-gold/10 text-gold-ink"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connection === "live"
                    ? "bg-forest motion-safe:animate-pulse"
                    : "bg-gold"
                }`}
              />
              {connection === "live"
                ? "Live"
                : connection === "connecting"
                  ? "Connecting…"
                  : "Polling"}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Share this page with your guests — replies land here automatically.
          </p>
          <code className="mt-2 block max-w-full truncate rounded-lg border border-parchment bg-ivory px-2.5 py-1.5 text-xs text-forest/80">
            {rsvpUrl}
          </code>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href="/rsvp"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-parchment bg-ivory px-4 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            Open page
          </a>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </section>

      {copyError ? (
        <p role="alert" className="text-sm text-gold-ink">
          {copyError}
        </p>
      ) : null}

      <section aria-label="RSVP summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Replies"
            value={summary.replies}
            note="Total received"
          />
          <StatCard
            label="Attending"
            value={summary.attending}
            note="Joyfully accepted"
          />
          <StatCard
            label="Declined"
            value={summary.declined}
            note="Unable to join"
          />
          <StatCard
            label="Plus-ones"
            value={summary.plusOnes}
            note="Additional guests"
          />
          <StatCard
            label="Dietary notes"
            value={summary.dietaryNotes}
            note="Need menu care"
          />
        </div>
      </section>

      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-ink"
        >
          {actionError}
        </p>
      ) : null}

      <section aria-label="Replies">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter replies"
            className="flex flex-wrap gap-1.5 rounded-xl border border-parchment bg-ivory p-1"
          >
            {FILTERS.map((option) => {
              const active = filter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
                    active
                      ? "bg-forest text-ivory shadow-sm"
                      : "text-forest/70 hover:text-forest"
                  }`}
                >
                  {option.label}
                  <span
                    className={`text-[0.65rem] ${
                      active ? "text-ivory/70" : "text-muted"
                    }`}
                  >
                    {counts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted">
            <RefreshIcon className="h-3.5 w-3.5 text-gold" />
            Updated live{connection === "live" ? "" : " · checks every 20s"}
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-parchment bg-cream/40 px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-ivory text-forest/70">
              <GuestsIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-2xl text-forest">
              {submissions.length === 0
                ? "No replies yet"
                : "Nothing in this view"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {submissions.length === 0
                ? "When a guest sends the RSVP form, their reply will appear here the moment it arrives."
                : "Try another filter to see the rest of the replies."}
            </p>
            {submissions.length === 0 ? (
              <a
                href="/rsvp"
                className="mt-5 inline-flex items-center justify-center rounded-full border border-parchment bg-ivory px-4 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60 hover:text-gold-ink"
              >
                Open the RSVP page
              </a>
            ) : null}
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {visible.map((submission) => (
              <ReplyCard
                key={submission.id}
                submission={submission}
                highlighted={toast?.id === submission.id}
                busy={busyId === submission.id}
                onToggleHandled={(item) => void handleToggleHandled(item)}
                onDelete={(item) => void handleDelete(item)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
