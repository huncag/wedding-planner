"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BudgetIcon,
  CloseIcon,
  GuestsIcon,
  LockIcon,
  LogOutIcon,
  MenuIcon,
  OverviewIcon,
  SeatingIcon,
  VendorsIcon,
} from "@/components/icons";
import { CurrencyToggle } from "@/components/currency/currency-toggle";
import { createClient } from "@/lib/supabase/client";
import { WEDDING } from "@/lib/wedding";

const NAV_ITEMS = [
  { href: "/", label: "Overview", Icon: OverviewIcon },
  { href: "/guests", label: "Guests", Icon: GuestsIcon },
  { href: "/vendors", label: "Vendors", Icon: VendorsIcon },
  { href: "/budget", label: "Budget", Icon: BudgetIcon },
  { href: "/seating", label: "Seating", Icon: SeatingIcon },
] as const;

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="group flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-forest font-display text-xl leading-none text-ivory shadow-sm">
        W
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-xl leading-none text-forest">
          Wedding Planner
        </span>
      </span>
    </Link>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-forest text-ivory shadow-sm"
                : "text-forest/75 hover:bg-cream hover:text-forest"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${
                active
                  ? "text-gold-light"
                  : "text-forest/50 group-hover:text-forest"
              }`}
            />
            <span className="font-medium tracking-wide">{label}</span>
            {active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-light" />
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);

    try {
      await createClient().auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-muted underline-offset-4 transition-colors hover:text-forest hover:underline disabled:cursor-wait disabled:opacity-60"
    >
      <LogOutIcon className="h-3.5 w-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

function SidebarFooter({ userEmail }: { userEmail?: string }) {
  return (
    <div className="rounded-2xl border border-parchment/90 bg-ivory/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-muted">
          Currency
        </p>
        <CurrencyToggle compact />
      </div>
      <div className="mt-4 border-t border-parchment/70 pt-3">
        <p className="flex items-center gap-2 text-[0.6rem] font-medium uppercase tracking-[0.24em] text-muted">
          <LockIcon className="h-3.5 w-3.5 text-gold" />
          Private planner
        </p>
        {userEmail ? (
          <p
            title={userEmail}
            className="mt-1.5 truncate text-[0.7rem] text-muted"
          >
            {userEmail}
          </p>
        ) : null}
        <p className="mt-3 font-display text-lg leading-tight text-forest">
          {WEDDING.longDateLabel}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {WEDDING.venue} · {WEDDING.location}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-parchment/70 pt-3">
        <Link
          href="/rsvp"
          className="text-[0.7rem] font-medium text-gold-ink underline-offset-4 transition-colors hover:text-forest hover:underline"
        >
          RSVP page
        </Link>
        {userEmail ? <SignOutButton /> : null}
      </div>
    </div>
  );
}

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-parchment/70 bg-ivory/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-parchment bg-cream/70 text-forest transition-colors hover:bg-cream"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <aside className="hidden border-r border-parchment/70 bg-cream/60 px-6 py-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:justify-between">
        <div className="space-y-9">
          <Brand />
          <nav aria-label="Main navigation" className="space-y-1.5">
            <p className="px-3 pb-2 text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted/80">
              Menu
            </p>
            <NavLinks pathname={pathname} />
          </nav>
        </div>
        <SidebarFooter userEmail={userEmail} />
      </aside>

      {open ? (
        <div id="mobile-navigation" className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-forest/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col justify-between overflow-y-auto border-r border-parchment bg-ivory px-6 py-6 shadow-2xl">
            <div className="space-y-9">
              <div className="flex items-center justify-between gap-4">
                <Brand onClick={() => setOpen(false)} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-parchment bg-cream/70 text-forest transition-colors hover:bg-cream"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
              <nav aria-label="Mobile navigation" className="space-y-1.5">
                <p className="px-3 pb-2 text-[0.6rem] font-medium uppercase tracking-[0.26em] text-muted/80">
                  Menu
                </p>
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              </nav>
            </div>
            <SidebarFooter userEmail={userEmail} />
          </div>
        </div>
      ) : null}
    </>
  );
}
