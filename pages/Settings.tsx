import React, { useState } from 'react';
import { AppSettings, Page, VaultItem } from '../types';
import { SettingsIcon, KeyIcon } from '../components/icons/Icons';
import { useMasterPassword } from '../contexts/MasterPasswordContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

interface SettingsPageProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    setPage: (page: Page) => void;
    vaultItems: VaultItem[];
    setVaultItems: React.Dispatch<React.SetStateAction<VaultItem[]>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, setSettings, setPage, vaultItems, setVaultItems }) => {
    const { isUnlocked } = useMasterPassword();
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

    const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({...prev, [key]: value }));
    };

    const commonSelectStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none";

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <header className="flex items-center gap-3 pb-4 border-b border-white/10">
                <SettingsIcon className="w-8 h-8 text-cyan-400" />
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 text-sm">Manage your application preferences.</p>
                </div>
            </header>

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">General Preferences</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-300">Default Currency</label>
                        <select
                            id="defaultCurrency"
                            value={settings.defaultCurrency}
                            onChange={(e) => handleSettingChange('defaultCurrency', e.target.value as AppSettings['defaultCurrency'])}
                            className={`${commonSelectStyle} mt-1`}
                        >
                            <option value="USD">USD - United States Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-200">Enable Price Alerts</p>
                        <p className="text-sm text-gray-400">Receive alerts when cryptocurrencies hit your price targets.</p>
                    </div>
                    <button
                        onClick={() => handleSettingChange('notificationsEnabled', !settings.notificationsEnabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 ${settings.notificationsEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
            
            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2"><KeyIcon className="w-5 h-5"/>Security</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Your sensitive data, such as API keys and secrets, are stored securely in the encrypted vault. Manage them there or change your master password.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setPage(Page.Vault)}
                        className="flex-1 bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Go to Vault
                    </button>
                    <button
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        disabled={!isUnlocked}
                        className="flex-1 bg-fuchsia-600/80 hover:bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                        title={!isUnlocked ? "Unlock your vault to change the master password" : ""}
                    >
                        Change Master Password
                    </button>
                </div>
            </div>
            <ChangePasswordModal 
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
                vaultItems={vaultItems}
                setVaultItems={setVaultItems}
            />
        </div>
    );
};

export default SettingsPage;
