// Choir Manager - v1.7 Firebase Cloud Foundation + Data Layer Abstraction

const SCHEMA_VERSION = '1.7';

// Mode Detection Helper
function isDemoMode() {
  return window.location.search.includes('demo=1') || localStorage.getItem('choirForceDemo') === 'true';
}
window.isDemoMode = isDemoMode;


// Storage Engine Abstraction (Local Demo Mode)
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

// 2. Default System Event Types Definitions (Application Defaults)
const productionInitialEventTypes = [
  { id: 'event_type_unspecified', name: 'Unspecified', active: true, sortOrder: 0, isProtected: true },
  { id: 'event_type_performance', name: 'Performance', active: true, sortOrder: 1 },
  { id: 'event_type_recording', name: 'Recording', active: true, sortOrder: 2 },
  { id: 'event_type_rehearsal', name: 'Rehearsal', active: true, sortOrder: 3 }
];

const defaultEventTypes = [
  { id: 'event_type_unspecified', name: 'Unspecified', active: true, sortOrder: 0, isProtected: true },
  { id: 'event_type_performance', name: 'Performance', active: true, sortOrder: 1 },
  { id: 'event_type_recording', name: 'Recording', active: true, sortOrder: 2 },
  { id: 'event_type_rehearsal', name: 'Rehearsal', active: true, sortOrder: 3 },
  { id: 'event_type_event', name: 'Event', active: true, sortOrder: 4 },
  { id: 'event_type_shoot', name: 'Shoot', active: true, sortOrder: 5 },
  { id: 'event_type_soundcheck', name: 'Soundcheck', active: true, sortOrder: 6 },
  { id: 'event_type_cast', name: 'Cast', active: true, sortOrder: 7 }
];

// 3. Default Tag Definitions for Local Demo Mode
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

