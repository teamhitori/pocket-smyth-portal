# Azure AD B2C — Troubleshooting Guide

Common errors, diagnostic tools, and solutions for B2C authentication issues in pocket-smyth-portal.

---

## Happy Path — Complete Login Sequence

This is the **exact HTTP request/response sequence** when an unauthenticated user navigates to `http://localhost:4180/dashboard`. Every redirect, every header, every parameter is shown with explanations.

### Step 1 — Browser requests a protected page

```http
GET /dashboard HTTP/1.1
Host: localhost:4180
```

OAuth2-Proxy intercepts this request. The user has no `_oauth2_proxy` session cookie, so OAuth2-Proxy rejects the request and starts the OIDC flow.

**Response:**

```http
HTTP/1.1 302 Found
Location: http://localhost:4180/oauth2/start?rd=%2Fdashboard
Set-Cookie: _oauth2_proxy_csrf=<csrf-token>; Path=/; HttpOnly; SameSite=Lax
```

| Field | Meaning |
|-------|---------|
| `302 Found` | OAuth2-Proxy redirects to its own `/oauth2/start` endpoint to begin the OIDC flow |
| `rd=%2Fdashboard` | The original URL (`/dashboard`) is URL-encoded and passed as the `rd` (redirect) parameter so the user can be sent back after auth |
| `_oauth2_proxy_csrf` | A CSRF cookie to protect against cross-site request forgery during the auth flow |

---

### Step 2 — OAuth2-Proxy constructs the B2C authorize URL

The browser follows the redirect to `/oauth2/start`. OAuth2-Proxy generates a `state` and `nonce`, then redirects the browser to Azure AD B2C's authorization endpoint.

```http
GET /oauth2/start?rd=%2Fdashboard HTTP/1.1
Host: localhost:4180
Cookie: _oauth2_proxy_csrf=<csrf-token>
```

**Response:**

```http
HTTP/1.1 302 Found
Location: https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/authorize?
  client_id=<OAUTH2_PROXY_CLIENT_ID>
  &response_type=code
  &redirect_uri=http%3A%2F%2Flocalhost%3A4180%2Foauth2%2Fcallback
  &scope=openid+offline_access
  &state=<encrypted-state-containing-nonce-csrf-and-redirect>
  &nonce=<random-nonce>
  &response_mode=query
```

| Parameter | OIDC Role | Value & Purpose |
|-----------|-----------|-----------------|
| `client_id` | RFC 6749 §4.1.1 | The Application (client) ID from our B2C app registration. Tells B2C which app is making the request. |
| `response_type` | RFC 6749 §3.1.1 | `code` — we want an **authorization code**, not tokens directly. This is the Authorization Code flow. |
| `redirect_uri` | RFC 6749 §3.1.2 | `http://localhost:4180/oauth2/callback` — where B2C sends the user back after authentication. Must exactly match a URI registered in the app registration's Authentication blade. |
| `scope` | OIDC Core §3.1.2.1 | `openid` = return an ID token with identity claims. `offline_access` = also return a refresh token for silent renewal. |
| `state` | RFC 6749 §4.1.1 | Encrypted blob containing the CSRF token, nonce, and original redirect URL (`/dashboard`). B2C echoes this back unchanged. OAuth2-Proxy verifies it to prevent CSRF attacks. |
| `nonce` | OIDC Core §3.1.2.1 | Random value included in the ID token's `nonce` claim. OAuth2-Proxy verifies it matches to prevent token replay attacks. |
| `response_mode` | OIDC Core §3.1.2.1 | `query` — return the authorization code as URL query parameters (not fragment or form_post). |

> **Key insight:** This URL was constructed using information from the OIDC discovery document. OAuth2-Proxy fetched `authorization_endpoint` from `{issuer}/.well-known/openid-configuration` at startup.

---

### Step 3 — Browser arrives at B2C sign-in page

The browser follows the redirect to `teamhitorib2c.b2clogin.com`. B2C renders the sign-in page based on the user flow `b2c_1_signupsignin_google`.

```http
GET /teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/authorize?
  client_id=<...>&response_type=code&redirect_uri=<...>&scope=openid+offline_access&state=<...>&nonce=<...>&response_mode=query
  HTTP/1.1
Host: teamhitorib2c.b2clogin.com
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: x-ms-cpim-*=<B2C-session-cookies>

<!DOCTYPE html>
<html>
  <!-- B2C-rendered sign-in page -->
  <!-- Shows buttons for each configured identity provider (e.g., "Sign in with Google") -->
  <!-- Based on the user flow's identity provider configuration -->
</html>
```

