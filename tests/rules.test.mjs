// Firestore rules tests for v1.8C membership model.
// Run: cd tests && npm run test:rules   (needs Java; uses the local Firestore emulator only)
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, collection, getDocs, query, where,
  Timestamp, serverTimestamp
} from 'firebase/firestore';

let env;
const WS = 'ws_elfe';
const LEGACY_WS = 'ws_legacy';
const OTHER_WS = 'ws_other';

// Emulator-only personas (never real Auth accounts)
const ROE = 'uid_roe', PHILO = 'uid_philo', SHEENA = 'uid_sheena', OUTSIDER = 'uid_outsider', QA = 'uid_qa';
const db = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const future = (days = 7) => Timestamp.fromDate(new Date(Date.now() + days * 864e5));
const past = () => Timestamp.fromDate(new Date(Date.now() - 864e5));

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-choir-test',
    firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
  });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    // ELFE (migrated): owner not connected yet, Philo manager
    await setDoc(doc(a, 'workspaces', WS), { name: 'ELFE', accessModel: 'members', ownerUid: null, ownerDisplayName: 'Roe Vincent', createdByUid: PHILO });
    await setDoc(doc(a, 'workspaces', WS, 'members', PHILO), { uid: PHILO, role: 'manager', status: 'active', displayName: 'Philo' });
    await setDoc(doc(a, 'workspaces', WS, 'people', 'p1'), { name: 'Anna' });
    // Another members workspace with a real Owner (Roe) + manager Sheena
    await setDoc(doc(a, 'workspaces', OTHER_WS), { name: 'Other', accessModel: 'members', ownerUid: ROE, createdByUid: ROE });
    await setDoc(doc(a, 'workspaces', OTHER_WS, 'members', ROE), { uid: ROE, role: 'owner', status: 'active', displayName: 'Roe' });
    await setDoc(doc(a, 'workspaces', OTHER_WS, 'members', SHEENA), { uid: SHEENA, role: 'manager', status: 'active', displayName: 'Sheena', invitedByUid: ROE });
    await setDoc(doc(a, 'workspaces', OTHER_WS, 'people', 'p1'), { name: 'Bob' });
    // Legacy (QA) workspace: ownerUid only
    await setDoc(doc(a, 'workspaces', LEGACY_WS), { name: 'Demo Workspace', ownerUid: QA });
    await setDoc(doc(a, 'workspaces', LEGACY_WS, 'people', 'p1'), { name: 'Qa' });
  });
});

const seedInvite = (over = {}) => env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'invites', over.code || 'CODE123456'), {
    workspaceId: OTHER_WS, workspaceName: 'Other', role: 'manager', status: 'active',
    createdByUid: ROE, createdAt: Timestamp.now(), expiresAt: future(), ...over
  });
});

function joinBatch(d, uid, code, { role = 'manager', ws = OTHER_WS } = {}) {
  const b = writeBatch(d);
  b.update(doc(d, 'invites', code), { status: 'used', usedByUid: uid, usedAt: serverTimestamp() });
  b.set(doc(d, 'workspaces', ws, 'members', uid), { uid, role, status: 'active', displayName: 'X', joinedAt: serverTimestamp(), invitedByUid: ROE, inviteId: code });
  b.set(doc(d, 'users', uid, 'memberships', ws), { workspaceId: ws, role, workspaceName: 'Other' });
  return b;
}

// 1
test('1. Owner can access workspace data', async () => {
  await assertSucceeds(getDoc(doc(db(ROE), 'workspaces', OTHER_WS, 'people', 'p1')));
  await assertSucceeds(setDoc(doc(db(ROE), 'workspaces', OTHER_WS, 'people', 'p2'), { name: 'New' }));
  await assertSucceeds(getDoc(doc(db(ROE), 'workspaces', OTHER_WS)));
});

// 2
test('2. Manager can access the same workspace data', async () => {
  await assertSucceeds(getDoc(doc(db(SHEENA), 'workspaces', OTHER_WS, 'people', 'p1')));
  await assertSucceeds(getDocs(collection(db(SHEENA), 'workspaces', OTHER_WS, 'people')));
  await assertSucceeds(getDoc(doc(db(SHEENA), 'workspaces', OTHER_WS)));
  await assertSucceeds(getDocs(collection(db(SHEENA), 'workspaces', OTHER_WS, 'members')));
});

