import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SeatingPlanner } from "@/components/seating/seating-planner";
import { syncRsvpGuests } from "@/lib/guests-sync";
import {
  buildSeatingTables,
  guestFromRow,
  type GuestRow,
  type SeatingTableRow,
} from "@/lib/seating-db";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Seating",
};

export default async function SeatingPage() {
  const supabase = await createClient();

  await syncRsvpGuests(supabase);

  const [tablesResult, guestsResult] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("id, table_number, capacity")
      .order("table_number", { ascending: true }),
    supabase
      .from("guests")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const tableRows = (tablesResult.data ?? []) as SeatingTableRow[];
  const guestRows = (guestsResult.data ?? []) as GuestRow[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Floor plan"
        title="Seating"
        description="Arrange tables, balance the room, and give every guest a place to celebrate."
        badge="Saved automatically"
      />
      <SeatingPlanner
        initialTables={buildSeatingTables(tableRows, guestRows)}
        initialGuests={guestRows.map(guestFromRow)}
        initialError={
          tablesResult.error || guestsResult.error
            ? "Part of the seating plan could not be loaded from Supabase. Reload the page to try again."
            : null
        }
      />
    </div>
  );
}
