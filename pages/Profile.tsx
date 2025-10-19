import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
// FIX: Use relative paths for local modules
import { Profile, AppData, Alert, CryptoCurrency, Page } from '../types';
// FIX: Use relative paths for local modules
import { TrashIcon, EditIcon, SparklesIcon, SpinnerIcon } from '../components/icons/Icons';

interface ProfilePageProps {
  profile: Profile;
  // FIX: Updated the type of `setProfile` to correctly accept a function updater, which is how it's used in the `useEffect` hook for auto-saving.
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  allData: Omit<AppData, 'schemaVersion' | 'settings'>;
  loadAllData: (data: AppData) => void;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  cryptoCurrencies: CryptoCurrency[];
  setPage: (page: Page) => void;
}

const AlertsManager: React.FC<{
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  cryptoCurrencies: CryptoCurrency[];
}> = ({ alerts, setAlerts, cryptoCurrencies }) => {
    const [cryptoId, setCryptoId] = useState(cryptoCurrencies.length > 0 ? cryptoCurrencies[0].id : '');
    const [direction, setDirection] = useState<'above' | 'below'>('above');
    const [target, setTarget] = useState('');

    const handleAddAlert = (e: React.FormEvent) => {
        e.preventDefault();
        const targetPrice = parseFloat(target);
        if (!cryptoId || !target || isNaN(targetPrice)) {
            alert('Please fill out all fields correctly.');
            return;
        }

        const newAlert: Alert = {
            id: Date.now().toString(),
            cryptoId,
            target: targetPrice,
            direction,
        };
        setAlerts(prev => [...prev, newAlert]);
        setTarget('');
    };

    const handleRemoveAlert = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    return (
      <div className="space-y-6">
        <form onSubmit={handleAddAlert} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2">
                <label className="text-xs text-gray-400">Cryptocurrency</label>
                <select value={cryptoId} onChange={e => setCryptoId(e.target.value)} className={commonInputStyle}>
                    {cryptoCurrencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400">Direction</label>
                <select value={direction} onChange={e => setDirection(e.target.value as 'above' | 'below')} className={commonInputStyle}>
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                </select>
            </div>
            <div>
                <label className="text-xs text-gray-400">Target Price</label>
                <input type="number" step="any" value={target} onChange={e => setTarget(e.target.value)} placeholder="$" className={commonInputStyle} />
            </div>
            <button type="submit" className="sm:col-span-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors">Add Alert</button>
        </form>

        <div className="space-y-2">
            <h4 className="text-md font-semibold text-gray-300 border-b border-white/10 pb-2">Active Alerts</h4>
            {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No price alerts set.</p>
            ) : (
                <ul className="divide-y divide-white/10">
                    {alerts.map(alert => {
                        const crypto = cryptoCurrencies.find(c => c.id === alert.cryptoId);
                        return (
                            <li key={alert.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold">{crypto?.name || 'Unknown'}</span>
                                    <span className="text-gray-400 text-sm"> to go {alert.direction} </span>
                                    <span className="font-mono">${alert.target.toFixed(2)}</span>
                                </div>
                                <button onClick={() => handleRemoveAlert(alert.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
      </div>
    )
};

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, setProfile, allData, loadAllData, alerts, setAlerts, cryptoCurrencies, setPage }) => {
  const [formData, setFormData] = useState({
      name: profile.name,
      bio: profile.bio || '',
      website: profile.website || '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'typing' | 'saved'>('idle');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveStatus !== 'typing') return;

    const handler = setTimeout(() => {
      setProfile(prevProfile => ({ ...prevProfile, ...formData }));
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(handler);
  }, [formData, setProfile, saveStatus]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setSaveStatus('typing');
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const MAX_AVATAR_SIZE_MB = 2;
      if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
          alert(`Image is too large. Please select a file smaller than ${MAX_AVATAR_SIZE_MB}MB.`);
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          const newAvatarUrl = e.target?.result;
          if (typeof newAvatarUrl === 'string') {
              setProfile({ ...profile, avatarUrl: newAvatarUrl });
          }
      };
      reader.readAsDataURL(file);
  };

  const handleGenerateBio = async () => {
      setIsGeneratingBio(true);
      const categoryMap = new Map(allData.assetCategories.map(c => [c.id, c.name]));
      const assetTypes = [...new Set(allData.assets.map(a => categoryMap.get(a.categoryId) || ''))].filter(Boolean).slice(0, 4).join(', ');

      const prompt = `Write a short, creative, and engaging user bio (2-3 sentences) for a personal finance dashboard.
          - User's Name: ${profile.name}
          - Their assets include: ${assetTypes || 'a diverse collection of items'}.
          - Tone: Slightly futuristic, creative, and confident.
      `;
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          setFormData(prev => ({ ...prev, bio: response.text.trim() }));
          setSaveStatus('typing');
      } catch (err) {
          console.error("Bio generation failed:", err);
          alert("Could not generate a bio at this time.");
      } finally {
          setIsGeneratingBio(false);
      }
  };


  const handleExportData = () => {
    const dataToExport: AppData = { ...allData, settings: (allData as AppData).settings, schemaVersion: 1 };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `trouprive_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure you want to import data? This will overwrite all current data in the application.")) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not valid text.");
        const importedData: AppData = JSON.parse(text);
        
        if (importedData.schemaVersion !== 1) {
            throw new Error(`Unsupported schema version. Expected 1, got ${importedData.schemaVersion}.`);
        }
        
        loadAllData(importedData);
        alert("Data imported successfully!");
      } catch (error) {
        console.error("Import failed:", error);
        alert(`Failed to import data. Please check the file format and content. Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-12 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="relative w-24 h-24 mx-auto group">
            <img src={profile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full ring-4 ring-cyan-500/50 object-cover" />
            <button 
                onClick={handleAvatarClick} 
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Change avatar"
            >
                <EditIcon className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
        </div>
        <h2 className="text-3xl font-bold pt-2">{profile.name}</h2>
        {profile.website && (
            <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">
                {profile.website.replace(/https?:\/\//, '')}
            </a>
        )}
        <p className="text-gray-400 max-w-md mx-auto">{profile.bio || 'Welcome to your secure space.'}</p>
      </div>

      <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Edit Profile</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Display Name</label>
            <div className="relative">
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none pr-24"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio</label>
                <button
                    onClick={handleGenerateBio}
                    disabled={isGeneratingBio}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-white disabled:text-gray-500 transition-colors"
                >
                    {isGeneratingBio ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                    Generate with AI
                </button>
            </div>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us a little about yourself..."
              className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300">Website</label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
           <div className="h-4 text-right transition-opacity duration-300">
                {saveStatus === 'typing' && <span className="text-gray-400 text-xs italic">Typing...</span>}
                {saveStatus === 'saved' && <span className="text-green-400 text-xs font-semibold">✓ Saved</span>}
            </div>
        </div>
      </div>

      <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Price Alerts</h3>
        <p className="text-sm text-gray-400 mb-6">Get notified when your favorite cryptocurrencies hit a target price.</p>
        <AlertsManager
            alerts={alerts}
            setAlerts={setAlerts}
            cryptoCurrencies={cryptoCurrencies}
        />
      </div>

       <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Customization</h3>
        <p className="text-sm text-gray-400 mb-6">Tailor the application to your needs by managing how your assets are categorized.</p>
        <div className="flex">
          <button onClick={() => setPage(Page.ManageCategories)} className="flex-1 bg-cyan-500/80 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Manage Asset Categories
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
        <p className="text-sm text-gray-400 mb-6">Backup all your data to a single JSON file, or import from a backup to restore your entire portfolio. Your vault secrets remain encrypted in the backup file.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleExportData} className="flex-1 bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Export Data
          </button>
          <label className="flex-1 text-center bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors cursor-pointer">
            Import Data
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;