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
 * Log environment variable status
 * This helps debug whether API keys are properly loaded
 * In production, it only logs summary information without exposing sensitive values
 */
export function logEnvStatus(): void {
  const keys = getApiKeys();
  const isDev = import.meta.env.DEV;
  
  console.group('🔧 Environment Variables Status');
  
  console.log('Gemini API Key:', keys.GEMINI_API_KEY ? '✅ Loaded' : '❌ Not Found');
  console.log('OpenAI API Key:', keys.OPENAI_API_KEY ? '✅ Loaded' : '❌ Not Found');
  console.log('Anthropic API Key:', keys.ANTHROPIC_API_KEY ? '✅ Loaded' : '❌ Not Found');
  
  console.log('\nEnvironment Mode:', import.meta.env.MODE);
  console.log('DEV Mode:', import.meta.env.DEV);
  console.log('PROD Mode:', import.meta.env.PROD);
  
  // Show available VITE_ prefixed variables (only in development for security)
  if (isDev && typeof import.meta !== 'undefined' && import.meta.env) {
    const viteVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
    console.log('\nAvailable VITE_ variables:', viteVars.length > 0 ? viteVars.join(', ') : 'None');
  } else {
    // In production, just show count for security
    const hasViteVars = typeof import.meta !== 'undefined' && import.meta.env && 
                       Object.keys(import.meta.env).some(key => key.startsWith('VITE_'));
    console.log('\nVITE_ variables configured:', hasViteVars ? 'Yes' : 'No');
  }
  
  // Add validation message
  const missingKeys = [];
  if (!keys.GEMINI_API_KEY) missingKeys.push('VITE_GEMINI_API_KEY');
  if (!keys.OPENAI_API_KEY) missingKeys.push('VITE_OPENAI_API_KEY');
  if (!keys.ANTHROPIC_API_KEY) missingKeys.push('VITE_ANTHROPIC_API_KEY');
  
  if (missingKeys.length > 0) {
    console.warn('\n⚠️ Missing API keys:', missingKeys.join(', '));
    console.warn('Please set these environment variables in your .env file or hosting platform.');
  } else {
    console.log('\n✅ All API keys are configured correctly.');
  }
  
  console.groupEnd();
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

/**
 * Initialize environment validation
 * Call this early in the application lifecycle to validate API keys
 * Logs warnings if required keys are missing
 */
export function initializeEnvValidation(): void {
  // Log environment status
  logEnvStatus();
  
  // Check if at least one API key is configured
  const keys = getApiKeys();
  const hasAnyKey = keys.GEMINI_API_KEY || keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY;
  
  if (!hasAnyKey) {
    console.error('❌ CRITICAL: No API keys found!');
    console.error('The application requires at least one AI provider API key to function properly.');
    console.error('Please check your environment configuration:');
    console.error('- Development: Create a .env file from .env.example and add your API keys');
    console.error('- Production: Set environment variables in your hosting platform');
    console.error('See ENV_CONFIG.md for detailed instructions.');
  }
  
  // Validate that process.env compatibility layer is working
  if (typeof process !== 'undefined' && process.env) {
    const hasProcessEnvKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (keys.GEMINI_API_KEY && !hasProcessEnvKey) {
      console.warn('⚠️ Warning: API keys found in import.meta.env but not in process.env');
      console.warn('Some code may use process.env.API_KEY and fail to access the key.');
      console.warn('This might indicate an issue with the Vite configuration.');
    }
  }
}
