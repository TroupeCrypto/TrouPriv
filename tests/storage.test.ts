import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get, set, remove } from '../utils/storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('set function', () => {
    it('should save data with wrapped format', () => {
      const testData = { name: 'Test', value: 123 };
      const result = set('testKey', testData);
      
      expect(result).toBe(true);
      const stored = localStorage.getItem('TROUPRIVE_testKey');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveProperty('schemaVersion');
      expect(parsed).toHaveProperty('payload');
      expect(parsed.payload).toEqual(testData);
    });

    it('should handle primitive values', () => {
      set('stringKey', 'test string');
      set('numberKey', 42);
      set('boolKey', true);
      
      expect(get('stringKey', '')).toBe('test string');
      expect(get('numberKey', 0)).toBe(42);
      expect(get('boolKey', false)).toBe(true);
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3, 'test', { nested: true }];
      set('arrayKey', testArray);
      
      expect(get('arrayKey', [])).toEqual(testArray);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: { name: 'John', age: 30 },
        items: [{ id: 1, value: 'a' }, { id: 2, value: 'b' }],
        metadata: { created: Date.now(), active: true }
      };
      
      set('complexKey', complexData);
      expect(get('complexKey', {})).toEqual(complexData);
    });

    it('should replace unsafe values with null', () => {
      const dataWithUnsafe = {
        normal: 'value',
        infinity: Infinity,
        nan: NaN,
        func: () => 'test'
      };
      
      set('unsafeKey', dataWithUnsafe);
      const retrieved = get('unsafeKey', {});
      
      expect(retrieved).toHaveProperty('normal', 'value');
      expect(retrieved).toHaveProperty('infinity', null);
      expect(retrieved).toHaveProperty('nan', null);
      // Functions are dropped in JSON serialization
      expect(retrieved).not.toHaveProperty('func');
    });

    it('should handle quota exceeded error', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      const result = set('testKey', { data: 'test' });
      
      expect(result).toBe(false);
      expect(alertSpy).toHaveBeenCalledWith('Your browser storage is full. Please free up space and try again.');
      
      // Restore
      Storage.prototype.setItem = originalSetItem;
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('get function', () => {
    it('should retrieve data with correct type', () => {
      const testData = { items: [1, 2, 3], name: 'Test' };
      set('testKey', testData);
      
      const retrieved = get('testKey', {});
      expect(retrieved).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { default: true };
      const result = get('nonExistentKey', defaultValue);
      
      expect(result).toEqual(defaultValue);
    });

    it('should handle legacy unwrapped data and migrate it', () => {
      // Simulate legacy data (without wrapping)
      const legacyData = { legacy: true, value: 123 };
      localStorage.setItem('legacyKey', JSON.stringify(legacyData));
      
      const retrieved = get('legacyKey', {});
      
      expect(retrieved).toEqual(legacyData);
      // Check that it was migrated to new format
      const stored = localStorage.getItem('TROUPRIVE_legacyKey');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveProperty('schemaVersion');
      expect(parsed.payload).toEqual(legacyData);
    });

    it('should handle unwrapped data under prefixed key', () => {
      const unwrappedData = { unwrapped: true };
      localStorage.setItem('TROUPRIVE_unwrappedKey', JSON.stringify(unwrappedData));
      
      const retrieved = get('unwrappedKey', {});
      
      expect(retrieved).toEqual(unwrappedData);
    });

    it('should handle corrupt legacy data gracefully', () => {
      localStorage.setItem('corruptKey', 'invalid json {]');
      
      const defaultValue = { default: 'value' };
      const result = get('corruptKey', defaultValue);
      
      expect(result).toEqual(defaultValue);
      // Corrupt data should be removed
      expect(localStorage.getItem('corruptKey')).toBeNull();
    });

    it('should handle corrupt wrapped data gracefully', () => {
      localStorage.setItem('TROUPRIVE_corruptKey', 'invalid json {]');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const defaultValue = { default: 'value' };
      const result = get('corruptKey', defaultValue);
      
      expect(result).toEqual(defaultValue);
      consoleSpy.mockRestore();
    });
  });

  describe('remove function', () => {
    it('should remove data from localStorage', () => {
      set('testKey', { data: 'test' });
      expect(localStorage.getItem('TROUPRIVE_testKey')).toBeTruthy();
      
      remove('testKey');
      
      expect(localStorage.getItem('TROUPRIVE_testKey')).toBeNull();
    });

    it('should remove both prefixed and legacy keys', () => {
      localStorage.setItem('TROUPRIVE_testKey', 'prefixed');
      localStorage.setItem('testKey', 'legacy');
      
      remove('testKey');
      
      expect(localStorage.getItem('TROUPRIVE_testKey')).toBeNull();
      expect(localStorage.getItem('testKey')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock to throw error
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('Remove error');
      });
      
      remove('testKey');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      Storage.prototype.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Data persistence across operations', () => {
    it('should persist vault items across multiple operations', () => {
      const vaultItems = [
        { id: '1', name: 'Secret 1', type: 'secret', encryptedContent: 'encrypted1' },
        { id: '2', name: 'API Key', type: 'apiKey', encryptedContent: 'encrypted2' },
      ];
      
      set('vaultItems', vaultItems);
      const retrieved = get('vaultItems', []);
      expect(retrieved).toEqual(vaultItems);
      
      // Add a new item
      const newItem = { id: '3', name: 'Login', type: 'login', encryptedContent: 'encrypted3' };
      const updated = [...retrieved, newItem];
      set('vaultItems', updated);
      
      const final = get('vaultItems', []);
      expect(final).toHaveLength(3);
      expect(final).toEqual(updated);
    });

    it('should persist app data with all fields intact', () => {
      const appData = {
        assets: [{ id: 'a1', name: 'Bitcoin', value: 50000 }],
        profile: { name: 'User', bio: 'Test bio', avatarUrl: '' },
        settings: { defaultCurrency: 'USD', notificationsEnabled: true },
        cryptoCurrencies: [],
        alerts: [],
      };
      
      set('appData', appData);
      const retrieved = get('appData', null);
      
      expect(retrieved).toEqual(appData);
      expect(retrieved.assets).toHaveLength(1);
      expect(retrieved.profile.name).toBe('User');
      expect(retrieved.settings.defaultCurrency).toBe('USD');
    });

    it('should handle rapid successive writes', () => {
      for (let i = 0; i < 10; i++) {
        set('rapidKey', { iteration: i, timestamp: Date.now() });
      }
      
      const final = get('rapidKey', null);
      expect(final.iteration).toBe(9);
    });
  });

  describe('Edge cases and limits', () => {
    it('should handle empty strings', () => {
      set('emptyString', '');
      expect(get('emptyString', 'default')).toBe('');
    });

    it('should handle null values', () => {
      set('nullValue', null);
      expect(get('nullValue', 'default')).toBe(null);
    });

    it('should handle undefined by converting to null', () => {
      set('undefinedValue', undefined);
      const result = get('undefinedValue', 'default');
      // undefined gets converted to null in JSON
      expect(result).toBe(null);
    });

    it('should handle very large data objects', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: `Data for item ${i}`,
      }));
      
      const result = set('largeData', largeArray);
      expect(result).toBe(true);
      
      const retrieved = get('largeData', []);
      expect(retrieved).toHaveLength(1000);
      expect(retrieved[0].id).toBe('item-0');
      expect(retrieved[999].id).toBe('item-999');
    });

    it('should handle special characters in keys', () => {
      const specialKeys = ['key-with-dash', 'key_with_underscore', 'key.with.dot'];
      
      specialKeys.forEach(key => {
        set(key, { key });
        expect(get(key, null)).toEqual({ key });
      });
    });

    it('should handle special characters in values', () => {
      const specialChars = {
        quotes: 'Value with "quotes"',
        backslash: 'Value with \\ backslash',
        unicode: '🔒 Unicode emoji 🔑',
        newlines: 'Line 1\nLine 2\nLine 3',
      };
      
      set('specialChars', specialChars);
      const retrieved = get('specialChars', {});
      expect(retrieved).toEqual(specialChars);
    });
  });
});
