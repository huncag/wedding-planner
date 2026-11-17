import type { MealPreference } from "@/lib/rsvp";

export type GuestSide = "eszter" | "huni" | "shared";
export type GuestCategory = "family" | "family_friends" | "friends" | "staff";
export type GuestRsvpStatus = "pending" | "attending" | "declined";

export const SIDE_OPTIONS: { id: GuestSide; label: string; short: string }[] = [
  { id: "eszter", label: "Eszter's side", short: "Eszter" },
  { id: "huni", label: "Huni's side", short: "Huni" },
  { id: "shared", label: "Shared", short: "Shared" },
];

export const CATEGORY_OPTIONS: { id: GuestCategory; label: string }[] = [
  { id: "family", label: "Family" },
  { id: "family_friends", label: "Family friends" },
  { id: "friends", label: "Friends" },
  { id: "staff", label: "Staff" },
];

export const RSVP_STATUS_OPTIONS: {
  id: GuestRsvpStatus;
  label: string;
  short: string;
}[] = [
  { id: "pending", label: "Awaiting reply", short: "Pending" },
  { id: "attending", label: "Coming", short: "Coming" },
  { id: "declined", label: "Cannot come", short: "Declined" },
];

/** One invitation group — the unit the couple's spreadsheet is built around. */
export type GuestParty = {
  id: string;
  name: string;
  partySize: number;
  side: GuestSide;
  category: GuestCategory;
  notes: string | null;
  inviteSent: boolean;
  inviteReminder: boolean;
  inviteType: string | null;
  confirmedCount: number | null;
  email: string | null;
  phone: string | null;
  rsvpStatus: GuestRsvpStatus;
  mealPreference: MealPreference | null;
  dietaryRestrictions: string | null;
  plusOneName: string | null;
  seatingTableId: string | null;
  seatIndex: number | null;
};

/** Minimal shape of a `public.guests` row as returned by PostgREST. */
export type GuestRow = {
  id: string;
  name: string;
  party_size: number | string | null;
  side: string | null;
  category: string | null;
  notes: string | null;
  invite_sent: boolean | null;
  invite_reminder: boolean | null;
  invite_type: string | null;
  confirmed_count: number | string | null;
  email: string | null;
  phone: string | null;
  rsvp_status: GuestRsvpStatus;
  meal_preference: MealPreference | null;
  dietary_restrictions: string | null;
  plus_one_name: string | null;
  seating_table_id: string | null;
  seat_index: number | null;
};

function positiveInt(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 1;
}

