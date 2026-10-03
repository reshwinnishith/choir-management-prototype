# choir-management-prototype
## v1.8C — personal accounts + workspace memberships

Person account (`users/{uid}`) → membership (`workspaces/{ws}/members/{uid}`, role `owner|manager`) → choir workspace.

- Roles are per workspace. Greeting/role come from the profile `displayName` and the current membership.
- Invites: `invites/{code}` (one-time, 7-day expiry, manager role only from the client). Join link: `/?invite=CODE`.
- Pending business owner (ELFE → Roe Vincent): `ownerDisplayName` with `ownerUid: null`; link later via an admin-minted owner invite.
- Legacy workspaces (no `accessModel`) keep working through a technical `ownerUid` fallback in `firestore.rules`.
  Remove `legacyAccess()` once every workspace is migrated with `scripts/migrate-workspace.mjs`
  (dry-run by default; `--apply --confirm <workspaceId>` to write).
- Tests (local emulators only, need Java): `cd tests && npm i && npm test`
