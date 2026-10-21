# Choir Management — Product Bible & Roadmap

> **Standing instruction for every contributor or AI working in this repository:**  
> Read this file before making product, architecture, data-model, migration, or release decisions.  
> Update it whenever a milestone is completed, a major decision changes, or a new feature is accepted into scope.  
> Do not silently change product direction. If implementation reality conflicts with this document, stop and reconcile the conflict first.

---

## 1. What this app is

Choir Management is a lightweight operational system for running a working choir.

Its job is to replace scattered spreadsheets, chats, memory, and ad-hoc admin with one simple place to manage:

- enquiries and confirmed events
- clients
- venues
- event types
- singers / roster
- event lineups
- singer availability
- tags and performance/language suitability
- managers and ownership
- calendar / agenda views
- operational statistics
- safe client-side backups

The primary success criterion is **clarity for a non-technical choir manager**.

This is not primarily a “software product for software people.”  
It is an operations tool for people who need to answer questions such as:

- What shows are coming up?
- Which enquiries still need action?
- Who is singing?
- Who is available?
- Who has sung the most recently?
- Which client / venue / event type is this?
- How much is the event worth?
- Who manages this workspace?
- Can I safely keep an independent copy of my data?

---

## 2. What this app is not

Unless deliberately added to this roadmap, the app is **not**:

- a payroll or accounting system
- a full CRM
- a public booking marketplace
- a ticketing platform
- a singer social network
- a chat replacement
- a file-storage product
- a Google Drive replacement
- an automated payroll/disbursement system
- a complex ERP
- a “feature-rich at all costs” admin panel

When in doubt, prefer the smallest workflow that makes the choir manager’s real job easier.

---

## 3. Product principles

### 3.1 Simplicity over completeness
A smaller, obvious workflow is better than a powerful workflow that needs explanation.

### 3.2 Operational truth over decoration
Home, Calendar, Roster, Events, Team, and Statistics should surface actionable operational truth first.

### 3.3 Reusable data
Clients, venues, event types, tags, and singers are reusable entities. Do not duplicate them unnecessarily inside events.

### 3.4 Firestore is authoritative
Firestore is the live source of truth for production workspaces.

Exports are safety copies, not a second database.

### 3.5 Workspace isolation is non-negotiable
One workspace must never see another workspace’s data.

### 3.6 Roles are workspace-specific
A person account is separate from their role in a choir workspace.

Current role model:

- Owner
- Manager

### 3.7 Historical data should survive
Inactive members, old clients, old venues, old event types, and past events should remain available where useful rather than being destructively removed.

### 3.8 Mobile usability matters
The application must remain usable on narrow mobile widths.

Primary regression widths:

- 320 px
- 375 px
- 390 px
- 430 px

### 3.9 Production writes must be intentional
Migration, rules deployment, production data changes, and destructive actions require an explicit execution step.

Do not improvise production repair while performing an unrelated task.

---

## 4. Core domain model

### Person account

`users/{uid}`

Represents a human account.

### Workspace membership

`workspaces/{workspaceId}/members/{uid}`

Represents that person’s role in a specific workspace.

Roles:

- `owner`
- `manager`

### Membership hint

`users/{uid}/memberships/{workspaceId}`

Used to locate a user’s workspaces efficiently.

### Workspace

`workspaces/{workspaceId}`

Important ownership fields include:

- `accessModel`
- `ownerUid`
- `ownerDisplayName`
- `legacyOwnerUid` during migration compatibility

### Invites

`invites/{code}`

Current intended behavior:

- one-time
- expiring
- role comes from the stored invite, never from user input
- Manager invites must never mutate `workspace.ownerUid`
- an admin-created Owner invite may link a pending real owner
- accepting a valid Owner invite updates `workspace.ownerUid` in the same atomic batch

---

## 5. Core operating data

The current product model includes:

### Events
- enquiry and confirmed states
- date
- venue
- show time
- client
- event type / category
- singer requirement
- budget
- notes
- manager
- lineup

### Roster
- singer name
- gender
- active/inactive status
- availability state
- tags
- language / performance suitability
- historical assignment usage

### Reusable reference data
- clients
- venues
- event types
- tags
- cities

### Statistics
Includes operational counts and singer participation summaries.

### Backup
The user can export a normal `.xlsx` workbook that exists independently of the application.

Current workbook contains 9 sheets:

1. Summary
2. Events
3. Event Lineups
4. Roster
5. Clients
6. Venues
7. Event Types
8. Tags
9. Team

The export is read-only with respect to Firestore.

---

## 6. Current technical shape

Current implementation is intentionally simple:

- browser-based frontend
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules
- Vercel deployment
- service layer in `services.js`
- migration tooling in `scripts/`
- tests in `tests/`
- local pinned SheetJS for Excel export

Do not introduce a major framework rewrite unless there is a concrete product or maintenance reason.

---

## 7. Current release state

### Completed

