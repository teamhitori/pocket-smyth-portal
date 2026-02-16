import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users — List all users (admin only)
 */
export async function GET(request: NextRequest) {
  // TODO: Verify admin role from JWT
  // TODO: List users from B2C Graph API
  return NextResponse.json({ stub: true, endpoint: "/api/users" });
}
