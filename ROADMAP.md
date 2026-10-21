# Choir Manager Roadmap

> **Purpose of this document**
>
> This is the execution map for Choir Manager.
> It tells any contributor or AI **what has been completed, where the project is now, what comes next, and in what order**.
>
> Read **[CHOIR_MANAGER_BIBLE.md](./CHOIR_MANAGER_BIBLE.md)** first for product boundaries and non-negotiable principles.
>
> Update this Roadmap whenever a milestone changes state, a production rollout completes, or an accepted feature is promoted into scheduled work.

---

## 1. Current state — read this first

**Source of truth:** `main`

**Implementation baseline entering this Roadmap split:**  
`28fee9846fd8893cd3f2b889538d9a6cbf0b18dd` — **v1.9B — complete pending owner account linking**

### Current status

Code through **v1.9B** is complete and pushed.

The project stopped immediately before the controlled production rollout of:

- v1.9 workspace memberships / multi-manager foundation
- v1.9A Excel safety backup
- v1.9B pending Owner account linking fix

### Important distinction

**Implemented does not yet mean fully live.**

The new membership model should not be considered production-complete until:

- new Firestore rules are deployed
- the current app is deployed
- QA workspace migration passes
- Philo / ELFE migration passes
- live verification passes

### Current real pilot target

Workspace: **ELFE**

Target ownership/membership state after migration:

- **Roe Vincent** — Owner, account not connected yet
- **Philo** — Manager, active account
- **Sheena** — Manager, to be invited after migration

Do not create Roe or Sheena accounts as part of the migration itself.

---

## 2. Status legend

- ✅ **DONE** — implemented and verified for its milestone
- 🟡 **NEXT / ACTIVE** — current execution target
- ⏳ **PLANNED** — accepted, not started
- 💡 **BACKLOG** — useful idea, not scheduled
- 🚫 **OUT OF SCOPE** — deliberately not part of current plan

---

## 3. Completed milestones

### ✅ v1.6A — Service/data foundation
Completed:

- stable service layer
- separation between UI and data provider
- groundwork for cloud/local modes

### ✅ v1.6B — Reusable operating entities
Completed:

- clients
- venues
- event types
- rebuilt event creation workflow
- reusable stable IDs

### ✅ v1.6C / v1.6D — Core operating UX
Completed:

- roster improvements
- calendar
- agenda/upcoming flows
- assignment interaction
- lineup workflows
- duplicate/copy-lineup behavior
- mobile-density improvements

### ✅ v1.7 — Firebase cloud foundation
Completed:

- Firebase Authentication
- Cloud Firestore
- production/demo separation
- workspace-scoped data
- service-provider cloud implementation

### ✅ v1.7.1 — Firebase activation / event-type system
Completed:

- production Firebase activation
- tested security foundation
- flexible Event Types
- archive/rename/merge behaviors

### ✅ v1.7.2 — Event workflow polish
Completed:

- contextual event naming
- improved event hierarchy
- singer tag refinements
- Indian budget presentation
- Home/card refinements

### ✅ v1.8A — Client onboarding hardening
Completed:

- forgot-password flow
- loading/auth race handling
- improved empty states
- calmer production errors
- terminology cleanup
- mobile review

### ✅ v1.8B — Production Firestore ID fix
Completed:

- fixed inline event handlers that broke with Firestore string IDs
- live production verification performed
- public v1.8B pilot build declared ready

### ✅ v1.9 — Personal accounts + workspace memberships
Completed in code:

- person account separated from choir workspace
- workspace-specific Owner / Manager roles
- membership documents
- workspace switching
- manager invite/join flow
- pending business owner representation
- hardened Firestore rules
- migration tooling
- security/migration/E2E tests

### ✅ v1.9A — Client Excel safety backup
Completed in code:

- Download Excel Backup
- real XLSX workbook
- 9 sheets
- current-workspace isolation
- demo isolation
- formula-injection protection
- Unicode/Tamil support
- numeric budget cells
- local pinned SheetJS
- backup tests and mobile E2E

### ✅ v1.9B — Pending Owner account linking
Completed in code:

- valid admin-created Owner invite links `workspace.ownerUid`
- Manager invites do not alter ownership
- owner linking occurs atomically with join
- dedicated ownership tests
- role-forgery protection retained

