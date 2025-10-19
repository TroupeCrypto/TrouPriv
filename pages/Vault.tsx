
import React, { useState, useMemo, useCallback } from 'react';
// FIX: Use relative paths for local modules
import { VaultItem, VaultItemType } from '../types';
import { encrypt } from '../utils/encryption';
// FIX: Use relative paths for local modules
import { VaultIcon, KeyIcon, FileTextIcon, EyeIcon, EyeOffIcon, CopyIcon, TrashIcon, GlobeIcon } from '../components/icons/Icons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useVault, DecryptedVaultItem } from '../contexts/VaultContext';
import { useMasterPassword } from '../contexts/MasterPasswordContext';

interface VaultPageProps {
  vaultItems: VaultItem[];
  setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>;
}

const VaultPage: React.FC<VaultPageProps> = ({ vaultItems, setVaultItems }) => {
    const { decryptedItems } = useVault();
    const {
        isUnlocked,
        isVerifying,
        verificationError,
        verifyAndSetPassword,
        clearPassword,
        masterPassword
    } = useMasterPassword();
    
    const [showNewItemForm, setShowNewItemForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState<VaultItemType>('secret');
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemWebsite, setNewItemWebsite] = useState('');
    const [newItemNotes, setNewItemNotes] = useState('');
    const [newItemUsername, setNewItemUsername] = useState('');
    const [newItemPassword, setNewItemPassword] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<VaultItem | null>(null);

    const handleUnlock = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
        if (passwordInput) {
            const success = await verifyAndSetPassword(passwordInput.value, vaultItems);
            if (!success) {
                // Clear password only on failure for better UX
                passwordInput.value = '';
            }
        }
    }, [verifyAndSetPassword, vaultItems]);

    const handleLock = () => {
        clearPassword();
        setVisibility({});
        setShowNewItemForm(false);
    };
    
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName) {
            alert("Please provide a name for the item.");
            return;
        }

        let contentToEncrypt;
        let websiteForSave: string | undefined = undefined;

        if (newItemType === 'login') {
            if (!newItemWebsite || !newItemUsername || !newItemPassword) {
                alert("Please fill out Website, Username, and Password for logins.");
                return;
            }
            contentToEncrypt = JSON.stringify({ username: newItemUsername, password: newItemPassword });
            websiteForSave = newItemWebsite;
        } else if (newItemType === 'apiKey') {
            if (!newItemContent || !newItemWebsite) {
                alert("Please fill out the API Key and its Website/Service.");
                return;
            }
            contentToEncrypt = JSON.stringify({ key: newItemContent, notes: newItemNotes });
            websiteForSave = newItemWebsite;
        } else { // secret
            if (!newItemContent) {
                alert("Please fill out the secret content.");
                return;
            }
            contentToEncrypt = newItemContent;
        }

        if (!masterPassword) {
            alert("Vault must be unlocked to add a new item.");
            return;
        }

        setSaveStatus('saving');
        
        try {
            const encryptedContent = await encrypt(contentToEncrypt, masterPassword);
            
            const newItem: VaultItem = {
                id: Date.now().toString(),
                name: newItemName,
                type: newItemType,
                encryptedContent: encryptedContent,
                website: websiteForSave
            };
            setVaultItems(prev => [...prev, newItem]);
            
            // Reset form fields
            setNewItemName('');
            setNewItemContent('');
            setNewItemNotes('');
            setNewItemWebsite('');
            setNewItemUsername('');
            setNewItemPassword('');
            setNewItemType('secret');
            
            setSaveStatus('saved');
            setTimeout(() => {
                setShowNewItemForm(false);
                setSaveStatus('idle');
            }, 2000);

        } catch (e) {
            alert("Failed to encrypt new item.");
            setSaveStatus('idle');
        }
    };

    const openDeleteConfirmation = (id: string) => {
        const item = vaultItems.find(i => i.id === id);
        if (item) {
            setItemToDelete(item);
        }
    };
    
    const handleConfirmDelete = () => {
        if (itemToDelete) {
            const newVaultItems = vaultItems.filter(item => item.id !== itemToDelete.id);
            setVaultItems(newVaultItems);
            setItemToDelete(null);
        }
    };
    
    const toggleVisibility = (id: string) => {
        setVisibility(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const { apiKeys, generalSecrets, logins } = useMemo(() => {
        const apiKeysGrouped: Record<string, DecryptedVaultItem[]> = {};
        const loginsGrouped: Record<string, DecryptedVaultItem[]> = {};
        const generalSecrets: DecryptedVaultItem[] = [];

        decryptedItems.forEach(item => {
            if (item.type === 'apiKey' && item.website) {
                const website = item.website.trim() || 'Uncategorized';
                if (!apiKeysGrouped[website]) apiKeysGrouped[website] = [];
                apiKeysGrouped[website].push(item);
            } else if (item.type === 'login' && item.website) {
                const website = item.website.trim() || 'Uncategorized';
                if (!loginsGrouped[website]) loginsGrouped[website] = [];
                loginsGrouped[website].push(item);
            } else {
                generalSecrets.push(item);
            }
        });
        return { 
            apiKeys: Object.entries(apiKeysGrouped).sort((a,b) => a[0].localeCompare(b[0])),
            logins: Object.entries(loginsGrouped).sort((a,b) => a[0].localeCompare(b[0])),
            generalSecrets 
        };
    }, [decryptedItems]);

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    const renderItemContent = (item: DecryptedVaultItem) => {
        const isVisible = !!visibility[item.id];
        if (!isVisible && item.type !== 'login') return <div className="mt-2 pl-7 text-gray-500 font-mono">••••••••••••••••</div>;
    
        if (item.type === 'apiKey' && typeof item.decryptedContent === 'object' && item.decryptedContent) {
            const content = item.decryptedContent as { key: string; notes?: string };
            return (
                <div className="mt-2 pl-7 space-y-2 font-mono text-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <span className="text-gray-400">Key: </span>
                            <span className="text-gray-200 break-all">{content.key}</span>
                        </div>
                        <button onClick={() => handleCopy(content.key, item.id + '-key')} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            {copied === item.id + '-key' ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    {content.notes && (
                         <div className="text-gray-200 whitespace-pre-wrap">
                            <span className="text-gray-400">Notes: </span>
                            <span>{content.notes}</span>
                        </div>
                    )}
                </div>
            );
        } else if (item.type === 'login' && typeof item.decryptedContent === 'object' && item.decryptedContent) {
            const content = item.decryptedContent as { username: string; password?: string };
            return (
                <div className="mt-2 pl-7 space-y-2 font-mono text-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <span className="text-gray-400">Username: </span>
                            <span className="text-gray-200 break-all">{content.username}</span>
                        </div>
                        <button onClick={() => handleCopy(content.username, item.id + '-user')} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            {copied === item.id + '-user' ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                             <span className="text-gray-400">Password: </span>
                             <span className="text-gray-200 break-all">
                                {isVisible ? content.password : '••••••••••••••••'}
                             </span>
                        </div>
                         <button onClick={() => handleCopy(content.password || '', item.id + '-pass')} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            {copied === item.id + '-pass' ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            );
        } else if (typeof item.decryptedContent === 'string') {
             return <pre className="text-gray-200 mt-2 bg-black/30 p-3 rounded-md font-mono whitespace-pre-wrap break-all">{item.decryptedContent}</pre>
        }
    
        return null;
    };
    
    const ensureUrlProtocol = (url: string) => {
      if (!/^(?:f|ht)tps?:\/\//.test(url)) {
          return `https://${url}`;
      }
      return url;
    };


    if (!isUnlocked) {
        return (
          <div className="max-w-md mx-auto text-center p-8 bg-gray-900/50 border border-white/10 rounded-lg">
            <VaultIcon className="w-12 h-12 mx-auto text-cyan-400" />
            <h2 className="text-2xl font-bold mt-4">Vault is Locked</h2>
            <p className="text-gray-400 mt-2">Enter your master password to unlock.</p>
            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              <input
                type="password"
                name="password"
                placeholder="Master Password"
                className={commonInputStyle}
                autoComplete="current-password"
                required
              />
              {verificationError && <p className="text-red-400 text-sm">{verificationError}</p>}
              <button type="submit" disabled={isVerifying} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600">
                {isVerifying ? 'Verifying...' : 'Unlock'}
              </button>
            </form>
          </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Secure Vault</h2>
                <div>
                    <button onClick={() => setShowNewItemForm(!showNewItemForm)} className="mr-4 bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        {showNewItemForm ? 'Cancel' : '+ New Item'}
                    </button>
                    <button onClick={handleLock} className="bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Lock Vault
                    </button>
                </div>
            </div>

            {showNewItemForm && (
                <form onSubmit={handleAddItem} className="p-6 bg-gray-900/50 border border-white/10 rounded-lg space-y-4 animate-fade-in">
                    <style>{`
                        @keyframes fade-in {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fade-in { animation: fade-in 0.3s ease-out; }
                        @keyframes pop-in {
                            0% { transform: scale(0.9); opacity: 0; }
                            50% { transform: scale(1.1); opacity: 1; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                        .animate-pop-in { 
                            animation: pop-in 0.3s ease-out forwards; 
                        }
                    `}</style>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Name (e.g., 'Google Account')" required className={commonInputStyle} />
                        <select value={newItemType} onChange={e => setNewItemType(e.target.value as VaultItemType)} className={commonInputStyle}>
                            <option value="secret">General Secret</option>
                            <option value="apiKey">API Key</option>
                            <option value="login">Login</option>
                        </select>
                    </div>

                    {(newItemType === 'apiKey' || newItemType === 'login') && (
                        <input type="text" value={newItemWebsite} onChange={e => setNewItemWebsite(e.target.value)} placeholder="Website / Service (e.g. 'google.com')" required className={commonInputStyle} />
                    )}

                    {newItemType === 'login' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={newItemUsername} onChange={e => setNewItemUsername(e.target.value)} placeholder="Username or Email" required className={commonInputStyle} />
                            <input type="password" value={newItemPassword} onChange={e => setNewItemPassword(e.target.value)} placeholder="Password" required className={commonInputStyle} />
                        </div>
                    )}

                    {newItemType !== 'login' && (
                        <textarea value={newItemContent} onChange={e => setNewItemContent(e.target.value)} placeholder={newItemType === 'apiKey' ? 'API Key Value' : 'Secret Content'} required rows={3} className={commonInputStyle} />
                    )}

                    {newItemType === 'apiKey' && (
                        <textarea value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="Notes (Optional)" rows={2} className={commonInputStyle} />
                    )}
                    <div className="flex items-center gap-4">
                        <button type="submit" disabled={saveStatus === 'saving'} className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600">
                            {saveStatus === 'saving' ? 'Saving...' : 'Save Item'}
                        </button>
                        {saveStatus === 'saved' && (
                            <span className="text-green-400 text-sm font-semibold whitespace-nowrap animate-pop-in">✓ Saved successfully!</span>
                        )}
                    </div>
                </form>
            )}

            {decryptedItems.length === 0 && !showNewItemForm && (
                <div className="text-center py-16 text-gray-500">
                    <p>Your vault is empty.</p>
                    <p>Click "+ New Item" to add your first secret.</p>
                </div>
            )}

            {logins.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">Logins</h3>
                    {logins.map(([website, items]) => (
                        <div key={website}>
                            <a href={ensureUrlProtocol(website)} target="_blank" rel="noopener noreferrer" className="text-md font-bold text-cyan-400 mb-2 flex items-center gap-2 hover:underline">
                                <GlobeIcon className="w-4 h-4" />
                                {website}
                            </a>
                            <div className="space-y-2">
                            {items.map(item => (
                                <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <KeyIcon className="w-5 h-5 text-gray-400" />
                                            <p className="font-semibold">{item.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <button onClick={() => toggleVisibility(item.id)} className="hover:text-white">
                                                {visibility[item.id] ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => openDeleteConfirmation(item.id)} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    {renderItemContent(item)}
                                </div>
                            ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {apiKeys.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">API Keys</h3>
                    {apiKeys.map(([website, items]) => (
                        <div key={website}>
                            <h4 className="text-md font-bold text-cyan-400 mb-2">{website}</h4>
                            <div className="space-y-2">
                            {items.map(item => (
                                <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <KeyIcon className="w-5 h-5 text-gray-400" />
                                            <p className="font-semibold">{item.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <button onClick={() => toggleVisibility(item.id)} className="hover:text-white">
                                                {visibility[item.id] ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => openDeleteConfirmation(item.id)} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    {renderItemContent(item)}
                                </div>
                            ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {generalSecrets.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">General Secrets</h3>
                    <div className="space-y-2">
                        {generalSecrets.map(item => (
                            <div key={item.id} className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <FileTextIcon className="w-5 h-5 text-gray-400" />
                                        <p className="font-semibold">{item.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <button onClick={() => toggleVisibility(item.id)} className="hover:text-white">
                                            {visibility[item.id] ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => openDeleteConfirmation(item.id)} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {renderItemContent(item)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                title="Delete Item"
                message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setItemToDelete(null)}
                confirmText="Delete"
            />
        </div>
    );
};

export default VaultPage;
