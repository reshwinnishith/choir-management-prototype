// Choir Manager - v1.6A Client Workflow Pass

// Local State References (Managed via Services Layer)
let people = peopleService.getAll();
let events = eventService.getAll();
let tags = tagService.getAll();
let looks = storageService.get('choirProtoLooks', []);

let selectedRosterTagIds = [];
let currentStatsPeriod = 'month'; // 'month' | 'year' | 'all'
let newStatus = 'enquiry';
let pickedWorkType = 'Unspecified';
let editEventId = null;
let detailEventId = null;
let tempAssignedSingers = null; // Array of { personId, status }
let tempManagers = null;        // Array of personId
let replaceTargetPersonId = null;

// Helpers
function money(v) {
  if (!v || Number(v) === 0) return '—';
  return '₹' + Number(v).toLocaleString('en-IN');
}

function dateParts(d) {
  const x = new Date(d + 'T00:00:00');
  return {
    day: x.getDate(),
    mon: x.toLocaleString('en', { month: 'short' }),
    full: x.toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

function workTypePillClass(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('perf')) return 'work-performance';
  if (t.includes('rec')) return 'work-recording';
  if (t.includes('reh')) return 'work-rehearsal';
  if (t.includes('shoot')) return 'work-shoot';
  if (t.includes('sound')) return 'work-soundcheck';
  return 'pill';
}

function getTagGroupPillClass(group) {
  if (group === 'membership') return 'tag-membership';
  if (group === 'language') return 'tag-language';
  if (group === 'eligibility') return 'tag-eligibility';
  return 'tag-custom';
}

// Tag Filter Engine: Within SAME group: OR, Across DIFFERENT groups: AND
function filterPeopleByTags(peopleList, selectedTagIds) {
  if (!selectedTagIds || selectedTagIds.length === 0) return peopleList;

  const activeTags = tagService.getAll();
  const groupedTagIds = {};
  selectedTagIds.forEach(id => {
    const t = activeTags.find(x => x.id === id);
    if (t) {
      if (!groupedTagIds[t.group]) groupedTagIds[t.group] = [];
      groupedTagIds[t.group].push(id);
    }
  });

  return peopleList.filter(p => {
    return Object.keys(groupedTagIds).every(groupKey => {
      const allowedInGroup = groupedTagIds[groupKey];
      return allowedInGroup.some(tagId => (p.tagIds || []).includes(tagId));
    });
  });
}

// Navigation
function go(id) {
  document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav button').forEach(x => x.classList.toggle('active', x.dataset.screen === id));
  
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = (id === 'home' || id === 'calendar') ? 'flex' : 'none';
  
  window.scrollTo(0, 0);
  render();
}

// Event Card Generator for Home & Calendar
function eventCard(e) {
  const d = dateParts(e.date);
  const clientObj = e.clientId ? clientService.getById(e.clientId) : null;
  const venueObj = e.venueId ? venueService.getById(e.venueId) : null;
  const evtTypeObj = e.eventTypeId ? eventTypeService.getById(e.eventTypeId) : null;

  let primaryTitle = '';
  let secondaryTitle = '';

  if (clientObj && clientObj.name) {
    primaryTitle = clientObj.name;
    secondaryTitle = e.name && e.name !== 'Untitled Show' ? e.name : '';
  } else {
    primaryTitle = e.name || 'Untitled Event';
    secondaryTitle = '';
  }

  let locationText = '';
  if (venueObj) {
    const locParts = [venueObj.name];
    if (venueObj.city) locParts.push(venueObj.city);
    locationText = locParts.join(' · ');
  } else if (e.venue) {
    locationText = e.venue;
  } else if (e.city) {
    locationText = `Venue TBC · ${e.city}`;
  } else {
    locationText = 'Venue TBC';
  }

  const evtTypeName = (evtTypeObj && evtTypeObj.id !== 'event_type_unspecified') ? evtTypeObj.name : '';
  const availConfirmed = (e.assignedSingers || []).filter(s => s.status === 'Available').length;
  const unavailableCount = (e.assignedSingers || []).filter(s => s.status === 'Unavailable').length;
  const moneyText = money(e.budget);

  return `
    <div class="card compact clickable" onclick="openDetail(${e.id})">
      <div class="event-line">
        <div class="datebox"><span>${d.mon}</span><b>${d.day}</b></div>
        <div>
          <div class="client-primary-title">${primaryTitle} ${e.isDemoFixture ? '<span class="tiny" style="color:var(--purple); font-weight:700">[Demo]</span>' : ''}</div>
          ${secondaryTitle ? `<div class="event-secondary-title">${secondaryTitle}</div>` : ''}
          <div class="location-sub-line">${locationText}</div>
          <div class="tagrow" style="margin-top:4px">
            <span class="pill ${e.status}">${e.status === 'confirmed' ? 'Confirmed' : 'Enquiry'}</span>
            ${evtTypeName ? `<span class="pill ${workTypePillClass(evtTypeName)}">${evtTypeName}</span>` : ''}
            <span class="pill">${availConfirmed}/${e.singersCount} singers</span>
            ${unavailableCount > 0 ? `<span class="pill avail-unavailable">⚠️ ${unavailableCount} unavailable</span>` : ''}
          </div>
        </div>
        <div class="money">${moneyText !== '—' ? moneyText : ''}</div>
      </div>
    </div>
  `;
}

// Main Render Function
function render() {
  // Sync state from services
  people = peopleService.getAll();
  events = eventService.getAll();
  tags = tagService.getAll();

  const now = new Date();
  const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Home Stats & Events
  const monthEvents = events.filter(e => e.date.startsWith(curMonthStr));
  document.getElementById('statEnq').textContent = monthEvents.filter(e => e.status === 'enquiry').length;
  document.getElementById('statShows').textContent = monthEvents.filter(e => e.status === 'confirmed').length;

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
  document.getElementById('homeEvents').innerHTML = sortedEvents.slice(0, 5).map(eventCard).join('');

  // Render Needs Attention
  renderNeedsAttention();

  // Calendar Screen
  renderCalendar(now, curMonthStr);

  // Singers Screen
  renderSingers();

  // Statistics Screen
  renderStatistics();
}

// Needs Attention Section on Home Screen
function renderNeedsAttention() {
  const container = document.getElementById('needsAttentionList');
  if (!container) return;

  const attentionEvents = events.filter(e => {
    if (e.status !== 'confirmed') return false;
    const assigned = e.assignedSingers || [];
    const availCount = assigned.filter(s => s.status === 'Available').length;
    const unavailCount = assigned.filter(s => s.status === 'Unavailable').length;
    return (availCount < e.singersCount) || (unavailCount > 0);
  });

  if (!attentionEvents.length) {
    container.innerHTML = `<div class="notice">✨ All upcoming shows are fully staffed with no issues!</div>`;
    return;
  }

  container.innerHTML = attentionEvents.map(e => {
    const assigned = e.assignedSingers || [];
    const availCount = assigned.filter(s => s.status === 'Available').length;
    const unavailCount = assigned.filter(s => s.status === 'Unavailable').length;
    const needed = Math.max(0, e.singersCount - availCount);
    const venueObj = getVenueById(e.venueId);
    const venueName = venueObj ? venueObj.name : (e.venue || 'Venue TBC');

    let reasonText = '';
    let btnText = 'Manage Lineup';
    let isDanger = false;

    if (unavailCount > 0) {
      reasonText = `⚠️ ${unavailCount} assigned singer marked Unavailable`;
      btnText = 'Find Replacement';
      isDanger = true;
    } else if (needed > 0) {
      reasonText = `📌 ${needed} singer${needed > 1 ? 's' : ''} still needed (${availCount}/${e.singersCount} confirmed)`;
      btnText = 'Assign Singers';
    }

    return `
      <div class="card compact ${isDanger ? 'attention-danger' : 'attention'}">
        <div class="row between">
          <div>
            <div class="title">${e.name}</div>
            <div class="muted">${dateParts(e.date).full} · ${venueName}</div>
            <div class="tiny" style="margin-top:4px; font-weight:700; color:${isDanger ? '#8a302e' : '#6d5612'}">${reasonText}</div>
          </div>
          <button class="btn ${isDanger ? 'danger' : 'warning'} small" onclick="openDetail(${e.id})">${btnText}</button>
        </div>
      </div>
    `;
  }).join('');
}

// Calendar Render
function renderCalendar(now, curMonthStr) {
  const g = document.getElementById('calGrid');
  if (!g) return;
  g.innerHTML = '';

  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) g.insertAdjacentHTML('beforeend', '<div></div>');

  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${curMonthStr}-${String(day).padStart(2, '0')}`;
    const same = events.filter(e => e.date === ds);
    let cls = 'day';
    if (same.length) cls += ' has';
    if (same.some(e => e.status === 'enquiry') && !same.some(e => e.status === 'confirmed')) cls += ' enq';

    g.insertAdjacentHTML('beforeend', `<div class="${cls}" onclick="focusDay('${ds}')">${day}</div>`);
  }

  const calEvents = events.filter(e => e.date.startsWith(curMonthStr)).sort((a, b) => a.date.localeCompare(b.date));
  document.getElementById('calendarEvents').innerHTML = calEvents.length ? calEvents.map(eventCard).join('') : '<div class="empty">No events scheduled this month.</div>';
  document.getElementById('monthCount').textContent = calEvents.length + ' events';
}

function focusDay(ds) {
  const items = events.filter(e => e.date === ds);
  if (items.length) openDetail(items[0].id);
}

// Render Filter Bar Helper Component
function renderTagFilterUI(containerId, activeTagIds, toggleTagFnName, clearFnName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const activeTags = tagService.getAll();
  const groups = ['membership', 'language', 'eligibility', 'custom'];
  const groupTitles = { membership: 'Membership', language: 'Language', eligibility: 'Eligibility', custom: 'Custom Tags' };

  let html = `<div class="filter-box">`;
  
  groups.forEach(gKey => {
    const groupTags = activeTags.filter(t => t.active && t.group === gKey);
    if (!groupTags.length) return;

    html += `<div class="filter-group-title">${groupTitles[gKey]}</div><div class="tagrow">`;
    groupTags.forEach(t => {
      const isOn = activeTagIds.includes(t.id);
      const pillCls = getTagGroupPillClass(t.group);
      html += `<button class="pill ${pillCls} ${isOn ? 'on' : ''}" onclick="${toggleTagFnName}('${t.id}')">${t.name}</button>`;
    });
    html += `</div>`;
  });

  if (activeTagIds.length > 0) {
    html += `<div class="row between" style="margin-top:10px; border-top:1px solid var(--line); padding-top:8px">
      <span class="tiny" style="font-weight:700">${activeTagIds.length} active filter${activeTagIds.length > 1 ? 's' : ''}</span>
      <button class="btn ghost small" style="padding:4px 8px; font-size:11px" onclick="${clearFnName}()">Clear all</button>
    </div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function toggleRosterFilterTag(tagId) {
  if (selectedRosterTagIds.includes(tagId)) {
    selectedRosterTagIds = selectedRosterTagIds.filter(id => id !== tagId);
  } else {
    selectedRosterTagIds.push(tagId);
  }
  renderSingers();
}

function clearRosterFilterTags() {
  selectedRosterTagIds = [];
  renderSingers();
}

// Singers Screen Render
function renderSingers() {
  const q = (document.getElementById('singerSearch')?.value || '').toLowerCase();
  people = peopleService.getAll();
  tags = tagService.getAll();

  renderTagFilterUI('singerFilterBar', selectedRosterTagIds, 'toggleRosterFilterTag', 'clearRosterFilterTags');

  const tagFiltered = filterPeopleByTags(people, selectedRosterTagIds);
  const filtered = tagFiltered.filter(p => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const listEl = document.getElementById('singerList');
  if (!listEl) return;

  listEl.innerHTML = filtered.length ? filtered.map(p => {
    const history = getSingerHistory(p.id);
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);

    return `
      <div class="card compact">
        <div class="row between">
          <div class="person">
            <div class="avatar">${p.name[0]}</div>
            <div>
              <div class="title">${p.name} <span class="tiny">(${p.gender})</span></div>
              <div class="tagrow" style="margin-top:4px">
                ${pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
              </div>
              <div class="tiny" style="margin-top:4px; font-weight:700; color:var(--brand)">
                📊 ${history.totalShows} shows · Last: ${history.lastShowDate}
              </div>
            </div>
          </div>
          <button class="btn ghost small" onclick="openEditSingerModal('${p.id}')">Edit</button>
        </div>
        ${history.recentShows.length ? `
          <div class="history-list">
            <div class="tiny" style="font-weight:700; margin-bottom:4px">Recent Shows:</div>
            ${history.recentShows.map(s => `
              <div class="history-item">
                <span><b>${s.name}</b> ${s.workType !== 'Unspecified' ? '(' + s.workType + ')' : ''}</span>
                <span>${s.date}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('') : '<div class="empty">No singers found matching filters.</div>';
}

// STATISTICS TAB ENGINE (Excludes Demo Fixtures & Manager-only Participation)
function setStatsPeriod(period) {
  currentStatsPeriod = period;
  renderStatistics();
}

function renderStatistics() {
  const container = document.getElementById('statisticsBody');
  if (!container) return;

  people = peopleService.getAll();
  events = eventService.getAll();
  const realEvents = events.filter(e => !e.isDemoFixture);
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthStr = `${curYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let filteredEvents = realEvents;
  let periodLabel = 'All Time';

  if (currentStatsPeriod === 'month') {
    filteredEvents = realEvents.filter(e => e.date.startsWith(curMonthStr));
    periodLabel = now.toLocaleString('en', { month: 'long', year: 'numeric' });
  } else if (currentStatsPeriod === 'year') {
    filteredEvents = realEvents.filter(e => e.date.startsWith(String(curYear)));
    periodLabel = `Year ${curYear}`;
  }

  // Summary Overview Metrics
  const totalEvents = filteredEvents.length;
  const confirmedCount = filteredEvents.filter(e => e.status === 'confirmed').length;
  const enquiryCount = filteredEvents.filter(e => e.status === 'enquiry').length;

  // CORRECT: Unique SINGERS used (EXCLUDING manager-only appearances!)
  const uniqueSingersUsed = new Set();
  let totalSingersNeededSum = 0;

  filteredEvents.forEach(e => {
    totalSingersNeededSum += (e.singersCount || 0);
    (e.assignedSingers || []).forEach(s => uniqueSingersUsed.add(s.personId));
  });

  const activeRosterCount = people.filter(p => p.active !== false).length;
  const singersUsedCount = uniqueSingersUsed.size;
  const avgSingersPerEvent = totalEvents > 0 ? (totalSingersNeededSum / totalEvents).toFixed(1) : 0;

  // Work Type Breakdown
  const workTypeCounts = { Performance: 0, Recording: 0, Rehearsal: 0, Shoot: 0, Soundcheck: 0, Unspecified: 0 };
  filteredEvents.forEach(e => {
    const evtTypeObj = getEventTypeById(e.eventTypeId);
    const wt = (evtTypeObj && evtTypeObj.id !== 'event_type_unspecified') ? evtTypeObj.name : 'Unspecified';
    if (workTypeCounts[wt] !== undefined) workTypeCounts[wt]++;
    else workTypeCounts.Unspecified++;
  });

  // Category Breakdown
  const categoryCounts = { Wedding: 0, Corporate: 0, 'Private Event': 0, Concert: 0, Unspecified: 0 };
  filteredEvents.forEach(e => {
    const cat = e.category || 'Unspecified';
    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
    else categoryCounts.Unspecified++;
  });

  // CORRECT: Singer Show Counts in Selected Period (EXCLUDING manager-only participation)
  const personShowCounts = {};
  people.forEach(p => { personShowCounts[p.id] = 0; });

  filteredEvents.forEach(e => {
    const assignedIds = new Set((e.assignedSingers || []).map(s => s.personId));
    assignedIds.forEach(pId => {
      if (personShowCounts[pId] !== undefined) {
        personShowCounts[pId]++;
      }
    });
  });

  // Rotation Buckets
  const bucket0 = [], bucket1_2 = [], bucket3_5 = [], bucket6Plus = [];
  people.forEach(p => {
    const cnt = personShowCounts[p.id] || 0;
    if (cnt === 0) bucket0.push(p);
    else if (cnt <= 2) bucket1_2.push(p);
    else if (cnt <= 5) bucket3_5.push(p);
    else bucket6Plus.push(p);
  });

  // Membership Comparison
  const oldMembers = people.filter(p => (p.tagIds || []).includes('tag_old_member'));
  const newMembers = people.filter(p => (p.tagIds || []).includes('tag_new_member'));

  const oldUsed = oldMembers.filter(p => (personShowCounts[p.id] || 0) > 0);
  const oldZero = oldMembers.filter(p => (personShowCounts[p.id] || 0) === 0);

  const newUsed = newMembers.filter(p => (personShowCounts[p.id] || 0) > 0);
  const newZero = newMembers.filter(p => (personShowCounts[p.id] || 0) === 0);

  // Roster Coverage (Active Roster Combinations)
  const coverageCombos = [
    { label: 'Tamil · Performance', tag1: 'tag_tamil', tag2: 'tag_performance' },
    { label: 'Tamil · Recording', tag1: 'tag_tamil', tag2: 'tag_recording' },
    { label: 'English · Performance', tag1: 'tag_english', tag2: 'tag_performance' },
    { label: 'English · Recording', tag1: 'tag_english', tag2: 'tag_recording' },
    { label: 'Malayalam · Performance', tag1: 'tag_malayalam', tag2: 'tag_performance' },
    { label: 'Malayalam · Recording', tag1: 'tag_malayalam', tag2: 'tag_recording' },
    { label: 'Hindi · Performance', tag1: 'tag_hindi', tag2: 'tag_performance' },
    { label: 'Hindi · Recording', tag1: 'tag_hindi', tag2: 'tag_recording' }
  ];

  container.innerHTML = `
    <!-- Period Selector Tabs -->
    <div class="period-tabs">
      <button class="${currentStatsPeriod === 'month' ? 'active' : ''}" onclick="setStatsPeriod('month')">This Month</button>
      <button class="${currentStatsPeriod === 'year' ? 'active' : ''}" onclick="setStatsPeriod('year')">This Year</button>
      <button class="${currentStatsPeriod === 'all' ? 'active' : ''}" onclick="setStatsPeriod('all')">All Time</button>
    </div>

    <!-- Overview Stat Cards -->
    <div class="grid3">
      <div class="stat"><span class="muted">Events</span><b>${totalEvents}</b></div>
      <div class="stat"><span class="muted">Confirmed</span><b style="color:var(--green)">${confirmedCount}</b></div>
      <div class="stat"><span class="muted">Enquiries</span><b style="color:var(--amber)">${enquiryCount}</b></div>
    </div>

    <div class="grid3" style="margin-top:8px">
      <div class="stat"><span class="muted">Active Roster</span><b>${activeRosterCount}</b></div>
      <div class="stat"><span class="muted">Singers Used</span><b style="color:var(--brand)">${singersUsedCount}</b></div>
      <div class="stat"><span class="muted">Avg Singers</span><b>${avgSingersPerEvent}</b></div>
    </div>

    <!-- Rotation Distribution Buckets (Actionable Drill-down) -->
    <div class="section"><h2>Rotation Distribution (${periodLabel})</h2></div>
    <div class="grid2">
      <div class="card compact clickable" onclick="openStatsDrilldown('Zero Shows (${periodLabel})', 'Singers with 0 assigned shows in ${periodLabel}', getBucketSingers(0))">
        <div class="row between"><b>0 Shows</b><b style="font-size:20px; color:var(--red)">${bucket0.length} singers</b></div>
        <div class="tiny" style="margin-top:2px">Tap to view list →</div>
      </div>
      <div class="card compact clickable" onclick="openStatsDrilldown('1–2 Shows (${periodLabel})', 'Singers with 1 to 2 shows in ${periodLabel}', getBucketSingers(1,2))">
        <div class="row between"><b>1–2 Shows</b><b style="font-size:20px">${bucket1_2.length} singers</b></div>
        <div class="tiny" style="margin-top:2px">Tap to view list →</div>
      </div>
      <div class="card compact clickable" onclick="openStatsDrilldown('3–5 Shows (${periodLabel})', 'Singers with 3 to 5 shows in ${periodLabel}', getBucketSingers(3,5))">
        <div class="row between"><b>3–5 Shows</b><b style="font-size:20px">${bucket3_5.length} singers</b></div>
        <div class="tiny" style="margin-top:2px">Tap to view list →</div>
      </div>
      <div class="card compact clickable" onclick="openStatsDrilldown('6+ Shows (${periodLabel})', 'Singers with 6 or more shows in ${periodLabel}', getBucketSingers(6,999))">
        <div class="row between"><b>6+ Shows</b><b style="font-size:20px; color:var(--brand)">${bucket6Plus.length} singers</b></div>
        <div class="tiny" style="margin-top:2px">Tap to view list →</div>
      </div>
    </div>

    <!-- Membership Usage Comparison -->
    <div class="section"><h2>Membership Breakdown</h2></div>
    <div class="card compact">
      <div class="row between" style="margin-bottom:8px">
        <div><b>Old Members (${oldMembers.length})</b></div>
        <div class="tiny">Used: <b>${oldUsed.length}</b> · Zero: <b style="color:var(--red)" class="clickable" onclick="openStatsDrilldown('Old Members with 0 Shows', 'Old members not assigned in ${periodLabel}', getOldZeroSingers())">${oldZero.length} →</b></div>
      </div>
      <div class="row between">
        <div><b>New Members (${newMembers.length})</b></div>
        <div class="tiny">Used: <b>${newUsed.length}</b> · Zero: <b style="color:var(--red)" class="clickable" onclick="openStatsDrilldown('New Members with 0 Shows', 'New members not assigned in ${periodLabel}', getNewZeroSingers())">${newZero.length} →</b></div>
      </div>
    </div>

    <!-- Event Work Type Breakdown -->
    <div class="section"><h2>Work Type Breakdown</h2></div>
    <div class="card compact">
      ${Object.keys(workTypeCounts).map(wt => {
        const cnt = workTypeCounts[wt];
        const pct = totalEvents > 0 ? Math.round((cnt / totalEvents) * 100) : 0;
        return `
          <div class="metric-bar-item">
            <div class="metric-bar-label"><span>${wt}</span><span>${cnt} events (${pct}%)</span></div>
            <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Roster Coverage (Active Roster Combinations) -->
    <div class="section"><h2>Roster Strength & Coverage</h2></div>
    <div class="grid2">
      ${coverageCombos.map(c => {
        const matched = people.filter(p => (p.tagIds || []).includes(c.tag1) && (p.tagIds || []).includes(c.tag2));
        return `
          <div class="card compact clickable" onclick="openStatsDrilldown('${c.label}', 'Active singers holding both ${c.label} tags', getCoverageSingers('${c.tag1}', '${c.tag2}'))">
            <div class="row between">
              <span class="muted" style="font-size:12px">${c.label}</span>
              <b style="font-size:18px">${matched.length}</b>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Helpers for Stats Drill-down Lists
function getBucketSingers(minShows, maxShows = minShows) {
  const realEvents = events.filter(e => !e.isDemoFixture);
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthStr = `${curYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let filteredEvents = realEvents;
  if (currentStatsPeriod === 'month') filteredEvents = realEvents.filter(e => e.date.startsWith(curMonthStr));
  else if (currentStatsPeriod === 'year') filteredEvents = realEvents.filter(e => e.date.startsWith(String(curYear)));

  const counts = {};
  people.forEach(p => counts[p.id] = 0);
  filteredEvents.forEach(e => {
    const assignedIds = new Set((e.assignedSingers || []).map(s => s.personId));
    assignedIds.forEach(pId => {
      if (counts[pId] !== undefined) counts[pId]++;
    });
  });

  return people.filter(p => {
    const cnt = counts[p.id] || 0;
    return cnt >= minShows && cnt <= maxShows;
  });
}

function getOldZeroSingers() {
  return getBucketSingers(0, 0).filter(p => (p.tagIds || []).includes('tag_old_member'));
}

function getNewZeroSingers() {
  return getBucketSingers(0, 0).filter(p => (p.tagIds || []).includes('tag_new_member'));
}

function getCoverageSingers(tag1, tag2) {
  return people.filter(p => (p.tagIds || []).includes(tag1) && (p.tagIds || []).includes(tag2));
}

function openStatsDrilldown(title, subtitle, personList) {
  document.getElementById('drilldownTitle').textContent = title;
  document.getElementById('drilldownSub').textContent = subtitle;

  const container = document.getElementById('drilldownList');
  if (!container) return;

  container.innerHTML = personList.length ? personList.map(p => {
    const history = getSingerHistory(p.id);
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);

    return `
      <div class="card compact">
        <div class="row between">
          <div class="person">
            <div class="avatar">${p.name[0]}</div>
            <div>
              <div class="title">${p.name}</div>
              <div class="tagrow" style="margin-top:2px">
                ${pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
              </div>
              <div class="tiny" style="margin-top:2px">Last show: <b>${history.lastShowDate}</b></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty">No singers found for this criteria.</div>';

  document.getElementById('drilldownModal').classList.add('open');
}

// Event Details & Lineup Modal
function openDetail(id) {
  detailEventId = id;
  const e = eventService.getById(id);
  if (!e) return;

  tempAssignedSingers = JSON.parse(JSON.stringify(e.assignedSingers || []));
  tempManagers = JSON.parse(JSON.stringify(e.managers || []));

  renderDetailModal();
  document.getElementById('detailModal').classList.add('open');
}

function renderDetailModal() {
  const e = eventService.getById(detailEventId);
  if (!e) return;

  const d = dateParts(e.date);
  const clientObj = e.clientId ? clientService.getById(e.clientId) : null;
  const venueObj = e.venueId ? venueService.getById(e.venueId) : null;
  const evtTypeObj = e.eventTypeId ? eventTypeService.getById(e.eventTypeId) : null;

  let primaryTitle = '';
  let secondaryTitle = '';

  if (clientObj && clientObj.name) {
    primaryTitle = clientObj.name;
    secondaryTitle = e.name && e.name !== 'Untitled Show' ? e.name : '';
  } else {
    primaryTitle = e.name || 'Untitled Event';
    secondaryTitle = '';
  }

  let venueNameLine = venueObj ? venueObj.name : (e.venue || 'Venue TBC');
  let cityStateLine = '';
  if (venueObj && venueObj.city) {
    cityStateLine = venueObj.state ? `${venueObj.city} · ${venueObj.state}` : venueObj.city;
  } else if (e.city) {
    cityStateLine = e.state ? `${e.city} · ${e.state}` : e.city;
  }

  const evtTypeName = (evtTypeObj && evtTypeObj.id !== 'event_type_unspecified') ? evtTypeObj.name : '';

  const assigned = tempAssignedSingers || [];
  const managers = tempManagers || [];

  const availConfirmed = assigned.filter(s => s.status === 'Available').length;
  const askedCount = assigned.filter(s => s.status === 'Asked').length;
  const unavailCount = assigned.filter(s => s.status === 'Unavailable').length;
  const notAskedCount = assigned.filter(s => s.status === 'Not asked').length;
  const neededCount = Math.max(0, e.singersCount - availConfirmed);

  const isChanged = (JSON.stringify(e.assignedSingers || []) !== JSON.stringify(tempAssignedSingers)) ||
                    (JSON.stringify(e.managers || []) !== JSON.stringify(tempManagers));

  const progressPercent = Math.min(100, Math.round((availConfirmed / e.singersCount) * 100));

  document.getElementById('detailBody').innerHTML = `
    <div class="handle"></div>
    <div class="row between">
      <div>
        <span class="pill ${e.status}" style="margin-bottom:6px">${e.status === 'confirmed' ? 'Confirmed Show' : 'Enquiry'}</span>
        <h2 class="client-primary-title" style="font-size:22px; margin-top:4px">${primaryTitle} ${e.isDemoFixture ? '<span class="tiny" style="color:var(--purple); font-weight:700">[Demo]</span>' : ''}</h2>
        ${secondaryTitle ? `<div class="event-secondary-title" style="font-size:15px">${secondaryTitle}</div>` : ''}
        <div class="sub" style="margin-top:6px; font-weight:600; color:var(--ink)">📅 ${d.full} ${e.time ? '· ' + e.time : ''}</div>
        <div class="sub" style="margin-top:2px">📍 ${venueNameLine}</div>
        ${cityStateLine ? `<div class="tiny" style="color:var(--muted); margin-left:18px">${cityStateLine}</div>` : ''}
        ${evtTypeName ? `<div style="margin-top:8px"><span class="pill ${workTypePillClass(evtTypeName)}">${evtTypeName}</span></div>` : ''}
      </div>
      <button class="btn ghost small" onclick="closeModalSafe('detailModal')">Close</button>
    </div>

    <div class="row" style="margin-top:14px; gap:8px;">
      <button class="btn soft small full" onclick="openEditEvent(${e.id})">Edit Event</button>
      <button class="btn danger small full" onclick="deleteEvent(${e.id})">Delete Event</button>
    </div>

    ${(e.budget || e.language || e.notes) ? `
      <div class="card compact" style="margin-top:14px">
        ${e.budget ? `<div class="row between"><span class="muted">Budget</span><b>${money(e.budget)}</b></div>` : ''}
        <div class="row between" style="margin-top:4px"><span class="muted">Singers Needed</span><b>${e.singersCount} singers</b></div>
        ${e.language ? `<div class="row between" style="margin-top:4px"><span class="muted">Language</span><b>${e.language}</b></div>` : ''}
        ${e.notes ? `<div style="margin-top:8px; font-size:13px" class="notice"><b>Notes:</b> ${e.notes}</div>` : ''}
      </div>
    ` : ''}

    ${e.status === 'enquiry' ? `
      <button class="btn primary full" style="margin-top:14px" onclick="confirmEvent(${e.id})">Convert Enquiry to Confirmed Show</button>
    ` : ''}

    <!-- Lineup Section -->
    <div class="section row between" style="margin-top:18px">
      <h2>Managers</h2>
      <button class="btn soft small" onclick="openAddManagerModal()">+ Add Manager</button>
    </div>
    <div class="card compact">
      ${managers.length ? managers.map(mId => {
        const mPerson = peopleService.getById(mId);
        const mName = mPerson ? mPerson.name : 'Unknown';
        return `
          <div class="row between" style="padding:6px 0">
            <div class="person">
              <div class="avatar manager-avatar">${mName[0]}</div>
              <div><b>${mName}</b> <span class="tiny">(Manager)</span></div>
            </div>
            <button class="btn danger small" onclick="removeManager('${mId}')">Remove</button>
          </div>
        `;
      }).join('') : '<div class="empty" style="padding:10px">No managers assigned.</div>'}
    </div>

    <!-- Singers Lineup Section -->
    <div class="section row between">
      <h2>Singers Lineup</h2>
      <span class="meta" onclick="openSuggestModal()">💡 Suggest Singers</span>
    </div>

    <div class="card compact">
      <div class="row between">
        <b>Lineup Progress</b>
        <span><b>${availConfirmed}</b> / ${e.singersCount} Confirmed</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${progressPercent}%"></div>
      </div>
      <div class="tagrow" style="margin-top:6px">
        <span class="pill avail-available">${availConfirmed} Available</span>
        <span class="pill avail-asked">${askedCount} Asked</span>
        <span class="pill avail-notasked">${notAskedCount} Not asked</span>
        ${unavailCount > 0 ? `<span class="pill avail-unavailable">${unavailCount} Unavailable</span>` : ''}
        ${neededCount > 0 ? `<span class="pill" style="background:#ffe8e8; color:#a32a2a">⚠️ ${neededCount} needed</span>` : ''}
      </div>
    </div>

    <div class="card compact" style="padding:0">
      ${assigned.length ? assigned.map(s => {
        const pObj = peopleService.getById(s.personId);
        const sName = pObj ? pObj.name : 'Unknown';
        return `
          <div style="padding:12px; border-bottom:1px solid var(--line)">
            <div class="row between">
              <div class="person">
                <div class="avatar">${sName[0]}</div>
                <div>
                  <div class="title">${sName}</div>
                  <div class="tiny">Status:</div>
                </div>
              </div>
              <div class="row" style="gap:6px">
                <select class="avail-select" onchange="changeSingerStatus('${s.personId}', this.value)">
                  <option value="Not asked" ${s.status === 'Not asked' ? 'selected' : ''}>Not asked</option>
                  <option value="Asked" ${s.status === 'Asked' ? 'selected' : ''}>Asked</option>
                  <option value="Available" ${s.status === 'Available' ? 'selected' : ''}>Available</option>
                  <option value="Unavailable" ${s.status === 'Unavailable' ? 'selected' : ''}>Unavailable</option>
                </select>
                <button class="btn danger small" onclick="removeSingerFromLineup('${s.personId}')">Remove</button>
              </div>
            </div>
            ${s.status === 'Unavailable' ? `
              <div style="margin-top:8px; text-align:right">
                <button class="btn warning small" onclick="openFindReplacementModal('${s.personId}')">🔄 Find Replacement for ${sName}</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('') : '<div class="empty">No singers assigned to lineup yet.</div>'}
    </div>

    <div class="row" style="margin-top:14px; gap:8px;">
      <button class="btn soft full" style="flex:1" onclick="openAddSingerModal()">+ Add Singer</button>
      ${isChanged ? `<button class="btn primary full" style="flex:1" onclick="saveLineupChanges()">Save Lineup Changes</button>` : ''}
    </div>
  `;
}

function confirmEvent(id) {
  eventService.update(id, { status: 'confirmed' });
  render();
  openDetail(id);
}

function changeSingerStatus(personId, newStatus) {
  const item = (tempAssignedSingers || []).find(s => s.personId === personId);
  if (item) {
    item.status = newStatus;
    renderDetailModal();
  }
}

function removeSingerFromLineup(personId) {
  tempAssignedSingers = (tempAssignedSingers || []).filter(s => s.personId !== personId);
  renderDetailModal();
}

function removeManager(personId) {
  tempManagers = (tempManagers || []).filter(m => m !== personId);
  renderDetailModal();
}

function saveLineupChanges() {
  eventService.update(detailEventId, {
    assignedSingers: JSON.parse(JSON.stringify(tempAssignedSingers)),
    managers: JSON.parse(JSON.stringify(tempManagers))
  });
  render();
  renderDetailModal();
}

function hasUnsavedChanges() {
  if (!detailEventId) return false;
  const e = eventService.getById(detailEventId);
  if (!e) return false;

  return (JSON.stringify(e.assignedSingers || []) !== JSON.stringify(tempAssignedSingers)) ||
         (JSON.stringify(e.managers || []) !== JSON.stringify(tempManagers));
}

function closeModalSafe(id) {
  if (id === 'detailModal' && hasUnsavedChanges()) {
    if (confirm('You have unsaved lineup changes. Discard them and close?')) {
      closeModal(id);
    }
  } else {
    closeModal(id);
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Add Singer Modal to Lineup (With Shared Tag Filtering & Default 'Not asked' Status)
let assignModalTagIds = [];
function openAddSingerModal() {
  assignModalTagIds = [];
  renderAssignModalList();
  document.getElementById('assignModal').classList.add('open');
}

function toggleAssignModalTag(tagId) {
  if (assignModalTagIds.includes(tagId)) assignModalTagIds = assignModalTagIds.filter(id => id !== tagId);
  else assignModalTagIds.push(tagId);
  renderAssignModalList();
}

function clearAssignModalTags() {
  assignModalTagIds = [];
  renderAssignModalList();
}

function renderAssignModalList() {
  const assignedPersonIds = (tempAssignedSingers || []).map(s => s.personId);
  const unassigned = peopleService.getAll().filter(p => !assignedPersonIds.includes(p.id));
  const filtered = filterPeopleByTags(unassigned, assignModalTagIds);

  const listEl = document.getElementById('assignList');
  if (!listEl) return;

  renderTagFilterUI('assignFilterBar', assignModalTagIds, 'toggleAssignModalTag', 'clearAssignModalTags');

  listEl.innerHTML = filtered.length ? filtered.map(p => {
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);
    return `
      <div class="card compact replacement">
        <div class="person">
          <div class="avatar">${p.name[0]}</div>
          <div>
            <div class="title">${p.name}</div>
            <div class="tagrow" style="margin-top:2px">
              ${pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
            </div>
          </div>
          <button class="btn soft small" onclick="addSingerToLineup('${p.id}')">+ Add</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty">No matching candidates.</div>';
}

// CRITICAL FIX: Default status for manual add is 'Not asked'
function addSingerToLineup(personId) {
  if (!(tempAssignedSingers || []).some(s => s.personId === personId)) {
    tempAssignedSingers.push({ personId: personId, status: 'Not asked' });
    renderDetailModal();
  }
  closeModal('assignModal');
}

// Add Manager Modal
function openAddManagerModal() {
  const currentManagers = tempManagers || [];
  const candidates = peopleService.getAll().filter(p => !currentManagers.includes(p.id));

  const container = document.getElementById('assignList');
  if (!container) return;

  document.getElementById('assignFilterBar').innerHTML = '';

  container.innerHTML = candidates.map(p => `
    <div class="card compact replacement">
      <div class="person">
        <div class="avatar manager-avatar">${p.name[0]}</div>
        <div>
          <div class="title">${p.name}</div>
          <div class="muted">Manager candidate</div>
        </div>
        <button class="btn soft small" onclick="addManagerToEvent('${p.id}')">+ Add Manager</button>
      </div>
    </div>
  `).join('');

  document.getElementById('assignModal').classList.add('open');
}

function addManagerToEvent(personId) {
  if (!(tempManagers || []).includes(personId)) {
    tempManagers.push(personId);
    renderDetailModal();
  }
  closeModal('assignModal');
}

// Find Replacement Modal
let replaceModalTagIds = [];
function openFindReplacementModal(targetPersonId) {
  replaceTargetPersonId = targetPersonId;
  replaceModalTagIds = [];
  const e = eventService.getById(detailEventId);
  if (!e) return;

  const targetPerson = getPersonById(targetPersonId);
  const targetName = targetPerson ? targetPerson.name : 'Singer';
  const evtType = getEventTypeById(e.eventTypeId);
  const evtTypeName = (evtType && evtType.id !== 'event_type_unspecified') ? evtType.name : 'Unspecified';

  document.getElementById('replaceNotice').innerHTML = `Finding candidate replacement for <b>${targetName}</b> for <b>${e.name}</b> (${evtTypeName}, ${e.language || 'Unspecified'}).`;

  renderReplacementModalList();
  document.getElementById('replaceModal').classList.add('open');
}

function toggleReplaceModalTag(tagId) {
  if (replaceModalTagIds.includes(tagId)) replaceModalTagIds = replaceModalTagIds.filter(id => id !== tagId);
  else replaceModalTagIds.push(tagId);
  renderReplacementModalList();
}

function clearReplaceModalTags() {
  replaceModalTagIds = [];
  renderReplacementModalList();
}

function renderReplacementModalList() {
  const currentAssignedIds = (tempAssignedSingers || []).map(s => s.personId);
  const candidates = peopleService.getAll().filter(p => !currentAssignedIds.includes(p.id));
  const filtered = filterPeopleByTags(candidates, replaceModalTagIds);

  filtered.sort((a, b) => {
    const ha = getSingerHistory(a.id);
    const hb = getSingerHistory(b.id);
    return ha.totalShows - hb.totalShows;
  });

  const listEl = document.getElementById('replacementList');
  if (!listEl) return;

  renderTagFilterUI('replaceFilterBar', replaceModalTagIds, 'toggleReplaceModalTag', 'clearReplaceModalTags');

  listEl.innerHTML = filtered.length ? filtered.map(p => {
    const h = getSingerHistory(p.id);
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);

    return `
      <div class="card compact replacement">
        <div class="person">
          <div class="avatar">${p.name[0]}</div>
          <div>
            <div class="title">${p.name}</div>
            <div class="tagrow" style="margin-top:2px">
              ${pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
            </div>
            <div class="tiny" style="color:var(--brand); font-weight:700; margin-top:3px">📊 ${h.totalShows} shows · Last: ${h.lastShowDate}</div>
          </div>
          <button class="btn soft small" onclick="chooseReplacement('${p.id}')">Choose</button>
        </div>
      </div>
    `;
  }).join('') : '<div class="empty">No matching replacement candidates.</div>';
}

// CRITICAL FIX: Default status for Replacement selection is 'Not asked'
function chooseReplacement(newPersonId) {
  if (replaceTargetPersonId && tempAssignedSingers) {
    tempAssignedSingers = tempAssignedSingers.filter(s => s.personId !== replaceTargetPersonId);
    tempAssignedSingers.push({ personId: newPersonId, status: 'Not asked' });
    renderDetailModal();
    closeModal('replaceModal');
  }
}

// Suggest Lineup Modal
function openSuggestModal() {
  const e = eventService.getById(detailEventId);
  if (!e) return;

  const assignedIds = (tempAssignedSingers || []).map(s => s.personId);
  const unassigned = peopleService.getAll().filter(p => !assignedIds.includes(p.id));

  const scored = unassigned.map(p => {
    const h = getSingerHistory(p.id);
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);
    let matchReasons = [];

    if (e.language && (pTags.some(t => t.name === e.language) || e.language === 'Mixed')) {
      matchReasons.push(`Matches ${e.language}`);
    }

    const evtTypeObj = getEventTypeById(e.eventTypeId);
    if (evtTypeObj && evtTypeObj.id !== 'event_type_unspecified' && pTags.some(t => t.name === evtTypeObj.name || t.name === 'Both')) {
      matchReasons.push(`Eligible for ${evtTypeObj.name}`);
    }

    matchReasons.push(`${h.totalShows} recent shows`);
    matchReasons.push(`Last show: ${h.lastShowDate}`);

    return {
      person: p,
      history: h,
      reasons: matchReasons,
      pTags
    };
  });

  scored.sort((a, b) => a.history.totalShows - b.history.totalShows);

  const container = document.getElementById('suggestList');
  if (!container) return;

  container.innerHTML = scored.map(s => `
    <div class="card compact">
      <div class="person">
        <div class="avatar">${s.person.name[0]}</div>
        <div>
          <div class="title">${s.person.name}</div>
          <div class="tagrow" style="margin-top:2px">
            ${s.pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
          </div>
          <div class="tiny" style="margin-top:2px">${s.reasons.join(' · ')}</div>
        </div>
        <button class="btn soft small" onclick="addSuggestedSinger('${s.person.id}')">+ Assign</button>
      </div>
    </div>
  `).join('');

  document.getElementById('suggestModal').classList.add('open');
}

// CRITICAL FIX: Default status for Suggest Lineup addition is 'Not asked'
function addSuggestedSinger(personId) {
  if (!(tempAssignedSingers || []).some(s => s.personId === personId)) {
    tempAssignedSingers.push({ personId: personId, status: 'Not asked' });
    renderDetailModal();
  }
  closeModal('suggestModal');
}

// ==================================================
// UNIFIED EVENT FORM & PICKERS ENGINE (v1.6B)
// ==================================================

let formStatus = 'enquiry';
let formClientId = null;
let formEventTypeId = 'event_type_performance';
let formVenueId = null;
let formCity = '';
let formState = '';
let formSingersCount = 8;
let formAssignedSingers = [];
let formManagers = [];
let cityPickerTarget = 'event';

let editClientId = null;
let editVenueId = null;
let editEventTypeId = null;
let multiSingerSelectedIds = [];
let multiSingerFilterTagIds = [];
let managerSelectedIds = [];

function setFormStatus(status) {
  formStatus = status;
  const btnEnquiry = document.getElementById('statusBtnEnquiry');
  const btnConfirmed = document.getElementById('statusBtnConfirmed');
  if (btnEnquiry && btnConfirmed) {
    btnEnquiry.classList.toggle('active', status === 'enquiry');
    btnConfirmed.classList.toggle('active', status === 'confirmed');
  }

  const saveBtn = document.getElementById('saveEventBtn');
  if (saveBtn) {
    saveBtn.textContent = status === 'confirmed' ? 'Save Confirmed Show' : 'Save Enquiry';
  }
}

function updateFormDisplay() {
  // Status
  setFormStatus(formStatus);

  // Client
  const clientObj = formClientId ? clientService.getById(formClientId) : null;
  const clientEl = document.getElementById('formClientDisplay');
  if (clientEl) {
    if (clientObj) {
      clientEl.textContent = clientObj.name;
      clientEl.classList.remove('placeholder');
    } else {
      clientEl.textContent = 'Select client...';
      clientEl.classList.add('placeholder');
    }
  }

  // Event Type
  const evtTypeObj = formEventTypeId ? eventTypeService.getById(formEventTypeId) : null;
  const evtTypeEl = document.getElementById('formEventTypeDisplay');
  if (evtTypeEl) {
    evtTypeEl.textContent = evtTypeObj ? evtTypeObj.name : 'Unspecified';
  }

  // Venue
  const venueObj = formVenueId ? venueService.getById(formVenueId) : null;
  const venueEl = document.getElementById('formVenueDisplay');
  if (venueEl) {
    if (venueObj) {
      venueEl.textContent = venueObj.name;
      venueEl.classList.remove('placeholder');
    } else {
      venueEl.textContent = 'Venue TBC';
      venueEl.classList.add('placeholder');
    }
  }

  // City & State
  const cityEl = document.getElementById('formCityDisplay');
  const stateEl = document.getElementById('formStateDisplay');
  if (cityEl) {
    cityEl.textContent = formCity || 'Select city...';
    cityEl.classList.toggle('placeholder', !formCity);
  }
  if (stateEl) {
    stateEl.value = formState || '';
  }

  // Singers & Managers summary
  const singersInput = document.getElementById('fSingers');
  if (singersInput) singersInput.value = formSingersCount;

  const singerSummary = document.getElementById('formSingerSummary');
  if (singerSummary) {
    const selCount = (formAssignedSingers || []).length;
    singerSummary.textContent = selCount > 0 ? `${selCount} Selected` : 'Add Singers';
  }

  const managerSummary = document.getElementById('formManagerSummary');
  if (managerSummary) {
    const selCount = (formManagers || []).length;
    managerSummary.textContent = selCount > 0 ? `${selCount} Selected` : 'Add Managers';
  }
}

function adjustFormSingers(delta) {
  formSingersCount = Math.max(1, formSingersCount + delta);
  updateFormDisplay();
}

function openNew(status) {
  editEventId = null;
  formStatus = status || 'enquiry';
  formClientId = null;
  formEventTypeId = 'event_type_performance';
  formVenueId = null;
  formCity = 'Chennai';
  formState = 'Tamil Nadu';
  formSingersCount = 8;
  formAssignedSingers = [];
  formManagers = [];

  document.getElementById('newEyebrow').textContent = 'Event Form';
  document.getElementById('newTitle').textContent = formStatus === 'enquiry' ? 'New Enquiry' : 'New Confirmed Show';

  document.getElementById('fName').value = '';
  document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('fTime').value = '';
  document.getElementById('fBudget').value = '';
  document.getElementById('fLanguage').value = '';
  document.getElementById('fNotes').value = '';

  updateFormDisplay();
  document.getElementById('newModal').classList.add('open');
}

function openEditEvent(id) {
  if (hasUnsavedChanges()) {
    if (!confirm('You have unsaved lineup changes. Discard them to edit event details?')) return;
  }
  const e = eventService.getById(id);
  if (!e) return;

  editEventId = id;
  formStatus = e.status;
  formClientId = e.clientId || null;
  formEventTypeId = e.eventTypeId || 'event_type_unspecified';
  formVenueId = e.venueId || null;
  formCity = e.city || '';
  formState = e.state || '';

  const venueObj = e.venueId ? venueService.getById(e.venueId) : null;
  if (venueObj && venueObj.city && !formCity) {
    formCity = venueObj.city;
    formState = venueObj.state || '';
  }

  formSingersCount = e.singersCount || 8;
  formAssignedSingers = JSON.parse(JSON.stringify(e.assignedSingers || []));
  formManagers = JSON.parse(JSON.stringify(e.managers || []));

  document.getElementById('newEyebrow').textContent = 'Edit Event';
  document.getElementById('newTitle').textContent = 'Edit Event Details';

  document.getElementById('fName').value = (e.name && e.name !== 'Untitled Show') ? e.name : '';
  document.getElementById('fDate').value = e.date || '';
  document.getElementById('fTime').value = e.time || '';
  document.getElementById('fBudget').value = e.budget ? e.budget : '';
  document.getElementById('fLanguage').value = e.language || '';
  document.getElementById('fNotes').value = e.notes || '';

  updateFormDisplay();
  closeModal('detailModal');
  document.getElementById('newModal').classList.add('open');
}

function saveEvent() {
  const date = document.getElementById('fDate').value;
  if (!formClientId) {
    alert('Client is mandatory for creating or editing an event. Please select a Client.');
    openClientPickerModal();
    return;
  }

  if (!date) {
    alert('Event Date is required.');
    return;
  }

  const nameInput = document.getElementById('fName').value.trim();
  const time = document.getElementById('fTime').value;
  const budgetVal = document.getElementById('fBudget').value;
  const budget = budgetVal ? Number(budgetVal) : 0;
  const language = document.getElementById('fLanguage').value;
  const notes = document.getElementById('fNotes').value.trim();

  const data = {
    name: nameInput || 'Untitled Show',
    status: formStatus,
    clientId: formClientId,
    eventTypeId: formEventTypeId,
    date,
    time,
    venueId: formVenueId,
    city: formCity,
    state: formState,
    singersCount: formSingersCount,
    assignedSingers: formAssignedSingers,
    managers: formManagers,
    budget,
    language,
    notes
  };

  if (editEventId) {
    eventService.update(editEventId, data);
  } else {
    eventService.create(data);
  }

  closeModal('newModal');
  render();

  if (editEventId) {
    openDetail(editEventId);
  } else {
    go('home');
  }
}

// --------------------------------------------------
// CLIENT PICKER & DATABASE
// --------------------------------------------------

function openClientPickerModal() {
  editClientId = null;
  const searchInput = document.getElementById('clientSearchInput');
  if (searchInput) searchInput.value = '';
  toggleNewClientForm(false);
  renderClientPickerList();
  document.getElementById('clientPickerModal').classList.add('open');
}

function renderClientPickerList() {
  const q = (document.getElementById('clientSearchInput')?.value || '').toLowerCase().trim();
  const allClients = clientService.getAll();
  const filtered = allClients.filter(c => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.contactName && c.contactName.toLowerCase().includes(q));
  });

  const container = document.getElementById('clientPickerList');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">No matching clients found. Click below to add a new client.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isSelected = formClientId === c.id;
    return `
      <div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="selectClient('${c.id}')">
        <div>
          <div class="client-primary-title" style="font-size:15px">${c.name}</div>
          ${c.contactName ? `<div class="tiny" style="color:var(--muted)">👤 ${c.contactName} ${c.phone ? '· ' + c.phone : ''}</div>` : ''}
        </div>
        <div class="row" style="gap:6px">
          <button type="button" class="btn ghost small" style="padding:3px 8px; font-size:11px" onclick="event.stopPropagation(); editClient('${c.id}')">Edit</button>
          <div class="check-indicator">${isSelected ? '✓' : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function selectClient(clientId) {
  formClientId = clientId;
  updateFormDisplay();
  closeModal('clientPickerModal');
}

function toggleNewClientForm(show) {
  const container = document.getElementById('newClientFormContainer');
  const toggleBtn = document.getElementById('btnToggleNewClientForm');
  if (!container) return;

  const shouldShow = show !== undefined ? show : (container.style.display === 'none');
  container.style.display = shouldShow ? 'block' : 'none';
  if (toggleBtn) toggleBtn.style.display = shouldShow ? 'none' : 'block';

  if (shouldShow && !editClientId) {
    document.getElementById('clientFormHeaderTitle').textContent = 'Add New Client';
    document.getElementById('ncName').value = '';
    document.getElementById('ncContact').value = '';
    document.getElementById('ncPhone').value = '';
    document.getElementById('ncEmail').value = '';
    document.getElementById('ncNotes').value = '';
  }
}

function editClient(clientId) {
  const c = clientService.getById(clientId);
  if (!c) return;

  editClientId = clientId;
  document.getElementById('clientFormHeaderTitle').textContent = 'Edit Client Details';
  document.getElementById('ncName').value = c.name || '';
  document.getElementById('ncContact').value = c.contactName || '';
  document.getElementById('ncPhone').value = c.phone || '';
  document.getElementById('ncEmail').value = c.email || '';
  document.getElementById('ncNotes').value = c.notes || '';

  toggleNewClientForm(true);
}

function saveNewClient() {
  const name = document.getElementById('ncName').value.trim();
  const contactName = document.getElementById('ncContact').value.trim();
  const phone = document.getElementById('ncPhone').value.trim();
  const email = document.getElementById('ncEmail').value.trim();
  const notes = document.getElementById('ncNotes').value.trim();

  if (!name) return alert('Client Name is required.');

  let clientObj;
  if (editClientId) {
    clientObj = clientService.update(editClientId, { name, contactName, phone, email, notes });
  } else {
    clientObj = clientService.create({ name, contactName, phone, email, notes });
  }

  selectClient(clientObj.id);
}

// --------------------------------------------------
// EVENT TYPE PICKER
// --------------------------------------------------

function openEventTypePickerModal() {
  const input = document.getElementById('eventTypeSearchInput');
  if (input) input.value = '';
  toggleNewEventTypeForm(false);
  renderEventTypePickerList();
  document.getElementById('eventTypePickerModal').classList.add('open');
}

function renderEventTypePickerList() {
  const q = (document.getElementById('eventTypeSearchInput')?.value || '').toLowerCase().trim();
  const allTypes = eventTypeService.getAll().filter(t => t.active);
  const filtered = allTypes.filter(t => !q || t.name.toLowerCase().includes(q));

  const container = document.getElementById('eventTypeList');
  if (!container) return;

  container.innerHTML = filtered.map(t => {
    const isSelected = formEventTypeId === t.id;
    return `
      <div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="selectEventType('${t.id}')">
        <div style="font-weight:700; font-size:14px">${t.name}</div>
        <div class="check-indicator">${isSelected ? '✓' : ''}</div>
      </div>
    `;
  }).join('');
}

function selectEventType(id) {
  formEventTypeId = id;
  updateFormDisplay();
  closeModal('eventTypePickerModal');
}

function toggleNewEventTypeForm(show) {
  const container = document.getElementById('newEventTypeContainer');
  const toggleBtn = document.getElementById('btnToggleNewEventType');
  if (!container) return;
  const shouldShow = show !== undefined ? show : (container.style.display === 'none');
  container.style.display = shouldShow ? 'block' : 'none';
  if (toggleBtn) toggleBtn.style.display = shouldShow ? 'none' : 'block';
  if (shouldShow) document.getElementById('netName').value = '';
}

function saveNewEventType() {
  const name = document.getElementById('netName').value.trim();
  if (!name) return alert('Event Type Name is required.');

  const et = eventTypeService.create({ name });
  selectEventType(et.id);
}

// --------------------------------------------------
// VENUE PICKER & INDIA LOCATION
// --------------------------------------------------

function openVenuePickerModal() {
  const searchInput = document.getElementById('venueSearchInput');
  if (searchInput) searchInput.value = '';
  toggleNewVenueForm(false);
  renderVenuePickerList();
  document.getElementById('venuePickerModal').classList.add('open');
}

function renderVenuePickerList() {
  const q = (document.getElementById('venueSearchInput')?.value || '').toLowerCase().trim();
  const allVenues = venueService.getAll();
  const filtered = allVenues.filter(v => !q || v.name.toLowerCase().includes(q) || (v.city && v.city.toLowerCase().includes(q)));

  const container = document.getElementById('venuePickerList');
  if (!container) return;

  const isTbcSelected = !formVenueId;
  let html = `
    <div class="multi-select-item ${isTbcSelected ? 'selected' : ''}" onclick="selectVenueTbc()">
      <div>
        <div class="client-primary-title" style="font-size:14px; color:var(--muted)">Venue TBC</div>
        <div class="tiny" style="color:var(--muted)">Exact venue not confirmed yet</div>
      </div>
      <div class="check-indicator">${isTbcSelected ? '✓' : ''}</div>
    </div>
  `;

  html += filtered.map(v => {
    const isSelected = formVenueId === v.id;
    return `
      <div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="selectVenue('${v.id}')">
        <div>
          <div class="client-primary-title" style="font-size:15px">${v.name}</div>
          <div class="location-sub-line">${v.city ? `${v.city} · ${v.state || ''}` : 'Location unspecified'}</div>
        </div>
        <div class="check-indicator">${isSelected ? '✓' : ''}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function selectVenue(id) {
  formVenueId = id;
  const v = venueService.getById(id);
  if (v && v.city) {
    formCity = v.city;
    formState = v.state || '';
  }
  updateFormDisplay();
  closeModal('venuePickerModal');
}

function selectVenueTbc() {
  formVenueId = null;
  updateFormDisplay();
  closeModal('venuePickerModal');
}

function toggleNewVenueForm(show) {
  const container = document.getElementById('newVenueFormContainer');
  const toggleBtn = document.getElementById('btnToggleNewVenueForm');
  if (!container) return;

  const shouldShow = show !== undefined ? show : (container.style.display === 'none');
  container.style.display = shouldShow ? 'block' : 'none';
  if (toggleBtn) toggleBtn.style.display = shouldShow ? 'none' : 'block';

  if (shouldShow) {
    document.getElementById('nvName').value = '';
    document.getElementById('nvCityDisplay').textContent = formCity || 'Select city...';
    document.getElementById('nvCityDisplay').classList.toggle('placeholder', !formCity);
    document.getElementById('nvStateDisplay').value = formState || '';
  }
}

function saveNewVenue() {
  const name = document.getElementById('nvName').value.trim();
  const city = (document.getElementById('nvCityDisplay')?.textContent || '').replace('Select city...', '').trim();
  const state = document.getElementById('nvStateDisplay').value.trim();

  if (!name) return alert('Venue Name is required.');
  if (!city) return alert('City is required for a venue.');

  const v = venueService.create({ name, city, state });
  selectVenue(v.id);
}

// India City Picker
function openCityPickerModal(target) {
  cityPickerTarget = target || 'event';
  const searchInput = document.getElementById('citySearchInput');
  if (searchInput) searchInput.value = '';
  renderCityPickerList();
  document.getElementById('cityPickerModal').classList.add('open');
}

function renderCityPickerList() {
  const q = document.getElementById('citySearchInput')?.value || '';
  const cities = cityService.search(q);

  const container = document.getElementById('cityPickerList');
  if (!container) return;

  container.innerHTML = cities.map(item => `
    <div class="multi-select-item" onclick="selectCity('${item.city}', '${item.state}')">
      <div>
        <div style="font-weight:700; font-size:14px">${item.city}</div>
        <div class="tiny" style="color:var(--muted)">${item.state}</div>
      </div>
      <span style="color:var(--brand); font-weight:700">Select ❯</span>
    </div>
  `).join('');
}

function selectCity(cityName, stateName) {
  if (cityPickerTarget === 'venue') {
    const cityDisp = document.getElementById('nvCityDisplay');
    const stateDisp = document.getElementById('nvStateDisplay');
    if (cityDisp) {
      cityDisp.textContent = cityName;
      cityDisp.classList.remove('placeholder');
    }
    if (stateDisp) stateDisp.value = stateName;
  } else {
    formCity = cityName;
    formState = stateName;
    updateFormDisplay();
  }
  closeModal('cityPickerModal');
}

// --------------------------------------------------
// MULTI-SELECT SINGER PICKER FOR EVENT CREATION
// --------------------------------------------------

function openMultiSingerPickerModal() {
  multiSingerSelectedIds = (formAssignedSingers || []).map(s => s.personId);
  multiSingerFilterTagIds = [];
  const input = document.getElementById('multiSingerSearchInput');
  if (input) input.value = '';
  renderMultiSingerPickerList();
  document.getElementById('multiSingerPickerModal').classList.add('open');
}

function toggleMultiSingerFilterTag(tagId) {
  if (multiSingerFilterTagIds.includes(tagId)) {
    multiSingerFilterTagIds = multiSingerFilterTagIds.filter(id => id !== tagId);
  } else {
    multiSingerFilterTagIds.push(tagId);
  }
  renderMultiSingerPickerList();
}

function clearMultiSingerFilterTags() {
  multiSingerFilterTagIds = [];
  renderMultiSingerPickerList();
}

function renderMultiSingerPickerList() {
  const q = (document.getElementById('multiSingerSearchInput')?.value || '').toLowerCase().trim();
  const allPeople = peopleService.getAll();
  const tagFiltered = filterPeopleByTags(allPeople, multiSingerFilterTagIds);
  const filtered = tagFiltered.filter(p => !q || p.name.toLowerCase().includes(q));

  renderTagFilterUI('multiSingerFilterBar', multiSingerFilterTagIds, 'toggleMultiSingerFilterTag', 'clearMultiSingerFilterTags');

  const container = document.getElementById('multiSingerList');
  if (!container) return;

  container.innerHTML = filtered.length ? filtered.map(p => {
    const isSelected = multiSingerSelectedIds.includes(p.id);
    const pTags = (p.tagIds || []).map(id => tagService.getById(id)).filter(Boolean);
    return `
      <div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="toggleMultiSinger('${p.id}')">
        <div class="person">
          <div class="avatar">${p.name[0]}</div>
          <div>
            <div class="title">${p.name}</div>
            <div class="tagrow" style="margin-top:2px">
              ${pTags.map(t => `<span class="pill ${getTagGroupPillClass(t.group)}">${t.name}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="check-indicator">${isSelected ? '✓' : ''}</div>
      </div>
    `;
  }).join('') : `<div class="empty">No matching singers.</div>`;

  const btn = document.getElementById('saveMultiSingersBtn');
  if (btn) btn.textContent = `Save ${multiSingerSelectedIds.length} Selected Singer${multiSingerSelectedIds.length === 1 ? '' : 's'}`;
}

function toggleMultiSinger(personId) {
  if (multiSingerSelectedIds.includes(personId)) {
    multiSingerSelectedIds = multiSingerSelectedIds.filter(id => id !== personId);
  } else {
    multiSingerSelectedIds.push(personId);
  }
  renderMultiSingerPickerList();
}

function saveMultiSingers() {
  const updatedAssigned = multiSingerSelectedIds.map(pId => {
    const existing = (formAssignedSingers || []).find(s => s.personId === pId);
    return existing ? existing : { personId: pId, status: 'Not asked' };
  });

  formAssignedSingers = updatedAssigned;
  updateFormDisplay();
  closeModal('multiSingerPickerModal');
}

// --------------------------------------------------
// MANAGER PICKER FOR EVENT CREATION
// --------------------------------------------------

function openManagerPickerModal() {
  managerSelectedIds = [...(formManagers || [])];
  const input = document.getElementById('managerSearchInput');
  if (input) input.value = '';
  renderManagerPickerList();
  document.getElementById('managerPickerModal').classList.add('open');
}

function renderManagerPickerList() {
  const q = (document.getElementById('managerSearchInput')?.value || '').toLowerCase().trim();
  const allPeople = peopleService.getAll();
  const filtered = allPeople.filter(p => !q || p.name.toLowerCase().includes(q));

  const container = document.getElementById('managerPickerList');
  if (!container) return;

  container.innerHTML = filtered.length ? filtered.map(p => {
    const isSelected = managerSelectedIds.includes(p.id);
    return `
      <div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="toggleManager('${p.id}')">
        <div class="person">
          <div class="avatar manager-avatar">${p.name[0]}</div>
          <div>
            <div class="title">${p.name}</div>
            <div class="tiny" style="color:var(--muted)">Manager candidate</div>
          </div>
        </div>
        <div class="check-indicator">${isSelected ? '✓' : ''}</div>
      </div>
    `;
  }).join('') : `<div class="empty">No matching managers found.</div>`;

  const btn = document.getElementById('saveManagersBtn');
  if (btn) btn.textContent = `Save ${managerSelectedIds.length} Selected Manager${managerSelectedIds.length === 1 ? '' : 's'}`;
}

function toggleManager(personId) {
  if (managerSelectedIds.includes(personId)) {
    managerSelectedIds = managerSelectedIds.filter(id => id !== personId);
  } else {
    managerSelectedIds.push(personId);
  }
  renderManagerPickerList();
}

function saveManagers() {
  formManagers = [...managerSelectedIds];
  updateFormDisplay();
  closeModal('managerPickerModal');
}


function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this event?')) {
    eventService.delete(id);
    closeModal('detailModal');
    render();
  }
}

// Add / Edit Singer Modal (With Flexible Tag Assignment Pills)
let editPersonId = null;
let editPersonTagIds = [];

function openNewSinger() {
  editPersonId = null;
  editPersonTagIds = ['tag_new_member', 'tag_performance', 'tag_recording'];
  document.getElementById('sName').value = '';
  document.getElementById('sGender').value = 'Female';
  document.getElementById('singerModalTitle').textContent = 'Add new singer';

  renderSingerModalTags();
  document.getElementById('newSingerModal').classList.add('open');
}

function openEditSingerModal(id) {
  const p = peopleService.getById(id);
  if (!p) return;

  editPersonId = id;
  editPersonTagIds = [...(p.tagIds || [])];
  document.getElementById('sName').value = p.name;
  document.getElementById('sGender').value = p.gender || 'Female';
  document.getElementById('singerModalTitle').textContent = 'Edit singer details';

  renderSingerModalTags();
  closeModal('detailModal');
  document.getElementById('newSingerModal').classList.add('open');
}

function toggleSingerModalTag(tagId) {
  if (editPersonTagIds.includes(tagId)) editPersonTagIds = editPersonTagIds.filter(id => id !== tagId);
  else editPersonTagIds.push(tagId);
  renderSingerModalTags();
}

function renderSingerModalTags() {
  const container = document.getElementById('sTagsGroup');
  if (!container) return;

  const activeTags = tagService.getAll().filter(t => t.active);
  container.innerHTML = activeTags.map(t => {
    const isOn = editPersonTagIds.includes(t.id);
    const pillCls = getTagGroupPillClass(t.group);
    return `<button class="pill ${pillCls} ${isOn ? 'on' : ''}" onclick="toggleSingerModalTag('${t.id}')">${t.name}</button>`;
  }).join('');
}

function saveSinger() {
  const name = document.getElementById('sName').value.trim();
  const gender = document.getElementById('sGender').value;

  if (!name) return alert('Singer name is required.');

  if (editPersonId) {
    peopleService.update(editPersonId, {
      name,
      gender,
      tagIds: [...editPersonTagIds]
    });
  } else {
    const existing = peopleService.getByName(name);
    if (existing) {
      return alert('A singer with this name already exists.');
    }
    peopleService.create({
      name,
      gender,
      tagIds: [...editPersonTagIds]
    });
  }

  closeModal('newSingerModal');
  renderSingers();
}

function deleteGlobalSinger(name) {
  const match = peopleService.getByName(name);
  if (match && confirm(`Remove ${name} from the global roster?`)) {
    peopleService.delete(match.id);
    renderSingers();
  }
}

// Tag Manager Modal Logic
function openTagManager() {
  renderTagManagerList();
  document.getElementById('tagModal').classList.add('open');
}

function renderTagManagerList() {
  const container = document.getElementById('tagManagerList');
  if (!container) return;

  const allTags = tagService.getAll();
  container.innerHTML = allTags.map(t => `
    <div class="card compact">
      <div class="row between">
        <div>
          <b>${t.name}</b> <span class="pill ${getTagGroupPillClass(t.group)}" style="margin-left:4px">${t.group}</span>
        </div>
        <div class="row" style="gap:6px">
          <button class="btn ghost small" onclick="promptRenameTag('${t.id}')">Rename</button>
          <button class="btn ${t.active ? 'soft' : 'danger'} small" onclick="toggleTagActive('${t.id}')">${t.active ? 'Active' : 'Disabled'}</button>
        </div>
      </div>
    </div>
  `).join('');
}

function createCustomTag() {
  const nameInput = document.getElementById('newTagName');
  const groupInput = document.getElementById('newTagGroup');

  const name = (nameInput?.value || '').trim();
  const group = groupInput?.value || 'custom';

  if (!name) return alert('Tag name is required.');

  tagService.create(name, group);

  if (nameInput) nameInput.value = '';
  renderTagManagerList();
  renderSingers();
}

function promptRenameTag(tagId) {
  const t = tagService.getById(tagId);
  if (!t) return;

  const newName = prompt('Enter new name for tag:', t.name);
  if (newName && newName.trim()) {
    tagService.rename(tagId, newName.trim());
    renderTagManagerList();
    renderSingers();
  }
}

function toggleTagActive(tagId) {
  tagService.toggleActive(tagId);
  renderTagManagerList();
  renderSingers();
}

// Settings Modal
function openSettings() {
  document.getElementById('settingsModal').classList.add('open');
}

function resetApp() {
  if (confirm('This will reset ALL data to v1.6B seed data. Are you sure?')) {
    storageService.remove('choirProtoSchemaVersion');
    storageService.remove('choirProtoEventTypes');
    storageService.remove('choirProtoTags');
    storageService.remove('choirProtoClients');
    storageService.remove('choirProtoVenues');
    storageService.remove('choirProtoPeople');
    storageService.remove('choirProtoEvents');
    storageService.remove('choirProtoLooks');

    migrateToV16B();

    closeModal('settingsModal');
    render();
    go('home');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  render();
});
