export type MealPreference = "meat" | "vegetarian" | "vegan" | "kids";

export const MEAL_OPTIONS: { value: MealPreference; label: string }[] = [
  { value: "meat", label: "Meat" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kids", label: "Children's menu" },
];

export function isMealPreference(value: unknown): value is MealPreference {
  return MEAL_OPTIONS.some((option) => option.value === value);
}

/** One named attendee with their own meal choice. */
export type RsvpPerson = {
  name: string;
  meal: MealPreference | null;
};

export type RsvpSubmission = {
  id: string;
  guest_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  attending: boolean;
  party_size: number | null;
  meal_preference: MealPreference | null;
  dietary_restrictions: string | null;
  plus_one_name: string | null;
  message: string | null;
  /** Added in `supabase/rsvp-people.sql`; absent on older projects. */
  people: RsvpPerson[] | null;
  handled: boolean;
  submitted_at: string;
};

/**
 * Until the `people` column exists, the same list is carried inside
 * `plus_one_name` with this prefix so no attendee or meal is lost.
 */
export const PEOPLE_FALLBACK_PREFIX = "people:";

export function encodePeopleFallback(people: readonly RsvpPerson[]): string {
  return `${PEOPLE_FALLBACK_PREFIX}${JSON.stringify(people)}`;
}

export function decodePeople(value: unknown): RsvpPerson[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const people: RsvpPerson[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as { name?: unknown; meal?: unknown };
    const name = typeof record.name === "string" ? record.name.trim() : "";

    if (!name) {
      continue;
    }

    people.push({
      name,
      meal: isMealPreference(record.meal) ? record.meal : null,
    });
  }

  return people;
}

function decodeFallback(raw: string | null | undefined): RsvpPerson[] {
  const value = raw?.trim();

  if (!value?.startsWith(PEOPLE_FALLBACK_PREFIX)) {
    return [];
  }

  try {
    return decodePeople(
      JSON.parse(value.slice(PEOPLE_FALLBACK_PREFIX.length)),
    );
  } catch {
    return [];
  }
}

type SubmissionLike = {
  name: string;
  people?: RsvpPerson[] | null;
  plus_one_name: string | null;
  meal_preference: MealPreference | null;
  party_size: number | null;
};

/** True when the reply carries a per-person list instead of the old aggregate fields. */
export function hasStructuredPeople(
  submission: Pick<RsvpSubmission, "people" | "plus_one_name">,
): boolean {
  if (Array.isArray(submission.people) && submission.people.length > 0) {
    return true;
  }

  return Boolean(
    submission.plus_one_name?.trim().startsWith(PEOPLE_FALLBACK_PREFIX),
  );
}

/**
 * Normalises a reply into a per-person list. Replies sent before this feature
 * fall back to the person who submitted plus a single plus-one name.
 */
export function submissionPeople(submission: SubmissionLike): RsvpPerson[] {
  const stored = decodePeople(submission.people);

  if (stored.length > 0) {
    return stored;
  }

  const fallback = decodeFallback(submission.plus_one_name);

  if (fallback.length > 0) {
    return fallback;
  }

  const people: RsvpPerson[] = [
    { name: submission.name, meal: submission.meal_preference },
  ];
  const plusOne = submission.plus_one_name?.trim();

  if (plusOne) {
    people.push({ name: plusOne, meal: null });
  }

  return people;
}

/** Headcount of a reply, preferring the per-person list when present. */
export function submissionPartySize(submission: SubmissionLike): number {
  const stored = decodePeople(submission.people);

  if (stored.length > 0) {
    return stored.length;
  }

  const fallback = decodeFallback(submission.plus_one_name);

  if (fallback.length > 0) {
    return fallback.length;
  }

  const size = Number(submission.party_size ?? 1);

  return Number.isFinite(size) && size > 0 ? Math.round(size) : 1;
}

export function mealLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return MEAL_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

/** Fixed locale and timezone so server and client render the same string. */
export function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  }).format(date);
}

export type RsvpSummary = {
  replies: number;
  attending: number;
  people: number;
  declined: number;
  plusOnes: number;
  dietaryNotes: number;
};

export function summarizeRsvps(
  submissions: readonly RsvpSubmission[],
): RsvpSummary {
  return submissions.reduce<RsvpSummary>(
    (summary, submission) => {
      summary.replies += 1;

      if (submission.attending) {
        const size = submissionPartySize(submission);

        summary.attending += 1;
        summary.people += size;
        summary.plusOnes += Math.max(0, size - 1);
      } else {
        summary.declined += 1;
      }

      if (submission.dietary_restrictions?.trim()) {
        summary.dietaryNotes += 1;
      }

      return summary;
    },
    {
      replies: 0,
      attending: 0,
      people: 0,
      declined: 0,
      plusOnes: 0,
      dietaryNotes: 0,
    },
  );
}
