import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformerData {
    name: string;
    change: number;
    value: number;
}

interface TopPerformersChartProps {
    data: PerformerData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.change >= 0;
        return (
            <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-white font-semibold mb-1">{data.name}</p>
                <p className="text-cyan-400 font-mono text-sm">
                    ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`font-semibold text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{data.change.toFixed(2)}%
                </p>
            </div>
        );
    }
    return null;
};

const CustomLabel = ({ x, y, width, value }: any) => {
    const isPositive = value >= 0;
    return (
        <text
            x={x + width / 2}
            y={y - 5}
            fill={isPositive ? "#10b981" : "#ef4444"}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
        >
            {isPositive ? '+' : ''}{value.toFixed(1)}%
        </text>
    );
};

export const TopPerformersChart: React.FC<TopPerformersChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 h-full">
                <h2 className="text-xl font-bold text-white mb-4">Top Performers (24h)</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No performance data available
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Top Performers (24h)</h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider">By % Change</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickLine={{ stroke: '#4b5563' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={{ stroke: '#4b5563' }}
                        axisLine={{ stroke: '#4b5563' }}
                        label={{ value: '% Change', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="change" radius={[8, 8, 0, 0]} label={<CustomLabel />}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.change >= 0 ? '#10b981' : '#ef4444'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
