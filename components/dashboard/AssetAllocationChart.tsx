import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationData {
    name: string;
    value: number;
    percentage: number;
}

interface AssetAllocationChartProps {
    data: AllocationData[];
}

const COLORS = [
    '#06b6d4', // cyan-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f97316', // orange-500
    '#a855f7', // purple-500
    '#14b8a6', // teal-500
    '#f43f5e', // rose-500
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-white font-semibold">{data.name}</p>
                <p className="text-cyan-400 font-mono">
                    ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-gray-400 text-sm">{data.percentage.toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <ul className="flex flex-wrap justify-center gap-4 mt-4">
            {payload.map((entry: any, index: number) => (
                <li key={`legend-${index}`} className="flex items-center gap-2 text-sm">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-300">{entry.value}</span>
                    <span className="text-gray-500 font-mono text-xs">
                        {entry.payload.percentage.toFixed(1)}%
                    </span>
                </li>
            ))}
        </ul>
    );
};

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 h-full">
                <h2 className="text-xl font-bold text-white mb-4">Asset Allocation</h2>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No allocation data available
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Asset Allocation</h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider">By Category</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={renderLegend} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