// 4. Initial Seed Datasets (Local Demo Mode Only)
const initialPeople = [
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
  { id: 'p_aishu', name: 'Aishu', gender: 'Female', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_angel', name: 'Angel', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_dyuti', name: 'Dyuti', gender: 'Female', tagIds: ['tag_new_member', 'tag_english', 'tag_hindi', 'tag_recording'], active: true },
  { id: 'p_geejay', name: 'Geejay', gender: 'Male', tagIds: ['tag_new_member', 'tag_tamil', 'tag_english', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_joe', name: 'Joe', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_kevin', name: 'Kevin', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true },
  { id: 'p_mark', name: 'Mark', gender: 'Male', tagIds: ['tag_new_member', 'tag_english', 'tag_tamil', 'tag_performance', 'tag_recording'], active: true }
];

const initialClients = [
  { id: 'client_staccato_band', name: 'Staccato', contactName: 'Vikram', phone: '+919840012345', email: 'events@staccatoband.in', notes: 'Core band shows & recordings', active: true },
  { id: 'client_seven_screen_studio', name: 'Seven Screen Studio', contactName: 'Lalit Kumar', phone: '+919841054321', email: 'production@7screen.com', notes: 'Film audio launches & promos', active: true },
  { id: 'client_sony_music_south', name: 'Sony Music South', contactName: 'Ashok', phone: '+919884099887', email: 'south@sonymusic.com', notes: 'Recordings & promotional chorus', active: true },
  { id: 'client_aster_labs', name: 'Aster Labs', contactName: 'Divya', phone: '+919710044556', email: 'events@aster.in', notes: 'Corporate galas', active: true },
  { id: 'client_city_arts', name: 'City Arts Foundation', contactName: 'Raghavan', phone: '+919444011223', email: 'contact@cityarts.org', notes: 'Cultural fests', active: true }
];

const initialVenues = [
  { id: 'venue_chennai_trade_centre', name: 'Chennai Trade Centre', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_taj_coromandel', name: 'Taj Coromandel', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_itc_grand_chola', name: 'ITC Grand Chola', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_museum_theatre', name: 'Museum Theatre', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_staccato_studio', name: 'Staccato Studio', city: 'Chennai', state: 'Tamil Nadu', active: true },
  { id: 'venue_rec', name: 'REC Hall', city: 'Chennai', state: 'Tamil Nadu', active: true }
];

const initialEvents = [
  {
    id: 1,
    name: 'Rohan & Diya Wedding',
    status: 'enquiry',
    eventTypeId: 'event_type_performance',
    date: '2026-09-28',
    time: '18:00',
    clientId: 'client_staccato_band',
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

// DATA PROVIDER ARCHITECTURE

// 1. LOCAL DATA PROVIDER (Local Demo Mode)
const localDataProvider = {
  getPeople() { return storageService.get('choirProtoPeople', initialPeople); },
  getTags() { return storageService.get('choirProtoTags', defaultTags); },
  getClients() { return storageService.get('choirProtoClients', initialClients); },
  getVenues() { return storageService.get('choirProtoVenues', initialVenues); },
  getEventTypes() { return storageService.get('choirProtoEventTypes', defaultEventTypes); },
  getEvents() { return storageService.get('choirProtoEvents', initialEvents); },

  setPeople(data) { storageService.set('choirProtoPeople', data); },
  setTags(data) { storageService.set('choirProtoTags', data); },
  setClients(data) { storageService.set('choirProtoClients', data); },
  setVenues(data) { storageService.set('choirProtoVenues', data); },
  setEventTypes(data) { storageService.set('choirProtoEventTypes', data); },
  setEvents(data) { storageService.set('choirProtoEvents', data); }
};

// 2. FIRESTORE DATA PROVIDER (Production Firebase Mode)
let activeFirebaseApp = null;
let activeFirebaseAuth = null;
let activeFirestoreDb = null;
let currentUser = null;
let currentWorkspaceId = null;

// In-Memory Production Cache
const firestoreCache = {
  people: [],
  tags: [],
  clients: [],
  venues: [],
  eventTypes: defaultEventTypes,
  events: [],
  isLoaded: false
};

// v1.8C: person account -> workspace membership -> choir workspace.
// Session state (never derived from the email address):
let currentProfile = null;        // users/{uid}
let currentWorkspace = null;      // { id, name, role, isLegacy, ownerUid, ownerDisplayName }
let myWorkspaces = [];            // same shape, every workspace this person can open

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const INVITE_TTL_DAYS = 7;

function randomCode(len, prefix = '') {
  const bytes = new Uint8Array(len);
  window.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  return prefix + out;
}

function normalizeInviteCode(raw) {
  let c = String(raw || '').trim();
  // accept a full invite link or a bare code
  const m = c.match(/[?&]invite=([A-Za-z0-9]+)/);
  if (m) c = m[1];
  return c.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

// Greeting helper: a stored displayName that is merely the email username counts as "not set".
function profileNeedsDisplayName(profile, user) {
  const dn = profile && profile.displayName ? String(profile.displayName).trim() : '';
  if (!dn) return true;
  const email = (user && user.email) || (profile && profile.email) || '';
  // exact match only: "Demo" (a real name) differs from "demo" (the email username)
  return dn === email.split('@')[0];
}

const ROLE_LABELS = { owner: 'Owner', manager: 'Manager' };

const authService = {
  isInitialized: false,
  _onChange: null,

  init(onAuthChangeCallback) {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this._onChange = onAuthChangeCallback;

    if (isDemoMode()) {
      console.log('[Auth] Running in Local Demo Mode (?demo=1). Auth bypass active.');
      if (onAuthChangeCallback) onAuthChangeCallback(null, true);
      return;
    }

    try {
      const SDK = window.FirebaseSDK;
      if (!SDK) {
        console.warn('[Firebase] SDK script not loaded yet. Falling back to Demo Mode.');
        if (onAuthChangeCallback) onAuthChangeCallback(null, false);
        return;
      }

      const config = window.FIREBASE_WEB_CONFIG;
      activeFirebaseApp = SDK.initializeApp(config);
      activeFirebaseAuth = SDK.getAuth(activeFirebaseApp);
      activeFirestoreDb = SDK.getFirestore(activeFirebaseApp);

      if (typeof SDK.enableIndexedDbPersistence === 'function' && !window.USE_FIREBASE_EMULATOR) {
        SDK.enableIndexedDbPersistence(activeFirestoreDb).catch(err => {
          if (err.code === 'failed-precondition') {
            console.warn('[Firestore Cache] Multiple tabs open; persistence enabled in first tab only.');
          } else if (err.code === 'unimplemented') {
            console.warn('[Firestore Cache] Browser does not support offline persistence.');
          }
        });
      }

      if (window.USE_FIREBASE_EMULATOR) {
        console.log('[Firebase] Connecting to Local Emulators (Auth: 9099, Firestore: 8080)...');
        SDK.connectAuthEmulator(activeFirebaseAuth, "http://127.0.0.1:9099");
        SDK.connectFirestoreEmulator(activeFirestoreDb, "127.0.0.1", 8080);
      }

      SDK.onAuthStateChanged(activeFirebaseAuth, async (user) => {
        currentUser = user;
        if (user) {
          console.log(`[Auth] User signed in: ${user.email} (${user.uid})`);
          const state = await workspaceService.bootstrap(user);
          if (onAuthChangeCallback) onAuthChangeCallback(user, false, state);
        } else {
          console.log('[Auth] Signed out.');
          workspaceService.reset();
          if (onAuthChangeCallback) onAuthChangeCallback(null, false);
        }
      });
    } catch (err) {
      console.error('[Firebase Init Error]:', err);
      if (onAuthChangeCallback) onAuthChangeCallback(null, false);
    }
  },

  async signIn(email, password) {
    if (isDemoMode()) return { user: null };
    const SDK = window.FirebaseSDK;
    return await SDK.signInWithEmailAndPassword(activeFirebaseAuth, email, password);
  },

  // STEP 1 of onboarding: personal account only. Workspace creation / joining is a separate step.
  async signUp(email, password, displayName) {
    if (isDemoMode()) return { user: null };
    const SDK = window.FirebaseSDK;
    const cred = await SDK.createUserWithEmailAndPassword(activeFirebaseAuth, email, password);
    currentUser = cred.user;
    await workspaceService.saveProfile(cred.user, { displayName: String(displayName || '').trim() });
    const state = await workspaceService.bootstrap(cred.user);
    return { cred, state };
  },

  async signOut() {
    if (isDemoMode()) return;
    const SDK = window.FirebaseSDK;
    await SDK.signOut(activeFirebaseAuth);
    currentUser = null;
    workspaceService.reset();
  },

  async resetPassword(email) {
    if (isDemoMode()) return;
    const SDK = window.FirebaseSDK;
    await SDK.sendPasswordResetEmail(activeFirebaseAuth, email);
  },

  getUser() {
    return currentUser;
  },

  getWorkspaceId() {
    return currentWorkspaceId;
  }
};

const workspaceService = {
  reset() {
    currentWorkspaceId = null;
    currentProfile = null;
    currentWorkspace = null;
    myWorkspaces = [];
    firestoreDataProvider.clearCache();
  },

  getProfile() { return currentProfile; },
  getCurrent() { return currentWorkspace; },
  getAll() { return myWorkspaces; },
  roleLabel(role) { return ROLE_LABELS[role] || 'Manager'; },

  async saveProfile(user, fields) {
    const SDK = window.FirebaseSDK;
    const payload = {
      email: user.email,
      ...fields,
      updatedAt: SDK.serverTimestamp()
    };
    const ref = SDK.doc(activeFirestoreDb, 'users', user.uid);
    const snap = await SDK.getDoc(ref);
    if (!snap.exists()) payload.createdAt = SDK.serverTimestamp();
    await SDK.setDoc(ref, payload, { merge: true });
    currentProfile = { ...(snap.exists() ? snap.data() : {}), ...fields, email: user.email };
  },

  // Resolve one workspace for this user. Membership is authoritative;
  // the legacy ownerUid fallback is technical and never presented as a role.
  async _resolve(user, wsId) {
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    try {
      const wsSnap = await SDK.getDoc(SDK.doc(db, 'workspaces', wsId));
      if (!wsSnap.exists()) return null;
      const ws = wsSnap.data();
      if (ws.accessModel === 'members') {
        const mSnap = await SDK.getDoc(SDK.doc(db, 'workspaces', wsId, 'members', user.uid));
        if (!mSnap.exists() || mSnap.data().status !== 'active') return null;
        return {
          id: wsId, name: ws.name || 'Workspace', role: mSnap.data().role,
          isLegacy: false, ownerUid: ws.ownerUid || null, ownerDisplayName: ws.ownerDisplayName || ''
        };
      }
      // legacy workspace: readable only if the legacy rule grants it
      return {
        id: wsId, name: ws.name || 'Workspace', role: 'manager',
        isLegacy: true, ownerUid: null, ownerDisplayName: ''
      };
    } catch (err) {
      if (err && err.code === 'permission-denied') return null;
      throw err;
    }
  },

  async bootstrap(user) {
    if (!user || isDemoMode()) return { status: 'demo' };
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    try {
      const userSnap = await SDK.getDoc(SDK.doc(db, 'users', user.uid));
      currentProfile = userSnap.exists() ? userSnap.data() : null;

      const candidateIds = [];
      const memSnap = await SDK.getDocs(SDK.collection(db, 'users', user.uid, 'memberships'));
      memSnap.forEach(d => candidateIds.push(d.id));
      const profWs = currentProfile && currentProfile.currentWorkspaceId;
      if (profWs && !candidateIds.includes(profWs)) candidateIds.push(profWs);

      const resolved = [];
      for (const id of candidateIds) {
        const r = await this._resolve(user, id);
        if (r) resolved.push(r);
      }
      myWorkspaces = resolved;

      if (!resolved.length) {
        currentWorkspace = null;
        currentWorkspaceId = null;
        firestoreDataProvider.clearCache();
        return { status: 'needsOnboarding' };
      }

      const chosen = resolved.find(w => w.id === profWs) || resolved[0];
      await this._activate(user, chosen);
      return { status: 'ready' };
    } catch (err) {
      console.error('[Workspace] Error loading workspace:', err);
      return { status: 'error' };
    }
  },

  async _activate(user, ws) {
    const SDK = window.FirebaseSDK;
    firestoreDataProvider.clearCache();
    currentWorkspace = ws;
    currentWorkspaceId = ws.id;
    if (!currentProfile || currentProfile.currentWorkspaceId !== ws.id) {
      try {
        await SDK.setDoc(SDK.doc(activeFirestoreDb, 'users', user.uid), {
          currentWorkspaceId: ws.id, updatedAt: SDK.serverTimestamp()
        }, { merge: true });
        currentProfile = { ...(currentProfile || {}), currentWorkspaceId: ws.id };
      } catch (err) {
        console.warn('[Workspace] Could not persist currentWorkspaceId:', err);
      }
    }
    await firestoreDataProvider.refreshWorkspaceCache();
  },

  async switchTo(wsId) {
    const user = currentUser;
    const target = myWorkspaces.find(w => w.id === wsId);
    if (!user || !target) throw new Error('Unknown workspace');
    const fresh = await this._resolve(user, wsId);
    if (!fresh) throw new Error('No access to workspace');
    await this._activate(user, fresh);
    return fresh;
  },

  async createWorkspace(name) {
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const user = currentUser;
    const wsName = String(name || '').trim();
    if (!user || !wsName) throw new Error('Workspace name required');
    const displayName = (currentProfile && currentProfile.displayName) || '';
    const wsId = randomCode(10, 'ws_');

    // Batch 1: workspace + Owner membership + hint + profile pointer (atomic)
    const b = SDK.writeBatch(db);
    b.set(SDK.doc(db, 'workspaces', wsId), {
      name: wsName,
      accessModel: 'members',
      ownerUid: user.uid,
      ownerDisplayName: displayName,
      createdByUid: user.uid,
      createdAt: SDK.serverTimestamp(),
      updatedAt: SDK.serverTimestamp()
    });
    b.set(SDK.doc(db, 'workspaces', wsId, 'members', user.uid), {
      uid: user.uid, role: 'owner', status: 'active',
      displayName, joinedAt: SDK.serverTimestamp(), invitedByUid: null
    });
    b.set(SDK.doc(db, 'users', user.uid, 'memberships', wsId), {
      workspaceId: wsId, workspaceName: wsName, role: 'owner', joinedAt: SDK.serverTimestamp()
    });
    b.set(SDK.doc(db, 'users', user.uid), {
      email: user.email, currentWorkspaceId: wsId, updatedAt: SDK.serverTimestamp()
    }, { merge: true });
    await b.commit();

    // Batch 2: default system event types (needs the membership to exist first)
    const b2 = SDK.writeBatch(db);
    for (const et of productionInitialEventTypes) {
      b2.set(SDK.doc(db, 'workspaces', wsId, 'eventTypes', et.id), {
        ...et, createdAt: SDK.serverTimestamp(), updatedAt: SDK.serverTimestamp()
      });
    }
    await b2.commit();

    currentProfile = { ...(currentProfile || {}), currentWorkspaceId: wsId };
    const ws = { id: wsId, name: wsName, role: 'owner', isLegacy: false, ownerUid: user.uid, ownerDisplayName: displayName };
    myWorkspaces = [...myWorkspaces.filter(w => w.id !== wsId), ws];
    await this._activate(user, ws);
    return ws;
  },

  async previewInvite(rawCode) {
    const SDK = window.FirebaseSDK;
    const code = normalizeInviteCode(rawCode);
    if (code.length < 8) return null;
    try {
      const snap = await SDK.getDoc(SDK.doc(activeFirestoreDb, 'invites', code));
      if (!snap.exists()) return null;
      const inv = snap.data();
      const exp = inv.expiresAt && inv.expiresAt.toDate ? inv.expiresAt.toDate() : null;
      if (inv.status !== 'active' || !exp || exp.getTime() <= Date.now()) return null;
      return { code, workspaceId: inv.workspaceId, workspaceName: inv.workspaceName || 'Workspace', role: inv.role };
    } catch (err) {
      return null;
    }
  },

  async joinWithInvite(rawCode) {
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const user = currentUser;
    if (!user) throw new Error('Not signed in');
    const inv = await this.previewInvite(rawCode);
    if (!inv) {
      const e = new Error('invite-invalid');
      e.code = 'invite-invalid';
      throw e;
    }
    if (myWorkspaces.some(w => w.id === inv.workspaceId)) {
      const e = new Error('already-member');
      e.code = 'already-member';
      throw e;
    }
    const raw = (await SDK.getDoc(SDK.doc(db, 'invites', inv.code))).data();
    const displayName = (currentProfile && currentProfile.displayName) || '';

    // One atomic batch: consume invite + create membership (role copied from the invite,
    // never chosen by the user; rules re-verify all of this server-side).
    const b = SDK.writeBatch(db);
    b.update(SDK.doc(db, 'invites', inv.code), {
      status: 'used', usedByUid: user.uid, usedAt: SDK.serverTimestamp()
    });
    b.set(SDK.doc(db, 'workspaces', inv.workspaceId, 'members', user.uid), {
      uid: user.uid, role: raw.role, status: 'active', displayName,
      joinedAt: SDK.serverTimestamp(), invitedByUid: raw.createdByUid, inviteId: inv.code
    });
    b.set(SDK.doc(db, 'users', user.uid, 'memberships', inv.workspaceId), {
      workspaceId: inv.workspaceId, workspaceName: inv.workspaceName, role: raw.role, joinedAt: SDK.serverTimestamp()
    });
    b.set(SDK.doc(db, 'users', user.uid), {
      email: user.email, currentWorkspaceId: inv.workspaceId, updatedAt: SDK.serverTimestamp()
    }, { merge: true });
    try {
      await b.commit();
    } catch (err) {
      // Used / revoked / expired between preview and commit
      const e = new Error('invite-invalid');
      e.code = 'invite-invalid';
      throw e;
    }

    const fresh = await this._resolve(user, inv.workspaceId);
    currentProfile = { ...(currentProfile || {}), currentWorkspaceId: inv.workspaceId };
    myWorkspaces = [...myWorkspaces.filter(w => w.id !== inv.workspaceId), fresh];
    await this._activate(user, fresh);
    return fresh;
  },

  async createManagerInvite() {
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const ws = currentWorkspace;
    if (!ws || ws.isLegacy) throw new Error('Team invites need an upgraded workspace');
    const code = randomCode(10);
    await SDK.setDoc(SDK.doc(db, 'invites', code), {
      workspaceId: ws.id,
      workspaceName: ws.name,
      role: 'manager',
      status: 'active',
      createdByUid: currentUser.uid,
      createdByName: (currentProfile && currentProfile.displayName) || '',
      createdAt: SDK.serverTimestamp(),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 864e5)
    });
    return { code, link: `${window.location.origin}/?invite=${code}`, ttlDays: INVITE_TTL_DAYS };
  },

  async listActiveInvites() {
    const SDK = window.FirebaseSDK;
    const ws = currentWorkspace;
    if (!ws || ws.isLegacy) return [];
    const snap = await SDK.getDocs(SDK.query(SDK.collection(activeFirestoreDb, 'invites'), SDK.where('workspaceId', '==', ws.id)));
    const out = [];
    snap.forEach(d => {
      const v = d.data();
      const exp = v.expiresAt && v.expiresAt.toDate ? v.expiresAt.toDate() : null;
      if (v.status === 'active' && exp && exp.getTime() > Date.now()) {
        out.push({ code: d.id, role: v.role, expiresAt: exp });
      }
    });
    return out;
  },

  async revokeInvite(code) {
    const SDK = window.FirebaseSDK;
    await SDK.updateDoc(SDK.doc(activeFirestoreDb, 'invites', code), {
      status: 'revoked', revokedByUid: currentUser.uid, revokedAt: SDK.serverTimestamp()
    });
  },

  // Team list: real members + (if no owner account is linked yet) the business owner placeholder.
  async listMembers() {
    const SDK = window.FirebaseSDK;
    const ws = currentWorkspace;
    if (!ws) return [];
    const team = [];
    if (ws.isLegacy) {
      team.push({
        uid: currentUser.uid, displayName: (currentProfile && currentProfile.displayName) || '',
        role: 'manager', status: 'active', isSelf: true
      });
      return team;
    }
    const snap = await SDK.getDocs(SDK.collection(activeFirestoreDb, 'workspaces', ws.id, 'members'));
    let hasOwner = false;
    snap.forEach(d => {
      const m = d.data();
      if (m.status !== 'active') return;
      if (m.role === 'owner') hasOwner = true;
      team.push({ uid: d.id, displayName: m.displayName || '', role: m.role, status: 'active', isSelf: d.id === currentUser.uid });
    });
    if (!hasOwner && ws.ownerDisplayName) {
      team.push({ uid: null, displayName: ws.ownerDisplayName, role: 'owner', status: 'pending', isSelf: false });
    }
    team.sort((a, b) => (a.role === 'owner' ? -1 : 1) - (b.role === 'owner' ? -1 : 1) || a.displayName.localeCompare(b.displayName));
    return team;
  },

  async removeManager(uid) {
    const SDK = window.FirebaseSDK;
    if (!currentWorkspace || currentWorkspace.role !== 'owner') throw new Error('Owner only');
    await SDK.deleteDoc(SDK.doc(activeFirestoreDb, 'workspaces', currentWorkspace.id, 'members', uid));
  },

  async updateDisplayName(name) {
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const user = currentUser;
    const dn = String(name || '').trim();
    if (!dn) throw new Error('Name required');
    await this.saveProfile(user, { displayName: dn });
    // keep member display copies in sync (members may edit only their own displayName)
    for (const w of myWorkspaces) {
      if (w.isLegacy) continue;
      try {
        await SDK.updateDoc(SDK.doc(db, 'workspaces', w.id, 'members', user.uid), {
          displayName: dn, updatedAt: SDK.serverTimestamp()
        });
      } catch (err) {
        console.warn('[Profile] Could not sync member display name for', w.id, err);
      }
    }
  }
};

const firestoreDataProvider = {
  clearCache() {
    firestoreCache.people = [];
    firestoreCache.tags = [];
    firestoreCache.clients = [];
    firestoreCache.venues = [];
    firestoreCache.eventTypes = [...defaultEventTypes];
    firestoreCache.events = [];
    firestoreCache.isLoaded = false;
  },

  async refreshWorkspaceCache() {
    if (!currentWorkspaceId || isDemoMode()) return;
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const wsId = currentWorkspaceId;

    try {
      const collections = ['people', 'tags', 'clients', 'venues', 'eventTypes', 'events'];
      for (const colName of collections) {
        const snap = await SDK.getDocs(SDK.collection(db, "workspaces", wsId, colName));
        const items = [];
        snap.forEach(docSnap => {
          const d = docSnap.data();
          items.push({ id: docSnap.id, ...d });
        });

        if (colName === 'eventTypes' && items.length === 0) {
          firestoreCache[colName] = [...productionInitialEventTypes];
        } else {
          firestoreCache[colName] = items;
        }
      }
      firestoreCache.isLoaded = true;
      console.log(`[Firestore Cache] Refreshed workspace ${wsId} data cache. (${firestoreCache.events.length} events, ${firestoreCache.people.length} singers).`);
    } catch (err) {
      console.error('[Firestore Cache] Error refreshing workspace cache:', err);
    }
  },

  async writeDoc(colName, docId, data) {
    if (isDemoMode()) return;
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const wsId = currentWorkspaceId;
    if (!wsId) throw new Error('Cannot write document: No active workspace');

    const payload = {
      ...data,
      updatedAt: SDK.serverTimestamp()
    };
    if (!data.createdAt) payload.createdAt = SDK.serverTimestamp();

    await SDK.setDoc(SDK.doc(db, "workspaces", wsId, colName, String(docId)), payload, { merge: true });
  },

  async deleteDoc(colName, docId) {
    if (isDemoMode()) return;
    const SDK = window.FirebaseSDK;
    const db = activeFirestoreDb;
    const wsId = currentWorkspaceId;
    if (!wsId) throw new Error('Cannot delete document: No active workspace');

    await SDK.deleteDoc(SDK.doc(db, "workspaces", wsId, colName, String(docId)));
  }
};

// DOMAIN SERVICES ABSTRACTION

const peopleService = {
  getAll() {
    if (isDemoMode()) return localDataProvider.getPeople();
    return firestoreCache.people;
  },
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },
  getByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return this.getAll().find(p => p.name.toLowerCase() === n) || null;
  },
  async create(data) {
    const newPerson = {
      id: generateId('p'),
      name: data.name.trim(),
      gender: data.gender || 'Female',
      tagIds: data.tagIds || ['tag_new_member'],
      active: true
    };

    if (isDemoMode()) {
      const list = localDataProvider.getPeople();
      list.push(newPerson);
      localDataProvider.setPeople(list);
      return newPerson;
    } else {
      await firestoreDataProvider.writeDoc('people', newPerson.id, newPerson);
      firestoreCache.people.push(newPerson);
      return newPerson;
    }
  },
  async update(id, data) {
    if (isDemoMode()) {
      const list = localDataProvider.getPeople();
      const p = list.find(x => x.id === id);
      if (p) {
        Object.assign(p, data);
        localDataProvider.setPeople(list);
      }
      return p;
    } else {
      const p = firestoreCache.people.find(x => x.id === id);
      if (!p) throw new Error(`Person not found: ${id}`);
      await firestoreDataProvider.writeDoc('people', id, data);
      Object.assign(p, data);
      return p;
    }
  },
  async delete(id) {
    if (isDemoMode()) {
      const list = localDataProvider.getPeople().filter(p => p.id !== id);
      localDataProvider.setPeople(list);
    } else {
      await firestoreDataProvider.deleteDoc('people', id);
      firestoreCache.people = firestoreCache.people.filter(p => p.id !== id);
    }
  }
};

const tagService = {
  getAll() {
    if (isDemoMode()) return localDataProvider.getTags();
    return firestoreCache.tags.length ? firestoreCache.tags : defaultTags;
  },
  getById(id) {
    return this.getAll().find(t => t.id === id) || null;
  },
  getByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return this.getAll().find(t => t.name.toLowerCase() === n) || null;
  },
  async create(input, groupArg = 'custom') {
    const name = (typeof input === 'string' ? input : (input && input.name) || '').trim();
    const group = (typeof input === 'object' && input.group) ? input.group : groupArg;

    const newTag = {
      id: generateId('tag_custom'),
      name,
      group,
      active: true
    };

    if (isDemoMode()) {
      const list = localDataProvider.getTags();
      list.push(newTag);
      localDataProvider.setTags(list);
      return newTag;
    } else {
      await firestoreDataProvider.writeDoc('tags', newTag.id, newTag);
      firestoreCache.tags.push(newTag);
      return newTag;
    }
  },
  async rename(id, newName) {
    const data = { name: newName.trim() };
    if (isDemoMode()) {
      const list = localDataProvider.getTags();
      const t = list.find(x => x.id === id);
      if (t) { t.name = data.name; localDataProvider.setTags(list); }
      return t;
    } else {
      const t = (firestoreCache.tags.length ? firestoreCache.tags : defaultTags).find(x => x.id === id);
      if (!t) throw new Error(`Tag not found: ${id}`);
      await firestoreDataProvider.writeDoc('tags', id, data);
      t.name = data.name;
      return t;
    }
  },
  async toggleActive(id) {
    if (isDemoMode()) {
      const list = localDataProvider.getTags();
      const t = list.find(x => x.id === id);
      if (t) { t.active = !t.active; localDataProvider.setTags(list); }
      return t;
    } else {
      const t = (firestoreCache.tags.length ? firestoreCache.tags : defaultTags).find(x => x.id === id);
      if (!t) throw new Error(`Tag not found: ${id}`);
      const nextActive = !t.active;
      await firestoreDataProvider.writeDoc('tags', id, { active: nextActive });
      t.active = nextActive;
      return t;
    }
  }
};

