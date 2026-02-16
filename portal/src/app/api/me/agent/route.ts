import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/me/agent — Agent container status (via Admin Agent)
 * POST /api/me/agent/restart — Restart own agent
 */
export async function GET(request: NextRequest) {
  // TODO: Call Admin Agent GET /containers/:name/stats
  return NextResponse.json({ stub: true, endpoint: "/api/me/agent" });
}
