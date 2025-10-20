// utils/storage.ts

const KEY_PREFIX = 'TROUPRIVE_';
const SCHEMA_VERSION = 1;

type Wrapped<T> = {
  schemaVersion: number;
  payload: T;
};

function jsonReplacer(_key: string, value: any): any {
  if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
    console.warn(`[Storage] Non-serializable number: ${value}. Replacing with null.`);
    return null;
  }
  if (typeof value === 'bigint') return value.toString();

  // Drop functions/symbols/undefined inside objects/arrays
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === undefined) return null;

  try {
    JSON.stringify(value);
    return value;
  } catch {
    console.warn('[Storage] Value not JSON-serializable. Replacing with null.');
    return null;
  }
}

export function set<T>(key: string, payload: T): boolean {
  try {
    const wrapped: Wrapped<T> = { schemaVersion: SCHEMA_VERSION, payload };
    const str = JSON.stringify(wrapped, jsonReplacer);
    localStorage.setItem(KEY_PREFIX + key, str);
    return true;
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError') {
      alert('Your browser storage is full. Please free up space and try again.');
    }
    console.error(`Error writing localStorage key "${key}":`, err);
    return false;
  }
}

export function get<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (raw == null) return defaultValue;

    // Try to parse as a wrapped object first
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'payload' in parsed &&
      'schemaVersion' in parsed
    ) {
      // Optional place to migrate parsed.schemaVersion -> SCHEMA_VERSION
      return (parsed as Wrapped<T>).payload;
    }

    // Fallback: support legacy unwrapped payloads
    return parsed as T;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // Last resort: try to parse legacy raw without prefix (very old builds)
    try {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw != null) {
        const legacyParsed = JSON.parse(legacyRaw);
        // Immediately migrate it into the wrapped form under the new key
        set<T>(key, legacyParsed as T);
        // Clean up legacy key to avoid future confusion
        localStorage.removeItem(key);
        return legacyParsed as T;
      }
    } catch (e) {
      console.error(`Error reading legacy key "${key}":`, e);
    }
    return defaultValue;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
