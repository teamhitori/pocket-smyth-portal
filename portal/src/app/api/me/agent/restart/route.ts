import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/me/agent/restart — Restart own agent container
 */
export async function POST(request: NextRequest) {
  // TODO: Call Admin Agent POST /containers/:name/restart
  return NextResponse.json({ stub: true, endpoint: "/api/me/agent/restart" });
}
