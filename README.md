# Wedding Planner

A private wedding planning PWA for our celebration at Teleki Castle (Gernyeszeg, Romania) in May 2028.

Built with Next.js 16 (App Router), Tailwind CSS v4, TypeScript, Supabase Auth and a Supabase PostgreSQL backend.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` until you sign in with one of the two Supabase accounts.

## Routes

| Route      | Purpose                                            | Status       |
| ---------- | -------------------------------------------------- | ------------ |
| `/`        | Overview with countdown to 27 May 2028             | Built        |
| `/guests`  | Live RSVP inbox with meals, dietary needs, plus-ones | Built        |
| `/vendors` | Suppliers, contacts, costs, booking status         | Placeholder  |
| `/budget`  | Estimated vs. actual costs with RON/EUR conversion | Built (demo) |
| `/seating` | Interactive seating map with drag-and-drop guests   | Built (demo) |
| `/rsvp`    | Public RSVP form for guests                        | Built        |
| `/login`   | Email + password sign-in                            | Built        |

`/rsvp` and `/login` are public and live outside the private planner layout.
Every other route requires a Supabase session.

## Authentication

Two accounts are created manually in Supabase (**Authentication → Users**);
there is no sign-up screen. `src/proxy.ts` refreshes the session, redirects
signed-out visitors to `/login`, and keeps `/rsvp` open. The planner layout
verifies the session again before rendering, and Supabase RLS is the real data
boundary — the anon key alone can read nothing.

Sign out from the sidebar footer.

## Currency

Every amount is stored with the currency it was entered in — a RON quote stays
RON, an EUR quote stays EUR — and only the display is converted. The `RON | EUR`
toggle lives in the sidebar footer, and the choice is remembered in a cookie.

Rates come from the ECB via [Frankfurter](https://frankfurter.dev): free, no API
key, refreshed hourly and cached server-side. The budget page shows the current
rate, its ECB reference date, and a manual **Refresh** button. If the feed is
unreachable the last known rate is used and clearly labelled.

## Supabase setup

Full walkthrough: [`docs/supabase-setup.md`](docs/supabase-setup.md).

1. Create a Supabase project in the Frankfurt region on the free plan.
2. Create both accounts in **Authentication → Users** and turn off email
   confirmation.
3. Copy `.env.example` to `.env.local` and add the project URL, anon key, and
   `NEXT_PUBLIC_AUTH_ENABLED=true`.
4. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.

The schema creates `guests`, `vendors`, `budget`, `payments`, `invitations`,
`seating_tables`, `rsvp_submissions`, and `fx_rates`, with RLS enabled on every
table. Authenticated users get full access; anonymous visitors may only insert
an RSVP. Nothing is readable without an account.

## Public RSVP and live updates

Guests open `/rsvp` without an account and submit their reply directly into
`rsvp_submissions`. The form asks for contact details, attendance, meal, dietary
needs, a plus-one and a message; anonymous visitors can only insert a reply and
can never read anyone else's.

`/guests` is the couple's inbox. It loads the replies on the server, then keeps
them current through Supabase Realtime on `rsvp_submissions`, with a 20-second
polling fallback and a visible live/polling badge. New replies raise a toast;
replies can be filtered, marked handled, or deleted. The page also has a
copy-link button for sharing the public RSVP URL.

## Hosting

**Vercel Hobby** (free) serves the app; **Supabase Free** holds the database.
Both the private planner and the public `/rsvp` page live in the same
deployment, so there is one URL to share.

The deployment walkthrough is in
[`docs/deployment.md`](docs/deployment.md). [`vercel.json`](vercel.json) adds a
daily cron job that calls `/api/health`, which pings Supabase so the free
project does not pause after seven idle days.


## Project structure

```
src/
  app/
    (planner)/       # Private shell: sidebar, currency provider, auth guard
    (public)/
      login/         # Email + password sign-in
      rsvp/          # Public guest-facing RSVP form
    api/fx/          # Current RON/EUR rate
    api/health/      # Cron health check that keeps Supabase awake
  components/
    auth/            # Login form
    budget/          # Budget summary, line-item form, totals
    currency/        # Currency context, toggle, rate note, Money
    guests/          # Live RSVP inbox
    rsvp/            # Public RSVP form
    seating/         # Interactive table cards + planner
  lib/
    auth.ts          # Public paths + auth feature flag
    budget.ts        # Budget types, demo data, totals
    currency.ts      # Money types, conversion and formatting
    fx.ts            # ECB/Frankfurter rate fetching
    supabase/        # Browser + server clients
    wedding.ts       # Wedding date and venue config
  proxy.ts           # Session refresh + route protection
supabase/schema.sql  # Database schema, RLS and Realtime setup
docs/                # Setup guides
```

The wedding date lives in `src/lib/wedding.ts` — change `dateISO` there to move
the countdown.

The budget and seating pages currently use local demo state and reset on reload.
Both are ready to be pointed at Supabase next.
