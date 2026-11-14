"use client";

import {
  useCallback,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import {
  CheckIcon,
  GripIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import { TableCard } from "@/components/seating/table-card";
import {
  DEFAULT_SEATS,
  GUEST_DRAG_TYPE,
  MAX_SEATS,
  MIN_SEATS,
  assignGuest,
  countSeated,
  guestInitials,
  isGuestDrag,
  nextTableNumber,
  readDraggedGuest,
  totalCapacity,
  unassignGuest,
  type Guest,
  type SeatingTable,
} from "@/lib/seating";
import { changedSeats, seatAssignments } from "@/lib/seating-db";
import { createClient } from "@/lib/supabase/client";

function describeError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl leading-none text-forest">
        {value}
      </p>
    </div>
  );
}

export function SeatingPlanner({
  initialTables,
  initialGuests,
  initialError = null,
}: {
  initialTables: SeatingTable[];
  initialGuests: Guest[];
  initialError?: string | null;
}) {
  const [tables, setTables] = useState<SeatingTable[]>(initialTables);
  const [guests] = useState<Guest[]>(initialGuests);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(initialError);

  const guestById = useMemo(
    () => new Map<string, Guest>(guests.map((guest) => [guest.id, guest])),
    [guests],
  );
  const confirmedGuests = useMemo(
    () => guests.filter((guest) => guest.rsvp === "yes"),
    [guests],
  );

  const seatByGuest = useMemo(() => {
    const map = new Map<
      string,
      { tableNumber: number; seatNumber: number }
    >();

    for (const table of tables) {
      table.guests.forEach((guestId, index) => {
        if (guestId) {
          map.set(guestId, {
            tableNumber: table.number,
            seatNumber: index + 1,
          });
        }
      });
    }

    return map;
  }, [tables]);

  const seatedCount = countSeated(tables);
  const capacity = totalCapacity(tables);
  const seatedConfirmed = confirmedGuests.filter((guest) =>
    seatByGuest.has(guest.id),
  ).length;
  const progress =
    confirmedGuests.length === 0
      ? 0
      : Math.round((seatedConfirmed / confirmedGuests.length) * 100);

  const selectedGuest = selectedGuestId
    ? (guestById.get(selectedGuestId) ?? null)
    : null;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGuests = normalizedQuery
    ? confirmedGuests.filter((guest) =>
        guest.name.toLowerCase().includes(normalizedQuery),
      )
    : confirmedGuests;

  /**
   * Writes only the guests whose chair changed. Chairs are cleared first so a
   * swap never trips the unique (table_id, seat_index) index mid-update.
   */
  const saveSeating = useCallback(
    async (
      previous: SeatingTable[],
      next: SeatingTable[],
    ): Promise<string | null> => {
      const changed = changedSeats(previous, next);

      if (changed.length === 0) {
        return null;
      }

      const after = seatAssignments(next);
      const supabase = createClient();

      const { error: clearError } = await supabase
        .from("guests")
        .update({ seating_table_id: null, seat_index: null })
        .in("id", changed);

      if (clearError) {
        return clearError.message;
      }

      const updates = changed.flatMap((id) => {
        const seat = after.get(id);

        return seat
          ? [
              {
                id,
                seating_table_id: seat.tableId,
                seat_index: seat.seatIndex,
              },
            ]
          : [];
      });

      const results = await Promise.all(
        updates.map((update) =>
          supabase
            .from("guests")
            .update({
              seating_table_id: update.seating_table_id,
              seat_index: update.seat_index,
            })
            .eq("id", update.id),
        ),
      );

      return results.find((result) => result.error)?.error?.message ?? null;
    },
    [],
  );

  const applyTables = useCallback(
    async (mutate: (current: SeatingTable[]) => SeatingTable[]) => {
      const previous = tables;
      const next = mutate(previous);

      if (next === previous) {
        return;
      }

      setTables(next);
      setSaveError(null);

      try {
        const failure = await saveSeating(previous, next);

        if (failure) {
          setTables(previous);
          setSaveError(`Could not save the seating plan: ${failure}`);
        }
      } catch {
        setTables(previous);
        setSaveError(
          "Could not reach Supabase. The seating change was not saved.",
        );
      }
    },
    [tables, saveSeating],
  );

  const handleAssign = useCallback(
    (guestId: string, tableId: string, seatIndex: number) => {
      void applyTables((current) =>
        assignGuest(current, guestId, tableId, seatIndex),
      );
      setSelectedGuestId(null);
    },
    [applyTables],
  );

  const handleUnassign = useCallback(
    (guestId: string) => {
      void applyTables((current) => unassignGuest(current, guestId));
      setSelectedGuestId((current) => (current === guestId ? null : current));
    },
    [applyTables],
  );

  const handleSelectGuest = useCallback((guestId: string) => {
    setSelectedGuestId((current) => (current === guestId ? null : guestId));
  }, []);

  const handleChangeSeats = useCallback(
    async (tableId: string, seats: number) => {
      const table = tables.find((entry) => entry.id === tableId);

      if (!table) {
        return;
      }

      const nextSeats = Math.min(MAX_SEATS, Math.max(MIN_SEATS, seats));

      if (nextSeats === table.seats) {
        return;
      }

      const previous = tables;
      const next = previous.map((entry) => {
        if (entry.id !== tableId) {
          return entry;
        }

        const chairs = entry.guests.slice(0, nextSeats);

        while (chairs.length < nextSeats) {
          chairs.push(null);
        }

        return { ...entry, seats: nextSeats, guests: chairs };
      });

      setTables(next);
      setSaveError(null);

      const displaced = table.guests
        .slice(nextSeats)
        .filter((guestId): guestId is string => Boolean(guestId));

      try {
        const supabase = createClient();

        if (displaced.length > 0) {
          const { error: unseatError } = await supabase
            .from("guests")
            .update({ seating_table_id: null, seat_index: null })
            .in("id", displaced);

          if (unseatError) {
            throw new Error(unseatError.message);
          }
        }

        const { error: capacityError } = await supabase
          .from("seating_tables")
          .update({ capacity: nextSeats })
          .eq("id", tableId);

        if (capacityError) {
          throw new Error(capacityError.message);
        }
      } catch (error) {
        setTables(previous);
        setSaveError(
          `Could not resize the table: ${describeError(error, "unknown error")}`,
        );
      }
    },
    [tables],
  );

  const handleRemoveTable = useCallback(
    async (tableId: string) => {
      const previous = tables;
      setTables((current) => current.filter((table) => table.id !== tableId));
      setSaveError(null);

      try {
        const supabase = createClient();

        // Clear the chairs first so no guest keeps a dangling seat reference.
        const { error: unseatError } = await supabase
          .from("guests")
          .update({ seating_table_id: null, seat_index: null })
          .eq("seating_table_id", tableId);

        if (unseatError) {
          throw new Error(unseatError.message);
        }

        const { error } = await supabase
          .from("seating_tables")
          .delete()
          .eq("id", tableId);

        if (error) {
          throw new Error(error.message);
        }
      } catch (error) {
        setTables(previous);
        setSaveError(
          `Could not remove the table: ${describeError(error, "unknown error")}`,
        );
      }
    },
    [tables],
  );

  const handleAddTable = useCallback(async () => {
    setIsAddingTable(true);
    setSaveError(null);
    const number = nextTableNumber(tables);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("seating_tables")
        .insert({ table_number: number, capacity: DEFAULT_SEATS })
        .select("id, capacity")
        .single();

      if (error || !data) {
        setSaveError(
          `Could not add the table: ${error?.message ?? "unknown error"}`,
        );
        return;
      }

      const seats = Math.max(1, data.capacity as number);

      setTables((current) => [
        ...current,
        {
          id: data.id as string,
          number,
          seats,
          guests: Array.from({ length: seats }, () => null),
        },
      ]);
    } catch {
      setSaveError("Could not reach Supabase. The table was not added.");
    } finally {
      setIsAddingTable(false);
    }
  }, [tables]);

  const handlePanelDragOver = (event: DragEvent<HTMLElement>) => {
    if (isGuestDrag(event.dataTransfer)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setIsDropTarget(true);
    }
  };

  const handlePanelDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDropTarget(false);

    const guestId = readDraggedGuest(event.dataTransfer);
    if (guestId) {
      handleUnassign(guestId);
    }
  };

  return (
    <div className="space-y-4">
      {saveError ? (
        <p
          role="alert"
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-ink"
        >
          {saveError}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-parchment/80 bg-white/70 p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                <Stat label="Tables" value={tables.length} />
                <Stat label="Seated" value={`${seatedCount}`} />
                <Stat label="Free seats" value={capacity - seatedCount} />
              </div>

              <div className="w-full min-w-[12rem] flex-1 sm:max-w-xs">
                <div className="flex items-center justify-between text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
                  <span>Seating progress</span>
                  <span className="text-forest">{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment/70">
                  <div
                    className="h-full rounded-full bg-forest transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[0.65rem] text-muted">
                  {seatedConfirmed} of {confirmedGuests.length} confirmed guests
                  seated
                </p>
              </div>
            </div>
          </section>

          <div
            className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
              selectedGuest
                ? "border-gold/60 bg-cream/70"
                : "border-parchment/70 bg-white/50"
            }`}
          >
            {selectedGuest ? (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm text-white">
                  {guestInitials(selectedGuest.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-forest">
                    Seating {selectedGuest.name}
                  </p>
                  <p className="text-[0.65rem] text-muted">
                    Tap an empty chair, or drop the guest onto a table.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGuestId(null)}
                  className="rounded-full border border-gold/40 bg-ivory/80 px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-forest transition-colors hover:bg-cream"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-parchment bg-ivory text-muted">
                  <GripIcon className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-muted">
                  Drag a confirmed guest onto a chair, or select a guest and tap
                  a seat. Drop a guest back on the list to unseat them.
                </p>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                guestById={guestById}
                selectedGuestId={selectedGuestId}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onSelectGuest={handleSelectGuest}
                onChangeSeats={handleChangeSeats}
                onRemove={handleRemoveTable}
              />
            ))}

            <button
              type="button"
              onClick={handleAddTable}
              disabled={isAddingTable}
              className="animate-table-in flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-parchment bg-cream/25 p-6 text-center transition-colors hover:border-gold/60 hover:bg-cream/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:cursor-wait disabled:opacity-60"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-white/70 text-forest shadow-sm">
                <PlusIcon className="h-6 w-6" />
              </span>
              <span className="font-display text-xl text-forest">
                {isAddingTable ? "Adding…" : "Add a table"}
              </span>
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
                Starts with {DEFAULT_SEATS} seats
              </span>
            </button>
          </div>
        </div>

        <aside
          onDragOver={handlePanelDragOver}
          onDragLeave={() => setIsDropTarget(false)}
          onDrop={handlePanelDrop}
          className={`flex flex-col rounded-2xl border p-5 shadow-sm transition-colors xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-hidden ${
            isDropTarget
              ? "border-gold bg-cream/70 ring-2 ring-gold/20"
              : "border-parchment/80 bg-white/70"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-gold-ink">
                RSVP confirmed
              </p>
              <h2 className="mt-1 font-display text-2xl leading-none text-forest">
                Guests
              </h2>
            </div>
            <span className="rounded-full border border-parchment bg-cream/70 px-3 py-1 text-xs font-medium text-forest">
              {confirmedGuests.length}
            </span>
          </div>

          <label className="relative mt-4 block">
            <span className="sr-only">Search confirmed guests</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guests"
              className="w-full rounded-xl border border-parchment bg-ivory/80 py-2 pl-9 pr-3 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </label>

          <ul
            aria-label="Confirmed guests"
            className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1"
          >
            {visibleGuests.map((guest) => {
              const seat = seatByGuest.get(guest.id);
              const selected = guest.id === selectedGuestId;

              return (
                <li key={guest.id}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(GUEST_DRAG_TYPE, guest.id);
                      event.dataTransfer.setData("text/plain", guest.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => handleSelectGuest(guest.id)}
                    aria-pressed={selected}
                    className={`group flex w-full cursor-grab items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 active:cursor-grabbing ${
                      selected
                        ? "border-gold bg-cream/80 shadow-sm ring-1 ring-gold/30"
                        : "border-transparent bg-ivory/70 hover:border-parchment hover:bg-cream/60"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm transition-colors ${
                        selected
                          ? "bg-gold text-white"
                          : "bg-cream text-forest"
                      }`}
                    >
                      {guestInitials(guest.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-forest">
                        {guest.name}
                      </span>
                      <span className="mt-0.5 block text-[0.65rem] text-muted">
                        {seat
                          ? `Table ${seat.tableNumber} · Seat ${seat.seatNumber}`
                          : "Not seated"}
                      </span>
                    </span>
                    {seat ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    ) : (
                      <GripIcon className="h-4 w-4 shrink-0 text-muted/50 transition-colors group-hover:text-forest/60" />
                    )}
                  </button>
                </li>
              );
            })}

            {visibleGuests.length === 0 ? (
              <li className="rounded-xl border border-dashed border-parchment px-4 py-8 text-center text-xs leading-relaxed text-muted">
                {confirmedGuests.length === 0
                  ? "No confirmed guests yet. Guests who reply “attending” appear here automatically."
                  : `No confirmed guests match “${query.trim()}”.`}
              </li>
            ) : null}
          </ul>

          <p className="mt-3 rounded-xl border border-dashed border-parchment bg-ivory/60 px-3 py-2 text-center text-[0.65rem] leading-relaxed text-muted">
            Drag a guest here to unseat them
          </p>

          <p className="mt-3 text-[0.65rem] leading-relaxed text-muted">
            Every change is saved for both of you. Guests arrive from the public
            RSVP form, so seating stays in step with the replies.
          </p>
        </aside>
      </div>
    </div>
  );
}
