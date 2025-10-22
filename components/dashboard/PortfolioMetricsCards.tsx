import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '../icons/Icons';

interface MetricCardProps {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeLabel, icon, trend }) => {
    const getTrendColor = () => {
        if (!trend || trend === 'neutral') return 'text-gray-400';
        return trend === 'up' ? 'text-green-400' : 'text-red-400';
    };

    const getTrendBgColor = () => {
        if (!trend || trend === 'neutral') return 'bg-gray-800/50';
        return trend === 'up' ? 'bg-green-500/10' : 'bg-red-500/10';
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
                {icon && <div className="text-cyan-400">{icon}</div>}
            </div>
            <div className="space-y-2">
                <p className="text-3xl font-bold text-white font-mono">{value}</p>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
                        {trend === 'up' && <ArrowUpIcon className="w-4 h-4" />}
                        {trend === 'down' && <ArrowDownIcon className="w-4 h-4" />}
                        <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
                        {changeLabel && <span className="text-xs text-gray-500 ml-1">({changeLabel})</span>}
                    </div>
                )}
            </div>
            {trend && trend !== 'neutral' && (
                <div className={`mt-4 h-1 rounded-full ${getTrendBgColor()}`}>
                    <div 
                        className={`h-full rounded-full ${trend === 'up' ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(Math.abs(change || 0) * 10, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
};

interface PortfolioMetricsCardsProps {
    totalValue: number;
    change24h: number;
    assetCount: number;
    topAssetChange: number;
    avgAssetValue: number;
    cryptoAllocation: number;
}

export const PortfolioMetricsCards: React.FC<PortfolioMetricsCardsProps> = ({
    totalValue,
    change24h,
    assetCount,
    topAssetChange,
    avgAssetValue,
    cryptoAllocation
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
                title="Total Portfolio Value"
                value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change={change24h}
                changeLabel="24h"
                trend={change24h >= 0 ? 'up' : 'down'}
            />
            <MetricCard
                title="Total Assets"
                value={assetCount.toString()}
                icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                }
            />
            <MetricCard
                title="Top Performer"
                value={`${topAssetChange >= 0 ? '+' : ''}${topAssetChange.toFixed(2)}%`}
                change={topAssetChange}
                trend={topAssetChange >= 0 ? 'up' : 'down'}
            />
            <MetricCard
                title="Avg Asset Value"
                value={`$${avgAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <MetricCard
                title="Crypto Allocation"
                value={`${cryptoAllocation.toFixed(1)}%`}
                icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />
            <MetricCard
                title="Diversification Score"
                value={assetCount > 0 ? `${Math.min((assetCount / 10) * 100, 100).toFixed(0)}%` : '0%'}
                icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                }
            />
        </div>
    );
};
