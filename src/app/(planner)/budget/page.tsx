import type { Metadata } from "next";
import { BudgetPlanner } from "@/components/budget/budget-planner";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Budget",
};

export default function BudgetPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money matters"
        title="Budget"
        description="Track costs in lei or euro, follow what has been agreed, and see every total in the currency you prefer."
        badge="Demo data"
      />
      <BudgetPlanner />
    </div>
  );
}