---

## 4. 🟡 Active milestone — controlled v1.9 production rollout

This is the next work.

Do not start unrelated feature work before this is resolved.

### Required order

1. Read-only production preflight
2. Migration authentication dry run
3. Deploy new Firestore rules
4. Deploy current app to existing Vercel project
5. Migrate QA workspace as canary
6. Migrate Philo / ELFE
7. Live Philo verification

The order matters.

---

## 5. Phase 1 — read-only production preflight

Status: 🟡 NEXT

Verify without production writes:

- [ ] Git HEAD is expected and working tree is clean
- [ ] Firebase project is exactly `choir-manager-46446`
- [ ] correct Firebase account is authenticated
- [ ] Vercel project is the existing `choir-management-prototype`
- [ ] inspect currently deployed Firestore rules
- [ ] inspect currently deployed Vercel version
- [ ] QA workspace still exists
- [ ] Philo production Auth account still exists
- [ ] no unexpected real workspaces exist

For Philo, determine from production rather than assumption:

- [ ] UID
- [ ] currentWorkspaceId
- [ ] workspace name
- [ ] current ownerUid
- [ ] accessModel
- [ ] current member documents
- [ ] people count
- [ ] tags count
- [ ] clients count
- [ ] venues count
- [ ] eventTypes count
- [ ] events count

Record these as the pre-migration baseline.

### Stop condition

If production shape differs materially from the expected legacy workspace model, stop before any write.

---

## 6. Phase 2 — migration authentication and dry run

Status: ⏳ PLANNED

Migration script:

`scripts/migrate-workspace.mjs`

Important implementation detail:

The script uses Firebase Admin SDK `applicationDefault()`.

A normal Firebase CLI login may not be sufficient.

### Required checks

- [ ] prove the script can authenticate to production using **dry run only**
- [ ] dry-run QA workspace
- [ ] dry-run Philo workspace

Do **not** use `--apply` during this phase.

### Expected Philo dry-run target

Mode:

`legacy-owner-as-manager`

Target:

- workspace name → **ELFE**
- business Owner display name → **Roe Vincent**
- Philo display name → **Philo**
- Philo role → **Manager**
- connected Owner UID → **none yet**

Expected write plan only:

1. create Philo member document as Manager
2. create Philo workspace-membership hint
3. update Philo profile display name
4. update workspace membership/ownership metadata

No roster/events/clients/venues/event types should be changed.

### Stop condition

If Application Default Credentials are unavailable, stop and choose an explicit authentication method before continuing.

Do not improvise service-account key creation.

---

## 7. Phase 3 — deploy new Firestore rules

Status: ⏳ PLANNED

Deploy repository `firestore.rules` to:

`choir-manager-46446`

Do not deploy Firebase Hosting.

After deployment:

- [ ] deployed rules match repository rules
- [ ] legacy QA still reads its workspace
- [ ] legacy Philo still reads her workspace
- [ ] non-members remain denied
- [ ] cross-workspace isolation remains intact

### Why rules deploy before migration

The new rules contain compatibility for legacy workspaces while also understanding membership-native workspaces.

This creates the safe bridge for migration.

### Stop condition

If QA or Philo loses access, stop immediately.

---

## 8. Phase 4 — deploy current application

Status: ⏳ PLANNED

Deploy current `main` to the existing Vercel project:

`choir-management-prototype`

Production URL:

`https://choir-management-prototype.vercel.app`

Do not create another Vercel project.

### Verify before migrating Philo

While Philo is still legacy:

- [ ] login
- [ ] Home
- [ ] Calendar
- [ ] Roster
- [ ] Statistics
- [ ] Settings
- [ ] Excel backup control
- [ ] no console errors
- [ ] no Firestore permission errors

Legacy Team/Invite limitations are acceptable until migration.

### Stop condition

If the new app cannot safely operate against the legacy workspace, stop before migration.

---

## 9. Phase 5 — QA canary migration

Status: ⏳ PLANNED

QA account:

`demo@choirmanager.test`

Known historical QA workspace:

`ws_epnFVRBc`

### Procedure

