import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CurrencyProvider } from "@/components/currency/currency-context";
import { Sidebar } from "@/components/sidebar";
import { isAuthEnabled } from "@/lib/auth";
import { CURRENCY_COOKIE, isCurrency } from "@/lib/currency";
import { getFxSnapshot } from "@/lib/fx";
import { createClient } from "@/lib/supabase/server";

// The private shell always needs the reader's currency cookie and the current
// rate, so allow this route tree to block instead of prerendering a stale shell.
export const instant = false;

async function getSessionEmail(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.email ?? undefined;
}

/**
 * Private planner shell: sidebar, currency state and the single hourly-cached
 * exchange-rate snapshot shared by every page.
 *
 * The public RSVP and login pages deliberately live outside this route group.
 */
export default async function PlannerLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const [cookieStore, fx, userEmail] = await Promise.all([
    cookies(),
    getFxSnapshot(),
    isAuthEnabled() ? getSessionEmail() : Promise.resolve(undefined),
  ]);

  const storedCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;

  return (
    <CurrencyProvider
      initialFx={fx}
      initialCurrency={isCurrency(storedCurrency) ? storedCurrency : "RON"}
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar userEmail={userEmail} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {children}
          </div>
        </main>
      </div>
    </CurrencyProvider>
  );
}
