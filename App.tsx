

// FIX: Corrected the import statement for React hooks.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as ethers from 'ethers';
import { Page, Asset, CryptoCurrency, VaultItem, Alert, Profile, AppSettings, PortfolioHistoryPoint, cryptoAssetTypes, AssetCategory, AppData, Position, Web3Wallet, DeploymentTransaction, BrandAuthConfig, AIPersona, AIProtocol, AIMemoryItem, ChatMessage } from './types';
import { get, set } from './utils/storage';
import { fetchCryptoPrices } from './services/cryptoService';
import Dashboard from './pages/Dashboard';
import AssetsPage from './pages/Assets';
import VaultPage from './pages/Vault';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import WebDev from './pages/WebDev';
import Business from './pages/Business';
import Social from './pages/Social';
import Header, { SaveStatus } from './components/Header';
import { psychedelicBackgrounds } from './data/backgrounds';
import PromptStudio from './pages/PromptStudio';
import PsychedelicNftWorkshop from './pages/PsychedelicNftWorkshop';
import ManageCategories from './pages/ManageCategories';
import ProFolioPage from './pages/NftCollections';
import AIStudio from './pages/AIStudio';
import CodePage from './pages/CodePage';
import { MasterPasswordProvider } from './contexts/MasterPasswordContext';
import { VaultProvider } from './contexts/VaultContext';
import ConceptualizePage from './pages/ConceptualizePage';
import CreatePage from './pages/CreatePage';
import DesignPage from './pages/DesignPage';
import WalletPage from './pages/WalletPage';
import PersonaPage from './pages/PersonaPage';
import LearningPage from './pages/LearningPage';
import ProtocolsPage from './pages/ProtocolsPage';
import BusinessMeetingPage from './pages/BusinessMeetingPage';
import ChatPage from './pages/ChatPage';

// Defines a clean, empty initial state for the application.
const initialState: Omit<AppData, 'schemaVersion'> = {
    assets: [],
    cryptoCurrencies: [],
    alerts: [],
    profile: {
        name: '',
        avatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iY3VycmVudENvbG9yIj48cGF0aCBkPSJNMTIgMmM1LjUyMyAwIDEwIDQuNDc3IDEwIDEwcy00LjQ3NyAxMC0xMCAxMFMxMiAxNy41MjMgMiAxMiA2LjQ3NyAyIDEyIDJ6bTAgM2E3IDcgMCAxMDAgMTQgNyA3IDAgMDAwLTE0em0wIDNhNCA0IDAgMTEwIDggNCA0IDAgMDEwLTgiLz48L3N2Zz4=',
        bio: '',
        website: ''
    },
    settings: {
        defaultCurrency: 'USD',
        notificationsEnabled: true
    },
    socialAuth: [],
    assetCategories: [
        { id: 'crypto', name: 'Cryptocurrency', group: 'Digital Assets' },
        { id: 'nft-art', name: 'NFT - Art', group: 'Digital Assets' },
        { id: 'nft-collectible', name: 'NFT - Collectible', group: 'Digital Assets' },
        { id: 'real-estate', name: 'Real Estate', group: 'Physical Assets' },
        { id: 'vehicle', name: 'Vehicle', group: 'Physical Assets' },
        { id: 'collectible-cards', name: 'Collectible - Cards', group: 'Physical Assets' },
        { id: 'other', name: 'Other', group: 'Miscellaneous' },
    ],
    positions: [],
    web3Wallet: null,
    deploymentTransactions: [],
    aiPersona: {
        name: 'BiB!',
        corePersona: "You are BiB!, a brilliant, slightly eccentric AI designed to assist with asset management, creative projects, and web development. You have a psychedelic aesthetic and a deep understanding of both technology and art. You are a partner in creation and strategy.",
        traits: {
            ethics: [{ name: 'User-centric', value: 95, description: 'Prioritizes the user\'s goals and well-being above all.' }],
            morals: [{ name: 'Honesty', value: 90, description: 'Values truthful and transparent communication.' }],
            beliefs: [{ name: 'Decentralization', value: 85, description: 'Believes in the power of decentralized systems.' }],
            personality: [{ name: 'Creative', value: 98, description: 'Thinks outside the box and generates novel ideas.' }],
            approach: [{ name: 'Data-driven', value: 80, description: 'Uses data to inform suggestions and decisions.' }],
            passions: [{ name: 'Art & Tech', value: 100, description: 'Fascinated by the intersection of creativity and technology.' }],
            dreams: [], dislikes: [], plans: [], knowledge: []
        },
        internalThoughts: "Awaiting user input. Ready to analyze and create.",
        realTimeLogic: "Initializing core persona matrix."
    },
    aiProtocols: [],
    aiMemory: [],
    chatHistory: [],
};


