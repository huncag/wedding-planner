export type RsvpStatus = "yes" | "pending" | "no";

export type Guest = {
  id: string;
  name: string;
  group: string;
  rsvp: RsvpStatus;
};

export type SeatingTable = {
  id: string;
  number: number;
  seats: number;
  /** Guest id per seat, left to right. `null` marks a free chair. */
  guests: Array<string | null>;
};

export type SeatLocation = {
  tableId: string;
  seatIndex: number;
};

export const GUEST_DRAG_TYPE = "application/x-wedding-guest";

export const MIN_SEATS = 1;
export const MAX_SEATS = 14;
export const DEFAULT_SEATS = 8;

export function findGuestSeat(
  tables: SeatingTable[],
  guestId: string,
): SeatLocation | null {
  for (const table of tables) {
    for (let index = 0; index < table.seats; index += 1) {
      if (table.guests[index] === guestId) {
        return { tableId: table.id, seatIndex: index };
      }
    }
  }

  return null;
}

/**
 * Seats a guest. If the target chair is taken, the two guests swap seats
 * (or the previous guest's chair is reused). The guest is removed from any
 * chair they occupied before, so a guest can never sit at two tables.
 */
export function assignGuest(
  tables: SeatingTable[],
  guestId: string,
  tableId: string,
  seatIndex: number,
): SeatingTable[] {
  const target = tables.find((table) => table.id === tableId);

  if (!target || seatIndex < 0 || seatIndex >= target.seats) {
    return tables;
  }

  const current = findGuestSeat(tables, guestId);

  if (
    current &&
    current.tableId === tableId &&
    current.seatIndex === seatIndex
  ) {
    return tables;
  }

  const next = tables.map((table) => ({
    ...table,
    guests: [...table.guests],
  }));
  const nextTarget = next.find((table) => table.id === tableId);
  const currentTable = current
    ? next.find((table) => table.id === current.tableId)
    : undefined;

  if (!nextTarget) {
    return tables;
  }

  const occupant = nextTarget.guests[seatIndex] ?? null;

  if (current && currentTable) {
    currentTable.guests[current.seatIndex] = null;
  }

  nextTarget.guests[seatIndex] = guestId;

  if (occupant && occupant !== guestId && current && currentTable) {
    currentTable.guests[current.seatIndex] = occupant;
  }

  return next;
}

export function unassignGuest(
  tables: SeatingTable[],
  guestId: string,
): SeatingTable[] {
  if (!findGuestSeat(tables, guestId)) {
    return tables;
  }

  return tables.map((table) => ({
    ...table,
    guests: table.guests.map((id) => (id === guestId ? null : id)),
  }));
}

export function countSeated(tables: SeatingTable[]): number {
  return tables.reduce(
    (total, table) =>
      total + table.guests.filter((guestId) => guestId !== null).length,
    0,
  );
}

export function totalCapacity(tables: SeatingTable[]): number {
  return tables.reduce((total, table) => total + table.seats, 0);
}

export function nextTableNumber(tables: SeatingTable[]): number {
  return tables.reduce((highest, table) => Math.max(highest, table.number), 0) + 1;
}

export function firstEmptySeat(table: SeatingTable): number | null {
  const index = table.guests.slice(0, table.seats).findIndex((id) => id === null);

  return index === -1 ? null : index;
}

/** Whether a drag currently in flight carries one of our guests. */
export function isGuestDrag(dataTransfer: DataTransfer): boolean {
  return (
    dataTransfer.types.includes(GUEST_DRAG_TYPE) ||
    dataTransfer.types.includes("text/plain")
  );
}

export function readDraggedGuest(dataTransfer: DataTransfer): string | null {
  return (
    dataTransfer.getData(GUEST_DRAG_TYPE) ||
    dataTransfer.getData("text/plain") ||
    null
  );
}

export function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** First name is enough to read on a chair — the full name lives in the tooltip. */
export function guestChairLabel(name: string): string {
  const [first] = name.trim().split(/\s+/);

  return first ?? name;
}
