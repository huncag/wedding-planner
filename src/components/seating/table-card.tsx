"use client";

import { useState, type DragEvent } from "react";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import {
  MAX_SEATS,
  MIN_SEATS,
  findPartyStart,
  guestChairLabel,
  isGuestDrag,
  partySizeOf,
  readDraggedGuest,
  type Guest,
  type SeatingTable,
} from "@/lib/seating";

const TABLE_SIZE = 288;
const CHAIR_RADIUS = 112;

type TableCardProps = {
  table: SeatingTable;
  guestById: Map<string, Guest>;
  selectedGuestId: string | null;
  onAssign: (guestId: string, tableId: string, seatIndex: number) => void;
  onUnassign: (guestId: string) => void;
  onSelectGuest: (guestId: string) => void;
  onChangeSeats: (tableId: string, seats: number) => void;
  onRemove: (tableId: string) => void;
};

export function TableCard({
  table,
  guestById,
  selectedGuestId,
  onAssign,
  onUnassign,
  onSelectGuest,
  onChangeSeats,
  onRemove,
}: TableCardProps) {
  const [dragOverSeat, setDragOverSeat] = useState<number | null>(null);
  const [dragOverTable, setDragOverTable] = useState(false);

  const seated = table.guests
    .slice(0, table.seats)
    .filter((guestId) => guestId !== null).length;
  const chairSize = Math.min(
    56,
    Math.max(34, Math.round((2 * Math.PI * CHAIR_RADIUS) / table.seats) - 8),
  );
  const chairPercent = (chairSize / TABLE_SIZE) * 100;
  const radiusPercent = (CHAIR_RADIUS / TABLE_SIZE) * 100;

  const handleSeatClick = (index: number, guestId: string | null) => {
    if (guestId) {
      if (selectedGuestId && selectedGuestId !== guestId) {
        onAssign(selectedGuestId, table.id, index);
      } else if (selectedGuestId === guestId) {
        onUnassign(guestId);
      } else {
        onSelectGuest(guestId);
      }

      return;
    }

    if (selectedGuestId) {
      onAssign(selectedGuestId, table.id, index);
    }
  };

  const handleSeatDrop = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverSeat(null);

    const guestId = readDraggedGuest(event.dataTransfer);
    if (guestId) {
      onAssign(guestId, table.id, index);
    }
  };

  const handleTableDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverTable(false);

    const guestId = readDraggedGuest(event.dataTransfer);

    if (!guestId) {
      return;
    }

    const size = partySizeOf(guestById.get(guestId));
    const start = findPartyStart(table, size, 0, guestId);
    // When the party does not fit, still route through onAssign so the planner
    // can explain why instead of silently ignoring the drop.
    onAssign(guestId, table.id, start ?? 0);
  };

  return (
    <article className="animate-table-in flex flex-col items-center rounded-2xl border border-parchment/80 bg-white/65 p-4 shadow-sm transition-colors hover:border-gold/40">
      <div className="relative aspect-square w-full max-w-[288px]">
        <div
          onDragOver={(event) => {
            if (isGuestDrag(event.dataTransfer)) {
              event.preventDefault();
              setDragOverTable(true);
            }
          }}
          onDragLeave={() => setDragOverTable(false)}
          onDrop={handleTableDrop}
          className={`absolute left-1/2 top-1/2 flex aspect-square w-[38.9%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-gradient-to-br from-forest to-forest-700 text-ivory shadow-lg shadow-forest/20 transition-all duration-200 ${
            dragOverTable
              ? "scale-105 border-gold ring-4 ring-gold/30"
              : "border-gold/30"
          }`}
        >
          <span className="font-display text-3xl leading-none text-gold-light sm:text-4xl">
            {String(table.number).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[0.5rem] uppercase tracking-[0.26em] text-ivory/55">
            Table
          </span>
        </div>

        {Array.from({ length: table.seats }, (_, index) => {
          const guestId = table.guests[index] ?? null;
          const guest = guestId ? guestById.get(guestId) : undefined;
          const previous = table.guests[(index - 1 + table.seats) % table.seats];
          const isPartyStart = Boolean(guestId) && previous !== guestId;
          const size = partySizeOf(guest);
          const selected = Boolean(guestId && guestId === selectedGuestId);
          const dragging = dragOverSeat === index;
          const angle = (index / table.seats) * 2 * Math.PI - Math.PI / 2;
          const left = 50 + radiusPercent * Math.cos(angle);
          const top = 50 + radiusPercent * Math.sin(angle);

          return (
            <button
              key={`${table.id}-seat-${index}`}
              type="button"
              onClick={() => handleSeatClick(index, guestId)}
              onDragOver={(event) => {
                if (isGuestDrag(event.dataTransfer)) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverSeat(index);
                }
              }}
              onDragLeave={() => setDragOverSeat(null)}
              onDrop={(event) => handleSeatDrop(event, index)}
              title={
                guest
                  ? `${guest.name} · ${size} ${size === 1 ? "person" : "people"} · Table ${table.number}, seat ${index + 1}`
                  : `Empty seat ${index + 1} at table ${table.number}`
              }
              aria-label={
                guest
                  ? `${guest.name}, ${size} ${size === 1 ? "person" : "people"}, table ${table.number}, seat ${index + 1}. Select to move or unseat.`
                  : `Empty seat ${index + 1} at table ${table.number}`
              }
              className={`absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-center transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory ${
                dragging
                  ? "scale-110 border-gold bg-gold-light text-forest ring-2 ring-gold/40"
                  : guest
                    ? selected
                      ? "border-gold bg-gold text-white shadow-md shadow-gold/30"
                      : isPartyStart
                        ? "border-forest/20 bg-forest text-ivory shadow-sm hover:scale-105 hover:bg-forest-700"
                        : "border-forest/10 bg-forest/75 text-ivory/90 hover:scale-105 hover:bg-forest"
                    : selectedGuestId
                      ? "border-gold/50 bg-cream/80 text-forest hover:scale-105 hover:border-gold hover:bg-cream"
                      : "border-dashed border-parchment bg-ivory/80 text-muted/70 hover:scale-105 hover:border-gold hover:bg-cream hover:text-forest"
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${chairPercent}%`,
              }}
            >
              {guest ? (
                isPartyStart ? (
                  <span className="px-0.5 text-[8px] font-medium leading-[1.05] break-words sm:text-[9px]">
                    {guestChairLabel(guest.name)}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="text-[9px] leading-none opacity-70"
                  >
                    •
                  </span>
                )
              ) : (
                <span className="text-[8px] font-medium leading-none sm:text-[9px]">
                  {selectedGuestId ? "+" : index + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted">
        {seated} of {table.seats} seated
      </p>

      <div className="mt-3 flex w-full items-center justify-between gap-2 border-t border-parchment/60 pt-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-parchment bg-ivory/80 p-1">
          <button
            type="button"
            onClick={() => onChangeSeats(table.id, table.seats - 1)}
            disabled={table.seats <= MIN_SEATS}
            aria-label={`Remove a seat from table ${table.number}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-forest/70 transition-colors hover:bg-cream hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-14 text-center text-[0.6rem] font-medium uppercase tracking-[0.12em] text-forest/70">
            {table.seats} {table.seats === 1 ? "seat" : "seats"}
          </span>
          <button
            type="button"
            onClick={() => onChangeSeats(table.id, table.seats + 1)}
            disabled={table.seats >= MAX_SEATS}
            aria-label={`Add a seat to table ${table.number}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-forest/70 transition-colors hover:bg-cream hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(table.id)}
          aria-label={`Remove table ${table.number}`}
          title={`Remove table ${table.number}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-muted transition-colors hover:border-parchment hover:bg-cream hover:text-forest"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