// 3
test('3. Manager can create/update/delete normal choir data', async () => {
  const d = db(PHILO);
  for (const col of ['people', 'clients', 'venues', 'eventTypes', 'events', 'tags']) {
    await assertSucceeds(setDoc(doc(d, 'workspaces', WS, col, 'x1'), { name: 'n' }));
    await assertSucceeds(updateDoc(doc(d, 'workspaces', WS, col, 'x1'), { name: 'm' }));
    await assertSucceeds(deleteDoc(doc(d, 'workspaces', WS, col, 'x1')));
  }
});

// 4
test('4. Non-member and unauthenticated are denied', async () => {
  await assertFails(getDoc(doc(db(OUTSIDER), 'workspaces', WS)));
  await assertFails(getDoc(doc(db(OUTSIDER), 'workspaces', WS, 'people', 'p1')));
  await assertFails(setDoc(doc(db(OUTSIDER), 'workspaces', WS, 'people', 'p9'), { name: 'x' }));
  await assertFails(getDoc(doc(db(OUTSIDER), 'workspaces', WS, 'members', PHILO)));
  await assertFails(getDoc(doc(anon(), 'workspaces', WS, 'people', 'p1')));
  await assertFails(getDoc(doc(anon(), 'workspaces', WS)));
  await assertFails(getDoc(doc(anon(), 'users', PHILO)));
});

// 5
test('5. Manager cannot make self Owner', async () => {
  const d = db(PHILO);
  await assertFails(updateDoc(doc(d, 'workspaces', WS, 'members', PHILO), { role: 'owner' }));
  await assertFails(setDoc(doc(d, 'workspaces', WS, 'members', PHILO), { uid: PHILO, role: 'owner', status: 'active' }));
  // cannot claim ownership on the workspace doc either
  await assertFails(updateDoc(doc(d, 'workspaces', WS), { ownerUid: PHILO }));
  await assertFails(updateDoc(doc(d, 'workspaces', WS), { ownerDisplayName: 'Philo' }));
  await assertFails(updateDoc(doc(d, 'workspaces', WS), { accessModel: null }));
});

// 6
test('6. Manager cannot make another user Owner', async () => {
  const d = db(SHEENA);
  await assertFails(updateDoc(doc(d, 'workspaces', OTHER_WS, 'members', SHEENA), { role: 'owner' }));
  // cannot write a member doc for somebody else
  await assertFails(setDoc(doc(d, 'workspaces', OTHER_WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'owner', status: 'active' }));
  await assertFails(setDoc(doc(d, 'workspaces', OTHER_WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'manager', status: 'active' }));
  // cannot create an owner invite
  await assertFails(setDoc(doc(d, 'invites', 'OWNERINV01'), {
    workspaceId: OTHER_WS, role: 'owner', status: 'active', createdByUid: SHEENA, createdAt: Timestamp.now(), expiresAt: future()
  }));
});

// 7
test('7. Owner cannot be silently removed/demoted by a Manager', async () => {
  const d = db(SHEENA);
  await assertFails(deleteDoc(doc(d, 'workspaces', OTHER_WS, 'members', ROE)));
  await assertFails(updateDoc(doc(d, 'workspaces', OTHER_WS, 'members', ROE), { role: 'manager' }));
  await assertFails(updateDoc(doc(d, 'workspaces', OTHER_WS, 'members', ROE), { status: 'removed' }));
  // owner cannot be deleted even by themselves via client; owner CAN remove a manager
  await assertFails(deleteDoc(doc(db(ROE), 'workspaces', OTHER_WS, 'members', ROE)));
  await assertSucceeds(deleteDoc(doc(db(ROE), 'workspaces', OTHER_WS, 'members', SHEENA)));
});

