
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Page, VaultItem } from '../types';
import { SparklesIcon, SpinnerIcon, BibIcon, KeyIcon, CopyIcon, OpenAIIcon, AnthropicIcon, SettingsIcon, TrashIcon } from '../components/icons/Icons';
import { useVault } from '../contexts/VaultContext';
import { useMasterPassword } from '../contexts/MasterPasswordContext';
import * as storage from '../utils/storage';

type ProviderID = 'gemini' | 'openai' | 'anthropic';

interface ProviderState {
    id: ProviderID;
    name: string;
    Icon: React.FC<{ className?: string }>;
    prompt: string;
    response: string;
    isLoading: boolean;
    error: string | null;
    color: string;
    temperature: number;
    maxTokens: number;
    systemInstruction: string;
}

interface AIHistoryItem {
    id: number;
    providerId: ProviderID;
    prompt: string;
    response: string;
}

// FIX: Added modelInfo to provide icon and color data for history items.
const modelInfo: Record<ProviderID, { Icon: React.FC<{className?: string}>, color: string }> = {
    gemini: { Icon: SparklesIcon, color: 'fuchsia' },
    openai: { Icon: OpenAIIcon, color: 'cyan' },
    anthropic: { Icon: AnthropicIcon, color: 'amber' },
};

const initialProviders: Record<ProviderID, ProviderState> = {
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        Icon: SparklesIcon,
        prompt: '',
        response: '',
        isLoading: false,
        error: null,
        color: 'fuchsia',
        temperature: 0.7,
        maxTokens: 2048,
        systemInstruction: '',
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        Icon: OpenAIIcon,
        prompt: '',
        response: '',
        isLoading: false,
        error: null,
        color: 'cyan',
        temperature: 0.7,
        maxTokens: 2048,
        systemInstruction: '',
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        Icon: AnthropicIcon,
        prompt: '',
        response: '',
        isLoading: false,
        error: null,
        color: 'amber',
        temperature: 0.7,
        maxTokens: 2048,
        systemInstruction: '',
    },
};

const ProviderSettings: React.FC<{
    provider: ProviderState;
    setProviderState: (update: Partial<ProviderState>) => void;
}> = ({ provider, setProviderState }) => {
    return (
        <div className="p-4 border-t border-white/10 space-y-4">
             <div>
                <label className="text-xs font-semibold text-gray-300 flex justify-between">
                    <span>Creativity (Temperature)</span>
                    <span className="font-mono text-cyan-400">{provider.temperature.toFixed(2)}</span>
                </label>
                <input
                    type="range" min="0" max="1" step="0.01"
                    value={provider.temperature}
                    onChange={e => setProviderState({ temperature: parseFloat(e.target.value) })}
                    className="mt-1 w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-300">Response Length (Max Tokens)</label>
                <input
                    type="number" min="1"
                    value={provider.maxTokens}
                    onChange={e => setProviderState({ maxTokens: parseInt(e.target.value, 10) || 1 })}
                    className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                />
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-300">System Instruction / Persona</label>
                <textarea
                    value={provider.systemInstruction}
                    onChange={e => setProviderState({ systemInstruction: e.target.value })}
                    placeholder={`e.g., You are a helpful assistant that speaks like a pirate.`}
                    rows={3}
                    className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-y"
                />
            </div>
        </div>
    );
};

