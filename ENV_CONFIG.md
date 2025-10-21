# Environment Variable Configuration Guide

## Overview

This document describes how environment variables are configured and used in the TrouPriv application to ensure API keys are accessible in both development and production environments.

## The Problem

The original issue was that API keys stored in the `.env` file were not accessible on the live site. This was caused by:

1. **Incorrect variable naming**: The `.env` file used names like `GEMINI_AI` instead of the expected `GEMINI_API_KEY`
2. **Missing Vite prefix**: Vite requires environment variables to be prefixed with `VITE_` to be exposed to the browser in production builds
3. **Incomplete configuration**: The `vite.config.ts` only hardcoded a couple of variables and didn't load them properly from the environment

## The Solution

### 1. Environment Variable Naming Convention

All environment variables that need to be accessible in the browser must be prefixed with `VITE_`:

```bash
# ✅ Correct - Will be available in browser
VITE_GEMINI_API_KEY=your_api_key_here

# ❌ Incorrect - Will NOT be available in browser
GEMINI_API_KEY=your_api_key_here
API_KEY=your_api_key_here
```

### 2. Updated `.env` File Structure

The `.env` file now uses the proper naming convention:

```bash
# API Keys (exposed to browser with VITE_ prefix)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key

# Access Tokens (backend only - not exposed to browser)
CLOUDFLARE_ACCESS=your_cloudflare_token
GITHUB_ACCESS=your_github_token
```

### 3. Updated Vite Configuration

The `vite.config.ts` has been updated to:

1. Load environment variables using `loadEnv()`
2. Provide backwards compatibility for code using `process.env.API_KEY`
3. Properly expose VITE_ prefixed variables to the browser

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // ... other config
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY)
    }
  };
});
```

### 4. Environment Utilities

A new utility module (`utils/env.ts`) has been added to:

- Provide consistent access to environment variables
- Support both `import.meta.env` (Vite's way) and `process.env` (for compatibility)
- Validate that required API keys are present
- Debug environment variable loading in development

Example usage:

```typescript
import { getApiKey, hasApiKey, logEnvStatus } from './utils/env';

// Check if an API key is available
if (hasApiKey('gemini')) {
  const apiKey = getApiKey('gemini');
  // Use the API key
}

// Log environment status (development only)
logEnvStatus();
```

### 5. Debugging Tools

The application now logs environment variable status to the console in development mode:

```
🔧 Environment Variables Status
Gemini API Key: ✅ Loaded
OpenAI API Key: ✅ Loaded
Anthropic API Key: ✅ Loaded

Environment Mode: development
DEV Mode: true
PROD Mode: false

Available VITE_ variables: VITE_GEMINI_API_KEY, VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY
```

## Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   VITE_GEMINI_API_KEY=your_actual_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the browser console to verify environment variables are loaded

## Production Deployment

### For Vercel, Netlify, or similar platforms:

1. Go to your project settings
2. Add environment variables with the **same names** as in your `.env` file:
   - `VITE_GEMINI_API_KEY`
   - `VITE_OPENAI_API_KEY`
   - `VITE_ANTHROPIC_API_KEY`

3. The build process will automatically embed these values in the production build

### Important Notes:

- Environment variables are **inlined** during the build process
- The built JavaScript bundle will contain the actual API key values
- If you change an environment variable, you must rebuild and redeploy
- Don't commit the `.env` file to version control (it's in `.gitignore`)

## Security Considerations

⚠️ **Warning**: API keys exposed to the browser with the `VITE_` prefix are visible to anyone who inspects your website's JavaScript files.

For sensitive operations:
- Use the vault feature to store user-specific API keys encrypted
- Consider implementing a backend API to proxy AI requests
- Rotate API keys regularly
- Use API key restrictions (domain restrictions, rate limits) in your API provider's dashboard

## Testing

Environment variable loading is tested in `tests/env.test.ts`:

```bash
npm test tests/env.test.ts
```

## Files Changed

- ✅ `.env` - Updated to use `VITE_` prefix
- ✅ `.env.example` - Created template file
- ✅ `vite.config.ts` - Updated to properly load and expose env vars
- ✅ `utils/env.ts` - New utility module for environment variables
- ✅ `App.tsx` - Added environment logging on startup
- ✅ `README.md` - Updated with environment setup instructions
- ✅ `.gitignore` - Added `.env` files to ignore list
- ✅ `tests/env.test.ts` - New tests for environment utilities

## Validation Checklist

- [x] Environment variables use `VITE_` prefix
- [x] `.env.example` file created for documentation
- [x] `vite.config.ts` loads and exposes environment variables
- [x] Debugging utilities added for development
- [x] Documentation updated (README.md, ENV_CONFIG.md)
- [x] Tests added for environment utilities
- [x] All existing tests still pass
- [x] Build process embeds environment variables correctly
- [x] Dev server loads environment variables correctly

## Troubleshooting

### API keys not loading in development:

1. Check that `.env` file exists in the project root
2. Verify variable names start with `VITE_`
3. Restart the dev server after changing `.env`
4. Check browser console for environment status log

### API keys not loading in production:

1. Verify environment variables are set in your hosting platform
2. Ensure they use the same names as in `.env.example`
3. Rebuild and redeploy after setting environment variables
4. Check that the build completed successfully

### Variables showing as undefined:

1. Ensure you're accessing them correctly:
   - `import.meta.env.VITE_GEMINI_API_KEY` (Vite way)
   - `process.env.API_KEY` (compatibility layer)
   - `getApiKey('gemini')` (utility function)

2. Verify the variable is defined in `.env` or hosting platform
3. Check that the build process ran with the correct environment
