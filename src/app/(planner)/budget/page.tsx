import type { Metadata } from "next";
import { BudgetPlanner } from "@/components/budget/budget-planner";
import { PageHeader } from "@/components/page-header";
import { budgetItemFromRow, type BudgetRow } from "@/lib/budget";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Budget",
};

export default async function BudgetPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Money matters"
        title="Budget"
        description="Track costs in lei or euro, follow what has been agreed, and see every total in the currency you prefer."
        badge="Saved automatically"
      />
      <BudgetPlanner
        initialItems={((data ?? []) as BudgetRow[]).map(budgetItemFromRow)}
        initialError={
          error
            ? "The budget could not be loaded from Supabase. Reload the page to try again."
            : null
        }
      />
    </div>
  );
}
