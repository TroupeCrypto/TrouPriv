import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { VaultItem } from '../types';
import { decrypt, encrypt } from '../utils/encryption';

interface MasterPasswordContextType {
    masterPassword: string | null;
    isUnlocked: boolean;
    isVerifying: boolean;
    verificationError: string | null;
    verifyAndSetPassword: (password: string, vaultItems: VaultItem[]) => Promise<boolean>;
    clearPassword: () => void;
    reEncryptAndSetNewPassword: (oldPassword: string, newPassword: string, vaultItems: VaultItem[]) => Promise<VaultItem[]>;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'TROUPRIVE_vault_key';

export const MasterPasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [masterPassword, setMasterPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_STORAGE_KEY));
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const isUnlocked = !!masterPassword;

    const clearPassword = useCallback(() => {
        setMasterPassword(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }, []);
    
    // Tries to decrypt the first vault item to verify the password.
    // This is more efficient than decrypting everything.
    const verifyAndSetPassword = useCallback(async (password: string, vaultItems: VaultItem[]): Promise<boolean> => {
        if (!password) {
            setVerificationError("Password cannot be empty.");
            return false;
        }
        setIsVerifying(true);
        setVerificationError(null);

        if (vaultItems.length > 0) {
            try {
                // Test decryption on the first item
                await decrypt(vaultItems[0].encryptedContent, password);
            } catch (e) {
                console.error("Password verification failed:", e);
                setVerificationError("Invalid password.");
                setIsVerifying(false);
                clearPassword();
                return false;
            }
        }
        
        // If successful (or if vault is empty), set the password.
        setMasterPassword(password);
        sessionStorage.setItem(SESSION_STORAGE_KEY, password);
        setIsVerifying(false);
        return true;
    }, [clearPassword]);
    
    const reEncryptAndSetNewPassword = useCallback(async (
        oldPassword: string, 
        newPassword: string, 
        vaultItems: VaultItem[]
    ): Promise<VaultItem[]> => {
        
        // This function will throw an error if decryption fails, which will be caught in the component
        const reEncryptedItems = await Promise.all(
            vaultItems.map(async (item) => {
                const decryptedContentStr = await decrypt(item.encryptedContent, oldPassword);
                const reEncryptedContent = await encrypt(decryptedContentStr, newPassword);
                return { ...item, encryptedContent: reEncryptedContent };
            })
        );
        
        // After successful re-encryption, update the session password
        setMasterPassword(newPassword);
        sessionStorage.setItem(SESSION_STORAGE_KEY, newPassword);

        return reEncryptedItems;

    }, []);

    // Effect to check if the session password is still valid on load
    useEffect(() => {
        const sessionPassword = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionPassword) {
            setMasterPassword(sessionPassword);
        }
    }, []);


    const value = {
        masterPassword,
        isUnlocked,
        isVerifying,
        verificationError,
        verifyAndSetPassword,
        clearPassword,
        reEncryptAndSetNewPassword,
    };

    return <MasterPasswordContext.Provider value={value}>{children}</MasterPasswordContext.Provider>;
};

export const useMasterPassword = (): MasterPasswordContextType => {
    const context = useContext(MasterPasswordContext);
    if (context === undefined) {
        throw new Error('useMasterPassword must be used within a MasterPasswordProvider');
    }
    return context;
};
