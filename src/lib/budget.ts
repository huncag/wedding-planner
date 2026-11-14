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

export const DEMO_BUDGET: BudgetItem[] = [
  {
    id: "budget-venue-hire",
    category: "venue",
    label: "Castle venue hire",
    estimated: { amount: 1500, currency: "EUR" },
    actual: { amount: 1500, currency: "EUR" },
    paid: true,
  },
  {
    id: "budget-venue-rooms",
    category: "venue",
    label: "Guest accommodation block",
    estimated: { amount: 2400, currency: "RON" },
    paid: false,
  },
  {
    id: "budget-catering",
    category: "catering",
    label: "Catering — 120 guests",
    estimated: { amount: 38400, currency: "RON" },
    actual: { amount: 12000, currency: "RON" },
    paid: true,
  },
  {
    id: "budget-photography",
    category: "photography",
    label: "Photographer & album",
    estimated: { amount: 1800, currency: "EUR" },
    actual: { amount: 900, currency: "EUR" },
    paid: true,
  },
  {
    id: "budget-florist",
    category: "florist",
    label: "Ceremony and table flowers",
    estimated: { amount: 6500, currency: "RON" },
    paid: false,
  },
  {
    id: "budget-music",
    category: "music",
    label: "Live band",
    estimated: { amount: 2200, currency: "EUR" },
    paid: false,
  },
  {
    id: "budget-attire",
    category: "attire",
    label: "Dress and alterations",
    estimated: { amount: 4000, currency: "RON" },
    paid: false,
  },
  {
    id: "budget-stationery",
    category: "stationery",
    label: "Invitations and signage",
    estimated: { amount: 850, currency: "RON" },
    paid: false,
  },
];

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
