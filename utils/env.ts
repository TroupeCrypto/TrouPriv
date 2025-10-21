/**
 * Environment Configuration Utilities
 * 
 * This module provides utilities for accessing and debugging environment variables.
 * It ensures proper fallback handling and provides debugging information in development.
 */

interface EnvConfig {
  GEMINI_API_KEY: string | undefined;
  OPENAI_API_KEY: string | undefined;
  ANTHROPIC_API_KEY: string | undefined;
}

/**
 * Get environment variable value
 * Checks import.meta.env first (Vite's recommended way), then falls back to process.env
 */
function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first (Vite's way)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (value !== undefined) return value;
  }
  
  // Fallback to process.env (for compatibility)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (value !== undefined) return value;
  }
  
  return undefined;
}

/**
 * Get all API keys from environment variables
 */
export function getApiKeys(): EnvConfig {
  return {
    GEMINI_API_KEY: getEnvVar('VITE_GEMINI_API_KEY') || getEnvVar('API_KEY') || getEnvVar('GEMINI_API_KEY'),
    OPENAI_API_KEY: getEnvVar('VITE_OPENAI_API_KEY') || getEnvVar('OPENAI_API_KEY'),
    ANTHROPIC_API_KEY: getEnvVar('VITE_ANTHROPIC_API_KEY') || getEnvVar('ANTHROPIC_API_KEY'),
  };
}

/**
 * Check if an API key is configured
 */
export function hasApiKey(provider: 'gemini' | 'openai' | 'anthropic'): boolean {
  const keys = getApiKeys();
  const keyMap = {
    gemini: keys.GEMINI_API_KEY,
    openai: keys.OPENAI_API_KEY,
    anthropic: keys.ANTHROPIC_API_KEY,
  };
  
  return !!keyMap[provider];
}

/**
 * Get API key for a specific provider
 */
export function getApiKey(provider: 'gemini' | 'openai' | 'anthropic'): string | undefined {
  const keys = getApiKeys();
  const keyMap = {
    gemini: keys.GEMINI_API_KEY,
    openai: keys.OPENAI_API_KEY,
    anthropic: keys.ANTHROPIC_API_KEY,
  };
  
  return keyMap[provider];
}

/**
 * Log environment variable status (only in development)
 * This helps debug whether API keys are properly loaded
 */
export function logEnvStatus(): void {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.group('🔧 Environment Variables Status');
    
    const keys = getApiKeys();
    
    console.log('Gemini API Key:', keys.GEMINI_API_KEY ? '✅ Loaded' : '❌ Not Found');
    console.log('OpenAI API Key:', keys.OPENAI_API_KEY ? '✅ Loaded' : '❌ Not Found');
    console.log('Anthropic API Key:', keys.ANTHROPIC_API_KEY ? '✅ Loaded' : '❌ Not Found');
    
    console.log('\nEnvironment Mode:', import.meta.env.MODE);
    console.log('DEV Mode:', import.meta.env.DEV);
    console.log('PROD Mode:', import.meta.env.PROD);
    
    // Show available VITE_ prefixed variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
      console.log('\nAvailable VITE_ variables:', viteVars.length > 0 ? viteVars.join(', ') : 'None');
    }
    
    console.groupEnd();
  }
}

/**
 * Validate that required API keys are present
 * Returns an array of missing keys
 */
export function validateRequiredKeys(requiredProviders: Array<'gemini' | 'openai' | 'anthropic'>): string[] {
  const missing: string[] = [];
  const keys = getApiKeys();
  
  requiredProviders.forEach(provider => {
    if (provider === 'gemini' && !keys.GEMINI_API_KEY) {
      missing.push('VITE_GEMINI_API_KEY');
    } else if (provider === 'openai' && !keys.OPENAI_API_KEY) {
      missing.push('VITE_OPENAI_API_KEY');
    } else if (provider === 'anthropic' && !keys.ANTHROPIC_API_KEY) {
      missing.push('VITE_ANTHROPIC_API_KEY');
    }
  });
  
  return missing;
}