- [x] v1.6A — stable data foundation and service layer
- [x] v1.6B — reusable clients, venues, event types, rebuilt event workflow
- [x] v1.6C / v1.6D — roster, lineup, calendar, agenda, mobile UX refinements
- [x] v1.7 — Firebase cloud foundation
- [x] v1.7.1 — live Firebase activation and flexible event types
- [x] v1.7.2 — event workflow cards and singer tag refinements
- [x] v1.8A — client onboarding and account UX hardening
- [x] v1.8B — live production fix for Firestore string event IDs
- [x] v1.9 — workspace migration model, memberships, hardened Firestore rules, migration tooling
- [x] v1.9A — client Excel safety backup
- [x] v1.9B — complete pending Owner account linking

### Current code source of truth

`main`

Current reviewed head before this roadmap is added:

`28fee9846fd8893cd3f2b889538d9a6cbf0b18dd`

### Important current status

The code for v1.9 / v1.9A / v1.9B is complete and pushed.

**The controlled production rollout is still pending.**

Do not treat the new membership model as fully live until the rollout below is completed and verified.

---

## 8. Immediate next milestone — production rollout

### v1.9 Production Rollout

Run in this order.

#### Phase 1 — Read-only preflight
- [ ] Confirm expected Git HEAD and clean working state
- [ ] Confirm Firebase project
- [ ] Confirm existing Vercel project
- [ ] Inspect current deployed Firestore rules
- [ ] Inspect Philo’s current production workspace state
- [ ] Record pre-migration data counts
- [ ] Confirm no unexpected production workspaces

#### Phase 2 — Migration authentication dry run
- [ ] Verify Firebase Admin `applicationDefault()` authentication
- [ ] Dry-run QA migration
- [ ] Dry-run Philo migration
- [ ] Confirm dry run proposes only intended membership/workspace/profile writes
- [ ] Confirm no choir operational data will be changed

#### Phase 3 — Firestore rules
- [ ] Deploy new rules first
- [ ] Verify deployed rules match repository rules
- [ ] Confirm legacy QA still reads
- [ ] Confirm legacy Philo workspace still reads
- [ ] Confirm cross-workspace isolation still holds

#### Phase 4 — Application deploy
- [ ] Deploy current `main` to existing Vercel project
- [ ] Do not create a second Vercel project
- [ ] Confirm login
- [ ] Confirm Home
- [ ] Confirm Calendar
- [ ] Confirm Roster
- [ ] Confirm Statistics
- [ ] Confirm Settings
- [ ] Confirm Excel backup
- [ ] Confirm no console or permission errors

#### Phase 5 — QA canary migration
- [ ] Repeat QA dry run
- [ ] Apply QA migration
- [ ] Confirm QA becomes membership-based
- [ ] Confirm owner role remains correct
- [ ] Compare data counts
- [ ] Confirm normal CRUD
- [ ] Confirm Excel backup

#### Phase 6 — Philo / ELFE migration
Target state:

- Workspace name: **ELFE**
- Business owner: **Roe Vincent**
- Connected owner account: **none yet**
- Philo: **Manager**

Checklist:

- [ ] Repeat Philo dry run immediately before apply
- [ ] Apply migration
- [ ] `accessModel = members`
- [ ] `ownerUid = null`
- [ ] `ownerDisplayName = Roe Vincent`
- [ ] `legacyOwnerUid = Philo UID`
- [ ] Philo membership role = Manager
- [ ] Philo display name = Philo
- [ ] Membership hint created
- [ ] All existing operational data counts unchanged

#### Phase 7 — Live production verification
- [ ] Header shows **Hello, Philo**
- [ ] Header shows **Manager · ELFE**
- [ ] Team shows Roe Vincent as pending/unconnected Owner
- [ ] Team shows Philo as active Manager
- [ ] Home works
- [ ] Calendar works
- [ ] Roster works
- [ ] Statistics works
- [ ] normal create/read/update flows work
- [ ] Team page works
- [ ] Manager invite can be generated
- [ ] unused Manager invite can be revoked
- [ ] Excel backup downloads
- [ ] 320 / 375 / 390 / 430 px checks pass
- [ ] no console errors
- [ ] no Firestore permission errors

### Explicitly not part of this rollout

- [ ] Do **not** create Sheena yet
- [ ] Do **not** create Roe’s account yet
- [ ] Do **not** create Roe’s Owner invite yet
- [ ] Do **not** import a new real roster during migration
- [ ] Do **not** enable unrelated billing/PITR/backup work
- [ ] Do **not** redesign the app during rollout

---

## 9. After v1.9 production is stable

These are the next product decisions, in order.

### v1.10 — Real team onboarding
Goal: move from a migrated single-manager workspace to a real shared-management workspace.

- [ ] Invite Sheena as Manager
- [ ] Verify independent login
- [ ] Verify shared workspace access
- [ ] Verify role display
- [ ] Verify concurrent manager workflows
- [ ] Decide timing for Roe account connection
- [ ] Create admin-controlled Owner invite only when ready
- [ ] Connect Roe as Owner
- [ ] Verify `ownerUid` linking
- [ ] Verify Philo remains Manager
- [ ] Verify no workspace data changes during owner linking

