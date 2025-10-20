// utils/storage.ts

const KEY_PREFIX = 'TROUPRIVE_';
const SCHEMA_VERSION = 1;

type Wrapped<T> = {
  schemaVersion: number;
  payload: T;
};

function jsonReplacer(_key: string, value: any): any {
  if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
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
    if (!raw) {
        // Check for legacy unwrapped key
        const legacyRaw = localStorage.getItem(key);
        if (legacyRaw) {
            console.warn(`Found legacy data for key "${key}". Migrating to new format.`);
            try {
                const legacyParsed = JSON.parse(legacyRaw);
                set<T>(key, legacyParsed as T);
                localStorage.removeItem(key); // Clean up old key
                return legacyParsed as T;
            } catch (e) {
                console.error(`Error parsing legacy key "${key}", removing corrupt data:`, e);
                localStorage.removeItem(key);
                return defaultValue;
            }
        }
        return defaultValue;
    }

    const parsed = JSON.parse(raw);
    
    // Handle new wrapped format
    if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'schemaVersion' in parsed) {
      // Future-proof: Place for schema migration logic if needed
      // if (parsed.schemaVersion < SCHEMA_VERSION) { /* ... migrate parsed.payload ... */ }
      return (parsed as Wrapped<T>).payload;
    }
    
    // Handle legacy format found under new prefixed key (should be rare)
    if (parsed) {
        console.warn(`Found unwrapped data for key "${KEY_PREFIX + key}". Migrating to wrapped format.`);
        set<T>(key, parsed as T);
        return parsed as T;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}


export function remove(key: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
    // Also remove potential legacy key
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
