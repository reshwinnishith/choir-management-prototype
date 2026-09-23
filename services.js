// Choir Manager - v1.6B Service & Storage Abstraction Layer

const SCHEMA_VERSION = '1.6B';

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

// 1. Bundled India Cities & States Dataset
const getCityDataset = () => (typeof INDIA_CITIES_DATASET !== 'undefined') ? INDIA_CITIES_DATASET : [
  { city: 'Chennai', state: 'Tamil Nadu', aliases: ['Madras'] },
  { city: 'Coimbatore', state: 'Tamil Nadu', aliases: ['Kovai'] },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', aliases: ['Trichy', 'Tiruchi'] },
  { city: 'Bengaluru', state: 'Karnataka', aliases: ['Bangalore'] },
  { city: 'Kochi', state: 'Kerala', aliases: ['Cochin', 'Ernakulam'] },
  { city: 'Mumbai', state: 'Maharashtra', aliases: ['Bombay'] },
  { city: 'Delhi', state: 'Delhi' }
];

const cityService = {
  search(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const ds = getCityDataset();
    
    const results = [];
    const seen = new Set();

    ds.forEach(item => {
      const matchCity = item.city.toLowerCase().includes(q);
      const matchState = item.state.toLowerCase().includes(q);
      const matchAlias = item.aliases && item.aliases.some(a => a.toLowerCase().includes(q));

      if (matchCity || matchState || matchAlias) {
        const key = `${item.city}_${item.state}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            city: item.city,
            state: item.state
          });
        }
      }
    });

    return results;
  },

  getByCityName(cityName) {
    if (!cityName) return null;
    const q = cityName.trim().toLowerCase();
    const ds = getCityDataset();

    const found = ds.find(item => {
      if (item.city.toLowerCase() === q) return true;
      if (item.aliases && item.aliases.some(a => a.toLowerCase() === q)) return true;
      return false;
    });

    if (found) {
      return { city: found.city, state: found.state };
    }

    return null;
  }
};

// 2. Default Event Types Definitions
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

// 3. Default Tag Definitions
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

// 4. Initial Seed Datasets
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
  { id: 'client_staccato_band', name: 'Staccato Band', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_ashwin_studio', name: 'Ashwin Studio', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_vijay_productions', name: 'Vijay Productions', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_seven_screen_studio', name: 'Seven Screen Studio', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_elfe_band', name: 'ELFE Band', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_rohan_diya', name: 'Rohan & Diya', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_aster_labs', name: 'Aster Labs', contactName: '', phone: '', email: '', notes: '', active: true },
  { id: 'client_city_arts', name: 'City Arts', contactName: '', phone: '', email: '', notes: '', active: true }
];

const initialVenues = [
  { id: 'venue_intercontinental', name: 'Intercontinental', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_tase', name: 'Tase', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_juhu_beach', name: 'Juhu beach', city: 'Mumbai', state: 'Maharashtra', active: true },
  { id: 'venue_staccato_studio', name: 'Staccato studio - teynampet', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_rec', name: 'REC', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_chennai_trade_centre', name: 'Chennai trade centre', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_hindustan_clg', name: 'Hindustan clg', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_vandalur', name: 'Vandalur', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_vgp', name: 'VGP', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_taj_coromandel', name: 'Taj Coromandel', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_itc_grand_chola', name: 'ITC Grand Chola', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_museum_theatre', name: 'Museum Theatre', city: 'Chennai', state: 'Tamil Nadu', active: true }
];

const initialEvents = [
  {
    id: 1,
    name: '',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-08-08',
    time: '',
    clientId: 'client_staccato_band',
    venueId: 'venue_intercontinental',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_ashwin_studio',
    venueId: 'venue_tase',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_vijay_productions',
    venueId: 'venue_juhu_beach',
    city: 'Mumbai',
    state: 'Maharashtra',
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
    clientId: 'client_staccato_band',
    venueId: 'venue_staccato_studio',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_staccato_band',
    venueId: 'venue_staccato_studio',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_staccato_band',
    venueId: 'venue_staccato_studio',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_staccato_band',
    venueId: 'venue_rec',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_seven_screen_studio',
    venueId: 'venue_chennai_trade_centre',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    name: '',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-09-03',
    time: '',
    clientId: 'client_elfe_band',
    venueId: 'venue_hindustan_clg',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    clientId: 'client_staccato_band',
    venueId: 'venue_vandalur',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    name: '',
    status: 'confirmed',
    eventTypeId: 'event_type_unspecified',
    date: '2026-09-06',
    time: '',
    clientId: 'client_elfe_band',
    venueId: 'venue_vgp',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    name: '',
    status: 'enquiry',
    eventTypeId: 'event_type_performance',
    date: '2026-09-28',
    time: '19:00',
    clientId: 'client_rohan_diya',
    venueId: 'venue_taj_coromandel',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    name: 'Unplugged Gala Night',
    status: 'enquiry',
    eventTypeId: 'event_type_performance',
    date: '2026-09-30',
    time: '18:30',
    clientId: 'client_aster_labs',
    venueId: 'venue_itc_grand_chola',
    city: 'Chennai',
    state: 'Tamil Nadu',
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
    name: 'Cultural Fest Mainstage',
    status: 'confirmed',
    eventTypeId: 'event_type_performance',
    date: '2026-10-03',
    time: '19:00',
    clientId: 'client_city_arts',
    venueId: 'venue_museum_theatre',
    city: 'Chennai',
    state: 'Tamil Nadu',
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

// Non-Destructive In-Place Schema Migration Engine (v1.6A -> v1.6B)
function migrateToV16B() {
  const currentSchema = localStorage.getItem('choirProtoSchemaVersion');
  if (currentSchema === SCHEMA_VERSION) {
    return; // Already v1.6B schema
  }

  console.log(`[Migration] Running non-destructive migration to schema ${SCHEMA_VERSION}...`);

  let peopleList = storageService.get('choirProtoPeople', null);
  let eventsList = storageService.get('choirProtoEvents', null);
  let tagsList = storageService.get('choirProtoTags', null);
  let clientsList = storageService.get('choirProtoClients', null);
  let venuesList = storageService.get('choirProtoVenues', null);
  let eventTypesList = storageService.get('choirProtoEventTypes', null);

  if (!eventTypesList) eventTypesList = defaultEventTypes;
  if (!tagsList) tagsList = defaultTags;
  if (!clientsList) clientsList = initialClients;
  if (!venuesList) venuesList = initialVenues;
  if (!peopleList) peopleList = initialPeople;
  if (!eventsList) eventsList = initialEvents;

  // Venue location updates for v1.6B
  venuesList.forEach(v => {
    if (!v.city) {
      if (v.name.toLowerCase().includes('juhu')) {
        v.city = 'Mumbai';
        v.state = 'Maharashtra';
      } else {
        v.city = 'Chennai';
        v.state = 'Tamil Nadu';
      }
    }
  });

  const venueMap = new Map();
  venuesList.forEach(v => venueMap.set(v.id, v));

  // Transform events
  eventsList.forEach(e => {
    if (!e.city || !e.state) {
      const vObj = venueMap.get(e.venueId);
      if (vObj) {
        e.city = vObj.city || 'Chennai';
        e.state = vObj.state || 'Tamil Nadu';
      } else {
        e.city = 'Chennai';
        e.state = 'Tamil Nadu';
      }
    }
  });

  // Save transformed state to storage
  storageService.set('choirProtoSchemaVersion', SCHEMA_VERSION);
  storageService.set('choirProtoEventTypes', eventTypesList);
  storageService.set('choirProtoTags', tagsList);
  storageService.set('choirProtoClients', clientsList);
  storageService.set('choirProtoVenues', venuesList);
  storageService.set('choirProtoPeople', peopleList);
  storageService.set('choirProtoEvents', eventsList);

  console.log(`[Migration] Successfully completed schema migration to ${SCHEMA_VERSION}.`);
}

// Run Migration Pipeline
migrateToV16B();

// SERVICE LAYER ABSTRACTION

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
  getOrCreateByName(name, extraData = {}) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const clients = this.getAll();
    let match = clients.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = {
        id: generateId('client'),
        name: cleanName,
        contactName: extraData.contactName || '',
        phone: extraData.phone || '',
        email: extraData.email || '',
        notes: extraData.notes || '',
        active: true
      };
      clients.push(match);
      storageService.set('choirProtoClients', clients);
    } else if (extraData.contactName || extraData.phone || extraData.email) {
      Object.assign(match, extraData);
      storageService.set('choirProtoClients', clients);
    }
    return match;
  },
  create(data) {
    const clients = this.getAll();
    const newClient = {
      id: generateId('client'),
      name: data.name.trim(),
      contactName: data.contactName || '',
      phone: data.phone || '',
      email: data.email || '',
      notes: data.notes || '',
      active: true
    };
    clients.push(newClient);
    storageService.set('choirProtoClients', clients);
    return newClient;
  },
  update(id, data) {
    const clients = this.getAll();
    const c = clients.find(x => x.id === id);
    if (c) {
      Object.assign(c, data);
      storageService.set('choirProtoClients', clients);
    }
    return c;
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
  getOrCreateByName(name, city = 'Chennai', state = 'Tamil Nadu') {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const venues = this.getAll();
    let match = venues.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = { id: generateId('venue'), name: cleanName, city: city || '', state: state || '', active: true };
      venues.push(match);
      storageService.set('choirProtoVenues', venues);
    }
    return match;
  },
  create(data) {
    const venues = this.getAll();
    const newVenue = {
      id: generateId('venue'),
      name: data.name.trim(),
      city: data.city || 'Chennai',
      state: data.state || 'Tamil Nadu',
      active: true
    };
    venues.push(newVenue);
    storageService.set('choirProtoVenues', venues);
    return newVenue;
  },
  update(id, data) {
    const venues = this.getAll();
    const v = venues.find(x => x.id === id);
    if (v) {
      Object.assign(v, data);
      storageService.set('choirProtoVenues', venues);
    }
    return v;
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
  },
  create(name) {
    const all = this.getAll();
    const cleanName = name.trim();
    let match = all.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
    if (!match) {
      match = { id: generateId('event_type'), name: cleanName, active: true };
      all.push(match);
      storageService.set('choirProtoEventTypes', all);
    }
    return match;
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
      name: data.name || '',
      eventTypeId: data.eventTypeId || 'event_type_unspecified',
      date: data.date,
      time: data.time || '',
      clientId: data.clientId || null,
      venueId: data.venueId || null,
      city: data.city || 'Chennai',
      state: data.state || 'Tamil Nadu',
      singersCount: Number(data.singersCount || 1),
      budget: Number(data.budget || 0),
      language: data.language || '',
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
