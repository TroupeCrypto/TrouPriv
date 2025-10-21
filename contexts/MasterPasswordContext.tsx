
import React, { createContext, useState, useCallback, useContext } from 'react';
import { AppData, VaultItem } from '../types';
import { decrypt, encrypt } from '../utils/encryption';
import { get as getData, set as saveData, remove as removeData } from '../utils/storage';

interface MasterPasswordContextType {
    masterPassword: string | null;
    isUnlocked: boolean;
    isVaultConfigured: boolean;
    isSettingInitialPassword: boolean;
    isVerifying: boolean;
    verificationError: string | null;
    verifyAndSetPassword: (password: string) => Promise<boolean>;
    clearPassword: () => void;
    changeMasterPassword: (
        oldPassword: string, 
        newPassword: string, 
        vaultItems: VaultItem[],
        setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>
    ) => Promise<void>;
    setInitialMasterPassword: (password: string) => Promise<void>;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

const MASTER_PASSWORD_KEY = 'masterPassword';
const VAULT_VERIFICATION_KEY = 'vaultVerification';
const VERIFICATION_STRING = 'trouprive-vault-check';

export const MasterPasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [masterPassword, setMasterPassword] = useState<string | null>(() => getData(MASTER_PASSWORD_KEY, null));
    const [isVaultConfigured, setIsVaultConfigured] = useState<boolean>(() => !!getData(VAULT_VERIFICATION_KEY, null));
    const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const isUnlocked = !!masterPassword;

    const clearPassword = useCallback(() => {
        setMasterPassword(null);
        removeData(MASTER_PASSWORD_KEY);
    }, []);
    
    const setInitialMasterPassword = useCallback(async (password: string) => {
        if (!password) {
            throw new Error("Cannot set an empty initial password.");
        }
        setIsSettingInitialPassword(true);
        try {
            const verificationItem = await encrypt(VERIFICATION_STRING, password);
            const success = saveData(VAULT_VERIFICATION_KEY, verificationItem);
            if (!success) {
                // saveData helper already alerts user on critical failure
                throw new Error("Failed to save verification key to storage.");
            }
            
            setMasterPassword(password);
            saveData(MASTER_PASSWORD_KEY, password);
            
            setIsVaultConfigured(true);
        } catch (e) {
            console.error("Failed to set initial master password and verification item.", e);
            removeData(VAULT_VERIFICATION_KEY);
            setIsVaultConfigured(false);
            clearPassword();
            // Propagate error to UI
            throw new Error(e instanceof Error ? e.message : "Failed to create vault encryption key. Please try again.");
        } finally {
            setIsSettingInitialPassword(false);
        }
    }, [clearPassword]);
    
    const verifyAndSetPassword = useCallback(async (password: string): Promise<boolean> => {
        if (!password) {
            setVerificationError("Password cannot be empty.");
            return false;
        }

        const verificationItem = getData<string | null>(VAULT_VERIFICATION_KEY, null);
        if (!verificationItem) {
            setVerificationError("No vault has been configured. Cannot verify password.");
            setIsVaultConfigured(false);
            return false;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const decryptedCheck = await decrypt(verificationItem, password);
            if (decryptedCheck !== VERIFICATION_STRING) {
                throw new Error("Decrypted content does not match verification string.");
            }
            setMasterPassword(password);
            saveData(MASTER_PASSWORD_KEY, password);
            setIsVerifying(false);
            return true;
        } catch (e) {
            console.error("Password verification failed:", e);
            setVerificationError("Invalid password.");
            setIsVerifying(false);
            clearPassword();
            return false;
        }
    }, [clearPassword]);

    const changeMasterPassword = useCallback(async (
        oldPassword: string,
        newPassword: string,
        vaultItems: VaultItem[],
        setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>
    ) => {
        // 1. Perform re-encryption on the current state of vault items
        const reEncryptedItems = await Promise.all(
            vaultItems.map(async (item) => {
                const decryptedContentStr = await decrypt(item.encryptedContent, oldPassword);
                const reEncryptedContent = await encrypt(decryptedContentStr, newPassword);
                return { ...item, encryptedContent: reEncryptedContent };
            })
        );

        // 2. Create the new verification key
        const newVerificationItem = await encrypt(VERIFICATION_STRING, newPassword);
        
        // 3. Update the state and persisted storage
        setVaultItems(reEncryptedItems); // This will trigger the useEffect in App.tsx to save it
        saveData(VAULT_VERIFICATION_KEY, newVerificationItem); // Save the new verification key
        
        // 4. Update the active master password in the context and persistent storage
        setMasterPassword(newPassword);
        saveData(MASTER_PASSWORD_KEY, newPassword);

    }, [setMasterPassword]);

    const value = {
        masterPassword,
        isUnlocked,
        isVaultConfigured,
        isSettingInitialPassword,
        isVerifying,
        verificationError,
        verifyAndSetPassword,
        clearPassword,
        changeMasterPassword,
        setInitialMasterPassword,
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