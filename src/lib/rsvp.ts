export type MealPreference = "meat" | "fish" | "vegetarian" | "vegan" | "kids";

export const MEAL_OPTIONS: { value: MealPreference; label: string }[] = [
  { value: "meat", label: "Meat" },
  { value: "fish", label: "Fish" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kids", label: "Children's menu" },
];

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
  handled: boolean;
  submitted_at: string;
};

export function mealLabel(value: MealPreference | null): string | null {
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
        summary.attending += 1;
        summary.people += Math.max(1, submission.party_size ?? 1);

        if (submission.plus_one_name?.trim()) {
          summary.plusOnes += 1;
        }
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
