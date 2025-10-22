import React from 'react';
import { CryptoCurrency } from '../../types';
import { CryptoIcon, StarIcon } from '../icons/Icons';

interface CryptoMarketHeatmapProps {
    cryptoCurrencies: CryptoCurrency[];
    onToggleFavorite: (id: string) => void;
}

export const CryptoMarketHeatmap: React.FC<CryptoMarketHeatmapProps> = ({ 
    cryptoCurrencies, 
    onToggleFavorite 
}) => {
    const getHeatmapColor = (change: number): string => {
        if (change >= 10) return 'bg-green-500/30 border-green-500/50';
        if (change >= 5) return 'bg-green-500/20 border-green-500/40';
        if (change >= 0) return 'bg-green-500/10 border-green-500/30';
        if (change >= -5) return 'bg-red-500/10 border-red-500/30';
        if (change >= -10) return 'bg-red-500/20 border-red-500/40';
        return 'bg-red-500/30 border-red-500/50';
    };

    const getTextColor = (change: number): string => {
        if (change >= 0) return 'text-green-400';
        return 'text-red-400';
    };

    if (!cryptoCurrencies || cryptoCurrencies.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 h-full">
                <h2 className="text-xl font-bold text-white mb-4">Crypto Market Heatmap</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No cryptocurrency data available
                </div>
            </div>
        );
    }

    const topCryptos = [...cryptoCurrencies]
        .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
        .slice(0, 12);

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Crypto Market Heatmap</h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider">24h Change</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {topCryptos.map((crypto) => (
                    <div
                        key={crypto.id}
                        className={`${getHeatmapColor(crypto.change24h)} border rounded-lg p-4 hover:scale-105 transition-all duration-200 cursor-pointer relative group`}
                        onClick={() => onToggleFavorite(crypto.id)}
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <StarIcon 
                                className="w-4 h-4 text-yellow-400" 
                                filled={!!crypto.isFavorite}
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <CryptoIcon symbol={crypto.symbol} className="text-cyan-400" />
                            <div className="text-center">
                                <p className="text-white font-semibold text-sm">{crypto.symbol}</p>
                                <p className="text-xs text-gray-400 truncate max-w-full">
                                    {crypto.name}
                                </p>
                            </div>
                            <p className="text-white font-mono text-xs">
                                ${crypto.price.toFixed(2)}
                            </p>
                            <p className={`${getTextColor(crypto.change24h)} font-bold text-sm`}>
                                {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
                    <span className="text-gray-400">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                    <span className="text-gray-400">Negative</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">Click to favorite</span>
                </div>
            </div>
        </div>
    );
};
