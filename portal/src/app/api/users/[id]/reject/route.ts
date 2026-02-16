import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/users/:id/reject — Reject pending user (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: Verify admin role from JWT
  // TODO: Update B2C status via Graph API
  return NextResponse.json({ stub: true, endpoint: `/api/users/${params.id}/reject` });
}
