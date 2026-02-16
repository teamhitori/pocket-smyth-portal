import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/system/status — System resource overview (admin only, via Admin Agent)
 */
export async function GET(request: NextRequest) {
  // TODO: Verify admin role from JWT
  // TODO: Call Admin Agent GET /containers for aggregate stats
  return NextResponse.json({ stub: true, endpoint: "/api/system/status" });
}