The user sees the B2C-hosted sign-in page with identity provider buttons. This page is fully controlled by B2C — its appearance can be customized via page layouts or custom HTML in the user flow settings.

---

### Step 4 — User clicks "Sign in with Google"

When the user clicks the Google button, B2C redirects the browser to Google's authorization endpoint. B2C is now acting as an **OAuth 2.0 client itself**, requesting identity from Google.

```http
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=<B2C-Google-Client-ID>
  &response_type=code
  &redirect_uri=https%3A%2F%2Fteamhitorib2c.b2clogin.com%2Fteamhitorib2c.onmicrosoft.com%2Foauth2%2Fauthresp
  &scope=openid+profile+email
  &state=<B2C-internal-state>
```

This is a **second OAuth 2.0 flow**, nested inside the first. B2C has its own Client ID registered with Google (configured in **Identity providers → Google** in the B2C blade). The `redirect_uri` points back to B2C's callback endpoint (`/oauth2/authresp`).

The user authenticates with Google (enters email, password, 2FA, etc.) and consents to share their profile.

---

### Step 5 — Google redirects back to B2C

After the user authenticates, Google sends an authorization code back to B2C:

```http
HTTP/1.1 302 Found
Location: https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/oauth2/authresp?
  code=<google-authorization-code>
  &state=<B2C-internal-state>
```

B2C receives this code and (server-to-server) exchanges it with Google for tokens. B2C reads the user's name, email, and profile from Google's tokens. It then:

1. **First-time users:** Creates a new user object in the B2C directory with `idp=google.com`
2. **Returning users:** Looks up the existing user by their Google subject ID

B2C sets any default custom attribute values and prepares to issue its own tokens.

---

### Step 6 — B2C redirects back to OAuth2-Proxy with an authorization code

B2C redirects the browser back to our app's `redirect_uri` with B2C's own authorization code:

```http
HTTP/1.1 302 Found
Location: http://localhost:4180/oauth2/callback?
  code=eyJraWQiOiJjcGlkX2hhc...
  &state=<encrypted-state-from-step-2>
```

| Parameter | Meaning |
|-----------|---------|
| `code` | B2C's **authorization code** — a short-lived, one-time-use token. OAuth2-Proxy will exchange this for real tokens server-side. This code is opaque and cannot be decoded. |
| `state` | The exact `state` value from Step 2, echoed back unchanged. OAuth2-Proxy verifies this matches to prevent CSRF attacks. |

> **Security note:** The authorization code is the only secret that appears in the browser URL. It's useless without the `client_secret` (which only OAuth2-Proxy knows), and it expires in minutes.

---

### Step 7 — OAuth2-Proxy exchanges the code for tokens (server-to-server)

OAuth2-Proxy receives the callback, verifies the `state` parameter, then makes a **server-to-server** POST request to B2C's token endpoint. This request **never touches the browser**.

```http
POST /teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/token HTTP/1.1
Host: teamhitorib2c.b2clogin.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=eyJraWQiOiJjcGlkX2hhc...
&client_id=<OAUTH2_PROXY_CLIENT_ID>
&client_secret=<OAUTH2_PROXY_CLIENT_SECRET>
&redirect_uri=http%3A%2F%2Flocalhost%3A4180%2Foauth2%2Fcallback
```

| Field | Purpose |
|-------|---------|
| `grant_type` | `authorization_code` — tells B2C we're exchanging an authorization code for tokens (RFC 6749 §4.1.3) |
| `code` | The authorization code received in Step 6 |
| `client_id` | Our app's Application (client) ID — proves identity |
| `client_secret` | Our app's secret — proves possession (only the legitimate app knows this) |
| `redirect_uri` | Must match the `redirect_uri` from Step 2 exactly — B2C verifies this |

---

### Step 8 — B2C returns tokens

