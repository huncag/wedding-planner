"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { useCurrency } from "@/components/currency/currency-context";
import { RateNote } from "@/components/currency/rate-note";
import {
  BUDGET_CATEGORIES,
  budgetItemFromRow,
  convertMoney,
  groupByCategory,
  isBudgetCategory,
  totalMoney,
  type BudgetCategoryId,
  type BudgetItem,
  type BudgetRow,
} from "@/lib/budget";
import {
  CURRENCIES,
  formatMoney,
  type Currency,
  type Money,
} from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-parchment bg-ivory px-3 py-2.5 text-sm text-forest placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

const labelClass =
  "mb-1.5 block text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted";

function SummaryCard({
  label,
  amount,
  currency,
  note,
  tone = "default",
}: {
  label: string;
  amount: number;
  currency: Currency;
  note: string;
  tone?: "default" | "accent";
}) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        tone === "accent"
          ? "border-gold/40 bg-cream/70"
          : "border-parchment/80 bg-white/70"
      }`}
    >
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl leading-none text-forest">
        {formatMoney(amount, currency)}
      </p>
      <p className="mt-3 text-xs text-muted">{note}</p>
    </article>
  );
}

function MoneyCell({ money }: { money?: Money }) {
  const { currency: display, fx } = useCurrency();

  if (!money) {
    return <span className="text-sm text-muted">—</span>;
  }

  const converted = convertMoney(money, display, fx.rate);
  const showsConversion = money.currency !== display;

  return (
    <span className="block">
      <span className="block text-sm font-medium text-forest">
        {formatMoney(money.amount, money.currency)}
      </span>
      {showsConversion && converted !== null ? (
        <span className="mt-0.5 block text-[0.7rem] text-muted">
          ≈ {formatMoney(converted, display)}
        </span>
      ) : null}
    </span>
  );
}

export function BudgetPlanner({
  initialItems,
  initialError = null,
}: {
  initialItems: BudgetItem[];
  initialError?: string | null;
}) {
  const { currency, fx } = useCurrency();
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(initialError);

  const [category, setCategory] = useState<BudgetCategoryId>("venue");
  const [label, setLabel] = useState("");
  const [estimatedInput, setEstimatedInput] = useState("");
  const [actualInput, setActualInput] = useState("");
  const [entryCurrency, setEntryCurrency] = useState<Currency>("RON");
  const [error, setError] = useState<string | null>(null);

  const estimatedTotal = totalMoney(items, "estimated", currency, fx.rate);
  const actualTotal = totalMoney(items, "actual", currency, fx.rate);
  const remaining = estimatedTotal - actualTotal;

  const groups = useMemo(() => groupByCategory(items), [items]);
  const paidCount = items.filter((item) => item.paid).length;

  const setPending = (id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaveError(null);

    const trimmedLabel = label.trim();
    const estimated = Number(estimatedInput.replace(",", "."));
    const actual = actualInput.trim()
      ? Number(actualInput.trim().replace(",", "."))
      : null;

    if (!trimmedLabel) {
      setError("Give the line item a name.");
      return;
    }

    if (!Number.isFinite(estimated) || estimated <= 0) {
      setError("Enter an estimated amount greater than zero.");
      return;
    }

    if (actual !== null && (!Number.isFinite(actual) || actual <= 0)) {
      setError("The actual amount must be greater than zero, or left empty.");
      return;
    }

    setIsAdding(true);

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("budget")
        .insert({
          category,
          item: trimmedLabel,
          estimated_cost: estimated,
          estimated_currency: entryCurrency,
          actual_cost: actual,
          actual_currency: actual !== null ? entryCurrency : null,
          paid: false,
        })
        .select("*")
        .single();

      if (insertError || !data) {
        setSaveError(
          insertError?.message
            ? `Could not save the line item: ${insertError.message}`
            : "Could not save the line item. Please try again.",
        );
        return;
      }

      setItems((current) => [...current, budgetItemFromRow(data as BudgetRow)]);
      setLabel("");
      setEstimatedInput("");
      setActualInput("");
    } catch {
      setSaveError("Could not reach Supabase. Check the connection and retry.");
    } finally {
      setIsAdding(false);
    }
  };

  const togglePaid = async (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    const paid = !item.paid;
    setSaveError(null);
    setPending(id, true);
    setItems((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, paid } : entry)),
    );

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("budget")
        .update({ paid })
        .eq("id", id);

      if (updateError) {
        setItems((current) =>
          current.map((entry) =>
            entry.id === id ? { ...entry, paid: item.paid } : entry,
          ),
        );
        setSaveError(
          `Could not update the payment status: ${updateError.message}`,
        );
      }
    } catch {
      setItems((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, paid: item.paid } : entry,
        ),
      );
      setSaveError("Could not reach Supabase. The change was not saved.");
    } finally {
      setPending(id, false);
    }
  };

  const removeItem = async (id: string) => {
    const index = items.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return;
    }

    const removed = items[index];
    setSaveError(null);
    setPending(id, true);
    setItems((current) => current.filter((entry) => entry.id !== id));

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("budget")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setItems((current) => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        setSaveError(`Could not delete the line item: ${deleteError.message}`);
      }
    } catch {
      setItems((current) => {
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      setSaveError("Could not reach Supabase. The line item was not deleted.");
    } finally {
      setPending(id, false);
    }
  };

  return (
    <div className="space-y-6">
      <RateNote />

      {saveError ? (
        <p
          role="alert"
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-ink"
        >
          {saveError}
        </p>
      ) : null}

      <section aria-label="Budget summary">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Estimated total"
            amount={estimatedTotal}
            currency={currency}
            note={`${items.length} line items, converted to ${currency}`}
          />
          <SummaryCard
            label="Agreed so far"
            amount={actualTotal}
            currency={currency}
            note={`${paidCount} ${paidCount === 1 ? "item" : "items"} marked paid`}
          />
          <SummaryCard
            label="Still to allocate"
            amount={remaining}
            currency={currency}
            note={
              remaining < 0
                ? "Actual costs are above the estimate"
                : "Estimate minus agreed costs"
            }
            tone="accent"
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Amounts keep the currency you enter them in; totals convert at the
          current rate. Every change is saved to your shared planner.
        </p>
      </section>

      <section className="rounded-2xl border border-parchment/80 bg-white/70 p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-2xl text-forest">Add a line item</h2>
        <p className="mt-1 text-sm text-muted">
          Enter each cost in the currency the vendor quoted it in.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <label htmlFor="budget-category" className={labelClass}>
                Category
              </label>
              <select
                id="budget-category"
                value={category}
                onChange={(event) => {
                  if (isBudgetCategory(event.target.value)) {
                    setCategory(event.target.value);
                  }
                }}
                className={inputClass}
              >
                {BUDGET_CATEGORIES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budget-label" className={labelClass}>
                What is it for?
              </label>
              <input
                id="budget-label"
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="e.g. String quartet for the ceremony"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor="budget-estimated" className={labelClass}>
                Estimated amount
              </label>
              <input
                id="budget-estimated"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={estimatedInput}
                onChange={(event) => setEstimatedInput(event.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="budget-actual" className={labelClass}>
                Agreed or paid (optional)
              </label>
              <input
                id="budget-actual"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={actualInput}
                onChange={(event) => setActualInput(event.target.value)}
                placeholder="Leave empty if not booked"
                className={inputClass}
              />
            </div>
            <div>
              <span className={labelClass}>Currency</span>
              <div
                role="group"
                aria-label="Amount currency"
                className="flex rounded-xl border border-parchment bg-ivory p-0.5"
              >
                {CURRENCIES.map((option) => {
                  const active = option === entryCurrency;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEntryCurrency(option)}
                      aria-pressed={active}
                      className={`min-w-[3.25rem] rounded-lg px-3 py-2 text-xs font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
                        active
                          ? "bg-forest text-ivory shadow-sm"
                          : "text-forest/70 hover:text-forest"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isAdding}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 disabled:cursor-wait disabled:opacity-60"
            >
              <PlusIcon className="h-4 w-4" />
              {isAdding ? "Saving…" : "Add item"}
            </button>
            <p aria-live="polite" className="text-sm text-gold-ink">
              {error ?? ""}
            </p>
          </div>
        </form>
      </section>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-parchment bg-cream/40 px-6 py-10 text-center text-sm text-muted">
          No line items yet. Add the first cost above and it will be saved for
          both of you.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const subtotal = totalMoney(
              group.items,
              "estimated",
              currency,
              fx.rate,
            );

            return (
              <section
                key={group.id}
                className="overflow-hidden rounded-2xl border border-parchment/80 bg-white/70 shadow-sm"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-parchment/70 bg-cream/40 px-5 py-3.5">
                  <h2 className="font-display text-xl text-forest">
                    {group.label}
                  </h2>
                  <p className="text-xs text-muted">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "item" : "items"} ·{" "}
                    <span className="font-medium text-forest/80">
                      {formatMoney(subtotal, currency)}
                    </span>{" "}
                    estimated
                  </p>
                </header>

                <ul className="divide-y divide-parchment/60">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_auto] sm:items-start"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-forest">
                          {item.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePaid(item.id)}
                          aria-pressed={item.paid}
                          disabled={pendingIds.has(item.id)}
                          title="Toggle payment status"
                          className={`rounded-full border px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] transition-colors disabled:cursor-wait disabled:opacity-50 ${
                            item.paid
                              ? "border-forest/20 bg-forest/10 text-forest"
                              : "border-parchment bg-ivory text-muted hover:border-gold/50 hover:text-forest"
                          }`}
                        >
                          {item.paid ? "Paid" : "Due"}
                        </button>
                      </div>

                      <div className="sm:text-right">
                        <span className="mb-1 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted sm:hidden">
                          Estimated
                        </span>
                        <MoneyCell money={item.estimated} />
                      </div>

                      <div className="sm:text-right">
                        <span className="mb-1 block text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted sm:hidden">
                          Agreed
                        </span>
                        <MoneyCell money={item.actual} />
                      </div>

                      <div className="flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={pendingIds.has(item.id)}
                          aria-label={`Remove ${item.label}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-parchment bg-ivory text-muted transition-colors hover:border-gold/60 hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-wait disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted">
        Totals are converted for display only: each line keeps the currency it
        was entered in, so changing the toggle never rewrites a saved amount.
      </p>
    </div>
  );
}
