#!/usr/bin/env node
// v1.8C legacy-workspace -> membership-model migration (Admin SDK).
//
// SAFE BY DEFAULT: performs NO writes unless --apply is passed AND --confirm <workspaceId> matches.
// Idempotent: re-running on an already-migrated workspace is a no-op.
//
// Modes
//   --mode legacy-owner-as-manager   (ELFE)  the legacy ownerUid becomes a MANAGER; the business owner
//                                            is recorded by name only (ownerUid = null) until their
//                                            own account joins through an owner invite.
//   --mode legacy-owner-as-owner     (QA)    the legacy ownerUid becomes the OWNER member.
//   --create-owner-invite            mint a one-time OWNER invite for a migrated workspace so the real
//                                    owner can later link their own account (never client-creatable).
//
// Examples (dry run, then apply):
//   node migrate-workspace.mjs --project choir-manager-46446 --workspace ws_iRpo3c9t \
//        --mode legacy-owner-as-manager --workspace-name ELFE --owner-name "Roe Vincent" --manager-name Philo
//   ... same command + --apply --confirm ws_iRpo3c9t
//
// Local testing: set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (no credentials needed).
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d = undefined) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };

const project = opt('project');
const wsId = opt('workspace');
const apply = flag('apply');
const confirm = opt('confirm');
if (!project || !wsId) {
  console.error('Usage: --project <id> --workspace <wsId> (--mode ... | --create-owner-invite) [--apply --confirm <wsId>]');
  process.exit(2);
}
const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(usingEmulator ? { projectId: project } : { projectId: project, credential: applicationDefault() });
const db = getFirestore();

const plan = [];
const add = (kind, path, data) => plan.push({ kind, path, data });
const out = () => {
  console.log(`\n${apply ? 'APPLY' : 'DRY RUN (no writes)'} — project=${project}${usingEmulator ? ' [EMULATOR]' : ''} workspace=${wsId}`);
  for (const p of plan) console.log(`  ${p.kind.padEnd(6)} ${p.path}\n         ${JSON.stringify(p.data, (k, v) => (v && v._methodName) ? `<${v._methodName}>` : v)}`);
};

async function commit() {
  if (!apply) { console.log('\nNothing written. Re-run with --apply --confirm ' + wsId + ' to execute.'); return; }
  if (confirm !== wsId) { console.error(`\nRefusing to write: --confirm must equal "${wsId}".`); process.exit(3); }
  const batch = db.batch();
  for (const p of plan) {
    const ref = db.doc(p.path);
    if (p.kind === 'set') batch.set(ref, p.data, { merge: true });
    else if (p.kind === 'update') batch.update(ref, p.data);
  }
  await batch.commit();
  console.log(`\nCommitted ${plan.length} writes atomically.`);
}

const wsRef = db.doc(`workspaces/${wsId}`);
const wsSnap = await wsRef.get();
if (!wsSnap.exists) { console.error('Workspace not found.'); process.exit(4); }
const ws = wsSnap.data();

if (flag('create-owner-invite')) {
  if (ws.accessModel !== 'members') { console.error('Workspace must be migrated first.'); process.exit(5); }
  if (ws.ownerUid) { console.error('Workspace already has a linked owner account.'); process.exit(5); }
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const code = Array.from(crypto.randomBytes(12), b => ALPHA[b % ALPHA.length]).slice(0, 12).join('');
  add('set', `invites/${code}`, {
    workspaceId: wsId, workspaceName: ws.name, role: 'owner', status: 'active',
    createdByUid: opt('created-by', 'admin'), createdByName: 'Admin', createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 14 * 864e5))
  });
  out();
  if (apply) console.log(`\nOWNER INVITE CODE (share privately): ${code}`);
  await commit();
  process.exit(0);
}

const mode = opt('mode');
if (!['legacy-owner-as-manager', 'legacy-owner-as-owner'].includes(mode)) { console.error('Unknown --mode'); process.exit(2); }

// ---- preconditions ----
if (ws.accessModel === 'members') { console.log('Already migrated (accessModel=members). Nothing to do.'); process.exit(0); }
const legacyUid = ws.ownerUid;
if (!legacyUid) { console.error('Legacy workspace has no ownerUid; refusing.'); process.exit(5); }
const members = await wsRef.collection('members').get();
if (!members.empty) { console.error('Workspace already has member docs; refusing.'); process.exit(5); }
const userSnap = await db.doc(`users/${legacyUid}`).get();
if (!userSnap.exists || userSnap.data().currentWorkspaceId !== wsId) { console.error('Legacy owner profile does not point at this workspace; refusing.'); process.exit(5); }

const counts = {};
for (const c of await wsRef.listCollections()) counts[c.id] = (await c.count().get()).data().count;
console.log('Existing data (untouched):', JSON.stringify(counts));

const role = mode === 'legacy-owner-as-owner' ? 'owner' : 'manager';
const managerName = opt('manager-name') || userSnap.data().displayName || '';
const wsName = opt('workspace-name') || ws.name;
const ownerName = role === 'owner' ? managerName : (opt('owner-name') || '');
if (role === 'manager' && !ownerName) { console.error('--owner-name is required for legacy-owner-as-manager.'); process.exit(2); }

add('set', `workspaces/${wsId}/members/${legacyUid}`, {
  uid: legacyUid, role, status: 'active', displayName: managerName,
  joinedAt: FieldValue.serverTimestamp(), invitedByUid: null, migratedFromLegacy: true
});
add('set', `users/${legacyUid}/memberships/${wsId}`, {
  workspaceId: wsId, workspaceName: wsName, role, joinedAt: FieldValue.serverTimestamp()
});
add('set', `users/${legacyUid}`, { displayName: managerName, updatedAt: FieldValue.serverTimestamp() });
add('update', `workspaces/${wsId}`, {
  name: wsName,
  accessModel: 'members',
  ownerUid: role === 'owner' ? legacyUid : null,
  ownerDisplayName: ownerName,
  legacyOwnerUid: legacyUid,               // TECHNICAL record only; never shown as ownership
  createdByUid: legacyUid,
  migratedAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
});
out();
await commit();
