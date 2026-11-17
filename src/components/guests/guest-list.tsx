"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CheckIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { GuestForm } from "@/components/guests/guest-form";
import {
  CATEGORY_OPTIONS,
  RSVP_STATUS_OPTIONS,
  SIDE_OPTIONS,
  attendingPeople,
  categoryLabel,
  groupGuests,
  guestPartyFromRow,
  guestRowFromDraft,
  matchesGuestQuery,
  sideLabel,
  summarizeGuests,
  type GuestCategory,
  type GuestDraft,
  type GuestParty,
  type GuestRow,
  type GuestRsvpStatus,
  type GuestSide,
} from "@/lib/guests";
import { createClient } from "@/lib/supabase/client";

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function partyPatch(draft: GuestDraft): Partial<GuestParty> {
  return {
    name: draft.name.trim(),
    partySize: Math.max(1, Math.round(draft.partySize)),
    side: draft.side,
    category: draft.category,
    rsvpStatus: draft.rsvpStatus,
    confirmedCount: draft.confirmedCount,
    inviteSent: draft.inviteSent,
    inviteReminder: draft.inviteReminder,
    inviteType: draft.inviteType.trim() || null,
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    notes: draft.notes.trim() || null,
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-parchment/80 bg-white/70 p-4 shadow-sm">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl leading-none text-forest">
        {value}
      </p>
    </div>
  );
}

function statusClasses(status: GuestRsvpStatus): string {
  if (status === "attending") {
    return "border-forest/25 bg-forest/10 text-forest";
  }

  if (status === "declined") {
    return "border-parchment bg-ivory text-muted";
  }

  return "border-gold/45 bg-gold/10 text-gold-ink";
}

