"use client";

import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/components/currency/currency-context";

export function CurrencyToggle({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-muted">
          Currency
        </span>
      )}
      <div
        role="group"
        aria-label="Display currency"
        className="flex rounded-full border border-parchment bg-ivory p-0.5"
      >
        {CURRENCIES.map((option) => {
          const active = option === currency;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setCurrency(option)}
              aria-pressed={active}
              className={`min-w-[3rem] rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 ${
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
  );
}
