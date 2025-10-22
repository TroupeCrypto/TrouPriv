import React from 'react';
import { Asset, AssetCategory } from '../../types';

interface AssetDistributionProps {
    assets: Asset[];
    categories: AssetCategory[];
}

interface GroupData {
    group: string;
    count: number;
    value: number;
    percentage: number;
}

export const AssetDistribution: React.FC<AssetDistributionProps> = ({ assets, categories }) => {
    const categoryMap = new Map(categories.map(c => [c.id, c.group]));
    
    const groupData: Record<string, GroupData> = {};
    let totalValue = 0;

    assets.forEach(asset => {
        const group = categoryMap.get(asset.categoryId) || 'Other';
        if (!groupData[group]) {
            groupData[group] = { group, count: 0, value: 0, percentage: 0 };
        }
        groupData[group].count += 1;
        groupData[group].value += asset.value;
        totalValue += asset.value;
    });

    // Calculate percentages
    Object.values(groupData).forEach(data => {
        data.percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    });

    const sortedGroups = Object.values(groupData).sort((a, b) => b.value - a.value);

    const getBarColor = (index: number): string => {
        const colors = [
            'bg-cyan-500',
            'bg-violet-500',
            'bg-pink-500',
            'bg-amber-500',
            'bg-emerald-500',
            'bg-blue-500',
        ];
        return colors[index % colors.length];
    };

    const getBarBgColor = (index: number): string => {
        const colors = [
            'bg-cyan-500/20',
            'bg-violet-500/20',
            'bg-pink-500/20',
            'bg-amber-500/20',
            'bg-emerald-500/20',
            'bg-blue-500/20',
        ];
        return colors[index % colors.length];
    };

    if (sortedGroups.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 h-full">
                <h2 className="text-xl font-bold text-white mb-4">Asset Distribution</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No assets to display
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Asset Distribution</h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider">By Group</span>
            </div>
            <div className="space-y-4">
                {sortedGroups.map((data, index) => (
                    <div key={data.group} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getBarColor(index)}`} />
                                <span className="text-white font-semibold">{data.group}</span>
                                <span className="text-gray-500 text-sm">({data.count} assets)</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-cyan-400 font-mono text-sm">
                                    ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-gray-400 text-sm font-semibold min-w-[3rem] text-right">
                                    {data.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className={`h-2 rounded-full ${getBarBgColor(index)} overflow-hidden`}>
                            <div
                                className={`h-full ${getBarColor(index)} transition-all duration-500`}
                                style={{ width: `${data.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-semibold">Total Portfolio</span>
                    <span className="text-white font-mono font-bold">
                        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Total Assets</span>
                    <span className="text-gray-400">{assets.length}</span>
                </div>
            </div>
        </div>
    );
};
