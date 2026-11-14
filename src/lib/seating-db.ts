import {
  CATEGORY_OPTIONS,
  SIDE_OPTIONS,
  type GuestCategory,
  type GuestSide,
} from "@/lib/guests";
import type { Guest, RsvpStatus, SeatingTable } from "@/lib/seating";

/** Minimal shape of a `public.seating_tables` row. */
export type SeatingTableRow = {
  id: string;
  table_number: number;
  capacity: number;
};

/** Minimal shape of a `public.guests` row used by the seating planner. */
export type GuestRow = {
  id: string;
  name: string;
  party_size: number | string | null;
  side: string | null;
  category: string | null;
  rsvp_status: "pending" | "attending" | "declined";
  seating_table_id: string | null;
  seat_index: number | null;
};

export function rsvpFromDb(status: GuestRow["rsvp_status"]): RsvpStatus {
  if (status === "attending") {
    return "yes";
  }

  if (status === "declined") {
    return "no";
  }

  return "pending";
}

function partySize(value: number | string | null): number {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 1;
}

function groupLabel(side: string | null, category: string | null): string {
  const sideLabel =
    SIDE_OPTIONS.find((option) => option.id === (side as GuestSide))?.short ??
    "Shared";
  const categoryLabel =
    CATEGORY_OPTIONS.find((option) => option.id === (category as GuestCategory))
      ?.label ?? "Friends";

  return `${sideLabel} · ${categoryLabel}`;
}

export function guestFromRow(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    group: groupLabel(row.side, row.category),
    rsvp: rsvpFromDb(row.rsvp_status),
    partySize: partySize(row.party_size),
  };
}

/**
 * Turns table rows plus their guest rows into the seat arrays the planner
 * renders. A party fills `party_size` consecutive chairs from its stored
 * starting chair. Parties that no longer fit are left unseated on screen; the
 * next seating change writes the corrected position.
 */
export function buildSeatingTables(
  tables: readonly SeatingTableRow[],
  guests: readonly GuestRow[],
): SeatingTable[] {
  return [...tables]
    .sort((a, b) => a.table_number - b.table_number)
    .map((table) => {
      const capacity = Math.max(1, table.capacity);
      const seats: Array<string | null> = Array.from(
        { length: capacity },
        () => null,
      );

      for (const guest of guests) {
        const start = guest.seat_index;
        const size = partySize(guest.party_size);

        if (
          guest.seating_table_id !== table.id ||
          start === null ||
          start < 0 ||
          start >= capacity ||
          size > capacity
        ) {
          continue;
        }

        let free = true;
        for (let offset = 0; offset < size; offset += 1) {
          if (seats[(start + offset) % capacity] !== null) {
            free = false;
            break;
          }
        }

        if (!free) {
          continue;
        }

        for (let offset = 0; offset < size; offset += 1) {
          seats[(start + offset) % capacity] = guest.id;
        }
      }

      return {
        id: table.id,
        number: table.table_number,
        seats: capacity,
        guests: seats,
      };
    });
}

export type SeatAssignment = {
  tableId: string;
  seatIndex: number;
};

/**
 * Guest id → the first chair of their run. A party can wrap past the last
 * chair, so the run start is the chair whose predecessor is not the same party
 * — not simply the lowest index it occupies.
 */
export function seatAssignments(
  tables: readonly SeatingTable[],
): Map<string, SeatAssignment> {
  const assignments = new Map<string, SeatAssignment>();

  for (const table of tables) {
    const seats = table.guests.slice(0, table.seats);
    const firstSeen = new Map<string, number>();

    seats.forEach((guestId, index) => {
      if (guestId && !firstSeen.has(guestId)) {
        firstSeen.set(guestId, index);
      }
    });

    seats.forEach((guestId, index) => {
      if (!guestId || assignments.has(guestId)) {
        return;
      }

      const previous = seats[(index - 1 + seats.length) % seats.length];

      if (previous !== guestId) {
        assignments.set(guestId, { tableId: table.id, seatIndex: index });
      }
    });

    // A party that fills every chair has no run start; fall back to its first.
    for (const [guestId, index] of firstSeen) {
      if (!assignments.has(guestId)) {
        assignments.set(guestId, { tableId: table.id, seatIndex: index });
      }
    }
  }

  return assignments;
}

/**
 * Guest ids whose starting chair differs between two plans. Used to keep
 * database writes small — only moved parties are updated.
 */
export function changedSeats(
  previous: readonly SeatingTable[],
  next: readonly SeatingTable[],
): string[] {
  const before = seatAssignments(previous);
  const after = seatAssignments(next);
  const ids = new Set<string>([...before.keys(), ...after.keys()]);

  return [...ids].filter((id) => {
    const a = before.get(id);
    const b = after.get(id);

    return a?.tableId !== b?.tableId || a?.seatIndex !== b?.seatIndex;
  });
}
