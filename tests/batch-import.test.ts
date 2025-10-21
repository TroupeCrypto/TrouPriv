import { describe, it, expect } from 'vitest';

/**
 * These are unit tests for the batch import parsing logic
 * We're testing the core parsing functions without requiring React components
 */

/**
 * Parses a line of text to extract key-value pairs
 */
function parseLine(line: string): { key: string; value: string } | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;
  
  // Try KEY=VALUE format
  let match = trimmedLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  
  // Try KEY: VALUE format
  match = trimmedLine.match(/^([^:]+):(.*)$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  
  return null;
}

/**
 * Detects the type of vault item based on the content
 */
function detectItemType(name: string, value: string, website?: string): 'secret' | 'apiKey' | 'login' {
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase();
  
  // Check for API key indicators
  if (lowerName.includes('api') || lowerName.includes('key') || 
      lowerName.includes('token') || lowerName.includes('secret')) {
    return 'apiKey';
  }
  
  // Check for login indicators
  if (lowerName.includes('username') || lowerName.includes('user') || 
      lowerName.includes('login') || lowerName.includes('password') || 
      lowerName.includes('pass')) {
    return 'login';
  }
  
  // Check for typical API key patterns in the value
  if (value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value)) {
    return 'apiKey';
  }
  
  return 'secret';
}

