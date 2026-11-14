import { convertAmount, type Currency, type Money } from "@/lib/currency";

export const BUDGET_CATEGORIES = [
  { id: "venue", label: "Venue" },
  { id: "catering", label: "Catering" },
  { id: "photography", label: "Photography" },
  { id: "florist", label: "Flowers & décor" },
  { id: "music", label: "Music & entertainment" },
  { id: "attire", label: "Attire & beauty" },
  { id: "stationery", label: "Stationery" },
  { id: "other", label: "Other" },
] as const;

export type BudgetCategoryId = (typeof BUDGET_CATEGORIES)[number]["id"];

export type BudgetItem = {
  id: string;
  category: BudgetCategoryId;
  label: string;
  estimated: Money;
  /** What was actually agreed or paid — optional until a vendor is booked. */
  actual?: Money;
  paid: boolean;
};

/** Shape of a `public.budget` row as returned by PostgREST. */
export type BudgetRow = {
  id: string;
  category: string;
  item: string;
  estimated_cost: number | string;
  estimated_currency: Currency;
  actual_cost: number | string | null;
  actual_currency: Currency | null;
  paid: boolean;
};

/** PostgREST may serialise `numeric` as a string, so accept both. */
function numeric(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function budgetItemFromRow(row: BudgetRow): BudgetItem {
  const actual = numeric(row.actual_cost);
  const actualCurrency = row.actual_currency;

  return {
    id: row.id,
    category: isBudgetCategory(row.category) ? row.category : "other",
    label: row.item,
    estimated: {
      amount: numeric(row.estimated_cost) ?? 0,
      currency: row.estimated_currency,
    },
    ...(actual !== null && actualCurrency
      ? { actual: { amount: actual, currency: actualCurrency } }
      : {}),
    paid: row.paid,
  };
}

export function isBudgetCategory(value: string): value is BudgetCategoryId {
  return BUDGET_CATEGORIES.some((category) => category.id === value);
}

export function categoryLabel(id: BudgetCategoryId): string {
  return BUDGET_CATEGORIES.find((category) => category.id === id)?.label ?? "Other";
}

export function convertMoney(
  money: Money | undefined,
  display: Currency,
  rate: number,
): number | null {
  if (!money) {
    return null;
  }

  return convertAmount(money.amount, money.currency, display, rate);
}

export function totalMoney(
  items: readonly BudgetItem[],
  field: "estimated" | "actual",
  display: Currency,
  rate: number,
): number {
  return items.reduce((total, item) => {
    const converted = convertMoney(item[field], display, rate);
    return converted === null ? total : total + converted;
  }, 0);
}

export function groupByCategory(items: readonly BudgetItem[]) {
  return BUDGET_CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0);
}