export function GuestList({
  initialParties,
  initialError = null,
}: {
  initialParties: GuestParty[];
  initialError?: string | null;
}) {
  const [parties, setParties] = useState<GuestParty[]>(initialParties);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | GuestSide>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | GuestCategory>(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | GuestRsvpStatus>(
    "all",
  );
  const [saveError, setSaveError] = useState<string | null>(initialError);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const stats = useMemo(() => summarizeGuests(parties), [parties]);
  const editing = editingId
    ? (parties.find((party) => party.id === editingId) ?? null)
    : null;

  const filtered = useMemo(
    () =>
      parties.filter(
        (party) =>
          matchesGuestQuery(party, query) &&
          (sideFilter === "all" || party.side === sideFilter) &&
          (categoryFilter === "all" || party.category === categoryFilter) &&
          (statusFilter === "all" || party.rsvpStatus === statusFilter),
      ),
    [parties, query, sideFilter, categoryFilter, statusFilter],
  );

  const grouped = useMemo(() => groupGuests(filtered), [filtered]);

  const setPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async (draft: GuestDraft) => {
    setSaveError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guests")
        .insert(guestRowFromDraft(draft))
        .select("*")
        .single();

      if (error || !data) {
        setSaveError(
          `Could not add the invitation group: ${
            error?.message ?? "unknown error"
          }`,
        );
        return false;
      }

      setParties((current) => [
        ...current,
        guestPartyFromRow(data as GuestRow),
      ]);
      setCreateOpen(false);
      return true;
    } catch (error) {
      setSaveError(
        `Could not reach Supabase. The group was not added: ${describeError(
          error,
          "unknown error",
        )}`,
      );
      return false;
    }
  }, []);

  const handleUpdate = useCallback(
    async (id: string, draft: GuestDraft) => {
      const previous = parties.find((party) => party.id === id);

      if (!previous) {
        return false;
      }

      setSaveError(null);
      setPending(id, true);
      setParties((current) =>
        current.map((party) =>
          party.id === id ? { ...party, ...partyPatch(draft) } : party,
        ),
      );

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("guests")
          .update(guestRowFromDraft(draft))
          .eq("id", id)
          .select("*")
          .single();

        if (error || !data) {
          setParties((current) =>
            current.map((party) => (party.id === id ? previous : party)),
          );
          setSaveError(
            `Could not save the invitation group: ${
              error?.message ?? "unknown error"
            }`,
          );
          return false;
        }

        setParties((current) =>
          current.map((party) =>
            party.id === id ? guestPartyFromRow(data as GuestRow) : party,
          ),
        );
        setEditingId(null);
        return true;
      } catch (error) {
        setParties((current) =>
          current.map((party) => (party.id === id ? previous : party)),
        );
        setSaveError(
          `Could not reach Supabase. The group was not saved: ${describeError(
            error,
            "unknown error",
          )}`,
        );
        return false;
      } finally {
        setPending(id, false);
      }
    },
    [parties, setPending],
  );

  const patchParty = useCallback(
    async (
      id: string,
      optimistic: Partial<GuestParty>,
      row: Record<string, unknown>,
    ) => {
      const previous = parties.find((party) => party.id === id);

      if (!previous) {
        return;
      }

      setSaveError(null);
      setPending(id, true);
      setParties((current) =>
        current.map((party) =>
          party.id === id ? { ...party, ...optimistic } : party,
        ),
      );

      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("guests")
          .update(row)
          .eq("id", id);

        if (error) {
          setParties((current) =>
            current.map((party) => (party.id === id ? previous : party)),
          );
          setSaveError(`Could not update the invitation: ${error.message}`);
        }
      } catch (error) {
        setParties((current) =>
          current.map((party) => (party.id === id ? previous : party)),
        );
        setSaveError(
          `Could not reach Supabase. The change was not saved: ${describeError(
            error,
            "unknown error",
          )}`,
        );
      } finally {
        setPending(id, false);
      }
    },
    [parties, setPending],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const index = parties.findIndex((party) => party.id === id);

      if (index === -1) {
        return;
      }

      const removed = parties[index];
      setSaveError(null);
      setPending(id, true);
      setParties((current) => current.filter((party) => party.id !== id));
      setEditingId((current) => (current === id ? null : current));

      try {
        const supabase = createClient();
        const { error } = await supabase.from("guests").delete().eq("id", id);

        if (error) {
          setParties((current) => {
            const next = [...current];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
          setSaveError(
            `Could not delete the invitation group: ${error.message}`,
          );
        }
      } catch (error) {
        setParties((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        setSaveError(
          `Could not reach Supabase. The group was not deleted: ${describeError(
            error,
            "unknown error",
          )}`,
        );
      } finally {
        setPending(id, false);
      }
    },
    [parties, setPending],
  );

  return (
    <div className="space-y-6">
      {saveError ? (
        <p
          role="alert"
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-ink"
        >
          {saveError}
        </p>
      ) : null}

      <section
        aria-label="Guest summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Stat label="Invitation groups" value={stats.parties} />
        <Stat label="People invited" value={stats.people} />
        <Stat
          label="Coming"
          value={`${stats.attendingPeople} people`}
          />
        <Stat label="Invites sent" value={`${stats.inviteSent} / ${stats.parties}`} />
      </section>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search invitation groups</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names, notes, email"
              className="w-full rounded-xl border border-parchment bg-ivory/80 py-2 pl-9 pr-3 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setCreateOpen((current) => !current);
              setEditingId(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            {createOpen ? (
              <CloseIcon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {createOpen ? "Close form" : "Add invitation group"}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={sideFilter}
            onChange={(event) =>
              setSideFilter(event.target.value as "all" | GuestSide)
            }
            aria-label="Filter by side"
            className="rounded-xl border border-parchment bg-ivory/80 px-3 py-2 text-xs text-forest focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">All sides</option>
            {SIDE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as "all" | GuestCategory)
            }
            aria-label="Filter by category"
            className="rounded-xl border border-parchment bg-ivory/80 px-3 py-2 text-xs text-forest focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">All categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | GuestRsvpStatus)
            }
            aria-label="Filter by reply"
            className="rounded-xl border border-parchment bg-ivory/80 px-3 py-2 text-xs text-forest focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">All replies</option>
            {RSVP_STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {createOpen ? (
        <section className="rounded-2xl border border-parchment/80 bg-white/70 p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-2xl text-forest">
            New invitation group
          </h2>
          <p className="mt-1 text-sm text-muted">
            One row covers everyone invited together, exactly like the
            spreadsheet.
          </p>
          <div className="mt-5">
            <GuestForm
              key="new-guest"
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </section>
      ) : null}

      {editing ? (
        <section className="rounded-2xl border border-gold/40 bg-cream/50 p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-2xl text-forest">
            Edit {editing.name}
          </h2>
          <div className="mt-5">
            <GuestForm
              key={editing.id}
              initial={editing}
              onSubmit={(draft) => handleUpdate(editing.id, draft)}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </section>
      ) : null}

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-parchment bg-cream/40 px-6 py-10 text-center text-sm text-muted">
          {parties.length === 0
            ? "No invitation groups yet. Add the first one above, or let the RSVP form bring guests in."
            : "No groups match these filters."}
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map((side) => {
            const sideTotal = side.categories.reduce(
              (total, category) => total + category.parties.length,
              0,
            );
            const sidePeople = side.categories.reduce(
              (total, category) =>
                total +
                category.parties.reduce(
                  (sum, party) => sum + party.partySize,
                  0,
                ),
              0,
            );

            return (
              <section
                key={side.id}
                className="overflow-hidden rounded-2xl border border-parchment/80 bg-white/70 shadow-sm"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-parchment/70 bg-cream/40 px-5 py-3.5">
                  <h2 className="font-display text-xl text-forest">
                    {side.label}
                  </h2>
                  <p className="text-xs text-muted">
                    {sideTotal} {sideTotal === 1 ? "group" : "groups"} ·{" "}
                    {sidePeople} {sidePeople === 1 ? "person" : "people"}
                  </p>
                </header>

                <div className="divide-y divide-parchment/60">
                  {side.categories.map((category) => {
                    const categoryPeople = category.parties.reduce(
                      (sum, party) => sum + party.partySize,
                      0,
                    );

                    return (
                      <div key={category.id}>
                        <h3 className="flex items-baseline justify-between gap-2 px-5 pt-4 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
                          {category.label}
                          <span className="font-normal tracking-normal normal-case text-[0.65rem]">
                            {category.parties.length} · {categoryPeople} people
                          </span>
                        </h3>

                        <ul className="divide-y divide-parchment/40">
                          {category.parties.map((party) => {
                            const pending = pendingIds.has(party.id);
                            const confirmed =
                              party.confirmedCount ?? attendingPeople(party);
                            const showsConfirmed =
                              party.confirmedCount !== null &&
                              (party.confirmedCount > 0 ||
                                party.rsvpStatus !== "pending");

                            return (
                              <li
                                key={party.id}
                                className="grid gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-forest">
                                    {party.name}
                                  </p>
                                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[0.65rem] text-muted">
                                    <span>
                                      {party.partySize}{" "}
                                      {party.partySize === 1
                                        ? "person"
                                        : "people"}
                                    </span>
                                    {showsConfirmed ? (
                                      <>
                                        <span aria-hidden>·</span>
                                        <span>
                                          {confirmed} confirmed
                                        </span>
                                      </>
                                    ) : null}
                                    {party.inviteType ? (
                                      <>
                                        <span aria-hidden>·</span>
                                        <span>{party.inviteType}</span>
                                      </>
                                    ) : null}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void patchParty(
                                        party.id,
                                        { inviteSent: !party.inviteSent },
                                        { invite_sent: !party.inviteSent },
                                      )
                                    }
                                    disabled={pending}
                                    aria-pressed={party.inviteSent}
                                    title="Toggle invitation sent"
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
                                      party.inviteSent
                                        ? "border-forest/25 bg-forest/10 text-forest"
                                        : "border-parchment bg-white text-muted hover:border-forest/30 hover:text-forest"
                                    }`}
                                  >
                                    {party.inviteSent ? (
                                      <CheckIcon className="h-3 w-3" />
                                    ) : null}
                                    Invite
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void patchParty(
                                        party.id,
                                        {
                                          inviteReminder:
                                            !party.inviteReminder,
                                        },
                                        {
                                          invite_reminder:
                                            !party.inviteReminder,
                                        },
                                      )
                                    }
                                    disabled={pending}
                                    aria-pressed={party.inviteReminder}
                                    title="Toggle reminder sent"
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${
                                      party.inviteReminder
                                        ? "border-gold/50 bg-gold/10 text-gold-ink"
                                        : "border-parchment bg-white text-muted hover:border-gold/40 hover:text-forest"
                                    }`}
                                  >
                                    {party.inviteReminder ? (
                                      <CheckIcon className="h-3 w-3" />
                                    ) : null}
                                    Reminder
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 sm:justify-end">
                                  <select
                                    value={party.rsvpStatus}
                                    disabled={pending}
                                    aria-label={`Reply status for ${party.name}`}
                                    onChange={(event) => {
                                      const status = event.target
                                        .value as GuestRsvpStatus;
                                      void patchParty(
                                        party.id,
                                        { rsvpStatus: status },
                                        { rsvp_status: status },
                                      );
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-50 ${statusClasses(
                                      party.rsvpStatus,
                                    )}`}
                                  >
                                    {RSVP_STATUS_OPTIONS.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.short}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(party.id);
                                      setCreateOpen(false);
                                    }}
                                    className="rounded-full border border-parchment bg-white px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-forest/80 transition-colors hover:border-gold/50 hover:text-forest"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(party.id)}
                                    disabled={pending}
                                    aria-label={`Delete ${party.name}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted transition-colors hover:border-parchment hover:bg-white hover:text-forest disabled:opacity-40"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted">
        {filtered.length} of {parties.length} groups shown ·{" "}
        {categoryLabel("family")}, {categoryLabel("family_friends")},{" "}
        {categoryLabel("friends")} and {categoryLabel("staff")} · side{" "}
        {sideLabel("eszter")}, {sideLabel("huni")} or {sideLabel("shared")}.
        Every change saves for both of you.
      </p>
    </div>
  );
}