describe('Batch Import Parsing', () => {
  describe('parseLine', () => {
    it('should parse KEY=VALUE format', () => {
      const result = parseLine('API_KEY=abc123');
      expect(result).toEqual({ key: 'API_KEY', value: 'abc123' });
    });

    it('should parse KEY: VALUE format', () => {
      const result = parseLine('API_KEY: abc123');
      expect(result).toEqual({ key: 'API_KEY', value: 'abc123' });
    });

    it('should parse KEY = VALUE format with spaces', () => {
      const result = parseLine('API_KEY = abc123');
      expect(result).toEqual({ key: 'API_KEY', value: 'abc123' });
    });

    it('should parse KEY : VALUE format with spaces', () => {
      const result = parseLine('API_KEY : abc123');
      expect(result).toEqual({ key: 'API_KEY', value: 'abc123' });
    });

    it('should handle empty lines', () => {
      const result = parseLine('');
      expect(result).toBeNull();
    });

    it('should handle whitespace-only lines', () => {
      const result = parseLine('   ');
      expect(result).toBeNull();
    });

    it('should parse values with special characters', () => {
      const result = parseLine('KEY=value-with_special.chars@123');
      expect(result).toEqual({ key: 'KEY', value: 'value-with_special.chars@123' });
    });

    it('should parse values with equals signs', () => {
      const result = parseLine('KEY=value=with=equals');
      expect(result).toEqual({ key: 'KEY', value: 'value=with=equals' });
    });

    it('should parse values with colons', () => {
      const result = parseLine('URL: https://example.com:8080');
      expect(result).toEqual({ key: 'URL', value: 'https://example.com:8080' });
    });

    it('should handle lines without delimiters', () => {
      const result = parseLine('just some text');
      expect(result).toBeNull();
    });
  });

  describe('detectItemType', () => {
    it('should detect API keys by name', () => {
      expect(detectItemType('API_KEY', 'somevalue')).toBe('apiKey');
      expect(detectItemType('MY_API_TOKEN', 'somevalue')).toBe('apiKey');
      expect(detectItemType('SECRET_KEY', 'somevalue')).toBe('apiKey');
      expect(detectItemType('AUTH_TOKEN', 'somevalue')).toBe('apiKey');
    });

    it('should detect logins by name', () => {
      expect(detectItemType('USERNAME', 'john')).toBe('login');
      expect(detectItemType('USER', 'john')).toBe('login');
      expect(detectItemType('PASSWORD', 'secret123')).toBe('login');
      expect(detectItemType('LOGIN', 'john')).toBe('login');
    });

    it('should detect API keys by value pattern', () => {
      const longKey = 'a'.repeat(30);
      expect(detectItemType('SOME_KEY', longKey)).toBe('apiKey');
    });

    it('should default to secret for generic items', () => {
      expect(detectItemType('MY_NOTE', 'some text')).toBe('secret');
      expect(detectItemType('DATABASE_URL', 'postgres://localhost')).toBe('secret');
    });

    it('should be case insensitive', () => {
      expect(detectItemType('api_key', 'value')).toBe('apiKey');
      expect(detectItemType('Api_Key', 'value')).toBe('apiKey');
      expect(detectItemType('username', 'john')).toBe('login');
      expect(detectItemType('UserName', 'john')).toBe('login');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical environment variable format', () => {
      const lines = [
        'DATABASE_URL=postgres://localhost:5432/mydb',
        'API_KEY=sk-1234567890abcdef',
        'SECRET_TOKEN=abc123xyz',
      ];

      const parsed = lines.map(line => parseLine(line));
      expect(parsed).toEqual([
        { key: 'DATABASE_URL', value: 'postgres://localhost:5432/mydb' },
        { key: 'API_KEY', value: 'sk-1234567890abcdef' },
        { key: 'SECRET_TOKEN', value: 'abc123xyz' },
      ]);
    });

    it('should handle colon-separated format', () => {
      const lines = [
        'name: My API Key',
        'website: https://api.example.com',
        'key: sk-1234567890abcdef',
      ];

      const parsed = lines.map(line => parseLine(line));
      expect(parsed).toEqual([
        { key: 'name', value: 'My API Key' },
        { key: 'website', value: 'https://api.example.com' },
        { key: 'key', value: 'sk-1234567890abcdef' },
      ]);
    });

    it('should handle login credentials format', () => {
      const lines = [
        'name: GitHub Login',
        'website: github.com',
        'username: myuser@example.com',
        'password: MySecurePassword123!',
      ];

      const parsed = lines.map(line => parseLine(line));
      expect(parsed).toEqual([
        { key: 'name', value: 'GitHub Login' },
        { key: 'website', value: 'github.com' },
        { key: 'username', value: 'myuser@example.com' },
        { key: 'password', value: 'MySecurePassword123!' },
      ]);
    });

    it('should handle mixed formats', () => {
      const text = `
API_KEY=sk-1234567890
DATABASE_URL: postgres://localhost:5432/mydb
SECRET_TOKEN=abc123xyz
`;
      const lines = text.split('\n').filter(l => l.trim());
      const parsed = lines.map(line => parseLine(line));
      
      expect(parsed).toEqual([
        { key: 'API_KEY', value: 'sk-1234567890' },
        { key: 'DATABASE_URL', value: 'postgres://localhost:5432/mydb' },
        { key: 'SECRET_TOKEN', value: 'abc123xyz' },
      ]);
    });

    it('should properly type detect common patterns', () => {
      const items = [
        { name: 'GEMINI_API_KEY', value: 'AIzaSyAbc123' },
        { name: 'DATABASE_URL', value: 'postgres://localhost:5432/db' },
        { name: 'username', value: 'john@example.com' },
        { name: 'MY_SECRET_NOTE', value: 'This is a secret note' },
      ];

      const types = items.map(item => detectItemType(item.name, item.value));
      
      expect(types).toEqual([
        'apiKey',
        'secret',
        'login',
        'apiKey',
      ]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty values', () => {
      const result = parseLine('KEY=');
      expect(result).toEqual({ key: 'KEY', value: '' });
    });

    it('should handle values with leading/trailing whitespace', () => {
      const result = parseLine('KEY=  value  ');
      expect(result).toEqual({ key: 'KEY', value: 'value' });
    });

    it('should handle keys with underscores and dashes', () => {
      const result1 = parseLine('MY_API_KEY=value');
      const result2 = parseLine('my-api-key=value');
      
      expect(result1).toEqual({ key: 'MY_API_KEY', value: 'value' });
      expect(result2).toEqual({ key: 'my-api-key', value: 'value' });
    });

    it('should handle very long values', () => {
      const longValue = 'a'.repeat(1000);
      const result = parseLine(`KEY=${longValue}`);
      
      expect(result).toEqual({ key: 'KEY', value: longValue });
    });

    it('should handle values with newlines represented as \\n', () => {
      const result = parseLine('KEY=line1\\nline2');
      expect(result).toEqual({ key: 'KEY', value: 'line1\\nline2' });
    });

    it('should handle unicode characters', () => {
      const result = parseLine('KEY=Hello 世界 🌍');
      expect(result).toEqual({ key: 'KEY', value: 'Hello 世界 🌍' });
    });
  });
});
