import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  // Clear localStorage and sessionStorage after each test
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.ethereum for Web3 tests
if (typeof window !== 'undefined') {
  (window as any).ethereum = undefined;
}
