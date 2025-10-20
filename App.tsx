


import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Added AIPersona, AIProtocol, AIMemoryItem to import
import { Page, Asset, CryptoCurrency, VaultItem, Alert, Profile, AppSettings, PortfolioHistoryPoint, cryptoAssetTypes, AssetCategory, MintedNft, AppData, Position, Web3Wallet, DeploymentTransaction, BrandAuthConfig, AIPersona, AIProtocol, AIMemoryItem, ChatMessage } from './types';
// FIX: Added initialAIPersona, initialAIProtocols, initialAIMemory to import
import { initialAssets, initialCryptoCurrencies, initialProfile, initialVaultItems, initialAlerts, initialAssetCategories, initialSettings, initialAIPersona, initialAIProtocols, initialAIMemory, initialChatHistory } from './data/mock';
import { brandAuthConfigs as initialSocialAuth } from './data/socialAuth';
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
// FIX: Use relative paths for local modules
import Header, { SaveStatus } from './components/Header';
import { psychedelicBackgrounds } from './data/backgrounds';
import PromptStudio from './pages/PromptStudio';
import Web3Tools from './pages/Web3Tools';
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


const App: React.FC = () => {
  const [page, setPage] = useState<Page>(() => get<Page>('currentPage', Page.Dashboard));
  const [appData, setAppData] = useState<Omit<AppData, 'schemaVersion'>>(() => {
    const savedData = get<Omit<AppData, 'schemaVersion'>>('appData', {
      assets: initialAssets,
      cryptoCurrencies: initialCryptoCurrencies,
      vaultItems: initialVaultItems,
      alerts: initialAlerts,
      profile: initialProfile,
      settings: initialSettings,
      socialAuth: initialSocialAuth,
      assetCategories: initialAssetCategories,
      mintedNfts: [],
      positions: [],
      web3Wallet: null,
      deploymentTransactions: [],
      // FIX: Added missing AI state properties to default initial state
      aiPersona: initialAIPersona,
      aiProtocols: initialAIProtocols,
      aiMemory: initialAIMemory,
      chatHistory: initialChatHistory,
    });
    // Ensure all keys are present even if loading older data
    return {
        assets: savedData.assets || initialAssets,
        cryptoCurrencies: savedData.cryptoCurrencies || initialCryptoCurrencies,
        vaultItems: savedData.vaultItems || initialVaultItems,
        alerts: savedData.alerts || initialAlerts,
        profile: savedData.profile || initialProfile,
        settings: savedData.settings || initialSettings,
        socialAuth: savedData.socialAuth || initialSocialAuth,
        assetCategories: savedData.assetCategories || initialAssetCategories,
        mintedNfts: savedData.mintedNfts || [],
        positions: savedData.positions || [],
        web3Wallet: savedData.web3Wallet || null,
        deploymentTransactions: savedData.deploymentTransactions || [],
        // FIX: Added missing AI state properties to handle loading from storage
        aiPersona: savedData.aiPersona || initialAIPersona,
        aiProtocols: savedData.aiProtocols || initialAIProtocols,
        aiMemory: savedData.aiMemory || initialAIMemory,
        chatHistory: savedData.chatHistory || initialChatHistory,
    };
  });
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>(() => get('portfolioHistory', []));
  const [backgroundIndex, setBackgroundIndex] = useState(() => Math.floor(Math.random() * psychedelicBackgrounds.length));

  const timeoutRef = useRef<number | null>(null);

  const loadAllData = useCallback((data: AppData) => {
    const { schemaVersion, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    setAppData(rest);
    setPage(Page.Dashboard);
  }, []);

  // Centralized state setters
  const setAssets = useCallback((value: React.SetStateAction<Asset[]>) => setAppData(prev => ({...prev, assets: typeof value === 'function' ? value(prev.assets) : value })), []);
  const setCryptoCurrencies = useCallback((value: React.SetStateAction<CryptoCurrency[]>) => setAppData(prev => ({...prev, cryptoCurrencies: typeof value === 'function' ? value(prev.cryptoCurrencies) : value })), []);
  const setVaultItems = useCallback((value: React.SetStateAction<VaultItem[]>) => setAppData(prev => ({...prev, vaultItems: typeof value === 'function' ? value(prev.vaultItems) : value })), []);
  const setAlerts = useCallback((value: React.SetStateAction<Alert[]>) => setAppData(prev => ({...prev, alerts: typeof value === 'function' ? value(prev.alerts) : value })), []);
  const setProfile = useCallback((value: React.SetStateAction<Profile>) => setAppData(prev => ({...prev, profile: typeof value === 'function' ? value(prev.profile) : value })), []);
  const setSettings = useCallback((value: React.SetStateAction<AppSettings>) => setAppData(prev => ({...prev, settings: typeof value === 'function' ? value(prev.settings) : value })), []);
  const setSocialAuth = useCallback((value: React.SetStateAction<BrandAuthConfig[]>) => setAppData(prev => ({...prev, socialAuth: typeof value === 'function' ? value(prev.socialAuth) : value })), []);
  const setAssetCategories = useCallback((value: React.SetStateAction<AssetCategory[]>) => setAppData(prev => ({...prev, assetCategories: typeof value === 'function' ? value(prev.assetCategories) : value })), []);
  const setMintedNfts = useCallback((value: React.SetStateAction<MintedNft[]>) => setAppData(prev => ({...prev, mintedNfts: typeof value === 'function' ? value(prev.mintedNfts) : value })), []);
  const setPositions = useCallback((value: React.SetStateAction<Position[]>) => setAppData(prev => ({...prev, positions: typeof value === 'function' ? value(prev.positions) : value })), []);
  const setWeb3Wallet = useCallback((value: React.SetStateAction<Web3Wallet | null>) => setAppData(prev => ({...prev, web3Wallet: typeof value === 'function' ? value(prev.web3Wallet ?? null) : value })), []);
  const setDeploymentTransactions = useCallback((value: React.SetStateAction<DeploymentTransaction[]>) => setAppData(prev => ({...prev, deploymentTransactions: typeof value === 'function' ? value(prev.deploymentTransactions || []) : value })), []);
  // FIX: Added setters for new AI state properties
  const setAiPersona = useCallback((value: React.SetStateAction<AIPersona>) => setAppData(prev => ({...prev, aiPersona: typeof value === 'function' ? value(prev.aiPersona) : value })), []);
  const setAiProtocols = useCallback((value: React.SetStateAction<AIProtocol[]>) => setAppData(prev => ({...prev, aiProtocols: typeof value === 'function' ? value(prev.aiProtocols) : value })), []);
  const setAiMemory = useCallback((value: React.SetStateAction<AIMemoryItem[]>) => setAppData(prev => ({...prev, aiMemory: typeof value === 'function' ? value(prev.aiMemory) : value })), []);
  const setChatHistory = useCallback((value: React.SetStateAction<ChatMessage[]>) => setAppData(prev => ({...prev, chatHistory: typeof value === 'function' ? value(prev.chatHistory) : value })), []);


  // Auto-save data
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

  // Save current page
  useEffect(() => {
    set('currentPage', page);
    setBackgroundIndex(prev => (prev + 1) % psychedelicBackgrounds.length);
  }, [page]);

  // FIX: The state updater function cannot be async.
  // To get the latest state for the async operation without adding extra dependencies,
  // we use the main `setAppData` functional update.
  useEffect(() => {
    const updatePrices = () => {
        setAppData(prevData => {
            const currentCurrencies = prevData.cryptoCurrencies;
            if (currentCurrencies.length === 0) {
                return prevData;
            }

            // fetchCryptoPrices returns a new array. By using a functional update
            // to get the latest state, we avoid stale closures in the interval.
            fetchCryptoPrices(currentCurrencies).then(updated => {
                // Use another functional update to prevent race conditions.
                setAppData(currentData => ({
                    ...currentData,
                    cryptoCurrencies: updated,
                }));
            });
            
            // Return the previous state immediately; the update will happen when the promise resolves.
            return prevData;
        });
    };
    
    updatePrices(); // Initial fetch
    const interval = setInterval(updatePrices, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []); // setAppData is stable and does not need to be in the dependency array.
  
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

  // Effect for handling wallet events
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has disconnected all accounts.
        console.log('Wallet disconnected.');
        setWeb3Wallet(null);
      } else if (appData.web3Wallet && accounts[0] !== appData.web3Wallet.address) {
        // A different account was selected. We'll disconnect and the user can reconnect.
        console.log('Account changed. Disconnecting for user to reconnect.');
        setWeb3Wallet(null);
      }
    };

    // As per EIP-1193, it's recommended to reload the page on chain change.
    // This is the simplest way to ensure state consistency.
    const handleChainChanged = () => {
      console.log('Network changed. Reloading page for consistency.');
      window.location.reload();
    };

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [appData.web3Wallet, setWeb3Wallet]);


  const renderPage = () => {
    switch (page) {
      case Page.Dashboard:
        return <Dashboard assets={appData.assets} cryptoCurrencies={appData.cryptoCurrencies} setCryptoCurrencies={setCryptoCurrencies} portfolioHistory={portfolioHistory} assetCategories={appData.assetCategories} />;
      case Page.Assets:
        return <AssetsPage assets={appData.assets} setAssets={setAssets} cryptoCurrencies={appData.cryptoCurrencies} assetCategories={appData.assetCategories} />;
      case Page.ProFolio:
        return <ProFolioPage mintedNfts={appData.mintedNfts} setMintedNfts={setMintedNfts} setPage={setPage} profile={appData.profile} socialAuth={appData.socialAuth}/>;
      case Page.WebDev:
        return <WebDev setPage={setPage}/>;
      case Page.Code:
        return <CodePage setPage={setPage} deploymentTransactions={appData.deploymentTransactions || []} setDeploymentTransactions={setDeploymentTransactions} />;
      case Page.Conceptualize:
        return <ConceptualizePage setPage={setPage} />;
      case Page.Create:
        return <CreatePage setPage={setPage} />;
      case Page.Design:
        return <DesignPage setPage={setPage} />;
      case Page.Web3Tools:
        return <Web3Tools setPage={setPage}/>;
      case Page.SmartContractBuilder:
        return <CodePage setPage={setPage} deploymentTransactions={appData.deploymentTransactions || []} setDeploymentTransactions={setDeploymentTransactions} />;
      case Page.PsychedelicNftWorkshop:
        return <PsychedelicNftWorkshop setPage={setPage} mintedNfts={appData.mintedNfts} setMintedNfts={setMintedNfts} />;
      case Page.PromptStudio:
        return <PromptStudio setPage={setPage} />;
      case Page.Persona:
        return <PersonaPage aiPersona={appData.aiPersona} setAiPersona={setAiPersona} aiMemory={appData.aiMemory} />;
      case Page.Learning:
        return <LearningPage aiMemory={appData.aiMemory} setAiMemory={setAiMemory} />;
      case Page.Protocols:
        return <ProtocolsPage aiProtocols={appData.aiProtocols} setAiProtocols={setAiProtocols} />;
      case Page.BusinessMeeting:
        return <BusinessMeetingPage allData={appData} />;
      case Page.AIStudio:
        return <AIStudio setPage={setPage} vaultItems={appData.vaultItems} />;
       case Page.Chat:
        return <ChatPage 
          chatHistory={appData.chatHistory}
          setChatHistory={setChatHistory}
          aiPersona={appData.aiPersona}
          aiProtocols={appData.aiProtocols}
          vaultItems={appData.vaultItems} 
        />;
      case Page.Business:
        return <Business positions={appData.positions} setPositions={setPositions} />;
      case Page.Social:
        return <Social socialAuth={appData.socialAuth} setSocialAuth={setSocialAuth} />;
      case Page.Wallet:
        return <WalletPage web3Wallet={appData.web3Wallet} setWeb3Wallet={setWeb3Wallet} vaultItems={appData.vaultItems} />;
      case Page.Vault:
        return <VaultPage vaultItems={appData.vaultItems} setVaultItems={setVaultItems} />;
      case Page.Profile:
        return <ProfilePage profile={appData.profile} setProfile={setProfile} allData={appData} loadAllData={loadAllData} alerts={appData.alerts} setAlerts={setAlerts} cryptoCurrencies={appData.cryptoCurrencies} setPage={setPage} />;
      case Page.Settings:
        return <SettingsPage settings={appData.settings} setSettings={setSettings} setPage={setPage} vaultItems={appData.vaultItems} setVaultItems={setVaultItems} />;
      case Page.ManageCategories:
        return <ManageCategories assetCategories={appData.assetCategories} setAssetCategories={setAssetCategories} setPage={setPage} />;
      default:
        return <Dashboard assets={appData.assets} cryptoCurrencies={appData.cryptoCurrencies} setCryptoCurrencies={setCryptoCurrencies} portfolioHistory={portfolioHistory} assetCategories={appData.assetCategories} />;
    }
  };

  return (
    <MasterPasswordProvider>
      <VaultProvider vaultItems={appData.vaultItems}>
        <div 
            className="min-h-screen w-full bg-cover bg-center bg-fixed transition-background duration-1000"
            style={{ backgroundImage: psychedelicBackgrounds[backgroundIndex] }}
        >
          <div className="min-h-screen w-full bg-black/80 backdrop-blur-md">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
              <Header currentPage={page} setPage={setPage} saveStatus={saveStatus} />
              <main>
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