### v1.11 — Operational polish
Candidate scope, only after real usage feedback:

- [ ] refine “Needs Attention” logic from actual manager usage
- [ ] improve singer rotation / fairness visibility
- [ ] improve lineup assignment ergonomics
- [ ] refine statistics that managers actually use
- [ ] reduce repetitive event-entry work
- [ ] improve mobile friction found during live use

### v1.12 — Reliability and data safety
Candidate scope:

- [ ] review production backup strategy beyond manual XLSX
- [ ] decide whether PITR is justified
- [ ] define restore/import policy
- [ ] remove temporary migration compatibility only when safe
- [ ] remove `legacyAccess()` only after every production workspace is migrated

Do not build restore/import merely because export exists. Restore requires an explicit data-integrity design.

---

## 10. Backlog — accepted ideas, not yet scheduled

These may be useful but are not automatically approved for the next version.

- singer availability improvements
- fair-rotation assistance
- richer monthly/yearly statistics
- more useful event follow-up states
- better event duplication / lineup reuse
- workflow notifications
- owner/admin account lifecycle improvements
- optional cloud backup integrations
- richer audit/history if operational need appears

A backlog item becomes roadmap work only when it is deliberately promoted into a version milestone.

---

## 11. Replanning rules

Do not replan simply because a new idea appears.

Replan when one or more of these is true:

### Product trigger
Real users repeatedly struggle with the same workflow.

### Safety trigger
A change risks data loss, workspace leakage, role escalation, or account lockout.

### Architecture trigger
The current implementation makes a simple product requirement disproportionately difficult or fragile.

### Scope trigger
A planned version grows enough that it should be split into smaller releases.

### Reality trigger
Real choir-manager behavior contradicts an assumption in this document.

### Cost trigger
Infrastructure or maintenance cost becomes disproportionate to the value delivered.

### Reliability trigger
The same class of production bug appears more than once.

When replanning:

1. write down the observed problem
2. identify the assumption that failed
3. update the Bible section if product truth changed
4. update the roadmap order
5. explicitly mark deferred or removed work
6. only then begin implementation

---

## 12. Intervention / stop conditions

Any contributor or agent should stop and request a decision if:

- production data shape differs materially from expectations
- a migration proposes unexpected writes
- data counts change unexpectedly
- a user loses access after a rules change
- cross-workspace access is possible
- an invite can escalate its own role
- a Manager action can claim ownership
- production deploy targets the wrong Firebase or Vercel project
- a task requires destructive production writes that were not explicitly approved
- a framework rewrite is being proposed without a concrete need
- implementation conflicts with this roadmap

Do not “repair while proceeding” after a stop condition.

---

## 13. Definition of done for each version

A version is complete only when:

- [ ] scope is clearly defined
- [ ] implementation is complete
- [ ] relevant automated tests pass
- [ ] mobile regression is checked where relevant
- [ ] security rules are checked where relevant
- [ ] no unrelated production data is changed
- [ ] migration is dry-run first when relevant
- [ ] live verification is completed when deployed
- [ ] roadmap checkboxes are updated
- [ ] newly discovered product decisions are recorded here
- [ ] commit is pushed
- [ ] release state is unambiguous

“Code exists” is not the same as “version is complete.”

---

## 14. Agent / contributor workflow

Before starting work:

1. Read this file.
2. Inspect current `main`.
3. Identify the active unchecked milestone.
4. Do not jump ahead unless instructed.
5. Separate:
   - read-only review
   - code changes
   - deployment
   - production data writes
6. Prefer dry runs before migrations.
7. Keep unrelated changes out of the diff.
8. Update this roadmap as part of completing a milestone.

If an external AI agent is used, its task should specify:

- expected starting commit
- exact allowed scope
- tests to run
- forbidden production actions
- desired final report
- whether commit/push/deploy is allowed

---

## 15. Product decision log

### Locked decisions

- Firestore remains authoritative.
- Excel export is a safety backup, not a parallel database.
- Roles are per workspace.
- Owner and Manager are the current workspace roles.
- Pending real owners may exist by display name before connecting an account.
- Owner linking must be explicit and secure.
- Manager invites cannot become Owner invites through client input.
- Workspace isolation is mandatory.
- Historical operational records should be preserved.
- Mobile UX is a first-class requirement.
- Production migrations must be dry-run before apply.
- Simplicity is preferred over expanding into a generic business platform.

### Decisions that may change after real usage

- which statistics deserve prominence
- how fairness/rotation should be scored
- how much workflow automation is useful
- whether notifications are necessary
- whether restore/import should ever be added
- whether additional roles are needed
- whether a larger frontend architecture is justified

---

## 16. The north star

The app is succeeding when a choir manager can open it and confidently understand:

**what is happening, what needs attention, who is involved, and what to do next — without needing a spreadsheet, a developer, or a manual.**

That is the standard against which new features should be judged.
