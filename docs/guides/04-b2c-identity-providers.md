# Azure AD B2C — Identity Providers (GitHub, Google, Microsoft)

How to configure social identity providers so users can sign in with their existing accounts.

---

## How Social Identity Providers Work in B2C

Azure AD B2C acts as an **identity broker** — it doesn't store passwords for social accounts. Instead, it delegates authentication to external identity providers (IdPs) and then issues its own tokens.

```
┌────────────┐     ┌────────────────┐     ┌─────────────────┐
│  User's     │     │  Azure AD B2C  │     │  Social IdP     │
│  Browser    │     │  (Broker)      │     │  (Google/GitHub/ │
│             │     │                │     │   Microsoft)     │
│  1. Click   │────>│ 2. Redirect    │────>│ 3. Login page   │
│  "Sign in   │     │    to IdP      │     │                 │
│  with       │     │                │     │ 4. User enters  │
│  Google"    │     │                │     │    credentials  │
│             │     │                │     │                 │
│             │     │ 6. Receive     │<────│ 5. Return code  │
│             │     │    IdP token   │     │    to B2C       │
│             │     │                │     │                 │
│  8. Receive │<────│ 7. Issue B2C   │     │                 │
│  B2C token  │     │    tokens      │     │                 │
└────────────┘     └────────────────┘     └─────────────────┘
```

**Each IdP requires:**
1. An OAuth application registered with the IdP (Google Console, GitHub Developer, Azure Portal)
2. The IdP configured in Azure AD B2C with the Client ID and Client Secret from step 1
3. The IdP added to your user flow

---

## Redirect URI Pattern

All three IdPs use the same B2C redirect URI format. B2C handles the OAuth callback from each IdP:

```
https://<tenant-name>.b2clogin.com/<tenant-name>.onmicrosoft.com/oauth2/authresp
```

For our tenant:
```
https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/oauth2/authresp
```

This is the URI B2C gives each IdP to redirect back to after authentication. **This is NOT the same** as OAuth2-Proxy's callback URL (`/oauth2/callback`).

---

## 1. Google Identity Provider

### Step 1 — Create a Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **OAuth consent screen**
   - Select **External** → **Create**
   - Fill in:
     - **App name:** `pocket-smyth-portal` (or any name)
     - **User support email:** your email
     - **Authorized domains:** add `b2clogin.com`
     - **Developer contact email:** your email
   - Click **Save and Continue**
   - **Scopes:** Click **Save and Continue** (default scopes are fine)
   - **Test users:** Add your email if the app is in "Testing" status
   - Click **Back to Dashboard**

4. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**
   - **Application type:** Web application
   - **Name:** `B2C Login` (or any name)
   - **Authorized JavaScript origins:** `https://teamhitorib2c.b2clogin.com`
   - **Authorized redirect URIs:** `https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/oauth2/authresp`
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

### Step 2 — Configure Google in B2C

1. Azure Portal → **Azure AD B2C** → **Identity providers**
2. Select **Google**
3. Fill in:
   - **Name:** `Google`
   - **Client ID:** (from Google Console)
   - **Client secret:** (from Google Console)
4. Click **Save**

### Step 3 — Add to User Flow

1. **User flows** → select `b2c_1_signupsignin_google`
2. Click **Identity providers** (left menu)
3. Under **Social identity providers**, check **Google**
4. Click **Save**

### Google-Specific Notes

- **Publishing status:** If your Google OAuth app is in "Testing" mode, only users added as test users can sign in. Move to "Production" and verify to allow any Google user.
- **Web-view deprecation:** Google deprecated embedded web-view sign-in. B2C uses browser redirects, so this does not affect us.
- **Consent screen branding:** The consent screen users see is Google's, showing your app name and authorized domains.

---

## 2. GitHub Identity Provider

> **Note:** GitHub is in **public preview** in Azure AD B2C. It works but may have UI quirks.

### Step 1 — Create a GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** `pocket-smyth-portal-b2c`
   - **Homepage URL:** `https://teamhitori.com` (or your portal URL)
   - **Authorization callback URL:** `https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/oauth2/authresp`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** → copy the secret

### Step 2 — Configure GitHub in B2C

1. Azure Portal → **Azure AD B2C** → **Identity providers**
2. Select **GitHub (Preview)**
3. Fill in:
   - **Name:** `GitHub`
   - **Client ID:** (from GitHub)
   - **Client secret:** (from GitHub)
4. Click **Save**

### Step 3 — Add to User Flow

1. **User flows** → select your flow
2. **Identity providers** → check **GitHub**
3. Click **Save**

### GitHub-Specific Notes

- **Preview status:** GitHub IdP is labeled "(Preview)" in the Azure portal. It's functional but Microsoft considers it not yet GA.
- **User data:** GitHub provides email, name, and avatar URL. B2C maps these to standard claims.
- **Private emails:** If a GitHub user has a private email, B2C may not receive an email claim. Ensure your app handles missing email gracefully.
- **Organization restrictions:** GitHub OAuth apps can be restricted by organization. If a user belongs to an org that blocks third-party OAuth, they may not be able to sign in.

---

## 3. Microsoft Account (Personal) Identity Provider

This allows sign-in with personal Microsoft accounts (Outlook.com, Hotmail, Xbox Live, etc.) — **not** work/school accounts.

