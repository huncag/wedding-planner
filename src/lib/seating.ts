export type RsvpStatus = "yes" | "pending" | "no";

export type Guest = {
  id: string;
  name: string;
  /** Invitation group label shown in the sidebar, e.g. "Eszter · Family". */
  group: string;
  rsvp: RsvpStatus;
  /** Number of people in this invitation group. */
  partySize: number;
};

export type SeatingTable = {
  id: string;
  number: number;
  seats: number;
  /**
   * Guest id per chair, left to right. A party repeats across consecutive
   * chairs; `null` marks a free chair.
   */
  guests: Array<string | null>;
};

export type SeatLocation = {
  tableId: string;
  seatIndex: number;
};

export const GUEST_DRAG_TYPE = "application/x-wedding-guest";

export const MIN_SEATS = 1;
export const MAX_SEATS = 14;
export const DEFAULT_SEATS = 10;

export function partySizeOf(guest: Guest | undefined): number {
  return Math.max(1, guest?.partySize ?? 1);
}

/** First chair of a party, or null when the party is not seated. */
export function findGuestSeat(
  tables: SeatingTable[],
  guestId: string,
): SeatLocation | null {
  for (const table of tables) {
    const index = table.guests
      .slice(0, table.seats)
      .findIndex((id) => id === guestId);

    if (index !== -1) {
      return { tableId: table.id, seatIndex: index };
    }
  }

  return null;
}

/** Every chair a party currently occupies, wrapping around the table. */
export function guestChairIndices(table: SeatingTable, guestId: string): number[] {
  const indices: number[] = [];

  for (let index = 0; index < table.seats; index += 1) {
    if (table.guests[index] === guestId) {
      indices.push(index);
    }
  }

  return indices;
}

function fitsAt(
  table: SeatingTable,
  start: number,
  size: number,
  guestId?: string,
): boolean {
  if (size < 1 || size > table.seats) {
    return false;
  }

  for (let offset = 0; offset < size; offset += 1) {
    const index = (start + offset) % table.seats;
    const occupant = table.guests[index] ?? null;

    if (occupant !== null && occupant !== guestId) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the first run of `size` free chairs, scanning forward from `preferred`
 * and wrapping around the table. Returns null when the party does not fit.
 */
export function findPartyStart(
  table: SeatingTable,
  size: number,
  preferred = 0,
  guestId?: string,
): number | null {
  if (size > table.seats) {
    return null;
  }

  for (let offset = 0; offset < table.seats; offset += 1) {
    const start = (preferred + offset) % table.seats;

    if (fitsAt(table, start, size, guestId)) {
      return start;
    }
  }

  return null;
}

export type PlacePartyResult = {
  tables: SeatingTable[];
  placed: boolean;
};

/**
 * Seats a whole party on consecutive chairs. The party is removed from its
 * previous table first. If there is no free run large enough, the plan is left
 * untouched and `placed` is false so the caller can explain why.
 */
export function placeParty(
  tables: SeatingTable[],
  guestId: string,
  tableId: string,
  seatIndex: number,
  partySize: number,
): PlacePartyResult {
  const target = tables.find((table) => table.id === tableId);

  if (!target) {
    return { tables, placed: false };
  }

  const size = Math.max(1, Math.round(partySize));
  const cleared = tables.map((table) => ({
    ...table,
    guests: table.guests.map((id) => (id === guestId ? null : id)),
  }));
  const nextTarget = cleared.find((table) => table.id === tableId);

  if (!nextTarget) {
    return { tables, placed: false };
  }

  const start = findPartyStart(
    nextTarget,
    size,
    Math.min(Math.max(0, seatIndex), nextTarget.seats - 1),
  );

  if (start === null) {
    return { tables, placed: false };
  }

  for (let offset = 0; offset < size; offset += 1) {
    nextTarget.guests[(start + offset) % nextTarget.seats] = guestId;
  }

  return { tables: cleared, placed: true };
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

/** Occupied chairs, which equals the number of people seated. */
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
  return tables.reduce(
    (highest, table) => Math.max(highest, table.number),
    0,
  ) + 1;
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