const clientService = {
  getAll() {
    if (isDemoMode()) return localDataProvider.getClients();
    return firestoreCache.clients;
  },
  getById(id) {
    if (!id) return null;
    return this.getAll().find(c => c.id === id) || null;
  },
  async create(data) {
    const newClient = {
      id: generateId('client'),
      name: data.name.trim(),
      contactName: data.contactName || '',
      phone: data.phone || '',
      email: data.email || '',
      notes: data.notes || '',
      active: true
    };

    if (isDemoMode()) {
      const list = localDataProvider.getClients();
      list.push(newClient);
      localDataProvider.setClients(list);
      return newClient;
    } else {
      await firestoreDataProvider.writeDoc('clients', newClient.id, newClient);
      firestoreCache.clients.push(newClient);
      return newClient;
    }
  },
  async update(id, data) {
    if (isDemoMode()) {
      const list = localDataProvider.getClients();
      const c = list.find(x => x.id === id);
      if (c) { Object.assign(c, data); localDataProvider.setClients(list); }
      return c;
    } else {
      const c = firestoreCache.clients.find(x => x.id === id);
      if (!c) throw new Error(`Client not found: ${id}`);
      await firestoreDataProvider.writeDoc('clients', id, data);
      Object.assign(c, data);
      return c;
    }
  }
};