// 8
test('8. Manager can invite another Manager and revoke an unused invite', async () => {
  const d = db(PHILO);
  const ref = doc(d, 'invites', 'ELFEINV001');
  await assertSucceeds(setDoc(ref, {
    workspaceId: WS, workspaceName: 'ELFE', role: 'manager', status: 'active',
    createdByUid: PHILO, createdAt: serverTimestamp(), expiresAt: future()
  }));
  await assertSucceeds(updateDoc(ref, { status: 'revoked', revokedByUid: PHILO, revokedAt: serverTimestamp() }));
  // outsider can neither invite into nor revoke for this workspace
  await assertFails(setDoc(doc(db(OUTSIDER), 'invites', 'EVIL000001'), {
    workspaceId: WS, role: 'manager', status: 'active', createdByUid: OUTSIDER, createdAt: Timestamp.now(), expiresAt: future()
  }));
  // invite must be attributed to the actual creator
  await assertFails(setDoc(doc(d, 'invites', 'ELFEINV002'), {
    workspaceId: WS, role: 'manager', status: 'active', createdByUid: ROE, createdAt: Timestamp.now(), expiresAt: future()
  }));
  // expiry must be sane
  await assertFails(setDoc(doc(d, 'invites', 'ELFEINV003'), {
    workspaceId: WS, role: 'manager', status: 'active', createdByUid: PHILO, createdAt: Timestamp.now(), expiresAt: past()
  }));
});

// 9
test('9. Valid invite results in Manager membership', async () => {
  await seedInvite();
  const d = db(OUTSIDER);
  await assertSucceeds(getDoc(doc(d, 'invites', 'CODE123456')));
  await assertSucceeds(joinBatch(d, OUTSIDER, 'CODE123456').commit());
  await assertSucceeds(getDoc(doc(d, 'workspaces', OTHER_WS, 'people', 'p1')));
  const m = await getDoc(doc(d, 'workspaces', OTHER_WS, 'members', OUTSIDER));
  assert.equal(m.data().role, 'manager');
});

// 10
test('10. Invalid / reused / revoked / expired invite cannot join', async () => {
  const d = db(OUTSIDER);
  // nonexistent code
  await assertFails(joinBatch(d, OUTSIDER, 'NOPE000000').commit());

  // already used
  await seedInvite({ code: 'USEDINVITE', status: 'used', usedByUid: SHEENA });
  await assertFails(joinBatch(d, OUTSIDER, 'USEDINVITE').commit());

  // revoked
  await seedInvite({ code: 'REVOKEDINV', status: 'revoked' });
  await assertFails(joinBatch(d, OUTSIDER, 'REVOKEDINV').commit());

  // expired
  await seedInvite({ code: 'EXPIREDINV', expiresAt: past() });
  await assertFails(joinBatch(d, OUTSIDER, 'EXPIREDINV').commit());

  // one-time: second person cannot reuse after first success
  await seedInvite({ code: 'ONCEONLY01' });
  await assertSucceeds(joinBatch(d, OUTSIDER, 'ONCEONLY01').commit());
  await assertFails(joinBatch(db('uid_late'), 'uid_late', 'ONCEONLY01').commit());
});

// 11
test('11. User cannot join arbitrary workspace without a valid invitation / cannot pick role', async () => {
  const d = db(OUTSIDER);
  await assertFails(setDoc(doc(d, 'workspaces', OTHER_WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'manager', status: 'active' }));
  await assertFails(setDoc(doc(d, 'workspaces', WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'owner', status: 'active' }));
  // invite for workspace A cannot be used to join workspace B
  await seedInvite({ code: 'FORA000001', workspaceId: OTHER_WS });
  await assertFails(joinBatch(d, OUTSIDER, 'FORA000001', { ws: WS }).commit());
  // valid manager invite cannot be upgraded to owner by the joiner
  await seedInvite({ code: 'MGRINVITE1' });
  await assertFails(joinBatch(d, OUTSIDER, 'MGRINVITE1', { role: 'owner' }).commit());
  // member doc cannot be created without consuming the invite
  const b = writeBatch(d);
  b.set(doc(d, 'workspaces', OTHER_WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'manager', status: 'active', inviteId: 'MGRINVITE1', invitedByUid: ROE });
  await assertFails(b.commit());
  // forged membership hint without a real membership
  await assertFails(setDoc(doc(d, 'users', OUTSIDER, 'memberships', WS), { workspaceId: WS, role: 'owner' }));
});

