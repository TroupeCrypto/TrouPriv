

import React, { useState, useMemo, useCallback } from 'react';
// FIX: Use relative paths for local modules
import { VaultItem, VaultItemType } from '../types';
import { encrypt } from '../utils/encryption';
// FIX: Use relative paths for local modules
import { VaultIcon, KeyIcon, FileTextIcon, EyeIcon, EyeOffIcon, CopyIcon, TrashIcon, GlobeIcon } from '../components/icons/Icons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BatchImportModal from '../components/BatchImportModal';
import { useVault, DecryptedVaultItem } from '../contexts/VaultContext';
import { useMasterPassword } from '../contexts/MasterPasswordContext';

interface VaultPageProps {
  vaultItems: VaultItem[];
  setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>;
}

const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

const SetupVaultForm: React.FC = () => {
    const { setInitialMasterPassword, isSettingInitialPassword } = useMasterPassword();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        try {
            await setInitialMasterPassword(password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create vault. Please try again.");
        }
    };

    return (
      <div className="max-w-md mx-auto text-center p-8 bg-gray-900/50 border border-white/10 rounded-lg">
        <VaultIcon className="w-12 h-12 mx-auto text-cyan-400" />
        <h2 className="text-2xl font-bold mt-4">Create Your Vault</h2>
        <p className="text-gray-400 mt-2">Set a strong master password to encrypt your sensitive data.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            name="password"
            placeholder="New Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={commonInputStyle}
            required
            disabled={isSettingInitialPassword}
          />
          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm Master Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={commonInputStyle}
            required
            disabled={isSettingInitialPassword}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isSettingInitialPassword} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600">
            {isSettingInitialPassword ? 'Creating...' : 'Create Vault'}
          </button>
        </form>
      </div>
    );
};


const VaultPage: React.FC<VaultPageProps> = ({ vaultItems, setVaultItems }) => {
    const { decryptedItems, failedItems, decryptionError } = useVault();
    const {
        isUnlocked,
        isVaultConfigured,
        isVerifying,
        verificationError,
        verifyAndSetPassword,
        clearPassword,
        masterPassword,
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
    const [showBatchImport, setShowBatchImport] = useState(false);

    const handleUnlock = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
        if (passwordInput) {
            const success = await verifyAndSetPassword(passwordInput.value);
            if (!success) {
                // Clear password only on failure for better UX
                passwordInput.value = '';
            }
        }
    }, [verifyAndSetPassword]);

    const handleLock = () => {
        clearPassword();
        setVisibility({});
        setShowNewItemForm(false);
        setShowBatchImport(false);
    };
    
    const handleBatchImport = (newItems: VaultItem[]) => {
        setVaultItems(prev => [...prev, ...newItems]);
        setShowBatchImport(false);
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
                alert("Please fill out Key/Secret and Website for API Keys.");
                return;
            }
            contentToEncrypt = JSON.stringify({ key: newItemContent, notes: newItemNotes });
            websiteForSave = newItemWebsite;
        } else { // 'secret'
            if (!newItemContent) {
                alert("Please provide the secret content.");
                return;
            }
            contentToEncrypt = newItemContent;
            websiteForSave = newItemWebsite || undefined;
        }

        if (!masterPassword) {
            alert("Vault is locked. Cannot add item.");
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
                website: websiteForSave,
            };
            setVaultItems(prev => [...prev, newItem]);
            setSaveStatus('saved');
            
            // Reset form
            setShowNewItemForm(false);
            setNewItemName('');
            setNewItemType('secret');
            setNewItemContent('');
            setNewItemWebsite('');
            setNewItemNotes('');
            setNewItemUsername('');
            setNewItemPassword('');

        } catch (err) {
            console.error("Failed to encrypt and save item:", err);
            alert("Failed to save item. Please check the console for details.");
        } finally {
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };
    
    const confirmDeleteItem = () => {
        if (itemToDelete) {
            setVaultItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            setItemToDelete(null);
        }
    };

    const handleCopyContent = useCallback((content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(content);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    const toggleVisibility = useCallback((id: string) => {
        setVisibility(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);
    
    const sortedItems = useMemo(() => {
        return [...decryptedItems, ...failedItems].sort((a, b) => a.name.localeCompare(b.name));
    }, [decryptedItems, failedItems]);
    
    if (!isVaultConfigured) {
        return <SetupVaultForm />;
    }

    if (!isUnlocked) {
        return (
            <div className="max-w-md mx-auto text-center p-8 bg-gray-900/50 border border-white/10 rounded-lg">
                <KeyIcon className="w-12 h-12 mx-auto text-cyan-400" />
                <h2 className="text-2xl font-bold mt-4">Unlock Your Vault</h2>
                <p className="text-gray-400 mt-2">Enter your master password to access your secrets.</p>
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
                        {isVerifying ? 'Unlocking...' : 'Unlock'}
                    </button>
                </form>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <VaultIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Vault</h1>
                        <p className="text-gray-400 text-sm">Your encrypted secrets and API keys.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowNewItemForm(true)} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        + Add New Item
                    </button>
                    <button onClick={() => setShowBatchImport(true)} className="bg-cyan-500/80 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        📋 Batch Import
                    </button>
                    <button onClick={handleLock} className="bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Lock Vault
                    </button>
                </div>
            </header>

            {showNewItemForm && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full">
                        <form onSubmit={handleAddItem} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Add New Vault Item</h2>
                            <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Item Name" required className={commonInputStyle} />
                            <select value={newItemType} onChange={e => setNewItemType(e.target.value as VaultItemType)} className={commonInputStyle}>
                                <option value="secret">Secret</option>
                                <option value="apiKey">API Key</option>
                                <option value="login">Login</option>
                            </select>
                            
                            {newItemType === 'login' && (
                                <>
                                    <input type="text" value={newItemWebsite} onChange={e => setNewItemWebsite(e.target.value)} placeholder="Website URL" required className={commonInputStyle} />
                                    <input type="text" value={newItemUsername} onChange={e => setNewItemUsername(e.target.value)} placeholder="Username" required className={commonInputStyle} />
                                    <input type="password" value={newItemPassword} onChange={e => setNewItemPassword(e.target.value)} placeholder="Password" required className={commonInputStyle} />
                                </>
                            )}
                            {newItemType === 'apiKey' && (
                                <>
                                    <input type="text" value={newItemWebsite} onChange={e => setNewItemWebsite(e.target.value)} placeholder="Website URL (e.g., openai.com)" required className={commonInputStyle} />
                                    <textarea value={newItemContent} onChange={e => setNewItemContent(e.target.value)} placeholder="API Key or Secret" required rows={3} className={commonInputStyle}></textarea>
                                    <textarea value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className={commonInputStyle}></textarea>
                                </>
                            )}
                            {newItemType === 'secret' && (
                                <>
                                     <input type="text" value={newItemWebsite} onChange={e => setNewItemWebsite(e.target.value)} placeholder="Website (optional)" className={commonInputStyle} />
                                    <textarea value={newItemContent} onChange={e => setNewItemContent(e.target.value)} placeholder="Secret Content" required rows={4} className={commonInputStyle}></textarea>
                                </>
                            )}

                            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setShowNewItemForm(false)} className="px-6 py-2 rounded-md text-sm bg-gray-600/50 hover:bg-gray-600">Cancel</button>
                                <button type="submit" disabled={saveStatus === 'saving'} className="px-6 py-2 rounded-md text-sm bg-fuchsia-600 hover:bg-fuchsia-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BatchImportModal
                isOpen={showBatchImport}
                onClose={() => setShowBatchImport(false)}
                onImport={handleBatchImport}
                masterPassword={masterPassword || ''}
            />

            {decryptionError && <p className="text-yellow-400 bg-yellow-900/30 p-3 rounded-md text-sm">{decryptionError}</p>}
            
            <div className="space-y-3">
                {sortedItems.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                        <VaultIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <h3 className="text-xl font-semibold text-white mt-4">Your Vault is Empty</h3>
                        <p className="text-gray-400 mt-2">Click "+ Add New Item" to secure your first secret.</p>
                    </div>
                ) : sortedItems.map(item => {
                    const isDecrypted = 'decryptedContent' in item;
                    const decItem = isDecrypted ? (item as DecryptedVaultItem) : null;
                    const isVisible = !!(decItem && visibility[decItem.id]);
                    
                    let displayContent = '••••••••••••••••••';
                    if (isDecrypted && isVisible) {
                         if (decItem.type === 'login' && typeof decItem.decryptedContent === 'object' && decItem.decryptedContent) {
                            const { username, password } = decItem.decryptedContent as { username: string, password?: string };
                            displayContent = `User: ${username}\nPass: ${password || 'N/A'}`;
                        } else if (decItem.type === 'apiKey' && typeof decItem.decryptedContent === 'object' && decItem.decryptedContent) {
                            const { key, notes } = decItem.decryptedContent as { key: string, notes?: string };
                            displayContent = `Key: ${key}${notes ? `\nNotes: ${notes}` : ''}`;
                        } else {
                            displayContent = decItem.decryptedContent as string;
                        }
                    }

                    return (
                        <div key={item.id} className={`p-4 rounded-lg border ${isDecrypted ? 'bg-gray-900/50 border-white/10' : 'bg-red-900/20 border-red-500/30'}`}>
                           <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="text-gray-500 pt-1">
                                        {item.type === 'login' && <KeyIcon className="w-5 h-5"/>}
                                        {item.type === 'apiKey' && <KeyIcon className="w-5 h-5 text-yellow-400"/>}
                                        {item.type === 'secret' && <FileTextIcon className="w-5 h-5"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{item.name}</p>
                                        {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate flex items-center gap-1"><GlobeIcon className="w-3 h-3"/>{item.website}</a>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isDecrypted && (
                                         <>
                                            <button onClick={() => toggleVisibility(item.id)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700">{isVisible ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                                            <button onClick={() => handleCopyContent(displayContent)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700">{copied === displayContent ? <span className="text-xs">Copied!</span> : <CopyIcon className="w-4 h-4" />}</button>
                                        </>
                                    )}
                                    <button onClick={() => setItemToDelete(item)} className="p-1.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-900/50"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                           </div>
                           <div className="mt-2 pl-8">
                               {isDecrypted ? (
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-800/50 p-2 rounded-md">{displayContent}</pre>
                               ) : (
                                   <p className="text-xs text-red-300">Could not decrypt. Encrypted with a different password?</p>
                               )}
                           </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                title="Delete Vault Item"
                message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
                onConfirm={confirmDeleteItem}
                onCancel={() => setItemToDelete(null)}
                confirmText="Delete"
            />
        </div>
    );
};

// FIX: Add default export to make the component available for import.
export default VaultPage;
