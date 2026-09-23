// Choir Manager - v1.4 Client Workflow Pass (Data Cleanup & Fixture Audit Pass)

const CURRENT_VERSION = 'v1.4.1';

// Real Seed Data derived strictly from Client Spreadsheet GID 1422271718, 0, 462764558
const initialPeople = [
  { id: 'p_roe', name: 'Roe', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_anuj', name: 'Anuj', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_abraham', name: 'Abraham', gender: 'Male', langs: ['English'], type: 'Live', active: true },
  { id: 'p_arnav', name: 'Arnav', gender: 'Male', langs: ['English', 'Hindi'], type: 'Recording', active: true },
  { id: 'p_anjana', name: 'Anjana', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_nandhika', name: 'Nandhika', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_bryan', name: 'Bryan', gender: 'Male', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_chakki', name: 'Chakki', gender: 'Female', langs: ['Tamil', 'Malayalam'], type: 'Both', active: true },
  { id: 'p_leon', name: 'Leon', gender: 'Male', langs: ['English'], type: 'Live', active: true },
  { id: 'p_ritin', name: 'Ritin', gender: 'Male', langs: ['Malayalam', 'English'], type: 'Live', active: true },
  { id: 'p_reshwin', name: 'Reshwin', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_reuben', name: 'Reuben', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_serene', name: 'Serene', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_sheena', name: 'Sheena', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_sneha', name: 'Sneha', gender: 'Female', langs: ['Tamil', 'Hindi'], type: 'Both', active: true },
  { id: 'p_tanya', name: 'Tanya', gender: 'Female', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_tincy', name: 'Tincy', gender: 'Female', langs: ['Tamil', 'Malayalam'], type: 'Both', active: true },
  { id: 'p_tofer', name: 'Tofer', gender: 'Male', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_vaimu', name: 'Vaimu', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_varsha', name: 'Varsha', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_varshini', name: 'Varshini', gender: 'Female', langs: ['Tamil'], type: 'Live', active: true },
  { id: 'p_pragee', name: 'Pragee', gender: 'Female', langs: ['Tamil'], type: 'Live', active: true },
  // New Members
  { id: 'p_aishu', name: 'Aishu', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_angel', name: 'Angel', gender: 'Female', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_dyuti', name: 'Dyuti', gender: 'Female', langs: ['English', 'Hindi'], type: 'Recording', active: true },
  { id: 'p_geejay', name: 'Geejay', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_joe', name: 'Joe', gender: 'Male', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_kevin', name: 'Kevin', gender: 'Male', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_mark', name: 'Mark', gender: 'Male', langs: ['English', 'Tamil'], type: 'Both', active: true },
  { id: 'p_nattu', name: 'Nattu', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_olivia', name: 'Olivia', gender: 'Female', langs: ['English'], type: 'Both', active: true },
  { id: 'p_pranav', name: 'Pranav', gender: 'Male', langs: ['Tamil', 'English'], type: 'Live', active: true },
  { id: 'p_sai', name: 'Sai', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_sebi', name: 'Sebi', gender: 'Male', langs: ['Tamil', 'Malayalam'], type: 'Both', active: true },
  { id: 'p_yazhini', name: 'Yazhini', gender: 'Female', langs: ['Tamil'], type: 'Live', active: true },
  { id: 'p_waveen', name: 'Waveen', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_luchy', name: 'Luchy', gender: 'Female', langs: ['English'], type: 'Live', active: true },
  { id: 'p_lucky', name: 'Lucky', gender: 'Male', langs: ['Tamil', 'English'], type: 'Both', active: true },
  // Extra Roster
  { id: 'p_alfred', name: 'Alfred', gender: 'Male', langs: ['English'], type: 'Live', active: true },
  { id: 'p_moncy', name: 'Moncy', gender: 'Male', langs: ['Malayalam', 'English'], type: 'Live', active: true },
  { id: 'p_aishwarya', name: 'Aishwarya', gender: 'Female', langs: ['Tamil', 'English'], type: 'Both', active: true },
  { id: 'p_ivan', name: 'Ivan', gender: 'Male', langs: ['English'], type: 'Live', active: true },
  { id: 'p_sukanti', name: 'Sukanti', gender: 'Female', langs: ['Hindi', 'English'], type: 'Both', active: true },
  { id: 'p_rahul', name: 'Rahul', gender: 'Male', langs: ['Tamil', 'Hindi', 'English'], type: 'Both', active: true },
  { id: 'p_snigdha', name: 'Snigdha', gender: 'Female', langs: ['Tamil', 'English'], type: 'Recording', active: true }
];

const initialLooks = [
  {
    id: 'look_black_gold',
    name: 'Black & Gold Elegance',
    bgGradient: 'linear-gradient(135deg, #181818, #d6b45b)',
    colorNotes: 'Black base with warm gold accents and accessories.',
    womenNotes: 'Black saree or Indo-western saree with gold border / gold jewelry.',
    menNotes: 'Black bandhgala or formal black shirt with gold pocket square.',
    generalNotes: 'Stage lighting friendly. Avoid shiny silver metals.'
  },
  {
    id: 'look_soft_pastels',
    name: 'Soft Pastels',
    bgGradient: 'linear-gradient(135deg, #e7d7e8, #b8cedf)',
    colorNotes: 'Pastel pinks, icy blue, lavender, and beige.',
    womenNotes: 'Pastel ethnic gown or lightweight saree.',
    menNotes: 'Pastel kurta or light beige formal trousers and soft pink shirt.',
    generalNotes: 'Daytime acoustic & wedding functions.'
  },
  {
    id: 'look_formal_black',
    name: 'Formal Corporate Black',
    bgGradient: 'linear-gradient(135deg, #22252a, #485460)',
    colorNotes: 'Solid matte black outfits.',
    womenNotes: 'Black blazer suit or elegant plain black formal dress.',
    menNotes: 'Black suit with crisp collar, no ties needed.',
    generalNotes: 'Standard corporate gala & award ceremony look.'
  },
  {
    id: 'look_festive_red_gold',
    name: 'Festive Red & Gold',
    bgGradient: 'linear-gradient(135deg, #9a2f2f, #d8b56b)',
    colorNotes: 'Deep maroon / crimson red and bright gold.',
    womenNotes: 'Traditional red silk saree with gold zari work.',
    menNotes: 'Maroon kurta with gold woven waistcoat.',
    generalNotes: 'Grand audio launches and festive concert specials.'
  }
];

// STRICT HISTORICAL IMPORT DATA (Unsupported spreadsheet fields set to "")
const initialEvents = [
  {
    id: 1,
    name: 'Staccato',
    status: 'confirmed',
    category: '',
    workType: '', // Unspecified (Show name does not explicitly contain work type keyword)
    date: '2026-08-08',
    time: '',
    client: '',
    venue: 'Intercontinental',
    singersCount: 8,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Anjana', status: 'Available' },
      { name: 'Serene', status: 'Available' },
      { name: 'Tanya', status: 'Available' },
      { name: 'Nandhika', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Tofer', status: 'Available' },
      { name: 'Nattu', status: 'Available' }
    ]
  },
  {
    id: 2,
    name: 'Ashwin Recording',
    status: 'confirmed',
    category: '',
    workType: 'Recording', // Explicitly in show name
    date: '2026-08-12',
    time: '',
    client: '',
    venue: 'Tase',
    singersCount: 11,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Sneha', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Snigdha', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Mark', status: 'Available' },
      { name: 'Rahul', status: 'Available' }
    ]
  },
  {
    id: 3,
    name: 'Music Video Shoot - Vijay',
    status: 'confirmed',
    category: '',
    workType: 'Shoot', // Explicitly in show name
    date: '2026-08-20',
    time: '',
    client: '',
    venue: 'Juhu beach',
    singersCount: 6,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Sheena', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Sebi', status: 'Available' }
    ]
  },
  {
    id: 4,
    name: 'Staccato - Recording',
    status: 'confirmed',
    category: '',
    workType: 'Recording', // Explicitly in show name
    date: '2026-08-23',
    time: '',
    client: '',
    venue: 'Staccato studio - teynampet',
    singersCount: 17,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Nandhika', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Sheena', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Angel', status: 'Available' },
      { name: 'Anjana', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Aishu', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Tofer', status: 'Available' },
      { name: 'Nattu', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Waveen', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Mark', status: 'Available' }
    ]
  },
  {
    id: 5,
    name: 'Staccato Rehearsal',
    status: 'confirmed',
    category: '',
    workType: 'Rehearsal', // Explicitly in show name
    date: '2026-08-26',
    time: '',
    client: '',
    venue: 'Staccato studio - teynampet',
    singersCount: 15,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Nandhika', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Angel', status: 'Available' },
      { name: 'Sneha', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Lucky', status: 'Available' },
      { name: 'Waveen', status: 'Available' },
      { name: 'Nattu', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Mark', status: 'Available' },
      { name: 'Kevin', status: 'Available' }
    ]
  },
  {
    id: 6,
    name: 'Staccato Rehersal',
    status: 'confirmed',
    category: '',
    workType: 'Rehearsal', // Explicitly in show name ("Rehersal")
    date: '2026-08-27',
    time: '',
    client: '',
    venue: 'Staccato studio - teynampet',
    singersCount: 14,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Olivia', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Lucky', status: 'Available' },
      { name: 'Angel', status: 'Available' },
      { name: 'Waveen', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Sneha', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Nattu', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Nandhika', status: 'Available' }
    ]
  },
  {
    id: 7,
    name: 'Staccato Sound check',
    status: 'confirmed',
    category: '',
    workType: 'Soundcheck', // Explicitly in show name ("Sound check")
    date: '2026-08-28',
    time: '',
    client: '',
    venue: 'REC',
    singersCount: 20,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Sheena', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Sneha', status: 'Available' },
      { name: 'Nandhika', status: 'Available' },
      { name: 'Aishu', status: 'Available' },
      { name: 'Angel', status: 'Available' },
      { name: 'Olivia', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Tincy', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Lucky', status: 'Available' },
      { name: 'Nattu', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Waveen', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Mark', status: 'Available' },
      { name: 'Bryan', status: 'Available' }
    ]
  },
  {
    id: 8,
    name: 'Sardar Audio launch',
    status: 'confirmed',
    category: '',
    workType: '', // Unspecified
    date: '2026-08-31',
    time: '',
    client: '',
    venue: 'Chennai trade centre',
    singersCount: 16,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: ['Nandhika'],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Sheena', status: 'Available' },
      { name: 'Nandhika', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Tincy', status: 'Available' },
      { name: 'Sneha', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Bryan', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Joe', status: 'Available' },
      { name: 'Mark', status: 'Available' },
      { name: 'Nattu', status: 'Available' },
      { name: 'Sai', status: 'Available' }
    ]
  },
  {
    id: 9,
    name: 'ELFE ACT (with band)',
    status: 'confirmed',
    category: '',
    workType: '', // Unspecified
    date: '2026-09-03',
    time: '',
    client: '',
    venue: 'Hindustan clg',
    singersCount: 10,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: ['Sheena', 'Varsha'],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Tincy', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Joe', status: 'Available' },
      { name: 'Waveen', status: 'Available' },
      { name: 'Nattu', status: 'Available' }
    ]
  },
  {
    id: 10,
    name: 'Staccato - teachers day',
    status: 'confirmed',
    category: '',
    workType: '', // Unspecified
    date: '2026-09-05',
    time: '',
    client: '',
    venue: 'Vandalur',
    singersCount: 6,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: [],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Varsha', status: 'Available' },
      { name: 'Serene', status: 'Available' },
      { name: 'Tanya', status: 'Available' },
      { name: 'Reuben', status: 'Available' },
      { name: 'Anuj', status: 'Available' }
    ]
  },
  {
    id: 11,
    name: 'ELFE ACT',
    status: 'confirmed',
    category: '',
    workType: '', // Unspecified
    date: '2026-09-06',
    time: '',
    client: '',
    venue: 'VGP',
    singersCount: 10,
    budget: 0,
    language: '',
    notes: '',
    lookId: '',
    managers: ['Sheena', 'Varsha'],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Tincy', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Anuj', status: 'Available' },
      { name: 'Sai', status: 'Available' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Sebi', status: 'Available' },
      { name: 'Reuben', status: 'Available' }
    ]
  },
  // UPCOMING DEMO FIXTURES (explicitly flagged for prototype testing)
  {
    id: 12,
    name: 'Grand Royal Wedding',
    status: 'enquiry',
    category: 'Wedding',
    workType: 'Performance',
    date: '2026-09-28',
    time: '19:00',
    client: 'Rohan & Diya',
    venue: 'Taj Coromandel',
    singersCount: 8,
    budget: 90000,
    language: 'Tamil',
    notes: '📌 [Demo Test Fixture] Sample enquiry fixture.',
    lookId: 'look_black_gold',
    managers: [],
    assignedSingers: [],
    isDemoFixture: true
  },
  {
    id: 13,
    name: 'Corporate Unplugged Night',
    status: 'enquiry',
    category: 'Corporate',
    workType: 'Performance',
    date: '2026-09-30',
    time: '18:30',
    client: 'Aster Labs',
    venue: 'ITC Grand Chola',
    singersCount: 6,
    budget: 75000,
    language: 'English',
    notes: '📌 [Demo Test Fixture] Sample corporate show enquiry.',
    lookId: 'look_formal_black',
    managers: ['Varsha'],
    assignedSingers: [
      { name: 'Anuj', status: 'Available' },
      { name: 'Sheena', status: 'Available' }
    ],
    isDemoFixture: true
  },
  {
    id: 14,
    name: 'City Cultural Fest',
    status: 'confirmed',
    category: 'Concert',
    workType: 'Performance',
    date: '2026-10-03',
    time: '19:00',
    client: 'City Arts',
    venue: 'Museum Theatre',
    singersCount: 10,
    budget: 120000,
    language: 'Mixed',
    notes: '📌 [Demo Test Fixture] 1 singer unavailable (Sheena). Test Find Replacement workflow.',
    lookId: 'look_black_gold',
    managers: ['Sheena'],
    assignedSingers: [
      { name: 'Roe', status: 'Available' },
      { name: 'Chakki', status: 'Available' },
      { name: 'Tincy', status: 'Available' },
      { name: 'Vaimu', status: 'Available' },
      { name: 'Geejay', status: 'Available' },
      { name: 'Anuj', status: 'Asked' },
      { name: 'Sai', status: 'Asked' },
      { name: 'Kevin', status: 'Available' },
      { name: 'Sheena', status: 'Unavailable' }
    ],
    isDemoFixture: true
  }
];

