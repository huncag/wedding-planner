import type { Metadata } from "next";
import { GuestsBoard } from "@/components/guests/guests-board";
import { PageHeader } from "@/components/page-header";
import type { RsvpSubmission } from "@/lib/rsvp";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Guests",
};

export default async function GuestsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rsvp_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Guest list"
        title="Guests"
        description="Every RSVP in one place — attendance, meals, dietary needs and plus-ones, updated the moment a reply arrives."
        badge="Live inbox"
      />
      <GuestsBoard
        initialSubmissions={(data ?? []) as RsvpSubmission[]}
        initialError={
          error
            ? "The inbox could not be loaded from Supabase. This page will keep trying in the background."
            : null
        }
      />
    </div>
  );
}
