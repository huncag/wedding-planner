"use client";

import { RefreshIcon } from "@/components/icons";
import { useCurrency } from "@/components/currency/currency-context";
import { formatRate, formatRateDate } from "@/lib/currency";

/** Shows where the RON/EUR rate comes from and lets either partner refresh it. */
export function RateNote() {
  const { fx, refresh, refreshing, refreshFailed } = useCurrency();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            fx.status === "live" ? "bg-forest/60" : "bg-gold"
          }`}
        />
        ECB reference rate
      </span>
      <span className="font-medium text-forest/80">
        1 EUR = {formatRate(fx.rate)} RON
      </span>
      {fx.status === "live" ? (
        <span>· {formatRateDate(fx.date)}</span>
      ) : (
        <span className="text-gold-ink">last known rate</span>
      )}
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 rounded-full border border-parchment bg-ivory px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-forest/80 transition-colors hover:border-gold/50 hover:text-forest disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshIcon
          className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
        />
        {refreshing ? "Refreshing" : "Refresh"}
      </button>
      <span aria-live="polite" className="text-gold-ink">
        {refreshFailed
          ? "Could not reach the rate feed — showing the last known rate."
          : ""}
      </span>
    </div>
  );
}