// 12
test('12. User from workspace A cannot read workspace B', async () => {
  const d = db(PHILO);
  await assertSucceeds(getDoc(doc(d, 'workspaces', WS, 'people', 'p1')));
  await assertFails(getDoc(doc(d, 'workspaces', OTHER_WS, 'people', 'p1')));
  await assertFails(getDoc(doc(d, 'workspaces', OTHER_WS)));
  await assertFails(getDocs(collection(d, 'workspaces', OTHER_WS, 'members')));
  await assertFails(setDoc(doc(d, 'workspaces', OTHER_WS, 'people', 'p9'), { name: 'x' }));
  // cannot list invites of another workspace
  await seedInvite();
  await assertFails(getDocs(query(collection(d, 'invites'), where('workspaceId', '==', OTHER_WS))));
  await assertSucceeds(getDocs(query(collection(db(ROE), 'invites'), where('workspaceId', '==', OTHER_WS))));
});

// 13
test('13. Legacy QA workspace keeps working during transition (but is not a role)', async () => {
  const d = db(QA);
  await assertSucceeds(getDoc(doc(d, 'workspaces', LEGACY_WS)));
  await assertSucceeds(getDoc(doc(d, 'workspaces', LEGACY_WS, 'people', 'p1')));
  await assertSucceeds(setDoc(doc(d, 'workspaces', LEGACY_WS, 'events', 'e1'), { title: 'x' }));
  await assertSucceeds(updateDoc(doc(d, 'workspaces', LEGACY_WS), { name: 'Demo Workspace 2' }));
  await assertSucceeds(getDoc(doc(d, 'users', QA)));
  // others still locked out
  await assertFails(getDoc(doc(db(OUTSIDER), 'workspaces', LEGACY_WS, 'people', 'p1')));
  // legacy owner cannot self-flip to the members model or self-grant a membership
  await assertFails(updateDoc(doc(d, 'workspaces', LEGACY_WS), { accessModel: 'members' }));
  await assertFails(setDoc(doc(d, 'workspaces', LEGACY_WS, 'members', QA), { uid: QA, role: 'owner', status: 'active' }));
  // legacy owner cannot reassign ownerUid
  await assertFails(updateDoc(doc(d, 'workspaces', LEGACY_WS), { ownerUid: OUTSIDER }));
  // after migration (accessModel set, ownerUid nulled, Philo-like member) legacy fallback no longer applies
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    await updateDoc(doc(a, 'workspaces', LEGACY_WS), { accessModel: 'members', ownerUid: null, legacyOwnerUid: QA });
  });
  await assertFails(getDoc(doc(d, 'workspaces', LEGACY_WS, 'people', 'p1')));
});

// 14
test('14. Workspace creator flow produces a valid Owner membership', async () => {
  const d = db(OUTSIDER);
  const ws = 'ws_new1';
  const b = writeBatch(d);
  b.set(doc(d, 'workspaces', ws), { name: 'New Choir', accessModel: 'members', ownerUid: OUTSIDER, createdByUid: OUTSIDER, createdAt: serverTimestamp() });
  b.set(doc(d, 'workspaces', ws, 'members', OUTSIDER), { uid: OUTSIDER, role: 'owner', status: 'active', displayName: 'Out', joinedAt: serverTimestamp() });
  b.set(doc(d, 'users', OUTSIDER, 'memberships', ws), { workspaceId: ws, role: 'owner', workspaceName: 'New Choir' });
  b.set(doc(d, 'users', OUTSIDER), { email: 'o@x.test', displayName: 'Out', currentWorkspaceId: ws });
  await assertSucceeds(b.commit());
  await assertSucceeds(setDoc(doc(d, 'workspaces', ws, 'people', 'p1'), { name: 'A' }));

  // cannot create a workspace claiming someone else is owner, or without owner member, or legacy-style
  const e = writeBatch(d);
  e.set(doc(d, 'workspaces', 'ws_bad1'), { name: 'Bad', accessModel: 'members', ownerUid: ROE, createdByUid: OUTSIDER });
  e.set(doc(d, 'workspaces', 'ws_bad1', 'members', OUTSIDER), { uid: OUTSIDER, role: 'owner', status: 'active' });
  await assertFails(e.commit());
  await assertFails(setDoc(doc(d, 'workspaces', 'ws_bad2'), { name: 'Bad', accessModel: 'members', ownerUid: OUTSIDER, createdByUid: OUTSIDER }));
  await assertFails(setDoc(doc(d, 'workspaces', 'ws_bad3'), { name: 'Bad', ownerUid: OUTSIDER }));
  // cannot take over an existing workspace by writing an owner member for it
  const f = writeBatch(d);
  f.set(doc(d, 'workspaces', WS, 'members', OUTSIDER), { uid: OUTSIDER, role: 'owner', status: 'active' });
  await assertFails(f.commit());
});

