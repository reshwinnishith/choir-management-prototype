import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const servicesCode = fs.readFileSync(path.join(__dirname, '../services.js'), 'utf8');

function createTestEnv() {
  const store = new Map(); // key -> document object
  let authListener = null;

  const makeKey = (segments) => segments.filter(Boolean).join('/');
  const mockDb = { _id: 'mock_db' };

  const SDK = {
    initializeApp() { return {}; },
    getAuth() { return {}; },
    getFirestore() { return mockDb; },
    onAuthStateChanged(auth, cb) {
      authListener = cb;
    },
    doc(db, ...segments) {
      const p = makeKey(segments);
      return { path: p, id: segments[segments.length - 1] };
    },
    collection(db, ...segments) {
      return { path: makeKey(segments) };
    },
    async getDoc(ref) {
      const val = store.get(ref.path);
      return {
        id: ref.id,
        exists: () => Boolean(val),
        data: () => (val ? { ...val } : undefined)
      };
    },
    async setDoc(ref, data, opts) {
      const existing = store.get(ref.path) || {};
      const next = (opts && opts.merge) ? { ...existing, ...data } : { ...data };
      store.set(ref.path, { ...next });
    },
    async updateDoc(ref, data) {
      const existing = store.get(ref.path);
      if (!existing) throw new Error('Document does not exist: ' + ref.path);
      const next = { ...existing, ...data };
      store.set(ref.path, { ...next });
    },
    async deleteDoc(ref) {
      store.delete(ref.path);
    },
    writeBatch(db) {
      const ops = [];
      return {
        set(ref, data, opts) { ops.push({ type: 'set', ref, data, opts }); },
        update(ref, data) { ops.push({ type: 'update', ref, data }); },
        delete(ref) { ops.push({ type: 'delete', ref }); },
        async commit() {
          for (const op of ops) {
            if (op.type === 'set') {
              const existing = store.get(op.ref.path) || {};
              const next = (op.opts && op.opts.merge) ? { ...existing, ...op.data } : { ...op.data };
              store.set(op.ref.path, { ...next });
            } else if (op.type === 'update') {
              const existing = store.get(op.ref.path);
              if (!existing) throw new Error('Doc not found: ' + op.ref.path);
              store.set(op.ref.path, { ...existing, ...op.data });
            } else if (op.type === 'delete') {
              store.delete(op.ref.path);
            }
          }
        }
      };
    },
    serverTimestamp() {
      return { _serverTimestamp: true, toDate: () => new Date() };
    },
    query(collRef, ...constraints) {
      return { collPath: collRef.path };
    },
    where(field, op, val) {
      return { field, op, val };
    },
    async getDocs(q) {
      const prefix = q.path || q.collPath;
      const docs = [];
      for (const [k, v] of store.entries()) {
        const lastSlash = k.lastIndexOf('/');
        const parentPath = lastSlash !== -1 ? k.substring(0, lastSlash) : '';
        if (parentPath === prefix) {
          docs.push({
            id: k.substring(lastSlash + 1),
            data: () => ({ ...v })
          });
        }
      }
      return {
        forEach(cb) { docs.forEach(cb); },
        docs,
        size: docs.length
      };
    }
  };

  const windowMock = {
    location: { origin: 'http://localhost', search: '' },
    crypto: { getRandomValues: (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; } },
    FirebaseSDK: SDK,
    FIREBASE_WEB_CONFIG: { projectId: 'test' },
    USE_FIREBASE_EMULATOR: false
  };

  const sandbox = {
    window: windowMock,
    document: {},
    localStorage: {
      _store: new Map(),
      getItem(k) { return this._store.get(k) || null; },
      setItem(k, v) { this._store.set(k, String(v)); },
      removeItem(k) { this._store.delete(k); }
    },
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    setTimeout,
    clearTimeout
  };

  vm.createContext(sandbox);
  vm.runInContext(servicesCode, sandbox);

  // Initialize auth
  sandbox.window.authService.init(() => {});

  async function signInAs(user, displayName = '') {
    store.set(`users/${user.uid}`, {
      email: user.email,
      displayName: displayName || user.displayName || 'Test User'
    });
    await authListener(user);
  }

  return {
    sandbox,
    store,
    SDK,
    signInAs,
    workspaceService: sandbox.window.workspaceService,
    authService: sandbox.window.authService
  };
}