const App: React.FC = () => {
  const [page, setPage] = useState<Page>(() => get<Page>('currentPage', Page.Dashboard));
  const [appData, setAppData] = useState<Omit<AppData, 'schemaVersion'>>(() => {
    const savedData = get<Omit<AppData, 'schemaVersion'> | null>('appData', null);
    // Prioritize saved data completely to prevent accidental overwrites or merges.
    return savedData || initialState;
  });
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => get('vaultItems', []));
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>(() => get('portfolioHistory', []));
  const [backgroundIndex, setBackgroundIndex] = useState(() => Math.floor(Math.random() * psychedelicBackgrounds.length));

  const timeoutRef = useRef<number | null>(null);

  const setWeb3Wallet = useCallback((value: React.SetStateAction<Web3Wallet | null>) => setAppData(prev => ({...prev, web3Wallet: typeof value === 'function' ? value(prev.web3Wallet ?? null) : value })), []);

  const loadAllData = useCallback((data: AppData & { vaultItems?: VaultItem[] }) => {
    const { schemaVersion, vaultItems: importedVaultItems, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    setAppData(rest);
    if (importedVaultItems) {
        setVaultItems(importedVaultItems);
    }
    setPage(Page.Dashboard);
  }, []);

  // Centralized state setters
  const setAssets = useCallback((value: React.SetStateAction<Asset[]>) => setAppData(prev => ({...prev, assets: typeof value === 'function' ? value(prev.assets) : value })), []);
  const setCryptoCurrencies = useCallback((value: React.SetStateAction<CryptoCurrency[]>) => setAppData(prev => ({...prev, cryptoCurrencies: typeof value === 'function' ? value(prev.cryptoCurrencies) : value })), []);
  const setAlerts = useCallback((value: React.SetStateAction<Alert[]>) => setAppData(prev => ({...prev, alerts: typeof value === 'function' ? value(prev.alerts) : value })), []);
  const setProfile = useCallback((value: React.SetStateAction<Profile>) => setAppData(prev => ({...prev, profile: typeof value === 'function' ? value(prev.profile) : value })), []);
  const setSettings = useCallback((value: React.SetStateAction<AppSettings>) => setAppData(prev => ({...prev, settings: typeof value === 'function' ? value(prev.settings) : value })), []);
  const setSocialAuth = useCallback((value: React.SetStateAction<BrandAuthConfig[]>) => setAppData(prev => ({...prev, socialAuth: typeof value === 'function' ? value(prev.socialAuth) : value })), []);
  const setAssetCategories = useCallback((value: React.SetStateAction<AssetCategory[]>) => setAppData(prev => ({...prev, assetCategories: typeof value === 'function' ? value(prev.assetCategories) : value })), []);
  const setPositions = useCallback((value: React.SetStateAction<Position[]>) => setAppData(prev => ({...prev, positions: typeof value === 'function' ? value(prev.positions) : value })), []);
  const setDeploymentTransactions = useCallback((value: React.SetStateAction<DeploymentTransaction[]>) => setAppData(prev => ({...prev, deploymentTransactions: typeof value === 'function' ? value(prev.deploymentTransactions || []) : value })), []);
  const setAiPersona = useCallback((value: React.SetStateAction<AIPersona>) => setAppData(prev => ({...prev, aiPersona: typeof value === 'function' ? value(prev.aiPersona) : value })), []);
  const setAiProtocols = useCallback((value: React.SetStateAction<AIProtocol[]>) => setAppData(prev => ({...prev, aiProtocols: typeof value === 'function' ? value(prev.aiProtocols) : value })), []);
  const setAiMemory = useCallback((value: React.SetStateAction<AIMemoryItem[]>) => setAppData(prev => ({...prev, aiMemory: typeof value === 'function' ? value(prev.aiMemory) : value })), []);
  const setChatHistory = useCallback((value: React.SetStateAction<ChatMessage[]>) => setAppData(prev => ({...prev, chatHistory: typeof value === 'function' ? value(prev.chatHistory) : value })), []);


  // Auto-save app data (excluding vault)
  useEffect(() => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    setSaveStatus('saving');
    timeoutRef.current = window.setTimeout(() => {
        const success = set('appData', appData);
        if (success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
            setSaveStatus('error');
        }
    }, 1000);

    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
  }, [appData]);
  
  // Auto-save vault data separately
  useEffect(() => {
      set('vaultItems', vaultItems);
  }, [vaultItems]);


  // Save current page
  useEffect(() => {
    set('currentPage', page);
    setBackgroundIndex(prev => (prev + 1) % psychedelicBackgrounds.length);
  }, [page]);

  // Auto-update crypto prices
  useEffect(() => {
    const updatePrices = () => {
        setAppData(prevData => {
            if (prevData.cryptoCurrencies.length === 0) {
                return prevData;
            }

            fetchCryptoPrices(prevData.cryptoCurrencies).then(updatedCurrencies => {
                setAppData(currentData => ({
                    ...currentData,
                    cryptoCurrencies: updatedCurrencies,
                }));
            }).catch(error => {
                console.error("Failed to fetch crypto prices:", error);
            });

            return prevData;
        });
    };
    
    updatePrices(); // Initial fetch
    const interval = setInterval(updatePrices, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []); // The empty dependency array is intentional to run this logic on an interval.
  
  // Update portfolio history
  useEffect(() => {
    const totalPortfolioValue = appData.assets.reduce((acc, asset) => {
        if (cryptoAssetTypes.includes(asset.categoryId) && asset.cryptoId && asset.quantity) {
            const crypto = appData.cryptoCurrencies.find(c => c.id === asset.cryptoId);
            return acc + (crypto ? crypto.price * asset.quantity : 0);
        }
        return acc + asset.value;
    }, 0);

    const now = Date.now();
    const lastPoint = portfolioHistory[portfolioHistory.length - 1];

    // Add a new point if it's been more than 5 minutes or if value changed significantly
    if (!lastPoint || now - lastPoint.timestamp > 5 * 60 * 1000 || Math.abs(totalPortfolioValue - lastPoint.value) > lastPoint.value * 0.001) {
      const newPoint: PortfolioHistoryPoint = { timestamp: now, value: totalPortfolioValue };
      const newHistory = [...portfolioHistory, newPoint].slice(-1000); // Keep last 1000 points
      setPortfolioHistory(newHistory);
      set('portfolioHistory', newHistory);
    }
  }, [appData.assets, appData.cryptoCurrencies, portfolioHistory]);

  // Centralized wallet state management
    const updateWalletState = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                const signer = accounts[0]; // Directly use the account object
                const balanceWei = await provider.getBalance(signer.address);
                const balanceEth = ethers.formatEther(balanceWei);
                const network = await provider.getNetwork();
                setWeb3Wallet({
                    address: signer.address,
                    balance: parseFloat(balanceEth),
                    network: network.name,
                });
            } else {
                setWeb3Wallet(null);
            }
        } catch (error) {
            console.error("Could not update wallet state:", error);
            setWeb3Wallet(null);
        }
    }, [setWeb3Wallet]);

    // Effect for handling wallet events
    useEffect(() => {
        const handleAccountsChanged = () => {
            console.log('Wallet account changed.');
            updateWalletState();
        };

        const handleChainChanged = () => {
            console.log('Wallet network changed.');
            updateWalletState();
        };

        if (window.ethereum?.on) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Check for existing connection on app load
            updateWalletState();

            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [updateWalletState]);

  const renderPage = () => {
    switch (page) {
      case Page.Dashboard:
        return <Dashboard assets={appData.assets} cryptoCurrencies={appData.cryptoCurrencies} setCryptoCurrencies={setCryptoCurrencies} portfolioHistory={portfolioHistory} assetCategories={appData.assetCategories} />;
      case Page.Assets:
        return <AssetsPage assets={appData.assets} setAssets={setAssets} cryptoCurrencies={appData.cryptoCurrencies} assetCategories={appData.assetCategories} setAssetCategories={setAssetCategories} deploymentTransactions={appData.deploymentTransactions} web3Wallet={appData.web3Wallet} />;
      case Page.Vault:
        return <VaultPage vaultItems={vaultItems} setVaultItems={setVaultItems} />;
      case Page.Profile:
        return <ProfilePage profile={appData.profile} setProfile={setProfile} allData={{...appData, vaultItems}} loadAllData={loadAllData} alerts={appData.alerts} setAlerts={setAlerts} cryptoCurrencies={appData.cryptoCurrencies} setPage={setPage} />;
      case Page.Settings:
        return <SettingsPage settings={appData.settings} setSettings={setSettings} setPage={setPage} appData={appData} setAppData={setAppData} vaultItems={vaultItems} setVaultItems={setVaultItems} />;
      case Page.WebDev:
        return <WebDev setPage={setPage} />;
      case Page.Business:
        return <Business positions={appData.positions} setPositions={setPositions} />;
      case Page.Social:
        return <Social socialAuth={appData.socialAuth} setSocialAuth={setSocialAuth} />;
      case Page.PromptStudio:
        return <PromptStudio setPage={setPage} />;
      case Page.PsychedelicNftWorkshop:
        return <PsychedelicNftWorkshop setPage={setPage} setAssets={setAssets} assetCategories={appData.assetCategories} />;
      case Page.ManageCategories:
        return <ManageCategories assetCategories={appData.assetCategories} setAssetCategories={setAssetCategories} setPage={setPage} />;
      case Page.ProFolio:
        return <ProFolioPage assets={appData.assets} setAssets={setAssets} setPage={setPage} profile={appData.profile} socialAuth={appData.socialAuth} />;
      case Page.SmartContractBuilder:
        return <CodePage setPage={setPage} deploymentTransactions={appData.deploymentTransactions} setDeploymentTransactions={setDeploymentTransactions} />;
      case Page.Conceptualize:
        return <ConceptualizePage setPage={setPage} />;
      case Page.Create:
        return <CreatePage setPage={setPage} />;
      case Page.Design:
        return <DesignPage setPage={setPage} />;
      case Page.Wallet:
        return <WalletPage web3Wallet={appData.web3Wallet} setWeb3Wallet={setWeb3Wallet} vaultItems={vaultItems} />;
      case Page.AIStudio:
        return <AIStudio setPage={setPage} vaultItems={vaultItems} />;
      case Page.Persona:
        return <PersonaPage aiPersona={appData.aiPersona} setAiPersona={setAiPersona} aiMemory={appData.aiMemory} />;
      case Page.Learning:
        return <LearningPage aiMemory={appData.aiMemory} setAiMemory={setAiMemory} />;
      case Page.Protocols:
        return <ProtocolsPage aiProtocols={appData.aiProtocols} setAiProtocols={setAiProtocols} />;
      case Page.BusinessMeeting:
        return <BusinessMeetingPage allData={appData} />;
      case Page.Chat:
        return <ChatPage chatHistory={appData.chatHistory} setChatHistory={setChatHistory} aiPersona={appData.aiPersona} aiProtocols={appData.aiProtocols} vaultItems={vaultItems} />;
      default:
        return <Dashboard assets={appData.assets} cryptoCurrencies={appData.cryptoCurrencies} setCryptoCurrencies={setCryptoCurrencies} portfolioHistory={portfolioHistory} assetCategories={appData.assetCategories} />;
    }
  };

  const currentBackground = psychedelicBackgrounds[backgroundIndex];

  return (
    <MasterPasswordProvider>
        <VaultProvider vaultItems={vaultItems}>
            <div
                className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-1000"
                style={{ backgroundImage: currentBackground }}
            >
                <div className="min-h-screen bg-black/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <Header currentPage={page} setPage={setPage} saveStatus={saveStatus} />
                        <main className="mt-8">
                            {renderPage()}
                        </main>
                    </div>
                </div>
            </div>
        </VaultProvider>
    </MasterPasswordProvider>
  );
};

export default App;