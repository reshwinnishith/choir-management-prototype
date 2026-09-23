// Choir Manager - v1.6A Service & Storage Abstraction Layer

const SCHEMA_VERSION = '1.6A';

// Storage Engine Abstraction
const storageService = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error(`Storage get error for ${key}:`, e);
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Storage set error for ${key}:`, e);
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

// ID Generator Helper
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// 1. Default Event Types Entity Definitions
const defaultEventTypes = [
  { id: 'event_type_unspecified', name: 'Unspecified', active: true },
  { id: 'event_type_performance', name: 'Performance', active: true },
  { id: 'event_type_recording', name: 'Recording', active: true },
  { id: 'event_type_rehearsal', name: 'Rehearsal', active: true },
  { id: 'event_type_event', name: 'Event', active: true },
  { id: 'event_type_shoot', name: 'Shoot', active: true },
  { id: 'event_type_soundcheck', name: 'Soundcheck', active: true },
  { id: 'event_type_cast', name: 'Cast', active: true }
];

// 2. Default Tag Entity Definitions
const defaultTags = [
  { id: 'tag_old_member', name: 'Old Member', group: 'membership', active: true },
  { id: 'tag_new_member', name: 'New Member', group: 'membership', active: true },
  { id: 'tag_tamil', name: 'Tamil', group: 'language', active: true },
  { id: 'tag_english', name: 'English', group: 'language', active: true },
  { id: 'tag_hindi', name: 'Hindi', group: 'language', active: true },
  { id: 'tag_malayalam', name: 'Malayalam', group: 'language', active: true },
  { id: 'tag_performance', name: 'Performance', group: 'eligibility', active: true },
  { id: 'tag_recording', name: 'Recording', group: 'eligibility', active: true }
];

// 3. Initial Seed Datasets
const initialPeople = [
  // Old Members
  { id: 'p_roe', name: 'Roe', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_anuj', name: 'Anuj', gender: 'Male', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_abraham', name: 'Abraham', gender: 'Male', tagIds: ['tag_old_member', 'tag_english', 'tag_performance'], active: true },
  { id: 'p_arnav', name: 'Arnav', gender: 'Male', tagIds: ['tag_old_member', 'tag_english', 'tag_hindi', 'tag_recording'], active: true },
  { id: 'p_anjana', name: 'Anjana', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_nandhika', name: 'Nandhika', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_bryan', name: 'Bryan', gender: 'Male', tagIds: ['tag_old_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_chakki', name: 'Chakki', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_malayalam', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_leon', name: 'Leon', gender: 'Male', tagIds: ['tag_old_member', 'tag_english', 'tag_performance'], active: true },
  { id: 'p_ritin', name: 'Ritin', gender: 'Male', tagIds: ['tag_old_member', 'tag_malayalam', 'tag_english', 'tag_performance'], active: true },
  { id: 'p_reshwin', name: 'Reshwin', gender: 'Male', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_reuben', name: 'Reuben', gender: 'Male', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_serene', name: 'Serene', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_sheena', name: 'Sheena', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_sneha', name: 'Sneha', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_hindi', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_tanya', name: 'Tanya', gender: 'Female', tagIds: ['tag_old_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_tincy', name: 'Tincy', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_malayalam', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_tofer', name: 'Tofer', gender: 'Male', tagIds: ['tag_old_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_vaimu', name: 'Vaimu', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_varsha', name: 'Varsha', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_varshini', name: 'Varshini', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_performance'], active: true },
  { id: 'p_pragee', name: 'Pragee', gender: 'Female', tagIds: ['tag_old_member', 'tag_tamil', 'tag_performance'], active: true },

  // New Members
  { id: 'p_aishu', name: 'Aishu', gender: 'Female', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_angel', name: 'Angel', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_dyuti', name: 'Dyuti', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_hindi', 'tag_recording'], active: true },
  { id: 'p_geejay', name: 'Geejay', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_joe', name: 'Joe', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_kevin', name: 'Kevin', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_mark', name: 'Mark', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_nattu', name: 'Nattu', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_olivia', name: 'Olivia', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_pranav', name: 'Pranav', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance'], active: true },
  { id: 'p_sai', name: 'Sai', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_sebi', name: 'Sebi', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_malayalam', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_yazhini', name: 'Yazhini', gender: 'Female', tagIds: ['tag_new_member', 'tag_tamil', 'tag_performance'], active: true },
  { id: 'p_waveen', name: 'Waveen', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_luchy', name: 'Luchy', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_performance'], active: true },
  { id: 'p_lucky', name: 'Lucky', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },

  // Spreadsheet 3rd Column Members (Recording Only)
  { id: 'p_alfred', name: 'Alfred', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_moncy', name: 'Moncy', gender: 'Male', tagIds: ['tag_new_member', 'tag_malayalam', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_aishwarya', name: 'Aishwarya', gender: 'Female', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_ivan', name: 'Ivan', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_sukanti', name: 'Sukanti', gender: 'Female', tagIds: ['tag_new_member', 'tag_hindi', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_rahul', name: 'Rahul', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_hindi', 'tag_english', 'tag_recording'], active: true },
  { id: 'p_snigdha', name: 'Snigdha', gender: 'Female', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_recording'], active: true }
];

const initialClients = [
  { id: 'client_rohan_diya', name: 'Rohan & Diya', active: true },
  { id: 'client_aster_labs', name: 'Aster Labs', active: true },
  { id: 'client_city_arts', name: 'City Arts', active: true }
];

const initialVenues = [
  { id: 'venue_intercontinental', name: 'Intercontinental', city: '', state: '', active: true },
  { id: 'venue_tase', name: 'Tase', city: '', state: '', active: true },
  { id: 'venue_juhu_beach', name: 'Juhu beach', city: '', state: '', active: true },
  { id: 'venue_staccato_studio', name: 'Staccato studio - teynampet', city: '', state: '', active: true },
  { id: 'venue_rec', name: 'REC', city: '', state: '', active: true },
  { id: 'venue_chennai_trade_centre', name: 'Chennai trade centre', city: '', state: '', active: true },
  { id: 'venue_hindustan_clg', name: 'Hindustan clg', city: '', state: '', active: true },
  { id: 'venue_vandalur', name: 'Vandalur', city: '', state: '', active: true },
  { id: 'venue_vgp', name: 'VGP', city: '', state: '', active: true },
  { id: 'venue_taj_coromandel', name: 'Taj Coromandel', city: '', state: '', active: true },
  { id: 'venue_itc_grand_chola', name: 'ITC Grand Chola', city: '', state: '', active: true },
  { id: 'venue_museum_theatre', name: 'Museum Theatre', city: '', state: '', active: true }
];

// Initial Seed Events with Stable IDs (v1.6A Schema)
const initialEvents = [
  {
    id: 1,
    name: 'Staccato',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-08-08',
    time: '',
    clientId: null,
    venueId: 'venue_intercontinental',
    singersCount: 8,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_anjana', status: 'Available' },
      { personId: 'p_serene', status: 'Available' },
      { personId: 'p_tanya', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_tofer', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' }
    ]
  },
  {
    id: 2,
    name: 'Ashwin Recording',
    status: 'confirmed',
    eventTypeId: 'event_type_recording',
    date: '2026-08-12',
    time: '',
    clientId: null,
    venueId: 'venue_tase',
    singersCount: 11,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_sneha', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_snigdha', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_mark', status: 'Available' },
      { personId: 'p_rahul', status: 'Available' }
    ]
  },
  {
    id: 3,
    name: 'Music Video Shoot - Vijay',
    status: 'confirmed',
    eventTypeId: 'event_type_shoot',
    date: '2026-08-20',
    time: '',
    clientId: null,
    venueId: 'venue_juhu_beach',
    singersCount: 6,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_sheena', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' }
    ]
  },
  {
    id: 4,
    name: 'Staccato - Recording',
    status: 'confirmed',
    eventTypeId: 'event_type_recording',
    date: '2026-08-23',
    time: '',
    clientId: null,
    venueId: 'venue_staccato_studio',
    singersCount: 17,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_sheena', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_angel', status: 'Available' },
      { personId: 'p_anjana', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_aishu', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_tofer', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_waveen', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_mark', status: 'Available' }
    ]
  },
  {
    id: 5,
    name: 'Staccato Rehearsal',
    status: 'confirmed',
    eventTypeId: 'event_type_rehearsal',
    date: '2026-08-26',
    time: '',
    clientId: null,
    venueId: 'venue_staccato_studio',
    singersCount: 15,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_angel', status: 'Available' },
      { personId: 'p_sneha', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_lucky', status: 'Available' },
      { personId: 'p_waveen', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_mark', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' }
    ]
  },
  {
    id: 6,
    name: 'Staccato Rehersal',
    status: 'confirmed',
    eventTypeId: 'event_type_rehearsal',
    date: '2026-08-27',
    time: '',
    clientId: null,
    venueId: 'venue_staccato_studio',
    singersCount: 14,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_olivia', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_lucky', status: 'Available' },
      { personId: 'p_angel', status: 'Available' },
      { personId: 'p_waveen', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_sneha', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' }
    ]
  },
  {
    id: 7,
    name: 'Staccato Sound check',
    status: 'confirmed',
    eventTypeId: 'event_type_soundcheck',
    date: '2026-08-28',
    time: '',
    clientId: null,
    venueId: 'venue_rec',
    singersCount: 20,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_sheena', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_sneha', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' },
      { personId: 'p_aishu', status: 'Available' },
      { personId: 'p_angel', status: 'Available' },
      { personId: 'p_olivia', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_tincy', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_lucky', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_waveen', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_mark', status: 'Available' },
      { personId: 'p_bryan', status: 'Available' }
    ]
  },
  {
    id: 8,
    name: 'Sardar Audio launch',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-08-31',
    time: '',
    clientId: null,
    venueId: 'venue_chennai_trade_centre',
    singersCount: 16,
    budget: 0,
    language: '',
    notes: '',
    managers: ['p_nandhika'],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_sheena', status: 'Available' },
      { personId: 'p_nandhika', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_tincy', status: 'Available' },
      { personId: 'p_sneha', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_bryan', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_joe', status: 'Available' },
      { personId: 'p_mark', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' },
      { personId: 'p_sai', status: 'Available' }
    ]
  },
  {
    id: 9,
    name: 'ELFE ACT (with band)',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-09-03',
    time: '',
    clientId: null,
    venueId: 'venue_hindustan_clg',
    singersCount: 10,
    budget: 0,
    language: '',
    notes: '',
    managers: ['p_sheena', 'p_varsha'],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_tincy', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_joe', status: 'Available' },
      { personId: 'p_waveen', status: 'Available' },
      { personId: 'p_nattu', status: 'Available' }
    ]
  },
  {
    id: 10,
    name: 'Staccato - teachers day',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-09-05',
    time: '',
    clientId: null,
    venueId: 'venue_vandalur',
    singersCount: 6,
    budget: 0,
    language: '',
    notes: '',
    managers: [],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_varsha', status: 'Available' },
      { personId: 'p_serene', status: 'Available' },
      { personId: 'p_tanya', status: 'Available' },
      { personId: 'p_reuben', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' }
    ]
  },
  {
    id: 11,
    name: 'ELFE ACT',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-09-06',
    time: '',
    clientId: null,
    venueId: 'venue_vgp',
    singersCount: 10,
    budget: 0,
    language: '',
    notes: '',
    managers: ['p_sheena', 'p_varsha'],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_tincy', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_sai', status: 'Available' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_sebi', status: 'Available' },
      { personId: 'p_reuben', status: 'Available' }
    ]
  },
  // UPCOMING DEMO FIXTURES
  {
    id: 12,
    name: 'Grand Royal Wedding',
    status: 'enquiry',
    eventTypeId: 'event_type_performance',
    category: 'Wedding',
    date: '2026-09-28',
    time: '19:00',
    clientId: 'client_rohan_diya',
    venueId: 'venue_taj_coromandel',
    singersCount: 8,
    budget: 90000,
    language: 'Tamil',
    notes: '📌 [Demo Test Fixture] Sample enquiry fixture.',
    managers: [],
    assignedSingers: [],
    isDemoFixture: true
  },
  {
    id: 13,
    name: 'Corporate Unplugged Night',
    status: 'enquiry',
    eventTypeId: 'event_type_performance',
    category: 'Corporate',
    date: '2026-09-30',
    time: '18:30',
    clientId: 'client_aster_labs',
    venueId: 'venue_itc_grand_chola',
    singersCount: 6,
    budget: 75000,
    language: 'English',
    notes: '📌 [Demo Test Fixture] Sample corporate show enquiry.',
    managers: ['p_varsha'],
    assignedSingers: [
      { personId: 'p_anuj', status: 'Available' },
      { personId: 'p_sheena', status: 'Available' }
    ],
    isDemoFixture: true
  },
  {
    id: 14,
    name: 'City Cultural Fest',
    status: 'confirmed',
    eventTypeId: 'event_type_performance',
    category: 'Concert',
    date: '2026-10-03',
    time: '19:00',
    clientId: 'client_city_arts',
    venueId: 'venue_museum_theatre',
    singersCount: 10,
    budget: 120000,
    language: 'Mixed',
    notes: '📌 [Demo Test Fixture] 1 singer unavailable (Sheena). Test Find Replacement workflow.',
    managers: ['p_sheena'],
    assignedSingers: [
      { personId: 'p_roe', status: 'Available' },
      { personId: 'p_chakki', status: 'Available' },
      { personId: 'p_tincy', status: 'Available' },
      { personId: 'p_vaimu', status: 'Available' },
      { personId: 'p_geejay', status: 'Available' },
      { personId: 'p_anuj', status: 'Asked' },
      { personId: 'p_sai', status: 'Asked' },
      { personId: 'p_kevin', status: 'Available' },
      { personId: 'p_sheena', status: 'Unavailable' }
    ],
    isDemoFixture: true
  }
];

// Non-Destructive In-Place Schema Migration Engine (v1.5 -> v1.6A)
function migrateToV16A() {
  const currentSchema = localStorage.getItem('choirProtoSchemaVersion');
  if (currentSchema === SCHEMA_VERSION) {
    return; // Already v1.6A schema
  }

  console.log(`[Migration] Running non-destructive migration to schema ${SCHEMA_VERSION}...`);

  // Load existing raw collections or fallback to seed
  let peopleList = storageService.get('choirProtoPeople', null);
  let eventsList = storageService.get('choirProtoEvents', null);
  let tagsList = storageService.get('choirProtoTags', null);
  let clientsList = storageService.get('choirProtoClients', null);
  let venuesList = storageService.get('choirProtoVenues', null);

  if (!tagsList) tagsList = defaultTags;
  if (!clientsList) clientsList = initialClients;
  if (!venuesList) venuesList = initialVenues;
  if (!peopleList) peopleList = initialPeople;
  if (!eventsList) eventsList = initialEvents;

  // Build lookups
  const clientMap = new Map();
  clientsList.forEach(c => clientMap.set(c.name.toLowerCase(), c));

  const venueMap = new Map();
  venuesList.forEach(v => venueMap.set(v.name.toLowerCase(), v));

  const peopleMap = new Map();
  peopleList.forEach(p => {
    peopleMap.set(p.id, p);
    peopleMap.set(p.name.toLowerCase(), p);
  });

  // 1. Transform Events to v1.6A Schema
  eventsList.forEach(e => {
    // Client entity migration
    if (!e.clientId && e.client && e.client.trim()) {
      const cKey = e.client.trim().toLowerCase();
      let matchClient = clientMap.get(cKey);
      if (!matchClient) {
        matchClient = { id: generateId('client'), name: e.client.trim(), active: true };
        clientsList.push(matchClient);
        clientMap.set(cKey, matchClient);
      }
      e.clientId = matchClient.id;
    }

    // Venue entity migration
    if (!e.venueId && e.venue && e.venue.trim()) {
      const vKey = e.venue.trim().toLowerCase();
      let matchVenue = venueMap.get(vKey);
      if (!matchVenue) {
        matchVenue = { id: generateId('venue'), name: e.venue.trim(), city: '', state: '', active: true };
        venuesList.push(matchVenue);
        venueMap.set(vKey, matchVenue);
      }
      e.venueId = matchVenue.id;
    }

    // EventType migration
    if (!e.eventTypeId) {
      const wt = (e.workType || '').toLowerCase();
      if (wt.includes('perf')) e.eventTypeId = 'event_type_performance';
      else if (wt.includes('rec')) e.eventTypeId = 'event_type_recording';
      else if (wt.includes('reh')) e.eventTypeId = 'event_type_rehearsal';
      else if (wt.includes('shoot')) e.eventTypeId = 'event_type_shoot';
      else if (wt.includes('sound')) e.eventTypeId = 'event_type_soundcheck';
      else e.eventTypeId = 'event_type_unspecified';
    }

    // Assigned Singers Stable ID Migration
    if (Array.isArray(e.assignedSingers)) {
      e.assignedSingers = e.assignedSingers.map(s => {
        if (s.personId) return s; // Already stable ID
        const personMatch = peopleMap.get((s.name || '').toLowerCase());
        if (personMatch) {
          return { personId: personMatch.id, status: s.status || 'Not asked' };
        }
        // Fallback: create new Person if unmapped
        const newP = { id: generateId('p'), name: s.name, gender: 'Female', tagIds: ['tag_new_member'], active: true };
        peopleList.push(newP);
        peopleMap.set(newP.id, newP);
        peopleMap.set(newP.name.toLowerCase(), newP);
        return { personId: newP.id, status: s.status || 'Not asked' };
      }).filter(Boolean);
    }

    // Managers Stable ID Migration
    if (Array.isArray(e.managers)) {
      e.managers = e.managers.map(m => {
        if (m.startsWith('p_') || m.startsWith('person_')) return m; // Already ID
        const personMatch = peopleMap.get(m.toLowerCase());
        return personMatch ? personMatch.id : null;
      }).filter(Boolean);
    }
  });

  // Save transformed state to storage
  storageService.set('choirProtoSchemaVersion', SCHEMA_VERSION);
  storageService.set('choirProtoEventTypes', defaultEventTypes);
  storageService.set('choirProtoTags', tagsList);
  storageService.set('choirProtoClients', clientsList);
  storageService.set('choirProtoVenues', venuesList);
  storageService.set('choirProtoPeople', peopleList);
  storageService.set('choirProtoEvents', eventsList);

  console.log(`[Migration] Successfully completed schema migration to ${SCHEMA_VERSION}.`);
}

// Run Migration Pipeline
migrateToV16A();

// SERVICE LAYER ABSTRACTION (Firebase-ready API surfaces)

const peopleService = {
  getAll() {
    return storageService.get('choirProtoPeople', initialPeople);
  },
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },
  getByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return this.getAll().find(p => p.name.toLowerCase() === n) || null;
  },
  create(data) {
    const people = this.getAll();
    const newPerson = {
      id: generateId('p'),
      name: data.name,
      gender: data.gender || 'Female',
      tagIds: data.tagIds || ['tag_new_member'],
      active: true
    };
    people.push(newPerson);
    storageService.set('choirProtoPeople', people);
    return newPerson;
  },
  update(id, data) {
    const people = this.getAll();
    const p = people.find(x => x.id === id);
    if (p) {
      Object.assign(p, data);
      storageService.set('choirProtoPeople', people);
    }
    return p;
  },
  delete(id) {
    let people = this.getAll();
    people = people.filter(p => p.id !== id);
    storageService.set('choirProtoPeople', people);
  }
};

const tagService = {
  getAll() {
    return storageService.get('choirProtoTags', defaultTags);
  },
  getById(id) {
    return this.getAll().find(t => t.id === id) || null;
  },
  create(name, group = 'custom') {
    const tags = this.getAll();
    const newTag = {
      id: generateId('tag_custom'),
      name: name.trim(),
      group,
      active: true
    };
    tags.push(newTag);
    storageService.set('choirProtoTags', tags);
    return newTag;
  },
  rename(id, newName) {
    const tags = this.getAll();
    const t = tags.find(x => x.id === id);
    if (t) {
      t.name = newName.trim();
      storageService.set('choirProtoTags', tags);
    }
    return t;
  },
  toggleActive(id) {
    const tags = this.getAll();
    const t = tags.find(x => x.id === id);
    if (t) {
      t.active = !t.active;
      storageService.set('choirProtoTags', tags);
    }
    return t;
  }
};

const clientService = {
  getAll() {
    return storageService.get('choirProtoClients', initialClients);
  },
  getById(id) {
    if (!id) return null;
    return this.getAll().find(c => c.id === id) || null;
  },
  getOrCreateByName(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const clients = this.getAll();
    let match = clients.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = { id: generateId('client'), name: cleanName, active: true };
      clients.push(match);
      storageService.set('choirProtoClients', clients);
    }
    return match;
  }
};

const venueService = {
  getAll() {
    return storageService.get('choirProtoVenues', initialVenues);
  },
  getById(id) {
    if (!id) return null;
    return this.getAll().find(v => v.id === id) || null;
  },
  getOrCreateByName(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const venues = this.getAll();
    let match = venues.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = { id: generateId('venue'), name: cleanName, city: '', state: '', active: true };
      venues.push(match);
      storageService.set('choirProtoVenues', venues);
    }
    return match;
  }
};

const eventTypeService = {
  getAll() {
    return storageService.get('choirProtoEventTypes', defaultEventTypes);
  },
  getById(id) {
    if (!id) return defaultEventTypes[0];
    return this.getAll().find(t => t.id === id) || defaultEventTypes[0];
  },
  getByWorkType(workType) {
    if (!workType) return defaultEventTypes[0];
    const wt = workType.toLowerCase();
    const all = this.getAll();
    if (wt.includes('perf')) return all.find(t => t.id === 'event_type_performance') || all[0];
    if (wt.includes('rec')) return all.find(t => t.id === 'event_type_recording') || all[0];
    if (wt.includes('reh')) return all.find(t => t.id === 'event_type_rehearsal') || all[0];
    if (wt.includes('shoot')) return all.find(t => t.id === 'event_type_shoot') || all[0];
    if (wt.includes('sound')) return all.find(t => t.id === 'event_type_soundcheck') || all[0];
    return all.find(t => t.name.toLowerCase() === wt) || all[0];
  }
};

const eventService = {
  getAll() {
    return storageService.get('choirProtoEvents', initialEvents);
  },
  getById(id) {
    return this.getAll().find(e => e.id === Number(id)) || null;
  },
  create(data) {
    const events = this.getAll();
    const newEvent = {
      id: Date.now(),
      status: data.status || 'enquiry',
      name: data.name || 'Untitled Event',
      eventTypeId: data.eventTypeId || 'event_type_unspecified',
      date: data.date,
      time: data.time || '',
      clientId: data.clientId || null,
      venueId: data.venueId || null,
      singersCount: Number(data.singersCount || 1),
      budget: Number(data.budget || 0),
      notes: data.notes || '',
      managers: data.managers || [],
      assignedSingers: data.assignedSingers || [],
      isDemoFixture: data.isDemoFixture || false
    };
    events.push(newEvent);
    storageService.set('choirProtoEvents', events);
    return newEvent;
  },
  update(id, data) {
    const events = this.getAll();
    const e = events.find(x => x.id === Number(id));
    if (e) {
      Object.assign(e, data);
      storageService.set('choirProtoEvents', events);
    }
    return e;
  },
  delete(id) {
    let events = this.getAll();
    events = events.filter(e => e.id !== Number(id));
    storageService.set('choirProtoEvents', events);
  }
};

// Central Entity Resolution Helpers
function getPersonById(id) {
  return peopleService.getById(id);
}

function getClientById(id) {
  return clientService.getById(id);
}

function getVenueById(id) {
  return venueService.getById(id);
}

function getEventTypeById(id) {
  return eventTypeService.getById(id);
}

// CORRECT Singer History Calculation: EXCLUDES manager-only appearances!
function getSingerHistory(personId) {
  const events = eventService.getAll();
  // Filter events where person is explicitly in assignedSingers (excluding manager-only)
  const pastEvents = events.filter(e => {
    return (e.assignedSingers || []).some(s => s.personId === personId);
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalShows = pastEvents.length;
  const lastShow = pastEvents.length ? pastEvents[0] : null;

  return {
    totalShows,
    lastShowDate: lastShow ? dateParts(lastShow.date).full : 'None',
    recentShows: pastEvents.slice(0, 4).map(e => {
      const evtType = getEventTypeById(e.eventTypeId);
      return {
        date: dateParts(e.date).full,
        name: e.name,
        category: e.category || '—',
        workType: evtType ? evtType.name : 'Unspecified'
      };
    })
  };
}
