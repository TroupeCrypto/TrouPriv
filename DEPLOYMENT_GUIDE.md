# Deployment Guide - Environment Variables Configuration

## Overview

This guide provides step-by-step instructions for deploying TrouPriv with proper environment variable configuration to ensure API keys are accessible in both development and production environments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Verifying API Key Configuration](#verifying-api-key-configuration)
5. [Troubleshooting](#troubleshooting)
6. [Platform-Specific Instructions](#platform-specific-instructions)

---

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API keys from AI providers (Gemini, OpenAI, and/or Anthropic)

### Basic Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your API keys:
   ```
   VITE_GEMINI_API_KEY=your_actual_gemini_key
   VITE_OPENAI_API_KEY=your_actual_openai_key
   VITE_ANTHROPIC_API_KEY=your_actual_anthropic_key
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 and check the browser console for environment status

---

## Development Setup

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Add Your API Keys

Edit `.env` with your preferred text editor and add your API keys:

```bash
# API Keys (exposed to browser - required for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Access Tokens (backend only - not exposed to browser)
# These are optional and only needed if you're using backend services
CLOUDFLARE_ACCESS=your_cloudflare_token_here
GITHUB_ACCESS=your_github_token_here
```

**Important Notes:**

- The `VITE_` prefix is **required** for variables that need to be accessible in the browser
- Variables without the `VITE_` prefix will NOT be available in the browser
- Never commit your `.env` file to version control (it's already in `.gitignore`)

### Step 3: Start Development Server

```bash
npm run dev
```

The application will start on http://localhost:3000

### Step 4: Verify Environment Variables

Open the browser console and look for the environment status log:

```
🔧 Environment Variables Status
Gemini API Key: ✅ Loaded
OpenAI API Key: ✅ Loaded
Anthropic API Key: ✅ Loaded

Environment Mode: development
DEV Mode: true
PROD Mode: false

Available VITE_ variables: VITE_GEMINI_API_KEY, VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY

✅ All API keys are configured correctly.
```

If you see "❌ Not Found" for any keys, double-check your `.env` file.

---

## Production Deployment

### Understanding Production Builds

When building for production:

1. Vite reads environment variables from `.env` file (local) or environment variables (CI/CD)
2. Variables prefixed with `VITE_` are **inlined** into the JavaScript bundle during build
3. The built JavaScript contains the actual API key values
4. If you change environment variables, you **must rebuild and redeploy**

### Step 1: Set Environment Variables in Hosting Platform

The exact steps depend on your hosting platform (see [Platform-Specific Instructions](#platform-specific-instructions) below).

**General Guidelines:**

- Use the **exact same variable names** as in your `.env.example` file
- Include the `VITE_` prefix
- Set all required API keys

Example variables to set:

```
VITE_GEMINI_API_KEY=your_actual_key
VITE_OPENAI_API_KEY=your_actual_key
VITE_ANTHROPIC_API_KEY=your_actual_key
```

### Step 2: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 3: Verify Build

Check that API keys are embedded in the build:

```bash
# This should return a number greater than 0
grep -r "your_actual_key" dist/assets/*.js | wc -l
```

**⚠️ Security Warning:** Your API keys will be visible in the JavaScript bundle. Use API key restrictions in your provider's dashboard:

- Set domain restrictions
- Enable rate limiting
- Use separate keys for different environments

### Step 4: Deploy

Deploy the contents of the `dist` folder to your hosting platform.

### Step 5: Verify Deployment

After deployment:

1. Open your deployed application in a browser
2. Open the browser console
3. Look for the environment status log:

```
🔧 Environment Variables Status
Gemini API Key: ✅ Loaded
OpenAI API Key: ✅ Loaded
Anthropic API Key: ✅ Loaded

Environment Mode: production
DEV Mode: false
PROD Mode: true

VITE_ variables configured: Yes

✅ All API keys are configured correctly.
```

---

## Verifying API Key Configuration

### Console Logging

The application automatically logs environment status on startup in **both development and production**:

**Development Mode:**
- Shows all VITE_ variable names
- Shows detailed debugging information

**Production Mode:**
- Shows whether keys are loaded (✅/❌)
- Shows environment mode
- Does NOT expose variable names for security
- Shows warnings if keys are missing

### Manual Testing

To test if API keys are working:

1. Try using any AI feature (Chat, Design, etc.)
2. If you see errors about missing API keys, check the console
3. Verify that the environment status shows "✅ Loaded" for required keys

### Testing Specific Keys

Use the browser console to test specific keys:

```javascript
// Check if a specific key is available
import { hasApiKey, getApiKey } from './utils/env';

// Check if Gemini key exists
hasApiKey('gemini'); // Returns true or false

// Get the Gemini key (for debugging only)
getApiKey('gemini'); // Returns the key or undefined
```

---

## Troubleshooting

### Problem: API Keys Show as "❌ Not Found" in Development

**Solutions:**

1. **Check `.env` file exists:**
   ```bash
   ls -la .env
   ```
   If it doesn't exist, create it from `.env.example`

2. **Verify variable names:**
   - Must use `VITE_` prefix
   - Correct format: `VITE_GEMINI_API_KEY=your_key`
   - No spaces around the `=` sign
   - No quotes needed (unless your key contains spaces)

3. **Restart development server:**
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev`
   - Vite only reads `.env` on startup

4. **Check file location:**
   - `.env` must be in the project root (same folder as `package.json`)
   - Not in a subdirectory

### Problem: API Keys Show as "❌ Not Found" in Production

**Solutions:**

1. **Verify environment variables are set in hosting platform:**
   - Check your hosting dashboard
   - Ensure variable names match exactly (including `VITE_` prefix)
   - No typos in variable names

2. **Rebuild the application:**
   - Environment variables are embedded at build time
   - If you changed variables after building, rebuild:
     ```bash
     npm run build
     ```

3. **Check build logs:**
   - Look for any warnings or errors during build
   - Verify the build completed successfully

4. **Verify deployment:**
   - Ensure you deployed the `dist` folder, not the source code
   - Check that all files from `dist` are uploaded

### Problem: "CRITICAL: No API keys found!" Error

This means the application can't find ANY API keys.

**Solutions:**

1. **Development:**
   - Create `.env` file from `.env.example`
   - Add at least one API key
   - Restart dev server

2. **Production:**
   - Set environment variables in hosting platform
   - Rebuild application
   - Redeploy

### Problem: API Calls Fail with Authentication Errors

**Possible Causes:**

1. **Invalid API key:**
   - Verify the key is correct
   - Check for extra spaces or newlines
   - Regenerate the key in your provider's dashboard

2. **API key restrictions:**
   - Check if the key has domain restrictions
   - Verify the key is enabled
   - Check if you've exceeded rate limits

3. **Key not embedded in build:**
   - Rebuild with correct environment variables
   - Verify the key is in the built files

### Problem: Different Behavior Between Dev and Prod

**Common Issues:**

1. **Different environment variables:**
   - Dev uses `.env` file
   - Prod uses hosting platform variables
   - Ensure both have the same keys

2. **Caching:**
   - Clear browser cache
   - Hard reload (Ctrl+Shift+R or Cmd+Shift+R)
   - Try incognito/private mode

3. **Build issues:**
   - Ensure you're testing the latest build
   - Check that deployment includes all built files

---

## Platform-Specific Instructions

### Vercel

1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `your_actual_key`
   - Environment: Select **Production**, **Preview**, and **Development**
4. Click **Save**
5. Redeploy your application

**Note:** Vercel automatically rebuilds when you push to Git. Make sure environment variables are set before deploying.

### Netlify

1. Go to your site dashboard
2. Click **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add each variable:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: `your_actual_key`
   - Scopes: Select **All scopes**
5. Click **Create variable**
6. Trigger a new deploy

**Alternative:** Use Netlify CLI:

```bash
netlify env:set VITE_GEMINI_API_KEY "your_actual_key"
```

### GitHub Pages

GitHub Pages serves static files and doesn't support environment variables at deploy time.

**Solution:** Build locally with environment variables:

```bash
# Set environment variables
export VITE_GEMINI_API_KEY="your_actual_key"
export VITE_OPENAI_API_KEY="your_actual_key"
export VITE_ANTHROPIC_API_KEY="your_actual_key"

# Build
npm run build

# Deploy
npm run deploy  # If you have a deploy script
```

**Better Alternative:** Use GitHub Actions for deployment:

1. Set secrets in GitHub repository settings
2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
          VITE_ANTHROPIC_API_KEY: ${{ secrets.VITE_ANTHROPIC_API_KEY }}
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Cloudflare Pages

1. Go to your Pages project
2. Click **Settings** → **Environment variables**
3. Click **Add variable**
4. For **Production** environment, add:
   - Variable name: `VITE_GEMINI_API_KEY`
   - Value: `your_actual_key`
5. Repeat for all required variables
6. Redeploy your application

### Railway

1. Go to your project
2. Click on your service
3. Go to **Variables** tab
4. Click **New Variable**
5. Add each variable:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `your_actual_key`
6. Railway will automatically redeploy

### Docker

Add environment variables to your `docker-compose.yml`:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_GEMINI_API_KEY=your_actual_key
      - VITE_OPENAI_API_KEY=your_actual_key
      - VITE_ANTHROPIC_API_KEY=your_actual_key
```

Or use an `.env` file with Docker:

```bash
docker run --env-file .env -p 3000:3000 your-app
```

**Important:** For Docker, build inside the container so environment variables are available during build:

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Environment variables should be passed at build time
ARG VITE_GEMINI_API_KEY
ARG VITE_OPENAI_API_KEY
ARG VITE_ANTHROPIC_API_KEY

ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

Build with:

```bash
docker build \
  --build-arg VITE_GEMINI_API_KEY="your_actual_key" \
  --build-arg VITE_OPENAI_API_KEY="your_actual_key" \
  --build-arg VITE_ANTHROPIC_API_KEY="your_actual_key" \
  -t your-app .
```

---

## Security Best Practices

### API Key Protection

1. **Use API key restrictions:**
   - Set HTTP referrer restrictions in your API provider's dashboard
   - Example for Gemini: Restrict to `yourdomain.com/*`
   - This prevents unauthorized use even if keys are visible in JavaScript

2. **Separate keys per environment:**
   - Use different API keys for development and production
   - Makes it easier to rotate keys
   - Better tracking of usage

3. **Rate limiting:**
   - Enable rate limiting in your API provider's dashboard
   - Set appropriate quotas
   - Monitor usage regularly

4. **Key rotation:**
   - Rotate keys periodically
   - Have a process for emergency key rotation
   - Test the rotation process before you need it

### Environment Variables

1. **Never commit `.env` files:**
   - Already in `.gitignore`
   - Double-check before committing
   - Use `.env.example` for documentation

2. **Use secrets management:**
   - For team environments, consider using a secrets manager
   - Examples: HashiCorp Vault, AWS Secrets Manager, 1Password

3. **Audit access:**
   - Limit who can view environment variables
   - Review access logs regularly
   - Use role-based access control in your hosting platform

### Monitoring

1. **Track API usage:**
   - Monitor API calls in provider dashboards
   - Set up alerts for unusual activity
   - Review costs regularly

2. **Error tracking:**
   - Implement error tracking (e.g., Sentry)
   - Monitor for authentication errors
   - Alert on repeated failures

---

## Additional Resources

- [ENV_CONFIG.md](./ENV_CONFIG.md) - Detailed environment configuration guide
- [API_KEY_FIX_SUMMARY.md](./API_KEY_FIX_SUMMARY.md) - Technical implementation details
- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Google AI Studio - API Keys](https://makersuite.google.com/app/apikey)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Anthropic API Keys](https://console.anthropic.com/settings/keys)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the console logs for specific error messages
3. Check that all prerequisites are met
4. Verify your API keys are valid in the provider's dashboard

For additional help, please open an issue in the repository with:
- Error messages from console
- Environment status log output
- Steps to reproduce the issue
- Platform you're deploying to
