
const KEY_PREFIX = 'TROUPRIVE_';
const SCHEMA_VERSION = 1;

/**
 * Custom replacer for JSON.stringify to handle non-serializable values
 * that can corrupt the save data or cause silent failures.
 * @param key The key of the property being stringified.
 * @param value The value of the property.
 * @returns A sanitized value or the original value.
 */
function jsonReplacer(key: string, value: any): any {
    // Correctly handle NaN and Infinity, which stringify to null and can cause data loss
    if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
        console.warn(`[Storage] Non-serializable number found for key "${key}": ${value}. Replacing with null.`);
        return null;
    }
    // Handle BigInt which throws an error during stringification
    if (typeof value === 'bigint') {
        console.warn(`[Storage] BigInt found for key "${key}". Converting to string.`);
        return value.toString();
    }
    return value;
}


export function set<T>(key: string, value: T): boolean {
  try {
    const data = {
        schemaVersion: SCHEMA_VERSION,
        payload: value
    }
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(data, jsonReplacer));
    return true;
  } catch (error) {
    console.error(`CRITICAL ERROR: Failed to save to localStorage for key "${key}":`, error);
    // This alert is crucial to prevent users from unknowingly losing data.
    alert('CRITICAL ERROR: Could not save application data. Your recent changes will be lost if you refresh or close the app. Please export your data from the Profile page as a backup and check the developer console for more information.');
    return false;
  }
}

export function get<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(KEY_PREFIX + key);
    if (item === null) {
      return defaultValue;
    }
    const data = JSON.parse(item);
    // Here you could add migration logic if data.schemaVersion !== SCHEMA_VERSION
    return data.payload as T;
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

export function remove(key: string): void {
    try {
        localStorage.removeItem(KEY_PREFIX + key);
    } catch (error) {
        console.error(`Error removing from localStorage for key "${key}":`, error);
    }
}