const venueService = {
  getAll() {
    if (isDemoMode()) return localDataProvider.getVenues();
    return firestoreCache.venues;
  },
  getById(id) {
    if (!id) return null;
    return this.getAll().find(v => v.id === id) || null;
  },
  async create(data) {
    const newVenue = {
      id: generateId('venue'),
      name: data.name.trim(),
      city: data.city || 'Chennai',
      state: data.state || 'Tamil Nadu',
      active: true
    };

    if (isDemoMode()) {
      const list = localDataProvider.getVenues();
      list.push(newVenue);
      localDataProvider.setVenues(list);
      return newVenue;
    } else {
      await firestoreDataProvider.writeDoc('venues', newVenue.id, newVenue);
      firestoreCache.venues.push(newVenue);
      return newVenue;
    }
  },
  async update(id, data) {
    if (isDemoMode()) {
      const list = localDataProvider.getVenues();
      const v = list.find(x => x.id === id);
      if (v) { Object.assign(v, data); localDataProvider.setVenues(list); }
      return v;
    } else {
      const v = firestoreCache.venues.find(x => x.id === id);
      if (!v) throw new Error(`Venue not found: ${id}`);
      await firestoreDataProvider.writeDoc('venues', id, data);
      Object.assign(v, data);
      return v;
    }
  }
};

