import type { createClient } from "@/lib/supabase/server";
import type { MealPreference } from "@/lib/rsvp";

type Db = Awaited<ReturnType<typeof createClient>>;

type SubmissionRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  attending: boolean;
  party_size: number | null;
  meal_preference: MealPreference | null;
  dietary_restrictions: string | null;
  plus_one_name: string | null;
  guest_id: string | null;
};

type GuestLookupRow = {
  id: string;
  name: string;
  email: string | null;
  party_size: number | null;
};

function normalize(value: string | null | undefined): string {
  return (value?.trim().toLowerCase() ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Merges public RSVP replies into the planner's guest list.
 *
 * Replies are matched to an existing guest by email or full name; anything new
 * becomes a guest row so the seating plan and overview counts see it. The
 * submission is then linked back to that guest, so later replies update the
 * same person instead of creating duplicates. Safe to call on every load.
 */
export async function syncRsvpGuests(supabase: Db): Promise<void> {
  const { data: submissions, error } = await supabase
    .from("rsvp_submissions")
    .select("*")
    .order("submitted_at", { ascending: true });

  if (error || !submissions?.length) {
    return;
  }

  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("*");

  if (guestsError) {
    return;
  }

  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  const sizeById = new Map<string, number>();

  for (const guest of (guests ?? []) as GuestLookupRow[]) {
    if (guest.email) {
      byEmail.set(normalize(guest.email), guest.id);
    }

    byName.set(normalize(guest.name), guest.id);
    sizeById.set(
      guest.id,
      Number.isFinite(Number(guest.party_size)) && Number(guest.party_size) > 0
        ? Math.round(Number(guest.party_size))
        : 1,
    );
  }

  for (const submission of submissions as SubmissionRow[]) {
    const size = Math.max(1, Math.round(Number(submission.party_size ?? 1)));

    const payload = {
      rsvp_status: submission.attending ? "attending" : "declined",
      confirmed_count: submission.attending ? size : 0,
      meal_preference: submission.meal_preference,
      dietary_restrictions: submission.dietary_restrictions,
      plus_one_name: submission.plus_one_name,
    };

    const existing =
      submission.guest_id ??
      (submission.email ? byEmail.get(normalize(submission.email)) : undefined) ??
      byName.get(normalize(submission.name));

    if (existing) {
      const currentSize = sizeById.get(existing) ?? 1;

      await supabase
        .from("guests")
        .update({
          ...payload,
          party_size: Math.max(currentSize, size),
        })
        .eq("id", existing);

      if (submission.guest_id !== existing) {
        await supabase
          .from("rsvp_submissions")
          .update({ guest_id: existing })
          .eq("id", submission.id);
      }

      continue;
    }

    const { data: created, error: insertError } = await supabase
      .from("guests")
      .insert({
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        party_size: size,
        ...payload,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      continue;
    }

    byName.set(normalize(submission.name), created.id);

    if (submission.email) {
      byEmail.set(normalize(submission.email), created.id);
    }

    await supabase
      .from("rsvp_submissions")
      .update({ guest_id: created.id })
      .eq("id", submission.id);
  }
}
