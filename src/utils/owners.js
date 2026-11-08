// Utility for managing Vehicle Owners (Proprietari Vetture) with Supabase Cloud Sync
import { fetchOwnersFromSupabase, syncOwnersToSupabase } from './supabase';

const OWNERS_STORAGE_KEY = 'book_auto_pb_owners_v1';

export const DEFAULT_OWNERS = [
  'Shirantha',
  'Luciano',
  'Lorenzo',
  'Aziendale',
  'Collezione PB'
];

/**
 * Normalizes owner string: trims whitespace and collapses multiple spaces
 */
export function normalizeOwner(owner) {
  if (!owner || typeof owner !== 'string') return '';
  return owner.trim().replace(/\s+/g, ' ');
}

/**
 * Deduplicates an array of owner strings case-insensitively while preserving formatting
 */
export function dedupeOwners(list) {
  if (!Array.isArray(list)) return [];
  const map = new Map();
  list.forEach(item => {
    const norm = normalizeOwner(item);
    if (norm && !map.has(norm.toLowerCase())) {
      map.set(norm.toLowerCase(), norm);
    }
  });
  return Array.from(map.values());
}

/**
 * Retrieves the list of owners, combining stored owners and any owners present in existing cars
 */
export function getOwners(cars = []) {
  let list = [];
  const saved = localStorage.getItem(OWNERS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (e) {
      console.error('Error parsing owners storage:', e);
    }
  }

  if (list.length === 0) {
    list = [...DEFAULT_OWNERS];
  }

  // Also include any owner present in cars
  if (Array.isArray(cars) && cars.length > 0) {
    cars.forEach(c => {
      const o = normalizeOwner(c.proprietario || c.owner);
      if (o) list.push(o);
    });
  }

  const deduped = dedupeOwners(list);
  return deduped.length > 0 ? deduped : DEFAULT_OWNERS;
}

export function saveOwners(owners) {
  if (!Array.isArray(owners)) return;
  const deduped = dedupeOwners(owners);
  localStorage.setItem(OWNERS_STORAGE_KEY, JSON.stringify(deduped));
  syncOwnersToSupabase(deduped).catch(err => {
    console.warn('Background syncOwnersToSupabase error:', err);
  });
}

export async function syncOwnersWithCloud() {
  try {
    const remote = await fetchOwnersFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      const deduped = dedupeOwners(remote);
      localStorage.setItem(OWNERS_STORAGE_KEY, JSON.stringify(deduped));
      return deduped;
    } else {
      const current = getOwners();
      await syncOwnersToSupabase(current);
      return current;
    }
  } catch (e) {
    console.warn('Failed syncing owners with cloud:', e);
  }
  return getOwners();
}

export function addOwner(newOwner) {
  const clean = normalizeOwner(newOwner);
  if (!clean) return getOwners();
  const current = getOwners();
  const exists = current.some(o => o.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    const updated = dedupeOwners([...current, clean]);
    saveOwners(updated);
    return updated;
  }
  return current;
}

export function removeOwner(ownerToRemove) {
  const normTarget = normalizeOwner(ownerToRemove).toLowerCase();
  const current = getOwners();
  const updated = current.filter(o => normalizeOwner(o).toLowerCase() !== normTarget);
  saveOwners(updated);
  return updated;
}

export function renameOwner(oldName, newName) {
  const cleanOld = normalizeOwner(oldName).toLowerCase();
  const cleanNew = normalizeOwner(newName);
  if (!cleanOld || !cleanNew) return getOwners();
  const current = getOwners();
  const updated = dedupeOwners(
    current.map(o => normalizeOwner(o).toLowerCase() === cleanOld ? cleanNew : o)
  );
  saveOwners(updated);
  return updated;
}
