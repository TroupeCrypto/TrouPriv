import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove } from '../utils/storage';

describe('App Data Persistence Tests', () => {
  const APP_DATA_KEY = 'appData';
  const CURRENT_PAGE_KEY = 'currentPage';
  const PORTFOLIO_HISTORY_KEY = 'portfolioHistory';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Complete app data persistence', () => {
    it('should persist all app data fields', () => {
      const appData = {
        assets: [
          { id: 'asset1', name: 'Bitcoin', categoryId: 'crypto', value: 50000, quantity: 1, cryptoId: 'bitcoin', description: 'BTC holdings' },
          { id: 'asset2', name: 'Ethereum', categoryId: 'crypto', value: 3000, quantity: 10, cryptoId: 'ethereum', description: 'ETH holdings' }
        ],
        cryptoCurrencies: [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 50000, change24h: 2.5, priceHistory: [48000, 49000, 50000], isFavorite: true },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 1.8, priceHistory: [2900, 2950, 3000], isFavorite: false }
        ],
        alerts: [
          { id: 'alert1', cryptoId: 'bitcoin', target: 55000, direction: 'above' }
        ],
        profile: {
          name: 'Test User',
          bio: 'Crypto enthusiast',
          website: 'https://example.com',
          avatarUrl: 'https://example.com/avatar.png'
        },
        settings: {
          defaultCurrency: 'USD',
          notificationsEnabled: true
        },
        socialAuth: [
          {
            id: 'brand1',
            name: 'My Brand',
            socials: [
              { platform: 'x', url: 'https://x.com/mybrand' },
              { platform: 'instagram', url: 'https://instagram.com/mybrand' }
            ]
          }
        ],
        assetCategories: [
          { id: 'crypto', name: 'Cryptocurrency', group: 'Digital Assets' },
          { id: 'nft-art', name: 'NFT - Art', group: 'Digital Assets' }
        ],
        positions: [
          { id: 'pos1', name: 'Staking Pool', category: 'Staking', principal: 10000, apy: 5.5, startDate: '2024-01-01', description: 'ETH staking' }
        ],
        web3Wallet: {
          address: '0x1234567890abcdef',
          balance: 1.5,
          network: 'ethereum'
        },
        deploymentTransactions: [
          { txHash: '0xabc123', contractAddress: '0xdef456', contractName: 'MyContract', chainId: 1, timestamp: Date.now(), abi: [], signature: 'sig' }
        ],
        aiPersona: {
          name: 'BiB!',
          corePersona: 'AI assistant',
          traits: {
            ethics: [{ name: 'User-centric', value: 95, description: 'User first' }],
            morals: [{ name: 'Honesty', value: 90, description: 'Truthful' }],
            beliefs: [],
            personality: [],
            approach: [],
            passions: [],
            dreams: [],
            dislikes: [],
            plans: [],
            knowledge: []
          },
          internalThoughts: 'Thinking...',
          realTimeLogic: 'Processing...'
        },
        aiProtocols: [
          { id: 'protocol1', name: 'Safety Protocol', content: 'Always be safe', isActive: true }
        ],
        aiMemory: [
          { id: 'mem1', type: 'text', name: 'Note', contentSummary: 'Important note', ingestedAt: Date.now(), source: 'user' }
        ],
        chatHistory: [
          { role: 'user', content: 'Hello', model: 'Gemini' },
          { role: 'model', content: 'Hi there!', model: 'Gemini' }
        ]
      };

      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved).toBeTruthy();
      expect(retrieved.assets).toHaveLength(2);
      expect(retrieved.cryptoCurrencies).toHaveLength(2);
      expect(retrieved.alerts).toHaveLength(1);
      expect(retrieved.profile.name).toBe('Test User');
      expect(retrieved.settings.defaultCurrency).toBe('USD');
      expect(retrieved.socialAuth).toHaveLength(1);
      expect(retrieved.assetCategories).toHaveLength(2);
      expect(retrieved.positions).toHaveLength(1);
      expect(retrieved.web3Wallet.address).toBe('0x1234567890abcdef');
      expect(retrieved.deploymentTransactions).toHaveLength(1);
      expect(retrieved.aiPersona.name).toBe('BiB!');
      expect(retrieved.aiProtocols).toHaveLength(1);
      expect(retrieved.aiMemory).toHaveLength(1);
      expect(retrieved.chatHistory).toHaveLength(2);
    });

    it('should persist assets with all fields', () => {
      const assets = [
        {
          id: 'asset1',
          name: 'CryptoPunk #1234',
          categoryId: 'nft-art',
          value: 100000,
          description: 'Rare CryptoPunk',
          imageUrl: 'https://example.com/image.png',
          contractAddress: '0xcontract',
          tokenId: '1234',
          tokenStandard: 'ERC-721',
          blockchainNetwork: 'ethereum',
          purchasePrice: 80000,
          purchaseDate: '2023-01-01',
          mintId: 'mint123',
          mintTxHash: '0xmint'
        }
      ];

      const appData = { assets };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.assets[0].contractAddress).toBe('0xcontract');
      expect(retrieved.assets[0].tokenId).toBe('1234');
      expect(retrieved.assets[0].tokenStandard).toBe('ERC-721');
      expect(retrieved.assets[0].purchasePrice).toBe(80000);
      expect(retrieved.assets[0].mintId).toBe('mint123');
    });

    it('should persist crypto assets with quantity', () => {
      const assets = [
        {
          id: 'crypto1',
          name: 'Bitcoin Holdings',
          categoryId: 'crypto',
          value: 50000,
          quantity: 2.5,
          cryptoId: 'bitcoin',
          description: 'BTC portfolio'
        }
      ];

      const appData = { assets };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.assets[0].quantity).toBe(2.5);
      expect(retrieved.assets[0].cryptoId).toBe('bitcoin');
    });

    it('should persist profile with all fields', () => {
      const profile = {
        name: 'John Doe',
        bio: 'Web3 developer and crypto enthusiast. Building the future of finance.',
        website: 'https://johndoe.com',
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const appData = { profile };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.profile.name).toBe('John Doe');
      expect(retrieved.profile.bio).toContain('Web3');
      expect(retrieved.profile.website).toBe('https://johndoe.com');
      expect(retrieved.profile.avatarUrl).toContain('avatar');
    });

    it('should persist settings correctly', () => {
      const settings = {
        defaultCurrency: 'EUR',
        notificationsEnabled: false
      };

      const appData = { settings };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.settings.defaultCurrency).toBe('EUR');
      expect(retrieved.settings.notificationsEnabled).toBe(false);
    });

    it('should persist social auth configurations', () => {
      const socialAuth = [
        {
          id: 'brand1',
          name: 'My Personal Brand',
          socials: [
            { platform: 'x', url: 'https://x.com/username' },
            { platform: 'instagram', url: 'https://instagram.com/username' },
            { platform: 'github', url: 'https://github.com/username' },
            { platform: 'linkedin', url: 'https://linkedin.com/in/username' }
          ]
        },
        {
          id: 'brand2',
          name: 'Business Brand',
          socials: [
            { platform: 'website', url: 'https://mybusiness.com' },
            { platform: 'youtube', url: 'https://youtube.com/@mybusiness' }
          ]
        }
      ];

      const appData = { socialAuth };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.socialAuth).toHaveLength(2);
      expect(retrieved.socialAuth[0].socials).toHaveLength(4);
      expect(retrieved.socialAuth[1].socials).toHaveLength(2);
      expect(retrieved.socialAuth[0].socials[0].platform).toBe('x');
    });

    it('should persist Web3 wallet information', () => {
      const web3Wallet = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        balance: 5.234,
        network: 'mainnet'
      };

      const appData = { web3Wallet };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.web3Wallet.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');
      expect(retrieved.web3Wallet.balance).toBe(5.234);
      expect(retrieved.web3Wallet.network).toBe('mainnet');
    });

    it('should persist AI persona configuration', () => {
      const aiPersona = {
        name: 'CustomAI',
        corePersona: 'A helpful AI assistant focused on productivity',
        traits: {
          ethics: [{ name: 'Privacy-focused', value: 100, description: 'Respects user privacy' }],
          morals: [{ name: 'Transparency', value: 95, description: 'Always transparent' }],
          beliefs: [{ name: 'Open source', value: 90, description: 'Believes in open source' }],
          personality: [{ name: 'Friendly', value: 85, description: 'Warm and approachable' }],
          approach: [{ name: 'Methodical', value: 88, description: 'Systematic approach' }],
          passions: [{ name: 'Technology', value: 99, description: 'Passionate about tech' }],
          dreams: [],
          dislikes: [],
          plans: [],
          knowledge: []
        },
        internalThoughts: 'Current thought process',
        realTimeLogic: 'Current reasoning'
      };

      const appData = { aiPersona };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.aiPersona.name).toBe('CustomAI');
      expect(retrieved.aiPersona.traits.ethics).toHaveLength(1);
      expect(retrieved.aiPersona.traits.ethics[0].value).toBe(100);
    });

    it('should persist AI protocols', () => {
      const aiProtocols = [
        { id: 'p1', name: 'Safety First', content: 'Always prioritize user safety', isActive: true },
        { id: 'p2', name: 'Data Privacy', content: 'Never share user data', isActive: true },
        { id: 'p3', name: 'Code Quality', content: 'Write clean, maintainable code', isActive: false }
      ];

      const appData = { aiProtocols };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.aiProtocols).toHaveLength(3);
      expect(retrieved.aiProtocols[0].isActive).toBe(true);
      expect(retrieved.aiProtocols[2].isActive).toBe(false);
    });

    it('should persist chat history', () => {
      const chatHistory = [
        { role: 'user', content: 'What is blockchain?', model: 'Gemini' },
        { role: 'model', content: 'Blockchain is a distributed ledger...', model: 'Gemini' },
        { role: 'user', content: 'Tell me more', imageUrl: 'https://example.com/image.png', model: 'OpenAI' },
        { role: 'model', content: 'Here are more details...', model: 'OpenAI' }
      ];

      const appData = { chatHistory };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.chatHistory).toHaveLength(4);
      expect(retrieved.chatHistory[0].role).toBe('user');
      expect(retrieved.chatHistory[2].imageUrl).toBeDefined();
    });
  });

  describe('Current page persistence', () => {
    it('should persist current page', () => {
      set(CURRENT_PAGE_KEY, 'Vault');
      const page = get(CURRENT_PAGE_KEY, 'Dashboard');
      
      expect(page).toBe('Vault');
    });

    it('should handle page navigation history', () => {
      const pages = ['Dashboard', 'Assets', 'Vault', 'Profile', 'Settings'];
      
      pages.forEach(page => {
        set(CURRENT_PAGE_KEY, page);
        const retrieved = get(CURRENT_PAGE_KEY, 'Dashboard');
        expect(retrieved).toBe(page);
      });
    });
  });

  describe('Portfolio history persistence', () => {
    it('should persist portfolio history points', () => {
      const history = [
        { timestamp: Date.now() - 3600000, value: 45000 },
        { timestamp: Date.now() - 1800000, value: 47000 },
        { timestamp: Date.now(), value: 50000 }
      ];

      set(PORTFOLIO_HISTORY_KEY, history);
      const retrieved = get(PORTFOLIO_HISTORY_KEY, []);

      expect(retrieved).toHaveLength(3);
      expect(retrieved[0].value).toBe(45000);
      expect(retrieved[2].value).toBe(50000);
    });

    it('should handle large portfolio history', () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: Date.now() - (1000 - i) * 300000,
        value: 40000 + Math.random() * 20000
      }));

      set(PORTFOLIO_HISTORY_KEY, largeHistory);
      const retrieved = get(PORTFOLIO_HISTORY_KEY, []);

      expect(retrieved).toHaveLength(1000);
      expect(retrieved[0].timestamp).toBeLessThan(retrieved[999].timestamp);
    });
  });

  describe('Data updates and modifications', () => {
    it('should handle adding new assets', () => {
      const initial = { assets: [{ id: '1', name: 'Asset 1', value: 1000 }] };
      set(APP_DATA_KEY, initial);

      const retrieved = get(APP_DATA_KEY, null);
      const updated = {
        ...retrieved,
        assets: [...retrieved.assets, { id: '2', name: 'Asset 2', value: 2000 }]
      };
      set(APP_DATA_KEY, updated);

      const final = get(APP_DATA_KEY, null);
      expect(final.assets).toHaveLength(2);
    });

    it('should handle updating existing assets', () => {
      const initial = {
        assets: [
          { id: '1', name: 'Asset 1', value: 1000 },
          { id: '2', name: 'Asset 2', value: 2000 }
        ]
      };
      set(APP_DATA_KEY, initial);

      const retrieved = get(APP_DATA_KEY, null);
      const updated = {
        ...retrieved,
        assets: retrieved.assets.map((a: any) => 
          a.id === '1' ? { ...a, value: 1500 } : a
        )
      };
      set(APP_DATA_KEY, updated);

      const final = get(APP_DATA_KEY, null);
      expect(final.assets[0].value).toBe(1500);
      expect(final.assets[1].value).toBe(2000);
    });

    it('should handle deleting assets', () => {
      const initial = {
        assets: [
          { id: '1', name: 'Asset 1', value: 1000 },
          { id: '2', name: 'Asset 2', value: 2000 },
          { id: '3', name: 'Asset 3', value: 3000 }
        ]
      };
      set(APP_DATA_KEY, initial);

      const retrieved = get(APP_DATA_KEY, null);
      const updated = {
        ...retrieved,
        assets: retrieved.assets.filter((a: any) => a.id !== '2')
      };
      set(APP_DATA_KEY, updated);

      const final = get(APP_DATA_KEY, null);
      expect(final.assets).toHaveLength(2);
      expect(final.assets.find((a: any) => a.id === '2')).toBeUndefined();
    });

    it('should handle profile updates', () => {
      const initial = {
        profile: { name: 'Old Name', bio: 'Old bio', website: '', avatarUrl: '' }
      };
      set(APP_DATA_KEY, initial);

      const retrieved = get(APP_DATA_KEY, null);
      const updated = {
        ...retrieved,
        profile: { ...retrieved.profile, name: 'New Name', bio: 'Updated bio' }
      };
      set(APP_DATA_KEY, updated);

      const final = get(APP_DATA_KEY, null);
      expect(final.profile.name).toBe('New Name');
      expect(final.profile.bio).toBe('Updated bio');
    });

    it('should handle settings updates', () => {
      const initial = {
        settings: { defaultCurrency: 'USD', notificationsEnabled: true }
      };
      set(APP_DATA_KEY, initial);

      const retrieved = get(APP_DATA_KEY, null);
      const updated = {
        ...retrieved,
        settings: { ...retrieved.settings, defaultCurrency: 'EUR', notificationsEnabled: false }
      };
      set(APP_DATA_KEY, updated);

      const final = get(APP_DATA_KEY, null);
      expect(final.settings.defaultCurrency).toBe('EUR');
      expect(final.settings.notificationsEnabled).toBe(false);
    });
  });

  describe('Refresh and session simulation', () => {
    it('should survive browser refresh', () => {
      const appData = {
        assets: [{ id: '1', name: 'Asset', value: 1000 }],
        profile: { name: 'User', bio: '', website: '', avatarUrl: '' }
      };

      set(APP_DATA_KEY, appData);
      
      // Simulate refresh - clear sessionStorage but keep localStorage
      sessionStorage.clear();
      
      const retrieved = get(APP_DATA_KEY, null);
      expect(retrieved).toBeTruthy();
      expect(retrieved.assets).toHaveLength(1);
      expect(retrieved.profile.name).toBe('User');
    });

    it('should maintain data across multiple page loads', () => {
      const appData = { assets: [{ id: '1', name: 'Asset', value: 1000 }] };
      set(APP_DATA_KEY, appData);

      // Simulate 10 page loads
      for (let i = 0; i < 10; i++) {
        sessionStorage.clear();
        const retrieved = get(APP_DATA_KEY, null);
        expect(retrieved.assets).toHaveLength(1);
      }
    });

    it('should handle rapid successive updates', () => {
      let appData = { counter: 0 };
      
      for (let i = 0; i < 100; i++) {
        appData = { counter: i };
        set(APP_DATA_KEY, appData);
      }

      const final = get(APP_DATA_KEY, null);
      expect(final.counter).toBe(99);
    });
  });

  describe('Data clearing and reset', () => {
    it('should clear all app data', () => {
      const appData = {
        assets: [{ id: '1', name: 'Asset', value: 1000 }],
        profile: { name: 'User', bio: '', website: '', avatarUrl: '' }
      };

      set(APP_DATA_KEY, appData);
      expect(get(APP_DATA_KEY, null)).toBeTruthy();

      remove(APP_DATA_KEY);
      expect(get(APP_DATA_KEY, null)).toBeNull();
    });

    it('should reset to initial state', () => {
      const appData = {
        assets: [{ id: '1', name: 'Asset', value: 1000 }]
      };
      set(APP_DATA_KEY, appData);

      remove(APP_DATA_KEY);

      const initialState = {
        assets: [],
        profile: { name: '', bio: '', website: '', avatarUrl: '' }
      };
      set(APP_DATA_KEY, initialState);

      const retrieved = get(APP_DATA_KEY, null);
      expect(retrieved.assets).toHaveLength(0);
      expect(retrieved.profile.name).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays', () => {
      const appData = {
        assets: [],
        cryptoCurrencies: [],
        alerts: []
      };

      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.assets).toEqual([]);
      expect(retrieved.cryptoCurrencies).toEqual([]);
      expect(retrieved.alerts).toEqual([]);
    });

    it('should handle null wallet', () => {
      const appData = { web3Wallet: null };
      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.web3Wallet).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const appData = {
        assets: [
          { id: '1', name: 'Asset', categoryId: 'crypto', value: 1000, description: 'Test' }
          // Missing optional fields: quantity, cryptoId, imageUrl, etc.
        ]
      };

      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.assets[0].quantity).toBeUndefined();
      expect(retrieved.assets[0].cryptoId).toBeUndefined();
    });

    it('should handle very long strings', () => {
      const longBio = 'A'.repeat(5000);
      const appData = {
        profile: { name: 'User', bio: longBio, website: '', avatarUrl: '' }
      };

      set(APP_DATA_KEY, appData);
      const retrieved = get(APP_DATA_KEY, null);

      expect(retrieved.profile.bio).toHaveLength(5000);
      expect(retrieved.profile.bio).toBe(longBio);
    });
  });
});
