/**
 * Grok Service Tests
 * 
 * Tests for Grok API integration and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendGrokChat, hasGrokApiKey, getGrokApiKey } from '../services/grokService';
import type { GrokChatRequest } from '../services/grokService';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Grok Service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle OpenAI-compatible error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key provided',
            type: 'invalid_request_error',
            code: 'invalid_api_key'
          }
        })
      });

      // Mock environment to have an API key
      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (401): Invalid API key provided');
    });

    it('should handle direct message error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          message: 'Invalid request format'
        })
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (400): Invalid request format');
    });

    it('should handle FastAPI detail error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          detail: 'Validation error: missing required field'
        })
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (422): Validation error: missing required field');
    });

    it('should handle plain string error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => 'Server error occurred'
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (500): Server error occurred');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (503): 503 Service Unavailable');
    });

    it('should handle rate limit errors with status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            type: 'rate_limit_error'
          }
        })
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('Grok API error (429): Rate limit exceeded. Please try again later.');
    });
  });

  describe('Successful Response Handling', () => {
    it('should successfully parse valid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1234567890,
          model: 'grok-3',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello! How can I help you?'
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      const response = await sendGrokChat(request);
      expect(response).toBe('Hello! How can I help you?');
    });

    it('should throw error when response has no choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1234567890,
          model: 'grok-3',
          choices: []
        })
      });

      vi.stubEnv('VITE_GROK_AI', 'test-key-123');

      const request: GrokChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      await expect(sendGrokChat(request)).rejects.toThrow('No response from Grok API');
    });
  });

  describe('API Key Management', () => {
    it('should detect when API key is present in environment', () => {
      vi.stubEnv('VITE_GROK_AI', 'test-key-123');
      expect(hasGrokApiKey()).toBe(true);
    });

    it('should return API key when present', () => {
      vi.stubEnv('VITE_GROK_AI', 'test-key-123');
      const apiKey = getGrokApiKey();
      expect(apiKey).toBe('test-key-123');
    });
  });
});
