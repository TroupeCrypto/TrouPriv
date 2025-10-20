import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AIPersona, AIMemoryItem, AITrait, TraitCategory } from '../types';
import { UserCircleIcon, SparklesIcon, TrashIcon, SpinnerIcon } from '../components/icons/Icons';

interface EditableTraitProps {
    trait: AITrait;
    onSave: (updatedTrait: AITrait) => void;
    onDelete: () => void;
}

const EditableTrait: React.FC<EditableTraitProps> = ({ trait, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(trait.name);
    const [value, setValue] = useState(trait.value);
    const [description, setDescription] = useState(trait.description);

    const handleSave = () => {
        onSave({ name, value: Number(value), description });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 bg-gray-700/50 rounded-md space-y-2">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Trait Name" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} min="0" max="100" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded bg-gray-600">Cancel</button>
                    <button onClick={handleSave} className="text-xs px-2 py-1 rounded bg-cyan-600">Save</button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative" onClick={() => setIsEditing(true)}>
            <div className="flex justify-between items-center mb-1 cursor-pointer">
                <span className="text-sm text-gray-300">{trait.name}</span>
                <span className="text-sm font-mono text-cyan-400">{trait.value}/100</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${trait.value}%` }}></div>
            </div>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 bg-red-800/80 rounded-full text-white text-xs"><TrashIcon className="w-3 h-3"/></button>
            </div>
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-xs text-center text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {trait.description}
            </div>
        </div>
    );
};

interface TraitCategorySectionProps {
    title: string;
    category: TraitCategory;
    traits: AITrait[];
    aiPersona: AIPersona;
    setAiPersona: React.Dispatch<React.SetStateAction<AIPersona>>;
}

const TraitCategorySection: React.FC<TraitCategorySectionProps> = ({ title, category, traits, aiPersona, setAiPersona }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTrait, setNewTrait] = useState<Omit<AITrait, 'id'>>({ name: '', value: 50, description: '' });
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<AITrait | null>(null);

    const updateTraits = (newTraits: AITrait[]) => {
        setAiPersona(p => ({ ...p, traits: { ...p.traits, [category]: newTraits } }));
    };

    const handleAddTrait = () => {
        if (!newTrait.name || !newTrait.description) {
            alert("Please provide a name and description for the new trait.");
            return;
        }
        updateTraits([...traits, { ...newTrait, value: Number(newTrait.value) }]);
        setNewTrait({ name: '', value: 50, description: '' });
        setIsAdding(false);
    };
    
    const handleSuggestTrait = async () => {
        setIsSuggesting(true);
        setSuggestion(null);

        const existingTraits = traits.map(t => `- ${t.name}: ${t.description} (Value: ${t.value})`).join('\n');
        const prompt = `
            Based on the core persona of an AI named BiB! and its existing traits, suggest one new, relevant trait for the "${title}" category.
            
            Core Persona: "${aiPersona.corePersona}"
            
            Existing Traits in ${title}:
            ${existingTraits || 'None'}
            
            Provide a creative and fitting trait. Your response must be a single JSON object with "name", "value" (a number between 0-100), and "description" keys.
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                        },
                        required: ["name", "value", "description"],
                    }
                }
            });
            const suggestedTrait = JSON.parse(response.text) as AITrait;
            setSuggestion(suggestedTrait);
        } catch (error) {
            console.error("Trait suggestion failed:", error);
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const acceptSuggestion = () => {
        if (suggestion) {
            updateTraits([...traits, suggestion]);
            setSuggestion(null);
        }
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg space-y-3">
            <h3 className="text-md font-semibold text-gray-200">{title}</h3>
            {traits.map((trait, index) => (
                <EditableTrait 
                    key={`${trait.name}-${index}`} 
                    trait={trait} 
                    onSave={(updatedTrait) => {
                        const newTraits = [...traits];
                        newTraits[index] = updatedTrait;
                        updateTraits(newTraits);
                    }}
                    onDelete={() => {
                        updateTraits(traits.filter((_, i) => i !== index));
                    }}
                />
            ))}
             {isAdding && (
                <div className="p-2 bg-gray-700/50 rounded-md space-y-2">
                    <input type="text" value={newTrait.name} onChange={e => setNewTrait(t => ({...t, name: e.target.value}))} placeholder="Trait Name" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                    <input type="text" value={newTrait.description} onChange={e => setNewTrait(t => ({...t, description: e.target.value}))} placeholder="Description" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                    <input type="number" value={newTrait.value} onChange={e => setNewTrait(t => ({...t, value: Number(e.target.value)}))} min="0" max="100" className="w-full bg-gray-800 border-white/10 border rounded px-2 py-1 text-sm"/>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="text-xs px-2 py-1 rounded bg-gray-600">Cancel</button>
                        <button onClick={handleAddTrait} className="text-xs px-2 py-1 rounded bg-fuchsia-600">Add</button>
                    </div>
                </div>
            )}
            {suggestion && (
                <div className="p-3 bg-cyan-900/30 border border-cyan-500/50 rounded-md space-y-2 text-sm">
                    <p className="font-semibold text-cyan-300">BiB! Suggests:</p>
                    <p><strong>{suggestion.name} ({suggestion.value}/100):</strong> {suggestion.description}</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setSuggestion(null)} className="text-xs px-2 py-1 rounded bg-gray-600">Dismiss</button>
                        <button onClick={acceptSuggestion} className="text-xs px-2 py-1 rounded bg-cyan-600">Accept</button>
                    </div>
                </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-white/10">
                <button onClick={() => setIsAdding(true)} className="text-xs text-gray-400 hover:text-white transition-colors"> + Add Trait</button>
                <span className="text-gray-600">|</span>
                <button onClick={handleSuggestTrait} disabled={isSuggesting} className="text-xs text-cyan-400 hover:text-white transition-colors flex items-center gap-1 disabled:text-gray-500">
                    {isSuggesting ? <SpinnerIcon className="w-3 h-3"/> : <SparklesIcon className="w-3 h-3"/>}
                    BiB! Suggests...
                </button>
            </div>
        </div>
    );
};


interface PersonaPageProps {
  aiPersona: AIPersona;
  setAiPersona: React.Dispatch<React.SetStateAction<AIPersona>>;
  aiMemory: AIMemoryItem[];
}


const PersonaPage: React.FC<PersonaPageProps> = ({ aiPersona, setAiPersona, aiMemory }) => {
    
    useEffect(() => {
        const knowledgeTraits = Array.from(new Set(aiMemory.map(item => item.type)))
            // FIX: Explicitly type `topic` as a string to resolve type inference issue.
            .map((topic: string) => ({
                name: topic.charAt(0).toUpperCase() + topic.slice(1),
                value: 80, // Default value for display
                description: `Knowledge derived from ingested ${topic} sources.`
            }));
        setAiPersona(p => ({
            ...p,
            traits: { ...p.traits, knowledge: knowledgeTraits }
        }));
    }, [aiMemory, setAiPersona]);

    const handleSaveCoreField = (field: 'name' | 'corePersona', value: string) => {
        setAiPersona(p => ({ ...p, [field]: value }));
    };
    
    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <UserCircleIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Persona</h1>
                        <p className="text-gray-400 text-sm">An in-depth, real-time view of BiB!'s identity and consciousness.</p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 italic mt-2">BiB!'s traits evolve over time based on your interactions and ingested knowledge. Guide this evolution by adding or modifying traits manually, or ask BiB! for suggestions.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Column 1: Core Identity */}
                <div className="lg:col-span-1 bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Core Identity</h2>
                     <div>
                        <label className="text-sm font-semibold text-gray-300">Name</label>
                        <input type="text" defaultValue={aiPersona.name} onBlur={e => handleSaveCoreField('name', e.target.value)} className="w-full mt-1 bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-fuchsia-500"/>
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-300">Core Persona Directive</label>
                        <textarea defaultValue={aiPersona.corePersona} onBlur={e => handleSaveCoreField('corePersona', e.target.value)} rows={8} className="w-full mt-1 bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-fuchsia-500"/>
                    </div>
                     <div className="bg-gray-800/50 p-3 rounded-md">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Internal Thoughts</h4>
                        <p className="text-sm text-gray-300 mt-1 h-20 overflow-y-auto animate-pulse">{aiPersona.internalThoughts}</p>
                    </div>
                </div>

                {/* Column 2: Character Matrix */}
                 <div className="lg:col-span-1 bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Character Matrix</h2>
                    <TraitCategorySection title="Ethics" category="ethics" traits={aiPersona.traits.ethics} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                    <TraitCategorySection title="Morals" category="morals" traits={aiPersona.traits.morals} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                    <TraitCategorySection title="Beliefs" category="beliefs" traits={aiPersona.traits.beliefs} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                    <TraitCategorySection title="Personality" category="personality" traits={aiPersona.traits.personality} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                </div>
                
                {/* Column 3: Ambition & Worldview */}
                <div className="lg:col-span-1 bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Ambition & Worldview</h2>
                    <TraitCategorySection title="Approach & Philosophy" category="approach" traits={aiPersona.traits.approach} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                    <TraitCategorySection title="Dislikes & Hatreds" category="dislikes" traits={aiPersona.traits.dislikes} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                    <TraitCategorySection title="Plans & Goals" category="plans" traits={aiPersona.traits.plans} aiPersona={aiPersona} setAiPersona={setAiPersona} />
                     <div className="bg-gray-800/50 p-4 rounded-lg">
                         <h3 className="text-md font-semibold text-gray-200">Knowledge</h3>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {aiPersona.traits.knowledge.map(topic => (
                                <span key={topic.name} className="bg-cyan-900/50 text-cyan-300 text-xs font-semibold px-2 py-1 rounded-full">{topic.name}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaPage;