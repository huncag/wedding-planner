import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnabled, isPublicPath } from "@/lib/auth";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Route protection + session refresh.
 *
 * - `/rsvp` stays open so guests never need an account.
 * - `/login` is public, but signed-in users are sent to the planner.
 * - Everything else requires a Supabase session.
 *
 * `getUser()` also refreshes expired tokens and writes the new cookies onto the
 * response. The check is optimistic; the planner layout verifies again and RLS
 * is the real data boundary.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isAuthEnabled()) {
    return response;
  }

  const { url, key } = supabaseEnv();
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && user) {
      const plannerUrl = request.nextUrl.clone();
      plannerUrl.pathname = "/";
      plannerUrl.search = "";
      return NextResponse.redirect(plannerUrl);
    }

    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/fx|.*\\..*).*)"],
};
