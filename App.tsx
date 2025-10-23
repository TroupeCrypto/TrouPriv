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
import FestivalStageHeader from './components/FestivalStageHeader';
import { getFestivalTheme, psychedelicBackgrounds } from './data/backgrounds';
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
import GrokMiniChat from './components/GrokMiniChat';
import { logEnvStatus, initializeEnvValidation } from './utils/env';

// Initialize and validate environment variables on app load
initializeEnvValidation();

// Defines a clean, empty initial state for the application.
const initialState: Omit<AppData, 'schemaVersion'> = {
  assets: [],
  cryptoCurrencies: [],
  alerts: [],
  profile: { name: '', bio: '', website: '', avatarUrl: '' },
  settings: { defaultCurrency: 'USD', notificationsEnabled: false },
  socialAuth: [],
  assetCategories: [],
  positions: [],
  web3Wallet: null,
  deploymentTransactions: [],
  aiPersona: {
    name: 'BiB',
    corePersona: '',
    traits: {
      ethics: [],
      morals: [],
      beliefs: [],
      personality: [],
      approach: [],
      passions: [],
      dreams: [],
      dislikes: [],
      plans: [],
      knowledge: [],
    },
    internalThoughts: '',
    realTimeLogic: '',
  },
  aiProtocols: [],
  aiMemory: [],
  chatHistory: [],
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.Dashboard);
  const [appData, setAppData] = useState<Omit<AppData, 'schemaVersion'>>(initialState);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);

  // Load all data from localStorage
  const loadAllData = useCallback(() => {
    const loaded = get<Omit<AppData, 'schemaVersion'>>('appData', initialState);
    setAppData(loaded);
    const loadedVault = get<VaultItem[]>('vaultItems', []);
    setVaultItems(loadedVault);
  }, []);

  // Save app data
  useEffect(() => {
    if (saveStatus === 'saving') {
      const success = set('appData', appData);
      setSaveStatus(success ? 'saved' : 'error');
    }
  }, [saveStatus, appData]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Trigger save when app data changes
  useEffect(() => {
    setSaveStatus('saving');
  }, [appData]);

  // Save vault items separately
  useEffect(() => {
    set('vaultItems', vaultItems);
  }, [vaultItems]);

  // Setter functions
  const setAssets = useCallback((assets: Asset[] | ((prev: Asset[]) => Asset[])) => {
    setAppData(prev => ({ ...prev, assets: typeof assets === 'function' ? assets(prev.assets) : assets }));
  }, []);

  const setCryptoCurrencies = useCallback((cryptos: CryptoCurrency[] | ((prev: CryptoCurrency[]) => CryptoCurrency[])) => {
    setAppData(prev => ({ ...prev, cryptoCurrencies: typeof cryptos === 'function' ? cryptos(prev.cryptoCurrencies) : cryptos }));
  }, []);

  const setAlerts = useCallback((alerts: Alert[] | ((prev: Alert[]) => Alert[])) => {
    setAppData(prev => ({ ...prev, alerts: typeof alerts === 'function' ? alerts(prev.alerts) : alerts }));
  }, []);

  const setProfile = useCallback((profile: Profile | ((prev: Profile) => Profile)) => {
    setAppData(prev => ({ ...prev, profile: typeof profile === 'function' ? profile(prev.profile) : profile }));
  }, []);

  const setSettings = useCallback((settings: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    setAppData(prev => ({ ...prev, settings: typeof settings === 'function' ? settings(prev.settings) : settings }));
  }, []);

  const setSocialAuth = useCallback((auth: BrandAuthConfig[] | ((prev: BrandAuthConfig[]) => BrandAuthConfig[])) => {
    setAppData(prev => ({ ...prev, socialAuth: typeof auth === 'function' ? auth(prev.socialAuth) : auth }));
  }, []);

  const setAssetCategories = useCallback((categories: AssetCategory[] | ((prev: AssetCategory[]) => AssetCategory[])) => {
    setAppData(prev => ({ ...prev, assetCategories: typeof categories === 'function' ? categories(prev.assetCategories) : categories }));
  }, []);

  const setPositions = useCallback((positions: Position[] | ((prev: Position[]) => Position[])) => {
    setAppData(prev => ({ ...prev, positions: typeof positions === 'function' ? positions(prev.positions) : positions }));
  }, []);

  const setWeb3Wallet = useCallback((wallet: Web3Wallet | null | ((prev: Web3Wallet | null) => Web3Wallet | null)) => {
    setAppData(prev => ({ ...prev, web3Wallet: typeof wallet === 'function' ? wallet(prev.web3Wallet) : wallet }));
  }, []);

  const setDeploymentTransactions = useCallback((txs: DeploymentTransaction[] | ((prev: DeploymentTransaction[]) => DeploymentTransaction[])) => {
    setAppData(prev => ({ ...prev, deploymentTransactions: typeof txs === 'function' ? txs(prev.deploymentTransactions) : txs }));
  }, []);

  const setAiPersona = useCallback((persona: AIPersona | ((prev: AIPersona) => AIPersona)) => {
    setAppData(prev => ({ ...prev, aiPersona: typeof persona === 'function' ? persona(prev.aiPersona) : persona }));
  }, []);

  const setAiProtocols = useCallback((protocols: AIProtocol[] | ((prev: AIProtocol[]) => AIProtocol[])) => {
    setAppData(prev => ({ ...prev, aiProtocols: typeof protocols === 'function' ? protocols(prev.aiProtocols) : protocols }));
  }, []);

  const setAiMemory = useCallback((memory: AIMemoryItem[] | ((prev: AIMemoryItem[]) => AIMemoryItem[])) => {
    setAppData(prev => ({ ...prev, aiMemory: typeof memory === 'function' ? memory(prev.aiMemory) : memory }));
  }, []);

  const setChatHistory = useCallback((history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setAppData(prev => ({ ...prev, chatHistory: typeof history === 'function' ? history(prev.chatHistory) : history }));
  }, []);

  // Update wallet state
  const updateWalletState = useCallback(async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(accounts[0]);
          const network = await provider.getNetwork();
          setWeb3Wallet({
            address: accounts[0],
            balance: parseFloat(ethers.formatEther(balance)),
            network: network.name,
          });
        } else {
          setWeb3Wallet(null);
        }
      } catch (error) {
        console.error('Error updating wallet state:', error);
      }
    }
  }, [setWeb3Wallet]);

  // Listen for wallet changes
  useEffect(() => {
    const handleAccountsChanged = () => {
      console.log('Wallet accounts changed.');
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
        return <Dashboard assets={appData.assets} cryptoCurrencies={appData.cryptoCurrencies} setCryptoCurrencies={setCryptoCurrencies} portfolioHistory={portfolioHistory} assetCategories={appData.assetCategories} onNavigate={setPage} />;
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

  const stageTheme = getFestivalTheme(page);
  const currentBackground = stageTheme.background || psychedelicBackgrounds[backgroundIndex];

  return (
    <MasterPasswordProvider>
        <VaultProvider vaultItems={vaultItems}>
            <div
                className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-1000"
                style={{ backgroundImage: currentBackground }}
            >
                <div className="min-h-screen bg-black/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <Header currentPage={page} setPage={setPage} saveStatus={saveStatus} accentColor={stageTheme.accent} />
                        <div className="mt-6">
                            <FestivalStageHeader page={page} theme={stageTheme} onNavigate={setPage} />
                        </div>
                        <main className="mt-10">
                            {renderPage()}
                        </main>
                    </div>
                </div>
                {/* Persistent Grok AI Designer Chat - Available on all pages */}
                <GrokMiniChat />
            </div>
        </VaultProvider>
    </MasterPasswordProvider>
  );
};

export default App;
