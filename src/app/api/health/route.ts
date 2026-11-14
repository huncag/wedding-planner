import { NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Daily health check used by the Vercel cron job.
 *
 * Supabase Free pauses a project after seven days without activity. Hitting the
 * GoTrue health endpoint counts as activity and keeps the database awake while
 * the planner is otherwise unused. The endpoint returns a non-2xx status when
 * Supabase is unreachable so failed cron runs are visible in Vercel.
 */
export async function GET() {
  let url: string;
  let key: string;

  try {
    ({ url, key } = supabaseEnv());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    return NextResponse.json(
      {
        ok: response.ok,
        supabase: response.status,
        checkedAt: new Date().toISOString(),
      },
      {
        status: response.ok ? 200 : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Supabase health check failed.", checkedAt: new Date().toISOString() },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
