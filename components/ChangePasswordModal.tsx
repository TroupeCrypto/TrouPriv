
import React, { useState } from 'react';
import { AppData, VaultItem } from '../types';
import { useMasterPassword } from '../contexts/MasterPasswordContext';
import { SpinnerIcon } from './icons/Icons';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: Omit<AppData, 'schemaVersion'>;
  setAppData: React.Dispatch<React.SetStateAction<Omit<AppData, 'schemaVersion'>>>;
  vaultItems: VaultItem[];
  setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, appData, setAppData, vaultItems, setVaultItems }) => {
    const { masterPassword, changeMasterPassword, clearPassword } = useMasterPassword();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        setIsProcessing(false);
        onClose();
    };

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword === currentPassword) {
            setError("New password must be different from the current password.");
            return;
        }
        if (!masterPassword) {
             setError("Vault is locked. Cannot verify current password.");
             return;
        }
        if (currentPassword !== masterPassword) {
             setError("The current password you entered is incorrect.");
             return;
        }

        setIsProcessing(true);

        try {
            await changeMasterPassword(currentPassword, newPassword, vaultItems, setVaultItems);
            
            setSuccess("Master password changed successfully!");
            setTimeout(handleClose, 2000);

        } catch (err) {
            console.error("Password change failed:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred. Your password has not been changed.");
            setIsProcessing(false);
            // If re-encryption fails, it's safer to lock the vault to force re-authentication
            clearPassword();
        }
    };

    if (!isOpen) return null;
    
    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out; }
            `}</style>
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-md w-full">
                <div className="p-6">
                    <h3 id="dialog-title" className="text-xl font-bold text-white mb-4">Change Master Password</h3>
                    {!success && (
                        <div className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Current Master Password" 
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={commonInputStyle}
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="New Master Password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={commonInputStyle}
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="Confirm New Password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={commonInputStyle}
                                required
                            />
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    {success && <p className="text-green-400 text-sm mt-4 text-center font-semibold">{success}</p>}
                    
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleChangePassword}
                            disabled={isProcessing || !!success}
                            className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center w-36"
                        >
                            {isProcessing ? <SpinnerIcon className="w-5 h-5" /> : 'Change Password'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;