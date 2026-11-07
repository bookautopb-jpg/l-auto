// Authentication & Multi-User Management system with 3 Role Categories & Realtime Cloud Sync
import {
  fetchUsersFromSupabase,
  syncUsersToSupabase,
  fetchBackgroundsFromSupabase,
  syncBackgroundsToSupabase
} from './supabase.js';
import { saveUsersToIndexedDB, getUsersFromIndexedDB } from './storage.js';

const USERS_STORAGE_KEY = 'book_auto_pb_users_v2';
const BACKGROUNDS_STORAGE_KEY = 'book_auto_pb_bg_images_v1';

// Central DreamHost Server API endpoint for multi-device sync
const DREAMHOST_API_USERS = 'https://nisshi.dreamhosters.com/api/users.php';
function getUsersApiUrl() {
  if (typeof window === 'undefined') return DREAMHOST_API_USERS;
  if (window.location.hostname.includes('dreamhosters.com') || window.location.hostname.includes('nisshi')) {
    return './api/users.php';
  }
  return DREAMHOST_API_USERS;
}

let memoryUsersCache = null;

export const USER_ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin (Proprietario)',
    desc: 'Accesso completo: gestione vetture, utenti, sfondi, backup e eliminazioni.',
    color: 'amber'
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin (Amministratore)',
    desc: 'Accesso amministrativo alle vetture, dati riservati, telaio VIN e scadenze.',
    color: 'amber'
  },
  EDITOR: {
    id: 'editor',
    name: 'Gestore / Editor',
    desc: 'Può aggiungere e modificare vetture, foto e registro manutenzione.',
    color: 'emerald'
  },
  VIEWER: {
    id: 'viewer',
    name: 'Visualizzatore / Cliente',
    desc: 'Accesso in sola lettura al catalogo, schede vetture e stampa PDF.',
    color: 'sky'
  }
};

export const DEFAULT_BACKGROUNDS = [
  "./images/military_camo_bg.jpg",
  "./images/bg_1.jpg",
  "./images/bg_2.jpg",
  "./images/bg_3.jpg",
  "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80"
];

export const INITIAL_USERS = [
  {
    "id": "user_shirantha",
    "username": "shirantha",
    "password": "Maduka0822",
    "name": "Shirantha",
    "role": "super_admin",
    "createdAt": "2026-10-03T20:03:13.022Z"
  },
  {
    "id": "user_1791310116076",
    "username": "luciano",
    "password": "1234",
    "name": "Luciano",
    "role": "editor",
    "createdAt": "2026-10-06T18:08:36.076Z"
  }
];

export function getUsers() {
  if (Array.isArray(memoryUsersCache) && memoryUsersCache.length > 0) {
    return memoryUsersCache;
  }
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return memoryUsersCache || INITIAL_USERS;
  }
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsersCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing users storage:', e);
  }

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  } catch (e) {}
  memoryUsersCache = INITIAL_USERS;
  return INITIAL_USERS;
}

export function saveUsers(users) {
  if (!Array.isArray(users)) return;
  memoryUsersCache = users;

  // 1. Safe LocalStorage save with quota exceeded fallback
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('LocalStorage quota exceeded on saveUsers, clearing non-critical caches:', err);
    try {
      localStorage.removeItem('book_auto_pb_cars_v2_light');
      localStorage.removeItem('book_auto_pb_emailed_milestones');
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (retryErr) {
      console.warn('Could not save users to localStorage:', retryErr);
    }
  }

  // 2. Persistent IndexedDB save (unlimited capacity)
  saveUsersToIndexedDB(users).catch(err => {
    console.warn('IndexedDB save users error:', err);
  });

  // 3. Centralized DreamHost Server API Sync (Multi-Device)
  try {
    const apiUrl = getUsersApiUrl();
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    }).catch(err => {
      console.warn('DreamHost server users sync error:', err);
    });
  } catch (e) {
    console.warn('DreamHost API sync exception:', e);
  }

  // 4. Synchronize to Supabase Cloud if enabled
  syncUsersToSupabase(users).catch(err => {
    console.warn('Background syncUsersToSupabase error:', err);
  });
}

