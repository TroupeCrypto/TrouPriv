
import React, { createContext, useState, useContext, useEffect } from 'react';
import { VaultItem } from '../types';
import { decrypt } from '../utils/encryption';
import { useMasterPassword } from './MasterPasswordContext';

export interface DecryptedVaultItem extends VaultItem {
    decryptedContent: string | { key: string; notes?: string } | { username: string; password?: string };
}

interface VaultContextType {
    decryptedItems: DecryptedVaultItem[];
    failedItems: VaultItem[];
    isDecrypting: boolean;
    decryptionError: string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode; vaultItems: VaultItem[] }> = ({ children, vaultItems }) => {
    const { masterPassword, isUnlocked } = useMasterPassword();
    const [decryptedItems, setDecryptedItems] = useState<DecryptedVaultItem[]>([]);
    const [failedItems, setFailedItems] = useState<VaultItem[]>([]);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptionError, setDecryptionError] = useState<string | null>(null);

    // Effect to decrypt items when master password becomes available or vault items change.
    useEffect(() => {
        const decryptAll = async () => {
            if (!masterPassword || !isUnlocked) {
                setDecryptedItems([]);
                // If not unlocked, all items are effectively "failed" from a UI perspective
                setFailedItems(vaultItems); 
                return;
            }

            setIsDecrypting(true);
            setDecryptionError(null);
            setFailedItems([]);

            const results = await Promise.allSettled(
                vaultItems.map(async (item) => {
                    const decryptedContentStr = await decrypt(item.encryptedContent, masterPassword);
                    let decryptedContent: DecryptedVaultItem['decryptedContent'];
                    try {
                        // API keys and logins are stored as JSON strings
                        decryptedContent = JSON.parse(decryptedContentStr);
                    } catch {
                        // General secrets are plain strings
                        decryptedContent = decryptedContentStr;
                    }
                    return { ...item, decryptedContent };
                })
            );

            const successfullyDecrypted: DecryptedVaultItem[] = [];
            const failedToDecrypt: VaultItem[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfullyDecrypted.push(result.value);
                } else {
                    failedToDecrypt.push(vaultItems[index]);
                }
            });

            if (failedToDecrypt.length > 0) {
                console.warn(`Failed to decrypt ${failedToDecrypt.length} vault item(s).`);
                setDecryptionError(`Failed to decrypt ${failedToDecrypt.length} item(s). They may be placeholders, corrupted, or were encrypted with a different password.`);
            } else {
                setDecryptionError(null);
            }

            setDecryptedItems(successfullyDecrypted);
            setFailedItems(failedToDecrypt);
            setIsDecrypting(false);
        };

        decryptAll();
    }, [masterPassword, vaultItems, isUnlocked]);


    const value = {
        decryptedItems,
        failedItems,
        isDecrypting,
        decryptionError,
    };

    return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = (): VaultContextType => {
    const context = useContext(VaultContext);
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
};