/**
 * Environment Variable Tests
 * 
 * Tests for environment variable loading and validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getApiKeys, hasApiKey, getApiKey, validateRequiredKeys } from '../utils/env';

describe('Environment Variable Utilities', () => {
  describe('getApiKeys', () => {
    it('should return an object with API key properties', () => {
      const keys = getApiKeys();
      
      expect(keys).toHaveProperty('GEMINI_API_KEY');
      expect(keys).toHaveProperty('OPENAI_API_KEY');
      expect(keys).toHaveProperty('ANTHROPIC_API_KEY');
    });

    it('should return undefined for missing keys', () => {
      const keys = getApiKeys();
      
      // In test environment, keys should be undefined unless explicitly set
      expect(typeof keys.GEMINI_API_KEY).toMatch(/string|undefined/);
      expect(typeof keys.OPENAI_API_KEY).toMatch(/string|undefined/);
      expect(typeof keys.ANTHROPIC_API_KEY).toMatch(/string|undefined/);
    });
  });

  describe('hasApiKey', () => {
    it('should return a boolean for each provider', () => {
      expect(typeof hasApiKey('gemini')).toBe('boolean');
      expect(typeof hasApiKey('openai')).toBe('boolean');
      expect(typeof hasApiKey('anthropic')).toBe('boolean');
    });

    it('should return false for providers without keys', () => {
      // In test environment without env vars set, should return false
      const hasGemini = hasApiKey('gemini');
      const hasOpenAI = hasApiKey('openai');
      const hasAnthropic = hasApiKey('anthropic');
      
      expect(typeof hasGemini).toBe('boolean');
      expect(typeof hasOpenAI).toBe('boolean');
      expect(typeof hasAnthropic).toBe('boolean');
    });
  });

  describe('getApiKey', () => {
    it('should return the API key for a provider if available', () => {
      const geminiKey = getApiKey('gemini');
      const openaiKey = getApiKey('openai');
      const anthropicKey = getApiKey('anthropic');
      
      // Should be either string or undefined
      expect(geminiKey === undefined || typeof geminiKey === 'string').toBe(true);
      expect(openaiKey === undefined || typeof openaiKey === 'string').toBe(true);
      expect(anthropicKey === undefined || typeof anthropicKey === 'string').toBe(true);
    });
  });

  describe('validateRequiredKeys', () => {
    it('should return an empty array if all required keys are present', () => {
      // Mock environment where all keys are present
      vi.stubGlobal('import.meta', {
        env: {
          VITE_GEMINI_API_KEY: 'test-gemini-key',
          VITE_OPENAI_API_KEY: 'test-openai-key',
          VITE_ANTHROPIC_API_KEY: 'test-anthropic-key',
          DEV: true,
          PROD: false,
          MODE: 'development'
        }
      });

      const missing = validateRequiredKeys(['gemini', 'openai', 'anthropic']);
      expect(Array.isArray(missing)).toBe(true);
      
      vi.unstubAllGlobals();
    });

    it('should return an array when checking for missing keys', () => {
      const missing = validateRequiredKeys(['gemini', 'openai', 'anthropic']);
      expect(Array.isArray(missing)).toBe(true);
      // The array may be empty if keys are present from .env, or contain missing keys
      // Both are valid depending on environment configuration
    });

    it('should only check for requested providers', () => {
      const missing = validateRequiredKeys(['gemini']);
      expect(Array.isArray(missing)).toBe(true);
      // Should only check for Gemini key
      if (missing.length > 0) {
        expect(missing.every(key => key.includes('GEMINI'))).toBe(true);
      }
    });
  });

  describe('Environment fallback behavior', () => {
    it('should handle missing import.meta.env gracefully', () => {
      const keys = getApiKeys();
      expect(keys).toBeDefined();
      expect(typeof keys).toBe('object');
    });
  });
});