const eventTypeService = {
  getAll() {
    const list = isDemoMode()
      ? localDataProvider.getEventTypes()
      : (firestoreCache.eventTypes.length ? firestoreCache.eventTypes : productionInitialEventTypes);
    return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
  getActive() {
    return this.getAll().filter(t => t.active !== false && !t.isProtected);
  },
  getById(id) {
    if (!id) return this.getAll().find(t => t.isProtected) || this.getAll()[0];
    const found = this.getAll().find(t => t.id === id);
    if (found) return found;
    return this.getAll().find(t => t.isProtected) || { id, name: 'Unspecified', active: true };
  },
  getUsageCount(id) {
    const allEvents = eventService.getAll();
    return allEvents.filter(e => e.eventTypeId === id).length;
  },
  async create(input) {
    const name = (typeof input === 'string' ? input : (input && input.name) || '').trim();
    if (!name) throw new Error('Event Type name is required');
    
    // Case-insensitive duplicate check
    const existing = this.getAll().find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      throw new Error(`An Event Type named "${existing.name}" already exists.`);
    }

    const maxSort = Math.max(...this.getAll().map(t => t.sortOrder || 0), 0);
    const newEventType = {
      id: generateId('event_type'),
      name: name,
      active: true,
      sortOrder: maxSort + 1
    };

    if (isDemoMode()) {
      const list = localDataProvider.getEventTypes();
      list.push(newEventType);
      localDataProvider.setEventTypes(list);
      return newEventType;
    } else {
      await firestoreDataProvider.writeDoc('eventTypes', newEventType.id, newEventType);
      firestoreCache.eventTypes.push(newEventType);
      return newEventType;
    }
  },
  async update(id, data) {
    if (isDemoMode()) {
      const list = localDataProvider.getEventTypes();
      const t = list.find(x => x.id === id);
      if (t) {
        Object.assign(t, data);
        localDataProvider.setEventTypes(list);
      }
      return t;
    } else {
      const t = firestoreCache.eventTypes.find(x => x.id === id);
      if (!t) throw new Error(`Event Type not found: ${id}`);
      await firestoreDataProvider.writeDoc('eventTypes', id, data);
      Object.assign(t, data);
      return t;
    }
  },
  async rename(id, newName) {
    const cleanName = (newName || '').trim();
    if (!cleanName) throw new Error('New Event Type name is required');
    const existing = this.getAll().find(t => t.id !== id && t.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      throw new Error(`An Event Type named "${existing.name}" already exists.`);
    }
    return await this.update(id, { name: cleanName });
  },
  async setActive(id, active) {
    return await this.update(id, { active: Boolean(active) });
  },
  async delete(id) {
    const usageCount = this.getUsageCount(id);
    if (usageCount > 0) {
      throw new Error(`Cannot delete Event Type that is referenced by ${usageCount} event(s). Please merge events first.`);
    }

    if (isDemoMode()) {
      const list = localDataProvider.getEventTypes().filter(t => t.id !== id);
      localDataProvider.setEventTypes(list);
    } else {
      await firestoreDataProvider.deleteDoc('eventTypes', id);
      firestoreCache.eventTypes = firestoreCache.eventTypes.filter(t => t.id !== id);
    }
  },
  async mergeInto(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
      throw new Error('Invalid merge parameters');
    }
    const targetType = this.getById(targetId);
    if (!targetType) throw new Error('Target Event Type does not exist');

    const affectedEvents = eventService.getAll().filter(e => e.eventTypeId === sourceId);

    // Update all events referencing sourceId to targetId
    for (const evt of affectedEvents) {
      await eventService.update(evt.id, { eventTypeId: targetId });
    }

    // Now safely delete the source event type
    if (isDemoMode()) {
      const list = localDataProvider.getEventTypes().filter(t => t.id !== sourceId);
      localDataProvider.setEventTypes(list);
    } else {
      await firestoreDataProvider.deleteDoc('eventTypes', sourceId);
      firestoreCache.eventTypes = firestoreCache.eventTypes.filter(t => t.id !== sourceId);
    }
    return true;
  }
};

