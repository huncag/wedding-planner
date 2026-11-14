/**
 * Route access rules for the private planner.
 *
 * `/rsvp` is public by design: guests must reach it without an account.
 * Everything else is private once authentication ships.
 */
export const PUBLIC_PATHS = ["/rsvp", "/login", "/auth", "/api/health"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Authentication is on by default whenever Supabase is configured.
 *
 * Set `NEXT_PUBLIC_AUTH_ENABLED=false` only to deliberately run the planner
 * without a login (local design work). `/rsvp` and `/login` stay public in
 * every case.
 */
export function isAuthEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
