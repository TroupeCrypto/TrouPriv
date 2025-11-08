

import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { 
    BibIcon, WalletIcon, CodeIcon, BusinessIcon, SparklesIcon, VaultIcon, 
    UserCircleIcon, HomeIcon, Share2Icon, NftCollectionIcon, ChevronDownIcon,
    ChatBubbleIcon
} from './icons/Icons';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface HeaderProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    saveStatus: SaveStatus;
}

const NavLink: React.FC<{
    page: Page;
    label: string;
    currentPage: Page;
    setPage: (page: Page) => void;
    icon: React.ReactNode;
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ page, label, currentPage, setPage, icon, breakpoint = 'lg' }) => (
    <button
        onClick={() => setPage(page)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
            currentPage === page
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        }`}
        aria-current={currentPage === page ? 'page' : undefined}
        title={label}
    >
        {icon}
        <span className={`hidden ${breakpoint}:inline`}>{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentPage, setPage, saveStatus }) => {
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const aiMenuRef = useRef<HTMLDivElement>(null);

    const getSaveStatusIndicator = () => {
        switch (saveStatus) {
            case 'saving':
                return <span className="text-xs text-yellow-400 italic">Saving...</span>;
            case 'saved':
                return <span className="text-xs text-green-400 font-semibold">✓ Saved</span>;
            case 'error':
                 return <span className="text-xs text-red-400 font-semibold">Save Error</span>;
            default:
                return <div className="h-4" />; // Placeholder to prevent layout shift
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
                setIsAiMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const mainNavItems = [
        { page: Page.Dashboard, label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
        { page: Page.Assets, label: 'Assets', icon: <SparklesIcon className="w-5 h-5" /> },
        { page: Page.Business, label: 'Business', icon: <BusinessIcon className="w-5 h-5" /> },
        { page: Page.WebDev, label: 'Web-Dev', icon: <CodeIcon className="w-5 h-5" /> },
    ];
    
    const aiPages = [ Page.Persona, Page.Learning, Page.Protocols, Page.AIStudio, Page.BusinessMeeting, Page.Chat ];
    const isCurrentPageInAi = aiPages.includes(currentPage);
    
    const aiNavItems = [
        { page: Page.Chat, label: 'Chat' },
        { page: Page.Persona, label: 'Persona' },
        { page: Page.Learning, label: 'Learning' },
        { page: Page.Protocols, label: 'Protocols' },
        { page: Page.AIStudio, label: 'AI Studio' },
        { page: Page.BusinessMeeting, label: 'Business Meeting' },
    ];
    
    const utilityNavItems = [
        { page: Page.ProFolio, label: 'ProFolio', icon: <NftCollectionIcon className="w-5 h-5" /> },
        { page: Page.Social, label: 'Social', icon: <Share2Icon className="w-5 h-5" /> },
        { page: Page.Wallet, label: 'Wallet', icon: <WalletIcon className="w-5 h-5" /> },
        { page: Page.Vault, label: 'Vault', icon: <VaultIcon className="w-5 h-5" /> },
        { page: Page.Profile, label: 'Profile', icon: <UserCircleIcon className="w-5 h-5" /> },
    ];

    return (
        <header className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-2 shadow-lg sticky top-4 z-50">
            <div className="flex flex-wrap justify-between items-center gap-2">
                {/* Left Side: Logo & Main Nav */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <BibIcon className="w-8 h-8 text-cyan-400" />
                        <h1 className="hidden md:block text-2xl font-bold text-white tracking-tighter">TrouPrive</h1>
                    </div>
                    <nav className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-md">
                        {mainNavItems.map(item => (
                            <NavLink key={item.page} {...item} currentPage={currentPage} setPage={setPage} />
                        ))}
                        {/* AI Dropdown */}
                        <div className="relative" ref={aiMenuRef}>
                            <button
                                onClick={() => setIsAiMenuOpen(prev => !prev)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isCurrentPageInAi ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}
                                title="AI Section"
                            >
                                <BibIcon className="w-5 h-5" />
                                <span className="hidden lg:inline">AI</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform hidden lg:inline ${isAiMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isAiMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-md shadow-lg py-1 animate-fade-in-fast">
                                     <style>{`
                                        @keyframes fade-in-fast { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                                        .animate-fade-in-fast { animation: fade-in-fast 0.15s ease-out; }
                                    `}</style>
                                    {aiNavItems.map(item => (
                                         <a
                                            key={item.page}
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); setPage(item.page); setIsAiMenuOpen(false); }}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${currentPage === item.page ? 'bg-cyan-500/50 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Right Side: Save Status & Utility Nav */}
                <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                        {getSaveStatusIndicator()}
                    </div>
                    <nav className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-md">
                         {utilityNavItems.map(item => (
                            <NavLink key={item.page} {...item} currentPage={currentPage} setPage={setPage} breakpoint="xl" />
                         ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;