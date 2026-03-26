# Feature Requirements — E-18: Admin Activity Dashboard

> Give admins at-a-glance visibility into platform activity — a pending count badge for urgency and a timeline of recent events so admins can stay on top of what's happening without digging through pages.

| Field | Value |
|-------|-------|
| **Epic** | E-18 |
| **Release** | R5 — Notifications & Email |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E18-F01 | Pending User Count Badge | Functional | Must | 2 | Backlog |
| E18-F02 | Recent Activity Feed | Functional | Should | 5 | Backlog |

**Total Story Points: 7**

---

## Features

### E18-F01: Pending User Count Badge

| Field | Value |
|-------|-------|
| **ID** | E18-F01 |
| **Epic** | E-18 |
| **Release** | R5 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 2 |
| **Status** | Backlog |

**Description:**
As an admin, I want to see a count of pending users on the admin navigation so that I know at a glance whether anyone is waiting for approval.

**Acceptance Criteria:**
- [ ] Pending count badge displayed next to the "Pending Users" sidebar link in the admin panel
- [ ] Count fetched on page load from `GET /api/users?status=pending` and computed client-side
- [ ] Badge updates automatically after approve/reject actions (no full page reload needed)
- [ ] Badge hidden when count is zero (clean UI when no actions needed)
- [ ] Count is visually prominent (coloured badge, e.g., red/orange with white text)

---

### E18-F02: Recent Activity Feed

| Field | Value |
|-------|-------|
| **ID** | E18-F02 |
| **Epic** | E-18 |
| **Release** | R5 |
| **Type** | Functional |
| **Priority** | Should |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As an admin, I want a chronological feed of recent platform activity on the admin dashboard so that I can see the timeline of sign-ups, approvals, and revocations without navigating to individual user records.

**Acceptance Criteria:**
- [ ] Activity feed displayed on the admin dashboard landing page (`/admin`)
- [ ] Shows lifecycle events: new sign-up, approval, rejection, revocation
- [ ] Each entry includes: event type, user display name, timestamp
- [ ] Events ordered newest first
- [ ] Shows the most recent 20 events by default
- [ ] Data sourced from B2C user records (derived from `createdDateTime` and status transitions)
- [ ] Note: MVP has no persistent event store, so the feed is reconstructed from current user state. Full event sourcing is a post-MVP enhancement.
