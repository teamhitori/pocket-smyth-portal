# OAuth 2.0 & OpenID Connect — Overview

A practical introduction to the protocols that power authentication in pocket-smyth-portal.

---

## Why This Matters

pocket-smyth-portal uses **Azure AD B2C** as its identity provider, which communicates over **OpenID Connect (OIDC)** — an identity layer built on top of **OAuth 2.0**. Every login, token exchange, and session check flows through these protocols. Understanding them is not optional — it is the foundation of the entire auth system.

---

## Key Terms

| Term | Definition |
|------|-----------|
| **Resource Owner** | The end user who owns the data and grants access. In our case, the person signing in to pocket-smyth-portal. |
| **Client** | The application requesting access on behalf of the user. For us, this is **OAuth2-Proxy** (which fronts the portal). |
| **Authorization Server (AS)** | The server that authenticates the user and issues tokens. **Azure AD B2C** fills this role. |
| **Resource Server** | The API or service that accepts access tokens and serves protected resources. Our **Next.js API Routes** act as the resource server. |
| **Redirect URI** | The URL the Authorization Server sends the user back to after authentication. OAuth2-Proxy registers `http://localhost:4180/oauth2/callback` locally and `https://login.teamhitori.com/oauth2/callback` in production. |
| **Scope** | A permission the client requests. We use `openid` (identity) and `offline_access` (refresh tokens). |
| **Claim** | A key-value pair inside a token (e.g., `email`, `sub`, `given_name`). B2C tokens include standard OIDC claims plus custom extension attributes. |
| **Grant Type** | The method used to obtain tokens. We use the **Authorization Code Grant** (the most secure for web apps). |

---

## OAuth 2.0 — The Authorization Framework

OAuth 2.0 ([RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)) is an **authorization** framework. It answers: *"Is this application allowed to access this resource on behalf of this user?"*

OAuth 2.0 does **not** define how to authenticate users — it only defines how to delegate access.

### Grant Types

| Grant Type | Use Case | Our Usage |
|-----------|----------|-----------|
| **Authorization Code** | Server-side web apps — most secure | ✅ Yes — OAuth2-Proxy uses this |
| **Authorization Code + PKCE** | SPAs and mobile apps | Not used (we have a server-side proxy) |
| **Client Credentials** | Machine-to-machine (no user) | ✅ Yes — Portal → Graph API for user management |
| **Implicit** | Legacy SPAs (deprecated) | Only for B2C "Run user flow" testing in portal |
| **Resource Owner Password** | Direct username/password (discouraged) | ❌ Never used |

### Authorization Code Flow (What We Use)

```
┌──────────┐                          ┌───────────────┐                     ┌────────────┐
│  Browser  │                          │  OAuth2-Proxy │                     │  Azure AD  │
│  (User)   │                          │  (Client)     │                     │  B2C (AS)  │
└─────┬─────┘                          └──────┬────────┘                     └─────┬──────┘
      │                                       │                                    │
      │  1. GET /dashboard                    │                                    │
      │──────────────────────────────────────>│                                    │
      │                                       │                                    │
      │  2. 302 Redirect to B2C /authorize    │                                    │
      │<──────────────────────────────────────│                                    │
      │                                       │                                    │
      │  3. Browser follows redirect ─────────────────────────────────────────────>│
      │                                       │                                    │
      │  4. User signs in (Google/GitHub/MSA) │                                    │
      │<──────────────────────────────────────────────────────────────────────────│
      │                                       │                                    │
      │  5. 302 Redirect to /oauth2/callback?code=XYZ                             │
      │──────────────────────────────────────>│                                    │
      │                                       │                                    │
      │                                       │  6. POST /token (code + secret)    │
      │                                       │───────────────────────────────────>│
      │                                       │                                    │
      │                                       │  7. { id_token, access_token,      │
      │                                       │       refresh_token }              │
      │                                       │<───────────────────────────────────│
      │                                       │                                    │
      │  8. Set cookie, proxy to portal:3000  │                                    │
      │<──────────────────────────────────────│                                    │
      │                                       │                                    │
```

**Key points:**

