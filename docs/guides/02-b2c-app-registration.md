# Azure AD B2C — App Registration Guide

Step-by-step guide for registering applications in Azure AD B2C for pocket-smyth-portal.

---

## Overview

pocket-smyth-portal requires **two** app registrations in Azure AD B2C:

| Registration | Purpose | Auth Flow |
|-------------|---------|-----------|
| **Portal Dev App** (`pocket-smyth-portal-dev`) | User-facing authentication via OAuth2-Proxy | Authorization Code (OIDC) |
| **Graph API App** | Server-side user management (read/write B2C users) | Client Credentials |

There is also a system-managed app (`b2c-extensions-app`) that stores custom attribute data — **do not modify it**.

---

## Prerequisites

- An Azure subscription
- An Azure AD B2C tenant (ours: `teamhitorib2c.onmicrosoft.com`, Tenant ID: `359dc45f-49b6-4472-92f1-092556a84a98`)
- Global Administrator or Application Administrator role on the B2C tenant

---

## Registration 1: Portal Dev App

This is the app that OAuth2-Proxy uses to authenticate users.

### Step 1 — Create the Registration

1. Sign in to the [Azure Portal](https://portal.azure.com/)
2. Switch to your B2C tenant: **Settings** (gear icon) → **Directories + subscriptions** → select `teamhitorib2c`
3. Search for **Azure AD B2C** → select it
4. Go to **App registrations** → **New registration**
5. Fill in:
   - **Name:** `pocket-smyth-portal-dev`
   - **Supported account types:** *Accounts in any identity provider or organizational directory (for authenticating users with user flows)*
   - **Redirect URI:** Platform = *Web*, URI = `http://localhost:4180/oauth2/callback`
6. Check **Grant admin consent to openid and offline_access permissions**
7. Click **Register**

### Step 2 — Record the Application (Client) ID

After registration, you'll be on the app's Overview page. Copy the **Application (client) ID** — this becomes `OAUTH2_PROXY_CLIENT_ID` in your `.env`.

### Step 3 — Create a Client Secret

1. In the left menu: **Certificates & secrets**
2. Click **New client secret**
3. Description: `dev-secret-1`
4. Expiry: Choose appropriate duration (e.g., 12 months for dev)
5. Click **Add**
6. **Immediately copy the Value** (it won't be shown again) — this becomes `OAUTH2_PROXY_CLIENT_SECRET` in your `.env`

> ⚠️ **Warning:** The secret value is only displayed once. If you navigate away before copying it, you must create a new secret.

### Step 4 — Enable Implicit Grant (for Testing Only)

This is required to use the "Run user flow" feature in the Azure Portal for testing.

1. Go to **Authentication** (left menu)
2. Under **Implicit grant and hybrid flows**, check both:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)
3. Click **Save**

> ⚠️ **Important:** Disable implicit grant before deploying to production. It is only needed for the portal's "Run user flow" test feature.

#### What Does Enabling Implicit Grant Actually Change?

By default, an Azure AD B2C app registration only supports the **Authorization Code flow** — the authorize endpoint will reject requests with `response_type=id_token` or `response_type=token` and return the error:

```
AADB2C90057: The provided application is not configured to allow the OAuth Implicit flow.
```

Enabling the implicit grant checkboxes tells B2C: *"This app is allowed to receive tokens directly from the `/authorize` endpoint without a server-side code exchange."*

| Checkbox | What It Allows |
|----------|----------------|
| **Access tokens** | The `/authorize` endpoint can return an `access_token` in the URL fragment (`response_type=token`) |
| **ID tokens** | The `/authorize` endpoint can return an `id_token` in the URL fragment (`response_type=id_token`) |

Both must be checked because "Run user flow" sends `response_type=id_token` and the Azure Portal expects both to be enabled.

#### How "Run User Flow" Uses Implicit Grant

When you click **"Run user flow"** in the Azure Portal, the portal constructs a URL like:

```
https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/b2c_1_signupsignin_google/oauth2/v2.0/authorize?
  client_id=<your-app-client-id>
  &response_type=id_token
  &redirect_uri=https://jwt.ms
  &response_mode=fragment
  &scope=openid
  &nonce=defaultNonce
```

Notice `response_type=id_token` — this is the **implicit flow**. Instead of returning an authorization code that gets exchanged server-side for tokens, B2C returns the **ID token directly in the URL fragment** of the redirect:

```
https://jwt.ms/#id_token=eyJhbGciOiJSUzI1NiIs...
```

This is convenient for testing because there's no server-side component — `jwt.ms` is a static page that reads the token from the URL fragment and displays its contents. But it bypasses the security of the Authorization Code flow entirely.

#### Why This Is a Production Risk

In the **Authorization Code flow** (what OAuth2-Proxy uses in production), tokens are exchanged server-side:

```
Browser → B2C: Give me an authorization code
B2C → Browser: Here's a code (in the URL query string)
Browser → OAuth2-Proxy: Here's the code
OAuth2-Proxy → B2C (server-to-server): Exchange this code + my client secret for tokens
B2C → OAuth2-Proxy: Here are the tokens
```

The tokens never appear in the browser URL, history, or referrer headers — they travel over a server-to-server TLS connection.

With **implicit grant enabled**, an attacker can craft a URL that sends `response_type=id_token` instead of `response_type=code`:

- Tokens appear directly in the browser's URL fragment
- URL fragments can leak through browser history, referrer headers, browser extensions, or shoulder surfing
- There is no `client_secret` required — anyone who knows the Client ID can request tokens
- No refresh tokens are issued in implicit flow, but captured ID/access tokens are valid until expiry (default 60 minutes)
- **RFC 9700 (OAuth 2.0 Security Best Current Practice, section 2.1.2)** explicitly recommends against using the implicit grant

> **Microsoft's official guidance (updated Jan 2026):** *"Microsoft recommends you do not use the implicit grant flow. The recommended way of supporting SPAs is OAuth 2.0 Authorization code flow (with PKCE)."*

#### Production Recommendation

Before deploying to production, disable implicit grant:

1. Go to **Authentication** → uncheck both implicit grant checkboxes → **Save**
2. For ongoing B2C testing without implicit grant, use the Authorization Code flow directly by running `docker compose up` and testing through OAuth2-Proxy

### Step 5 — Add Production Redirect URI

When deploying to production, add the production callback URL:

1. Go to **Authentication** (left menu)
2. Under **Web** → **Redirect URIs**, click **Add URI**
3. Add: `https://login.teamhitori.com/oauth2/callback`
4. Click **Save**

You can have multiple redirect URIs (localhost for dev, production domain for prod).

### Step 6 — Verify API Permissions

1. Go to **API permissions** (left menu)
2. You should see:
   - `openid` — Sign users in
   - `offline_access` — Maintain access to data you have given it access to
3. Both should show **Granted for [tenant]** in the Status column
4. If not granted, click **Grant admin consent for [tenant]**

> **Note:** You do NOT need to add Microsoft Graph permissions here. Graph API access uses a separate app registration with Client Credentials flow.

---

## Registration 2: Graph API App

This registration is used by the Portal's server-side code to manage B2C users via Microsoft Graph (list users, read/write custom attributes, approve/reject, etc.).

### Step 1 — Create the Registration

1. In Azure AD B2C → **App registrations** → **New registration**
2. Fill in:
   - **Name:** `pocket-smyth-portal-graph`
   - **Supported account types:** *Accounts in this organizational directory only*
   - **Redirect URI:** Leave blank (no user interaction — this is a daemon app)
3. Click **Register**

### Step 2 — Record IDs

- **Application (client) ID:** `6c50fb10-e1d2-4ca7-be00-6cb29b7f474b` → `B2C_GRAPH_CLIENT_ID` in `.env`
- **Directory (tenant) ID:** `359dc45f-49b6-4472-92f1-092556a84a98` → `B2C_TENANT_ID` in `.env`

### Step 3 — Create a Client Secret

1. **Certificates & secrets** → **New client secret**
2. Description: `graph-secret-1`
3. Copy the Value → `B2C_GRAPH_CLIENT_SECRET` in `.env`

### Step 4 — Add Graph API Permissions

1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Application permissions** (not Delegated)
3. Search for and add:
   - `User.ReadWrite.All` — Read and write all users' full profiles
   - `Directory.ReadWrite.All` — Read and write directory data (needed for extension attributes)
4. Click **Add permissions**
5. Click **Grant admin consent for [tenant]** (requires admin role)

> **Why Application permissions, not Delegated?** This app runs as a background service (daemon) without a signed-in user. Client Credentials flow only supports Application permissions.

### Step 5 — Verify Consent

After granting admin consent, the Status column for each permission should show a green checkmark with **Granted for teamhitorib2c**.

---

## The Extensions App (b2c-extensions-app)

Azure AD B2C automatically creates an app called:

```
b2c-extensions-app. Do not modify. Used by AADB2C for storing user data.
```

This app **owns all custom/extension attributes**. When you create a custom attribute in the B2C portal (e.g., "Status"), it is stored as a directory extension on this app.

### Finding the Extensions App ID

1. **App registrations** → **All applications**
2. Find `b2c-extensions-app...`
3. Note the **Application (client) ID** (without hyphens, this forms the extension attribute prefix)

For our tenant:
- Extensions App ID: `3575970a-911e-4699-ad1c-cc1a507d2312`
- Without hyphens: `3575970a911e4699ad1ccc1a507d2312`
- Extension prefix: `extension_3575970a911e4699ad1ccc1a507d2312_`

So a custom attribute named `Status` is stored in the directory as:
```
extension_3575970a911e4699ad1ccc1a507d2312_Status
```

---

## Environment Variables Reference

After completing both registrations, your `.env` should contain:

```bash
# Portal Dev App (OAuth2-Proxy)
OAUTH2_PROXY_CLIENT_ID=<Application (client) ID from portal dev app>
OAUTH2_PROXY_CLIENT_SECRET=<Client secret value from portal dev app>
OAUTH2_PROXY_COOKIE_SECRET=<32-byte random base64 string>

# B2C OIDC Configuration
B2C_OIDC_ISSUER_URL=https://teamhitorib2c.b2clogin.com/tfp/359dc45f-49b6-4472-92f1-092556a84a98/b2c_1_signupsignin_google/v2.0/

# Graph API App
B2C_TENANT_ID=359dc45f-49b6-4472-92f1-092556a84a98
B2C_GRAPH_CLIENT_ID=6c50fb10-e1d2-4ca7-be00-6cb29b7f474b
B2C_GRAPH_CLIENT_SECRET=<Client secret value from graph app>
```

### Generating the Cookie Secret

```bash
python3 -c 'import os,base64; print(base64.urlsafe_b64encode(os.urandom(32)).decode())'
# or
openssl rand -base64 32
```

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong "Supported account types" | Users can't sign up via social IdPs | Must be "Accounts in any identity provider or organizational directory" |
| Missing redirect URI | Error after B2C login: "redirect_uri does not match" | Add exact callback URL in Authentication blade |
| Case mismatch in redirect URI | Intermittent auth failures | Redirect URIs are case-sensitive — use lowercase |
| Implicit grant not enabled | "Run user flow" test in portal fails with AADB2C90057 | Enable both Access tokens and ID tokens under Implicit grant |
| Forgot to click Save | Changes don't take effect | Always click Save after modifying Authentication settings |
| Copied secret Description instead of Value | Auth fails with "invalid client secret" | Copy the Value column, not Description |
| Graph permissions not admin-consented | 403 errors when calling Graph API | Click "Grant admin consent for [tenant]" |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure AD B2C Tenant                         │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────┐              │
│  │ pocket-smyth-       │  │ pocket-smyth-        │              │
│  │ portal-dev          │  │ portal-graph         │              │
│  │                     │  │                      │              │
│  │ Type: Web App       │  │ Type: Daemon         │              │
│  │ Flow: Auth Code     │  │ Flow: Client Creds   │              │
│  │ Used by:            │  │ Used by:             │              │
│  │   OAuth2-Proxy      │  │   Portal API Routes  │              │
│  └─────────────────────┘  └──────────────────────┘              │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────┐              │
│  │ b2c-extensions-app  │  │ User Flows           │              │
│  │ (system-managed)    │  │ b2c_1_signupsignin_  │              │
│  │                     │  │ google               │              │
│  │ Owns extension      │  │                      │              │
│  │ attributes          │  │ Defines sign-in UX   │              │
│  └─────────────────────┘  └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Further Reading

- [Tutorial: Register a web application in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tutorial-register-applications)
- [Register a Microsoft Graph application](https://learn.microsoft.com/en-us/azure/active-directory-b2c/microsoft-graph-get-started)
- [Application types that can be used in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/application-types)
