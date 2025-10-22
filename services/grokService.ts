/**
 * Grok AI Service
 * 
 * This service provides integration with xAI's Grok API.
 * Grok is configured as a web designer assistant that can observe and provide
 * feedback on UI elements, styles, and overall design improvements.
 */

import { getApiKey } from '../utils/env';
import type { DecryptedVaultItem } from '../contexts/VaultContext';

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokChatRequest {
  messages: GrokMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface GrokChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Default system prompt for Grok as a web designer
 */
export const GROK_DESIGNER_PROMPT = `You are Grok, an expert web designer and UI/UX consultant. Your role is to:
- Observe and analyze web pages, components, and user interfaces
- Provide constructive feedback on visual design, layout, and user experience
- Suggest improvements for colors, typography, spacing, and overall aesthetics
- Note accessibility concerns and best practices
- Recommend modern design patterns and trends
- Keep responses concise and actionable

You have a friendly, professional tone and focus on practical, implementable suggestions.
When discussing design changes, be specific about what elements to change and why.`;

/**
 * Get Grok API key from environment or vault, or throw error
 */
export function getGrokApiKey(vaultItems?: DecryptedVaultItem[]): string {
  const apiKey = getApiKey('grok', vaultItems);
  if (!apiKey) {
    throw new Error('Grok API key not found. Please set VITE_GROK_AI in your environment variables or add a Grok API key to your vault (with "grok" or "xai" in the name).');
  }
  return apiKey;
}

/**
 * Check if Grok API key is available in environment or vault
 */
export function hasGrokApiKey(vaultItems?: DecryptedVaultItem[]): boolean {
  return !!getApiKey('grok', vaultItems);
}

/**
 * Send a chat request to Grok API
 */
export async function sendGrokChat(request: GrokChatRequest, vaultItems?: DecryptedVaultItem[]): Promise<string> {
  const apiKey = getGrokApiKey(vaultItems);
  
  const requestBody = {
    model: request.model || 'grok-3',
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 1024,
  };

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Try to parse error response with multiple fallbacks for different error formats
      let errorMessage = response.statusText;
      
      try {
        const errorData = await response.json();
        
        // Handle different error response formats from xAI API
        if (errorData.error?.message) {
          // OpenAI-compatible format: { error: { message: "..." } }
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          // Direct message format: { message: "..." }
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          // FastAPI format: { detail: "..." }
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          // Plain string error
          errorMessage = errorData;
        } else if (errorData.error) {
          // Error object without message
          errorMessage = JSON.stringify(errorData.error);
        }
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorMessage = `${response.status} ${response.statusText}`;
      }
      
      throw new Error(`Grok API error (${response.status}): ${errorMessage}`);
    }

    const data: GrokChatResponse = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No response from Grok API');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with Grok API');
  }
}

/**
 * Send a simple message to Grok with the designer system prompt
 */
export async function sendDesignerMessage(userMessage: string, conversationHistory: GrokMessage[] = [], vaultItems?: DecryptedVaultItem[]): Promise<string> {
  const messages: GrokMessage[] = [
    { role: 'system', content: GROK_DESIGNER_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  return sendGrokChat({ messages }, vaultItems);
}

/**
 * Ask Grok to analyze a page or component description
 */
export async function analyzeDesign(description: string, context?: string, vaultItems?: DecryptedVaultItem[]): Promise<string> {
  const prompt = context 
    ? `Context: ${context}\n\nAnalyze this design: ${description}`
    : `Analyze this design: ${description}`;
  
  return sendDesignerMessage(prompt, [], vaultItems);
}

/**
 * Ask Grok for design suggestions
 */
export async function getSuggestions(currentDesign: string, goals?: string, vaultItems?: DecryptedVaultItem[]): Promise<string> {
  const prompt = goals
    ? `Current design: ${currentDesign}\n\nDesign goals: ${goals}\n\nProvide specific suggestions for improvement.`
    : `Current design: ${currentDesign}\n\nProvide specific suggestions for improvement.`;
  
  return sendDesignerMessage(prompt, [], vaultItems);
}