describe('V1.9B Ownership-Link Fix Test Suite', () => {

  // Test 1: Manager invite
  test('1. Manager invite creates Manager membership, consumes invite, and does NOT alter workspace.ownerUid', async () => {
    const env = createTestEnv();
    const wsId = 'ws_elfe';
    const invCode = 'MGRINVITE1';
    const managerUid = 'uid_sheena';

    // Seed migrated ELFE workspace with ownerUid: null (pending Roe Vincent)
    env.store.set(`workspaces/${wsId}`, {
      name: 'ELFE',
      accessModel: 'members',
      ownerUid: null,
      ownerDisplayName: 'Roe Vincent',
      createdByUid: 'uid_philo'
    });

    // Seed existing choir data (people)
    env.store.set(`workspaces/${wsId}/people/p_philo`, { name: 'Anna Philo', active: true });

    // Seed valid Manager invite
    env.store.set(`invites/${invCode}`, {
      workspaceId: wsId,
      workspaceName: 'ELFE',
      role: 'manager',
      status: 'active',
      createdByUid: 'uid_philo',
      expiresAt: { toDate: () => new Date(Date.now() + 864e5) }
    });

    // User Sheena signs in
    await env.signInAs({ uid: managerUid, email: 'sheena@elfe.org' }, 'Sheena');

    // Consume Manager invite
    const freshWs = await env.workspaceService.joinWithInvite(invCode);

    // 1. Membership created with role 'manager'
    const memberDoc = env.store.get(`workspaces/${wsId}/members/${managerUid}`);
    assert.ok(memberDoc, 'Member doc exists');
    assert.equal(memberDoc.role, 'manager');
    assert.equal(memberDoc.status, 'active');
    assert.equal(memberDoc.displayName, 'Sheena');

    // 2. Invite marked as used
    const invDoc = env.store.get(`invites/${invCode}`);
    assert.equal(invDoc.status, 'used');
    assert.equal(invDoc.usedByUid, managerUid);

    // 3. CRITICAL: workspace.ownerUid MUST REMAIN NULL
    const wsDoc = env.store.get(`workspaces/${wsId}`);
    assert.equal(wsDoc.ownerUid, null, 'Manager invite must NOT alter workspace.ownerUid');
    assert.equal(wsDoc.ownerDisplayName, 'Roe Vincent');

    // 4. Choir data preserved
    const personDoc = env.store.get(`workspaces/${wsId}/people/p_philo`);
    assert.ok(personDoc);
    assert.equal(personDoc.name, 'Anna Philo');

    // 5. Returned workspace object reflects manager role
    assert.equal(freshWs.role, 'manager');
    assert.equal(freshWs.ownerUid, null);
  });

  // Test 2: Admin-created Owner invite
  test('2. Admin-created Owner invite creates Owner membership, consumes invite, updates workspace.ownerUid, preserves ownerDisplayName and choir data', async () => {
    const env = createTestEnv();
    const wsId = 'ws_elfe';
    const invCode = 'ROEOWNER01';
    const roeUid = 'uid_roe_vincent';

    // Seed migrated ELFE workspace with ownerUid: null
    env.store.set(`workspaces/${wsId}`, {
      name: 'ELFE',
      accessModel: 'members',
      ownerUid: null,
      ownerDisplayName: 'Roe Vincent',
      createdByUid: 'uid_philo'
    });

    // Seed existing choir data
    env.store.set(`workspaces/${wsId}/people/p_philo`, { name: 'Anna Philo', active: true });
    env.store.set(`workspaces/${wsId}/people/p_sheena`, { name: 'Added By Sheena', active: true });
    env.store.set(`workspaces/${wsId}/events/evt_gala`, { name: 'Gala Night', budget: 150000 });

    // Seed admin-created Owner invite
    env.store.set(`invites/${invCode}`, {
      workspaceId: wsId,
      workspaceName: 'ELFE',
      role: 'owner',
      status: 'active',
      createdByUid: 'uid_philo',
      expiresAt: { toDate: () => new Date(Date.now() + 864e5) }
    });

    // Roe signs in
    await env.signInAs({ uid: roeUid, email: 'roe@elfechoir.org' }, 'Roe Vincent');

    // Roe consumes Owner invite
    const freshWs = await env.workspaceService.joinWithInvite(invCode);

    // 1. Membership created with role 'owner'
    const memberDoc = env.store.get(`workspaces/${wsId}/members/${roeUid}`);
    assert.ok(memberDoc, 'Owner member doc exists');
    assert.equal(memberDoc.role, 'owner');
    assert.equal(memberDoc.status, 'active');
    assert.equal(memberDoc.displayName, 'Roe Vincent');

    // 2. Invite marked as used
    const invDoc = env.store.get(`invites/${invCode}`);
    assert.equal(invDoc.status, 'used');
    assert.equal(invDoc.usedByUid, roeUid);

    // 3. CRITICAL: workspace.ownerUid MUST NOW BE UPDATED TO ROE'S UID
    const wsDoc = env.store.get(`workspaces/${wsId}`);
    assert.equal(wsDoc.ownerUid, roeUid, 'Owner invite MUST update workspace.ownerUid to joining user UID');

    // 4. ownerDisplayName preserved
    assert.equal(wsDoc.ownerDisplayName, 'Roe Vincent', 'ownerDisplayName must be preserved');

    // 5. Existing choir data preserved
    assert.equal(env.store.get(`workspaces/${wsId}/people/p_philo`).name, 'Anna Philo');
    assert.equal(env.store.get(`workspaces/${wsId}/people/p_sheena`).name, 'Added By Sheena');
    assert.equal(env.store.get(`workspaces/${wsId}/events/evt_gala`).budget, 150000);

    // 6. Returned workspace object reflects owner role and ownerUid
    assert.equal(freshWs.role, 'owner');
    assert.equal(freshWs.ownerUid, roeUid);
  });

  // Test 3: User cannot turn Manager invite into Owner
  test('3. Role comes strictly from invite document (cannot turn Manager invite into Owner)', async () => {
    const env = createTestEnv();
    const wsId = 'ws_elfe';
    const invCode = 'MGRINVITE2';

    env.store.set(`workspaces/${wsId}`, {
      name: 'ELFE',
      accessModel: 'members',
      ownerUid: null,
      ownerDisplayName: 'Roe Vincent'
    });

    // Invite has role 'manager'
    env.store.set(`invites/${invCode}`, {
      workspaceId: wsId,
      workspaceName: 'ELFE',
      role: 'manager',
      status: 'active',
      createdByUid: 'uid_philo',
      expiresAt: { toDate: () => new Date(Date.now() + 864e5) }
    });

    // User attempts to claim they are Owner
    await env.signInAs({ uid: 'uid_malicious', email: 'malicious@test.dev' }, 'Attacker');

    // joinWithInvite only accepts rawCode; role is derived strictly from raw.role on server
    const freshWs = await env.workspaceService.joinWithInvite(invCode);

    // Member doc role MUST be manager
    const memberDoc = env.store.get(`workspaces/${wsId}/members/uid_malicious`);
    assert.equal(memberDoc.role, 'manager');
    assert.notEqual(memberDoc.role, 'owner');

    // workspace.ownerUid MUST remain null
    const wsDoc = env.store.get(`workspaces/${wsId}`);
    assert.equal(wsDoc.ownerUid, null);
  });

  // Test 4: Reused/revoked/expired Owner invite still fails
  test('4. Reused, revoked, or expired Owner invites are strictly rejected', async () => {
    const env = createTestEnv();
    const wsId = 'ws_elfe';

    env.store.set(`workspaces/${wsId}`, {
      name: 'ELFE',
      accessModel: 'members',
      ownerUid: null,
      ownerDisplayName: 'Roe Vincent'
    });

    await env.signInAs({ uid: 'uid_late_roe', email: 'roe@elfechoir.org' }, 'Roe Vincent');

    // Case A: Reused invite (status !== 'active')
    env.store.set(`invites/USED_OWNER`, {
      workspaceId: wsId, role: 'owner', status: 'used',
      expiresAt: { toDate: () => new Date(Date.now() + 864e5) }
    });
    await assert.rejects(
      async () => env.workspaceService.joinWithInvite('USED_OWNER'),
      (err) => err.code === 'invite-invalid'
    );

    // Case B: Revoked invite
    env.store.set(`invites/REVOKED_OWNER`, {
      workspaceId: wsId, role: 'owner', status: 'revoked',
      expiresAt: { toDate: () => new Date(Date.now() + 864e5) }
    });
    await assert.rejects(
      async () => env.workspaceService.joinWithInvite('REVOKED_OWNER'),
      (err) => err.code === 'invite-invalid'
    );

    // Case C: Expired invite
    env.store.set(`invites/EXPIRED_OWNER`, {
      workspaceId: wsId, role: 'owner', status: 'active',
      expiresAt: { toDate: () => new Date(Date.now() - 1000) } // past
    });
    await assert.rejects(
      async () => env.workspaceService.joinWithInvite('EXPIRED_OWNER'),
      (err) => err.code === 'invite-invalid'
    );

    // Confirm workspace.ownerUid is still null
    const wsDoc = env.store.get(`workspaces/${wsId}`);
    assert.equal(wsDoc.ownerUid, null);
  });

});
