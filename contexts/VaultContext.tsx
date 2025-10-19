
import React, { createContext, useState, useContext, useEffect } from 'react';
import { VaultItem } from '../types';
import { decrypt } from '../utils/encryption';
import { useMasterPassword } from './MasterPasswordContext';

export interface DecryptedVaultItem extends VaultItem {
    decryptedContent: string | { key: string; notes?: string } | { username: string; password?: string };
}

interface VaultContextType {
    decryptedItems: DecryptedVaultItem[];
    isDecrypting: boolean;
    decryptionError: string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode; vaultItems: VaultItem[] }> = ({ children, vaultItems }) => {
    const { masterPassword, isUnlocked } = useMasterPassword();
    const [decryptedItems, setDecryptedItems] = useState<DecryptedVaultItem[]>([]);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptionError, setDecryptionError] = useState<string | null>(null);

    // Effect to decrypt items when master password becomes available or vault items change.
    useEffect(() => {
        const decryptAll = async () => {
            if (!masterPassword || !isUnlocked) {
                setDecryptedItems([]);
                return;
            }

            setIsDecrypting(true);
            setDecryptionError(null);

            try {
                const decrypted = await Promise.all(
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
                setDecryptedItems(decrypted);
            } catch (e) {
                console.error("Decryption failed in VaultContext:", e);
                setDecryptionError("Failed to decrypt vault items. The password might be incorrect or data corrupted.");
                setDecryptedItems([]);
            } finally {
                setIsDecrypting(false);
            }
        };

        decryptAll();
    }, [masterPassword, vaultItems, isUnlocked]);


    const value = {
        decryptedItems,
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
