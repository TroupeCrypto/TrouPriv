

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Page } from '../types';
import { SparklesIcon, SpinnerIcon } from '../components/icons/Icons';
import { getGeminiApiKeyOrThrow } from '../utils/env';

interface ConceptualizationResult {
  projectName: string;
  tagline: string;
  features: { title: string; description: string }[];
  userStories: string[];
  techStack: { category: string; technologies: string[] }[];
}

interface ConceptualizePageProps {
  setPage: (page: Page) => void;
}

const ConceptualizePage: React.FC<ConceptualizePageProps> = ({ setPage }) => {
    const [idea, setIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ConceptualizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!idea.trim()) {
            setError('Please enter an idea to conceptualize.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        setError(null);

        const prompt = `
            Based on the following project idea, generate a detailed conceptualization document.
            Idea: "${idea}"

            Your response must be a JSON object containing:
            1.  'projectName': A creative and fitting name for the project.
            2.  'tagline': A catchy, one-sentence tagline.
            3.  'features': An array of 3-5 core feature objects, each with a 'title' and a 'description'.
            4.  'userStories': An array of 3 sample user stories in the format "As a [user type], I want [goal] so that [benefit]".
            5.  'techStack': An array of objects, each with a 'category' (e.g., "Frontend", "Backend", "Database") and a 'technologies' array of strings.
        `;

        try {
            const apiKey = getGeminiApiKeyOrThrow();
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            projectName: { type: Type.STRING },
                            tagline: { type: Type.STRING },
                            features: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    },
                                    required: ['title', 'description']
                                }
                            },
                            userStories: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            techStack: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        category: { type: Type.STRING },
                                        technologies: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    },
                                    required: ['category', 'technologies']
                                }
                            }
                        },
                        required: ['projectName', 'tagline', 'features', 'userStories', 'techStack']
                    }
                }
            });
            const generatedResult = JSON.parse(response.text) as ConceptualizationResult;
            setResult(generatedResult);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to generate concept: ${message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Conceptualize</h1>
            {/* FIX: Replaced non-existent 'Page.Code' with 'Page.WebDev' and updated link text. */}
            <button onClick={() => setPage(Page.WebDev)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web-Dev</button>
          </div>
        </div>
      </header>
      
      <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Project Idea Generator</h2>
        <p className="text-sm text-gray-400">Describe your application or software idea, and BiB! will generate a complete project concept, including features, user stories, and a recommended tech stack.</p>
        <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="e.g., A decentralized social media platform for artists to tokenize their work."
            rows={4}
            className="w-full bg-gray-800/50 border border-white/10 rounded-md p-3 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
        />
        <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
        >
            {isLoading ? <><SpinnerIcon className="w-5 h-5" />Conceptualizing...</> : <><SparklesIcon className="w-5 h-5"/>Generate Concept</>}
        </button>
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
      </div>

      {result && (
        <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-6 animate-fade-in">
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
            `}</style>
            <div className="text-center border-b border-white/10 pb-4">
                <h2 className="text-3xl font-bold text-white">{result.projectName}</h2>
                <p className="text-cyan-400 italic mt-1">"{result.tagline}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Core Features</h3>
                    <div className="space-y-3">
                        {result.features.map((feature, i) => (
                            <div key={i} className="p-3 bg-gray-800/50 rounded-md">
                                <h4 className="font-semibold text-gray-200">{feature.title}</h4>
                                <p className="text-sm text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">User Stories</h3>
                    <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">
                        {result.userStories.map((story, i) => <li key={i}>{story}</li>)}
                    </ul>
                </div>
            </div>

             <div>
                <h3 className="text-lg font-semibold text-white mb-3">Suggested Tech Stack</h3>
                <div className="flex flex-wrap gap-4">
                    {result.techStack.map((stack, i) => (
                        <div key={i} className="flex-1 min-w-[150px] p-3 bg-gray-800/50 rounded-md">
                            <h4 className="font-semibold text-gray-200 text-sm border-b border-white/10 pb-1 mb-2">{stack.category}</h4>
                            <div className="flex flex-wrap gap-2">
                                {stack.technologies.map(tech => (
                                    <span key={tech} className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded-full">{tech}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ConceptualizePage;