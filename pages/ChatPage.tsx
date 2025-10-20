import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AIPersona, AIProtocol, VaultItem } from '../types';
import { useVault } from '../contexts/VaultContext';
import { SparklesIcon, OpenAIIcon, AnthropicIcon, KeyIcon, BibIcon, SpinnerIcon, UserCircleIcon } from '../components/icons/Icons';

interface ChatPageProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  aiPersona: AIPersona;
  aiProtocols: AIProtocol[];
  vaultItems: VaultItem[];
}

const modelInfo = {
    Gemini: { name: 'Gemini', Icon: SparklesIcon, color: 'text-fuchsia-400' },
    OpenAI: { name: 'OpenAI', Icon: OpenAIIcon, color: 'text-cyan-400' },
    Anthropic: { name: 'Anthropic', Icon: AnthropicIcon, color: 'text-amber-400' },
};

const MissingKeysWarning: React.FC = () => (
    <div className="p-2 bg-yellow-900/50 border-b-2 border-yellow-600/50 text-center text-sm text-yellow-300">
        <KeyIcon className="w-4 h-4 inline-block mr-2" />
        OpenAI or Anthropic API keys are missing. Add them to your <span className="font-bold">Vault</span> for full multi-model functionality.
    </div>
);

const ChatPage: React.FC<ChatPageProps> = ({ chatHistory, setChatHistory, aiPersona, aiProtocols }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { decryptedItems } = useVault();

    const apiKeys = useMemo(() => {
        const keys: Record<string, string> = {};
        decryptedItems.forEach(item => {
            if (item.type === 'apiKey' && typeof item.decryptedContent === 'object' && item.decryptedContent && 'key' in item.decryptedContent) {
                const keyContent = (item.decryptedContent as {key: string}).key;
                const name = item.name.toLowerCase();
                const website = item.website?.toLowerCase() || '';

                if (name.includes('openai') || website.includes('openai')) {
                    keys.openai = keyContent;
                }
                if (name.includes('anthropic') || website.includes('anthropic')) {
                    keys.anthropic = keyContent;
                }
            }
        });
        return keys;
    }, [decryptedItems]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const routePrompt = useCallback(async (userPrompt: string): Promise<'Gemini' | 'OpenAI' | 'Anthropic'> => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Classify the following user prompt into one of these categories: "Conceptualization & Building", "Planning & Coding", "Styling & Design". Respond with only the category name. Prompt: "${userPrompt}"`;
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const category = response.text.trim().toLowerCase();
            
            if (category.includes('planning') || category.includes('coding')) {
                if (!apiKeys.openai) {
                    console.warn("Routing to OpenAI failed: Key missing. Defaulting to Gemini.");
                    return 'Gemini';
                }
                return 'OpenAI';
            } else if (category.includes('styling') || category.includes('design')) {
                 if (!apiKeys.anthropic) {
                    console.warn("Routing to Anthropic failed: Key missing. Defaulting to Gemini.");
                    return 'Gemini';
                }
                return 'Anthropic';
            }
            return 'Gemini';
        } catch (error) {
            console.error("Routing failed, defaulting to Gemini:", error);
            return 'Gemini';
        }
    }, [apiKeys.openai, apiKeys.anthropic]);

    const getAiResponse = useCallback(async (userPrompt: string, model: 'Gemini' | 'OpenAI' | 'Anthropic', currentHistory: ChatMessage[]): Promise<string> => {
        const activeProtocols = aiProtocols.filter(p => p.isActive).map(p => `- ${p.content}`).join('\n');
        
        const systemPrompt = `You are ${aiPersona.name}. Your Core Persona: ${aiPersona.corePersona}. Strictly adhere to the following active protocols:\n${activeProtocols || 'No active protocols.'}`;
        
        const recentHistory = currentHistory.slice(-6);

        switch(model) {
            case 'Gemini': {
                const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const contentsForGemini = [
                    ...recentHistory.map(m => ({
                        role: m.role,
                        parts: [{ text: m.content }]
                    })),
                    {
                        role: 'user',
                        parts: [{ text: userPrompt }]
                    }
                ];

                const result = await geminiAi.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: contentsForGemini,
                    config: {
                      systemInstruction: systemPrompt
                    },
                });
                return result.text;
            }
            
            case 'OpenAI': {
                if (!apiKeys.openai) throw new Error("OpenAI API Key is missing from the vault.");
                const messagesForApi = recentHistory.map(({ role, content }) => ({
                    role: role === 'model' ? 'assistant' : 'user',
                    content,
                }));

                const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeys.openai}` },
                    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }, ...messagesForApi, { role: 'user', content: userPrompt }] })
                });
                if (!openaiRes.ok) { const e = await openaiRes.json(); throw new Error(`OpenAI: ${e.error.message}`); }
                const openaiData = await openaiRes.json();
                return openaiData.choices[0].message.content;
            }

            case 'Anthropic': {
                if (!apiKeys.anthropic) throw new Error("Anthropic API Key is missing from the vault.");
                const messagesForApi = recentHistory.map(({ role, content }) => ({
                    role: role === 'model' ? 'assistant' : 'user',
                    content,
                }));
                const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeys.anthropic, 'anthropic-version': '2023-06-01' },
                    body: JSON.stringify({ model: 'claude-3-opus-20240229', max_tokens: 4096, system: systemPrompt, messages: [...messagesForApi, { role: 'user', content: userPrompt }] })
                });
                if (!anthropicRes.ok) { const e = await anthropicRes.json(); throw new Error(`Anthropic: ${e.error.message}`); }
                const anthropicData = await anthropicRes.json();
                return anthropicData.content[0].text;
            }
            
            default:
              throw new Error("Invalid model selected");
        }
    }, [aiPersona, aiProtocols, apiKeys]);

    const handleSend = async () => {
        if (isLoading || !input.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const model = await routePrompt(input);
            // Add temporary "thinking" message
            setChatHistory(prev => [...prev, { role: 'model', content: '...', model: model }]);
            
            const responseContent = await getAiResponse(input, model, newHistory);
            const modelMessage: ChatMessage = { role: 'model', content: responseContent, model };
            
            // Replace "thinking" message with the actual response
            setChatHistory(prev => [...newHistory, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}` };
            setChatHistory(prev => [...newHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-gray-900/50 border border-white/10 rounded-lg">
            {(!apiKeys.openai || !apiKeys.anthropic) && <MissingKeysWarning />}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => (
                    msg.role === 'user' ? (
                        <div key={index} className="flex justify-end items-start gap-3">
                            <div className="bg-cyan-600/50 rounded-lg p-3 max-w-lg">
                                <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <UserCircleIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                        </div>
                    ) : (
                        <div key={index} className="flex justify-start items-start gap-3">
                            <BibIcon className="w-8 h-8 text-fuchsia-400 flex-shrink-0" />
                            <div className="bg-gray-800/60 rounded-lg p-3 max-w-lg">
                                {/* FIX: To render a component dynamically, it must be assigned to a variable with a PascalCase name. */}
                                {(() => {
                                    if (msg.model && modelInfo[msg.model]) {
                                        const { Icon, color, name } = modelInfo[msg.model];
                                        return (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon className={`w-4 h-4 ${color}`} />
                                                <span className={`text-xs font-bold ${color}`}>{name}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {msg.content === '...' ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <SpinnerIcon className="w-5 h-5" />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                    <pre className="text-gray-300 whitespace-pre-wrap font-sans">{msg.content}</pre>
                                )}
                            </div>
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/10">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message BiB!..."
                        className="flex-1 bg-gray-800/50 border border-white/10 rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;