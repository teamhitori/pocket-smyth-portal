# Feature Requirements — E-10: User Onboarding & Dashboard

> Build the core user-facing experience — from the first moment a user lands after sign-up, through choosing their identity on the platform, to managing their AI agent day-to-day.

| Field | Value |
|-------|-------|
| **Epic** | E-10 |
| **Release** | R2 — Portal + Agent on DEV |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E10-F01 | Pending Approval Screen | Functional | Must | 2 | Backlog |
| E10-F02 | Access Revoked Screen | Functional | Must | 2 | Backlog |
| E10-F03 | Onboarding Wizard | Functional | Must | 8 | Backlog |
| E10-F04 | User Dashboard Shell | Functional | Must | 8 | Backlog |
| E10-F05 | Agent Status Panel | Functional | Must | 5 | Backlog |
| E10-F06 | User API Routes | Functional | Must | 8 | Backlog |
| E10-F07 | Post-Onboarding Redirect | Functional | Must | 3 | Backlog |

**Total Story Points: 36**

---

## Features

### E10-F01: Pending Approval Screen

| Field | Value |
|-------|-------|
| **ID** | E10-F01 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 2 |
| **Status** | Backlog |

**Description:**
As a new user who has just signed up, I want to see a clear "Awaiting Approval" screen so that I know my registration was received and an admin will review it.

**Acceptance Criteria:**
- [ ] Static page at `/pending` route
- [ ] Displays a friendly message explaining that the account is awaiting admin approval
- [ ] Includes the user's email or display name (from JWT) for personalisation
- [ ] No interactive elements beyond a logout link
- [ ] Styled consistently with the portal's visual language

---

### E10-F02: Access Revoked Screen

| Field | Value |
|-------|-------|
| **ID** | E10-F02 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 2 |
| **Status** | Backlog |

**Description:**
As a user whose access has been revoked, I want to see a clear notification explaining that my account is no longer active so that I understand why I can't access my agent.

**Acceptance Criteria:**
- [ ] Static page at `/revoked` route
- [ ] Displays a message explaining that access has been revoked
- [ ] Provides a contact or support link for appeals
- [ ] No access to dashboard, agent, or settings from this state
- [ ] Styled consistently with the portal's visual language

---

### E10-F03: Onboarding Wizard

| Field | Value |
|-------|-------|
| **ID** | E10-F03 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As an approved user logging in for the first time, I want to complete a guided setup wizard so that I can choose my username (which becomes my personal URL) and provide my phone number before my agent is provisioned.

**Acceptance Criteria:**
- [ ] Multi-step wizard at `/onboarding` route
- [ ] **Step 1 — Username:**
  - Input field for username selection
  - Real-time validation: alphanumeric + hyphens, 4–10 characters, lowercase
  - Reserved word check (blocks `admin`, `app`, `www`, `api`, `mail`, `portal`, `system`, `root`, `public`, `static`, `login`, `dev`)
  - Profanity filter applied
  - Uniqueness check via API call (debounced, shows availability inline)
- [ ] **Step 2 — Phone Number:**
  - Phone number input (mandatory, per AD-6)
  - Basic format validation
- [ ] **Step 3 — Confirmation:**
  - Summary of chosen username and phone number
  - Confirm button triggers `POST` to API route
- [ ] Clear error states for validation failures
- [ ] Loading/progress indicators during API calls
- [ ] Accessible (keyboard navigation, screen reader labels)

---

### E10-F04: User Dashboard Shell

| Field | Value |
|-------|-------|
| **ID** | E10-F04 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As an active user, I want a dashboard with clear navigation and agent controls so that I have a home base for monitoring and managing my AI agent.

**Acceptance Criteria:**
- [ ] Dashboard layout at `/` route on `{username}.*`
- [ ] **Header:** branding, user display name, logout action
- [ ] **Sidebar:** navigation links — Dashboard, Settings
- [ ] **Main content area:** agent status panel (see E10-F05), action buttons
- [ ] **Launch Agent button:** prominently placed, opens `{username}.teamhitori.com/agent/` in a new browser tab (per AD-2)
- [ ] **Status bar:** agent health indicator, uptime
- [ ] Responsive layout (desktop and tablet)
- [ ] Admin users see an additional "Admin" link in the sidebar (navigates to `/admin/*`)

---

### E10-F05: Agent Status Panel

| Field | Value |
|-------|-------|
| **ID** | E10-F05 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an active user, I want to see my agent's current status and resource usage in real time so that I know whether my agent is running and how much capacity it's using.

**Acceptance Criteria:**
- [ ] Displays agent state: Running, Stopped, Starting, Error
- [ ] Shows resource metrics: CPU usage (%), memory usage (MB)
- [ ] Shows uptime since last start
- [ ] Client-side polling of `GET /api/me/agent` every 10 seconds (per AD-1)
- [ ] Visual indicators (colour-coded status dot, progress bars for resources)
- [ ] Restart button triggers `POST /api/me/agent/restart` with confirmation dialog
- [ ] Graceful handling of agent unreachable states

---

### E10-F06: User API Routes

| Field | Value |
|-------|-------|
| **ID** | E10-F06 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 8 |
| **Status** | Backlog |

**Description:**
As a user, I want API endpoints that let me view my profile, check my agent's status, restart my agent, and update my settings so that the dashboard has a reliable backend for all self-service operations.

**Acceptance Criteria:**
- [ ] `GET /api/me` — returns current user info decoded from JWT + Graph API lookup
  - Response includes: display name, email, username, status, role
  - Accessible to any authenticated user
- [ ] `GET /api/me/agent` — returns agent container status
  - Response includes: state (running/stopped), CPU, memory, uptime
  - Calls Admin Agent internally (`GET /containers/:name/stats` on `portal-net`)
  - Returns a meaningful response even when the container doesn't exist yet
- [ ] `POST /api/me/agent/restart` — restarts the user's agent container
  - Calls Admin Agent internally (`POST /containers/:name/restart`)
  - Returns success/failure with descriptive message
  - Rate-limited to prevent abuse (at most once per 30 seconds)
- [ ] `PUT /api/me/settings` — updates user preferences
  - Accepts JSON body with updatable fields
  - Validates input server-side
  - Persists to B2C via Graph API
- [ ] All routes read JWT from `X-Auth-Request-Access-Token` header
- [ ] All routes return consistent JSON error responses with appropriate HTTP status codes
- [ ] All routes reject unauthenticated requests (missing/invalid JWT → 401)

---

### E10-F07: Post-Onboarding Redirect

| Field | Value |
|-------|-------|
| **ID** | E10-F07 |
| **Epic** | E-10 |
| **Release** | R2 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a user who has just completed onboarding, I want to be automatically redirected to my personal dashboard so that I immediately land on my new home at `{username}.teamhitori.com`.

**Acceptance Criteria:**
- [ ] After successful onboarding submission, user is redirected to `{username}.teamhitori.com`
- [ ] Redirect uses the username chosen during onboarding
- [ ] On DEV, redirect goes to `{username}.dev.teamhitori.com`
- [ ] On localhost, redirect goes to `localhost:4180` (no subdomain available locally)
- [ ] Redirect only occurs after the B2C status has been updated to `active` and the agent has been provisioned
- [ ] If provisioning fails, user sees an error message instead of a redirect