function optionalInt(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function isGuestSide(value: string | null | undefined): value is GuestSide {
  return SIDE_OPTIONS.some((option) => option.id === value);
}

export function isGuestCategory(
  value: string | null | undefined,
): value is GuestCategory {
  return CATEGORY_OPTIONS.some((option) => option.id === value);
}

export function sideLabel(side: GuestSide): string {
  return SIDE_OPTIONS.find((option) => option.id === side)?.short ?? "Shared";
}

export function categoryLabel(category: GuestCategory): string {
  return (
    CATEGORY_OPTIONS.find((option) => option.id === category)?.label ?? "Friends"
  );
}

export function rsvpStatusLabel(status: GuestRsvpStatus): string {
  return (
    RSVP_STATUS_OPTIONS.find((option) => option.id === status)?.short ?? "Pending"
  );
}

export function guestPartyFromRow(row: GuestRow): GuestParty {
  return {
    id: row.id,
    name: row.name,
    partySize: positiveInt(row.party_size),
    side: isGuestSide(row.side) ? row.side : "shared",
    category: isGuestCategory(row.category) ? row.category : "friends",
    notes: row.notes,
    inviteSent: Boolean(row.invite_sent),
    inviteReminder: Boolean(row.invite_reminder),
    inviteType: row.invite_type,
    confirmedCount: optionalInt(row.confirmed_count),
    email: row.email,
    phone: row.phone,
    rsvpStatus: row.rsvp_status,
    mealPreference: row.meal_preference,
    dietaryRestrictions: row.dietary_restrictions,
    plusOneName: row.plus_one_name,
    seatingTableId: row.seating_table_id,
    seatIndex: row.seat_index,
  };
}

/** Every editable field on a party, shared by the create and edit forms. */
export type GuestDraft = {
  name: string;
  partySize: number;
  side: GuestSide;
  category: GuestCategory;
  rsvpStatus: GuestRsvpStatus;
  confirmedCount: number | null;
  inviteSent: boolean;
  inviteReminder: boolean;
  inviteType: string;
  email: string;
  phone: string;
  notes: string;
};

export const EMPTY_GUEST_DRAFT: GuestDraft = {
  name: "",
  partySize: 2,
  side: "shared",
  category: "friends",
  rsvpStatus: "pending",
  confirmedCount: null,
  inviteSent: false,
  inviteReminder: false,
  inviteType: "",
  email: "",
  phone: "",
  notes: "",
};

export function guestDraftFromParty(party: GuestParty): GuestDraft {
  return {
    name: party.name,
    partySize: party.partySize,
    side: party.side,
    category: party.category,
    rsvpStatus: party.rsvpStatus,
    confirmedCount: party.confirmedCount,
    inviteSent: party.inviteSent,
    inviteReminder: party.inviteReminder,
    inviteType: party.inviteType ?? "",
    email: party.email ?? "",
    phone: party.phone ?? "",
    notes: party.notes ?? "",
  };
}

export function guestRowFromDraft(draft: GuestDraft) {
  return {
    name: draft.name.trim(),
    party_size: Math.max(1, Math.round(draft.partySize)),
    side: draft.side,
    category: draft.category,
    rsvp_status: draft.rsvpStatus,
    confirmed_count: draft.confirmedCount,
    invite_sent: draft.inviteSent,
    invite_reminder: draft.inviteReminder,
    invite_type: draft.inviteType.trim() || null,
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    notes: draft.notes.trim() || null,
  };
}

export type GuestStats = {
  parties: number;
  people: number;
  attendingParties: number;
  attendingPeople: number;
  declinedParties: number;
  pendingParties: number;
  inviteSent: number;
  remindersSent: number;
  unseatedPeople: number;
};

export function attendingPeople(party: GuestParty): number {
  if (party.rsvpStatus !== "attending") {
    return 0;
  }

  return party.confirmedCount ?? party.partySize;
}

export function summarizeGuests(parties: readonly GuestParty[]): GuestStats {
  return parties.reduce<GuestStats>(
    (stats, party) => {
      stats.parties += 1;
      stats.people += party.partySize;

      if (party.rsvpStatus === "attending") {
        stats.attendingParties += 1;
        stats.attendingPeople += attendingPeople(party);
      } else if (party.rsvpStatus === "declined") {
        stats.declinedParties += 1;
      } else {
        stats.pendingParties += 1;
      }

      if (party.inviteSent) {
        stats.inviteSent += 1;
      }

      if (party.inviteReminder) {
        stats.remindersSent += 1;
      }

      if (!party.seatingTableId) {
        stats.unseatedPeople += party.partySize;
      }

      return stats;
    },
    {
      parties: 0,
      people: 0,
      attendingParties: 0,
      attendingPeople: 0,
      declinedParties: 0,
      pendingParties: 0,
      inviteSent: 0,
      remindersSent: 0,
      unseatedPeople: 0,
    },
  );
}

export function matchesGuestQuery(party: GuestParty, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    party.name.toLowerCase().includes(normalized) ||
    sideLabel(party.side).toLowerCase().includes(normalized) ||
    categoryLabel(party.category).toLowerCase().includes(normalized) ||
    (party.email ?? "").toLowerCase().includes(normalized) ||
    (party.phone ?? "").toLowerCase().includes(normalized) ||
    (party.inviteType ?? "").toLowerCase().includes(normalized) ||
    (party.notes ?? "").toLowerCase().includes(normalized)
  );
}

/** Groups parties by side, then by category, preserving a stable order. */
export function groupGuests(parties: readonly GuestParty[]) {
  return SIDE_OPTIONS.map((side) => ({
    ...side,
    categories: CATEGORY_OPTIONS.map((category) => ({
      ...category,
      parties: parties.filter(
        (party) => party.side === side.id && party.category === category.id,
      ),
    })).filter((group) => group.parties.length > 0),
  })).filter((group) => group.categories.length > 0);
}
