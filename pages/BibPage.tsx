
import React, { useState, useEffect } from 'react';
import { Page, AIPersona, AIProtocol, AIMemoryItem, AITrait } from '../types';
import { BrainCircuitIcon, TrashIcon, EditIcon, FileTextIcon } from '../components/icons/Icons';

interface BibPageProps {
  setPage: (page: Page) => void;
  aiPersona: AIPersona;
  setAiPersona: React.Dispatch<React.SetStateAction<AIPersona>>;
  aiProtocols: AIProtocol[];
  setAiProtocols: React.Dispatch<React.SetStateAction<AIProtocol[]>>;
  aiMemory: AIMemoryItem[];
  setAiMemory: React.Dispatch<React.SetStateAction<AIMemoryItem[]>>;
}

const TraitDisplay: React.FC<{ trait: AITrait }> = ({ trait }) => (
    <div className="group relative">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">{trait.name}</span>
            <span className="text-sm font-mono text-cyan-400">{trait.value}/100</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${trait.value}%` }}></div>
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-xs text-center text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {trait.description}
        </div>
    </div>
);

const ProtocolModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, content: string, isActive: boolean) => void;
    protocol: AIProtocol | null;
}> = ({ isOpen, onClose, onSave, protocol }) => {
    const [name, setName] = useState(protocol?.name || '');
    const [content, setContent] = useState(protocol?.content || '');
    const [isActive, setIsActive] = useState(protocol?.isActive ?? true);
    
    // FIX: Imported `useEffect` to resolve the 'Cannot find name' error.
    useEffect(() => {
        setName(protocol?.name || '');
        setContent(protocol?.content || '');
        setIsActive(protocol?.isActive ?? true);
    }, [protocol]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (name.trim() && content.trim()) {
            onSave(name, content, isActive);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">{protocol ? 'Edit Protocol' : 'Add New Protocol'}</h3>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Protocol Name" className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500" />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Protocol Content..." rows={5} className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500"></textarea>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Active</span>
                    <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer ${isActive ? 'bg-green-500' : 'bg-gray-600'}`} onClick={() => setIsActive(!isActive)}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${isActive ? 'translate-x-5' : ''}`}></div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors">Save Protocol</button>
                </div>
            </div>
        </div>
    );
};


const BibPage: React.FC<BibPageProps> = ({
    setPage,
    aiPersona,
    setAiPersona,
    aiProtocols,
    setAiProtocols,
    aiMemory,
    setAiMemory
}) => {
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [editingProtocol, setEditingProtocol] = useState<AIProtocol | null>(null);

    const handleOpenProtocolModal = (protocol: AIProtocol | null = null) => {
        setEditingProtocol(protocol);
        setIsProtocolModalOpen(true);
    };

    const handleSaveProtocol = (name: string, content: string, isActive: boolean) => {
        if (editingProtocol) {
            setAiProtocols(protocols => protocols.map(p => p.id === editingProtocol.id ? { ...p, name, content, isActive } : p));
        } else {
            const newProtocol: AIProtocol = { id: `proto-${Date.now()}`, name, content, isActive };
            setAiProtocols(protocols => [...protocols, newProtocol]);
        }
        setIsProtocolModalOpen(false);
    };

    const handleDeleteProtocol = (id: string) => {
        if (window.confirm("Are you sure you want to delete this protocol? This will affect the AI's behavior.")) {
            setAiProtocols(protocols => protocols.filter(p => p.id !== id));
        }
    };
    
    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">BiB! AI Core</h1>
                        <p className="text-gray-400 text-sm">Customize, teach, and align your autonomous AI assistant.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Persona Column */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 space-y-4 lg:col-span-1">
                    <h2 className="text-xl font-semibold text-white">Persona Matrix</h2>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-cyan-400">Core Persona</h3>
                        <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-md max-h-32 overflow-y-auto">{aiPersona.corePersona}</p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-cyan-400">Character Traits</h3>
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Ethics</h4>
                                {aiPersona.traits.ethics.map(t => <TraitDisplay key={t.name} trait={t} />)}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 pt-2 mb-2">Morals</h4>
                                {aiPersona.traits.morals.map(t => <TraitDisplay key={t.name} trait={t} />)}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 pt-2 mb-2">Beliefs</h4>
                                {aiPersona.traits.beliefs.map(t => <TraitDisplay key={t.name} trait={t} />)}
                            </div>
                        </div>
                    </div>
                     <div className="space-y-3 pt-3 border-t border-white/10">
                        <h3 className="font-semibold text-cyan-400">Live State</h3>
                        <div className="bg-gray-800/50 p-3 rounded-md">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Internal Thoughts</h4>
                            <p className="text-sm text-gray-300 mt-1 animate-pulse">{aiPersona.internalThoughts}</p>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-md">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Real-time Logic</h4>
                            <p className="text-sm text-gray-300 mt-1">{aiPersona.realTimeLogic}</p>
                        </div>
                    </div>
                </div>

                {/* Protocols & Memory Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Guiding Protocols</h2>
                            <button onClick={() => handleOpenProtocolModal()} className="bg-cyan-500/80 hover:bg-cyan-500 text-white font-bold py-1 px-3 text-sm rounded-md transition-colors">+ Add Protocol</button>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {aiProtocols.length > 0 ? aiProtocols.map(protocol => (
                                <div key={protocol.id} className="bg-gray-800/50 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-200 flex-1 mr-4">{protocol.name}</p>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => handleOpenProtocolModal(protocol)} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteProtocol(protocol.id)} className="text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                            <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer ${protocol.isActive ? 'bg-green-500' : 'bg-gray-600'}`} onClick={() => setAiProtocols(ps => ps.map(p => p.id === protocol.id ? {...p, isActive: !p.isActive} : p))}>
                                                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${protocol.isActive ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{protocol.content}</p>
                                </div>
                            )) : <p className="text-sm text-center text-gray-500 py-4">No protocols defined. The AI will use its core persona only.</p>}
                        </div>
                    </div>
                    
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 space-y-4">
                        <h2 className="text-xl font-semibold text-white">Ingested Memory</h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {aiMemory.length > 0 ? aiMemory.map(mem => (
                                <div key={mem.id} className="bg-gray-800/50 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <FileTextIcon className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="font-semibold text-gray-200 truncate">{mem.name}</p>
                                                <p className="text-xs text-gray-500">{mem.type} - {new Date(mem.ingestedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => {if(window.confirm("Are you sure you want the AI to forget this memory?")) {setAiMemory(mems => mems.filter(m => m.id !== mem.id))}}} className="text-gray-400 hover:text-red-400 flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2 pl-6">{mem.contentSummary}</p>
                                </div>
                            )) : <p className="text-sm text-center text-gray-500 py-4">The AI's memory is a blank slate.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            <ProtocolModal 
                isOpen={isProtocolModalOpen}
                onClose={() => setIsProtocolModalOpen(false)}
                onSave={handleSaveProtocol}
                protocol={editingProtocol}
            />
        </div>
    );
};

export default BibPage;
