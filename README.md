<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19vRKnMb6kcW14AemxY-5_TeNl6hdu_KZ

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
   
   **Important:** Environment variables must be prefixed with `VITE_` to be accessible in the browser.

3. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

### Why VITE_ prefix?

Vite (the build tool used by this project) requires environment variables that should be exposed to the browser to be prefixed with `VITE_`. This is a security feature to prevent accidentally exposing server-side secrets.

### Available API Keys

- `VITE_GEMINI_API_KEY` - Google Gemini API key (required for AI features)
- `VITE_OPENAI_API_KEY` - OpenAI API key (optional, for OpenAI features)
- `VITE_ANTHROPIC_API_KEY` - Anthropic Claude API key (optional, for Claude features)

### Development vs Production

- **Development**: Environment variables are loaded from `.env` file automatically
- **Production**: You must set environment variables in your hosting platform (Vercel, Netlify, etc.)
  - Make sure to use the same `VITE_` prefixed variable names
  - The build process will inline these values during the build step

### Debugging

The app logs the status of environment variables to the browser console on startup in **both development and production modes**. Check the console to verify your API keys are loaded correctly.

**Development Mode:**
- Shows all VITE_ variable names
- Shows detailed debugging information

**Production Mode:**
- Shows whether keys are loaded (✅/❌)
- Shows environment mode
- Shows warnings if keys are missing

For detailed troubleshooting, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Deployment

For comprehensive deployment instructions including platform-specific guides (Vercel, Netlify, Cloudflare, etc.), see the **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**.

### Quick Deployment Steps

When deploying to production:

1. Set environment variables in your hosting platform with the `VITE_` prefix
2. Run `npm run build` to create the production build
3. Deploy the `dist` folder to your hosting service

The environment variables will be embedded in the JavaScript bundle during the build process.

### Verifying Deployment

After deployment:
1. Open your deployed site
2. Open the browser console
3. Check for the environment status log showing "✅ Loaded" for all required keys

## Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide with platform-specific instructions
- **[ENV_CONFIG.md](./ENV_CONFIG.md)** - Detailed environment variable configuration guide
- **[API_KEY_FIX_SUMMARY.md](./API_KEY_FIX_SUMMARY.md)** - Technical implementation details
