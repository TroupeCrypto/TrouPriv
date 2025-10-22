# Grok AI Web Designer Integration

## Overview
This application now includes a persistent Grok AI chat component that acts as your personal web designer assistant. Grok stays with you on every page, ready to provide design feedback, UI/UX suggestions, and help prettify your website.

## Features

### 1. Persistent Chat Widget
- **Always Available**: Grok appears as a floating button in the bottom-right corner of every page
- **Minimizable**: Click to expand the full chat interface or minimize to just the header
- **Conversation Memory**: Maintains context with the last 4 messages in the conversation

### 2. Web Designer Persona
Grok is configured with expertise in:
- Visual design and layout analysis
- Color schemes and typography
- UI/UX best practices
- Accessibility standards
- Modern design patterns and trends

### 3. Page Observation
The "🔍 Observe This Page" button allows Grok to:
- Analyze the current page structure
- Identify main UI elements
- Suggest improvements based on what it observes
- Provide contextual design feedback

### 4. Enhanced File Upload in Chat
The main Chat page now supports uploading and analyzing:
- Code files: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, `.cpp`, `.c`, `.h`, `.rs`, `.go`, `.rb`, `.php`, `.sh`
- Markup/Data: `.html`, `.xml`, `.json`, `.yaml`, `.yml`
- Documentation: `.md`, `.txt`, `.csv`
- Styles: `.css`
- Archives: `.zip`
- And more!

## Setup

### API Key Configuration

You have two options to configure your Grok API key:

#### Option 1: Environment Variable (Recommended for development)
Add your Grok API key to the `.env` file:
```
VITE_GROK_AI=xai-your-api-key-here
```

Or set it as an environment variable in your hosting platform.

#### Option 2: Vault Storage (Secure, encrypted storage)
1. Navigate to the **Vault** page in the application
2. If not already set up, create a master password for your vault
3. Click "Add New Item"
4. Fill in the form:
   - **Type**: Select "API Key"
   - **Name**: Enter "Grok API Key" or "xAI API" (must contain "grok", "xai", or "x.ai")
   - **Key/Secret**: Paste your Grok API key
   - **Website** (optional): "https://x.ai"
5. Click "Add to Vault"

The Grok service will automatically detect and use your API key from the vault when the vault is unlocked. Environment variables take precedence over vault storage.

### Getting a Grok API Key
1. Visit [x.ai](https://x.ai) (xAI's platform)
2. Sign up for API access
3. Generate your API key
4. Add it to either your environment variables or vault (see above)

## Usage Examples

### Ask for Design Feedback
```
"What do you think of the color scheme on this dashboard?"
"How can I improve the spacing and layout?"
"Suggest a better typography hierarchy for these headings"
```

### Get Specific Recommendations
```
"Should I use rounded corners or sharp edges for these cards?"
"What's a good accent color that would complement the purple theme?"
"How can I make this form more user-friendly?"
```

### Observe and Analyze
1. Click "🔍 Observe This Page"
2. Grok will automatically scan the page elements
3. Ask follow-up questions about specific elements
4. Get actionable improvement suggestions

### Upload Code for Review
1. Go to the Chat page
2. Click the attachment button
3. Upload `.css`, `.tsx`, or other code files
4. Ask Grok for design-related feedback on the code

## Technical Details

### API Integration
- **Service**: `services/grokService.ts`
- **Component**: `components/GrokMiniChat.tsx`
- **API Endpoint**: `https://api.x.ai/v1/chat/completions`
- **Model**: `grok-beta`

### System Prompt
Grok uses a specialized system prompt that focuses on:
- Constructive design feedback
- Practical, implementable suggestions
- Professional, friendly tone
- Specific recommendations with reasoning

### Component Architecture
- Built with React and TypeScript
- Uses hooks for state management
- Styled with Tailwind CSS
- Responsive design that works on all screen sizes

## Troubleshooting

### Grok Button Not Appearing
- Check that `VITE_GROK_AI` is set in your environment
- Verify the API key is valid
- Check browser console for errors

### API Errors
- Ensure your API key has sufficient credits
- Check your internet connection
- Verify xAI API status

### File Upload Issues
- Make sure files are under the size limit
- Check that file types are supported
- Verify Gemini API key is configured for file processing

## Privacy & Security
- All conversations are sent to xAI's servers
- No conversation history is stored locally
- API keys are managed through environment variables
- CodeQL security scans show no vulnerabilities

## Future Enhancements
Potential features for future versions:
- Save/export design suggestions
- Screenshot analysis for design feedback
- Design system recommendations
- A/B testing suggestions
- Integration with design tools

## Support
For issues or questions:
1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Review the Grok API documentation at x.ai
4. Open an issue in the repository
