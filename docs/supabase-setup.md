# Supabase setup

This is the one-time setup for the shared database and the two planner accounts.
Everything here fits in the free tier.

## 1. Create the project

1. Sign up at [supabase.com](https://supabase.com) — no card required.
2. **New project**
   - Name: `wedding-planner`
   - Database password: generate one and keep it somewhere safe.
   - Region: **Frankfurt (eu-central-1)** — the closest region to Romania.
   - Plan: **Free**
3. Wait for provisioning to finish (a couple of minutes).

## 2. Create the two accounts

The planner uses **email + password** through Supabase Auth. Both accounts have
full access; there is no public sign-up.

1. Go to **Authentication → Sign In / Providers → Email** and make sure Email is
   enabled.
2. Go to **Authentication → Users → Add user → Create new user** and add both
   accounts with your real email addresses and a strong password.
3. Tick **Auto Confirm User** so each account can sign in immediately.

If you would rather not use real addresses, any internal alias works too (for
example `andrei@wedding.local`) — Supabase never sends mail unless you configure
SMTP. Password resets are done from the **Users** screen.

## 3. Add the keys

In **Project Settings → API**, copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Create `.env.local` in the project root (it is git-ignored) using
[`.env.example`](../.env.example) as the template. The login gate turns on
automatically once the URL and key are present. Never put the `service_role`
key in a `NEXT_PUBLIC_` variable or in client code.

## 4. Create the tables

Open **SQL Editor → New query**, paste the whole of
[`supabase/schema.sql`](../supabase/schema.sql), and run it.

It creates:

| Table              | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `seating_tables`   | Round tables and chair capacity                           |
| `guests`           | Guest list, RSVP status, meal, plus-one, `seat_index`     |
| `vendors`          | Suppliers, contact details, quoted cost + currency        |
| `budget`           | Line items with separate currency per estimated/actual    |
| `payments`         | Scheduled and completed payments                          |
| `invitations`      | One invitation record per guest                           |
| `rsvp_submissions` | Raw replies from the public page                          |
| `fx_rates`         | Daily RON/EUR snapshots for historical totals             |

It also enables RLS on every table, gives the authenticated accounts full
access, and allows **insert-only** anonymous access to `rsvp_submissions`.

## 5. Import the wedding spreadsheet

After `schema.sql`, open **SQL Editor → New query** again and run
[`supabase/import-plan.sql`](../supabase/import-plan.sql).

It adds the party, invitation, vendor and deposit columns and then imports the
couple's existing plan:

- 154 invitation groups / 309 people, with side and category
- 20 tables × 10 chairs
- 19 vendors with offers, price notes and agreed flags
- 3 deposit budget lines with payment method and reference

Every insert checks that its table is empty first, so running the file twice is
safe. The original workbook is never modified.

If your project was created before the per-person RSVP list, also run
[`supabase/rsvp-people.sql`](../supabase/rsvp-people.sql). It adds the
`rsvp_submissions.people` jsonb column, is safe to run more than once, and the
app keeps working (with a compact fallback) until it has been applied.

## 6. Realtime

The script adds `rsvp_submissions` and `guests` to the `supabase_realtime`
publication. That is what makes the planner update live when a guest replies.

If you ever need to check it: **Database → Publications → supabase_realtime**.

## 7. Free-tier housekeeping

- **Pausing:** free projects pause after 7 days without activity. Opening the
  planner or receiving an RSVP resets the timer. A paused project is resumed
  from the dashboard with one click (and can be kept awake by a daily Vercel
  cron once deployed).
- **Backups:** the free tier has no automatic backups. Run
  `supabase db dump` occasionally, or export the tables from the dashboard.
- **Limits:** 500 MB database, 50,000 monthly active users, unlimited API
  requests — far beyond two planners and a wedding guest list.

## How the app uses these tables

- The public `/rsvp` page inserts into `rsvp_submissions`, and `/guests` streams
  new replies live over Realtime.
- `/guests` stores one row per invitation group, with headcount, side, category
  and invitation tracking.
- `/budget`, `/vendors` and `/seating` read and write their tables directly, so
  changes are shared between both planners and survive a reload.
- Attending replies are merged into `guests` the next time the overview, guests
  or seating page loads, so the guest list and seating plan stay in step.