// extras ---------------------------------------------------------------

test('E1. users/{uid} stays self-only', async () => {
  await assertSucceeds(setDoc(doc(db(PHILO), 'users', PHILO), { email: 'p@x.test', displayName: 'Philo' }));
  await assertFails(getDoc(doc(db(SHEENA), 'users', PHILO)));
  await assertFails(setDoc(doc(db(SHEENA), 'users', PHILO), { displayName: 'hax' }));
  await assertFails(deleteDoc(doc(db(PHILO), 'users', PHILO)));
});

test('E2. Manager may leave; manager cannot remove another manager; display name self-edit only', async () => {
  await assertSucceeds(updateDoc(doc(db(SHEENA), 'workspaces', OTHER_WS, 'members', SHEENA), { displayName: 'Sheena K', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db(ROE), 'workspaces', OTHER_WS, 'members', SHEENA), { displayName: 'forged' }));
  await assertSucceeds(deleteDoc(doc(db(SHEENA), 'workspaces', OTHER_WS, 'members', SHEENA)));
});

test('E3. Future Owner (Roe) links to ELFE only through an admin-created owner invite', async () => {
  // client cannot create it
  await assertFails(setDoc(doc(db(ROE), 'invites', 'ROEOWNER01'), {
    workspaceId: WS, role: 'owner', status: 'active', createdByUid: ROE, createdAt: Timestamp.now(), expiresAt: future()
  }));
  // admin creates it (security disabled == Admin SDK)
  await seedInvite({ code: 'ROEOWNER01', workspaceId: WS, workspaceName: 'ELFE', role: 'owner', createdByUid: PHILO });
  const d = db(ROE);
  const b = writeBatch(d);
  b.update(doc(d, 'invites', 'ROEOWNER01'), { status: 'used', usedByUid: ROE, usedAt: serverTimestamp() });
  b.set(doc(d, 'workspaces', WS, 'members', ROE), { uid: ROE, role: 'owner', status: 'active', displayName: 'Roe Vincent', inviteId: 'ROEOWNER01', invitedByUid: PHILO, joinedAt: serverTimestamp() });
  b.update(doc(d, 'workspaces', WS), { ownerUid: ROE, updatedAt: serverTimestamp() });
  await assertSucceeds(b.commit());
  // history preserved
  await assertSucceeds(getDoc(doc(d, 'workspaces', WS, 'people', 'p1')));
  // now a Manager cannot remove him
  await assertFails(deleteDoc(doc(db(PHILO), 'workspaces', WS, 'members', ROE)));
});

test('E4. Manager cannot link themselves as owner on ELFE (ownerUid null)', async () => {
  await assertFails(updateDoc(doc(db(PHILO), 'workspaces', WS), { ownerUid: PHILO, updatedAt: serverTimestamp() }));
});

test('E5. Cannot delete workspace; default deny elsewhere', async () => {
  await assertFails(deleteDoc(doc(db(ROE), 'workspaces', OTHER_WS)));
  await assertFails(setDoc(doc(db(ROE), 'random', 'x'), { a: 1 }));
});
