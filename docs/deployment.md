# Deployment

The app is a single Next.js deployment on **Vercel Hobby** (free) backed by
**Supabase Free**. The private planner and the public `/rsvp` page share one URL.

## 1. Push the repository

The local project is already a git repository connected to
`https://github.com/huncag/wedding-planner.git`.

```bash
git push -u origin main
```

If the push asks for credentials, sign in to GitHub with the account that owns
the repository. Day-to-day changes are then:

```bash
git add .
git commit -m "Describe the change"
git push
```

## 2. Import into Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub (Hobby plan).
2. **Add New → Project → Import Git Repository** and pick
   `huncag/wedding-planner`.
3. Keep the detected **Next.js** settings — no build or output overrides.
4. Add these environment variables (all environments, or at least Production):

   | Name                            | Value                                      |
   | ------------------------------- | ------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://msjgyxsjaxecflezbolh.supabase.co`  |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable / anon key from Supabase    |
   | `NEXT_PUBLIC_AUTH_ENABLED`      | `true`                                      |

   These are the same values as `.env.local`. The anon/publishable key is meant
   to be public; never add the `service_role` key.

5. **Deploy**. The project URL is `https://wedding-planner-<team>.vercel.app`
   unless the project name is available as `wedding-planner.vercel.app`.

From then on, every push to `main` deploys automatically.

## 3. Point Supabase at the deployment

In Supabase: **Authentication → URL Configuration**.

- **Site URL:** the production URL, e.g. `https://wedding-planner.vercel.app`
- **Redirect URLs:** add the same URL with `/**`

Password sign-in works without this, but it keeps confirmation and recovery
links on the right host if email is ever enabled.

## 4. Keep the free project awake

Supabase Free pauses a project after seven days without activity.
[`vercel.json`](../vercel.json) registers a daily cron job:

```json
{ "path": "/api/health", "schedule": "0 6 * * *" }
```

`/api/health` calls Supabase's `/auth/v1/health` endpoint, which counts as
activity. Hobby plans run cron jobs once per day, within the scheduled hour
(UTC). Check **Project → Cron Jobs** in Vercel for the run history; a green run
returns `{ "ok": true, "supabase": 200 }`.

## 5. Smoke test after the first deploy

1. `https://…/login` — sign in with one of the two Supabase accounts.
2. `/` and `/guests` load without redirecting back to login.
3. `/rsvp` opens in a private window with no account.
4. Submit one test reply; it should appear on `/guests` within a second.
5. Delete the test reply from the inbox.
6. `/api/health` returns `{ "ok": true }`.

## Notes

- No `vercel.json` build settings are needed; Next.js is detected.
- Environment variables changed in Vercel require a redeploy.
- Free-tier limits: Vercel Hobby is for personal, non-commercial projects;
  Supabase Free includes 500 MB database and 50,000 monthly active users.
- If the Supabase project is ever paused, open the Supabase dashboard and
  restore it, then redeploy or wait for the next cron run.
