import { NextRequest, NextResponse } from "next/server";

/**
 * Decode a JWT and return { header, payload }. Returns null if invalid.
 */
function decodeJwt(token: string): { header: object; payload: object } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return {
      header: JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8")),
      payload: JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")),
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/me — Current user info from decoded JWTs.
 *
 * OAuth2-Proxy forwards two tokens:
 * - Access Token via X-Forwarded-Access-Token (contains OAuth scopes/audience)
 * - ID Token via Authorization: Bearer <id_token> (contains user identity + custom attributes)
 */
export async function GET(request: NextRequest) {
  // Access token (OAuth2-Proxy --pass-access-token)
  const accessToken =
    request.headers.get("x-forwarded-access-token") ||
    request.headers.get("x-auth-request-access-token");

  // ID token (OAuth2-Proxy --pass-authorization-header → Authorization: Bearer <id_token>)
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const result: Record<string, unknown> = {};

  if (idToken) {
    const decoded = decodeJwt(idToken);
    if (decoded) {
      result.id_token = decoded.payload;
    }
  }

  if (accessToken) {
    const decoded = decodeJwt(accessToken);
    if (decoded) {
      result.access_token = decoded.payload;
    }
  }

  if (!idToken && !accessToken) {
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value.length > 40 ? value.substring(0, 40) + "..." : value;
    });
    return NextResponse.json(
      { error: "No tokens found", headers_received: allHeaders },
      { status: 401 }
    );
  }

  return NextResponse.json(result);
}