const eventService = {
  getAll() {
    if (isDemoMode()) return localDataProvider.getEvents();
    return firestoreCache.events;
  },
  getById(id) {
    return this.getAll().find(e => String(e.id) === String(id)) || null;
  },
  async create(data) {
    const newEvent = {
      id: data.id || generateId('evt'),
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
      isDemoFixture: isDemoMode() ? (data.isDemoFixture || false) : false
    };

    if (isDemoMode()) {
      const list = localDataProvider.getEvents();
      list.push(newEvent);
      localDataProvider.setEvents(list);
      return newEvent;
    } else {
      await firestoreDataProvider.writeDoc('events', String(newEvent.id), newEvent);
      firestoreCache.events.push(newEvent);
      return newEvent;
    }
  },
  async update(id, data) {
    if (isDemoMode()) {
      const list = localDataProvider.getEvents();
      const e = list.find(x => String(x.id) === String(id));
      if (e) { Object.assign(e, data); localDataProvider.setEvents(list); }
      return e;
    } else {
      const e = firestoreCache.events.find(x => String(x.id) === String(id));
      if (!e) throw new Error(`Event not found: ${id}`);
      await firestoreDataProvider.writeDoc('events', String(id), data);
      Object.assign(e, data);
      return e;
    }
  },
  async delete(id) {
    if (isDemoMode()) {
      const list = localDataProvider.getEvents().filter(e => String(e.id) !== String(id));
      localDataProvider.setEvents(list);
    } else {
      await firestoreDataProvider.deleteDoc('events', String(id));
      firestoreCache.events = firestoreCache.events.filter(e => String(e.id) !== String(id));
    }
  },
  async duplicate(id, newDate, copyLineup = false) {
    const orig = this.getById(id);
    if (!orig) return null;

    const newAssignedSingers = copyLineup ? (orig.assignedSingers || []).map(s => ({
      personId: s.personId,
      status: 'Not asked'
    })) : [];

    return await this.create({
      status: 'enquiry',
      name: orig.name ? `${orig.name} (Copy)` : 'Untitled Show (Copy)',
      eventTypeId: orig.eventTypeId,
      date: newDate,
      time: orig.time || '',
      clientId: orig.clientId || null,
      venueId: orig.venueId || null,
      city: orig.city || '',
      state: orig.state || '',
      singersCount: orig.singersCount || 8,
      budget: orig.budget || 0,
      language: orig.language || '',
      notes: orig.notes || '',
      managers: [],
      assignedSingers: newAssignedSingers,
      isDemoFixture: false
    });
  },
  async copyLineup(targetEventId, sourceEventId) {
    const target = this.getById(targetEventId);
    const source = this.getById(sourceEventId);
    if (!target || !source) return null;

    const copiedSingers = (source.assignedSingers || []).map(s => ({
      personId: s.personId,
      status: 'Not asked'
    }));

    const existingPersonIds = new Set((target.assignedSingers || []).map(s => s.personId));
    const merged = [...(target.assignedSingers || [])];
    copiedSingers.forEach(s => {
      if (!existingPersonIds.has(s.personId)) {
        merged.push(s);
      }
    });

    return await this.update(targetEventId, { assignedSingers: merged });
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

// Global Browser Exports
window.authService = authService;
window.firestoreDataProvider = firestoreDataProvider;
window.localDataProvider = localDataProvider;
window.peopleService = peopleService;
window.tagService = tagService;
window.clientService = clientService;
window.venueService = venueService;
window.eventTypeService = eventTypeService;
window.eventService = eventService;
window.cityService = cityService;
window.getSingerHistory = getSingerHistory;
window.getPersonById = getPersonById;
window.getClientById = getClientById;
window.getVenueById = getVenueById;
window.getEventTypeById = getEventTypeById;
window.productionInitialEventTypes = productionInitialEventTypes;

