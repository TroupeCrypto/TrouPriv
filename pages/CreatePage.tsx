

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Page } from '../types';
import { default as Editor } from 'react-simple-code-editor';
import prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import { SparklesIcon, SpinnerIcon } from '../components/icons/Icons';
import { getGeminiApiKeyOrThrow } from '../utils/env';

const CreateIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;

type Language = 'javascript' | 'typescript' | 'tsx' | 'jsx' | 'css' | 'json';
type AiAction = 'explain' | 'refactor' | 'add_comments';

interface CreatePageProps {
  setPage: (page: Page) => void;
}

const CreatePage: React.FC<CreatePageProps> = ({ setPage }) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<Language>('javascript');
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAiAction = async (action: AiAction) => {
        if (!code.trim()) {
            setError('Please enter some code to process.');
            return;
        }
        setIsLoading(true);
        setAiResponse('');
        setError(null);

        let prompt = '';
        switch(action) {
            case 'explain':
                prompt = `Explain the following ${language} code snippet. Break it down line by line or by logical blocks. Be concise and clear. Code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
                break;
            case 'refactor':
                prompt = `Refactor the following ${language} code snippet for better performance, readability, and modern best practices. Provide only the refactored code inside a markdown block. Code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
                break;
            case 'add_comments':
                 prompt = `Add helpful comments to the following ${language} code snippet. Explain the purpose of complex parts. Provide only the commented code inside a markdown block. Code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
                break;
        }

        try {
            const apiKey = getGeminiApiKeyOrThrow();
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }] } });
            let resultText = response.text.trim();
            // If the response is a markdown code block, extract the code
            if (action !== 'explain') {
                const codeBlockRegex = new RegExp("```(?:" + language + ")?\\n([\\s\\S]*?)```");
                const match = resultText.match(codeBlockRegex);
                if (match && match[1]) {
                    resultText = match[1].trim();
                }
            }
            setAiResponse(resultText);

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`AI action failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CreateIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Create</h1>
            {/* FIX: Replaced non-existent 'Page.Code' with 'Page.WebDev' and updated link text. */}
            <button onClick={() => setPage(Page.WebDev)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web-Dev</button>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-gray-900/50 border border-white/10 rounded-lg h-[70vh] flex flex-col">
            <div className="p-2 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white px-2">Code Editor</h2>
                <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-gray-800/50 border-0 rounded-md px-2 py-1 text-white text-sm focus:ring-1 focus:ring-cyan-500"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="jsx">JSX</option>
                    <option value="tsx">TSX</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                </select>
            </div>
            <Editor
                value={code}
                onValueChange={newCode => setCode(newCode)}
                highlight={code => prism.highlight(code, prism.languages[language], language)}
                padding={16}
                className="code-editor"
            />
        </div>
        
        <div className="bg-gray-900/50 border border-white/10 rounded-lg h-[70vh] flex flex-col">
            <div className="p-2 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white px-2">BiB!'s Assistant</h2>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                {isLoading ? (
                     <div className="flex items-center justify-center h-full text-gray-400">
                        <SpinnerIcon className="w-8 h-8" />
                    </div>
                ) : error ? (
                    <p className="text-red-400">{error}</p>
                ) : aiResponse ? (
                    <pre className="text-white whitespace-pre-wrap text-sm">
                        <code dangerouslySetInnerHTML={{ __html: prism.highlight(aiResponse, prism.languages[language], language) }} />
                    </pre>
                ) : (
                    <p className="text-gray-500 text-center pt-24">Select an action to get started.</p>
                )}
            </div>
            <div className="p-4 border-t border-white/10 grid grid-cols-3 gap-2">
                <button onClick={() => handleAiAction('explain')} disabled={isLoading} className="ai-action-btn bg-cyan-600/80 hover:bg-cyan-600">Explain Code</button>
                <button onClick={() => handleAiAction('refactor')} disabled={isLoading} className="ai-action-btn bg-fuchsia-600/80 hover:bg-fuchsia-600">Refactor</button>
                <button onClick={() => handleAiAction('add_comments')} disabled={isLoading} className="ai-action-btn bg-green-600/80 hover:bg-green-600">Add Comments</button>
                <style>{`
                    .ai-action-btn {
                        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                        font-weight: bold; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem;
                        transition: background-color 0.2s;
                    }
                    .ai-action-btn:disabled { background-color: #4b5563; cursor: not-allowed; }
                `}</style>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;