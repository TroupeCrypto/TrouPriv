import React, { useState } from 'react';
// FIX: Use relative paths for local modules
import { Page } from '../types';
// FIX: Use relative paths for local modules
import { LogoIcon, DashboardIcon, AssetsIcon, VaultIcon, ProfileIcon, SettingsIcon, CodeIcon, BusinessIcon, Share2Icon, SpinnerIcon, ProFolioIcon, AlertCircleIcon, WalletIcon, SparklesIcon, TerminalIcon, NftCollectionIcon, MenuIcon, BrainCircuitIcon } from './icons/Icons';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface HeaderProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  saveStatus: SaveStatus;
}

interface MenuItem {
  label: string;
  page?: Page;
  icon: React.ReactNode;
  children?: Omit<MenuItem, 'icon' | 'children'>[];
}

const mainNavItems: Omit<MenuItem, 'children'>[] = [
    { label: Page.Dashboard, page: Page.Dashboard, icon: <DashboardIcon className="w-5 h-5"/> },
    { label: 'BiB! AI Core', page: Page.Bib, icon: <BrainCircuitIcon className="w-5 h-5" /> },
    { label: 'AI Studio', page: Page.AIStudio, icon: <SparklesIcon className="w-5 h-5" /> },
];

const modalNavGroups: MenuItem[] = [
    {
      label: 'Portfolio',
      icon: <AssetsIcon className="w-5 h-5"/>,
      children: [
        { label: Page.Assets, page: Page.Assets },
        { label: Page.Business, page: Page.Business },
        { label: Page.Social, page: Page.Social },
      ].sort((a,b) => a.label.localeCompare(b.label))
    },
    {
      label: 'Development',
      icon: <CodeIcon className="w-5 h-5"/>,
      children: [
        { label: Page.Code, page: Page.Code },
        { label: Page.Conceptualize, page: Page.Conceptualize },
        { label: Page.Create, page: Page.Create },
        { label: Page.Design, page: Page.Design },
        { label: Page.PromptStudio, page: Page.PromptStudio },
      ].sort((a,b) => a.label.localeCompare(b.label))
    },
    {
      label: 'Web3',
      icon: <NftCollectionIcon className="w-5 h-5"/>,
      children: [
        { label: Page.ProFolio, page: Page.ProFolio },
        { label: Page.PsychedelicNftWorkshop, page: Page.PsychedelicNftWorkshop },
        { label: Page.SmartContractBuilder, page: Page.SmartContractBuilder },
        { label: Page.Wallet, page: Page.Wallet },
      ].sort((a,b) => a.label.localeCompare(b.label))
    },
];

const MenuModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    setPage: (page: Page) => void;
    groups: MenuItem[];
    currentPage: Page;
}> = ({ isOpen, onClose, setPage, groups, currentPage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-3xl w-full p-6 animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Navigation</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                    {groups.map(group => (
                        <div key={group.label} className="space-y-3">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                                {group.icon}
                                <span>{group.label}</span>
                            </h3>
                            <ul className="space-y-1">
                                {group.children?.map(item => (
                                    <li key={item.label}>
                                        <button
                                            onClick={() => {
                                                if (item.page) {
                                                    setPage(item.page);
                                                    onClose();
                                                }
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                currentPage === item.page
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const SaveStatusIndicator: React.FC<{ saveStatus: SaveStatus }> = ({ saveStatus }) => {
    return (
        <div className="h-4 absolute left-1/2 -translate-x-1/2">
            <div className={`transition-opacity duration-500 ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
                {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <SpinnerIcon className="w-3 h-3" />
                        <span>Saving...</span>
                    </div>
                )}
                {saveStatus === 'saved' && (
                    <div className="flex items-center gap-1 text-xs text-green-400 font-medium animate-pop-in">
                        <span>✓ All changes saved</span>
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-xs text-red-400 font-medium animate-pop-in">
                        <AlertCircleIcon className="w-4 h-4" />
                        <span>Save Failed! Changes may be lost.</span>
                    </div>
                )}
            </div>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ currentPage, setPage, saveStatus }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  
  return (
    <header className="space-y-4">
      <style>{`
          @keyframes pop-in {
            0% { transform: scale(0.9); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop-in { 
            animation: pop-in 0.3s ease-out forwards; 
          }
        `}</style>

      {/* Top App Bar */}
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-4">
           <div 
             className="relative"
             onMouseEnter={() => setIsProfileMenuOpen(true)}
             onMouseLeave={() => setIsProfileMenuOpen(false)}
           >
                <button title="Profile" className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center">
                    <ProfileIcon className="w-7 h-7" />
                </button>
                {isProfileMenuOpen && (
                    <ul className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-2xl p-2 z-20 animate-pop-in">
                        <li>
                            <button onClick={() => setPage(Page.Profile)} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-white/5 hover:text-white">
                                <ProfileIcon className="w-5 h-5" /> Profile
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setPage(Page.Vault)} className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-white/5 hover:text-white">
                                <VaultIcon className="w-5 h-5" /> Vault
                            </button>
                        </li>
                    </ul>
                )}
            </div>
           <div className="flex items-center gap-3">
              <LogoIcon className="w-8 h-8 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                TrouPrive
              </h1>
           </div>
        </div>

        <SaveStatusIndicator saveStatus={saveStatus} />
        
        <button onClick={() => setPage(Page.Settings)} title="Settings" className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <SettingsIcon className="w-7 h-7"/>
        </button>
      </div>

      {/* Navigation Tree */}
      <nav className="p-2 rounded-lg bg-gray-900/50 backdrop-blur-sm border border-white/10 w-full">
        <ul className="flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-2 gap-y-2">
           {mainNavItems.map(item => {
               const isActive = currentPage === item.page;
               return (
                   <li key={item.label}>
                        <button
                            onClick={() => item.page && setPage(item.page)}
                            className={`flex w-full items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 relative group
                            ${
                                isActive
                                ? 'text-white bg-white/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                   </li>
               )
            })}
             <li>
                <button
                    onClick={() => setIsMenuModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 group text-gray-400 hover:text-white hover:bg-white/5"
                >
                    <MenuIcon className="w-5 h-5" />
                    <span>Menu</span>
                </button>
             </li>
        </ul>
      </nav>
      <MenuModal 
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        setPage={setPage}
        groups={modalNavGroups}
        currentPage={currentPage}
      />
    </header>
  );
};

export default Header;