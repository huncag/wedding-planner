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

export function guestFromRow(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    group: "Guests",
    rsvp: rsvpFromDb(row.rsvp_status),
  };
}

/**
 * Turns table rows plus their guest rows into the seat arrays the planner
 * renders. Guests whose stored seat no longer fits the table are left out; the
 * next capacity change will not overwrite their row.
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
        const index = guest.seat_index;

        if (
          guest.seating_table_id === table.id &&
          index !== null &&
          index >= 0 &&
          index < capacity &&
          seats[index] === null
        ) {
          seats[index] = guest.id;
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

/** Guest id → the chair they currently occupy. */
export function seatAssignments(
  tables: readonly SeatingTable[],
): Map<string, SeatAssignment> {
  const assignments = new Map<string, SeatAssignment>();

  for (const table of tables) {
    table.guests.forEach((guestId, index) => {
      if (guestId) {
        assignments.set(guestId, { tableId: table.id, seatIndex: index });
      }
    });
  }

  return assignments;
}

/**
 * Guest ids whose chair differs between two plans. Used to keep database writes
 * small — only moved guests are updated.
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
