
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AIMemoryItem, AIMemoryItemType } from '../types';
import { BookOpenIcon, FileUploadIcon, SpinnerIcon, TrashIcon, FileTextIcon, LinkIcon } from '../components/icons/Icons';
import { getGeminiApiKeyOrThrow } from '../utils/env';

interface LearningPageProps {
  aiMemory: AIMemoryItem[];
  setAiMemory: React.Dispatch<React.SetStateAction<AIMemoryItem[]>>;
}

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};

const LearningPage: React.FC<LearningPageProps> = ({ aiMemory, setAiMemory }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const addMemoryItem = (type: AIMemoryItemType, name: string, summary: string, source: string) => {
        const newItem: AIMemoryItem = {
            id: `mem-${Date.now()}`,
            type,
            name,
            contentSummary: summary,
            ingestedAt: Date.now(),
            source,
        };
        setAiMemory(prev => [newItem, ...prev]);
    };

    const handleFileIngestion = useCallback(async (files: FileList) => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProcessingError(null);

        const file = files[0];
        try {
            if (file.type.startsWith('text/')) {
                const textContent = await fileToText(file);
                const textSnippet = textContent.slice(0, 4000); 

                const apiKey = getGeminiApiKeyOrThrow();
            const ai = new GoogleGenAI({ apiKey });
                const prompt = `Summarize the key information in the following document snippet in one concise sentence for an AI's memory log. Snippet: "${textSnippet}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] } });
                
                addMemoryItem('file', file.name, response.text, `local file (${(file.size / 1024).toFixed(1)} KB)`);
            } else {
                const summary = `Ingested non-text file. Content analysis is not supported for this file type.`;
                addMemoryItem('file', file.name, summary, `local file (${(file.size / 1024).toFixed(1)} KB)`);
            }
        } catch (err) {
            console.error("File ingestion failed:", err);
            setProcessingError(err instanceof Error ? err.message : "An unknown error occurred during file processing.");
        } finally {
            setIsProcessing(false);
        }
    }, [setAiMemory]);

    const handleUrlIngestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        setIsProcessing(true);
        setProcessingError(null);
        try {
            const apiKey = getGeminiApiKeyOrThrow();
            const ai = new GoogleGenAI({ apiKey });
            // This is a simplified approach. A real implementation would fetch the URL's content server-side.
            const prompt = `This is a URL: "${urlInput}". Create a one-sentence summary for an AI to remember what this link is about.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] } });
            addMemoryItem('url', urlInput, response.text, 'web');
            setUrlInput('');
        } catch (err) {
            console.error("URL ingestion failed:", err);
            setProcessingError(err instanceof Error ? err.message : "Could not process URL.");
        } finally {
            setIsProcessing(false);
        }
    };


    const handleDragEvents = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileIngestion(files);
        }
    };
    
    const handleDeleteMemory = (id: string) => {
        if (window.confirm("Are you sure you want BiB! to forget this item? This may affect its knowledge and future responses.")) {
            setAiMemory(prev => prev.filter(mem => mem.id !== id));
        }
    };

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <BookOpenIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Learning Center</h1>
                        <p className="text-gray-400 text-sm">Expand BiB!'s knowledge by connecting data sources and uploading files.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    {/* File Ingestion */}
                    <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                         <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FileUploadIcon className="w-6 h-6"/>File Ingestion</h2>
                         <div
                            onDrop={handleDrop}
                            onDragOver={handleDragEvents}
                            onDragEnter={() => setIsDragging(true)}
                            onDragLeave={() => setIsDragging(false)}
                            className={`p-8 border-2 border-dashed  rounded-lg text-center transition-colors ${isDragging ? 'border-fuchsia-500 bg-fuchsia-900/20' : 'border-white/20'}`}
                         >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={(e) => e.target.files && handleFileIngestion(e.target.files)}
                            />
                            {isProcessing ? (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <SpinnerIcon className="w-8 h-8"/>
                                    <span>BiB! is processing...</span>
                                </div>
                            ) : (
                                <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                                    <FileUploadIcon className="w-10 h-10 mx-auto text-gray-500"/>
                                    <p className="text-gray-400">Drag & drop a file here or <span className="text-cyan-400 font-semibold">click to browse</span></p>
                                    <p className="text-xs text-gray-500">Text files will be summarized by the AI.</p>
                                </label>
                            )}
                         </div>
                         {processingError && <p className="text-red-400 text-center text-sm">{processingError}</p>}
                    </div>

                    {/* URL Ingestion */}
                    <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2"><LinkIcon className="w-6 h-6"/>URL Ingestion</h2>
                        <form onSubmit={handleUrlIngestion} className="flex gap-2">
                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com" required className={commonInputStyle} />
                            <button type="submit" disabled={isProcessing} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Ingest</button>
                        </form>
                    </div>
                </div>
                
                 {/* Memory Log */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Ingested Memory Log</h2>
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                        {aiMemory.length > 0 ? aiMemory.filter(m => m.type !== 'persona' && m.type !== 'protocol').map(mem => (
                            <div key={mem.id} className="bg-gray-800/50 p-3 rounded-md">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="text-gray-500 pt-1">
                                            {mem.type === 'file' && <FileTextIcon className="w-5 h-5"/>}
                                            {mem.type === 'url' && <LinkIcon className="w-5 h-5"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-200 truncate" title={mem.name}>{mem.name}</p>
                                            <p className="text-xs text-gray-500">Ingested: {new Date(mem.ingestedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMemory(mem.id)} className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 pl-8">{mem.contentSummary}</p>
                            </div>
                        )) : (
                             <p className="text-sm text-center text-gray-500 py-12">The AI's memory is a blank slate. Upload a file or URL to begin teaching.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningPage;