// LocalStorage State Management
function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage set failed', e);
  }
}

// Check version migration
let savedVersion = localStorage.getItem('choirProtoVersion');
if (savedVersion !== CURRENT_VERSION) {
  localStorage.setItem('choirProtoVersion', CURRENT_VERSION);
  localStorage.setItem('choirProtoPeople', JSON.stringify(initialPeople));
  localStorage.setItem('choirProtoEvents', JSON.stringify(initialEvents));
  localStorage.setItem('choirProtoLooks', JSON.stringify(initialLooks));
}

let people = getStorage('choirProtoPeople', initialPeople);
let events = getStorage('choirProtoEvents', initialEvents);
let looks = getStorage('choirProtoLooks', initialLooks);

let newStatus = 'enquiry';
let pickedWorkType = 'Unspecified';
let editEventId = null;
let detailEventId = null;
let tempAssignedSingers = null;
let tempManagers = null;
let replaceTargetSingerName = null;

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

// Derive Show History for People / Singers dynamically from events
function getSingerHistory(personName) {
  const nameLower = personName.toLowerCase();
  const pastEvents = events.filter(e => {
    const isAssigned = (e.assignedSingers || []).some(s => s.name.toLowerCase() === nameLower) ||
                       (e.managers || []).some(m => m.toLowerCase() === nameLower);
    return isAssigned;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalShows = pastEvents.length;
  const lastShow = pastEvents.length ? pastEvents[0] : null;

  return {
    totalShows,
    lastShowDate: lastShow ? dateParts(lastShow.date).full : 'None',
    recentShows: pastEvents.slice(0, 4).map(e => ({
      date: dateParts(e.date).full,
      name: e.name,
      category: e.category || '—',
      workType: e.workType || 'Unspecified'
    }))
  };
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
  const look = looks.find(l => l.id === e.lookId);
  const availConfirmed = (e.assignedSingers || []).filter(s => s.status === 'Available').length;
  const unavailableCount = (e.assignedSingers || []).filter(s => s.status === 'Unavailable').length;
  const moneyText = money(e.budget);

  return `
    <div class="card compact" onclick="openDetail(${e.id})">
      <div class="event-line">
        <div class="datebox"><span>${d.mon}</span><b>${d.day}</b></div>
        <div>
          <div class="title">${e.name} ${e.isDemoFixture ? '<span class="tiny" style="color:var(--purple); font-weight:700">[Demo]</span>' : ''}</div>
          <div class="muted">${e.venue || 'Venue TBC'} ${e.category ? '· ' + e.category : ''}</div>
          <div class="tagrow">
            <span class="pill ${e.status}">${e.status === 'confirmed' ? 'Confirmed' : 'Enquiry'}</span>
            ${e.workType ? `<span class="pill ${workTypePillClass(e.workType)}">${e.workType}</span>` : ''}
            <span class="pill">${availConfirmed}/${e.singersCount} singers</span>
            ${unavailableCount > 0 ? `<span class="pill avail-unavailable">⚠️ ${unavailableCount} unavailable</span>` : ''}
            ${look ? `<span class="pill" style="background:#f1ece1">🎨 ${look.name}</span>` : ''}
          </div>
        </div>
        <div class="money">${moneyText}</div>
      </div>
    </div>
  `;
}

// Main Render Function
function render() {
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

  // Looks Screen
  renderLooks();
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
            <div class="muted">${dateParts(e.date).full} · ${e.venue || 'Venue TBC'}</div>
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

// Singers Screen Render
function renderSingers() {
  const q = (document.getElementById('singerSearch')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('singerTypeFilter')?.value || 'All';
  const langFilter = document.getElementById('singerLangFilter')?.value || 'All';

  const filtered = people.filter(p => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (typeFilter !== 'All') {
      if (typeFilter === 'Performance' && p.type !== 'Performance' && p.type !== 'Both') return false;
      if (typeFilter === 'Recording' && p.type !== 'Recording' && p.type !== 'Both') return false;
      if (typeFilter === 'Both' && p.type !== 'Both') return false;
    }
    if (langFilter !== 'All' && !(p.langs || []).includes(langFilter)) return false;
    return true;
  });

  const listEl = document.getElementById('singerList');
  if (!listEl) return;

  listEl.innerHTML = filtered.length ? filtered.map(p => {
    const history = getSingerHistory(p.name);
    return `
      <div class="card compact">
        <div class="row between">
          <div class="person">
            <div class="avatar">${p.name[0]}</div>
            <div>
              <div class="title">${p.name} <span class="tiny">(${p.gender})</span></div>
              <div class="muted">${(p.langs || []).join(' · ')} · ${p.type}</div>
              <div class="tiny" style="margin-top:2px; font-weight:700; color:var(--brand)">
                📊 ${history.totalShows} shows · Last: ${history.lastShowDate}
              </div>
            </div>
          </div>
          <button class="btn danger small" onclick="deleteGlobalSinger('${p.name}')">Remove</button>
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
  }).join('') : '<div class="empty">No singers found.</div>';
}

// Looks Screen Render
function renderLooks() {
  const container = document.getElementById('looksList');
  if (!container) return;

  container.innerHTML = looks.map(l => `
    <div class="card" style="padding:14px">
      <div class="look-card-preview" style="background:${l.bgGradient || 'linear-gradient(135deg,#181818,#d6b45b)'}">
        <div style="font-size:18px; font-weight:800">${l.name}</div>
      </div>
      <div class="muted" style="margin-bottom:8px"><b>Colors:</b> ${l.colorNotes}</div>
      <div class="tiny" style="margin-bottom:4px"><b>👩 Women:</b> ${l.womenNotes}</div>
      <div class="tiny" style="margin-bottom:4px"><b>👨 Men:</b> ${l.menNotes}</div>
      ${l.generalNotes ? `<div class="tiny" style="margin-bottom:8px"><b>📌 Notes:</b> ${l.generalNotes}</div>` : ''}
      <div class="row between" style="margin-top:10px">
        <button class="btn ghost small" onclick="openEditLook('${l.id}')">Edit Look</button>
        <button class="btn danger small" onclick="deleteLook('${l.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

// Event Details & Lineup Modal
function openDetail(id) {
  detailEventId = id;
  const e = events.find(x => x.id === id);
  if (!e) return;

  tempAssignedSingers = JSON.parse(JSON.stringify(e.assignedSingers || []));
  tempManagers = JSON.parse(JSON.stringify(e.managers || []));

  renderDetailModal();
  document.getElementById('detailModal').classList.add('open');
}

function renderDetailModal() {
  const e = events.find(x => x.id === detailEventId);
  if (!e) return;

  const d = dateParts(e.date);
  const look = looks.find(l => l.id === e.lookId);

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
        <div class="eyebrow">${e.status === 'confirmed' ? 'Confirmed Show' : 'Enquiry'}</div>
        <h2>${e.name} ${e.isDemoFixture ? '<span class="tiny" style="color:var(--purple); font-weight:700">[Demo]</span>' : ''}</h2>
        <div class="sub">${d.full} · ${e.venue || 'Venue TBC'}</div>
      </div>
      <button class="btn ghost small" onclick="closeModalSafe('detailModal')">Close</button>
    </div>

    <div class="row" style="margin-top:12px; gap:8px;">
      <button class="btn soft small full" onclick="openEditEvent(${e.id})">Edit Event</button>
      <button class="btn danger small full" onclick="deleteEvent(${e.id})">Delete Event</button>
    </div>

    <div class="card compact" style="margin-top:14px">
      <div class="row between"><span class="muted">Category</span><b>${e.category || '—'}</b></div>
      <div class="row between" style="margin-top:6px">
        <span class="muted">Work Type</span>
        <b>${e.workType ? `<span class="pill ${workTypePillClass(e.workType)}">${e.workType}</span>` : '—'}</b>
      </div>
      <div class="row between" style="margin-top:6px"><span class="muted">Client</span><b>${e.client || '—'}</b></div>
      <div class="row between" style="margin-top:6px"><span class="muted">Show Time</span><b>${e.time || '—'}</b></div>
      <div class="row between" style="margin-top:6px"><span class="muted">Budget</span><b>${money(e.budget)}</b></div>
      <div class="row between" style="margin-top:6px"><span class="muted">Singers Needed</span><b>${e.singersCount} singers</b></div>
      <div class="tagrow">
        ${e.language ? `<span class="pill">${e.language}</span>` : ''}
        ${look ? `<span class="pill" style="background:#f1ece1">🎨 ${look.name}</span>` : ''}
      </div>
    </div>

    ${e.notes ? `<div class="notice"><b>Notes:</b> ${e.notes}</div>` : ''}

    ${e.status === 'enquiry' ? `
      <button class="btn primary full" style="margin-top:14px" onclick="confirmEvent(${e.id})">Convert Enquiry to Confirmed Show</button>
    ` : `
      <!-- Lineup Section -->
      <div class="section row between">
        <h2>Managers</h2>
        <button class="btn soft small" onclick="openAddManagerModal()">+ Add Manager</button>
      </div>
      <div class="card compact">
        ${managers.length ? managers.map(m => `
          <div class="row between" style="padding:6px 0">
            <div class="person">
              <div class="avatar manager-avatar">${m[0]}</div>
              <div><b>${m}</b> <span class="tiny">(Manager)</span></div>
            </div>
            <button class="btn danger small" onclick="removeManager('${m}')">Remove</button>
          </div>
        `).join('') : '<div class="empty" style="padding:10px">No managers assigned.</div>'}
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
        ${assigned.length ? assigned.map(s => `
          <div style="padding:12px; border-bottom:1px solid var(--line)">
            <div class="row between">
              <div class="person">
                <div class="avatar">${s.name[0]}</div>
                <div>
                  <div class="title">${s.name}</div>
                  <div class="tiny">Status:</div>
                </div>
              </div>
              <div class="row" style="gap:6px">
                <select class="avail-select" onchange="changeSingerStatus('${s.name}', this.value)">
                  <option value="Not asked" ${s.status === 'Not asked' ? 'selected' : ''}>Not asked</option>
                  <option value="Asked" ${s.status === 'Asked' ? 'selected' : ''}>Asked</option>
                  <option value="Available" ${s.status === 'Available' ? 'selected' : ''}>Available</option>
                  <option value="Unavailable" ${s.status === 'Unavailable' ? 'selected' : ''}>Unavailable</option>
                </select>
                <button class="btn danger small" onclick="removeSingerFromLineup('${s.name}')">Remove</button>
              </div>
            </div>
            ${s.status === 'Unavailable' ? `
              <div style="margin-top:8px; text-align:right">
                <button class="btn warning small" onclick="openFindReplacementModal('${s.name}')">🔄 Find Replacement for ${s.name}</button>
              </div>
            ` : ''}
          </div>
        `).join('') : '<div class="empty">No singers assigned to lineup yet.</div>'}
      </div>

      <div class="row" style="margin-top:14px; gap:8px;">
        <button class="btn soft full" style="flex:1" onclick="openAddSingerModal()">+ Add Singer</button>
        ${isChanged ? `<button class="btn primary full" style="flex:1" onclick="saveLineupChanges()">Save Lineup Changes</button>` : ''}
      </div>
    `}
  `;
}

function confirmEvent(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;
  e.status = 'confirmed';
  setStorage('choirProtoEvents', events);
  render();
  openDetail(id);
}

function changeSingerStatus(name, newStatus) {
  const item = (tempAssignedSingers || []).find(s => s.name === name);
  if (item) {
    item.status = newStatus;
    renderDetailModal();
  }
}

function removeSingerFromLineup(name) {
  tempAssignedSingers = (tempAssignedSingers || []).filter(s => s.name !== name);
  renderDetailModal();
}

function removeManager(name) {
  tempManagers = (tempManagers || []).filter(m => m !== name);
  renderDetailModal();
}

function saveLineupChanges() {
  const e = events.find(x => x.id === detailEventId);
  if (!e) return;

  e.assignedSingers = JSON.parse(JSON.stringify(tempAssignedSingers));
  e.managers = JSON.parse(JSON.stringify(tempManagers));

  setStorage('choirProtoEvents', events);
  render();
  renderDetailModal();
}

function hasUnsavedChanges() {
  if (!detailEventId) return false;
  const e = events.find(x => x.id === detailEventId);
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

// Add Singer Modal to Lineup
function openAddSingerModal() {
  const assignedNames = (tempAssignedSingers || []).map(s => s.name);
  const candidates = people.filter(p => !assignedNames.includes(p.name));

  const listEl = document.getElementById('assignList');
  if (!listEl) return;

  listEl.innerHTML = candidates.map(p => `
    <div class="card compact replacement">
      <div class="person">
        <div class="avatar">${p.name[0]}</div>
        <div>
          <div class="title">${p.name}</div>
          <div class="muted">${(p.langs || []).join(' · ')} · ${p.type}</div>
        </div>
        <button class="btn soft small" onclick="addSingerToLineup('${p.name}')">+ Add</button>
      </div>
    </div>
  `).join('');

  document.getElementById('assignModal').classList.add('open');
}

function addSingerToLineup(name) {
  if (!(tempAssignedSingers || []).some(s => s.name === name)) {
    tempAssignedSingers.push({ name: name, status: 'Not asked' });
    renderDetailModal();
  }
  closeModal('assignModal');
}

// Add Manager Modal
function openAddManagerModal() {
  const currentManagers = tempManagers || [];
  const candidates = people.filter(p => !currentManagers.includes(p.name));

  const listEl = document.getElementById('assignList');
  if (!listEl) return;

  listEl.innerHTML = candidates.map(p => `
    <div class="card compact replacement">
      <div class="person">
        <div class="avatar manager-avatar">${p.name[0]}</div>
        <div>
          <div class="title">${p.name}</div>
          <div class="muted">Manager candidate</div>
        </div>
        <button class="btn soft small" onclick="addManagerToEvent('${p.name}')">+ Add Manager</button>
      </div>
    </div>
  `).join('');

  document.getElementById('assignModal').classList.add('open');
}

function addManagerToEvent(name) {
  if (!(tempManagers || []).includes(name)) {
    tempManagers.push(name);
    renderDetailModal();
  }
  closeModal('assignModal');
}

// Find Replacement Modal
function openFindReplacementModal(targetSingerName) {
  replaceTargetSingerName = targetSingerName;
  const e = events.find(x => x.id === detailEventId);
  if (!e) return;

  const currentAssignedNames = (tempAssignedSingers || []).map(s => s.name);
  const candidates = people.filter(p => !currentAssignedNames.includes(p.name));

  candidates.sort((a, b) => {
    const ha = getSingerHistory(a.name);
    const hb = getSingerHistory(b.name);
    return ha.totalShows - hb.totalShows;
  });

  const listEl = document.getElementById('replacementList');
  if (!listEl) return;

  document.getElementById('replaceNotice').innerHTML = `Finding candidate replacement for <b>${targetSingerName}</b> for <b>${e.name}</b> (${e.workType || 'Unspecified'}, ${e.language || 'Unspecified'}).`;

  listEl.innerHTML = candidates.map(p => {
    const h = getSingerHistory(p.name);
    return `
      <div class="card compact replacement">
        <div class="person">
          <div class="avatar">${p.name[0]}</div>
          <div>
            <div class="title">${p.name}</div>
            <div class="muted">${(p.langs || []).join(' · ')} · ${p.type}</div>
            <div class="tiny" style="color:var(--brand); font-weight:700">📊 ${h.totalShows} shows · Last: ${h.lastShowDate}</div>
          </div>
          <button class="btn soft small" onclick="chooseReplacement('${p.name}')">Choose</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('replaceModal').classList.add('open');
}

function chooseReplacement(newSingerName) {
  if (replaceTargetSingerName && tempAssignedSingers) {
    tempAssignedSingers = tempAssignedSingers.filter(s => s.name !== replaceTargetSingerName);
    tempAssignedSingers.push({ name: newSingerName, status: 'Available' });
    renderDetailModal();
    closeModal('replaceModal');
  }
}

// Suggest Lineup Modal
function openSuggestModal() {
  const e = events.find(x => x.id === detailEventId);
  if (!e) return;

  const assignedNames = (tempAssignedSingers || []).map(s => s.name);
  const unassigned = people.filter(p => !assignedNames.includes(p.name));

  const scored = unassigned.map(p => {
    const h = getSingerHistory(p.name);
    let matchReasons = [];

    if (!e.language || e.language === 'Mixed' || (p.langs || []).includes(e.language)) {
      if (e.language) matchReasons.push(`Matches ${e.language}`);
    }

    if (!e.workType || p.type === 'Both' || p.type === e.workType) {
      if (e.workType) matchReasons.push(`Suitable for ${e.workType}`);
    }

    matchReasons.push(`${h.totalShows} recent shows`);
    matchReasons.push(`Last show: ${h.lastShowDate}`);

    return {
      person: p,
      history: h,
      reasons: matchReasons
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
          <div class="muted">${s.reasons.join(' · ')}</div>
        </div>
        <button class="btn soft small" onclick="addSuggestedSinger('${s.person.name}')">+ Assign</button>
      </div>
    </div>
  `).join('');

  document.getElementById('suggestModal').classList.add('open');
}

function addSuggestedSinger(name) {
  if (!(tempAssignedSingers || []).some(s => s.name === name)) {
    tempAssignedSingers.push({ name: name, status: 'Available' });
    renderDetailModal();
  }
  closeModal('suggestModal');
}

// New / Edit Event Modal
function openNew(status) {
  editEventId = null;
  newStatus = status;
  pickedWorkType = 'Unspecified';

  document.getElementById('newEyebrow').textContent = status === 'enquiry' ? 'New Enquiry' : 'New Confirmed Show';
  document.getElementById('newTitle').textContent = status === 'enquiry' ? 'Save the Enquiry' : 'Add the Show';

  document.getElementById('fName').value = '';
  document.getElementById('fCategory').value = '';
  document.getElementById('fClient').value = '';
  document.getElementById('fVenue').value = '';
  document.getElementById('fSingers').value = '6';
  document.getElementById('fBudget').value = '';
  document.getElementById('fNotes').value = '';
  document.getElementById('fLanguage').value = '';
  document.getElementById('fCustomWorkType').value = '';
  document.getElementById('fCustomWorkGroup').style.display = 'none';

  updateWorkTypeButtons('Unspecified');
  populateLookSelect('');

  document.getElementById('newModal').classList.add('open');
}

function openEditEvent(id) {
  if (hasUnsavedChanges()) {
    if (!confirm('You have unsaved lineup changes. Discard them to edit event details?')) return;
  }
  const e = events.find(x => x.id === id);
  if (!e) return;

  editEventId = id;
  newStatus = e.status;
  pickedWorkType = e.workType || 'Unspecified';

  document.getElementById('newEyebrow').textContent = 'Edit ' + newStatus;
  document.getElementById('newTitle').textContent = 'Edit Event Details';

  document.getElementById('fName').value = e.name || '';
  document.getElementById('fCategory').value = e.category || '';
  document.getElementById('fDate').value = e.date || '';
  document.getElementById('fTime').value = e.time || '';
  document.getElementById('fClient').value = e.client || '';
  document.getElementById('fVenue').value = e.venue || '';
  document.getElementById('fSingers').value = e.singersCount || 1;
  document.getElementById('fBudget').value = e.budget ? e.budget : '';
  document.getElementById('fLanguage').value = e.language || '';
  document.getElementById('fNotes').value = e.notes || '';

  const standardTypes = ['Unspecified', 'Performance', 'Recording', 'Rehearsal', 'Shoot', 'Soundcheck'];
  if (standardTypes.includes(e.workType || 'Unspecified')) {
    updateWorkTypeButtons(e.workType || 'Unspecified');
    document.getElementById('fCustomWorkGroup').style.display = 'none';
  } else {
    updateWorkTypeButtons('Custom');
    document.getElementById('fCustomWorkGroup').style.display = 'block';
    document.getElementById('fCustomWorkType').value = e.workType;
  }

  populateLookSelect(e.lookId || '');

  closeModal('detailModal');
  document.getElementById('newModal').classList.add('open');
}

function pickWorkType(btn) {
  const type = btn.dataset.type;
  pickedWorkType = type;
  updateWorkTypeButtons(type);

  const customGroup = document.getElementById('fCustomWorkGroup');
  if (type === 'Custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
}

function updateWorkTypeButtons(activeType) {
  document.querySelectorAll('#workTypeChoice button').forEach(b => {
    b.classList.toggle('on', b.dataset.type === activeType);
  });
}

function populateLookSelect(selectedLookId) {
  const sel = document.getElementById('fLook');
  if (!sel) return;
  sel.innerHTML = '<option value="">None / Custom</option>' +
    looks.map(l => `<option value="${l.id}" ${l.id === selectedLookId ? 'selected' : ''}>${l.name}</option>`).join('');
}

function saveEvent() {
  const name = document.getElementById('fName').value || 'Untitled Show';
  const category = document.getElementById('fCategory').value;
  const date = document.getElementById('fDate').value;
  const time = document.getElementById('fTime').value;
  const client = document.getElementById('fClient').value;
  const venue = document.getElementById('fVenue').value;
  const singersCount = Number(document.getElementById('fSingers').value || 1);
  const budget = document.getElementById('fBudget').value ? Number(document.getElementById('fBudget').value) : 0;
  const language = document.getElementById('fLanguage').value;
  const notes = document.getElementById('fNotes').value;
  const lookId = document.getElementById('fLook').value;

  let finalWorkType = pickedWorkType;
  if (pickedWorkType === 'Unspecified') {
    finalWorkType = '';
  } else if (pickedWorkType === 'Custom') {
    finalWorkType = document.getElementById('fCustomWorkType').value.trim() || 'Custom';
  }

  const data = {
    name,
    category,
    workType: finalWorkType,
    date,
    time,
    client,
    venue,
    singersCount,
    budget,
    language,
    notes,
    lookId
  };

  if (editEventId) {
    const e = events.find(x => x.id === editEventId);
    Object.assign(e, data);
  } else {
    events.push({
      id: Date.now(),
      status: newStatus,
      managers: [],
      assignedSingers: [],
      ...data
    });
  }

  setStorage('choirProtoEvents', events);
  closeModal('newModal');
  render();

  if (editEventId) {
    openDetail(editEventId);
  } else {
    go('home');
  }
}

function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this event?')) {
    events = events.filter(e => e.id !== id);
    setStorage('choirProtoEvents', events);
    closeModal('detailModal');
    render();
  }
}

// Add Singer Modal (Global Roster)
function openNewSinger() {
  document.getElementById('sName').value = '';
  document.querySelectorAll('#sLangsGroup .on').forEach(b => b.classList.remove('on'));
  document.getElementById('newSingerModal').classList.add('open');
}

function saveNewSinger() {
  const name = document.getElementById('sName').value.trim();
  const gender = document.getElementById('sGender').value;
  const type = document.getElementById('sType').value;
  const langs = Array.from(document.querySelectorAll('#sLangsGroup .on')).map(b => b.textContent);

  if (!name) return alert('Singer name is required.');

  if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return alert('A singer with this name already exists.');
  }

  const newPerson = {
    id: 'p_' + Date.now(),
    name,
    gender,
    langs,
    type,
    active: true
  };

  people.push(newPerson);
  setStorage('choirProtoPeople', people);
  closeModal('newSingerModal');
  renderSingers();
}

function deleteGlobalSinger(name) {
  if (confirm(`Remove ${name} from the global roster?`)) {
    people = people.filter(p => p.name !== name);
    setStorage('choirProtoPeople', people);
    renderSingers();
  }
}

// Add / Edit Look Modal
let editLookId = null;
function openNewLook() {
  editLookId = null;
  document.getElementById('lName').value = '';
  document.getElementById('lColors').value = '';
  document.getElementById('lWomen').value = '';
  document.getElementById('lMen').value = '';
  document.getElementById('lNotes').value = '';
  document.getElementById('newLookModal').classList.add('open');
}

function openEditLook(id) {
  const l = looks.find(x => x.id === id);
  if (!l) return;
  editLookId = id;

  document.getElementById('lName').value = l.name;
  document.getElementById('lColors').value = l.colorNotes;
  document.getElementById('lWomen').value = l.womenNotes;
  document.getElementById('lMen').value = l.menNotes;
  document.getElementById('lNotes').value = l.generalNotes || '';

  document.getElementById('newLookModal').classList.add('open');
}

function saveLook() {
  const name = document.getElementById('lName').value.trim();
  const colorNotes = document.getElementById('lColors').value.trim();
  const womenNotes = document.getElementById('lWomen').value.trim();
  const menNotes = document.getElementById('lMen').value.trim();
  const generalNotes = document.getElementById('lNotes').value.trim();

  if (!name) return alert('Look name is required.');

  if (editLookId) {
    const l = looks.find(x => x.id === editLookId);
    if (l) {
      l.name = name;
      l.colorNotes = colorNotes;
      l.womenNotes = womenNotes;
      l.menNotes = menNotes;
      l.generalNotes = generalNotes;
    }
  } else {
    looks.push({
      id: 'look_' + Date.now(),
      name,
      bgGradient: 'linear-gradient(135deg, #24372b, #485460)',
      colorNotes,
      womenNotes,
      menNotes,
      generalNotes
    });
  }

  setStorage('choirProtoLooks', looks);
  closeModal('newLookModal');
  renderLooks();
}

function deleteLook(id) {
  if (confirm('Delete this look?')) {
    looks = looks.filter(l => l.id !== id);
    setStorage('choirProtoLooks', looks);
    renderLooks();
  }
}

// Settings Modal
function openSettings() {
  document.getElementById('settingsModal').classList.add('open');
}

function resetApp() {
  if (confirm('This will reset ALL data to original client seed data. Are you sure?')) {
    localStorage.removeItem('choirProtoVersion');
    localStorage.removeItem('choirProtoPeople');
    localStorage.removeItem('choirProtoEvents');
    localStorage.removeItem('choirProtoLooks');

    people = JSON.parse(JSON.stringify(initialPeople));
    events = JSON.parse(JSON.stringify(initialEvents));
    looks = JSON.parse(JSON.stringify(initialLooks));

    setStorage('choirProtoVersion', CURRENT_VERSION);
    setStorage('choirProtoPeople', people);
    setStorage('choirProtoEvents', events);
    setStorage('choirProtoLooks', looks);

    closeModal('settingsModal');
    render();
    go('home');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  render();
});