- [ ] repeat QA dry run
- [ ] apply only with exact matching `--confirm`
- [ ] verify `accessModel = members`
- [ ] QA membership role = Owner
- [ ] `ownerUid` remains QA UID
- [ ] operational data counts unchanged
- [ ] QA login still works
- [ ] normal CRUD works
- [ ] Excel backup works

### Stop condition

If QA fails or data counts unexpectedly change, do not migrate Philo.

---

## 10. Phase 6 — Philo / ELFE migration

Status: ⏳ PLANNED

Only continue after QA canary passes.

### Desired target

Workspace:

**ELFE**

Business Owner:

**Roe Vincent**

Connected Owner account:

**none yet**

Manager:

**Philo**

### Required final workspace state

- [ ] `name = ELFE`
- [ ] `accessModel = members`
- [ ] `ownerUid = null`
- [ ] `ownerDisplayName = Roe Vincent`
- [ ] `legacyOwnerUid = Philo UID`

### Required Philo state

- [ ] member role = Manager
- [ ] member status = active
- [ ] display name = Philo
- [ ] currentWorkspaceId unchanged
- [ ] workspace membership hint exists and says Manager

### Data preservation

Compare pre/post counts:

- [ ] people unchanged
- [ ] tags unchanged
- [ ] clients unchanged
- [ ] venues unchanged
- [ ] eventTypes unchanged
- [ ] events unchanged

---

## 11. Phase 7 — live production verification

Status: ⏳ PLANNED

Log in as Philo through the public app.

Expected header:

**Hello, Philo 👋**  
**Manager · ELFE**

Expected Team state:

- **Roe Vincent — Owner — account not connected / pending equivalent**
- **Philo — Manager — Active**

Verify:

- [ ] Home works
- [ ] Calendar works
- [ ] Roster works
- [ ] Statistics works
- [ ] Clients work
- [ ] Venues work
- [ ] Event Types work
- [ ] normal operational writes work
- [ ] Team works
- [ ] Manager invite can be generated
- [ ] unused Manager invite can be revoked
- [ ] Excel backup downloads correctly
- [ ] no console errors
- [ ] no Firestore permission errors
- [ ] 320 px
- [ ] 375 px
- [ ] 390 px
- [ ] 430 px

Do not leave temporary production test records behind.

---

## 12. Definition of production-rollout complete

v1.9 / v1.9A / v1.9B become **LIVE** only when:

- [ ] new rules deployed and verified
- [ ] current Vercel app deployed
- [ ] QA migrated successfully
- [ ] Philo workspace migrated successfully
- [ ] all operational data counts match
- [ ] live Philo verification passes
- [ ] Roadmap updated to mark rollout complete

Until then, the status remains:

**implemented, pushed, production rollout pending**

---

## 13. ⏳ Next milestone — real team onboarding

Target version: **v1.10**

Begin only after production rollout is stable.

### Sheena

- [ ] generate Manager invite
- [ ] Sheena creates/uses her own personal account
- [ ] join ELFE
- [ ] verify Manager role
- [ ] verify shared data access
- [ ] verify independent login
- [ ] verify Philo + Sheena can operate the same workspace

### Roe Vincent

Do not connect Roe merely for technical completeness.

When ready:

- [ ] obtain/use Roe's real personal account
- [ ] admin-create Owner invite
- [ ] Roe joins ELFE
- [ ] verify Owner membership
- [ ] verify `workspace.ownerUid` links to Roe UID
- [ ] verify `ownerDisplayName` remains correct
- [ ] verify Philo remains Manager
- [ ] verify Sheena remains Manager
- [ ] verify operational data unchanged

---

## 14. ⏳ Real-data onboarding

Timing: after the membership model is live and stable.

The client should receive a useful workspace, not a prototype database.

### Import only trusted data

Candidate starting data:

- real singer roster
- confirmed membership tags
- confirmed language tags
- confirmed eligibility tags
- useful real recurring clients where reliable
- useful real venues where reliable

### Do not import

- fake/demo events
- prototype assignments
- test availability
- invented budgets
- synthetic clients
- synthetic venues
- uncertain singer classifications

Historical data should be imported only when the source is reliable enough to justify it.

The old prototype spreadsheet contents must not automatically be treated as production truth.

---

## 15. ⏳ Operational polish after real use

Target: **v1.11**, scope determined by pilot feedback.

Candidate work:

