import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SeatingPlanner } from "@/components/seating/seating-planner";

export const metadata: Metadata = {
  title: "Seating",
};

export default function SeatingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Floor plan"
        title="Seating"
        description="Arrange tables, balance the room, and give every guest a place to celebrate."
        badge="Interactive demo"
      />
      <SeatingPlanner />
    </div>
  );
}
