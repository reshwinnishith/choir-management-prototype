// Browser E2E against LOCAL emulators only (Auth 9099, Firestore 8080). No production access.
// Run: cd tests && npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'demo-choir-test';
let server, base, browser, env, admin;
const consoleErrors = [];
const productionHits = [];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

async function authSignUp(email, password) {
  const r = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  return (await r.json()).localId;
}

before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = u.pathname === '/' ? '/index.html' : u.pathname;
    if (f === '/firebase-config.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end(`window.FIREBASE_WEB_CONFIG={apiKey:'fake',authDomain:'localhost',projectId:'${PROJECT}',appId:'1:1:web:1'};window.USE_FIREBASE_EMULATOR=true;`);
    }
    const fp = path.join(ROOT, f);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(fs.readFileSync(fp));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8') }
  });
});
after(async () => {
  await browser?.close();
  await env?.cleanup();
  server?.close();
});

async function newPage(w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      // permission-denied probes (e.g. non-member resolve) are logged by the SDK; track separately
      consoleErrors.push(`${t}`);
    }
  });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR ' + e.message));
  page.on('request', r => { if (/choir-manager-46446|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com\/v1\/accounts:(?!signUp|signInWithPassword|lookup|sendOobCode)/.test(r.url()) && !r.url().includes('127.0.0.1')) productionHits.push(r.url()); });
  return page;
}
const text = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim();
async function signIn(page, email, pw = 'secret12') {
  await page.goto(base + '/');
  await page.waitForSelector('#authFormPanel', { state: 'visible' });
  await page.fill('#authEmail', email);
  await page.fill('#authPassword', pw);
  await page.click('#authSubmitBtn');
}
async function signUp(page, email, name, pw = 'secret12') {
  await page.goto(base + (page._inviteQuery || '/'));
  await page.waitForSelector('#authFormPanel', { state: 'visible' });
  await page.click('#authTabSignUp');
  await page.fill('#authEmail', email);
  await page.fill('#authPassword', pw);
  await page.fill('#authDisplayName', name);
  await page.click('#authSubmitBtn');
}
async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
}

let philoUid, qaUid, inviteCode, inviteCode2;

test('seed: legacy Philo (pre-migration) + legacy QA accounts', async () => {
  philoUid = await authSignUp('philo@test.dev', 'secret12');
  qaUid = await authSignUp('demo@choirmanager.test', 'secret12');
  await env.withSecurityRulesDisabled(async (ctx) => {
    admin = ctx.firestore();
    await setDoc(doc(admin, 'users', philoUid), { email: 'philo@test.dev', displayName: 'philo', currentWorkspaceId: 'ws_philo' });
    await setDoc(doc(admin, 'workspaces', 'ws_philo'), { name: 'Choir Workspace', ownerUid: philoUid });
    await setDoc(doc(admin, 'workspaces', 'ws_philo', 'people', 'p_a'), { id: 'p_a', name: 'Anna Philo', gender: 'Female', tagIds: [], active: true });
    await setDoc(doc(admin, 'users', qaUid), { email: 'demo@choirmanager.test', displayName: 'Demo', currentWorkspaceId: 'ws_qa' });
    await setDoc(doc(admin, 'workspaces', 'ws_qa'), { name: 'Demo Workspace', ownerUid: qaUid });
    await setDoc(doc(admin, 'workspaces', 'ws_qa', 'people', 'p_q'), { id: 'p_q', name: 'Qa Singer', gender: 'Male', tagIds: [], active: true });
  });
});

test('legacy QA still works, shows its own data, name not prompted', async () => {
  const page = await newPage();
  await signIn(page, 'demo@choirmanager.test');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeWelcomeTitle'), /Hello, Demo/);
  assert.match(await text(page, '#homeSubHeader'), /Manager · Demo Workspace/);
  assert.equal(await page.evaluate(() => peopleService.getAll().map(p => p.name).join()), 'Qa Singer');
  assert.equal(await page.locator('#displayNameModal.open').count(), 0);
  await page.context().close();
});