B2C validates the code, verifies the client secret, and returns the tokens:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ijk...",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ijk...",
  "token_type": "Bearer",
  "not_before": 1738531943,
  "expires_in": 3600,
  "expires_on": 1738535543,
  "resource": "<client-id>",
  "id_token_expires_in": 3600,
  "profile_info": "eyJ2ZXIiOiIxLjAiLC...",
  "refresh_token": "eyJraWQiOiJjcGltY29yZV8wNTI...",
  "refresh_token_expires_in": 1209600
}
```

| Token | Format | Purpose | Default Lifetime |
|-------|--------|---------|------------------|
| `access_token` | JWT (signed) | Authorizes API access — OAuth2-Proxy forwards this to the portal | 3600 seconds (60 min) |
| `id_token` | JWT (signed) | Contains user identity claims (see [01-oauth-openid-overview.md](01-oauth-openid-overview.md) for the full claim reference) | 3600 seconds (60 min) |
| `refresh_token` | Opaque string | Used to silently obtain new access/ID tokens after they expire, without re-authenticating the user | 1209600 seconds (14 days) |
| `token_type` | String | Always `Bearer` — tells consumers to send the token in the `Authorization: Bearer <token>` header |  |
| `refresh_token_expires_in` | Integer | Refresh token lifetime in seconds | 1209600 (14 days) |

OAuth2-Proxy validates the ID token:
1. Fetches the RSA public keys from `jwks_uri` (see discovery document)
2. Verifies the JWT signature using RS256
3. Checks that `iss` matches the configured issuer URL
4. Checks that `aud` matches `OAUTH2_PROXY_CLIENT_ID`
5. Checks that `exp` > current time (not expired)
6. Checks that the `nonce` matches what was sent in Step 2

---

### Step 9 — OAuth2-Proxy sets session cookie and redirects to original page

After validating the token, OAuth2-Proxy creates an encrypted session cookie containing the tokens and redirects the browser to the original URL from Step 1.

```http
HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: _oauth2_proxy=<encrypted-session-containing-tokens>; Path=/; HttpOnly; Secure; SameSite=Lax
```

| Field | Meaning |
|-------|---------|
| `_oauth2_proxy` | Encrypted cookie containing the access token, ID token, refresh token, and session metadata. The encryption key is `OAUTH2_PROXY_COOKIE_SECRET`. |
| `HttpOnly` | JavaScript cannot access this cookie — prevents XSS token theft |
| `Secure` | Cookie only sent over HTTPS (in production; localhost is exempt) |
| `SameSite=Lax` | Cookie not sent on cross-site POST requests — CSRF protection |
| `Location: /dashboard` | Redirect back to the page the user originally requested in Step 1 |

---

### Step 10 — Authenticated request reaches the Portal

The browser follows the redirect to `/dashboard`, now with the session cookie attached. OAuth2-Proxy decrypts the cookie, verifies the session is valid, and proxies the request to the Next.js portal on port 3000:

```http
GET /dashboard HTTP/1.1
Host: portal:3000
X-Auth-Request-Access-Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...
X-Auth-Request-Email: reuben@example.com
X-Auth-Request-User: aaaabbbb-0000-cccc-1111-dddd2222eeee
X-Auth-Request-Preferred-Username: reuben@example.com
X-Forwarded-For: 172.18.0.1
X-Forwarded-Host: localhost:4180
X-Forwarded-Proto: http
```

| Header | Source | Purpose |
|--------|--------|---------|
| `X-Auth-Request-Access-Token` | Extracted from the encrypted session cookie | The raw JWT access token — the portal can decode this to read claims (`sub`, `extension_Status`, `extension_Role`, etc.) |
| `X-Auth-Request-Email` | Extracted from the `emails` claim | User's email address for convenience |
| `X-Auth-Request-User` | Extracted from the `sub` or `oid` claim | User's unique B2C Object ID |
| `X-Forwarded-For` | OAuth2-Proxy | Original client IP address |
| `X-Forwarded-Host` | OAuth2-Proxy | Original Host header (the public-facing hostname) |

**The portal never handles authentication itself.** It receives pre-authenticated requests with user identity in the headers and token.

**Response from Portal:**

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>
  <!-- The user's personalized dashboard -->
</html>
```

---

### Complete Flow Summary