- [ ] refine Needs Attention from actual manager behaviour
- [ ] reduce repetitive event entry
- [ ] improve lineup assignment ergonomics
- [ ] improve repeat/duplicate workflows
- [ ] refine singer rotation visibility
- [ ] refine useful manager statistics
- [ ] fix mobile friction found in real usage

Do not pre-build all of these.

Promote only what real use validates.

---

## 16. ⏳ Reliability and data safety

Target: **v1.12** or earlier if production risk warrants it.

Current safety layer:

- manual Excel backup exists

Future reliability decisions:

- [ ] define proper Firestore backup strategy
- [ ] evaluate PITR / billing implications
- [ ] decide whether scheduled backups are needed
- [ ] consider optional organisation-controlled Google Drive backup
- [ ] define restore/import policy
- [ ] test recovery procedure
- [ ] remove legacy-access compatibility only when every production workspace is migrated

Do not create two-way spreadsheet synchronization.

Firestore stays authoritative.

---

## 17. 💡 Backlog — accepted ideas, not scheduled

These are not promises and should not be started automatically.

- singer availability self-service
- fair-rotation assistance
- richer monthly/yearly stats
- event follow-up states
- better lineup reuse
- workflow notifications
- richer activity/history
- optional cloud-backup integration
- owner transfer UX
- additional roles if real operations require them
- singer accounts if the product eventually justifies the added complexity
- restore/import tooling after a recovery design exists

A backlog item becomes scheduled only when deliberately promoted into a milestone.

---

## 18. 🚫 Explicitly out of scope for the current rollout

Do not combine any of these with the production migration:

- creating Sheena's production account
- creating Roe's production account
- creating Roe's Owner invite
- importing a new roster
- enabling unrelated billing
- enabling PITR
- building automatic cloud backup
- restore/import
- framework rewrite
- Calendar redesign
- unrelated UX feature work

Keep rollout scope narrow.

---

## 19. Replanning triggers

Replan when one of these is true:

### Product trigger
Real users repeatedly struggle with the same workflow.

### Safety trigger
A change risks data loss, workspace leakage, account lockout, or role escalation.

### Architecture trigger
A simple product requirement becomes disproportionately fragile.

### Scope trigger
A milestone grows too large and should be split.

### Reality trigger
Actual choir-manager usage disproves a product assumption.

### Reliability trigger
The same class of production failure repeats.

When replanning:

1. describe the observed problem
2. identify the failed assumption
3. update **CHOIR_MANAGER_BIBLE.md** only if product truth changed
4. update Roadmap phases/order
5. explicitly mark deferred/removed work
6. then implement

---

## 20. Definition of done for any milestone

A milestone is complete only when relevant items are satisfied:

- [ ] scope is explicit
- [ ] implementation complete
- [ ] automated tests pass
- [ ] security tests pass where relevant
- [ ] mobile regression checked where relevant
- [ ] migration dry-run performed where relevant
- [ ] production data preserved
- [ ] live verification completed if deployed
- [ ] code pushed
- [ ] Roadmap status updated
- [ ] new product truths reflected in the Bible if necessary

**"Code exists" is not the same as "done."**

---

## 21. Contributor / AI handoff protocol

Before starting:

1. Read **CHOIR_MANAGER_BIBLE.md**.
2. Read this Roadmap.
3. Inspect current `main`.
4. Identify the first incomplete active phase.
5. Do not jump ahead unless explicitly instructed.
6. Separate review, code changes, deploys, and production writes.
7. Dry-run migrations first where possible.

A hands-on agent prompt should state:

- expected starting commit
- exact scope
- tests required
- production actions allowed
- production actions forbidden
- desired final report
- whether commit/push/deploy is authorized

If a production state differs from this Roadmap, stop and report rather than silently repairing while proceeding.

---

## 22. Update discipline

### Update this Roadmap when

- a milestone completes
- production rollout changes state
- a blocker appears or clears
- work is promoted from backlog
- sequencing changes

### Update the Bible when

- product purpose changes
- target user changes
- a locked boundary changes
- role/security philosophy changes
- source-of-truth philosophy changes

Do not duplicate day-to-day execution detail into the Bible.

The Roadmap should always make the answer to these three questions obvious:

1. **What has been done?**
2. **Where are we now?**
3. **What happens next?**
