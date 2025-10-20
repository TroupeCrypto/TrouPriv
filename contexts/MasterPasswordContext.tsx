
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
        const backupAppDataKey = 'appData_backup_pwd_change';
        const backupVerificationKey = `${VAULT_VERIFICATION_KEY}_backup_pwd_change`;

        // 1. Get current state and create backups
        const latestAppData = getData<Omit<AppData, 'schemaVersion'> | null>('appData', null);
        if (!latestAppData) {
            throw new Error("Could not retrieve latest data for re-encryption. Operation aborted.");
        }
        const verificationItem = getData<string | null>(VAULT_VERIFICATION_KEY, null);
        if (!verificationItem) {
            throw new Error("Could not retrieve verification key. Operation aborted.");
        }

        saveData(backupAppDataKey, latestAppData);
        saveData(backupVerificationKey, verificationItem);

        try {
            // 2. Perform re-encryption
            const reEncryptedItems = await Promise.all(
                latestAppData.vaultItems.map(async (item) => {
                    const decryptedContentStr = await decrypt(item.encryptedContent, oldPassword);
                    const reEncryptedContent = await encrypt(decryptedContentStr, newPassword);
                    return { ...item, encryptedContent: reEncryptedContent };
                })
            );

            const newVerificationItem = await encrypt(VERIFICATION_STRING, newPassword);
            const newAppData = { ...latestAppData, vaultItems: reEncryptedItems };
            
            // 3. Atomically update data (as best as possible with localStorage)
            const appDataSuccess = saveData('appData', newAppData);
            if (!appDataSuccess) {
                throw new Error("Failed to save re-encrypted app data.");
            }
            
            const verificationSuccess = saveData(VAULT_VERIFICATION_KEY, newVerificationItem);
            if (!verificationSuccess) {
                throw new Error("CRITICAL: Failed to save new verification key after re-encrypting data.");
            }
            
            // 4. Update React state and session
            setAppData(newAppData);
            setMasterPassword(newPassword);
            sessionStorage.setItem(SESSION_STORAGE_KEY, newPassword);

            // 5. Clean up backups on success
            removeData(backupAppDataKey);
            removeData(backupVerificationKey);

        } catch (error) {
            // 6. Rollback on failure
            const backupAppData = getData<Omit<AppData, 'schemaVersion'> | null>(backupAppDataKey, null);
            const backupVerification = getData<string | null>(backupVerificationKey, null);

            if (backupAppData) {
                saveData('appData', backupAppData);
            }
            if (backupVerification) {
                saveData(VAULT_VERIFICATION_KEY, backupVerification);
            }

            // Clean up backups
            removeData(backupAppDataKey);
            removeData(backupVerificationKey);
            
            // Re-throw error to be caught by the UI
            throw error;
        }
    // FIX: `setAppData` is a parameter, not a dependency. The hook depends on `setMasterPassword` from its closure.
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