test('legacy Philo: email-derived name is prompted, never shown as greeting', async () => {
  const page = await newPage();
  await signIn(page, 'philo@test.dev');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  await page.waitForSelector('#displayNameModal.open');
  assert.doesNotMatch(await text(page, '#homeWelcomeTitle'), /philo/i);
  await page.fill('#displayNameInput', 'Philo');
  await page.click('#displayNameModal .btn.primary');
  await page.waitForFunction(() => document.getElementById('homeWelcomeTitle').textContent.includes('Philo'));
  assert.match(await text(page, '#homeWelcomeTitle'), /Hello, Philo 👋/);
  assert.match(await text(page, '#homeSubHeader'), /Manager · Choir Workspace/);

  // Settings: legacy workspace shows current user only, no invites yet
  await page.evaluate(() => openSettings());
  await page.waitForSelector('#settingsTeamList >> text=Philo');
  assert.equal(await page.locator('#settingsInviteArea').isVisible(), false);
  // session persistence
  await page.reload();
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeWelcomeTitle'), /Hello, Philo 👋/);
  await page.context().close();
});

test('ADMIN dry-run of ELFE migration (emulator): Philo -> Manager, Roe pending owner', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const a = ctx.firestore();
    await updateDoc(doc(a, 'workspaces', 'ws_philo'), { name: 'ELFE', accessModel: 'members', ownerUid: null, ownerDisplayName: 'Roe Vincent', legacyOwnerUid: philoUid, createdByUid: philoUid });
    await setDoc(doc(a, 'workspaces', 'ws_philo', 'members', philoUid), { uid: philoUid, role: 'manager', status: 'active', displayName: 'Philo', invitedByUid: null });
    await setDoc(doc(a, 'users', philoUid, 'memberships', 'ws_philo'), { workspaceId: 'ws_philo', workspaceName: 'ELFE', role: 'manager' });
  });
});

test('Philo after migration: Manager · ELFE, Roe shown as Owner / Account not connected, can invite', async () => {
  const page = await newPage();
  await signIn(page, 'philo@test.dev');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeWelcomeTitle'), /Hello, Philo 👋/);
  assert.match(await text(page, '#homeSubHeader'), /^Manager · ELFE$/);
  await page.evaluate(() => openSettings());
  await page.waitForSelector('#settingsTeamList >> text=Roe Vincent');
  const team = await text(page, '#settingsTeamList');
  assert.match(team, /Roe Vincent Owner · Account not connected/);
  assert.match(team, /Philo \(you\) Manager/);
  assert.doesNotMatch(team, /Sheena/);
  // Managers cannot remove anyone
  assert.equal(await page.locator('#settingsTeamList button').count(), 0);

  await page.click('#settingsInviteBtn');
  await page.waitForSelector('#settingsInviteResult', { state: 'visible' });
  const res = await text(page, '#settingsInviteResult');
  inviteCode = res.match(/\b([A-Z2-9]{10})\b/)[1];
  assert.ok(inviteCode);
  assert.match(res, new RegExp(`\\?invite=${inviteCode}`));
  // second invite, then revoke it
  await page.click('#settingsInviteBtn');
  await page.waitForFunction(() => document.querySelectorAll('#settingsInviteList button').length === 2);
  const codes = await page.$$eval('#settingsInviteList b', els => els.map(e => e.textContent));
  inviteCode2 = codes.find(c => c !== inviteCode);
  page.once('dialog', d => d.accept());
  await page.locator(`#settingsInviteList button`).nth(codes.indexOf(inviteCode2)).click();
  await page.waitForFunction(() => document.querySelectorAll('#settingsInviteList button').length === 1);
  await page.context().close();
});

test('Sheena: own account, joins ELFE via invite LINK, role from invite, sees ELFE data', async () => {
  const page = await newPage();
  page._inviteQuery = `/?invite=${inviteCode}`;
  await signUp(page, 'sheena@test.dev', 'Sheena');
  await page.waitForSelector('#authJoinPanel', { state: 'visible' });
  assert.equal(await page.inputValue('#joinInviteCode'), inviteCode);
  assert.ok(!page.url().includes('invite='), 'invite stripped from address bar');
  await page.click('#joinWsBtn');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeWelcomeTitle'), /Hello, Sheena 👋/);
  assert.match(await text(page, '#homeSubHeader'), /^Manager · ELFE$/);
  assert.equal(await page.evaluate(() => peopleService.getAll().map(p => p.name).join()), 'Anna Philo');
  await page.evaluate(() => openSettings());
  await page.waitForSelector('#settingsTeamList >> text=Sheena');
  const team = await text(page, '#settingsTeamList');
  assert.match(team, /Roe Vincent Owner · Account not connected/);
  assert.match(team, /Philo Manager/);
  assert.match(team, /Sheena \(you\) Manager/);
  // can do operational writes as Manager
  await page.evaluate(async () => { closeModal('settingsModal'); await peopleService.create({ name: 'Added By Sheena' }); });
  await page.context().close();
});

