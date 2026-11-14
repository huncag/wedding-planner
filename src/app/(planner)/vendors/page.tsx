import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { VendorsBoard } from "@/components/vendors/vendors-board";
import { createClient } from "@/lib/supabase/server";
import { vendorFromRow, type VendorRow } from "@/lib/vendors";

export const metadata: Metadata = {
  title: "Vendors",
};

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partners & suppliers"
        title="Vendors"
        description="Every supplier, quote and agreement in one place — group them by category, track offers and mark what has been agreed."
        badge="Saved automatically"
      />
      <VendorsBoard
        initialVendors={((data ?? []) as VendorRow[]).map(vendorFromRow)}
        initialError={
          error
            ? "The vendors could not be loaded from Supabase. Reload the page to try again."
            : null
        }
      />
    </div>
  );
}
