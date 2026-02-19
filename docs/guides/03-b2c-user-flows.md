# Azure AD B2C — User Flows Guide

What user flows are, how they work, and how to configure them for pocket-smyth-portal.

---

## What Is a User Flow?

A **user flow** is a predefined, configurable policy in Azure AD B2C that defines the end-to-end user experience for identity tasks like:

- **Sign-up and sign-in** (combined)
- **Profile editing**
- **Password reset**

User flows are the simpler alternative to custom policies (XML-based). For pocket-smyth-portal, user flows are sufficient — we do not need custom policies.

When your application sends a user to B2C for authentication, it specifies **which user flow** to use. The user flow determines:
- Which identity providers are available (Google, GitHub, Microsoft, etc.)
- What information is collected during sign-up (attributes)
- What claims appear in the returned token
- The look and feel of the sign-in/sign-up pages
- MFA requirements
- Session behavior

---

## Our User Flow

| Property | Value |
|----------|-------|
| **Name** | `b2c_1_signupsignin_google` |
| **Type** | Sign up and sign in (recommended) |
| **Version** | Recommended |
| **Identity Providers** | Google (initially), + GitHub and Microsoft later |

The `b2c_1_` prefix is automatically added by Azure when you create a user flow named `signupsignin_google`.

---

## User Flow Types

Azure AD B2C offers several user flow types:

| Type | Purpose | Our Usage |
|------|---------|-----------|
| **Sign up and sign in** | Combined registration + login | ✅ Primary flow |
| **Sign in** | Login only (no registration) | ❌ Not used |
| **Sign up** | Registration only | ❌ Not used |
| **Profile editing** | Let users update their profile | ⬜ Future (Phase 4+) |
| **Password reset** | Self-service password reset | ❌ Not needed (social IdPs only) |

### Recommended vs. Standard vs. Legacy

When creating a user flow, Azure offers version choices:

| Version | Recommendation |
|---------|---------------|
| **Recommended** | ✅ Use this — latest features, will receive updates |
| **Standard** | Older preset, still supported |
| **Legacy** | Deprecated — do not use for new flows |

Always choose **Recommended**.

---

## Creating a Sign-up/Sign-in User Flow

### Step 1 — Navigate

1. Azure Portal → **Azure AD B2C** → **User flows**
2. Click **New user flow**
3. Select **Sign up and sign in**
4. Select **Recommended** version
5. Click **Create**

### Step 2 — Basic Settings

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `signupsignin_google` | Will become `b2c_1_signupsignin_google` |
| **Identity providers — Local accounts** | None | We use social IdPs only |
| **Identity providers — Social** | Select configured IdPs (Google, GitHub, etc.) | Must be configured first under Identity providers |

### Step 3 — Multifactor Authentication

| Setting | Recommendation |
|---------|---------------|
| **MFA method** | Leave as default (not enforced) |
| **MFA enforcement** | Disabled for MVP |

MFA can be enabled later if needed.

### Step 4 — Conditional Access

Leave disabled for MVP. Conditional Access policies can restrict sign-in based on location, device, risk level, etc.

### Step 5 — User Attributes and Token Claims

This is critical. You choose two things:

1. **Collect attribute** — what to ask users during sign-up
2. **Return claim** — what to include in the token after authentication

#### Recommended Configuration

| Attribute | Collect (Sign-up) | Return (Claim) | Notes |
|-----------|-------------------|----------------|-------|
| Display Name | ✅ | ✅ | User's chosen display name |
| Email Addresses | ❌ (auto from IdP) | ✅ | Comes from social IdP |
| Given Name | ✅ | ✅ | First name |
| Surname | ✅ | ✅ | Last name |
| Identity Provider | ❌ | ✅ | Shows which IdP was used |
| Identity Provider Access Token | ❌ | ❌ | Not needed |
| User's Object ID | ❌ | ✅ | Unique user ID in B2C |

#### Custom Attributes

Custom attributes you've created (see [05-b2c-attributes.md](05-b2c-attributes.md)) also appear here:

| Custom Attribute | Collect | Return | Notes |
|-----------------|---------|--------|-------|
| Status | ❌ | ✅ | Set server-side (default: "pending") |
| Role | ❌ | ✅ | Set server-side (default: "user") |
| Username | ❌ | ✅ | Set server-side after admin approval |
| ContainerPort | ❌ | ❌ | Internal — no need in token |

> **Key insight:** Custom attributes like Status, Role, and Username are NOT collected during sign-up. They are set server-side via the Graph API after admin approval. But they ARE returned as claims so the portal can read them from the token.

### Step 6 — Create

Click **Create**. The user flow is now available.

---

## User Flow Properties (Post-Creation)

After creating the flow, you can configure additional properties:

### Properties Page

| Setting | Default | Recommendation |
|---------|---------|---------------|
| Token lifetime | 60 min | Keep default for dev |
| Token compatibility — Issuer (iss) claim | `https://<domain>/{tenant}/v2.0/` | Use `/tfp/` format for policy-aware issuer |
| Token compatibility — Subject (sub) claim | ObjectID | Keep as ObjectID |
| Single sign-on — Scope | Tenant | Keep default |
| Session behavior | Browser session | Keep default |

### Token Compatibility — Issuer Claim Format

This is **important** for OAuth2-Proxy configuration:

| Format | Issuer Claim Value |
|--------|--------------------|
| Default | `https://teamhitorib2c.b2clogin.com/359dc45f-49b6-4472-92f1-092556a84a98/v2.0/` |
| With `/tfp/` | `https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/` |

The `/tfp/` format includes the policy name, which is what our OAuth2-Proxy is configured to use. **Make sure the issuer URL in `.env` matches exactly.**

---

## How User Flows Integrate with OAuth2-Proxy

OAuth2-Proxy discovers the user flow endpoints automatically via the OIDC discovery document:

```
OIDC Issuer URL in .env:
  https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/

OAuth2-Proxy fetches:
  {issuer}/.well-known/openid-configuration

Which returns (complete, live response from our tenant):
  {
    "issuer": "https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/",
    "authorization_endpoint": "https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/authorize",
    "token_endpoint": "https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/token",
    "end_session_endpoint": "https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/logout",
    "jwks_uri": "https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/discovery/v2.0/keys",
    "response_modes_supported": ["query", "fragment", "form_post"],
    "response_types_supported": [
      "code",
      "code id_token",
      "code token",
      "code id_token token",
      "id_token",
      "id_token token",
      "token",
      "token id_token"
    ],
    "scopes_supported": ["openid"],
    "subject_types_supported": ["pairwise"],
    "id_token_signing_alg_values_supported": ["RS256"],
    "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
    "claims_supported": [
      "name", "emails", "given_name", "idp", "family_name",
      "oid", "sub",
      "extension_Status", "extension_Role",
      "extension_ContainerPort", "extension_Username",
      "tfp", "iss", "iat", "exp", "aud", "acr", "nonce", "auth_time"
    ]
  }
```

**Field-by-field explanation:**