test('invite reuse / revoked / garbage are rejected calmly; no membership leaks', async () => {
  const page = await newPage();
  await signUp(page, 'outsider@test.dev', 'Outsider');
  await page.waitForSelector('#authOnboardPanel', { state: 'visible' });
  await page.click('#authOnboardPanel >> text=Join a Workspace');
  for (const code of [inviteCode, inviteCode2, 'NOTACODE12', '']) {
    await page.fill('#joinInviteCode', code);
    await page.click('#joinWsBtn');
    await page.waitForSelector('#joinNotice', { state: 'visible' });
    const msg = await text(page, '#joinNotice');
    assert.match(msg, code ? /not valid|Please enter/ : /Please enter/);
    assert.equal(await page.locator('#appContainer').isVisible(), false);
  }
  await page.context().close();
});

test('new user creates own workspace -> Owner; multi-workspace switch has no data leakage', async () => {
  // fresh invite for ELFE from Philo (admin-created for test speed, shape identical to client's)
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'invites', 'SWITCHTEST1'), {
      workspaceId: 'ws_philo', workspaceName: 'ELFE', role: 'manager', status: 'active',
      createdByUid: philoUid, createdAt: new Date(), expiresAt: new Date(Date.now() + 864e5)
    });
  });
  const page = await newPage();
  await signUp(page, 'multi@test.dev', 'Multi');
  await page.waitForSelector('#authOnboardPanel', { state: 'visible' });
  await page.click('#authOnboardPanel >> text=Create a Workspace');
  await page.fill('#createWsName', 'Multi Choir');
  await page.click('#createWsBtn');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeSubHeader'), /^Owner · Multi Choir$/);
  assert.equal(await page.evaluate(() => peopleService.getAll().length), 0);
  assert.ok((await page.evaluate(() => eventTypeService.getAll().length)) >= 3);
  await page.evaluate(async () => { await peopleService.create({ name: 'Only In Multi' }); });

  // join ELFE from Settings -> + Join Workspace
  await page.evaluate(() => openSettings());
  await page.click('#settingsWorkspacesSection >> text=Join Workspace');
  await page.waitForSelector('#authJoinPanel', { state: 'visible' });
  assert.equal(await page.locator('#onboardCancelBtn').count(), 1);
  await page.fill('#joinInviteCode', 'SWITCHTEST1');
  await page.click('#joinWsBtn');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeSubHeader'), /^Manager · ELFE$/);
  let names = await page.evaluate(() => peopleService.getAll().map(p => p.name).sort().join('|'));
  assert.ok(!names.includes('Only In Multi'), 'no leak from previous workspace');
  assert.ok(names.includes('Anna Philo'));

  // switch back to Multi Choir
  await page.evaluate(() => openSettings());
  const list = await text(page, '#settingsWorkspaceList');
  assert.match(list, /Multi Choir Owner/);
  assert.match(list, /✓ ELFE Manager/);
  await page.click('#settingsWorkspaceList >> text=Multi Choir');
  await page.waitForFunction(() => document.getElementById('homeSubHeader').textContent.includes('Multi Choir'));
  names = await page.evaluate(() => peopleService.getAll().map(p => p.name).join('|'));
  assert.equal(names, 'Only In Multi');
  // Owner sees Remove on managers only in a workspace with managers; here just self
  await page.reload();
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeSubHeader'), /^Owner · Multi Choir$/); // currentWorkspaceId persisted
  await page.context().close();
});

test('existing flows survive: CRUD, enquiry, confirm, lineup, duplicate, copy lineup, INR format, screens', async () => {
  const page = await newPage();
  await signIn(page, 'philo@test.dev');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  const out = await page.evaluate(async () => {
    const r = {};
    const person = await peopleService.create({ name: 'Zed Singer' });
    const client = await clientService.create({ name: 'Client A' });
    const venue = await venueService.create({ name: 'Hall A', city: 'Chennai', state: 'Tamil Nadu' });
    const et = await eventTypeService.create({ name: 'Wedding Special' });
    const ev = await eventService.create({ name: 'Enq 1', date: '2026-12-01', status: 'enquiry', clientId: client.id, venueId: venue.id, eventTypeId: et.id, budget: 1234567, assignedSingers: [{ personId: person.id, status: 'Asked' }] });
    await eventService.update(ev.id, { status: 'confirmed' });
    const dup = await eventService.duplicate(ev.id, '2026-12-08', true);
    const dup2 = await eventService.duplicate(ev.id, '2026-12-15', false);
    await eventService.copyLineup(dup2.id, ev.id);
    r.confirmed = eventService.getById(ev.id).status;
    r.dupLineup = eventService.getById(dup.id).assignedSingers.length;
    r.copied = eventService.getById(dup2.id).assignedSingers.length;
    r.inr = formatMoneyIN(1234567);
    for (const s of ['home', 'calendar', 'singers', 'statistics']) go(s);
    return r;
  }).catch(e => ({ err: String(e) }));
  assert.equal(out.err, undefined, out.err);
  assert.equal(out.confirmed, 'confirmed');
  assert.equal(out.dupLineup, 1);
  assert.equal(out.copied, 1);
  assert.match(out.inr, /₹\s?12,34,567/);
  // persisted in Firestore (reload)
  await page.reload();
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.ok((await page.evaluate(() => eventService.getAll().length)) >= 3);
  await page.context().close();
});

