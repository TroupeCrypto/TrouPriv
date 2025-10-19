import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Asset, CryptoCurrency, PortfolioHistoryPoint, cryptoAssetTypes, AssetCategory } from '../types';
import { ArrowUpIcon, ArrowDownIcon, CryptoIcon, SparklesIcon, SpinnerIcon, StarIcon } from '../components/icons/Icons';
import { get, set } from '../utils/storage';

type TimeRange = '24h' | '7d' | '1m' | 'all';

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-gray-900/50 p-6 rounded-lg border border-white/10 relative overflow-hidden ${className}`}>
        {children}
    </div>
);

const SparklineChart: React.FC<{ data: number[]; color: string; }> = ({ data, color }) => {
    if (!data || data.length < 2) return null;

    const width = 60;
    const height = 20;
    const padding = 2;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - padding - ((d - min) / range) * (height - padding * 2);
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="ml-4">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                points={points}
            />
        </svg>
    );
};

const CryptoTicker: React.FC<{ cryptoCurrencies: CryptoCurrency[] }> = ({ cryptoCurrencies }) => (
    <div className="relative w-full overflow-hidden bg-gray-900/50 py-4 border-y border-white/10">
        <div className="flex animate-marquee-infinite whitespace-nowrap">
            {cryptoCurrencies.concat(cryptoCurrencies).map((crypto, index) => {
                 const isPositive = crypto.change24h >= 0;
                 return (
                    <div key={`${crypto.id}-${index}`} className="flex items-center mx-6">
                        <CryptoIcon symbol={crypto.symbol} className="mr-2" />
                        <span className="text-gray-400">{crypto.symbol}</span>
                        <span className="ml-2 text-white font-mono">${crypto.price.toFixed(2)}</span>
                        <span className={`ml-2 text-xs font-semibold flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>}
                            {Math.abs(crypto.change24h).toFixed(2)}%
                        </span>
                        <SparklineChart data={crypto.priceHistory} color={isPositive ? '#4ade80' : '#f87171'} />
                    </div>
                );
            })}
        </div>
        <style>{`
            @keyframes marquee-infinite {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee-infinite {
                animation: marquee-infinite 20s linear infinite;
            }
        `}</style>
    </div>
);

