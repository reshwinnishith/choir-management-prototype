/**
 * Choir Manager - Client Safety Backup Service (v1.9A)
 * 
 * Generates an independent, read-only Excel workbook (.xlsx) of the currently selected
 * workspace. Firestore is the source of truth; this module causes zero writes or mutations.
 */
(function (global) {
  'use strict';

  // --- Formula Injection & Data Safety Helpers ---
  function sanitizeForFormulaInjection(val) {
    if (val === null || val === undefined) return '';
    if (typeof val !== 'string') return val;
    // Protect against Excel formula injection (=, +, -, @, \t, \r)
    if (/^[=+\-@\t\r]/.test(val)) {
      return "'" + val;
    }
    return val;
  }

  function cleanVal(val) {
    if (val === null || val === undefined || Number.isNaN(val)) return '';
    return sanitizeForFormulaInjection(val);
  }

  function sanitizeFilename(rawName) {
    const base = String(rawName || '').trim();
    // Replace characters invalid in Windows / POSIX filenames
    const clean = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim().replace(/\s+/g, '_');
    return clean || 'Workspace';
  }

  function formatBackupFilename(workspaceName, date = new Date()) {
    const wsClean = sanitizeFilename(workspaceName);
    const pad = n => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${wsClean}_Backup_${yyyy}-${mm}-${dd}_${hh}${min}.xlsx`;
  }

  function computeColWidths(aoa) {
    const colWidths = [];
    for (const row of aoa) {
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        const len = val !== null && val !== undefined ? String(val).length : 0;
        colWidths[c] = Math.max(colWidths[c] || 10, Math.min(len + 3, 50));
      }
    }
    return colWidths.map(w => ({ wch: w }));
  }

  // --- Core Snapshot Builder (Deterministic & Testable) ---
  async function buildWorkspaceBackupSnapshot(customContext = null) {
    let ws = null;
    let user = null;
    let profile = null;
    let members = [];
    let people = [];
    let tags = [];
    let clients = [];
    let venues = [];
    let eventTypes = [];
    let events = [];
    let isDemo = false;

    if (customContext) {
      // Test or injected context
      isDemo = Boolean(customContext.isDemo);
      ws = customContext.workspace || { id: 'ws_test', name: 'Test Workspace', role: 'manager' };
      user = customContext.user || { email: 'test@choirmanager.local', uid: 'test_uid' };
      profile = customContext.profile || { displayName: 'Tester' };
      members = customContext.members ? JSON.parse(JSON.stringify(customContext.members)) : [];
      people = customContext.people ? JSON.parse(JSON.stringify(customContext.people)) : [];
      tags = customContext.tags ? JSON.parse(JSON.stringify(customContext.tags)) : [];
      clients = customContext.clients ? JSON.parse(JSON.stringify(customContext.clients)) : [];
      venues = customContext.venues ? JSON.parse(JSON.stringify(customContext.venues)) : [];
      eventTypes = customContext.eventTypes ? JSON.parse(JSON.stringify(customContext.eventTypes)) : [];
      events = customContext.events ? JSON.parse(JSON.stringify(customContext.events)) : [];
    } else {
      // Runtime browser context: query existing domain services
      isDemo = typeof global.isDemoMode === 'function' ? global.isDemoMode() : false;
      const wsService = global.workspaceService;
      const auth = global.authService;
      const pService = global.peopleService;
      const tService = global.tagService;
      const cService = global.clientService;
      const vService = global.venueService;
      const etService = global.eventTypeService;
      const eService = global.eventService;

      if (isDemo) {
        ws = {
          id: 'local_demo',
          name: 'Demo Workspace',
          role: 'manager',
          isLegacy: false,
          ownerUid: null,
          ownerDisplayName: 'Demo Owner'
        };
        user = { email: 'demo@choirmanager.local', uid: 'demo_user' };
        profile = { displayName: 'Demo Manager', email: 'demo@choirmanager.local' };
        members = [
          { uid: null, displayName: 'Demo Manager', role: 'manager', status: 'active', isSelf: true }
        ];
      } else {
        ws = wsService && typeof wsService.getCurrent === 'function' ? wsService.getCurrent() : null;
        if (!ws) {
          ws = { id: 'cloud_workspace', name: 'Choir Workspace', role: 'manager', isLegacy: false };
        }
        user = auth && typeof auth.getUser === 'function' ? auth.getUser() : null;
        profile = wsService && typeof wsService.getProfile === 'function' ? wsService.getProfile() : null;
        if (wsService && typeof wsService.listMembers === 'function') {
          try {
            members = await wsService.listMembers();
          } catch (e) {
            console.warn('[Backup] Could not fetch team members:', e);
            members = [];
          }
        }
      }

      // Deep clone to guarantee ZERO source mutation
      people = pService && typeof pService.getAll === 'function' ? JSON.parse(JSON.stringify(pService.getAll())) : [];
      tags = tService && typeof tService.getAll === 'function' ? JSON.parse(JSON.stringify(tService.getAll())) : [];
      clients = cService && typeof cService.getAll === 'function' ? JSON.parse(JSON.stringify(cService.getAll())) : [];
      venues = vService && typeof vService.getAll === 'function' ? JSON.parse(JSON.stringify(vService.getAll())) : [];
      eventTypes = etService && typeof etService.getAll === 'function' ? JSON.parse(JSON.stringify(etService.getAll())) : [];
      events = eService && typeof eService.getAll === 'function' ? JSON.parse(JSON.stringify(eService.getAll())) : [];
    }

    // Lookup Maps for Foreign Key Resolution
    const clientMap = new Map();
    clients.forEach(c => clientMap.set(String(c.id), c.name || ''));

    const venueMap = new Map();
    venues.forEach(v => venueMap.set(String(v.id), v.name || ''));

    const eventTypeMap = new Map();
    eventTypes.forEach(t => eventTypeMap.set(String(t.id), t.name || ''));

    const personMap = new Map();
    people.forEach(p => personMap.set(String(p.id), p.name || ''));

    const tagMap = new Map();
    tags.forEach(t => tagMap.set(String(t.id), t));

    // Resolved Events List
    const resolvedEvents = events.map(e => {
      const clientName = e.clientId ? (clientMap.get(String(e.clientId)) || '') : '';
      const venueName = e.venueId ? (venueMap.get(String(e.venueId)) || '') : '';
      const eventTypeName = e.eventTypeId ? (eventTypeMap.get(String(e.eventTypeId)) || 'Unspecified') : 'Unspecified';
      const managerNames = Array.isArray(e.managers)
        ? e.managers.map(mId => personMap.get(String(mId)) || String(mId)).join(', ')
        : '';

      const numericBudget = (e.budget !== undefined && e.budget !== null && !Number.isNaN(Number(e.budget)) && Number(e.budget) > 0)
        ? Number(e.budget)
        : null;

      const numericSingers = (e.singersCount !== undefined && e.singersCount !== null && !Number.isNaN(Number(e.singersCount)) && Number(e.singersCount) > 0)
        ? Number(e.singersCount)
        : null;

      return {
        id: String(e.id || ''),
        status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) : 'Enquiry',
        date: e.date || '',
        time: e.time || '',
        clientName,
        name: e.name || '',
        eventTypeName,
        venueName,
        city: e.city || '',
        state: e.state || '',
        singerTarget: numericSingers,
        budgetINR: numericBudget,
        notes: e.notes || '',
        managers: managerNames,
        _raw: e
      };
    });

    // Resolved Lineups List (One row per assigned singer per event)
    const resolvedLineups = [];
    events.forEach(e => {
      const clientName = e.clientId ? (clientMap.get(String(e.clientId)) || '') : '';
      const eventName = e.name || '';
      const eventDate = e.date || '';
      const assigned = Array.isArray(e.assignedSingers) ? e.assignedSingers : [];

      assigned.forEach(s => {
        const pId = s.personId ? String(s.personId) : '';
        const singerName = pId ? (personMap.get(pId) || 'Unknown') : 'Unknown';
        const status = s.status || 'Available';
        resolvedLineups.push({
          eventId: String(e.id || ''),
          date: eventDate,
          clientName,
          eventName,
          singerId: pId,
          singerName,
          status
        });
      });
    });

    // Helper to get grouped tag names for a person
    function getPersonTagNamesByGroup(p, groupTarget) {
      if (!Array.isArray(p.tagIds) || !p.tagIds.length) return '';
      const matching = [];
      p.tagIds.forEach(tId => {
        const t = tagMap.get(String(tId));
        if (!t) return;
        const g = (t.group || 'custom').toLowerCase();
        if (groupTarget === 'membership' && g === 'membership') matching.push(t.name);
        else if (groupTarget === 'language' && g === 'language') matching.push(t.name);
        else if (groupTarget === 'eligibility' && g === 'eligibility') matching.push(t.name);
        else if (groupTarget === 'custom' && !['membership', 'language', 'eligibility'].includes(g)) matching.push(t.name);
      });
      return matching.join(', ');
    }

    // Resolved Roster List
    const resolvedRoster = people.map(p => ({
      id: String(p.id || ''),
      name: p.name || '',
      gender: p.gender || '',
      status: p.active === false ? 'Inactive' : 'Active',
      membershipTags: getPersonTagNamesByGroup(p, 'membership'),
      languageTags: getPersonTagNamesByGroup(p, 'language'),
      eligibilityTags: getPersonTagNamesByGroup(p, 'eligibility'),
      customTags: getPersonTagNamesByGroup(p, 'custom'),
      _raw: p
    }));

    // Resolved Clients List
    const resolvedClients = clients.map(c => ({
      id: String(c.id || ''),
      name: c.name || '',
      contactName: c.contactName || '',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
      status: c.active === false ? 'Inactive' : 'Active'
    }));

    // Resolved Venues List
    const resolvedVenues = venues.map(v => ({
      id: String(v.id || ''),
      name: v.name || '',
      city: v.city || '',
      state: v.state || '',
      status: v.active === false ? 'Inactive' : 'Active'
    }));

    // Resolved Event Types List
    const resolvedEventTypes = eventTypes.map(t => ({
      id: String(t.id || ''),
      name: t.name || '',
      status: t.active !== false ? 'Active' : 'Inactive',
      isSystem: t.isProtected ? 'Yes (System)' : 'No',
      sortOrder: Number(t.sortOrder || 0)
    }));

    // Resolved Tags List
    const resolvedTags = tags.map(t => ({
      id: String(t.id || ''),
      name: t.name || '',
      group: t.group || 'custom',
      status: t.active !== false ? 'Active' : 'Inactive'
    }));

    // Resolved Team Members List
    const resolvedTeam = (Array.isArray(members) ? members : []).map(m => {
      const isOwner = m.role === 'owner';
      const isManager = m.role === 'manager';
      const roleDisplay = isOwner ? 'Owner' : (isManager ? 'Manager' : String(m.role || 'Member'));
      const statusDisplay = m.status === 'active' ? 'Active' : (m.status === 'pending' ? 'Pending' : String(m.status || 'Active'));
      const accountConnected = m.uid ? 'Yes' : 'No (Account not yet connected)';
      return {
        displayName: m.displayName || 'Unnamed',
        role: roleDisplay,
        status: statusDisplay,
        accountConnected,
        internalUserId: m.uid || '—'
      };
    });

    const activeSingersCount = people.filter(p => p.active !== false).length;
    const confirmedEventsCount = events.filter(e => String(e.status).toLowerCase() === 'confirmed').length;
    const enquiryEventsCount = events.filter(e => String(e.status).toLowerCase() === 'enquiry').length;

    const exportedAt = new Date();
    const exportedAtIso = exportedAt.toISOString().replace('T', ' ').substring(0, 19);

    const snapshot = {
      meta: {
        workspaceName: ws.name || 'Workspace',
        workspaceId: ws.id || '',
        workspaceOwnerDisplayName: ws.ownerDisplayName || 'Not set',
        exportMode: isDemo ? 'Local Demo (?demo=1 active)' : 'Cloud (Firestore)',
        exportedAt: exportedAtIso,
        exportedBy: (profile && profile.displayName) || (user && user.email) || 'Manager',
        userRole: ws.role ? (ws.role.charAt(0).toUpperCase() + ws.role.slice(1)) : 'Manager',
        backupSchemaVersion: '1.0',
        counts: {
          totalEvents: events.length,
          confirmedEvents: confirmedEventsCount,
          enquiryEvents: enquiryEventsCount,
          totalLineupAssignments: resolvedLineups.length,
          totalPeople: people.length,
          activeSingers: activeSingersCount,
          totalClients: clients.length,
          totalVenues: venues.length,
          totalEventTypes: eventTypes.length,
          totalTags: tags.length,
          totalTeamMembers: resolvedTeam.length
        }
      },
      events: resolvedEvents,
      lineups: resolvedLineups,
      roster: resolvedRoster,
      clients: resolvedClients,
      venues: resolvedVenues,
      eventTypes: resolvedEventTypes,
      tags: resolvedTags,
      team: resolvedTeam
    };

    return snapshot;
  }

  // --- Excel Workbook Generator ---
  function buildExcelWorkbook(snapshot, XLSXLib = null) {
    const XLSX = XLSXLib || (typeof global.XLSX !== 'undefined' ? global.XLSX : null);
    if (!XLSX) {
      throw new Error('XLSX library not loaded. Make sure vendor/xlsx.mini.min.js is included.');
    }

    const wb = XLSX.utils.book_new();

    // 1. SUMMARY SHEET
    const meta = snapshot.meta || {};
    const counts = meta.counts || {};
    const summaryAoa = [
      ['Workspace Backup Summary', ''],
      ['', ''],
      ['WORKSPACE METADATA', ''],
      ['Workspace Name', cleanVal(meta.workspaceName)],
      ['Workspace ID', cleanVal(meta.workspaceId)],
      ['Workspace Mode', cleanVal(meta.exportMode)],
      ['Workspace Owner', cleanVal(meta.workspaceOwnerDisplayName)],
      ['Exported At (UTC)', cleanVal(meta.exportedAt)],
      ['Exported By', cleanVal(meta.exportedBy)],
      ['Exported By Role', cleanVal(meta.userRole)],
      ['Backup Schema Version', cleanVal(meta.backupSchemaVersion)],
      ['', ''],
      ['RECORD COUNTS', ''],
      ['Total Events', counts.totalEvents || 0],
      ['Confirmed Events', counts.confirmedEvents || 0],
      ['Enquiry Events', counts.enquiryEvents || 0],
      ['Lineup Assignments', counts.totalLineupAssignments || 0],
      ['Total People (Roster)', counts.totalPeople || 0],
      ['Active Singers / People', counts.activeSingers || 0],
      ['Clients', counts.totalClients || 0],
      ['Venues', counts.totalVenues || 0],
      ['Event Types', counts.totalEventTypes || 0],
      ['Tags', counts.totalTags || 0],
      ['Workspace Members / Team', counts.totalTeamMembers || 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. EVENTS SHEET
    const eventsHeaders = [
      'Internal Event ID', 'Status', 'Date', 'Time', 'Client',
      'Event / Project Name', 'Event Type', 'Venue', 'City', 'State',
      'Singer Target', 'Budget INR', 'Notes', 'Managers'
    ];
    const eventsAoa = [eventsHeaders];
    (snapshot.events || []).forEach(e => {
      eventsAoa.push([
        cleanVal(e.id),
        cleanVal(e.status),
        cleanVal(e.date),
        cleanVal(e.time),
        cleanVal(e.clientName),
        cleanVal(e.name),
        cleanVal(e.eventTypeName),
        cleanVal(e.venueName),
        cleanVal(e.city),
        cleanVal(e.state),
        e.singerTarget !== null ? e.singerTarget : '',
        e.budgetINR !== null ? e.budgetINR : '',
        cleanVal(e.notes),
        cleanVal(e.managers)
      ]);
    });
    const wsEvents = XLSX.utils.aoa_to_sheet(eventsAoa);
    wsEvents['!cols'] = computeColWidths(eventsAoa);
    // Apply Indian currency number format to Budget INR column (col index 11 -> L)
    for (let r = 1; r < eventsAoa.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: 11 });
      const cell = wsEvents[cellRef];
      if (cell && cell.t === 'n') {
        // Excel format for Indian Currency Grouping
        cell.z = '[>=10000000]##\\,##\\,##\\,##0;[>=100000]##\\,##\\,##0;##,##0';
      }
    }
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Events');

    // 3. EVENT LINEUPS SHEET
    const lineupsHeaders = [
      'Event ID', 'Date', 'Client', 'Event / Project',
      'Singer ID', 'Singer Name', 'Availability Status'
    ];
    const lineupsAoa = [lineupsHeaders];
    (snapshot.lineups || []).forEach(l => {
      lineupsAoa.push([
        cleanVal(l.eventId),
        cleanVal(l.date),
        cleanVal(l.clientName),
        cleanVal(l.eventName),
        cleanVal(l.singerId),
        cleanVal(l.singerName),
        cleanVal(l.status)
      ]);
    });
    const wsLineups = XLSX.utils.aoa_to_sheet(lineupsAoa);
    wsLineups['!cols'] = computeColWidths(lineupsAoa);
    XLSX.utils.book_append_sheet(wb, wsLineups, 'Event Lineups');

    // 4. ROSTER SHEET
    const rosterHeaders = [
      'Internal Person ID', 'Name', 'Gender', 'Status',
      'Membership Tags', 'Language Tags', 'Eligibility Tags', 'Custom Tags'
    ];
    const rosterAoa = [rosterHeaders];
    (snapshot.roster || []).forEach(p => {
      rosterAoa.push([
        cleanVal(p.id),
        cleanVal(p.name),
        cleanVal(p.gender),
        cleanVal(p.status),
        cleanVal(p.membershipTags),
        cleanVal(p.languageTags),
        cleanVal(p.eligibilityTags),
        cleanVal(p.customTags)
      ]);
    });
    const wsRoster = XLSX.utils.aoa_to_sheet(rosterAoa);
    wsRoster['!cols'] = computeColWidths(rosterAoa);
    XLSX.utils.book_append_sheet(wb, wsRoster, 'Roster');

    // 5. CLIENTS SHEET
    const clientsHeaders = [
      'Internal Client ID', 'Name', 'Contact Name', 'Phone', 'Email', 'Notes', 'Status'
    ];
    const clientsAoa = [clientsHeaders];
    (snapshot.clients || []).forEach(c => {
      clientsAoa.push([
        cleanVal(c.id),
        cleanVal(c.name),
        cleanVal(c.contactName),
        cleanVal(c.phone),
        cleanVal(c.email),
        cleanVal(c.notes),
        cleanVal(c.status)
      ]);
    });
    const wsClients = XLSX.utils.aoa_to_sheet(clientsAoa);
    wsClients['!cols'] = computeColWidths(clientsAoa);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');

    // 6. VENUES SHEET
    const venuesHeaders = [
      'Internal Venue ID', 'Name', 'City', 'State', 'Status'
    ];
    const venuesAoa = [venuesHeaders];
    (snapshot.venues || []).forEach(v => {
      venuesAoa.push([
        cleanVal(v.id),
        cleanVal(v.name),
        cleanVal(v.city),
        cleanVal(v.state),
        cleanVal(v.status)
      ]);
    });
    const wsVenues = XLSX.utils.aoa_to_sheet(venuesAoa);
    wsVenues['!cols'] = computeColWidths(venuesAoa);
    XLSX.utils.book_append_sheet(wb, wsVenues, 'Venues');

    // 7. EVENT TYPES SHEET
    const eventTypesHeaders = [
      'Internal ID', 'Name', 'Status', 'System Type', 'Sort Order'
    ];
    const eventTypesAoa = [eventTypesHeaders];
    (snapshot.eventTypes || []).forEach(t => {
      eventTypesAoa.push([
        cleanVal(t.id),
        cleanVal(t.name),
        cleanVal(t.status),
        cleanVal(t.isSystem),
        t.sortOrder !== undefined ? t.sortOrder : ''
      ]);
    });
    const wsEventTypes = XLSX.utils.aoa_to_sheet(eventTypesAoa);
    wsEventTypes['!cols'] = computeColWidths(eventTypesAoa);
    XLSX.utils.book_append_sheet(wb, wsEventTypes, 'Event Types');

    // 8. TAGS SHEET
    const tagsHeaders = [
      'Internal ID', 'Name', 'Group', 'Status'
    ];
    const tagsAoa = [tagsHeaders];
    (snapshot.tags || []).forEach(t => {
      tagsAoa.push([
        cleanVal(t.id),
        cleanVal(t.name),
        cleanVal(t.group),
        cleanVal(t.status)
      ]);
    });
    const wsTags = XLSX.utils.aoa_to_sheet(tagsAoa);
    wsTags['!cols'] = computeColWidths(tagsAoa);
    XLSX.utils.book_append_sheet(wb, wsTags, 'Tags');

    // 9. TEAM SHEET
    const teamHeaders = [
      'Display Name', 'Role', 'Status', 'Account Connected', 'Internal User ID'
    ];
    const teamAoa = [teamHeaders];
    (snapshot.team || []).forEach(m => {
      teamAoa.push([
        cleanVal(m.displayName),
        cleanVal(m.role),
        cleanVal(m.status),
        cleanVal(m.accountConnected),
        cleanVal(m.internalUserId)
      ]);
    });
    const wsTeam = XLSX.utils.aoa_to_sheet(teamAoa);
    wsTeam['!cols'] = computeColWidths(teamAoa);
    XLSX.utils.book_append_sheet(wb, wsTeam, 'Team');

    return wb;
  }

  // --- Browser Download Trigger ---
  async function downloadWorkspaceBackup(customSnapshot = null) {
    const snapshot = customSnapshot || (await buildWorkspaceBackupSnapshot());
    const wb = buildExcelWorkbook(snapshot);
    const XLSX = global.XLSX;
    if (!XLSX) throw new Error('XLSX library not loaded.');

    const filename = formatBackupFilename(snapshot.meta.workspaceName);

    // Generate real XLSX binary buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    if (typeof window !== 'undefined' && window.document) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 200);
    }

    return { filename, snapshot, size: blob.size };
  }

  const backupService = {
    sanitizeForFormulaInjection,
    cleanVal,
    sanitizeFilename,
    formatBackupFilename,
    buildWorkspaceBackupSnapshot,
    buildExcelWorkbook,
    downloadWorkspaceBackup
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = backupService;
  }
  if (typeof global !== 'undefined') {
    global.backupService = backupService;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