const AiProviderCard: React.FC<{
    provider: ProviderState;
    setProviderState: (update: Partial<ProviderState>) => void;
    onSend: (provider: ProviderState) => Promise<void>;
    disabled?: boolean;
    disabledMessage?: string;
    isKeyFromVault?: boolean;
}> = ({ provider, setProviderState, onSend, disabled = false, disabledMessage = "This provider is unavailable.", isKeyFromVault = false }) => {
    const [copied, setCopied] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(provider.response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`bg-gray-900/50 border border-white/10 rounded-lg flex flex-col h-full ring-2 ring-transparent transition-shadow hover:ring-${provider.color}-500/50 relative`}>
            {disabled && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center p-4 text-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <KeyIcon className="w-8 h-8 text-gray-500" />
                        <p className="text-gray-400 font-semibold">{disabledMessage}</p>
                    </div>
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <provider.Icon className={`w-6 h-6 text-${provider.color}-400`} />
                        <h3 className="text-lg font-bold text-white">{provider.name}</h3>
                        {isKeyFromVault && (
                            <span title="API Key loaded from Vault" className="bg-cyan-900/50 text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <KeyIcon className="w-3 h-3" />
                                VAULT
                            </span>
                        )}
                    </div>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                        <SettingsIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="relative flex-grow bg-gray-900/70 border border-white/10 rounded-md p-2 my-2 overflow-y-auto min-h-[200px]">
                    {provider.isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <SpinnerIcon className="w-8 h-8" />
                        </div>
                    )}
                    {provider.error && <pre className="text-red-400 text-xs whitespace-pre-wrap font-mono">{provider.error}</pre>}
                    <pre className="text-white whitespace-pre-wrap font-mono text-sm">{provider.response}</pre>
                    {provider.response && !provider.isLoading && (
                        <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                            {copied ? <span className="text-xs px-1">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    )}
                </div>
                <textarea
                    value={provider.prompt}
                    onChange={e => setProviderState({ prompt: e.target.value })}
                    placeholder={`Prompt ${provider.name}...`}
                    className="w-full h-24 bg-gray-800/50 border border-white/10 rounded-md p-2 text-white font-mono text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none mt-2"
                />
                <button
                    onClick={() => onSend(provider)}
                    disabled={provider.isLoading || disabled}
                    className={`mt-2 w-full bg-${provider.color}-500/80 hover:bg-${provider.color}-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2`}
                >
                    {provider.isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Send'}
                </button>
            </div>
            {isSettingsOpen && <ProviderSettings provider={provider} setProviderState={setProviderState} />}
        </div>
    );
};

interface AIStudioProps {
    setPage: (page: Page) => void;
    vaultItems: VaultItem[];
}

const AIStudio: React.FC<AIStudioProps> = ({ setPage, vaultItems }) => {
    const [universalPrompt, setUniversalPrompt] = useState(() => storage.get('aiStudio_universalPrompt', ''));
    const [providers, setProviders] = useState<Record<ProviderID, ProviderState>>(() => {
        const savedProviders = storage.get('aiStudio_providers', null);
        if (savedProviders) {
            return {
                gemini: { ...initialProviders.gemini, ...savedProviders.gemini },
                openai: { ...initialProviders.openai, ...savedProviders.openai },
                anthropic: { ...initialProviders.anthropic, ...savedProviders.anthropic },
            };
        }
        return initialProviders;
    });
    const [history, setHistory] = useState<AIHistoryItem[]>(() => storage.get('aiStudio_history', []));
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    const { decryptedItems } = useVault();
    const { isUnlocked, isVerifying, verificationError, verifyAndSetPassword } = useMasterPassword();
    
    useEffect(() => {
        storage.set('aiStudio_universalPrompt', universalPrompt);
    }, [universalPrompt]);
    
    useEffect(() => {
        storage.set('aiStudio_providers', providers);
    }, [providers]);
    
    useEffect(() => {
        storage.set('aiStudio_history', history);
    }, [history]);

    const apiKeys = useMemo(() => {
        if (!isUnlocked) return {};
        const keys: Record<string, string> = {};
        
        decryptedItems.forEach(item => {
            if (item.type === 'apiKey' && typeof item.decryptedContent === 'object' && item.decryptedContent && 'key' in item.decryptedContent) {
                const keyContent = (item.decryptedContent as {key: string}).key;
                const name = item.name.toUpperCase();
                const website = item.website?.toLowerCase() || '';

                if (name.includes('GEMINI') || name.includes('GOOGLE') || website.includes('google') || website.includes('aistudio')) {
                    keys.gemini = keyContent;
                }
                if (name.includes('OPEN_AI') || website.includes('openai')) {
                    keys.openai = keyContent;
                }
                if (name.includes('ANTHROPIC_AI') || website.includes('anthropic')) {
                    keys.anthropic = keyContent;
                }
            }
        });
        return keys;
    }, [isUnlocked, decryptedItems]);
    
    const needsUnlock = (!apiKeys.openai || !apiKeys.anthropic) && !isUnlocked;

    const handleUnlock = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
        if (passwordInput) {
            const success = await verifyAndSetPassword(passwordInput.value);
            if (!success) {
                passwordInput.value = '';
            }
        }
    }, [verifyAndSetPassword]);

    const updateProviderState = useCallback((id: ProviderID, update: Partial<ProviderState>) => {
        setProviders(prev => ({
            ...prev,
            [id]: { ...prev[id], ...update },
        }));
    }, []);

    const callApi = useCallback(async (provider: ProviderState) => {
        const { id: providerId, prompt, temperature, maxTokens, systemInstruction } = provider;
        updateProviderState(providerId, { isLoading: true, error: null, response: '' });
        try {
            let resultText = '';
            if (providerId === 'gemini') {
                const apiKey = apiKeys.gemini || process.env.API_KEY;
                if (!apiKey) throw new Error("Google Gemini API Key is not configured. Please add it to your vault or set the environment variable.");

                const ai = new GoogleGenAI({ apiKey });
                const result = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: prompt,
                    config: {
                        temperature,
                        maxOutputTokens: maxTokens,
                        thinkingConfig: { thinkingBudget: Math.floor(maxTokens / 2) },
                        ...(systemInstruction && { systemInstruction }),
                    }
                });
                resultText = result.text;
            } else if (providerId === 'openai') {
                if (!apiKeys.openai) throw new Error("OpenAI API Key is not loaded from the vault.");
                const messages = [];
                if (systemInstruction) {
                    messages.push({ role: 'system', content: systemInstruction });
                }
                messages.push({ role: 'user', content: prompt });

                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeys.openai}` },
                    body: JSON.stringify({ 
                        model: 'gpt-4o', 
                        messages,
                        temperature,
                        max_tokens: maxTokens
                    })
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(`OpenAI API Error: ${errorData.error.message}`);
                }
                const data = await res.json();
                resultText = data.choices[0].message.content;
            } else if (providerId === 'anthropic') {
                if (!apiKeys.anthropic) throw new Error("Anthropic API Key is not loaded from the vault.");
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeys.anthropic, 'anthropic-version': '2023-06-01' },
                    body: JSON.stringify({ 
                        model: 'claude-3-opus-20240229', 
                        max_tokens: maxTokens, 
                        messages: [{ role: 'user', content: prompt }],
                        temperature,
                        ...(systemInstruction && { system: systemInstruction }),
                    })
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(`Anthropic API Error: ${errorData.error.message}`);
                }
                const data = await res.json();
                resultText = data.content[0].text;
            }
            updateProviderState(providerId, { response: resultText.trim() });
            const newHistoryItem: AIHistoryItem = {
                id: Date.now(),
                providerId,
                prompt,
                response: resultText.trim()
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 50));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            updateProviderState(providerId, { error: message });
        } finally {
            updateProviderState(providerId, { isLoading: false });
        }
    }, [apiKeys, updateProviderState]);
    
    const handleSendUniversal = () => {
        if (!universalPrompt) return;
        Object.values(providers).forEach((p: ProviderState) => {
            const providerIsDisabled = (p.id === 'openai' && !apiKeys.openai) || (p.id === 'anthropic' && !apiKeys.anthropic);
            updateProviderState(p.id, { prompt: universalPrompt });
            if (providerIsDisabled) {
                updateProviderState(p.id, { error: "Cannot send prompt: API Key not loaded from vault." });
                return;
            }
            callApi({ ...p, prompt: universalPrompt });
        });
    };
    
    const handleLoadHistory = (item: AIHistoryItem) => {
        updateProviderState(item.providerId, { prompt: item.prompt, response: item.response });
    };

    const handleDeleteHistory = (id: number) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear the entire AI Studio history?")) {
            setHistory([]);
        }
    };

    const filteredHistory = useMemo(() => {
        if (!historySearchTerm) return history;
        const lowercasedFilter = historySearchTerm.toLowerCase();
        return history.filter(item => 
            item.prompt.toLowerCase().includes(lowercasedFilter) ||
            item.response.toLowerCase().includes(lowercasedFilter)
        );
    }, [history, historySearchTerm]);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <BibIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">AI Studio</h1>
                        <button onClick={() => setPage(Page.Persona)} className="text-sm text-cyan-400 hover:underline">&larr; Back to BiB!</button>
                    </div>
                </div>
            </header>
            
            {needsUnlock && (
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <KeyIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold text-white">Load API Keys from Vault</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        To use OpenAI and Anthropic, enter your master password to decrypt and load the required API keys from your vault.
                    </p>
                    <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row items-start gap-2">
                        <div className="w-full">
                            <input
                                type="password"
                                name="password"
                                placeholder="Master Password"
                                className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                autoComplete="current-password"
                                required
                            />
                            {verificationError && <p className="text-red-400 text-xs mt-1">{verificationError}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                        >
                            {isVerifying ? <SpinnerIcon className="w-5 h-5"/> : 'Unlock & Load'}
                        </button>
                    </form>
                </div>
            )}
            
            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 space-y-2">
                <h2 className="text-lg font-semibold text-white">Universal Prompt</h2>
                <textarea
                    value={universalPrompt}
                    onChange={e => setUniversalPrompt(e.target.value)}
                    placeholder="Send the same prompt to all available models..."
                    rows={3}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-md p-2 text-white font-mono text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-y"
                />
                <button
                    onClick={handleSendUniversal}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Send to All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AiProviderCard 
                    provider={providers.gemini}
                    setProviderState={update => updateProviderState('gemini', update)}
                    onSend={callApi}
                    isKeyFromVault={!!apiKeys.gemini}
                />
                <AiProviderCard
                    provider={providers.openai}
                    setProviderState={update => updateProviderState('openai', update)}
                    onSend={callApi}
                    disabled={!apiKeys.openai}
                    disabledMessage="OpenAI API Key not found in Vault."
                    isKeyFromVault={!!apiKeys.openai}
                />
                <AiProviderCard
                    provider={providers.anthropic}
                    setProviderState={update => updateProviderState('anthropic', update)}
                    onSend={callApi}
                    disabled={!apiKeys.anthropic}
                    disabledMessage="Anthropic API Key not found in Vault."
                    isKeyFromVault={!!apiKeys.anthropic}
                />
            </div>
            
             <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <h2 className="text-lg font-semibold text-white">History</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={historySearchTerm}
                            onChange={e => setHistorySearchTerm(e.target.value)}
                            className="w-48 bg-gray-800/50 border border-white/10 rounded-md px-2 py-1 text-white text-xs focus:ring-1 focus:ring-cyan-500"
                        />
                         {history.length > 0 && (
                            <button onClick={handleClearHistory} className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
                                <TrashIcon className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {filteredHistory.length > 0 ? filteredHistory.map(item => {
                         const model = modelInfo[item.providerId as keyof typeof modelInfo];
                         return (
                            <div key={item.id} className={`p-3 rounded-md bg-gray-800/50 border border-transparent hover:border-${model.color}-500/30`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <model.Icon className={`w-4 h-4 text-${model.color}-400`}/>
                                        <p className="text-sm font-semibold text-gray-300 truncate">{item.prompt}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleLoadHistory(item)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Load</button>
                                        <button onClick={() => handleDeleteHistory(item.id)} className="p-1 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                         )
                    }) : <p className="text-sm text-gray-500 text-center py-8">No history entries found.</p>}
                </div>
            </div>
        </div>
    );
};

export default AIStudio;