| Field | Purpose | How OAuth2-Proxy Uses It |
|-------|---------|--------------------------|
| `issuer` | The canonical identifier for this Authorization Server + user flow. Must match the `iss` claim in tokens. | Compared against `--oidc-issuer-url` to verify tokens came from the expected source. |
| `authorization_endpoint` | URL where OAuth2-Proxy redirects the browser to start sign-in. | Used to construct the `/authorize` redirect with `client_id`, `scope`, `state`, `nonce`, etc. |
| `token_endpoint` | URL where OAuth2-Proxy exchanges the authorization code for tokens (server-to-server). | POST request with `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`. |
| `end_session_endpoint` | URL to sign the user out of B2C and clear SSO cookies. | Used when OAuth2-Proxy handles sign-out (`/oauth2/sign_out`). |
| `jwks_uri` | URL hosting the RSA public keys used to sign tokens. | OAuth2-Proxy fetches these keys to verify token signatures (RS256). Keys are identified by `kid` in the JWT header. |
| `response_modes_supported` | How B2C can return responses: `query` (URL params), `fragment` (URL hash), `form_post` (hidden form POST). | OAuth2-Proxy uses `query` for authorization code flow (code in URL query string). |
| `response_types_supported` | What B2C can return from the authorize endpoint: authorization codes, tokens, or combinations. | OAuth2-Proxy requests `response_type=code` (Authorization Code flow). `id_token` is used by "Run user flow" (implicit). |
| `scopes_supported` | Which scopes B2C accepts. Only `openid` is listed — B2C doesn't use custom API scopes like standard Entra ID. | OAuth2-Proxy sends `scope=openid offline_access` (offline_access is always accepted even if not listed). |
| `subject_types_supported` | `pairwise` means the `sub` claim is specific to each app — a user gets a different `sub` for different app registrations. | OAuth2-Proxy uses `sub` (or `oid`) for user identification. |
| `id_token_signing_alg_values_supported` | Tokens are signed with RS256 (RSA + SHA-256). | OAuth2-Proxy uses this to select the correct verification algorithm. |
| `token_endpoint_auth_methods_supported` | How the client authenticates to the token endpoint: `client_secret_post` (secret in body) or `client_secret_basic` (secret in Authorization header). | OAuth2-Proxy sends `client_id` + `client_secret` in the POST body (`client_secret_post`). |
| `claims_supported` | All claims B2C can include in tokens for this user flow, including standard OIDC claims and our custom extension attributes. | Informational — OAuth2-Proxy reads claims from the actual token, but this list lets you verify your custom attributes are registered. |

OAuth2-Proxy uses these endpoints to:
1. Redirect users to `authorization_endpoint` for sign-in
2. Exchange authorization codes at `token_endpoint`
3. Validate token signatures using keys from `jwks_uri`

---

## Testing a User Flow

### Method 1: "Run user flow" in Azure Portal

1. Go to **User flows** → select your flow
2. Click **Run user flow**
3. **Application:** Select your registered app (e.g., `pocket-smyth-portal-dev`)
4. **Reply URL:** Select `https://jwt.ms` (or your app's callback)
5. Click **Run user flow**

> ⚠️ **Prerequisite:** The app must have **Implicit grant** enabled (both Access tokens and ID tokens) in the Authentication blade. If the app doesn't appear in the dropdown, this is the fix.

The browser opens the B2C sign-in page. After authentication, you're redirected to `jwt.ms` which displays the decoded token.

### Method 2: End-to-End with OAuth2-Proxy

```bash
docker compose up
# Navigate to http://localhost:4180
# Should redirect to B2C sign-in page
# After sign-in, should redirect back to portal
```

---

## Multiple User Flows

You can create multiple user flows for different scenarios. Each flow has its own OIDC endpoints. To use a different flow, you'd change the OIDC issuer URL.

For pocket-smyth-portal, a single sign-up/sign-in flow is sufficient for MVP. Future flows might include:
- `b2c_1_profileedit` — for profile editing
- `b2c_1_signupsignin_all` — with all social IdPs enabled (once GitHub and Microsoft are added)

---

## User Flow vs. Custom Policy — When to Upgrade

| Need | User Flow | Custom Policy |
|------|-----------|---------------|
| Social sign-in | ✅ | ✅ |
| Custom attributes | ✅ | ✅ |
| Custom UI (HTML/CSS) | ✅ | ✅ |
| REST API integration during sign-up | ❌ | ✅ |
| Conditional logic in sign-up flow | ❌ | ✅ |
| Multi-step verification | ❌ | ✅ |
| Call external services during auth | ❌ | ✅ |

For pocket-smyth-portal, user flows are enough. We handle all business logic (approval, username assignment, container provisioning) through API Routes after the user has authenticated, not during the auth flow itself.

---

## Further Reading

- [User flows and custom policies overview](https://learn.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview)
- [Tutorial: Create user flows in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tutorial-create-user-flows)
- [User flow versions in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/user-flow-versions)
- [Configure token behavior](https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-tokens)
