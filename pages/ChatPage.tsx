import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ChatMessage, AIPersona, AIProtocol, VaultItem } from '../types';
import { useVault } from '../contexts/VaultContext';
import { KeyIcon, BibIcon, SpinnerIcon, UserCircleIcon, PaperclipIcon, XIcon, FileTextIcon } from '../components/icons/Icons';
import { useMasterPassword } from '../contexts/MasterPasswordContext';
import { getGeminiApiKeyOrThrow } from '../utils/env';

interface ChatPageProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  aiPersona: AIPersona;
  aiProtocols: AIProtocol[];
  vaultItems: VaultItem[];
}

const MissingKeysWarning: React.FC = () => (
    <div className="p-2 bg-yellow-900/50 border-b-2 border-yellow-600/50 text-center text-sm text-yellow-300">
        <KeyIcon className="w-4 h-4 inline-block mr-2" />
        OpenAI or Anthropic API keys are missing. Add them to your <span className="font-bold">Vault</span> for full multi-model functionality.
    </div>
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
    });
};

// Helper function to detect if a file is a text-based code file
const isCodeFile = (file: File): boolean => {
    const codeExtensions = ['.md', '.tsx', '.ts', '.js', '.jsx', '.py', '.css', '.html', '.json', '.xml', '.txt', '.csv', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.rb', '.php', '.sh', '.yml', '.yaml'];
    return codeExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || 
           file.type.startsWith('text/') || 
           file.type === 'application/json' ||
           file.type === 'application/xml';
};


const ChatPage: React.FC<ChatPageProps> = ({ chatHistory, setChatHistory, aiPersona, aiProtocols, vaultItems }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { decryptedItems } = useVault();
    const { isUnlocked, isVerifying, verificationError, verifyAndSetPassword } = useMasterPassword();

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

    const hasThirdPartyKeysInVault = useMemo(() => {
        return vaultItems.some(item => 
            item.type === 'apiKey' && 
            (
                item.name.toLowerCase().includes('openai') || item.website?.toLowerCase().includes('openai') ||
                item.name.toLowerCase().includes('anthropic') || item.website?.toLowerCase().includes('anthropic')
            )
        );
    }, [vaultItems]);
    
    const needsUnlock = !isUnlocked && hasThirdPartyKeysInVault;


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    // Create preview URLs for image files
    useEffect(() => {
        const objectUrls: string[] = [];
        const previews: string[] = [];
        
        filesToUpload.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const objectUrl = URL.createObjectURL(file);
                objectUrls.push(objectUrl);
                previews.push(objectUrl);
            } else {
                previews.push('');
            }
        });
        
        setFilePreviewUrls(previews);

        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [filesToUpload]);
    
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

    const routePrompt = useCallback(async (userPrompt: string): Promise<'Gemini' | 'OpenAI' | 'Anthropic'> => {
        if (filesToUpload.length > 0) {
            return 'Gemini'; // Force Gemini for multimodal input for now
        }
        const apiKey = getGeminiApiKeyOrThrow();
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Classify the following user prompt into one of these categories: "Conceptualization & Building", "Planning & Coding", "Styling & Design". Respond with only the category name. Prompt: "${userPrompt}"`;
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] } });
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
    }, [apiKeys.openai, apiKeys.anthropic, filesToUpload]);

    const getAiResponse = useCallback(async (userPrompt: string, model: 'Gemini' | 'OpenAI' | 'Anthropic', currentHistory: ChatMessage[], files: File[]): Promise<string> => {
        const activeProtocols = aiProtocols.filter(p => p.isActive).map(p => `- ${p.content}`).join('\n');
        
        const systemPrompt = `You are ${aiPersona.name}. Your Core Persona: ${aiPersona.corePersona}. Strictly adhere to the following active protocols:\n${activeProtocols || 'No active protocols.'}`;
        
        const recentHistory = currentHistory.slice(-6);

        switch(model) {
            case 'Gemini': {
                // Check if all files are supported types
                for (const file of files) {
                    if (!file.type.startsWith('image/') && 
                        !isCodeFile(file) &&
                        !file.type.startsWith('application/zip') &&
                        !file.type.startsWith('application/x-zip-compressed') &&
                        !file.type.startsWith('application/pdf')) {
                        throw new Error(`Gemini can currently only process image files, text/code files (e.g., .md, .tsx, .ts, .py, .css), zip files, and PDFs. Unsupported file type: ${file.type} for ${file.name}`);
                    }
                }

                const apiKey = getGeminiApiKeyOrThrow();
                const geminiAi = new GoogleGenAI({ apiKey });
                
                const contentsForGemini = [
                    ...recentHistory.map(m => ({
                        role: m.role,
                        parts: [{ text: m.content }]
                    })),
                ];
                
                const userParts: any[] = [{ text: userPrompt }];
                
                // Add all files to the parts
                for (const file of files) {
                    const base64Data = await fileToBase64(file);
                    userParts.push({ inlineData: { mimeType: file.type, data: base64Data } });
                }

                const result = await geminiAi.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: [...contentsForGemini, { role: 'user', parts: userParts }],
                    config: {
                      systemInstruction: systemPrompt
                    },
                });
                return result.text;
            }
            
            case 'OpenAI': {
                if (files.length > 0) throw new Error("File uploads are currently only supported with the Gemini model.");
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
                if (!openaiRes.ok) {
                    let errorMessage = `OpenAI API error (${openaiRes.status} ${openaiRes.statusText})`;
                    try {
                        const errorData = await openaiRes.json();
                        if (errorData?.error?.message) {
                            errorMessage = `OpenAI: ${errorData.error.message}`;
                        }
                    } catch (parseError) {
                        // Failed to parse error response, use status text
                    }
                    throw new Error(errorMessage);
                }
                const openaiData = await openaiRes.json();
                return openaiData.choices[0].message.content;
            }

            case 'Anthropic': {
                if (files.length > 0) throw new Error("File uploads are currently only supported with the Gemini model.");
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
                if (!anthropicRes.ok) {
                    let errorMessage = `Anthropic API error (${anthropicRes.status} ${anthropicRes.statusText})`;
                    try {
                        const errorData = await anthropicRes.json();
                        if (errorData?.error?.message) {
                            errorMessage = `Anthropic: ${errorData.error.message}`;
                        }
                    } catch (parseError) {
                        // Failed to parse error response, use status text
                    }
                    throw new Error(errorMessage);
                }
                const anthropicData = await anthropicRes.json();
                return anthropicData.content[0].text;
            }
            
            default:
              throw new Error("Invalid model selected");
        }
    }, [aiPersona, aiProtocols, apiKeys]);

    const generateImage = async (prompt: string) => {
        const userMessage: ChatMessage = { role: 'user', content: prompt };
        const newHistoryWithUser = [...chatHistory, userMessage];
        setChatHistory(newHistoryWithUser);
    
        setChatHistory(prev => [...prev, { role: 'model', content: '...', model: 'Gemini' }]);
        
        try {
            const apiKey = getGeminiApiKeyOrThrow();
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
    
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    const modelMessage: ChatMessage = {
                        role: 'model',
                        content: `Here's the image you requested based on the prompt: "${prompt}"`,
                        imageUrl: imageUrl,
                        model: 'Gemini',
                    };
                    setChatHistory(prev => [...newHistoryWithUser, modelMessage]);
                    return;
                }
            }
            throw new Error("The AI did not return an image. Try rephrasing your command.");
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error.'}` };
            setChatHistory(prev => [...newHistoryWithUser, errorMessage]);
        }
    };
    
    const handleSend = async () => {
        if (isLoading || (!input.trim() && filesToUpload.length === 0)) return;
    
        const currentInput = input;
        const currentFiles = [...filesToUpload];
        
        setIsLoading(true);
        setInput('');
        setFilesToUpload([]);

        const isImageCommand = /^(generate|create|make) an? (image|picture|artwork)|^\/imagine/i.test(currentInput);
        if (isImageCommand) {
            await generateImage(currentInput);
            setIsLoading(false);
            return;
        }

        let userMessageContent = currentInput;
        if (currentFiles.length > 0) {
            const fileNames = currentFiles.map(f => f.name).join(', ');
            userMessageContent = `[Files attached: ${fileNames}]\n\n${currentInput}`;
        }
        const userMessage: ChatMessage = { role: 'user', content: userMessageContent };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
    
        try {
            const model = await routePrompt(currentInput);
            setChatHistory(prev => [...prev, { role: 'model', content: '...', model: model }]);
            
            const responseContent = await getAiResponse(currentInput, model, newHistory, currentFiles);
            const modelMessage: ChatMessage = { role: 'model', content: responseContent, model };
            
            setChatHistory(prev => [...newHistory, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', content: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}` };
            setChatHistory(prev => [...newHistory, errorMessage]);
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


    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-gray-900/50 border border-white/10 rounded-lg">
            {!needsUnlock && (!apiKeys.openai || !apiKeys.anthropic) && <MissingKeysWarning />}
            
            {needsUnlock && (
                <div className="p-4 bg-yellow-900/30 border-b-2 border-yellow-600/50">
                    <div className="flex items-center gap-2 mb-2">
                        <KeyIcon className="w-5 h-5 text-yellow-300" />
                        <h2 className="text-lg font-semibold text-yellow-200">Unlock Vault for Full AI Capabilities</h2>
                    </div>
                    <p className="text-sm text-yellow-200 mb-4">
                        To enable other AI models like OpenAI and Anthropic, enter your master password to decrypt and load the required API keys from your vault.
                    </p>
                    <form onSubmit={handleUnlock} className="flex items-start gap-2">
                        <div className="flex-grow">
                            <input
                                type="password"
                                name="password"
                                placeholder="Master Password"
                                className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                            {verificationError && <p className="text-red-400 text-xs mt-1">{verificationError}</p>}
                        </div>
                        <button type="submit" disabled={isVerifying} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            {isVerifying ? <SpinnerIcon className="w-5 h-5"/> : 'Unlock'}
                        </button>
                    </form>
                </div>
            )}
            
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isLoadingMessage = msg.content === '...' && index === chatHistory.length - 1;

                    return (
                        <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {!isUser && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <BibIcon className="w-5 h-5 text-cyan-400" />
                                </div>
                            )}
                            <div className={`p-3 rounded-lg max-w-lg ${isUser ? 'bg-fuchsia-600/50' : 'bg-gray-800/50'}`}>
                                {!isUser && (
                                    <p className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1">
                                        BiB!
                                    </p>
                                )}
                                {isLoadingMessage ? (
                                    <div className="flex items-center gap-2">
                                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                                        <span className="text-gray-400 text-sm">Thinking...</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-200 whitespace-pre-wrap text-sm">{msg.content}</div>
                                )}
                                {msg.imageUrl && (
                                    <img src={msg.imageUrl} alt="Generated content" className="mt-2 rounded-lg max-w-xs" />
                                )}
                            </div>
                            {isUser && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <UserCircleIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
                {filesToUpload.length > 0 && (
                    <div className="mb-2 space-y-2 max-h-48 overflow-y-auto">
                        <style>{`
                            @keyframes fade-in-fast { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                            .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out; }
                        `}</style>
                        {filesToUpload.map((file, index) => (
                            <div key={index} className="p-2 bg-gray-800/50 rounded-md flex items-center justify-between animate-fade-in-fast">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {filePreviewUrls[index] ? (
                                        <img src={filePreviewUrls[index]} alt="Preview" className="w-10 h-10 object-cover rounded" />
                                    ) : (
                                        <FileTextIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className="overflow-hidden">
                                        <p className="text-sm text-gray-300 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFilesToUpload(files => files.filter((_, i) => i !== index))}
                                    className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white flex-shrink-0"
                                    aria-label="Remove file"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative flex items-center">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white"
                        aria-label="Attach file"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                            if (e.target.files) {
                                const newFiles = Array.from(e.target.files);
                                const totalFiles = filesToUpload.length + newFiles.length;
                                if (totalFiles > 50) {
                                    alert(`You can only upload up to 50 files at once. You currently have ${filesToUpload.length} files selected.`);
                                    return;
                                }
                                setFilesToUpload(prev => [...prev, ...newFiles]);
                            }
                        }}
                        multiple
                        accept="image/*,text/*,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.zip,.pdf"
                        className="hidden"
                    />
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Chat with BiB!..."
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none max-h-48 pr-12"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && filesToUpload.length === 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white bg-fuchsia-600 rounded-full disabled:bg-gray-600 hover:bg-fuchsia-500 transition-colors"
                        aria-label="Send message"
                    >
                        {isLoading ? <SpinnerIcon className="w-5 h-5" /> : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
