import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/users/:id/revoke — Revoke user access, stop container (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: Verify admin role from JWT
  // TODO: Call Admin Agent POST /compose/down to stop user stack
  // TODO: Update B2C status to revoked via Graph API
  return NextResponse.json({ stub: true, endpoint: `/api/users/${params.id}/revoke` });
}