```
Browser                  OAuth2-Proxy              Azure AD B2C                Google
  │                         │                          │                         │
  │ GET /dashboard          │                          │                         │
  │────────────────────────>│                          │                         │
  │ 302 /oauth2/start       │                          │                         │
  │<────────────────────────│                          │                         │
  │ GET /oauth2/start       │                          │                         │
  │────────────────────────>│                          │                         │
  │ 302 B2C /authorize      │                          │                         │
  │<────────────────────────│                          │                         │
  │ GET /authorize?client_id&response_type=code&scope=openid...                  │
  │────────────────────────────────────────────────────>│                         │
  │ 200 Sign-in page        │                          │                         │
  │<───────────────────────────────────────────────────│                         │
  │ User clicks "Google"    │                          │                         │
  │────────────────────────────────────────────────────>│                         │
  │ 302 accounts.google.com │                          │                         │
  │<───────────────────────────────────────────────────│                         │
  │ GET Google /auth         │                          │                        │
  │──────────────────────────────────────────────────────────────────────────────>│
  │ 200 Google sign-in       │                          │                        │
  │<─────────────────────────────────────────────────────────────────────────────│
  │ User authenticates       │                          │                        │
  │──────────────────────────────────────────────────────────────────────────────>│
  │ 302 B2C /authresp?code   │                          │                        │
  │<─────────────────────────────────────────────────────────────────────────────│
  │ (B2C exchanges Google code for Google tokens — server-to-server)             │
  │                          │                          │                        │
  │ 302 /oauth2/callback?code=<B2C-code>&state=<state>  │                        │
  │<───────────────────────────────────────────────────│                         │
  │ GET /oauth2/callback     │                          │                         │
  │────────────────────────>│                          │                         │
  │                         │ POST /token               │                         │
  │                         │  (code + client_secret)   │                         │
  │                         │─────────────────────────>│                         │
  │                         │ 200 { access_token,       │                         │
  │                         │       id_token,           │                         │
  │                         │       refresh_token }     │                         │
  │                         │<─────────────────────────│                         │
  │ 302 /dashboard           │                          │                         │
  │ Set-Cookie: _oauth2_proxy=<encrypted>               │                         │
  │<────────────────────────│                          │                         │
  │ GET /dashboard           │                          │                         │
  │────────────────────────>│                          │                         │
  │                         │ GET /dashboard             │                         │
  │                         │  + X-Auth-Request-*        │                         │
  │                         │──────> portal:3000        │                         │
  │ 200 Dashboard page       │                          │                         │
  │<────────────────────────│                          │                         │
```

## Diagnostic Tools

### 1. jwt.ms — Token Inspector

Microsoft's official JWT decoder: [https://jwt.ms](https://jwt.ms)

- Use the B2C portal's "Run user flow" feature with `jwt.ms` as the reply URL
- Paste any JWT to decode its header, payload, and claims
- Verify custom attributes appear in the token
- Check `iss`, `aud`, `exp`, `tfp` claims

### 2. Browser Developer Tools

**Network tab** — essential for debugging OAuth redirects:

1. Open DevTools (F12) → Network tab
2. Enable "Preserve log" (so redirects are captured)
3. Navigate to `http://localhost:4180`
4. Watch the redirect chain:
   - `localhost:4180` → `localhost:4180/oauth2/start`
   - → `teamhitorib2c.b2clogin.com/.../authorize`
   - → (IdP login, e.g., accounts.google.com)
   - → `teamhitorib2c.b2clogin.com/.../oauth2/authresp`
   - → `localhost:4180/oauth2/callback?code=...&state=...`
   - → `localhost:4180/` (final destination)

### 3. OAuth2-Proxy Logs

```bash
docker compose logs oauth2-proxy
```

Look for:
- `OAuthStart` — redirect to B2C initiation
- `OAuthCallback` — code exchange
- `OAuthError` — failures with error description
- `Invalid cookie` — session issues

### 4. Graph Explorer

[https://developer.microsoft.com/en-us/graph/graph-explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

- Verify user objects exist in the directory
- Check custom attribute values
- Test Graph API queries before implementing them in code

### 5. Azure Portal — Audit Logs

Azure AD B2C → **Audit logs** → filter by:
- Activity: `Issue an id_token to the application`
- Activity: `Exchange an authorization code for tokens`
- Status: `Failure` (to find auth errors)

### 6. OpenID Configuration Endpoint

Verify your discovery document is reachable:

```bash
curl -s "https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration" | jq .
```

This should return a JSON document with `authorization_endpoint`, `token_endpoint`, `jwks_uri`, etc.

---

## Common Errors

### AADB2C90057 — "The provided application is not configured to allow the OAuth Implicit flow"

**Symptom:** Clicking "Run user flow" in the Azure Portal results in this error.

**Cause:** Implicit grant is not enabled on the app registration.

**Fix:**
1. Azure AD B2C → **App registrations** → select your app
2. **Authentication** (left menu)
3. Under **Implicit grant and hybrid flows**, check BOTH:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)
4. Click **Save**

> Checking only one of the two is not sufficient — both must be enabled for "Run user flow" to work.

---

### AADB2C90238 — "The provided request is not valid. state must be at most 1024 characters"

**Symptom:** OAuth2-Proxy fails to start the auth flow.

