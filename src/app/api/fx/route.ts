import { NextResponse } from "next/server";
import { getFxSnapshot } from "@/lib/fx";

/**
 * Current RON/EUR rate. `?fresh=1` bypasses the one-hour cache — used by the
 * "Refresh" control in the planner.
 */
export async function GET(request: Request) {
  const fresh = new URL(request.url).searchParams.has("fresh");
  const snapshot = await getFxSnapshot(fresh);

  return NextResponse.json(snapshot, {
    headers: { "cache-control": "no-store" },
  });
}
