import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('../vendor/xlsx.mini.min.js');
const backupService = require('../backup-service.js');

describe('V1.9A Client Safety Backup & Excel Export Test Suite', () => {

  // Test Fixture
  function createSampleWorkspaceContext() {
    return {
      isDemo: false,
      workspace: {
        id: 'ws_elfe',
        name: 'ELFE Choir',
        role: 'owner',
        ownerDisplayName: 'Roe Vincent'
      },
      user: {
        email: 'philo@elfechoir.org',
        uid: 'uid_philo_manager'
      },
      profile: {
        displayName: 'Philo'
      },
      members: [
        { uid: 'uid_philo_manager', displayName: 'Philo', role: 'manager', status: 'active', isSelf: true },
        { uid: null, displayName: 'Roe Vincent', role: 'owner', status: 'pending', isSelf: false }
      ],
      tags: [
        { id: 'tag_old_member', name: 'Old Member', group: 'membership', active: true },
        { id: 'tag_new_member', name: 'New Member', group: 'membership', active: true },
        { id: 'tag_tamil', name: 'Tamil', group: 'language', active: true },
        { id: 'tag_english', name: 'English', group: 'language', active: true },
        { id: 'tag_perf', name: 'Performance', group: 'eligibility', active: true },
        { id: 'tag_lead', name: 'Lead Soloist', group: 'custom', active: true },
        { id: 'tag_archived', name: 'Historical Tag', group: 'custom', active: false }
      ],
      people: [
        { id: 'p_roe', name: 'Roe Vincent', gender: 'Female', active: true, tagIds: ['tag_old_member', 'tag_tamil', 'tag_perf'] },
        { id: 'p_sheena', name: 'Sheena', gender: 'Female', active: true, tagIds: ['tag_old_member', 'tag_english', 'tag_perf'] },
        { id: 'p_varsha', name: 'Varsha', gender: 'Female', active: true, tagIds: ['tag_new_member', 'tag_lead'] },
        { id: 'p_retired', name: 'Retired Singer', gender: 'Male', active: false, tagIds: ['tag_old_member'] }
      ],
      clients: [
        { id: 'c_staccato', name: 'Staccato', contactName: 'Vikram', phone: '+919840012345', email: 'events@staccato.in', notes: 'Core client', active: true },
        { id: 'c_past', name: 'Archived Studio', contactName: 'Kumar', phone: '', email: '', notes: 'No longer active', active: false }
      ],
      venues: [
        { id: 'v_itc', name: 'ITC Grand Chola', city: 'Chennai', state: 'Tamil Nadu', active: true },
        { id: 'v_old_hall', name: 'Old Town Hall', city: 'Madurai', state: 'Tamil Nadu', active: false }
      ],
      eventTypes: [
        { id: 'et_performance', name: 'Performance', active: true, isProtected: false, sortOrder: 1 },
        { id: 'et_recording', name: 'Recording', active: true, isProtected: false, sortOrder: 2 },
        { id: 'et_unspecified', name: 'Unspecified', active: true, isProtected: true, sortOrder: 99 },
        { id: 'et_archived', name: 'Old TV Special', active: false, isProtected: false, sortOrder: 5 }
      ],
      events: [
        {
          id: 'evt_confirmed_1',
          name: 'Annual Christmas Gala',
          status: 'confirmed',
          eventTypeId: 'et_performance',
          date: '2026-12-24',
          time: '18:00',
          clientId: 'c_staccato',
          venueId: 'v_itc',
          city: 'Chennai',
          state: 'Tamil Nadu',
          singersCount: 12,
          budget: 150000,
          notes: 'Special concert with guest orchestra & VIP guests.',
          managers: ['p_sheena', 'p_varsha'],
          assignedSingers: [
            { personId: 'p_roe', status: 'Available' },
            { personId: 'p_sheena', status: 'Available' }
          ]
        },
        {
          id: 'evt_enquiry_2',
          name: 'Corporate Brand Launch',
          status: 'enquiry',
          eventTypeId: 'et_recording',
          date: '2026-11-15',
          time: '10:30',
          clientId: 'c_staccato',
          venueId: 'v_itc',
          city: 'Chennai',
          state: 'Tamil Nadu',
          singersCount: 4,
          budget: 0, // Should be blank in export
          notes: '',
          managers: ['p_sheena'],
          assignedSingers: [
            { personId: 'p_varsha', status: 'Asked' }
          ]
        },
        {
          id: 'evt_past_3',
          name: 'Past Charity Recital',
          status: 'confirmed',
          eventTypeId: 'et_unspecified',
          date: '2025-08-10',
          time: '17:00',
          clientId: 'c_past',
          venueId: 'v_old_hall',
          city: 'Madurai',
          state: 'Tamil Nadu',
          singersCount: 8,
          budget: null, // Should be blank in export
          notes: 'Historical event record',
          managers: [],
          assignedSingers: []
        }
      ]
    };
  }

  // 1. Workbook generated successfully
  test('1. Workbook generated successfully as valid XLSX file', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    assert.ok(wb, 'Workbook object created');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    assert.ok(buffer instanceof Uint8Array || Buffer.isBuffer(buffer), 'Byte array generated');
    assert.ok(buffer.length > 5000, 'Buffer has realistic XLSX size (>5KB)');

    // Verify ZIP magic bytes (PK\x03\x04)
    assert.equal(buffer[0], 0x50);
    assert.equal(buffer[1], 0x4B);
    assert.equal(buffer[2], 0x03);
    assert.equal(buffer[3], 0x04);

    // Read back workbook using SheetJS
    const parsedWb = XLSX.read(buffer, { type: 'buffer' });
    assert.ok(parsedWb.SheetNames.length > 0, 'Parsed workbook has sheets');
  });

  // 2. Expected sheet names exist
  test('2. Exactly 9 expected sheets exist with exact naming', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);

    const expectedSheets = [
      'Summary',
      'Events',
      'Event Lineups',
      'Roster',
      'Clients',
      'Venues',
      'Event Types',
      'Tags',
      'Team'
    ];
    assert.deepEqual(wb.SheetNames, expectedSheets);
  });

  // 3. Events export correctly (past & future, enquiry & confirmed)
  test('3. Events export correctly with all types, dates, and statuses', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const eventsSheet = wb.Sheets['Events'];
    const rows = XLSX.utils.sheet_to_json(eventsSheet, { header: 1 });

    // Header row verification
    const headers = rows[0];
    assert.ok(headers.includes('Internal Event ID'));
    assert.ok(headers.includes('Status'));
    assert.ok(headers.includes('Client'));
    assert.ok(headers.includes('Event / Project Name'));
    assert.ok(headers.includes('Event Type'));
    assert.ok(headers.includes('Venue'));
    assert.ok(headers.includes('Budget INR'));
    assert.ok(headers.includes('Managers'));

    // 3 events -> 4 rows total (header + 3 records)
    assert.equal(rows.length, 4);

    // Check confirmed future event
    const confirmedEvt = rows.find(r => r[0] === 'evt_confirmed_1');
    assert.ok(confirmedEvt);
    assert.equal(confirmedEvt[1], 'Confirmed');
    assert.equal(confirmedEvt[2], '2026-12-24');
    assert.equal(confirmedEvt[4], 'Staccato');
    assert.equal(confirmedEvt[5], 'Annual Christmas Gala');
    assert.equal(confirmedEvt[6], 'Performance');
    assert.equal(confirmedEvt[7], 'ITC Grand Chola');
    assert.equal(confirmedEvt[11], 150000); // Numeric budget

    // Check enquiry event
    const enquiryEvt = rows.find(r => r[0] === 'evt_enquiry_2');
    assert.ok(enquiryEvt);
    assert.equal(enquiryEvt[1], 'Enquiry');
    assert.equal(enquiryEvt[5], 'Corporate Brand Launch');

    // Check historical past event
    const pastEvt = rows.find(r => r[0] === 'evt_past_3');
    assert.ok(pastEvt);
    assert.equal(pastEvt[2], '2025-08-10');
    assert.equal(pastEvt[4], 'Archived Studio');
  });

  // 4. Event lineup singer records export correctly
  test('4. Event lineup singer records export correctly one row per assigned singer', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const lineupSheet = wb.Sheets['Event Lineups'];
    const rows = XLSX.utils.sheet_to_json(lineupSheet, { header: 1 });

    // Header + 3 assigned singer assignments across all events
    // evt_confirmed_1 has 2 singers (Roe, Sheena), evt_enquiry_2 has 1 (Varsha), evt_past_3 has 0
    assert.equal(rows.length, 4);

    const headers = rows[0];
    assert.deepEqual(headers, [
      'Event ID', 'Date', 'Client', 'Event / Project',
      'Singer ID', 'Singer Name', 'Availability Status'
    ]);

    // Check Roe assignment
    const roeRow = rows.find(r => r[4] === 'p_roe');
    assert.ok(roeRow);
    assert.equal(roeRow[0], 'evt_confirmed_1');
    assert.equal(roeRow[2], 'Staccato');
    assert.equal(roeRow[3], 'Annual Christmas Gala');
    assert.equal(roeRow[5], 'Roe Vincent');
    assert.equal(roeRow[6], 'Available');

    // Check Varsha assignment
    const varshaRow = rows.find(r => r[4] === 'p_varsha');
    assert.ok(varshaRow);
    assert.equal(varshaRow[0], 'evt_enquiry_2');
    assert.equal(varshaRow[5], 'Varsha');
    assert.equal(varshaRow[6], 'Asked');
  });

  // 5. Managers do not become singers
  test('5. Event managers remain on Events sheet and NEVER masquerade as lineup singers', async () => {
    const ctx = createSampleWorkspaceContext();
    // In ctx, evt_enquiry_2 has manager p_sheena, but assignedSingers ONLY has p_varsha.
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);

    // On Events sheet: evt_enquiry_2 managers column must list Sheena
    const eventsRows = XLSX.utils.sheet_to_json(wb.Sheets['Events'], { header: 1 });
    const enquiryRow = eventsRows.find(r => r[0] === 'evt_enquiry_2');
    assert.ok(enquiryRow[13].includes('Sheena'));

    // On Event Lineups sheet: evt_enquiry_2 must NOT have Sheena as an assigned singer
    const lineupRows = XLSX.utils.sheet_to_json(wb.Sheets['Event Lineups'], { header: 1 });
    const enquiryLineupSingers = lineupRows.filter(r => r[0] === 'evt_enquiry_2').map(r => r[4]);
    assert.deepEqual(enquiryLineupSingers, ['p_varsha']);
    assert.ok(!enquiryLineupSingers.includes('p_sheena'), 'Manager does not become singer');
  });

  // 6. Client/venue/type IDs resolve to names
  test('6. Foreign keys (client, venue, event type) resolve to human names with fallbacks', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const eventsRows = XLSX.utils.sheet_to_json(wb.Sheets['Events'], { header: 1 });

    const row1 = eventsRows.find(r => r[0] === 'evt_confirmed_1');
    assert.equal(row1[4], 'Staccato');          // c_staccato -> Staccato
    assert.equal(row1[6], 'Performance');       // et_performance -> Performance
    assert.equal(row1[7], 'ITC Grand Chola');    // v_itc -> ITC Grand Chola

    const row3 = eventsRows.find(r => r[0] === 'evt_past_3');
    assert.equal(row3[4], 'Archived Studio');   // c_past -> Archived Studio
    assert.equal(row3[6], 'Unspecified');       // et_unspecified -> Unspecified
    assert.equal(row3[7], 'Old Town Hall');     // v_old_hall -> Old Town Hall
  });

  // 7. Blank optional values remain clean (no undefined, null, NaN)
  test('7. Blank optional values remain clean and never emit undefined, null, NaN', async () => {
    const ctx = createSampleWorkspaceContext();
    // Add event with null, undefined, NaN fields
    ctx.events.push({
      id: 'evt_edge_empty',
      name: 'Empty Event',
      status: undefined,
      eventTypeId: null,
      date: null,
      time: undefined,
      clientId: null,
      venueId: null,
      city: undefined,
      state: null,
      singersCount: null,
      budget: undefined,
      notes: null,
      managers: null,
      assignedSingers: null
    });

    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);

    // Scan all sheets and all cells for invalid literal strings
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      for (const cellKey of Object.keys(sheet)) {
        if (cellKey.startsWith('!')) continue;
        const cellVal = String(sheet[cellKey].v);
        assert.notEqual(cellVal, 'undefined', `Cell ${cellKey} on ${sheetName} contains 'undefined'`);
        assert.notEqual(cellVal, 'null', `Cell ${cellKey} on ${sheetName} contains 'null'`);
        assert.notEqual(cellVal, 'NaN', `Cell ${cellKey} on ${sheetName} contains 'NaN'`);
      }
    }
  });

  // 8. Budget is numeric/blank appropriately
  test('8. Budget is numeric with Indian formatting when present, and strictly blank (not 0) when unset', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const eventsSheet = wb.Sheets['Events'];

    // Row 2 is evt_confirmed_1: budget 150000 -> cell L2
    const cellL2 = eventsSheet['L2'];
    assert.ok(cellL2, 'Cell L2 exists');
    assert.equal(cellL2.t, 'n', 'Budget cell type is numeric');
    assert.equal(cellL2.v, 150000, 'Budget cell value is 150000');
    assert.ok(cellL2.z.includes('##0'), 'Indian currency grouping format string set');

    // Row 3 is evt_enquiry_2: budget 0 -> cell L3 should be blank string
    const cellL3 = eventsSheet['L3'];
    assert.equal(cellL3.v, '', 'Budget of 0 becomes blank string');
    assert.notEqual(cellL3.v, 0, 'Budget of 0 must NOT be number 0');

    // Row 4 is evt_past_3: budget null -> cell L4 should be blank string
    const cellL4 = eventsSheet['L4'];
    assert.equal(cellL4.v, '', 'Budget of null becomes blank string');
  });

  // 9. Inactive/historical supporting records are preserved
  test('9. Inactive/historical records are preserved across Roster, Clients, Venues, Event Types', async () => {
    const ctx = createSampleWorkspaceContext();
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);

    // Inactive singer
    const rosterRows = XLSX.utils.sheet_to_json(wb.Sheets['Roster'], { header: 1 });
    const retiredSinger = rosterRows.find(r => r[0] === 'p_retired');
    assert.ok(retiredSinger, 'Retired singer preserved in roster');
    assert.equal(retiredSinger[3], 'Inactive');

    // Inactive client
    const clientRows = XLSX.utils.sheet_to_json(wb.Sheets['Clients'], { header: 1 });
    const pastClient = clientRows.find(r => r[0] === 'c_past');
    assert.ok(pastClient, 'Inactive client preserved');
    assert.equal(pastClient[6], 'Inactive');

    // Inactive venue
    const venueRows = XLSX.utils.sheet_to_json(wb.Sheets['Venues'], { header: 1 });
    const oldVenue = venueRows.find(r => r[0] === 'v_old_hall');
    assert.ok(oldVenue, 'Inactive venue preserved');
    assert.equal(oldVenue[4], 'Inactive');

    // Inactive event type
    const typeRows = XLSX.utils.sheet_to_json(wb.Sheets['Event Types'], { header: 1 });
    const oldType = typeRows.find(r => r[0] === 'et_archived');
    assert.ok(oldType, 'Inactive event type preserved');
    assert.equal(oldType[2], 'Inactive');
  });

  // 10. Active workspace isolation
  test('10. Export contains strictly the active workspace with ZERO data leakage from other workspaces', async () => {
    const ws1Context = createSampleWorkspaceContext();
    ws1Context.workspace = { id: 'ws_elfe', name: 'ELFE Choir', role: 'owner' };
    ws1Context.events = [{ id: 'evt_elfe_1', name: 'ELFE Rehearsal', date: '2026-10-10' }];

    const ws2Context = createSampleWorkspaceContext();
    ws2Context.workspace = { id: 'ws_other', name: 'Other Choir', role: 'manager' };
    ws2Context.events = [{ id: 'evt_other_1', name: 'Other Secret Show', date: '2026-11-20' }];

    const snapshot1 = await backupService.buildWorkspaceBackupSnapshot(ws1Context);
    const wb1 = backupService.buildExcelWorkbook(snapshot1, XLSX);
    const events1 = XLSX.utils.sheet_to_json(wb1.Sheets['Events'], { header: 1 });

    assert.equal(snapshot1.meta.workspaceName, 'ELFE Choir');
    assert.equal(events1.length, 2); // header + 1 event
    assert.equal(events1[1][0], 'evt_elfe_1');
    // Ensure no other choir data exists
    assert.ok(!JSON.stringify(events1).includes('evt_other_1'));
    assert.ok(!JSON.stringify(events1).includes('Other Secret Show'));
  });

  // 11. Workspace switch changes export source correctly
  test('11. Switching workspace changes the backup export snapshot completely', async () => {
    const ws1Context = createSampleWorkspaceContext();
    ws1Context.workspace = { id: 'ws_elfe', name: 'ELFE Choir', role: 'owner' };

    const ws2Context = createSampleWorkspaceContext();
    ws2Context.workspace = { id: 'ws_staccato', name: 'Staccato Vocal Project', role: 'manager' };
    ws2Context.events = [{ id: 'evt_staccato_only', name: 'Studio Gig', date: '2026-10-12' }];

    const snap1 = await backupService.buildWorkspaceBackupSnapshot(ws1Context);
    const snap2 = await backupService.buildWorkspaceBackupSnapshot(ws2Context);

    assert.equal(snap1.meta.workspaceName, 'ELFE Choir');
    assert.equal(snap2.meta.workspaceName, 'Staccato Vocal Project');
    assert.notEqual(snap1.events[0].name, snap2.events[0].name);
  });

  // 12. Demo mode isolation (?demo=1)
  test('12. Demo mode isolation exports demo workspace only without Firestore access', async () => {
    const demoCtx = {
      isDemo: true,
      workspace: { id: 'local_demo', name: 'Demo Workspace', role: 'manager' },
      user: { email: 'demo@choirmanager.local', uid: 'demo_user' },
      profile: { displayName: 'Demo Manager' },
      members: [{ uid: null, displayName: 'Demo Manager', role: 'manager', status: 'active', isSelf: true }],
      events: [{ id: 13, name: 'Demo Showcase', status: 'enquiry' }],
      people: [{ id: 'p_demo', name: 'Demo Singer', active: true }],
      clients: [],
      venues: [],
      eventTypes: [],
      tags: []
    };

    const snapshot = await backupService.buildWorkspaceBackupSnapshot(demoCtx);
    assert.equal(snapshot.meta.exportMode, 'Local Demo (?demo=1 active)');
    assert.equal(snapshot.meta.workspaceName, 'Demo Workspace');
    assert.equal(snapshot.events.length, 1);
    assert.equal(snapshot.events[0].id, '13');
  });

  // 13. Empty workspace export
  test('13. Empty workspace exports a valid 9-sheet workbook with 0 counts without error', async () => {
    const emptyCtx = {
      isDemo: false,
      workspace: { id: 'ws_fresh', name: 'Fresh Choir', role: 'owner', ownerDisplayName: 'Fresh Director' },
      user: { email: 'fresh@choir.org', uid: 'uid_fresh' },
      profile: { displayName: 'Fresh Director' },
      members: [{ uid: 'uid_fresh', displayName: 'Fresh Director', role: 'owner', status: 'active', isSelf: true }],
      tags: [],
      people: [],
      clients: [],
      venues: [],
      eventTypes: [],
      events: []
    };

    const snapshot = await backupService.buildWorkspaceBackupSnapshot(emptyCtx);
    assert.equal(snapshot.meta.counts.totalEvents, 0);
    assert.equal(snapshot.meta.counts.totalPeople, 0);

    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    assert.equal(wb.SheetNames.length, 9);

    // Each data sheet should contain exactly 1 row (the header)
    for (const sheetName of ['Events', 'Event Lineups', 'Roster', 'Clients', 'Venues', 'Event Types', 'Tags']) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
      assert.equal(rows.length, 1, `Sheet ${sheetName} has exactly 1 header row`);
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    assert.ok(buffer.length > 0, 'Empty workspace XLSX generated successfully');
  });

  // 14. Formula-injection strings remain plain text
  test('14. Formula-injection strings starting with =, +, -, @, \\t, \\r are safely prefixed with apostrophe', async () => {
    const ctx = createSampleWorkspaceContext();
    ctx.events = [
      {
        id: 'evt_injection_1',
        name: '=cmd|"/C calc"!A0',
        status: 'enquiry',
        notes: '-2+5+cmd|"/C notepad"!A0',
        client: '+919999999999',
        managers: []
      },
      {
        id: 'evt_injection_2',
        name: '@SUM(1,2)',
        status: 'confirmed',
        notes: '\t=1+1',
        managers: []
      }
    ];

    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const eventsSheet = wb.Sheets['Events'];

    // Verify cell values start with single quote apostrophe
    const row2 = XLSX.utils.sheet_to_json(eventsSheet, { header: 1 })[1];
    assert.equal(row2[5], "'=cmd|\"/C calc\"!A0", 'Formula = is sanitized');
    assert.equal(row2[12], "'-2+5+cmd|\"/C notepad\"!A0", 'Formula - is sanitized');

    const row3 = XLSX.utils.sheet_to_json(eventsSheet, { header: 1 })[2];
    assert.equal(row3[5], "'@SUM(1,2)", 'Formula @ is sanitized');
    assert.equal(row3[12], "'\t=1+1", 'Tab prefix is sanitized');

    // Confirm cell formula attribute 'f' is undefined
    assert.equal(eventsSheet['F2'].f, undefined, 'No formula executed');
    assert.equal(eventsSheet['F3'].f, undefined, 'No formula executed');
  });

  // 15. Unicode/Tamil characters survive
  test('15. Unicode, Tamil text, emojis, apostrophes, commas, ampersands, and multi-line notes survive intact', async () => {
    const ctx = createSampleWorkspaceContext();
    const tamilNote = `வணக்கம்! இது பாடல் ஒத்திகை நிகழ்வு.
Special line with commas, & ampersands, and single 'quotes'.
🎶 Choir performance with ❤️ and full ensemble!`;

    ctx.events = [{
      id: 'evt_tamil_1',
      name: 'தமிழ் இசை நிகழ்ச்சி — Chennai Gala',
      status: 'confirmed',
      city: 'திருச்சிராப்பள்ளி (Trichy)',
      state: 'தமிழ்நாடு',
      notes: tamilNote,
      budget: 95000,
      managers: []
    }];

    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    const wb = backupService.buildExcelWorkbook(snapshot, XLSX);
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Read back and verify exact string equality
    const readWb = XLSX.read(buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(readWb.Sheets['Events'], { header: 1 });
    const eventRow = rows[1];

    assert.equal(eventRow[5], 'தமிழ் இசை நிகழ்ச்சி — Chennai Gala');
    assert.equal(eventRow[8], 'திருச்சிராப்பள்ளி (Trichy)');
    assert.equal(eventRow[9], 'தமிழ்நாடு');
    assert.equal(eventRow[12], tamilNote);
  });

  // 16. No source data mutation occurs
  test('16. Source data objects are strictly immutable during snapshot and export generation', async () => {
    const ctx = createSampleWorkspaceContext();
    const sourceCopy = JSON.parse(JSON.stringify(ctx));

    // Run snapshot and workbook generation
    const snapshot = await backupService.buildWorkspaceBackupSnapshot(ctx);
    backupService.buildExcelWorkbook(snapshot, XLSX);

    // Deep equality verification
    assert.deepEqual(ctx, sourceCopy, 'Source context objects were not mutated in any way');
  });

  // Helper Filename formatting test
  test('Filename formatting sanitizes invalid characters and formats timestamp', () => {
    const testDate = new Date(2026, 9, 3, 11, 30); // Month is 0-indexed (9 = Oct)
    const fn1 = backupService.formatBackupFilename('ELFE', testDate);
    assert.equal(fn1, 'ELFE_Backup_2026-10-03_1130.xlsx');

    const fn2 = backupService.formatBackupFilename('Choir / Manager : "Special" <Test>? *|', testDate);
    assert.ok(!fn2.includes('/'), 'No forward slash');
    assert.ok(!fn2.includes(':'), 'No colon');
    assert.ok(!fn2.includes('*'), 'No asterisk');
    assert.ok(!fn2.includes('?'), 'No question mark');
    assert.ok(fn2.endsWith('.xlsx'));
  });

});
