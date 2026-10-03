// Exercises scripts/migrate-workspace.mjs against the LOCAL Firestore emulator only.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PHILO = 'iRpo3c9tuaQ6ebbcdcOhbCsndgv1', WS = 'ws_iRpo3c9t';
let env;
const run = (...args) => spawnSync('node', ['../scripts/migrate-workspace.mjs', '--project', 'demo-choir-test', ...args],
  { cwd: new URL('.', import.meta.url).pathname, env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }, encoding: 'utf8' });

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-choir-test', firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    await setDoc(doc(a, 'users', PHILO), { email: 'philo@x.test', displayName: 'philoritavarsha12', currentWorkspaceId: WS });
    await setDoc(doc(a, 'workspaces', WS), { name: 'Choir Workspace', ownerUid: PHILO });
    await setDoc(doc(a, 'workspaces', WS, 'eventTypes', 'event_type_performance'), { name: 'Performance' });
    await setDoc(doc(a, 'workspaces', WS, 'people', 'p1'), { name: 'Anna' });
  });
});
after(() => env.cleanup());

const adminGet = async (...path) => { let v; await env.withSecurityRulesDisabled(async (ctx) => { v = (await getDoc(doc(ctx.firestore(), ...path))).data(); }); return v; };
const wsDoc = () => adminGet('workspaces', WS);

test('dry run writes nothing', async () => {
  const r = run('--workspace', WS, '--mode', 'legacy-owner-as-manager', '--workspace-name', 'ELFE', '--owner-name', 'Roe Vincent', '--manager-name', 'Philo');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DRY RUN \(no writes\)/);
  assert.match(r.stdout, /Nothing written/);
  assert.equal((await wsDoc()).accessModel, undefined);
});

test('--apply without matching --confirm is refused', async () => {
  const r = run('--workspace', WS, '--mode', 'legacy-owner-as-manager', '--owner-name', 'Roe Vincent', '--apply');
  assert.equal(r.status, 3);
  assert.equal((await wsDoc()).accessModel, undefined);
  const r2 = run('--workspace', WS, '--mode', 'legacy-owner-as-manager', '--owner-name', 'Roe Vincent', '--apply', '--confirm', 'ws_wrong');
  assert.equal(r2.status, 3);
});

test('manager mode requires --owner-name', async () => {
  const r = run('--workspace', WS, '--mode', 'legacy-owner-as-manager');
  assert.equal(r.status, 2);
});

test('apply migrates: Philo Manager, Roe pending Owner, data preserved, access continues', async () => {
  const r = run('--workspace', WS, '--mode', 'legacy-owner-as-manager', '--workspace-name', 'ELFE', '--owner-name', 'Roe Vincent', '--manager-name', 'Philo', '--apply', '--confirm', WS);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /Committed 4 writes atomically/);
  const w = await wsDoc();
  assert.equal(w.name, 'ELFE'); assert.equal(w.accessModel, 'members'); assert.equal(w.ownerUid, null);
  assert.equal(w.ownerDisplayName, 'Roe Vincent'); assert.equal(w.legacyOwnerUid, PHILO);
  const d = env.authenticatedContext(PHILO).firestore();
  const m = await assertSucceeds(getDoc(doc(d, 'workspaces', WS, 'members', PHILO)));
  assert.equal(m.data().role, 'manager');
  assert.equal((await assertSucceeds(getDoc(doc(d, 'workspaces', WS, 'people', 'p1')))).data().name, 'Anna');
  assert.equal((await assertSucceeds(getDoc(doc(d, 'users', PHILO)))).data().displayName, 'Philo');
  assert.equal((await assertSucceeds(getDoc(doc(d, 'users', PHILO, 'memberships', WS)))).data().role, 'manager');
  await assertFails(setDoc(doc(d, 'workspaces', WS, 'members', PHILO), { uid: PHILO, role: 'owner', status: 'active' }));
});

test('idempotent re-run is a no-op', async () => {
  const r = run('--workspace', WS, '--mode', 'legacy-owner-as-manager', '--owner-name', 'Roe Vincent', '--apply', '--confirm', WS);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Already migrated/);
});

test('owner invite can be minted for the pending owner (and only after migration)', async () => {
  const dry = run('--workspace', WS, '--create-owner-invite');
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /DRY RUN/);
  const r = run('--workspace', WS, '--create-owner-invite', '--apply', '--confirm', WS);
  assert.equal(r.status, 0, r.stderr);
  const code = r.stdout.match(/OWNER INVITE CODE \(share privately\): (\w+)/)[1];
  const inv = await adminGet('invites', code);
  assert.equal(inv.role, 'owner'); assert.equal(inv.workspaceId, WS); assert.equal(inv.status, 'active');
});

test('QA-style backfill: legacy owner becomes Owner member', async () => {
  const QA = 'qaUid1';
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    await setDoc(doc(a, 'users', QA), { email: 'demo@choirmanager.test', displayName: 'Demo', currentWorkspaceId: 'ws_qa' });
    await setDoc(doc(a, 'workspaces', 'ws_qa'), { name: 'Demo Workspace', ownerUid: QA });
  });
  const r = run('--workspace', 'ws_qa', '--mode', 'legacy-owner-as-owner', '--apply', '--confirm', 'ws_qa');
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const d = env.authenticatedContext(QA).firestore();
  assert.equal((await assertSucceeds(getDoc(doc(d, 'workspaces', 'ws_qa', 'members', QA)))).data().role, 'owner');
  assert.equal((await assertSucceeds(getDoc(doc(d, 'workspaces', 'ws_qa')))).data().ownerUid, QA);
});
