export const CURRENCIES = ["RON", "EUR"] as const;

export type Currency = (typeof CURRENCIES)[number];

export type Money = {
  amount: number;
  currency: Currency;
};

/**
 * Exchange-rate snapshot used across the app.
 *
 * `rate` is always "RON per 1 EUR", matching the ECB/Frankfurter quote.
 */
export type FxSnapshot = {
  base: "EUR";
  quote: "RON";
  rate: number;
  /** ECB reference date, YYYY-MM-DD. */
  date: string;
  /** When this app last fetched the rate, ISO timestamp. */
  fetchedAt: string;
  /** `fallback` means the network call failed and a cached constant is shown. */
  status: "live" | "fallback";
};

/** Last known RON/EUR rate, used only when the ECB feed is unreachable. */
export const FALLBACK_RATE = 5.35;

/** Cookie that remembers the display currency between visits. */
export const CURRENCY_COOKIE = "planner-currency";

export function isCurrency(value: unknown): value is Currency {
  return value === "RON" || value === "EUR";
}

/** Convert between RON and EUR using a "RON per 1 EUR" rate. */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  ronPerEur: number,
): number {
  if (from === to) {
    return amount;
  }

  const converted = from === "EUR" ? amount * ronPerEur : amount / ronPerEur;

  return Math.round(converted * 100) / 100;
}

const wholeFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

const preciseFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
});

/**
 * Budget amounts are whole lei/euro in practice, so large values are rounded
 * for readability and small values keep their decimals.
 */
export function formatMoney(amount: number, currency: Currency): string {
  const absolute = Math.abs(amount);
  const isLarge = absolute >= 1000;
  const rounded = isLarge
    ? Math.round(absolute)
    : Math.round(absolute * 100) / 100;
  const digits = isLarge
    ? wholeFormat.format(rounded)
    : preciseFormat.format(rounded);

  const body = currency === "EUR" ? `€${digits}` : `${digits} RON`;

  return amount < 0 ? `-${body}` : body;
}

export function formatRate(rate: number): string {
  return rate.toFixed(4);
}

/** Formats an ECB reference date (YYYY-MM-DD) as "13 Nov 2026". */
export function formatRateDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
