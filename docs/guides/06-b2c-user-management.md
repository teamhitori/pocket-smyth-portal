# Azure AD B2C — User Management & Sign-Up Behavior

What happens in B2C when users sign up, how to view and manage users, and what to expect.

---

## What Happens When a User Signs Up

When a new user clicks "Sign in with Google" (or another IdP) on the B2C sign-in page for the first time, the following occurs:

### Step-by-Step Flow

```
1. User clicks "Sign in with Google" on B2C page
   │
   ▼
2. B2C redirects to Google OAuth
   │
   ▼
3. User authenticates with Google (enters Google password, passes MFA, etc.)
   │
   ▼
4. Google returns user info (email, name) to B2C
   │
   ▼
5. B2C checks: does a user with this identity already exist?
   │
   ├── YES → Sign-in (skip to step 8)
   │
   └── NO → Sign-up flow begins
       │
       ▼
6. B2C shows sign-up form (collects attributes configured in user flow)
   - Display Name (pre-filled from Google if available)
   - Given Name (pre-filled from Google if available)  
   - Surname (pre-filled from Google if available)
   │
   ▼
7. B2C creates a new user object in the directory
   - Generates a unique objectId (GUID)
   - Links the Google identity to this user
   - Stores collected attributes
   - Auto-generates a userPrincipalName (cpim_{guid}@tenant.onmicrosoft.com)
   │
   ▼
8. B2C issues tokens (ID token, access token, refresh token)
   │
   ▼
9. Redirect back to OAuth2-Proxy callback with authorization code
   │
   ▼
10. OAuth2-Proxy exchanges code for tokens, sets session cookie
    │
    ▼
11. Portal reads token → sees no custom attributes (Status, Role, Username)
    │
    ▼
12. Portal detects first-time user → sets defaults via Graph API:
    - Status = "pending"
    - Role = "user"
    │
    ▼
13. Portal shows "pending approval" screen
```

### What the User Sees

1. **B2C Sign-In Page** — Shows configured IdP buttons (e.g., "Sign in with Google")
2. **Google Auth** — Google's login page (if not already signed in to Google)
3. **Sign-Up Form** — B2C asks for display name, first name, last name (can be pre-filled from IdP)
4. **Portal** — Shows the pending approval screen (or whatever UI the portal serves)

### What Appears in the B2C Directory

After sign-up, a user object is created with:

```json
{
  "objectId": "aaaa-bbbb-cccc-1111-dddd",
  "displayName": "Reuben Smith",
  "givenName": "Reuben",
  "surname": "Smith",
  "accountEnabled": true,
  "createdDateTime": "2025-02-17T15:30:00Z",
  "userPrincipalName": "cpim_aaaa-bbbb-cccc-1111-dddd@teamhitorib2c.onmicrosoft.com",
  "identities": [
    {
      "signInType": "federated",
      "issuer": "google.com",
      "issuerAssignedId": "108234567890123456789"
    }
  ],
  "extension_3575970a911e4699ad1ccc1a507d2312_Status": null,
  "extension_3575970a911e4699ad1ccc1a507d2312_Role": null,
  "extension_3575970a911e4699ad1ccc1a507d2312_Username": null,
  "extension_3575970a911e4699ad1ccc1a507d2312_ContainerPort": null
}
```

> **Note:** Custom attributes are `null` initially. The portal's API sets Status and Role on first detection.

---

## Viewing Users in the Azure Portal

### Method 1: Azure AD B2C → Users

1. Azure Portal → **Azure AD B2C** → **Users**
2. Lists all users in the directory
3. Click a user to see their profile

#### What You See

| Field | Example |
|-------|---------|
| Display name | Reuben Smith |
| User type | Member |
| Identity issuer | google.com |
| Object ID | aaaa-bbbb-cccc-... |
| Account enabled | Yes |
| Created | 2/17/2025 |

#### What You DON'T See Here

Custom extension attributes are **not shown** in the portal's user profile view by default. To see them, use the Graph API or Graph Explorer.

### Method 2: Microsoft Graph Explorer

1. Go to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your B2C admin account
3. Run:

```http
GET https://graph.microsoft.com/v1.0/users/{objectId}
  ?$select=id,displayName,givenName,surname,identities,
           extension_3575970a911e4699ad1ccc1a507d2312_Status,
           extension_3575970a911e4699ad1ccc1a507d2312_Role,
           extension_3575970a911e4699ad1ccc1a507d2312_Username,
           extension_3575970a911e4699ad1ccc1a507d2312_ContainerPort
```

### Method 3: Azure CLI

```bash
az rest --method get \
  --url "https://graph.microsoft.com/v1.0/users/{objectId}?\$select=id,displayName,extension_3575970a911e4699ad1ccc1a507d2312_Status"
```

