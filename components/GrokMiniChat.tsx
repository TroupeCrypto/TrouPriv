import React, { useState, useEffect, useRef } from 'react';
import { sendDesignerMessage, hasGrokApiKey, GrokMessage } from '../services/grokService';
import { SpinnerIcon, XIcon } from './icons/Icons';

interface GrokMiniChatProps {
  className?: string;
}

/**
 * GrokMiniChat - A persistent, floating chat component that stays visible on all pages.
 * Grok acts as a web designer assistant, providing feedback on UI/UX and design improvements.
 */
const GrokMiniChat: React.FC<GrokMiniChatProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasApiKey = hasGrokApiKey();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory: GrokMessage[] = messages.slice(-4).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const response = await sendDesignerMessage(userMessage, conversationHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from Grok';
      setError(errorMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleObservePage = () => {
    const pageDescription = `I'm on the ${document.title} page. The main elements visible are: ${
      Array.from(document.querySelectorAll('h1, h2, button, [class*="card"]'))
        .slice(0, 10)
        .map(el => `${el.tagName}: ${el.textContent?.slice(0, 30) || 'N/A'}`)
        .join(', ')
    }`;
    
    setInput(pageDescription);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!hasApiKey) {
    return null; // Don't render if no API key is available
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 ${className}`}
        aria-label="Open Grok Designer Chat"
        title="Ask Grok (Web Designer AI)"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
          />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  // Chat window when open
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'w-80' : 'w-96'} ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Grok Designer</h3>
            <p className="text-xs text-white/80">Web Design Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              {isMinimized ? (
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" clipRule="evenodd" />
              )}
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat body */}
      {!isMinimized && (
        <div className="bg-gray-900 rounded-b-lg shadow-2xl flex flex-col" style={{ height: '500px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">
                  👋 Hi! I'm Grok, your web designer assistant.
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Ask me about design improvements, color schemes, layout suggestions, or click below to observe this page!
                </p>
                <button
                  onClick={handleObservePage}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-full transition-colors"
                >
                  🔍 Observe This Page
                </button>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <SpinnerIcon className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-gray-400 text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-700 p-3">
            {messages.length > 0 && (
              <div className="mb-2 flex gap-2">
                <button
                  onClick={handleObservePage}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
                >
                  🔍 Observe Page
                </button>
                <button
                  onClick={handleClearChat}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
                >
                  🗑️ Clear
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about design improvements..."
                rows={1}
                className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-24"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg p-2 transition-colors"
                aria-label="Send message"
              >
                {isLoading ? (
                  <SpinnerIcon className="w-5 h-5" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrokMiniChat;
