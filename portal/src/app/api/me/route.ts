import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/me — Current user info (from B2C via Graph API)
 * JWT comes from X-Auth-Request-Access-Token header (injected by OAuth2-Proxy).
 */
export async function GET(request: NextRequest) {
  // TODO: Decode JWT from X-Auth-Request-Access-Token header
  // TODO: Fetch user details from B2C Graph API using oid claim
  return NextResponse.json({ stub: true, endpoint: "/api/me" });
}
