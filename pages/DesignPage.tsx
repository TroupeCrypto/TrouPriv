
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Page } from '../types';
import { SparklesIcon, SpinnerIcon } from '../components/icons/Icons';

const DesignIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;

interface DesignResult {
    componentName: string;
    description: string;
    states: string[];
    tailwindHtml: string;
}

interface DesignPageProps {
  setPage: (page: Page) => void;
}

const DesignPage: React.FC<DesignPageProps> = ({ setPage }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DesignResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please describe the component you want to design.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        setError(null);

        const apiPrompt = `
            You are a UI/UX design assistant specializing in Tailwind CSS.
            Based on the user's request, design a web component.
            Request: "${prompt}"

            Your response must be a single JSON object with the following structure:
            1. 'componentName': A suitable name for the component (e.g., "Notification Bell").
            2. 'description': A brief description of the component's purpose and usage.
            3. 'states': An array of strings describing its key states (e.g., "Default", "Hover", "Active with notification count").
            4. 'tailwindHtml': A string containing the HTML and Tailwind CSS for the component. The HTML should be simple and semantic. The Tailwind classes should be modern and create a visually appealing component that fits a dark-themed, futuristic aesthetic.
        `;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: apiPrompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            componentName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            states: { type: Type.ARRAY, items: { type: Type.STRING } },
                            tailwindHtml: { type: Type.STRING }
                        },
                        required: ['componentName', 'description', 'states', 'tailwindHtml']
                    }
                }
            });
            const generatedResult = JSON.parse(response.text) as DesignResult;
            setResult(generatedResult);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to generate design: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
  
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <DesignIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Design</h1>
            <button onClick={() => setPage(Page.Code)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Code</button>
          </div>
        </div>
      </header>
       <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">UI Component Designer</h2>
        <p className="text-sm text-gray-400">Describe a UI component, and BiB! will generate a design brief and ready-to-use Tailwind CSS code.</p>
        <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., A sleek, futuristic toggle switch for enabling a setting."
            rows={3}
            className="w-full bg-gray-800/50 border border-white/10 rounded-md p-3 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
        />
        <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
            {isLoading ? <><SpinnerIcon className="w-5 h-5" />Designing...</> : <><SparklesIcon className="w-5 h-5"/>Generate Design</>}
        </button>
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
      </div>

      {result && (
         <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-6 animate-fade-in">
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>
            <h2 className="text-2xl font-bold text-white">{result.componentName}</h2>
            <p className="text-gray-300">{result.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">States</h3>
                    <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">
                        {result.states.map((state, i) => <li key={i}>{state}</li>)}
                    </ul>
                     <h3 className="text-lg font-semibold text-white mb-3 mt-6">Preview</h3>
                     <div className="p-8 bg-gray-800/50 rounded-lg flex items-center justify-center">
                        <div dangerouslySetInnerHTML={{ __html: result.tailwindHtml }} />
                     </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Code</h3>
                    <pre className="bg-gray-800/50 p-4 rounded-lg text-sm text-cyan-300 overflow-x-auto">
                        <code>{result.tailwindHtml}</code>
                    </pre>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default DesignPage;
