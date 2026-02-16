import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/users/:id — Soft delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // TODO: Verify admin role from JWT
  // TODO: Stop container via Admin Agent, set status=revoked in B2C
  return NextResponse.json({ stub: true, endpoint: `/api/users/${params.id}` });
}