- The **authorization code** (step 5) is a short-lived, one-time-use string
- The code is exchanged server-side (step 6) — the browser never sees the tokens
- OAuth2-Proxy stores tokens in an encrypted session cookie
- On subsequent requests, OAuth2-Proxy validates the cookie and passes the access token to the portal via the `X-Auth-Request-Access-Token` header

---

## OpenID Connect (OIDC) — The Identity Layer

OIDC ([spec](https://openid.net/specs/openid-connect-core-1_0.html)) is a **thin identity layer on top of OAuth 2.0**. It answers: *"Who is this user?"*

### What OIDC Adds to OAuth 2.0

| Feature | OAuth 2.0 | OIDC |
|---------|-----------|------|
| Access tokens | ✅ | ✅ |
| ID tokens (user identity) | ❌ | ✅ |
| UserInfo endpoint | ❌ | ✅ |
| Discovery document | ❌ | ✅ |
| Standard claims (email, name, sub) | ❌ | ✅ |

### The Discovery Document

Every OIDC provider publishes a `.well-known/openid-configuration` document. For our B2C tenant and user flow:

```
https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration
```

This document tells clients:
- Where to send authorization requests (`authorization_endpoint`)
- Where to exchange codes for tokens (`token_endpoint`)
- Where to find signing keys (`jwks_uri`)
- What scopes and claims are supported

OAuth2-Proxy reads this document automatically via the `--oidc-issuer-url` flag.

### ID Token

The ID token is a **JWT (JSON Web Token)** containing claims about the authenticated user. Below is a **comprehensive** decoded B2C ID token showing every claim our tenant supports (as reported by the live [discovery document's](https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/v2.0/.well-known/openid-configuration) `claims_supported` field):

```json
{
  "iss": "https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/",
  "sub": "aaaabbbb-0000-cccc-1111-dddd2222eeee",
  "aud": "12345678-abcd-efgh-ijkl-123456789abc",
  "exp": 1738535543,
  "iat": 1738531943,
  "nbf": 1738531943,
  "auth_time": 1738531940,
  "nonce": "defaultNonce_abc123",
  "acr": "b2c_1_signupsignin_google",
  "tfp": "b2c_1_signupsignin_google",
  "name": "Reuben Smith",
  "given_name": "Reuben",
  "family_name": "Smith",
  "emails": ["reuben@example.com"],
  "idp": "google.com",
  "oid": "aaaabbbb-0000-cccc-1111-dddd2222eeee",
  "extension_Status": "pending",
  "extension_Role": "user",
  "extension_Username": null,
  "extension_ContainerPort": null
}
```

#### Claim-by-Claim Reference

| Claim | Example Value | Purpose | Where It Appears in Azure Portal / Provider UI |
|-------|---------------|---------|------------------------------------------------|
| `iss` | `https://teamhitorib2c.b2clogin.com/tfp/.../v2.0/` | **Issuer** — identifies the Authorization Server that created this token. OAuth2-Proxy compares this to `--oidc-issuer-url` during validation. | **User flows → Properties → Token compatibility settings → Issuer (iss) claim**. You choose between the default format and the `/tfp/` format here. |
| `sub` | `aaaabbbb-0000-...` | **Subject** — the unique identifier for this user within B2C. Equals the user's Object ID. | **User flows → Properties → Token compatibility settings → Subject (sub) claim** (set to ObjectID). Also visible under **Users → [user] → Object ID**. |
| `aud` | `12345678-abcd-...` | **Audience** — the Application (client) ID of the app this token was issued for. OAuth2-Proxy verifies this matches its own Client ID. | **App registrations → [your app] → Overview → Application (client) ID**. |
| `exp` | `1738535543` | **Expiration** — Unix timestamp after which this token is invalid. OAuth2-Proxy rejects expired tokens automatically. | **User flows → Properties → Token lifetime → Access & ID token lifetimes** (default: 60 minutes). |
| `iat` | `1738531943` | **Issued At** — Unix timestamp when this token was created. Used for token age validation. | Not directly configurable — set automatically by B2C at issuance time. |
| `nbf` | `1738531943` | **Not Before** — Unix timestamp before which this token must not be accepted. Typically equals `iat`. | Not configurable — set automatically by B2C.. |
| `auth_time` | `1738531940` | **Authentication Time** — Unix timestamp when the user actually entered credentials. May differ from `iat` if a cached SSO session was used. | Not configurable — populated by B2C based on when interactive auth occurred. |
| `nonce` | `"defaultNonce_abc123"` | **Nonce** — a random value sent in the auth request, echoed back in the token. Prevents token replay attacks. OAuth2-Proxy generates and verifies this automatically. | Sent as a query parameter to the `/authorize` endpoint. Not configurable in the portal UI. |
| `acr` | `"b2c_1_signupsignin_google"` | **Authentication Context Reference** — the user flow that issued this token. Can be used to determine which discovery document to fetch for validation. | Reflects the user flow name, visible under **User flows** in the B2C blade. |
| `tfp` | `"b2c_1_signupsignin_google"` | **Trust Framework Policy** — B2C-specific claim, same value as `acr`. Identifies the user flow or custom policy. Present in the `/tfp/` issuer format. | Same as `acr` — corresponds to the user flow under **User flows** in the B2C blade. |
| `name` | `"Reuben Smith"` | **Display Name** — the user's full display name. | Configured as a return claim under **User flows → [flow] → Application claims → Display Name**. The value itself comes from the social IdP or is entered during sign-up. Visible under **Users → [user] → Display name**. |
| `given_name` | `"Reuben"` | **Given (First) Name** — from the social IdP or sign-up form. | **User flows → Application claims → Given Name**. Stored in B2C under **Users → [user] → Properties → First name**. |
| `family_name` | `"Smith"` | **Surname (Last Name)** — from the social IdP or sign-up form. | **User flows → Application claims → Surname**. Stored under **Users → [user] → Properties → Last name**. |
| `emails` | `["reuben@example.com"]` | **Email Addresses** — always an **array** (not a string), even for a single email. This is a B2C convention that differs from standard OIDC's `email` claim. | **User flows → Application claims → Email Addresses**. The email comes from the social IdP (e.g., Google account email). Visible under **Users → [user] → Email**. |
| `idp` | `"google.com"` | **Identity Provider** — which social IdP the user authenticated with (e.g., `google.com`, `github.com`, `live.com`). | **User flows → Application claims → Identity Provider**. Configured under **Identity providers** blade. |
| `oid` | `"aaaabbbb-0000-..."` | **Object ID** — the user's unique directory object ID. Same value as `sub` when the user flow is configured with Subject = ObjectID. Used by Graph API to manage the user. | **Users → [user] → Object ID**. |
| `extension_Status` | `"pending"` | **Custom attribute** — user approval status (`pending`, `approved`, `rejected`). Set server-side via Graph API. | Created under **User attributes** blade. Returns via **User flows → Application claims**. In Graph API, the full property name includes the extensions app prefix: `extension_3575970a911e4699ad1ccc1a507d2312_Status`. In the token, B2C shortens it to `extension_Status`. |
| `extension_Role` | `"user"` | **Custom attribute** — user role (`user`, `admin`). Set server-side via Graph API. | Same as Status — created under **User attributes**, returned via **Application claims**. |
| `extension_Username` | `null` | **Custom attribute** — assigned username. Set by admin after approval. `null` for unapproved users (may be omitted from the token entirely). | Same pattern. |
| `extension_ContainerPort` | `null` | **Custom attribute** — assigned Docker container port. Used internally, typically NOT returned as a claim (kept out of Application claims for security). | Created under **User attributes** but intentionally not checked in **Application claims**. Managed exclusively via Graph API. |

> **Important notes:**
> - Claims with `null` values may be **omitted entirely** from the token (B2C skips null claims rather than including them as `null`).
> - Extension attributes appear in the token with the short form `extension_AttributeName`, but in Graph API calls you must use the full form `extension_3575970a911e4699ad1ccc1a507d2312_AttributeName`.
> - The `emails` claim is always an **array** — this is a B2C convention, not standard OIDC. Your code should always access `emails[0]`, not `email`.

### Generic OIDC Identity Providers in B2C

Beyond the pre-built social provider integrations (Google, GitHub, Microsoft Account), Azure AD B2C supports **any standards-compliant OpenID Connect provider** as an identity provider via the **"OpenID Connect"** option.

#### How to add a Generic OIDC Provider

1. **Azure AD B2C** → **Identity providers** → **New OpenID Connect provider**
2. Configure:
   - **Name:** Display name for the provider (shown on the sign-in page button)
   - **Metadata URL:** The provider's `/.well-known/openid-configuration` endpoint — B2C reads this to discover endpoints, signing keys, and supported features automatically
   - **Client ID:** Application ID registered with the external provider
   - **Client secret:** Secret from the external provider
   - **Scope:** `openid profile` (minimum — may add `email` or provider-specific scopes)
   - **Response type:** `code` (Authorization Code flow — recommended) or `id_token` (implicit — not recommended)
   - **Response mode:** `form_post` (recommended) or `query`
   - **Domain hint:** Optional string to skip IdP selection and go directly to this provider
3. **Claims mapping** — map the external provider's claims to B2C's internal schema:
   - **User ID:** The claim that uniquely identifies the user (typically `sub`)
   - **Display name:** e.g., `name`
   - **Given name:** e.g., `given_name`
   - **Surname:** e.g., `family_name`
   - **Email:** e.g., `email`

#### How it differs from pre-built providers

| Aspect | Pre-built (Google, GitHub) | Generic OIDC |
|--------|---------------------------|--------------|
| **Configuration** | Client ID + Secret only | Client ID + Secret + Metadata URL + Claims mapping |
| **Endpoint discovery** | Automatic (hardcoded) | Via metadata URL |
| **Claims mapping** | Automatic | Manual — you specify which claims map to B2C fields |
| **IdP-specific features** | Google-specific scopes, profile pictures, etc. | Only standard OIDC claims |
| **Setup complexity** | Low | Medium |

This is relevant to pocket-smyth-portal because it means we could add **any OIDC-compliant identity provider** (corporate SSO, Okta, Auth0, Keycloak, etc.) as a sign-in option without changing our OAuth2-Proxy or portal code — only B2C configuration changes.

---

## Token Types

| Token | Format | Purpose | Lifetime (default) |
|-------|--------|---------|-------------------|
| **ID Token** | JWT (signed, not encrypted) | Identifies the user | 60 minutes |
| **Access Token** | JWT (signed, not encrypted) | Authorizes API access | 60 minutes |
| **Refresh Token** | Opaque string | Obtains new ID/access tokens without re-login | 14 days |

### Token Lifetime Configuration

Token lifetimes are configurable per user flow in Azure Portal:
- Access & ID token lifetime: 5–1440 minutes (default: 60)
- Refresh token lifetime: 1–90 days (default: 14)
- Sliding window: 1–365 days or no expiry (default: 90 days)

---

## How Social Identity Providers Fit In

When a user clicks "Sign in with Google" on the B2C login page:

```
┌──────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐
│  Browser │────>│  Azure AD  │────>│   Google   │────>│  Azure AD│
│          │     │  B2C       │     │  (IdP)     │     │  B2C     │
│          │<────│            │<────│            │<────│          │
└──────────┘     └────────────┘     └────────────┘     └──────────┘
      │                                                       │
      │          B2C issues its own tokens                    │
      │<──────────────────────────────────────────────────────│
```

1. B2C **redirects the browser** to Google's authorization endpoint
2. User authenticates with Google and consents
3. Google redirects back to B2C with an authorization code
4. B2C exchanges that code with Google for tokens
5. B2C **reads claims from Google's token** (name, email, etc.)
6. B2C creates or links a local user account
7. B2C **issues its own tokens** (ID + access + refresh) to the client

**Important:** Your application (OAuth2-Proxy) **never talks to Google directly**. B2C acts as the intermediary. The tokens your app receives are always B2C tokens, regardless of which social provider the user chose.

---

## The Issuer URL — Anatomy

The **OIDC Issuer URL** is the single most important URL in the entire auth configuration. It is:

1. **The identity of the Authorization Server** — the base URL that uniquely identifies who issued a token
2. **The value of the `iss` claim** in every ID token and access token (see the JWT reference above — the `iss` claim in the token must match this URL exactly, or validation fails)
3. **The discovery entry point** — OAuth2-Proxy appends `/.well-known/openid-configuration` to this URL to discover all other endpoints (authorize, token, JWKS, etc.)
4. **The `--oidc-issuer-url` flag** passed to OAuth2-Proxy in our Docker Compose configuration

In Azure AD B2C, each user flow has its own issuer URL (unlike standard Microsoft Entra ID where one issuer covers all apps). Our issuer URL for the `b2c_1_signupsignin_google` user flow is:

```
https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/
```

Breaking it down:

| Segment | Meaning |
|---------|---------|
| `teamhitorib2c.b2clogin.com` | B2C login endpoint (tenant name prefix) |
| `/tfp/` | "Trust Framework Policy" — indicates a user flow/custom policy URL format |
| `359dc45f-...` | Tenant ID (directory GUID) |
| `b2c_1_signupsignin_google` | User flow policy name |
| `/v2.0/` | Token version |

> **Note:** B2C supports two issuer URL formats. The `/tfp/` format includes the policy name in the issuer claim, making it possible to validate which policy issued a token. This is the format configured in our OAuth2-Proxy.

---

## Scopes We Request

| Scope | Purpose | Required? |
|-------|---------|-----------|
| `openid` | Returns an ID token with user identity claims | Yes |
| `offline_access` | Returns a refresh token for silent token renewal | Yes |

We do **not** request Microsoft Graph scopes (like `User.Read`) through the user-facing flow. Graph API access uses a separate **Client Credentials** flow with the Graph API app registration.

---

## JWT Structure

Every JWT has three base64url-encoded parts separated by dots:

```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature
│                      │                              │
│  Header              │  Payload (Claims)            │  Signature
│  {                   │  {                           │
│    "alg": "RS256",   │    "sub": "...",             │  RSASHA256(
│    "kid": "key-id"   │    "iss": "...",             │    header + "." + payload,
│  }                   │    "exp": 1234567890         │    publicKey
│                      │  }                           │  )
```

**Validation steps** (performed by OAuth2-Proxy automatically):
1. Decode the header → find `kid` (key ID)
2. Fetch the public key from B2C's JWKS endpoint (`jwks_uri` in discovery doc)
3. Verify the signature using RSA-256
4. Check `exp` (not expired), `nbf` (not before), `iss` (correct issuer), `aud` (correct audience)

---

## How This All Fits in pocket-smyth-portal

```
                          ┌─────────────────────────────────┐
                          │          Azure AD B2C           │
                          │  (Authorization Server / IdP)   │
                          │                                 │
                          │  ┌───────┐ ┌───────┐ ┌────────┐ │
                          │  │Google │ │GitHub │ │  MSA   │ │
                          │  │(IdP)  │ │(IdP)  │ │ (IdP)  │ │
                          │  └───────┘ └───────┘ └────────┘ │
                          └────────────┬────────────────────┘
                                       │ OIDC
                                       │
┌──────────┐   HTTP    ┌──────────────┐│    ┌───────────────┐
│  Browser │──────────>│ OAuth2-Proxy ││───>│  Portal       │
│  (User)  │<──────────│ (Client)     ││    │  (Next.js)    │
│          │  cookie   │ Port 4180    ││    │  Port 3000    │
└──────────┘           └──────────────┘│    └───────┬───────┘
                                       │            │
                                       │            │ Internal HTTP
                                       │            │ (Bearer token)
                                       │    ┌───────┴───────┐
                                       │    │  Admin Agent  │
                                       │    │  (Hono)       │
                                       │    │  Port 8080    │
                                       │    └───────────────┘
```

**Auth flow summary:**
1. OAuth2-Proxy intercepts all requests on port 4180
2. Unauthenticated users are redirected to B2C (OIDC Authorization Code flow)
3. After authentication, OAuth2-Proxy sets an encrypted session cookie
4. Authenticated requests are proxied to Portal (port 3000) with `X-Auth-Request-Access-Token` header
5. Portal reads claims from the access token to identify the user
6. Portal calls Admin Agent over internal HTTP with a shared Bearer secret

---

## Further Reading

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [Azure AD B2C Protocols Overview](https://learn.microsoft.com/en-us/azure/active-directory-b2c/protocols-overview)
- [Azure AD B2C Tokens Overview](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview)
- [OAuth2-Proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