const TimeRangeSelector: React.FC<{
    selectedRange: TimeRange;
    onSelect: (range: TimeRange) => void;
}> = ({ selectedRange, onSelect }) => {
    const ranges: { label: string; value: TimeRange }[] = [
        { label: '24H', value: '24h' },
        { label: '7D', value: '7d' },
        { label: '1M', value: '1m' },
        { label: 'All', value: 'all' },
    ];

    return (
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-md">
            {ranges.map(range => (
                <button
                    key={range.value}
                    onClick={() => onSelect(range.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        selectedRange === range.value
                            ? 'bg-cyan-500 text-white'
                            : 'text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
};

const PortfolioChart: React.FC<{ history: PortfolioHistoryPoint[], timeRange: TimeRange }> = ({ history, timeRange }) => {
    // Filter history based on timeRange
    const filteredHistory = useMemo(() => {
        if (!history || history.length === 0) return [];
        const now = Date.now();
        const timeLimit = {
            '24h': now - 24 * 60 * 60 * 1000,
            '7d': now - 7 * 24 * 60 * 60 * 1000,
            '1m': now - 30 * 24 * 60 * 60 * 1000,
            'all': 0
        }[timeRange];
        return history.filter(p => p.timestamp >= timeLimit);
    }, [history, timeRange]);

    if (filteredHistory.length < 2) {
        return <div className="h-full flex items-center justify-center text-gray-500">Not enough data to display chart.</div>;
    }
    
    const lastValue = filteredHistory[filteredHistory.length - 1]?.value || 0;
    const firstValue = filteredHistory[0]?.value || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue === 0 ? 0 : (change / firstValue) * 100;
    const isPositive = change >= 0;

    return (
        <div className="h-full">
            <div className="flex items-baseline gap-4 mb-2">
                <p className="text-3xl font-bold text-white font-mono">${lastValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <div className={`flex items-center text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                    <span>{isPositive ? '+' : ''}{change.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({changePercent.toFixed(2)}%)</span>
                </div>
            </div>
            {/* Chart visualization would go here */}
            <div className="h-48 bg-gray-800/50 rounded-md flex items-center justify-center">
                <p className="text-gray-600 text-sm">[Chart Placeholder]</p>
            </div>
        </div>
    );
};

interface DashboardProps {
    assets: Asset[];
    cryptoCurrencies: CryptoCurrency[];
    setCryptoCurrencies: React.Dispatch<React.SetStateAction<CryptoCurrency[]>>;
    portfolioHistory: PortfolioHistoryPoint[];
    assetCategories: AssetCategory[];
}

const Dashboard: React.FC<DashboardProps> = ({ assets, cryptoCurrencies, setCryptoCurrencies, portfolioHistory, assetCategories }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [aiInsight, setAiInsight] = useState<string>(() => get('dashboard_ai_insight', ''));
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

    const totalPortfolioValue = useMemo(() => {
        return assets.reduce((acc, asset) => {
            if (cryptoAssetTypes.includes(asset.categoryId) && asset.cryptoId && asset.quantity) {
                const crypto = cryptoCurrencies.find(c => c.id === asset.cryptoId);
                return acc + (crypto ? crypto.price * asset.quantity : 0);
            }
            return acc + asset.value;
        }, 0);
    }, [assets, cryptoCurrencies]);

    const favoriteCryptos = useMemo(() => cryptoCurrencies.filter(c => c.isFavorite), [cryptoCurrencies]);
    const topMovers = useMemo(() => [...cryptoCurrencies].sort((a,b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5), [cryptoCurrencies]);
    
    const handleToggleFavorite = (id: string) => {
        setCryptoCurrencies(prev => 
            prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
        );
    };

    const generateAiInsight = useCallback(async () => {
        setIsGeneratingInsight(true);
        setAiInsight('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const allocation: Record<string, number> = {};
            const categoryMap = new Map(assetCategories.map(c => [c.id, c.group]));

            assets.forEach(asset => {
                // FIX: Explicitly cast the result of categoryMap.get() to fix type inference issue.
                const group = (categoryMap.get(asset.categoryId) as string | undefined) || 'Other';
                const assetValue = cryptoAssetTypes.includes(asset.categoryId) && asset.cryptoId && asset.quantity
                    ? (cryptoCurrencies.find(c => c.id === asset.cryptoId)?.price || 0) * asset.quantity
                    : asset.value;

                if (!allocation[group]) {
                    allocation[group] = 0;
                }
                allocation[group] += assetValue;
            });

            const allocationString = totalPortfolioValue > 0 
                ? Object.entries(allocation)
                    .map(([group, value]) => `${group} (${((value / totalPortfolioValue) * 100).toFixed(1)}%)`)
                    .join(', ')
                : 'No assets to analyze.';

            const volatileAssetsString = topMovers.map(c => `${c.name} (${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%)`).join(', ');

            const prompt = `
                Analyze the following portfolio snapshot. Provide a brief, insightful summary (3-4 sentences).
                - Total Portfolio Value: $${totalPortfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                - Asset Allocation: ${allocationString}
                - Top Crypto Movers (24h): ${volatileAssetsString}
                
                Your analysis should:
                1. Comment on the user's asset allocation mix (e.g., is it diversified or concentrated?).
                2. Highlight the most volatile or impactful crypto asset today.
                3. Provide a concise, forward-looking statement.
                
                Adopt a professional yet encouraging tone.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const insight = response.text.trim();
            setAiInsight(insight);
            set('dashboard_ai_insight', insight);
        } catch (error) {
            console.error("AI Insight generation failed:", error);
            setAiInsight("Could not generate an insight at this time. Please check your API key and network connection.");
        } finally {
            setIsGeneratingInsight(false);
        }
    }, [totalPortfolioValue, topMovers, assets, assetCategories, cryptoCurrencies]);
    
    // Auto-generate insight if it's empty
    useEffect(() => {
        if (!aiInsight && !isGeneratingInsight) {
            generateAiInsight();
        }
    }, [aiInsight, generateAiInsight, isGeneratingInsight]);

    return (
        <div className="space-y-8">
            <CryptoTicker cryptoCurrencies={cryptoCurrencies} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-sm text-gray-400">Portfolio Value</h2>
                            </div>
                            <TimeRangeSelector selectedRange={timeRange} onSelect={setTimeRange} />
                        </div>
                        <PortfolioChart history={portfolioHistory} timeRange={timeRange} />
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">AI Insight</h2>
                            <button onClick={generateAiInsight} disabled={isGeneratingInsight} className="text-cyan-400 p-1 rounded-full hover:bg-cyan-400/10 disabled:text-gray-500">
                                {isGeneratingInsight ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-sm text-gray-300 mt-2 min-h-[6em]">
                            {isGeneratingInsight ? 'Analyzing your portfolio...' : aiInsight}
                        </p>
                    </Card>
                     <Card>
                        <h2 className="text-lg font-semibold text-white">Watchlist</h2>
                        <div className="mt-2 space-y-2">
                            {favoriteCryptos.length > 0 ? favoriteCryptos.map(crypto => (
                                <div key={crypto.id} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-gray-300">{crypto.name}</span>
                                    <span className="font-mono text-white">${crypto.price.toFixed(2)}</span>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center py-4">No favorites added yet.</p>}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <h2 className="text-lg font-semibold text-white mb-4">Market Movers (24h)</h2>
                    <div className="space-y-2">
                        {topMovers.map(crypto => {
                            const isPositive = crypto.change24h >= 0;
                            return (
                                <div key={crypto.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                         <button onClick={() => handleToggleFavorite(crypto.id)} className="text-gray-600 hover:text-yellow-400">
                                            <StarIcon className="w-4 h-4" filled={!!crypto.isFavorite}/>
                                        </button>
                                        <span className="font-semibold text-gray-300">{crypto.name}</span>
                                    </div>
                                    <div className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// FIX: Add default export to resolve module import error in App.tsx.
export default Dashboard;