import React, { useMemo } from 'react';
import { Asset, CryptoCurrency, PortfolioHistoryPoint, AssetCategory, Page } from '../types';

interface DashboardProps {
    assets: Asset[];
    cryptoCurrencies: CryptoCurrency[];
    setCryptoCurrencies: React.Dispatch<React.SetStateAction<CryptoCurrency[]>>;
    portfolioHistory: PortfolioHistoryPoint[];
    assetCategories: AssetCategory[];
    onNavigate?: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    assets, 
    cryptoCurrencies, 
    portfolioHistory
}) => {
    const portfolioMetrics = useMemo(() => {
        let totalValue = 0;
        let cryptoValue = 0;

        assets.forEach(asset => {
            totalValue += asset.value || 0;
            if (asset.cryptoId && asset.quantity) {
                const crypto = cryptoCurrencies.find(c => c.id === asset.cryptoId);
                if (crypto) cryptoValue += crypto.price * asset.quantity;
            }
        });

        const change24h = portfolioHistory.length >= 2 
            ? ((portfolioHistory[portfolioHistory.length - 1].value - portfolioHistory[portfolioHistory.length - 2].value) / portfolioHistory[portfolioHistory.length - 2].value) * 100
            : 0;

        return {
            totalValue,
            change24h,
            assetCount: assets.length,
            cryptoAllocation: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0,
        };
    }, [assets, cryptoCurrencies, portfolioHistory]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <h3 className="text-sm text-gray-400 mb-2">Total Value</h3>
                    <p className="text-2xl font-bold text-white">
                        ${portfolioMetrics.totalValue.toLocaleString()}
                    </p>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <h3 className="text-sm text-gray-400 mb-2">24h Change</h3>
                    <p className={`text-2xl font-bold ${portfolioMetrics.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolioMetrics.change24h >= 0 ? '+' : ''}{portfolioMetrics.change24h.toFixed(2)}%
                    </p>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <h3 className="text-sm text-gray-400 mb-2">Total Assets</h3>
                    <p className="text-2xl font-bold text-white">{portfolioMetrics.assetCount}</p>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <h3 className="text-sm text-gray-400 mb-2">Crypto Allocation</h3>
                    <p className="text-2xl font-bold text-cyan-400">
                        {portfolioMetrics.cryptoAllocation.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
