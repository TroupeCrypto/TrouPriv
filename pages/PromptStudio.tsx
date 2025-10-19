
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Use relative paths for local modules
import { Page } from '../types';
// FIX: Use relative paths for local modules
import { CodeIcon, SpinnerIcon, TrashIcon, SparklesIcon } from '../components/icons/Icons';
// FIX: Use relative paths for local modules
import { get, set } from '../utils/storage';

interface ResponseHistoryItem {
    id: number;
    prompt: string;
    response: string;
}

const PromptStudio: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [prompt, setPrompt] = useState(() => get('promptStudio_prompt', 'Write a story about a psychedelic turtle that discovers the meaning of the universe.'));
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
    const [responseHistory, setResponseHistory] = useState<ResponseHistoryItem[]>(() => get('promptStudio_history', []));
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

    // State for prompt suggestions
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [suggestionCategory, setSuggestionCategory] = useState<Page | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const appCategories = [Page.Dashboard, Page.Assets, Page.Business, Page.Web3Tools, Page.Social, Page.Vault];


    // Auto-save prompt to localStorage
    useEffect(() => {
        setSaveStatus('saving');
        const handler = setTimeout(() => {
            set('promptStudio_prompt', prompt);
            setSaveStatus('saved');
        }, 1000); // 1-second debounce

        return () => clearTimeout(handler);
    }, [prompt]);

    // Save history to localStorage
    useEffect(() => {
        set('promptStudio_history', responseHistory);
    }, [responseHistory]);

    // Reset saved status message
    useEffect(() => {
        if (saveStatus === 'saved') {
            const timer = setTimeout(() => setSaveStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);
    
    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
    };

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Prompt cannot be empty.");
            return;
        }
        setIsLoading(true);
        setError('');
        setResponse('');
        setSelectedHistoryId(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
            });
            const newResponse = result.text;
            setResponse(newResponse);

            const newHistoryItem: ResponseHistoryItem = {
                id: Date.now(),
                prompt,
                response: newResponse
            };
            setResponseHistory(prev => [newHistoryItem, ...prev]);

        } catch (err) {
            console.error(err);
            setError('An error occurred while generating content. Please check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const getSaveStatusIndicator = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="text-gray-400 text-xs italic">Saving...</span>;
            case 'saved':
                return <span className="text-green-400 text-xs font-semibold">✓ Saved</span>;
            default:
                return <span className="text-gray-500 text-xs"></span>;
        }
    };

    const handleLoadHistory = (item: ResponseHistoryItem) => {
        setPrompt(item.prompt);
        setResponse(item.response);
        setSelectedHistoryId(item.id);
    };

    const handleDeleteHistory = (id: number) => {
        setResponseHistory(prev => prev.filter(item => item.id !== id));
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear the entire prompt history?")) {
            setResponseHistory([]);
        }
    };

    const handleGenerateSuggestions = async (category: Page) => {
        setSuggestionCategory(category);
        setIsGeneratingSuggestions(true);
        setSuggestionError(null);
        setSuggestions([]);

        const generationPrompt = `Generate 4 diverse, creative, and useful prompts for the '${category}' section of a personal finance and asset management application called TrouPrive. The prompts should be actionable and interesting for a user. Return the prompts as a JSON array of strings. Example format: ["prompt 1", "prompt 2", "prompt 3", "prompt 4"]`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generationPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            });
            const result = JSON.parse(response.text);
            setSuggestions(result);
        } catch (err) {
            console.error("Suggestion generation failed:", err);
            setSuggestionError("Could not generate suggestions. Please try again.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        setIsSuggestionModalOpen(false);
        setSuggestionCategory(null);
        setSuggestions([]);
        setSuggestionError(null);
    };

    const handleCloseSuggestionModal = () => {
        setIsSuggestionModalOpen(false);
        setSuggestionCategory(null);
        setSuggestions([]);
        setSuggestionError(null);
    }


    const SuggestionModal = () => {
        if (!isSuggestionModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                 <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full p-6 text-center animate-pop-in">
                    <h3 className="text-xl font-bold text-white mb-2">Generate Prompt Ideas</h3>
                    <p className="text-gray-400 mb-6">Select a category to get some creative starting points.</p>
                    
                    {!suggestionCategory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {appCategories.map(cat => (
                                <button key={cat} onClick={() => handleGenerateSuggestions(cat)} className="p-4 bg-gray-800/50 hover:bg-gray-700/80 rounded-lg transition-colors text-white font-semibold">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="space-y-3 text-left">
                            <button onClick={() => setSuggestionCategory(null)} className="text-sm text-cyan-400 hover:underline mb-2">&larr; Back to Categories</button>
                            {isGeneratingSuggestions && (
                                <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
                                    <SpinnerIcon className="w-6 h-6" />
                                    <span>Generating ideas for {suggestionCategory}...</span>
                                </div>
                            )}
                            {suggestionError && <p className="text-red-400">{suggestionError}</p>}
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full p-3 bg-gray-800/50 hover:bg-fuchsia-900/40 rounded-lg transition-colors text-gray-300 hover:text-white text-sm text-left">
                                    {s}
                                </button>
                            ))}
                         </div>
                    )}

                    <button onClick={handleCloseSuggestionModal} className="mt-6 px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors">
                        Close
                    </button>
                 </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes pop-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-pop-in { animation: pop-in 0.2s ease-out forwards; }
            `}</style>
            <header className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <CodeIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Prompt Studio</h1>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Page.WebDev)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web-Dev</button>
                            <span className="text-gray-500">|</span>
                            {getSaveStatusIndicator()}
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 flex flex-col min-h-[50vh]">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-white">Prompt</h2>
                        <button onClick={() => setIsSuggestionModalOpen(true)} className="flex items-center gap-1 text-sm text-cyan-400 hover:text-white transition-colors">
                            <SparklesIcon className="w-4 h-4" />
                            Suggest
                        </button>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={handlePromptChange}
                        placeholder="Enter your prompt here..."
                        className="flex-grow w-full bg-gray-900/70 border border-white/10 rounded-md p-4 text-white font-mono text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none"
                        aria-label="Prompt input"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                Generating...
                            </>
                        ) : (
                            'Generate'
                        )}
                    </button>
                </div>

                {/* Output Panel */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 flex flex-col min-h-[50vh]">
                    <h2 className="text-lg font-semibold text-white mb-2">Result</h2>
                    <div className="flex-grow bg-gray-900/70 border border-white/10 rounded-md p-4 overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <SpinnerIcon className="w-8 h-8" />
                            </div>
                        )}
                        {error && <p className="text-red-400">{error}</p>}
                        {response && !isLoading && (
                            <div className="text-white whitespace-pre-wrap font-mono text-sm">{response}</div>
                        )}
                        {!isLoading && !error && !response && (
                            <p className="text-gray-500 text-center self-center pt-24">Generated content will appear here.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* History Panel */}
            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-white">History</h2>
                    {responseHistory.length > 0 && (
                        <button 
                            onClick={handleClearHistory} 
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <TrashIcon className="w-3 h-3" />
                            Clear All
                        </button>
                    )}
                </div>
                <div className="flex-grow max-h-60 overflow-y-auto pr-2">
                    {responseHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Your generation history will appear here.</p>
                    ) : (
                        <div className="space-y-2">
                            {responseHistory.map(item => (
                                <div 
                                    key={item.id} 
                                    className={`p-3 rounded-md transition-all border ${selectedHistoryId === item.id ? 'bg-fuchsia-900/30 border-fuchsia-500/50' : 'bg-gray-800/50 border-transparent hover:border-white/20'}`}
                                >
                                    <p className="text-sm font-semibold text-gray-300 truncate">{item.prompt}</p>
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button onClick={() => handleLoadHistory(item)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
                                            Load
                                        </button>
                                        <button onClick={() => handleDeleteHistory(item.id)} className="p-1 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <SuggestionModal />
        </div>
    );
};

export default PromptStudio;