test('password reset UI still works', async () => {
  const page = await newPage();
  await page.goto(base + '/');
  await page.waitForSelector('#authFormPanel', { state: 'visible' });
  await page.fill('#authEmail', 'philo@test.dev');
  await page.click('text=Forgot password?');
  await page.click('#resetSubmitBtn');
  await page.waitForSelector('#resetNotice.notice-success');
  await page.click('text=Back to Sign In');
  assert.equal(await page.locator('#authFormPanel').isVisible(), true);
  await page.context().close();
});

test('demo mode stays isolated (no Auth/Firestore calls, no workspace UI)', async () => {
  const page = await newPage();
  const hits = [];
  page.on('request', r => { if (/:9099|:8080/.test(r.url())) hits.push(r.url()); });
  await page.goto(base + '/?demo=1');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.match(await text(page, '#homeWelcomeTitle'), /Demo Mode/);
  await page.evaluate(() => openSettings());
  assert.equal(await page.locator('#settingsTeamSection').isVisible(), false);
  assert.equal(await page.locator('#settingsWorkspacesSection').isVisible(), false);
  assert.equal(await page.locator('#settingsEditNameBtn').isVisible(), false);
  // invite param is ignored in demo mode
  await page.goto(base + '/?demo=1&invite=ABCDEFGHJK');
  await page.waitForSelector('#appContainer', { state: 'visible' });
  assert.equal(hits.length, 0, hits.join());
  await page.context().close();
});

test('mobile: no horizontal overflow at 320/375/390/430 (auth, onboarding, home, settings)', async () => {
  for (const w of [320, 375, 390, 430]) {
    const page = await newPage(w, 800);
    await page.goto(base + '/');
    await page.waitForSelector('#authFormPanel', { state: 'visible' });
    assert.ok(await noHorizontalOverflow(page), `auth @${w}`);
    await page.click('#authTabSignUp');
    assert.ok(await noHorizontalOverflow(page), `signup @${w}`);
    await page.evaluate(() => { showAuthOnboarding('choose', true); });
    assert.ok(await noHorizontalOverflow(page), `choose @${w}`);
    await page.evaluate(() => { showAuthOnboarding('join', true); });
    assert.ok(await noHorizontalOverflow(page), `join @${w}`);
    await page.evaluate(() => { showAuthOnboarding('create', true); });
    assert.ok(await noHorizontalOverflow(page), `create @${w}`);
    // signed-in screens
    await page.goto(base + '/');
    await page.waitForSelector('#authFormPanel', { state: 'visible' });
    await page.fill('#authEmail', 'philo@test.dev');
    await page.fill('#authPassword', 'secret12');
    await page.click('#authSubmitBtn');
    await page.waitForSelector('#appContainer', { state: 'visible' });
    assert.ok(await noHorizontalOverflow(page), `home @${w}`);
    await page.evaluate(() => openSettings());
    await page.waitForSelector('#settingsTeamList >> text=Roe Vincent');
    assert.ok(await noHorizontalOverflow(page), `settings @${w}`);
    // 44px touch targets in settings
    const small = await page.$$eval('#settingsModal button', bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().height < 43 && !b.textContent.includes('Close')).map(b => b.textContent.trim()));
    assert.deepEqual(small, [], `small targets @${w}`);
    await page.context().close();
  }
});

test('no production hosts contacted; no unexpected console errors', async () => {
  assert.deepEqual(productionHits, []);
  const unexpected = consoleErrors.filter(e =>
    !/permission-denied|PERMISSION_DENIED|Missing or insufficient permissions|Failed to load resource: the server responded with a status of (400|403|404)|net::ERR/.test(e));
  assert.deepEqual(unexpected, [], unexpected.join('\n'));
  console.log(`# console errors (expected SDK permission/400 probes): ${consoleErrors.length - unexpected.length}`);
});
