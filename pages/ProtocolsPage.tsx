import React, { useState, useEffect } from 'react';
import { AIProtocol } from '../types';
import { ClipboardListIcon, TrashIcon, EditIcon, FileUploadIcon } from '../components/icons/Icons';

interface ProtocolsPageProps {
  aiProtocols: AIProtocol[];
  setAiProtocols: React.Dispatch<React.SetStateAction<AIProtocol[]>>;
}

const ProtocolModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, content: string, isActive: boolean) => void;
    protocol: AIProtocol | null;
    initialContentFromFile?: string;
}> = ({ isOpen, onClose, onSave, protocol, initialContentFromFile }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [isActive, setIsActive] = useState(true);
    
    useEffect(() => {
        setName(protocol?.name || '');
        setContent(protocol?.content || initialContentFromFile || '');
        setIsActive(protocol?.isActive ?? true);
    }, [protocol, initialContentFromFile]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (name.trim() && content.trim()) {
            onSave(name, content, isActive);
        } else {
            alert("Protocol Name and Content cannot be empty.");
        }
    };
    
    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4">
                <h3 className="text-xl font-bold text-white">{protocol ? 'Edit Protocol' : 'Add New Protocol'}</h3>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Protocol Name (e.g., 'Market Analysis Protocol')" className={commonInputStyle} />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Protocol Content (e.g., 'When analyzing markets, always check for unusual volume spikes...')" rows={8} className={`${commonInputStyle} font-mono text-sm`}></textarea>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Set as Active</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isActive} onChange={() => setIsActive(!isActive)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors">Save Protocol</button>
                </div>
            </div>
        </div>
    );
};


const ProtocolsPage: React.FC<ProtocolsPageProps> = ({ aiProtocols, setAiProtocols }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProtocol, setEditingProtocol] = useState<AIProtocol | null>(null);
    const [fileContent, setFileContent] = useState<string | undefined>(undefined);

    const handleOpenFileUpload = () => {
        document.getElementById('protocol-file-upload')?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setFileContent(text);
                setEditingProtocol(null);
                setIsModalOpen(true);
            };
            reader.readAsText(file);
        } else {
            alert("Please upload a valid text file (.txt, .md, etc).");
        }
        // Reset file input to allow uploading the same file again
        event.target.value = '';
    };

    const handleOpenModal = (protocol: AIProtocol | null = null) => {
        setEditingProtocol(protocol);
        setFileContent(undefined);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProtocol(null);
        setFileContent(undefined);
    };

    const handleSaveProtocol = (name: string, content: string, isActive: boolean) => {
        if (editingProtocol) {
            setAiProtocols(protocols => protocols.map(p => p.id === editingProtocol.id ? { ...p, name, content, isActive } : p));
        } else {
            const newProtocol: AIProtocol = { id: `proto-${Date.now()}`, name, content, isActive };
            setAiProtocols(protocols => [...protocols, newProtocol]);
        }
        handleCloseModal();
    };

    const handleDeleteProtocol = (id: string) => {
        if (window.confirm("Are you sure you want to delete this protocol? This will affect the AI's behavior.")) {
            setAiProtocols(protocols => protocols.filter(p => p.id !== id));
        }
    };
    
    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <ClipboardListIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Protocols</h1>
                        <p className="text-gray-400 text-sm">Define BiB!'s operational rules and work mentality for any situation.</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <input type="file" id="protocol-file-upload" className="hidden" accept=".txt,.md,.text" onChange={handleFileUpload} />
                    <button onClick={handleOpenFileUpload} className="bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap text-sm flex items-center gap-2">
                       <FileUploadIcon className="w-4 h-4" /> Upload from File
                    </button>
                    <button onClick={() => handleOpenModal()} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap text-sm">
                        + Add New Protocol
                    </button>
                </div>
            </header>

            <div className="space-y-3">
                {aiProtocols.length > 0 ? aiProtocols.map(protocol => (
                    <div key={protocol.id} className="bg-gray-900/50 p-4 rounded-lg border border-white/10">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{protocol.name}</p>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{protocol.content}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className={`px-2 py-0.5 text-xs font-semibold rounded-full ${protocol.isActive ? 'bg-green-800/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                    {protocol.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </div>
                                <button onClick={() => handleOpenModal(protocol)} className="text-gray-400 hover:text-white p-1"><EditIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteProtocol(protocol.id)} className="text-gray-400 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4" /></button>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={protocol.isActive} onChange={() => setAiProtocols(ps => ps.map(p => p.id === protocol.id ? {...p, isActive: !p.isActive} : p))} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )) : (
                     <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                        <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <h3 className="text-xl font-semibold text-white mt-4">No Protocols Defined</h3>
                        <p className="text-gray-400 mt-2">Add protocols to give BiB! specific instructions and constraints.</p>
                    </div>
                )}
            </div>

            <ProtocolModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveProtocol}
                protocol={editingProtocol}
                initialContentFromFile={fileContent}
            />
        </div>
    );
};

export default ProtocolsPage;