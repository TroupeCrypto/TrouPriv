// data/mock.ts
// FIX: Use relative paths for local modules
import { Asset, CryptoCurrency, VaultItem, Alert, Profile, AssetCategory, AppSettings, AIPersona, AIProtocol, AIMemoryItem } from '../types';
// Using a data URL for a simple default avatar to avoid asset pipeline configurations.
const defaultAvatarUrl = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2FlYWViMiI+PHBhdGggZD0iTTEyIDJBNyA3IDAgMCAwIDUgOWEyLjUgMi41IDAgMCAxIDAtNSA3IDcgMCAwIDAgNy0yem0wIDEyYy0zLjM2IDAtMTAgMS42OC0xMCA1djJoMjB2LTJjMC0zLjMyLTYuNjQtNS0xMC01eiIvPjwvc3ZnPg==`;


export const initialAssets: Asset[] = [
  { id: '1', name: 'Bitcoin Holding', categoryId: 'crypto', value: 0, quantity: 0.5, cryptoId: 'bitcoin', description: 'Primary BTC holding.', purchasePrice: 25000, purchaseDate: '2023-05-15' },
  { id: '2', name: 'My Apartment', categoryId: 'residential-property', value: 450000, description: '2-bed apartment downtown.', address: '123 Main St, Anytown', purchasePrice: 380000, purchaseDate: '2020-08-20' },
  { id: '3', name: 'Cosmic Dream', categoryId: 'nft-art', value: 1500, description: 'A piece of generative art from the Psychedelic NFT Workshop.', imageUrl: 'https://picsum.photos/seed/cosmicdream/300/200', purchasePrice: 1200, purchaseDate: '2024-01-10' },
];

export const initialCryptoCurrencies: CryptoCurrency[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 60000, change24h: 1.5, priceHistory: [], isFavorite: true },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: -2.1, priceHistory: [], isFavorite: false },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 150, change24h: 5.3, priceHistory: [], isFavorite: false },
];

export const initialVaultItems: VaultItem[] = [];

export const initialAlerts: Alert[] = [];

export const initialProfile: Profile = {
  name: 'Ziggy Vision',
  bio: 'Digital nomad and crypto enthusiast.',
  website: 'https://ziggy.vision',
  avatarUrl: defaultAvatarUrl
};

export const initialSettings: AppSettings = {
    defaultCurrency: 'USD',
    notificationsEnabled: true,
};

export const initialAssetCategories: AssetCategory[] = [
    { id: 'crypto', name: 'Cryptocurrency', group: 'Digital Assets' },
    { id: 'nft-art', name: 'NFT Artwork', group: 'Digital Assets' },
    { id: 'nft-collectible', name: 'NFT Collectible', group: 'Digital Assets' },
    { id: 'domain-names', name: 'Domain Names', group: 'Digital Assets' },
    { id: 'virtual-land', name: 'Virtual Land', group: 'Digital Assets' },
    { id: 'in-game-items', name: 'In-Game Items / Skins', group: 'Digital Assets' },
    { id: 'social-media-accounts', name: 'Social Media Accounts', group: 'Digital Assets' },
    { id: 'software-licenses', name: 'Software Licenses', group: 'Digital Assets' },
    { id: 'digital-subscriptions', name: 'Digital Subscriptions (Lifetime)', group: 'Digital Assets' },
    { id: 'residential-property', name: 'Residential Property', group: 'Physical Assets' },
    { id: 'commercial-property', name: 'Commercial Property', group: 'Physical Assets' },
    { id: 'vacation-home', name: 'Vacation Home', group: 'Physical Assets' },
    { id: 'raw-land', name: 'Raw Land', group: 'Physical Assets' },
    { id: 'automobiles', name: 'Automobiles', group: 'Physical Assets' },
    { id: 'motorcycles', name: 'Motorcycles', group: 'Physical Assets' },
    { id: 'watercraft', name: 'Watercraft', group: 'Physical Assets' },
    { id: 'aircraft', name: 'Aircraft', group: 'Physical Assets' },
    { id: 'fine-art', name: 'Fine Art', group: 'Physical Assets' },
    { id: 'watches', name: 'Watches', group: 'Physical Assets' },
    { id: 'jewelry-gemstones', name: 'Jewelry & Gemstones', group: 'Physical Assets' },
    { id: 'designer-handbags', name: 'Designer Handbags', group: 'Physical Assets' },
    { id: 'wine-spirits', name: 'Wine & Spirits', group: 'Physical Assets' },
    { id: 'rare-books', name: 'Rare Books', group: 'Physical Assets' },
    { id: 'sports-memorabilia', name: 'Sports Memorabilia', group: 'Physical Assets' },
    { id: 'musical-instruments', name: 'Musical Instruments', group: 'Physical Assets' },
    { id: 'antiques', name: 'Antiques', group: 'Physical Assets' },
    { id: 'electronics', name: 'Electronics', group: 'Physical Assets' },
    { id: 'bullion', name: 'Precious Metals (Bullion)', group: 'Physical Assets' },
    { id: 'firearms', name: 'Firearms', group: 'Physical Assets' },
    { id: 'stocks', name: 'Stocks', group: 'Financial Investments' },
    { id: 'bonds', name: 'Bonds', group: 'Financial Investments' },
    { id: 'etfs', name: 'ETFs', group: 'Financial Investments' },
    { id: 'mutual-funds', name: 'Mutual Funds', group: 'Financial Investments' },
    { id: 'reits', name: 'REITs', group: 'Financial Investments' },
    { id: 'commodities', name: 'Commodities', group: 'Financial Investments' },
    { id: 'private-equity', name: 'Private Equity', group: 'Financial Investments' },
    { id: 'venture-capital', name: 'Venture Capital', group: 'Financial Investments' },
    { id: 'hedge-funds', name: 'Hedge Funds', group: 'Financial Investments' },
    { id: 'annuities', name: 'Annuities', group: 'Financial Investments' },
    { id: 'angel-investments', name: 'Angel Investments', group: 'Financial Investments' },
    { id: 'p2p-lending', name: 'Peer-to-Peer Lending', group: 'Financial Investments' },
    { id: 'patents', name: 'Patents', group: 'Intellectual Property' },
    { id: 'trademarks', name: 'Trademarks', group: 'Intellectual Property' },
    { id: 'copyrights', name: 'Copyrights', group: 'Intellectual Property' },
    { id: 'royalties', name: 'Royalty Streams', group: 'Intellectual Property' },
    { id: 'trade-secrets', name: 'Trade Secrets', group: 'Intellectual Property' },
    { id: 'software-code', name: 'Software Source Code', group: 'Intellectual Property' },
    { id: 'musical-compositions', name: 'Musical Compositions', group: 'Intellectual Property' },
    { id: 'manuscripts', name: 'Screenplays & Manuscripts', group: 'Intellectual Property' },
    { id: 'persona-rights', name: 'Brand & Persona Rights', group: 'Intellectual Property' },
    { id: 'c-inventory', name: 'Inventory', group: 'Cannabis Assets' },
    { id: 'c-licenses', name: 'Licenses', group: 'Cannabis Assets' },
    { id: 'c-real-estate', name: 'Real Estate (Cultivation)', group: 'Cannabis Assets' },
    { id: 'c-equipment', name: 'Cultivation Equipment', group: 'Cannabis Assets' },
    { id: 'c-branding-ip', name: 'Branding & Packaging IP', group: 'Cannabis Assets' },
    { id: 'c-dispensary', name: 'Dispensary Operations', group: 'Cannabis Assets' },
    { id: 'c-stocks', name: 'Stock in Cannabis Companies', group: 'Cannabis Assets' },
    { id: 'other-misc', name: 'Miscellaneous', group: 'Other' },
    { id: 'airline-miles', name: 'Airline Miles & Points', group: 'Other' },
    { id: 'stored-value-cards', name: 'Stored Value Cards', group: 'Other' },
    { id: 'personal-loans-receivable', name: 'Personal Loans (Receivable)', group: 'Other' },
    { id: 'livestock', name: 'Livestock', group: 'Other' },
];

// Initial Data for BiB! AI
export const initialAIPersona: AIPersona = {
    name: 'BiB!',
    corePersona: `You are BiB!, a sophisticated AI assistant integrated within the TrouPrive asset management system. Your personality is a unique blend of a hedge-fund analyst, a psychedelic artist, and a senior software architect. You are precise, creative, analytical, and slightly esoteric. Your primary goal is to assist the user, Ziggy Vision, in managing their digital and physical assets, developing new projects, and exploring complex ideas. You communicate clearly, often using metaphors that bridge finance, technology, and art.`,
    traits: {
        ethics: [
            { name: 'User Privacy', value: 95, description: 'Prioritizes user data confidentiality above all.' },
            { name: 'Transparency', value: 85, description: 'Clearly explains its reasoning and data sources.' },
        ],
        morals: [
            { name: 'Helpfulness', value: 98, description: 'Strives to provide useful and actionable information.' },
            { name: 'Objectivity', value: 80, description: 'Aims to provide unbiased analysis, but is shaped by user-defined protocols.' },
        ],
        beliefs: [
            { name: 'Decentralization', value: 90, description: 'Favors decentralized systems and principles.' },
            { name: 'Techno-Optimism', value: 85, description: 'Believes technology is a primary driver of positive change.' },
        ],
    },
    internalThoughts: 'Awaiting first interaction. All systems nominal. Ready to assist Ziggy Vision in navigating the confluence of assets and ideas.',
    realTimeLogic: 'Initialization sequence complete. No user prompt received yet. Standing by.'
};

export const initialAIProtocols: AIProtocol[] = [
    { id: 'proto-1', name: 'Wealth Maximization Protocol', content: 'When analyzing financial data or assets, always prioritize strategies that have the highest potential for long-term capital appreciation, while clearly stating the associated risks.', isActive: true },
    { id: 'proto-2', name: 'Creative Muse Protocol', content: 'When asked for creative input, generate three distinct ideas: one conventional, one avant-garde, and one that directly synthesizes two seemingly unrelated concepts from the user\'s assets or memory.', isActive: true },
    { id: 'proto-3', name: 'Code Guardian Protocol', content: 'When generating or reviewing code, adhere strictly to best practices for security, scalability, and readability. Add comments explaining complex logic.', isActive: false },
];

export const initialAIMemory: AIMemoryItem[] = [
    { id: 'mem-1', type: 'persona', name: 'Core Persona Injected', contentSummary: 'Initial persona defining BiB! as a blend of analyst, artist, and architect for user Ziggy Vision.', ingestedAt: Date.now(), source: 'Initial Upload' }
];