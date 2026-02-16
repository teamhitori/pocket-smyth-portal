import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/users/:id/approve — Approve pending user + trigger provisioning (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: Verify admin role from JWT
  // TODO: Update B2C status to approved via Graph API
  // TODO: Call Admin Agent POST /compose/up to provision user stack
  return NextResponse.json({ stub: true, endpoint: `/api/users/${params.id}/approve` });
}
