import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt } from '../utils/encryption';

// Mock Web Crypto API
class MockCryptoKey {}

describe('Encryption Utilities', () => {
  beforeEach(() => {
    // Mock crypto API with proper implementation
    const mockCrypto = {
      getRandomValues: (buffer: Uint8Array) => {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      },
      subtle: {
        importKey: vi.fn(async () => new MockCryptoKey()),
        deriveKey: vi.fn(async () => new MockCryptoKey()),
        encrypt: vi.fn(async (algorithm, key, data) => {
          // Simple mock encryption: just return the data with some modification
          const dataArray = new Uint8Array(data);
          const encrypted = new Uint8Array(dataArray.length + 16); // Add some padding
          encrypted.set(dataArray);
          return encrypted.buffer;
        }),
        decrypt: vi.fn(async (algorithm, key, data) => {
          // Simple mock decryption: reverse the encryption
          const dataArray = new Uint8Array(data);
          return dataArray.slice(0, -16).buffer; // Remove padding
        }),
      }
    };
    
    // Setup global crypto using defineProperty to avoid readonly errors
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true
    });
    
    // Also set on window for browser-like environment
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });
    }
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('encrypt function', () => {
    it('should encrypt content with a password', async () => {
      const content = 'Secret message';
      const password = 'strongPassword123';
      
      const encrypted = await encrypt(content, password);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('ciphertext');
    });

    it('should produce different ciphertext for same content', async () => {
      const content = 'Same content';
      const password = 'password123';
      
      const encrypted1 = await encrypt(content, password);
      const encrypted2 = await encrypt(content, password);
      
      // Should be different due to random IV and salt
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt empty strings', async () => {
      const content = '';
      const password = 'password123';
      
      const encrypted = await encrypt(content, password);
      expect(encrypted).toBeTruthy();
      
      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('ciphertext');
    });

    it('should encrypt complex JSON strings', async () => {
      const content = JSON.stringify({
        username: 'user@example.com',
        password: 'secret123',
        metadata: { created: Date.now() }
      });
      const password = 'masterPassword';
      
      const encrypted = await encrypt(content, password);
      expect(encrypted).toBeTruthy();
    });

    it('should encrypt unicode characters', async () => {
      const content = '🔒 Secret emoji message 🔑';
      const password = 'password123';
      
      const encrypted = await encrypt(content, password);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decrypt function', () => {
    it('should decrypt content encrypted with same password', async () => {
      const originalContent = 'Secret message';
      const password = 'strongPassword123';
      
      const encrypted = await encrypt(originalContent, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(originalContent);
    });

    it('should decrypt empty strings', async () => {
      const originalContent = '';
      const password = 'password123';
      
      const encrypted = await encrypt(originalContent, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(originalContent);
    });

    it('should decrypt complex JSON strings', async () => {
      const originalData = {
        username: 'user@example.com',
        password: 'secret123',
        metadata: { created: Date.now() }
      };
      const originalContent = JSON.stringify(originalData);
      const password = 'masterPassword';
      
      const encrypted = await encrypt(originalContent, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(originalContent);
      const parsedData = JSON.parse(decrypted);
      expect(parsedData).toEqual(originalData);
    });

    it('should decrypt unicode characters', async () => {
      const originalContent = '🔒 Secret emoji message 🔑';
      const password = 'password123';
      
      const encrypted = await encrypt(originalContent, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(originalContent);
    });

    it('should throw error for wrong password', async () => {
      const content = 'Secret message';
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      
      // Re-mock decrypt to throw error
      const mockCrypto = global.crypto as any;
      mockCrypto.subtle.decrypt = vi.fn(async () => {
        throw new Error('Decryption failed');
      });
      
      const encrypted = await encrypt(content, correctPassword);
      
      await expect(decrypt(encrypted, wrongPassword)).rejects.toThrow('Decryption failed');
    });

    it('should throw error for corrupted data', async () => {
      const password = 'password123';
      const corruptedData = JSON.stringify({
        iv: 'invalid-base64!!!',
        salt: 'invalid-base64!!!',
        ciphertext: 'invalid-base64!!!'
      });
      
      // This test verifies that invalid base64 data throws an error during decryption
      await expect(decrypt(corruptedData, password)).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      const password = 'password123';
      const invalidJson = 'not valid json {]';
      
      await expect(decrypt(invalidJson, password)).rejects.toThrow();
    });
  });

  describe('Round-trip encryption/decryption', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
      const originalContent = 'Test content';
      const password = 'password123';
      
      let content = originalContent;
      for (let i = 0; i < 5; i++) {
        const encrypted = await encrypt(content, password);
        content = await decrypt(encrypted, password);
        expect(content).toBe(originalContent);
      }
    });

    it('should handle different vault item types', async () => {
      const password = 'masterPassword';
      
      // Test login credentials
      const loginData = JSON.stringify({
        username: 'user@example.com',
        password: 'userPass123'
      });
      const encryptedLogin = await encrypt(loginData, password);
      const decryptedLogin = await decrypt(encryptedLogin, password);
      expect(JSON.parse(decryptedLogin)).toEqual(JSON.parse(loginData));
      
      // Test API key
      const apiKeyData = JSON.stringify({
        key: 'sk-1234567890abcdef',
        notes: 'Production API key'
      });
      const encryptedApiKey = await encrypt(apiKeyData, password);
      const decryptedApiKey = await decrypt(encryptedApiKey, password);
      expect(JSON.parse(decryptedApiKey)).toEqual(JSON.parse(apiKeyData));
      
      // Test secret
      const secretData = 'Plain text secret';
      const encryptedSecret = await encrypt(secretData, password);
      const decryptedSecret = await decrypt(encryptedSecret, password);
      expect(decryptedSecret).toBe(secretData);
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(10000);
      const password = 'password123';
      
      const encrypted = await encrypt(longContent, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(longContent);
      expect(decrypted.length).toBe(10000);
    });
  });

  describe('Security properties', () => {
    it('should use different IV for each encryption', async () => {
      const content = 'Same content';
      const password = 'password123';
      
      const encrypted1 = await encrypt(content, password);
      const encrypted2 = await encrypt(content, password);
      
      const parsed1 = JSON.parse(encrypted1);
      const parsed2 = JSON.parse(encrypted2);
      
      expect(parsed1.iv).not.toBe(parsed2.iv);
    });

    it('should use different salt for each encryption', async () => {
      const content = 'Same content';
      const password = 'password123';
      
      const encrypted1 = await encrypt(content, password);
      const encrypted2 = await encrypt(content, password);
      
      const parsed1 = JSON.parse(encrypted1);
      const parsed2 = JSON.parse(encrypted2);
      
      expect(parsed1.salt).not.toBe(parsed2.salt);
    });

    it('should produce base64-encoded values', async () => {
      const content = 'Secret message';
      const password = 'password123';
      
      const encrypted = await encrypt(content, password);
      const parsed = JSON.parse(encrypted);
      
      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Pattern.test(parsed.iv)).toBe(true);
      expect(base64Pattern.test(parsed.salt)).toBe(true);
      expect(base64Pattern.test(parsed.ciphertext)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle encryption failure gracefully', async () => {
      const mockCrypto = global.crypto as any;
      mockCrypto.subtle.encrypt = vi.fn(async () => {
        throw new Error('Encryption failed');
      });
      
      await expect(encrypt('content', 'password')).rejects.toThrow();
    });

    it('should handle key derivation failure', async () => {
      const mockCrypto = global.crypto as any;
      mockCrypto.subtle.deriveKey = vi.fn(async () => {
        throw new Error('Key derivation failed');
      });
      
      await expect(encrypt('content', 'password')).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const mockCrypto = global.crypto as any;
      mockCrypto.subtle.decrypt = vi.fn(async () => {
        throw new Error('Specific decryption error');
      });
      
      try {
        await decrypt('invalid', 'password');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Decryption failed');
      }
    });
  });
});
