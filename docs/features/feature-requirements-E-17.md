# Feature Requirements — E-17: Lifecycle Email Notifications

> Close the communication gap in the user lifecycle — admins shouldn't have to check the portal constantly for new sign-ups, and users shouldn't be left wondering whether their account has been approved or revoked.

| Field | Value |
|-------|-------|
| **Epic** | E-17 |
| **Release** | R5 — Notifications & Email |
| **Status** | Backlog |

---

## Feature Summary

| ID | Title | Type | Priority | SP | Status |
|----|-------|------|----------|----|--------|
| E17-F01 | Email Service Integration | Non-Functional | Must | 5 | Backlog |
| E17-F02 | New User Notification to Admin | Functional | Must | 3 | Backlog |
| E17-F03 | Approval Confirmation to User | Functional | Must | 3 | Backlog |
| E17-F04 | Revocation Notice to User | Functional | Must | 3 | Backlog |

**Total Story Points: 14**

---

## Features

### E17-F01: Email Service Integration

| Field | Value |
|-------|-------|
| **ID** | E17-F01 |
| **Epic** | E-17 |
| **Release** | R5 |
| **Type** | Non-Functional |
| **Priority** | Must |
| **Story Points** | 5 |
| **Status** | Backlog |

**Description:**
As the portal backend, I want a configured email provider integrated into the API routes so that the system can send transactional emails at key lifecycle moments.

**Acceptance Criteria:**
- [ ] Email provider chosen and account provisioned (SendGrid or Azure Communication Services)
- [ ] API key or connection string stored in `.env` (not committed to repo)
- [ ] Reusable email service module in the portal codebase
- [ ] Email templates for each notification type (HTML + plain text fallback)
- [ ] Sender address configured (e.g., `noreply@teamhitori.com`)
- [ ] Email sending tested in both local dev and DEV environment
- [ ] Failures logged but do not block the triggering API operation (fire-and-forget with logging)

---

### E17-F02: New User Notification to Admin

| Field | Value |
|-------|-------|
| **ID** | E17-F02 |
| **Epic** | E-17 |
| **Release** | R5 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As an admin, I want to receive an email when a new user signs up so that I'm alerted to pending approvals without having to check the admin panel constantly.

**Acceptance Criteria:**
- [ ] Email sent to configured admin address(es) when a new user enters `status=pending`
- [ ] Email includes: user's display name, email address, sign-up date, identity provider
- [ ] Email includes a direct link to the admin pending queue (`{admin}.teamhitori.com/admin/pending`)
- [ ] Sent within 30 seconds of the sign-up event
- [ ] If email fails to send, the sign-up is not blocked (graceful degradation)

---

### E17-F03: Approval Confirmation to User

| Field | Value |
|-------|-------|
| **ID** | E17-F03 |
| **Epic** | E-17 |
| **Release** | R5 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a user whose account has just been approved, I want to receive an email so that I know I can log in and complete my onboarding setup.

**Acceptance Criteria:**
- [ ] Email sent to the user when admin changes their status from `pending` to `approved`
- [ ] Email includes: a welcome message, instructions to log in and complete onboarding
- [ ] Email includes a link to the login page (`login.teamhitori.com`)
- [ ] Sent immediately after the approval action
- [ ] If email fails, the approval action still succeeds

---

### E17-F04: Revocation Notice to User

| Field | Value |
|-------|-------|
| **ID** | E17-F04 |
| **Epic** | E-17 |
| **Release** | R5 |
| **Type** | Functional |
| **Priority** | Must |
| **Story Points** | 3 |
| **Status** | Backlog |

**Description:**
As a user whose access has been revoked, I want to receive an email explaining what happened so that I'm not confused about why I can no longer access my agent.

**Acceptance Criteria:**
- [ ] Email sent to the user when admin changes their status to `revoked`
- [ ] Email includes: a clear explanation that access has been revoked, and a contact link for enquiries
- [ ] Tone is professional and non-confrontational
- [ ] Sent immediately after the revocation action
- [ ] If email fails, the revocation action still succeeds
