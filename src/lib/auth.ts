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
 * Authentication is switched on when the flag and the Supabase keys are all
 * present. Keeping it explicit lets the app run without a backend during local
 * design work, while `/rsvp` and `/login` stay public in every case.
 */
export function isAuthEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
