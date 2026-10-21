# Choir Manager Bible

> **Purpose of this document**
>
> This is the product constitution for Choir Manager.
> It explains what the app **is**, what it **is not**, what it **may become**, and what it **must never become**.
>
> Every contributor or AI working in this repository should read this file before making product, architecture, data-model, migration, or release decisions.
>
> **The Bible defines product truth.**  
> **[ROADMAP.md](./ROADMAP.md) defines sequence, status, and execution.**
>
> If implementation, a proposed feature, or the Roadmap conflicts with this document, stop and reconcile the conflict before proceeding.

---

## 1. North star

Choir Manager is a lightweight operational system for running a working choir.

It succeeds when a non-technical manager can open the app and confidently understand:

**what is happening, what needs attention, who is involved, and what to do next — without needing a spreadsheet, a developer, or a manual.**

The product should reduce dependence on:

- scattered spreadsheets
- WhatsApp-memory administration
- separate lists of singers, clients, and venues
- repeated manual lineup work
- one person remembering everything
- fragile handover between managers

The app should feel like a calm working tool, not enterprise software.

---

## 2. Who the product is for

The primary user is a **choir manager** operating real shows, rehearsals, recordings, and related work.

The current real pilot context is ELFE:

- **Roe Vincent** — business/workspace Owner
- **Philo** — Manager
- **Sheena** — Manager

Those names are the current client context, not hard-coded product limits.

The underlying model must allow:

- one person to have their own account
- one workspace to have multiple managers
- one person to belong to multiple workspaces
- roles to differ from workspace to workspace

A choir must never require people to share one password.

---

## 3. What Choir Manager is

Choir Manager is the operational source for:

- enquiries
- confirmed events
- event dates and times
- clients
- venues
- event types
- roster / singers
- singer tags and eligibility
- availability state
- lineups
- managers
- workspace ownership
- calendar / agenda views
- useful operational statistics
- simple safety exports

It should answer questions such as:

- What is coming up?
- Which enquiries still need action?
- Which confirmed events are understaffed?
- Who is assigned?
- Who is available or unavailable?
- How many singers are required?
- Which client and venue is this for?
- What is the budget?
- Which singers have been used recently?
- Who manages this workspace?
- Can the client keep an independent copy of their data?

---

## 4. What Choir Manager is not

Choir Manager is **not** currently intended to be:

- a payroll system
- an accounting package
- a full CRM
- a public booking marketplace
- a ticketing platform
- a singer social network
- a chat application
- a file-storage platform
- a Google Drive replacement
- an automated payment/disbursement system
- a generic ERP
- a generic project-management suite
- a feature-rich admin console for its own sake

A feature does not belong merely because a choir *could* use it.

It belongs only if it materially improves the choir manager's real operational workflow.

---

## 5. What the app can become

The product may grow where real usage proves value.

Reasonable future directions include:

- better singer rotation and fairness assistance
- richer but still operational statistics
- repeated-event workflow improvements
- better lineup reuse
- availability improvements
- carefully chosen notifications
- activity/history where accountability is useful
- stronger backup and restore tooling
- additional workspace roles if real operations require them
- owner/admin lifecycle improvements
- optional integrations that reduce repeated admin work
- singer self-service only if the product later justifies that larger workflow

These are possibilities, not automatic commitments.

Real user behaviour should promote features into the Roadmap.

---

## 6. What the app should never become

Unless the product is deliberately redefined by the owner of this project, Choir Manager should never become:

### A generic business suite
Do not bolt on accounting, HR, payroll, ticketing, CRM, chat, file storage, and project management until the product loses its focus.

### A spreadsheet with a prettier skin
The app should remove operational friction, not reproduce every cell and manual convention of an old spreadsheet.

### A system that requires technical knowledge
Firebase IDs, Firestore terminology, internal schema details, and deployment concepts do not belong in normal client-facing UX.

### A shared-login system
Each human gets their own account. Access comes from workspace membership.

### A black-box decision maker
If rotation, fairness, or suggestions are introduced, they should be explainable. Managers remain in control.

### A second source-of-truth maze
Firestore remains the live production source of truth. Exports are backups, not parallel databases.

### A product that sacrifices reliability for novelty
Data safety, access control, and predictable workflows outrank decorative features.