### Step 1 — Create a Microsoft App Registration

> **Important:** This registration is created in the **Microsoft Entra ID (Azure AD)** portal, NOT in Azure AD B2C. It must be in the main Azure AD tenant.

1. Go to [Azure Portal](https://portal.azure.com/) → switch to your main **Microsoft Entra ID** tenant (not the B2C tenant)
2. **App registrations** → **New registration**
3. Fill in:
   - **Name:** `pocket-smyth-portal-msa`
   - **Supported account types:** **Personal Microsoft accounts only** (e.g. Skype, Xbox)
   - **Redirect URI:** Platform = *Web*, URI = `https://teamhitorib2c.b2clogin.com/teamhitorib2c.onmicrosoft.com/oauth2/authresp`
4. Click **Register**
5. Copy the **Application (client) ID**
6. Go to **Certificates & secrets** → **New client secret** → copy the Value

### Step 2 — Configure Microsoft in B2C

1. Switch back to your **B2C tenant**
2. **Azure AD B2C** → **Identity providers**
3. Select **Microsoft Account**
4. Fill in:
   - **Name:** `MSA`
   - **Client ID:** (from the Entra ID registration)
   - **Client secret:** (from the Entra ID registration)
5. Click **Save**

### Step 3 — Add to User Flow

1. **User flows** → select your flow
2. **Identity providers** → check **Microsoft Account**
3. Click **Save**

### Microsoft-Specific Notes

- **Two different portals:** The OAuth app for Microsoft Account is created in the **Entra ID** (Azure AD) portal under app registrations. The IdP configuration is done in the **B2C** portal. Don't confuse the two.
- **Account types matter:** You must select "Personal Microsoft accounts only" — not "Accounts in this organizational directory only".
- **Shared accounts:** If users sign in with both a personal Microsoft account and a Google account using the same email, B2C treats them as separate accounts unless you configure account linking.

---

## Comparison Table

| Feature | Google | GitHub | Microsoft |
|---------|--------|--------|-----------|
| **Where to register app** | Google Cloud Console | GitHub Developer Settings | Azure Portal (Entra ID) |
| **Preview status in B2C** | GA | Preview | GA |
| **Provides email** | Always | Sometimes (private email setting) | Always |
| **Provides name** | Always | Sometimes | Always |
| **Redirect URI target** | B2C `oauth2/authresp` | B2C `oauth2/authresp` | B2C `oauth2/authresp` |
| **MFA at IdP level** | Google's MFA | GitHub's 2FA | Microsoft's MFA |
| **Tenant for app** | Google Cloud project | GitHub account | Entra ID tenant (not B2C) |

---

## Verifying IdP Configuration

After adding an IdP to your user flow, test it:

### Quick Test (Azure Portal)

1. **User flows** → select flow → **Run user flow**
2. The sign-in page should show buttons for each configured IdP
3. Click the IdP button → authenticate → should redirect to `jwt.ms`
4. Verify the ID token contains expected claims

### End-to-End Test (Local)

```bash
docker compose up
# Navigate to http://localhost:4180
# B2C sign-in page should show all configured IdPs
# Sign in with each IdP and verify the portal loads
```

### What to Check in the Token

After a successful sign-in, the token should contain:

```json
{
  "idp": "google.com",          // or "github.com" or "live.com"
  "given_name": "Reuben",
  "family_name": "Smith",
  "emails": ["user@example.com"],
  "sub": "aaaabbbb-0000-cccc-1111-dddd2222eeee",
  "tfp": "b2c_1_signupsignin_google"
}
```

The `idp` claim tells you which provider was used. This can be useful for logging or analytics.

---

## Troubleshooting IdP Issues

| Issue | Possible Cause | Fix |
|-------|---------------|-----|
| IdP button doesn't appear on sign-in page | IdP not added to the user flow | Add under User flows → Identity providers |
| "Error from identity provider" | Wrong callback URL in IdP config | Verify redirect URI matches exactly |
| "access_denied" from Google | User not added as test user (Testing mode) | Add user or publish app to Production |
| GitHub sign-in loops | Client secret expired or wrong | Regenerate secret in GitHub → update B2C |
| Microsoft sign-in fails with "wrong account type" | App registered with wrong account type | Must be "Personal Microsoft accounts only" |
| User signs in but no email in token | GitHub private email setting | Handle gracefully — `emails` array may be empty |

---

## Future: Adding More Identity Providers

Azure AD B2C supports many additional IdPs including:
- Apple
- Facebook
- Twitter
- LinkedIn
- Amazon
- Any generic OIDC provider
- Any generic SAML provider
- Any generic OAuth2 provider (via custom policies)

The process is always the same: register an app with the IdP, configure it in B2C, add it to the user flow.

---

## Further Reading

- [Set up sign-up and sign-in with Google](https://learn.microsoft.com/en-us/azure/active-directory-b2c/identity-provider-google)
- [Set up sign-up and sign-in with GitHub](https://learn.microsoft.com/en-us/azure/active-directory-b2c/identity-provider-github)
- [Set up sign-up and sign-in with Microsoft Account](https://learn.microsoft.com/en-us/azure/active-directory-b2c/identity-provider-microsoft-account)
- [Add an identity provider to Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/add-identity-provider)
