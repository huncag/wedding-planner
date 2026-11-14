import { FALLBACK_RATE, type FxSnapshot } from "@/lib/currency";

/**
 * ECB reference rates via Frankfurter — free, no API key, updated once per
 * working day around 16:00 CET.
 *
 * Docs: https://frankfurter.dev
 */
const ENDPOINT = "https://api.frankfurter.app/latest?from=EUR&to=RON";

type FrankfurterResponse = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function fallbackSnapshot(): FxSnapshot {
  return {
    base: "EUR",
    quote: "RON",
    rate: FALLBACK_RATE,
    date: todayUTC(),
    fetchedAt: new Date().toISOString(),
    status: "fallback",
  };
}

/**
 * Fetch the latest rate. Responses are cached for an hour so navigation and
 * server rendering do not hit the ECB feed on every request; pass `fresh` to
 * bypass the cache for the manual refresh button.
 */
export async function getFxSnapshot(fresh = false): Promise<FxSnapshot> {
  try {
    const response = await fetch(
      ENDPOINT,
      fresh
        ? { cache: "no-store", signal: AbortSignal.timeout(4000) }
        : {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(4000),
          },
    );

    if (!response.ok) {
      return fallbackSnapshot();
    }

    const payload = (await response.json()) as FrankfurterResponse;
    const rate = Number(payload.rates?.RON);

    if (!Number.isFinite(rate) || rate <= 0) {
      return fallbackSnapshot();
    }

    return {
      base: "EUR",
      quote: "RON",
      rate,
      date: payload.date ?? todayUTC(),
      fetchedAt: new Date().toISOString(),
      status: "live",
    };
  } catch {
    return fallbackSnapshot();
  }
}
