import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/system/config — System configuration (admin only)
 * PUT /api/system/config — Update system configuration (admin only)
 */
export async function GET(request: NextRequest) {
  // TODO: Verify admin role from JWT
  // TODO: Return system configuration from env vars
  return NextResponse.json({ stub: true, endpoint: "/api/system/config" });
}

export async function PUT(request: NextRequest) {
  // TODO: Verify admin role from JWT
  // TODO: Update system configuration
  return NextResponse.json({ stub: true, endpoint: "/api/system/config" });
}