---

## 7. Product principles

### 7.1 Simplicity over completeness
A smaller obvious workflow is better than a powerful workflow that needs explanation.

### 7.2 Operational truth over decoration
Home, Calendar, Roster, Events, Team, and Statistics should surface useful operational truth first.

### 7.3 Mobile-first practicality
Managers will use the app on phones.

Regression widths:

- 320 px
- 375 px
- 390 px
- 430 px

No accidental horizontal overflow. Important controls should remain touch-friendly, generally at least 44 px.

### 7.4 Reusable entities
Clients, venues, event types, tags, and people are reusable records.

Do not duplicate names into event records when a stable reference is the correct model.

### 7.5 Historical continuity
Inactive singers, archived event types, old clients, venues, and past events should remain available when history depends on them.

Archive/deactivate is generally safer than destructive deletion.

### 7.6 Calm error handling
Normal users should not see raw Firebase errors, stack traces, IDs, or technical failure codes.

### 7.7 Real use beats speculative scope
After the pilot begins, repeated client friction should have more influence than hypothetical feature lists.

---

## 8. Account and workspace truth

The fundamental relationship is:

**Person Account → Workspace Membership → Choir Workspace**

### Personal account

`users/{uid}`

Represents a real human.

Typical profile data:

- email
- displayName
- currentWorkspaceId
- timestamps

A person's display name must not be permanently inferred from their email address.

### Workspace membership

`workspaces/{workspaceId}/members/{uid}`

Represents the person's role in one workspace.

Current supported roles:

- **Owner**
- **Manager**

Roles are workspace-specific.

A person may be Manager in one workspace and Owner in another.

### Workspace membership hint

`users/{uid}/memberships/{workspaceId}`

Helps locate the person's workspaces efficiently.

The authoritative permission is the workspace member record, not this hint.

### Workspace

`workspaces/{workspaceId}`

Contains the choir's shared operational data.

### Invites

`invites/{code}`

Invites are capabilities and must be treated securely.

Current rules:

- one-time use
- expiring
- role is stored in the invite
- joining users cannot choose or escalate their role
- Manager invites never create Owners
- Owner linking is explicit
- admin-created Owner invites may connect a pending real Owner account
- Owner linking updates `workspace.ownerUid` atomically with the join

---

## 9. Role philosophy

### Owner

The Owner represents workspace-level ownership.

Owner may:

- perform normal operational Manager work
- manage ownership-level settings
- remove Managers
- eventually transfer ownership through a controlled workflow

### Manager

Manager is a full operational role.

Manager may work with:

- events
- enquiries
- roster
- clients
- venues
- event types
- lineups
- calendar
- statistics
- normal Manager invitations

Manager must not:

- promote themselves to Owner
- create an Owner invite through ordinary client UI
- remove/demote the Owner
- claim workspace ownership

The product should not create more roles until real need exists.

---

## 10. Core operating model

### Events

An event supports:

- status: enquiry or confirmed
- client
- event type
- optional contextual name/reference
- date
- time
- venue
- city/state where relevant
- singer target
- budget
- notes
- assigned singers
- managers

The contextual name is optional.

Examples:

- Performance: "Yuvan Live"
- Recording: film/song/BGM reference
- Rehearsal: what the rehearsal is for

Blank names stay blank. Do not invent "Untitled Show" in normal presentation.

### Availability

Current singer assignment states:

- Not asked
- Asked
- Available
- Unavailable

New assignments begin as **Not asked**.

### Managers vs singers

Managers are operational assignments, not singers.

They must never:

- count toward singer target
- inflate singer history
- appear as singer participation in statistics
- appear as singers in backup lineup data

### Roster and tags

Person records contain stable identity plus useful operational classification.

Tag groups may include:

- Membership
- Language
- Eligibility
- Custom

New singers should not receive guessed tags automatically.

### Event types

Event Types are user-manageable and stable-ID based.

The product supports the concept of:

- Performance
- Recording
- Rehearsal

and custom types.

Historical events must continue to resolve archived/renamed event types correctly.

### Location

Venues are reusable.

Venue TBC plus city/state must be possible without inventing fake venue records.

---

## 11. Home, Calendar, Roster, Statistics

### Home
Home is operational.

It should prioritize:

- upcoming events
- enquiries
- confirmed events that need attention

It should not become a dashboard full of decorative analytics.

### Calendar
Calendar shows enquiries and confirmed events clearly.

The existing visual design is considered approved; do not casually redesign it.

### Roster
Roster should make filtering and lineup-relevant information fast to inspect.

### Statistics
Statistics should answer useful management questions.

Avoid opaque quality scores or "fairness scores" presented as objective truth.

---

## 12. Data safety and source of truth

### Firestore
Cloud Firestore is the production source of truth.

### Demo mode
`?demo=1` is local demo data and must remain isolated from production.

Demo data is not production data and should never silently migrate into a client workspace.

### Excel backup
The app can generate a human-readable `.xlsx` safety copy.

Current workbook design includes:

1. Summary
2. Events
3. Event Lineups
4. Roster
5. Clients
6. Venues
7. Event Types
8. Tags
9. Team

The export is:

- read-only
- current-workspace-only
- safe from formula injection
- Unicode-safe
- independent of the app once downloaded

The spreadsheet is **not** a second live database.

Two-way Excel sync is intentionally out of scope unless explicitly redesigned later.

### Restore
Export does not imply restore.

Any future restore/import feature requires a separate integrity and conflict design.

---

## 13. Security and isolation

These are non-negotiable invariants:

- unauthenticated users cannot access private workspace data
- a user cannot read another workspace without membership
- workspace A must not leak data into workspace B
- users cannot forge membership
- users cannot choose a higher role than an invite grants
- Managers cannot claim Owner
- production migrations must preserve existing access during transition
- user-facing UI should not expose secrets or infrastructure details

A cross-workspace leak is a stop-the-line severity issue.

---

## 14. Technical philosophy

The implementation is intentionally simple:

- browser-based frontend
- vanilla HTML/CSS/JS
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules
- Vercel deployment
- service/data-provider layer
- migration tooling under `scripts/`
- tests under `tests/`
- pinned local SheetJS for Excel export

Do not introduce a major framework rewrite because it is fashionable.

A rewrite needs a concrete product, reliability, or maintenance justification.

UI code should not bypass the service/data-provider architecture for convenience.

---

## 15. UX identity

The established interface direction is:

- cream/sage visual language
- restrained cards
- compact information density
- iOS-like interaction feel
- simple bottom sheets/modals where appropriate
- clear touch targets
- minimal technical language

Do not turn Settings into an enterprise administration console.

The interface should feel calm enough for daily client use.

---

## 16. Production discipline

"Code exists" is not the same as "released."

Production work should distinguish:

1. read-only inspection
2. local code change
3. automated/emulator verification
4. rules deployment
5. application deployment
6. production data migration
7. live verification

Production writes must be intentional.

Migrations should dry-run first where practical.

If production state differs from assumptions, stop rather than improvising destructive repair.

---

## 17. Stop conditions

A contributor or agent should stop and request a decision when:

- production data shape materially differs from expectation
- a migration proposes unexpected writes
- operational data counts change unexpectedly
- an existing user loses access after a rules change
- cross-workspace access becomes possible
- an invite can escalate its own role
- a Manager can claim ownership
- deployment points to the wrong Firebase/Vercel project
- destructive writes were not explicitly approved
- a proposed framework rewrite has no concrete need
- implementation conflicts with this Bible

---

## 18. How product decisions are made

### Prefer evidence from real usage
One repeated client pain point outweighs ten speculative feature ideas.

### Promote deliberately
A possible feature belongs in the backlog first.

It becomes Roadmap work only when deliberately promoted.

### Change the Bible rarely
The Bible should change only when product truth changes.

Examples:

- target user changes
- source-of-truth strategy changes
- role philosophy changes
- a previously forbidden product direction is deliberately accepted

Routine milestones do **not** require rewriting the Bible.

---

## 19. Relationship to the Roadmap

This Bible answers:

- What are we building?
- Why?
- For whom?
- What principles are locked?
- What boundaries should not be crossed?

[ROADMAP.md](./ROADMAP.md) answers:

- What has already been done?
- Where are we now?
- What is next?
- What order should work happen in?
- What is blocked?
- What is deferred?

**Bible = product truth.**  
**Roadmap = execution truth.**

Both should be kept current, but they serve different purposes.
