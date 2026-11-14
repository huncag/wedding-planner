"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_COOKIE,
  isCurrency,
  type Currency,
  type FxSnapshot,
} from "@/lib/currency";

type CurrencyContextValue = {
  fx: FxSnapshot;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  refresh: () => Promise<void>;
  refreshing: boolean;
  refreshFailed: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function persistCurrency(currency: Currency) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax${secure}`;
}

export function CurrencyProvider({
  initialFx,
  initialCurrency,
  children,
}: {
  initialFx: FxSnapshot;
  initialCurrency: Currency;
  children: ReactNode;
}) {
  const [fx, setFx] = useState(initialFx);
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const setCurrency = useCallback((next: Currency) => {
    if (!isCurrency(next)) {
      return;
    }

    setCurrencyState(next);
    persistCurrency(next);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshFailed(false);

    try {
      const response = await fetch("/api/fx?fresh=1", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Rate refresh failed");
      }

      const payload = (await response.json()) as FxSnapshot;

      if (!Number.isFinite(payload.rate) || payload.rate <= 0) {
        throw new Error("Invalid rate");
      }

      setFx(payload);
    } catch {
      setRefreshFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      fx,
      currency,
      setCurrency,
      refresh,
      refreshing,
      refreshFailed,
    }),
    [fx, currency, setCurrency, refresh, refreshing, refreshFailed],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }

  return context;
}