// Sync users between Central DreamHost Server, Supabase Cloud and local storage
export async function syncUsersWithCloud() {
  // 1. Central DreamHost Server API (Highest priority for multi-device sync)
  try {
    const apiUrl = getUsersApiUrl();
    const res = await fetch(`${apiUrl}?t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const serverUsers = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        memoryUsersCache = serverUsers;
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(serverUsers));
        } catch (e) {}
        saveUsersToIndexedDB(serverUsers).catch(() => {});
        return serverUsers;
      }
    }
  } catch (serverErr) {
    console.warn('DreamHost users API fetch error:', serverErr);
  }

  // 2. Supabase Cloud if configured
  try {
    const remoteUsers = await fetchUsersFromSupabase();
    if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
      memoryUsersCache = remoteUsers;
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(remoteUsers));
      } catch (e) {}
      saveUsersToIndexedDB(remoteUsers).catch(() => {});
      return remoteUsers;
    }
  } catch (e) {
    console.warn('Failed syncing users with cloud:', e);
  }

  // 3. Fallback to IndexedDB
  try {
    const idbUsers = await getUsersFromIndexedDB();
    if (Array.isArray(idbUsers) && idbUsers.length > 0) {
      memoryUsersCache = idbUsers;
      return idbUsers;
    }
  } catch (e) {}

  return getUsers();
}

/**
 * Mobile-friendly & flexible authentication matching:
 * - Trims hidden spaces from mobile keyboards
 * - Allows login by username, email, or full name!
 * - Exact password match + tolerant case-insensitive fallback (e.g. mobile auto-capitalized password)
 */
export function authenticateUserWithList(identifier, password, usersList) {
  if (!Array.isArray(usersList)) return null;
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId || !cleanPass) return null;

  const isMatch = (u, passCandidate) => {
    if (!u) return false;
    const uUsername = (u.username || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uName = (u.name || '').trim().toLowerCase();

    // Check if identifier matches username, email, or name
    const idMatches = (uUsername === cleanId) ||
                      (uEmail && uEmail === cleanId) ||
                      (uName && uName === cleanId);

    if (!idMatches) return false;

    // Check exact password
    if (u.password === passCandidate) return true;
    // Check case-insensitive password (mobile keyboard auto-capitalized first char)
    if ((u.password || '').toLowerCase() === passCandidate.toLowerCase()) return true;
    return false;
  };

  // 1. Exact pass check
  const exact = usersList.find(u => isMatch(u, cleanPass));
  if (exact) return exact;

  // 2. Raw un-trimmed pass fallback in case password contains deliberate spaces
  const rawPass = (password || '');
  if (rawPass !== cleanPass) {
    const rawMatch = usersList.find(u => isMatch(u, rawPass));
    if (rawMatch) return rawMatch;
  }

  return null;
}

export function authenticateUser(identifier, password) {
  const users = getUsers();
  return authenticateUserWithList(identifier, password, users);
}

// Asynchronous authentication: checks local storage first, then checks IndexedDB and DreamHost Server API
export async function authenticateUserAsync(identifier, password) {
  // 1. Fast local check (localStorage)
  const localMatch = authenticateUser(identifier, password);
  if (localMatch) return localMatch;

  // 2. Check IndexedDB
  try {
    const idbUsers = await getUsersFromIndexedDB();
    if (Array.isArray(idbUsers) && idbUsers.length > 0) {
      const idbMatch = authenticateUserWithList(identifier, password, idbUsers);
      if (idbMatch) return idbMatch;
    }
  } catch (e) {}

  // 3. Fallback: fetch freshest users from DreamHost Central Server API
  try {
    const serverUsers = await syncUsersWithCloud();
    if (Array.isArray(serverUsers) && serverUsers.length > 0) {
      const serverMatch = authenticateUserWithList(identifier, password, serverUsers);
      if (serverMatch) return serverMatch;
    }
  } catch (e) {
    console.warn('authenticateUserAsync cloud fetch error:', e);
  }

  return null;
}

export function getBackgroundImages() {
  const saved = localStorage.getItem(BACKGROUNDS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing background storage:', e);
    }
  }
  localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(DEFAULT_BACKGROUNDS));
  return DEFAULT_BACKGROUNDS;
}

export function saveBackgroundImages(bgList) {
  if (!Array.isArray(bgList)) return;
  localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(bgList));
  syncBackgroundsToSupabase(bgList).catch(err => {
    console.warn('Background syncBackgroundsToSupabase error:', err);
  });
}

export async function syncBackgroundsWithCloud() {
  try {
    const remote = await fetchBackgroundsFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      localStorage.setItem(BACKGROUNDS_STORAGE_KEY, JSON.stringify(remote));
      return remote;
    } else {
      const current = getBackgroundImages();
      await syncBackgroundsToSupabase(current);
      return current;
    }
  } catch (e) {
    console.warn('Failed syncing backgrounds with cloud:', e);
  }
  return getBackgroundImages();
}

const CURRENT_USER_KEY = 'book_auto_pb_current_user_v2';
const LEGACY_USER_KEY = 'book_auto_pb_current_user_v1';

// Immediately purge any stale auto-saved admin sessions from previous versions
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_USER_KEY);
    sessionStorage.removeItem(LEGACY_USER_KEY);
  }
} catch (e) {}

export function getCurrentUser() {
  try {
    const saved = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.username) return parsed;
    }
  } catch (e) {
    console.error('Error parsing current user session:', e);
  }

  // Never auto-login in localhost or anywhere else! Always require valid credentials.
  return null;
}

export function setCurrentUser(user, rememberMe = false) {
  if (!user) {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      sessionStorage.removeItem(LEGACY_USER_KEY);
    } catch (e) {}
  } else {
    try {
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch(e) {}
  }
}

export function logoutUser() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    sessionStorage.removeItem(LEGACY_USER_KEY);
  } catch (e) {}
}

// -------------------------------------------------------------
// CREDENTIAL RECOVERY & MASTER PIN (OPTION 2 + OPTION 3)
// -------------------------------------------------------------

export const DEFAULT_MASTER_PIN = '0822';
const MASTER_PIN_STORAGE_KEY = 'book_auto_pb_master_pin_v1';

/**
 * Returns current master security PIN (Option 3 emergency unlock)
 */
export function getMasterRecoveryPin() {
  try {
    const saved = localStorage.getItem(MASTER_PIN_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return DEFAULT_MASTER_PIN;
}

/**
 * Sets new master security PIN (saved by Super Admin in settings)
 */
export function setMasterRecoveryPin(newPin) {
  const clean = (newPin || '').trim();
  if (clean) {
    localStorage.setItem(MASTER_PIN_STORAGE_KEY, clean);
    return clean;
  }
  return DEFAULT_MASTER_PIN;
}

/**
 * Validates whether entered PIN matches the master recovery PIN
 * Automatically accepts the configured PIN, plus factory master PINs (0822 and 8822)
 */
export function verifyMasterPin(inputPin) {
  const clean = (inputPin || '').trim();
  if (!clean) return false;
  const savedPin = getMasterRecoveryPin();
  return clean === savedPin || clean === '0822' || clean === '8822';
}

export const ADMIN_RECOVERY_EMAIL_KEY = 'book_auto_pb_admin_recovery_email';

/**
 * Returns current recovery email for Super Admin (OTP codes)
 */
export function getAdminRecoveryEmail() {
  try {
    const saved = localStorage.getItem(ADMIN_RECOVERY_EMAIL_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}

  // Fallback 1: check super_admin user email
  const users = getUsers();
  const superAdmin = users.find(u => u.role === 'super_admin');
  if (superAdmin && superAdmin.email && superAdmin.email.trim()) {
    return superAdmin.email.trim();
  }

  // Fallback 2: check book_auto_pb_admin_email
  try {
    const legacy = localStorage.getItem('book_auto_pb_admin_email');
    if (legacy && legacy.trim()) return legacy.trim();
  } catch (e) {}

  return '';
}

/**
 * Sets new recovery email for Super Admin (OTP codes)
 * Also updates the super_admin user in the database so matching by email works
 */
export function setAdminRecoveryEmail(newEmail) {
  const clean = (newEmail || '').trim();
  try {
    if (clean) {
      localStorage.setItem(ADMIN_RECOVERY_EMAIL_KEY, clean);
      localStorage.setItem('book_auto_pb_admin_email', clean);
    } else {
      localStorage.removeItem(ADMIN_RECOVERY_EMAIL_KEY);
    }
  } catch (e) {}

  // Also update email on super_admin user in users list
  const users = getUsers();
  let changed = false;
  const updatedUsers = users.map(u => {
    if (u.role === 'super_admin') {
      changed = true;
      return { ...u, email: clean, updatedAt: new Date().toISOString() };
    }
    return u;
  });

  if (changed) {
    saveUsers(updatedUsers);
  }

  return clean;
}

/**
 * Finds user for recovery by username, email, or admin email
 */
export function findUserForRecovery(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const users = getUsers();
  const recoveryEmail = getAdminRecoveryEmail().toLowerCase();
  let adminEmail = '';
  try {
    adminEmail = (localStorage.getItem('book_auto_pb_admin_email') || '').trim().toLowerCase();
  } catch (e) {}

  // 1. Direct username match
  let match = users.find(u => (u.username || '').toLowerCase() === clean);
  if (match) return match;

  // 2. Direct user email match
  match = users.find(u => u.email && u.email.toLowerCase() === clean);
  if (match) return match;

  // 3. Admin recovery email match -> resolves to super_admin account
  if (recoveryEmail && clean === recoveryEmail) {
    match = users.find(u => u.role === 'super_admin');
    if (match) return match;
  }

  // 4. Admin email match -> resolves to super_admin account
  if (adminEmail && clean === adminEmail) {
    match = users.find(u => u.role === 'super_admin');
    if (match) return match;
  }

  return null;
}

/**
 * Updates a user's password directly (used after OTP or Master PIN verification)
 */
export function updateUserPassword(userIdentifier, newPassword) {
  if (!userIdentifier || !newPassword) {
    return { success: false, reason: 'Dati incompleti per aggiornare la password.' };
  }
  const cleanPass = newPassword.trim();
  const cleanId = userIdentifier.trim().toLowerCase();
  const users = getUsers();

  const idx = users.findIndex(u =>
    u.id === userIdentifier ||
    (u.username || '').toLowerCase() === cleanId ||
    (u.email && u.email.toLowerCase() === cleanId)
  );

  if (idx === -1) {
    return { success: false, reason: 'Utente non trovato nel sistema.' };
  }

  users[idx] = {
    ...users[idx],
    password: cleanPass,
    updatedAt: new Date().toISOString()
  };

  saveUsers(users);
  return { success: true, user: users[idx] };
}
