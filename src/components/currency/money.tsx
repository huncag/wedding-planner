"use client";

import { useCurrency } from "@/components/currency/currency-context";
import { convertAmount, formatMoney } from "@/lib/currency";

/**
 * Renders an amount in the display currency chosen by the currency toggle.
 * Amounts keep their original currency in state; conversion is display-only.
 */
export function Money({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: "RON" | "EUR";
  className?: string;
}) {
  const { currency: display, fx } = useCurrency();
  const converted = convertAmount(amount, currency, display, fx.rate);
  const note =
    currency === display
      ? undefined
      : `${formatMoney(amount, currency)} converted at 1 EUR = ${fx.rate.toFixed(4)} RON`;

  return (
    <span className={className} title={note}>
      {formatMoney(converted, display)}
    </span>
  );
}