**Cause:** OAuth2-Proxy encodes too much data in the `state` parameter.

**Fix:** Upgrade to OAuth2-Proxy v7.7.1+ (already done in our docker-compose). This version handles state parameter length correctly.

---

### "redirect_uri_mismatch" or "The redirect URI is not valid"

**Symptom:** After B2C login, error saying the redirect URI doesn't match.

**Cause:** The redirect URI in the OAuth2-Proxy config doesn't exactly match what's registered in B2C.

**Fix:**
1. Check the registered redirect URIs: **App registrations** → your app → **Authentication**
2. Compare with OAuth2-Proxy's `--redirect-url` setting
3. URIs must match **exactly** (scheme, host, port, path, case)

For local dev:
```
Registered:  http://localhost:4180/oauth2/callback
OAuth2-Proxy: --redirect-url=http://localhost:4180/oauth2/callback
```

> **Common mistakes:** Trailing slash mismatch, `http` vs `https`, wrong port, wrong path.

---

### "invalid_client" — "AADSTS7000215: Invalid client secret provided"

**Symptom:** OAuth2-Proxy logs show token exchange failure.

**Cause:** The client secret in `.env` is wrong or expired.

**Fix:**
1. Go to **App registrations** → your app → **Certificates & secrets**
2. Check if the secret has expired
3. If expired, create a new secret
4. Copy the new **Value** (not Description) to `OAUTH2_PROXY_CLIENT_SECRET` in `.env`
5. Restart: `docker compose down && docker compose up`

---

### "App not appearing in 'Run user flow' dropdown"

**Symptom:** When testing a user flow, the Application dropdown is empty or doesn't show your app.

**Cause:** Implicit grant is not enabled, or the app was just created (portal cache).

**Fix:**
1. Enable implicit grant (see AADB2C90057 fix above)
2. Refresh the Azure Portal page
3. If still missing, wait a few minutes and try again

---

### OAuth2-Proxy: "Unable to find a valid OIDC issuer"

**Symptom:** OAuth2-Proxy container fails to start.

**Cause:** The OIDC issuer URL is unreachable or malformed.

**Fix:** Verify the issuer URL:

```bash
# Test from your machine
curl -s "https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration"
```

Common issues:
- Typo in tenant ID
- Typo in policy name
- Missing `/v2.0/` suffix
- Using wrong URL format (our issuer includes `/tfp/`)

The full issuer URL should be:
```
https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/
```

---

### OAuth2-Proxy: "Cookie _oauth2_proxy too large"

**Symptom:** Auth succeeds but the portal never loads; browser shows cookie errors.

**Cause:** The session cookie exceeds browser cookie size limits (~4KB) because the token is too large.

**Fix:** Use Redis session store (future improvement) or reduce claims in the token. For MVP, this is unlikely with our minimal claim set.

---

### "User is authenticated but portal shows wrong user data"

**Symptom:** Token contains stale custom attribute values after an admin update.

**Cause:** Tokens are cached and not refreshed until expiry (default 60 min).

**Explanation:**
- Admin updates user's Status via Graph API → change is immediate in the directory
- User's current token still contains old Status value
- New token (with updated Status) is only issued after:
  - Current token expires (60 min), OR
  - User signs out and back in, OR
  - Refresh token is used to get a new token

**Workaround:** The portal should check attributes via Graph API for real-time decisions rather than relying solely on token claims.

---

### Graph API: "Insufficient privileges" (403)

**Symptom:** Portal's server-side code gets 403 when calling Graph API.

**Cause:** Graph API app permissions not granted or not admin-consented.

**Fix:**
1. Azure AD B2C → **App registrations** → Graph API app
2. **API permissions** → verify `User.ReadWrite.All` and `Directory.ReadWrite.All` are listed
3. Verify **Status** column shows "Granted for [tenant]" (green checkmark)
4. If not, click **Grant admin consent for [tenant]**

---

### Graph API: "Resource not found" (404) when querying users

**Symptom:** Graph API returns 404 for a user that exists.

**Cause:** Using the wrong tenant or wrong Object ID.

**Fix:**
- Verify you're using the B2C tenant's token endpoint: `https://login.microsoftonline.com/359dc45f-49b6-4472-92f1-092556a84a98/oauth2/v2.0/token`
- Verify the Object ID matches (copy from B2C → Users → click user → Object ID)
- Use `id` field from Graph API, not `userPrincipalName`

---

### "B2C sign-in page shows no IdP buttons"