---

## User Identity Linking

B2C identifies users by their `identities` array. Each identity has:

| Property | Meaning |
|----------|---------|
| `signInType` | `federated` (social IdP) |
| `issuer` | The IdP domain: `google.com`, `github.com`, `live.com` |
| `issuerAssignedId` | The user's unique ID at the IdP |

### Same Email, Different IdPs = Different Users

If a user signs in with Google (`user@gmail.com`) and later with Microsoft Account (`user@gmail.com`), B2C creates **two separate user accounts** by default. They are linked by different `issuerAssignedId` values even if the email is the same.

This is by design — B2C does not automatically merge accounts with the same email across different IdPs. Account linking requires custom policies (not user flows).

---

## Managing Users via Graph API

### List All Users

```http
GET https://graph.microsoft.com/v1.0/users
  ?$select=id,displayName,mail,
           extension_3575970a911e4699ad1ccc1a507d2312_Status,
           extension_3575970a911e4699ad1ccc1a507d2312_Role
  &$orderby=createdDateTime desc
```

### Filter Users by Status

```http
GET https://graph.microsoft.com/v1.0/users
  ?$filter=extension_3575970a911e4699ad1ccc1a507d2312_Status eq 'pending'
  &$select=id,displayName,mail,
           extension_3575970a911e4699ad1ccc1a507d2312_Status
```

### Approve a User

```http
PATCH https://graph.microsoft.com/v1.0/users/{objectId}
Content-Type: application/json

{
  "extension_3575970a911e4699ad1ccc1a507d2312_Status": "approved",
  "extension_3575970a911e4699ad1ccc1a507d2312_Username": "reuben"
}
```

### Revoke a User

```http
PATCH https://graph.microsoft.com/v1.0/users/{objectId}
Content-Type: application/json

{
  "extension_3575970a911e4699ad1ccc1a507d2312_Status": "revoked"
}
```

### Disable a User Account

```http
PATCH https://graph.microsoft.com/v1.0/users/{objectId}
Content-Type: application/json

{
  "accountEnabled": false
}
```

### Delete a User

```http
DELETE https://graph.microsoft.com/v1.0/users/{objectId}
```

> ⚠️ **Warning:** Deletion is permanent (soft-deleted for 30 days, then hard-deleted). Use `accountEnabled: false` or `Status: "revoked"` for soft revocation instead.

---

## User Counts and Quotas

| Metric | Limit |
|--------|-------|
| Users per B2C tenant | Millions (no practical limit) |
| Custom attributes per user | 100 |
| Extensions app | 1 per tenant (auto-created) |
| Graph API rate limit | ~5 requests/second for B2C tenants |

---

## What to Expect During Development

### First User Sign-Up

When you first run `docker compose up` and sign in:

1. You'll see the B2C sign-in page
2. Sign in with Google (or another configured IdP)
3. B2C shows a sign-up form (since you're a new user)
4. Fill in name fields and submit
5. You'll be redirected back to the portal
6. The portal sees you as a new user with no custom attributes
7. Check B2C → Users to see your account

### Making Yourself Admin

Use Graph Explorer or `az rest` to set your attributes:

```http
PATCH https://graph.microsoft.com/v1.0/users/{your-object-id}
Content-Type: application/json

{
  "extension_3575970a911e4699ad1ccc1a507d2312_Status": "active",
  "extension_3575970a911e4699ad1ccc1a507d2312_Role": "admin",
  "extension_3575970a911e4699ad1ccc1a507d2312_Username": "reuben"
}
```

### Finding Your Object ID

1. Azure Portal → **Azure AD B2C** → **Users**
2. Click your user
3. Copy the **Object ID** from the profile page

Or from Graph Explorer:
```http
GET https://graph.microsoft.com/v1.0/me
```

---

## Token Refresh and Attribute Updates

When custom attributes are updated via Graph API, the change:
- **Does NOT** invalidate existing tokens
- **Will** appear in the next token issued (after the current token expires)
- Token lifetime is 60 minutes by default

This means after an admin approves a user:
1. The user's Status is updated in the directory immediately
2. But the user's current token still shows the old Status
3. When the token expires (or the user re-authenticates), the new Status appears

**Workaround:** The portal can call the Graph API directly to get current attribute values instead of relying solely on token claims. This is the recommended approach for real-time status checks.

---

## Further Reading

- [Manage Azure AD B2C user accounts with Microsoft Graph](https://learn.microsoft.com/en-us/azure/active-directory-b2c/microsoft-graph-operations)
- [User profile attributes](https://learn.microsoft.com/en-us/azure/active-directory-b2c/user-profile-attributes)
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
- [Microsoft Graph Users API reference](https://learn.microsoft.com/en-us/graph/api/resources/user)
