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
| `/`        | Overview with countdown and live planning totals   | Built        |
| `/guests`  | Party-based guest list, invitation tracking and RSVP inbox | Built |
| `/vendors` | Suppliers grouped by category, offers, prices and agreements | Built |
| `/budget`  | Deposits and costs with RON/EUR conversion         | Built        |
| `/seating` | Party-aware seating map with drag-and-drop groups  | Built        |
| `/rsvp`    | Public RSVP form for guests                        | Built        |
| `/login`   | Email + password sign-in                            | Built        |

`/rsvp` and `/login` are public and live outside the private planner layout.
Every other route requires a Supabase session.

## Authentication

Two accounts are created manually in Supabase (**Authentication → Users**);
there is no sign-up screen. Authentication turns on automatically whenever
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present;
`NEXT_PUBLIC_AUTH_ENABLED=false` is only for local design work without a login.
`src/proxy.ts` refreshes the session, redirects signed-out visitors to `/login`,
and keeps `/rsvp` open. The planner layout verifies the session again before
rendering, and Supabase RLS is the real data boundary — the anon key alone can
read nothing.

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
3. Copy `.env.example` to `.env.local` and add the project URL and anon key.
   Authentication turns on automatically once both are present.
4. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.

The schema creates `guests`, `vendors`, `budget`, `payments`, `invitations`,
`seating_tables`, `rsvp_submissions`, and `fx_rates`, with RLS enabled on every
table. Authenticated users get full access; anonymous visitors may only insert
an RSVP. Nothing is readable without an account.

## Importing the spreadsheet

The couple's existing plan (`A TÁBLÁZAT - E&H.xlsx`) is imported with
[`supabase/import-plan.sql`](supabase/import-plan.sql). It adds the party,
invitation, vendor and deposit columns, then inserts:

- 154 invitation groups / 309 people, with side and category
- 20 tables × 10 chairs
- 19 vendors with their offers, price notes and agreed flags
- 3 deposit budget lines with payment method and reference

Every insert is guarded by an empty-table check, so the file is safe to run
twice. The workbook itself is never modified. Paste the file into the Supabase
SQL editor and run it once after `schema.sql`.

## Public RSVP and live updates

Guests open `/rsvp` without an account and submit their reply directly into
`rsvp_submissions`. The form asks for contact details and attendance, then lets
the guest add as many people as they like with a name and meal for each one,
plus dietary needs and a message. It is available in English, Hungarian and
Romanian, remembered in a cookie. Anonymous visitors can only insert a reply and
can never read anyone else's.

The per-person list lives in `rsvp_submissions.people`. If that column has not
been added yet, replies still carry the full list inside `plus_one_name` and the
planner decodes it — run [`supabase/rsvp-people.sql`](../supabase/rsvp-people.sql)
once to store it properly.

`/guests` is the couple's guest list and inbox. The list stores one row per
invitation group — headcount, side, category, invitation sent/reminder, reply and
confirmed headcount — grouped by side and category. Below it, replies load on the
server and stay current through Supabase Realtime on `rsvp_submissions`, with a
20-second polling fallback and a visible live/polling badge. New replies raise a
toast; replies can be filtered, marked handled, or deleted. The page also has a
copy-link button for sharing the public RSVP URL.

Attending replies are merged into the `guests` table the next time the overview,
guests or seating page loads: the reply is matched by email or full name, linked
back to that party, and new parties are added automatically. The submitted party
size updates the confirmed headcount without shrinking an imported group.

## Budget and seating

Both pages read and write Supabase directly, so the two of you always see the
same plan.

- **Budget** — each line item keeps the currency it was quoted in; totals convert
  to the sidebar's display currency. Vendor, payment method, payment reference
  and notes are kept with each deposit, and adding, deleting and toggling paid
  all save immediately.
- **Seating** — tables are stored in `seating_tables`; a party's starting chair
  lives on `guests.seat_index` and it occupies `party_size` consecutive chairs.
  Adding a table, resizing it, seating a whole group, moving groups and
  unseating are all persisted, and removing a table first clears its guests'
  chairs. Pending groups are shown so the room can be planned before replies
  arrive.
- **Vendors** — grouped by category, with contact, handled-by, offer summary,
  free-text price note, agreement and status, all saved as you toggle.
- **Overview** — the four cards are live totals of people invited, people coming,
  booked vendors and the estimated budget in the display currency. The next-steps
  checklist tracks the same data: unanswered groups, open vendors, missing meal
  choices and invitation progress all update automatically.

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
    guests/          # Guest list, invitation tracking and live RSVP inbox
    rsvp/            # Public RSVP form
    seating/         # Interactive table cards + party-aware planner
    vendors/         # Supplier board and edit form
  lib/
    auth.ts          # Public paths + auth feature flag
    budget.ts        # Budget types, row mapping and totals
    currency.ts      # Money types, conversion and formatting
    fx.ts            # ECB/Frankfurter rate fetching
    guests-sync.ts   # Merges RSVP replies into the guest list
    guests.ts        # Party types, invitation fields, filters and stats
    vendors.ts       # Vendor types, grouping, statuses and stats
    seating.ts       # Seating types and party placement helpers
    seating-db.ts    # Supabase row mapping for tables and chairs
    supabase/        # Browser + server clients
    wedding.ts       # Wedding date and venue config
  proxy.ts           # Session refresh + route protection
supabase/schema.sql  # Database schema, RLS and Realtime setup
supabase/import-plan.sql # One-time spreadsheet import
docs/                # Setup guides
```

The wedding date lives in `src/lib/wedding.ts` — change `dateISO` there to move
the countdown.

The palette lives in the `@theme` block of `src/app/globals.css`. Token names
keep their historical labels (`forest`, `gold`, `cream`) so components stay
stable; only the values need changing to repaint the whole app.
