
import React, { createContext, useState, useCallback, useContext } from 'react';
import { AppData } from '../types';
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
        appData: Omit<AppData, 'schemaVersion'>,
        setAppData: React.Dispatch<React.SetStateAction<Omit<AppData, 'schemaVersion'>>>
    ) => Promise<void>;
    setInitialMasterPassword: (password: string) => Promise<void>;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'TROUPRIVE_vault_key';
const VAULT_VERIFICATION_KEY = 'vaultVerification';
const VERIFICATION_STRING = 'trouprive-vault-check';

export const MasterPasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [masterPassword, setMasterPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_STORAGE_KEY));
    const [isVaultConfigured, setIsVaultConfigured] = useState<boolean>(() => !!getData(VAULT_VERIFICATION_KEY, null));
    const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const isUnlocked = !!masterPassword;

    const clearPassword = useCallback(() => {
        setMasterPassword(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
            sessionStorage.setItem(SESSION_STORAGE_KEY, password);
            
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
            sessionStorage.setItem(SESSION_STORAGE_KEY, password);
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
        _appData_stale: Omit<AppData, 'schemaVersion'>,
        setAppData: React.Dispatch<React.SetStateAction<Omit<AppData, 'schemaVersion'>>>
    ) => {
        const latestAppData = getData<Omit<AppData, 'schemaVersion'> | null>('appData', null);
        if (!latestAppData) {
            throw new Error("Could not retrieve latest data for re-encryption. Operation aborted.");
        }

        const reEncryptedItems = await Promise.all(
            latestAppData.vaultItems.map(async (item) => {
                const decryptedContentStr = await decrypt(item.encryptedContent, oldPassword);
                const reEncryptedContent = await encrypt(decryptedContentStr, newPassword);
                return { ...item, encryptedContent: reEncryptedContent };
            })
        );

        const newVerificationItem = await encrypt(VERIFICATION_STRING, newPassword);
        
        const newAppData = { ...latestAppData, vaultItems: reEncryptedItems };
        
        const appDataSuccess = saveData('appData', newAppData);
        if (!appDataSuccess) {
            throw new Error("Failed to save re-encrypted app data. Password change aborted to prevent data corruption.");
        }
        
        const verificationSuccess = saveData(VAULT_VERIFICATION_KEY, newVerificationItem);
        if (!verificationSuccess) {
            // This is a critical failure state. The app data is updated with new encryption but the verification key is not.
            // The user will be locked out. The saveData function will have already shown a critical alert.
            throw new Error("CRITICAL: Failed to save new verification key after re-encrypting data. Your vault may be inaccessible.");
        }
        
        setAppData(newAppData);
        
        setMasterPassword(newPassword);
        sessionStorage.setItem(SESSION_STORAGE_KEY, newPassword);
    }, []);

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
