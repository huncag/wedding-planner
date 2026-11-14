import type { Metadata } from "next";
import { GuestsBoard } from "@/components/guests/guests-board";
import { GuestList } from "@/components/guests/guest-list";
import { PageHeader } from "@/components/page-header";
import { guestPartyFromRow, type GuestRow } from "@/lib/guests";
import { syncRsvpGuests } from "@/lib/guests-sync";
import type { RsvpSubmission } from "@/lib/rsvp";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Guests",
};

export default async function GuestsPage() {
  const supabase = await createClient();

  await syncRsvpGuests(supabase);

  const [guestsResult, rsvpResult] = await Promise.all([
    supabase.from("guests").select("*").order("name", { ascending: true }),
    supabase
      .from("rsvp_submissions")
      .select("*")
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Guest list"
        title="Guests"
        description="One row per invitation group, with the headcount, side, category and invitation tracking from your spreadsheet — plus every RSVP reply as it arrives."
        badge="Live inbox"
      />

      <GuestList
        initialParties={((guestsResult.data ?? []) as GuestRow[]).map(
          guestPartyFromRow,
        )}
        initialError={
          guestsResult.error
            ? "The guest list could not be loaded from Supabase. Reload the page to try again."
            : null
        }
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-parchment pt-8">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold-ink">
              Public replies
            </p>
            <h2 className="mt-2 font-display text-3xl leading-none text-forest">
              RSVP inbox
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              New answers from the public form appear here instantly, with
              meals, dietary needs and plus-ones.
            </p>
          </div>
        </div>

        <GuestsBoard
          initialSubmissions={(rsvpResult.data ?? []) as RsvpSubmission[]}
          initialError={
            rsvpResult.error
              ? "The inbox could not be loaded from Supabase. This page will keep trying in the background."
              : null
          }
        />
      </section>
    </div>
  );
}