**Symptom:** The B2C login page loads but only shows local account sign-in (email/password).

**Cause:** No social identity providers are added to the user flow.

**Fix:**
1. **Azure AD B2C** → **User flows** → select your flow
2. **Identity providers** (left menu)
3. Check the social providers you want (Google, GitHub, etc.)
4. Click **Save**

> Also verify the IdP is properly configured under **Azure AD B2C** → **Identity providers** with valid Client ID and Secret.

---

### "Custom attributes not appearing in the token"

**Symptom:** Token from jwt.ms doesn't include extension attributes.

**Cause:** Custom attributes not configured as Application claims in the user flow.

**Fix:**
1. **User flows** → select your flow → **Application claims**
2. Check the custom attributes you want in the token (Status, Role, Username)
3. Click **Save**
4. Re-run the user flow test

> **Note:** If the attribute value is `null` (never been set for the user), it may be omitted from the token entirely rather than appearing as `null`.

---

### Docker Compose: OAuth2-Proxy can't reach B2C

**Symptom:** `oauth2-proxy` logs show DNS resolution failures or timeouts connecting to `b2clogin.com`.

**Cause:** Container networking/DNS issue.

**Fix:**
```bash
# Test DNS from inside the container
docker compose exec oauth2-proxy nslookup teamhitorib2c.b2clogin.com

# If DNS fails, try adding explicit DNS in docker-compose.yml:
# services:
#   oauth2-proxy:
#     dns:
#       - 8.8.8.8
```

---

## Debugging Checklist

When authentication isn't working, check these in order:

```
□ 1. Is the B2C tenant accessible?
     curl https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/
     
□ 2. Is the OIDC discovery document reachable?
     curl https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration

□ 3. Do .env values match the app registration?
     - OAUTH2_PROXY_CLIENT_ID matches Application (client) ID
     - OAUTH2_PROXY_CLIENT_SECRET is the Value (not Description)
     - B2C_OIDC_ISSUER_URL is correctly formatted

□ 4. Is the redirect URI registered?
     - App registrations → Authentication → Web → Redirect URIs
     - Must include http://localhost:4180/oauth2/callback for local dev

□ 5. Are implicit grant tokens enabled (for portal testing)?
     - Authentication → Implicit grant → both checkboxes

□ 6. Is at least one IdP configured AND added to the user flow?
     - Identity providers blade → at least one configured
     - User flows → your flow → Identity providers → at least one checked

□ 7. Are Application claims configured in the user flow?
     - User flows → your flow → Application claims → custom attributes checked

□ 8. Is OAuth2-Proxy running and healthy?
     docker compose ps
     docker compose logs oauth2-proxy

□ 9. Is the Portal running and reachable from OAuth2-Proxy?
     docker compose exec oauth2-proxy wget -qO- http://portal:3000/api/health
```

---

## Error Code Reference

| Error Code | Short Description | Most Common Cause |
|-----------|-------------------|-------------------|
| AADB2C90057 | Implicit flow not configured | Enable implicit grant in Authentication blade |
| AADB2C90238 | State parameter too long | Upgrade OAuth2-Proxy |
| AADB2C90117 | Invalid redirect URI | URI doesn't match registration |
| AADB2C99002 | User flow not found | Typo in policy name in issuer URL |
| AADB2C90205 | No user flows configured | Create a user flow first |
| AADB2C90085 | Service temporarily unavailable | Transient — retry |
| AADB2C90006 | Invalid redirect URI scheme | Must be https (or http for localhost) |

---

## Useful URLs for Our Tenant

| Resource | URL |
|----------|-----|
| Azure Portal — B2C | `portal.azure.com` → search "Azure AD B2C" |
| OIDC Discovery | `https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration` |
| JWKS (signing keys) | `https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/discovery/v2.0/keys` |
| Token Decoder | `https://jwt.ms` |
| Graph Explorer | `https://developer.microsoft.com/en-us/graph/graph-explorer` |

---

## Further Reading

- [Azure AD B2C Error Codes](https://learn.microsoft.com/en-us/azure/active-directory-b2c/error-codes)
- [Troubleshoot Azure AD B2C custom policies](https://learn.microsoft.com/en-us/azure/active-directory-b2c/troubleshoot-custom-policies)
- [OAuth2-Proxy Troubleshooting](https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview)
- [Azure AD B2C Sign-In Diagnostics](https://learn.microsoft.com/en-us/azure/active-directory-b2c/troubleshoot-with-application-insights-vscode)
