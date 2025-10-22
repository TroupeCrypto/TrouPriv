import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { PortfolioHistoryPoint } from '../../types';

interface PerformanceTrendChartProps {
    data: PortfolioHistoryPoint[];
    timeRange: '24h' | '7d' | '1m' | 'all';
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(data.timestamp);
        return (
            <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-gray-400 text-xs mb-1">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </p>
                <p className="text-cyan-400 font-mono font-semibold">
                    ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

const formatXAxis = (timestamp: number, timeRange: string) => {
    const date = new Date(timestamp);
    if (timeRange === '24h') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (timeRange === '1m') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const formatYAxis = (value: number) => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
};

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data, timeRange }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 h-full">
                <h2 className="text-xl font-bold text-white mb-4">Portfolio Performance</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No performance data available
                </div>
            </div>
        );
    }

    const lastValue = data[data.length - 1]?.value || 0;
    const firstValue = data[0]?.value || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue === 0 ? 0 : (change / firstValue) * 100;
    const isPositive = change >= 0;

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Portfolio Performance</h2>
                    <div className="flex items-baseline gap-4">
                        <p className="text-3xl font-bold text-white font-mono">
                            ${lastValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            <span>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(timestamp) => formatXAxis(timestamp, timeRange)}
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                        axisLine={{ stroke: '#4b5563' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
