import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { VendorsIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Vendors",
};

export default function VendorsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partners & suppliers"
        title="Vendors"
        description="Keep every supplier, quote, contract and payment status together."
        badge="Coming soon"
      />
      <EmptyState
        Icon={VendorsIcon}
        title="No vendors yet"
        description="Your caterer, photographer, florist and band will live here once you start adding them."
        hint="Planned: categories, contact details, total costs, and booking status."
      />
    </div>
  );
}
