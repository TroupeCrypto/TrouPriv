import React, { useMemo } from 'react';
import { CryptoCurrency } from '../../types';

interface RiskAnalysisProps {
    cryptoCurrencies: CryptoCurrency[];
    cryptoAllocation: number;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ cryptoCurrencies, cryptoAllocation }) => {
    const riskMetrics = useMemo(() => {
        if (!cryptoCurrencies || cryptoCurrencies.length === 0) {
            return {
                avgVolatility: 0,
                highRiskAssets: 0,
                riskScore: 0,
                riskLevel: 'Unknown',
                riskColor: 'text-gray-500',
            };
        }

        // Calculate average volatility (using 24h change as proxy)
        const volatilities = cryptoCurrencies.map(c => Math.abs(c.change24h));
        const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;

        // Count high-risk assets (>10% change in 24h)
        const highRiskAssets = cryptoCurrencies.filter(c => Math.abs(c.change24h) > 10).length;

        // Calculate risk score (0-100)
        // Factors: crypto allocation %, average volatility, high-risk asset count
        const allocationRisk = cryptoAllocation; // Higher crypto allocation = higher risk
        const volatilityRisk = Math.min(avgVolatility * 5, 50); // Cap at 50
        const concentrationRisk = (highRiskAssets / cryptoCurrencies.length) * 30;
        
        const riskScore = Math.min(
            Math.round((allocationRisk * 0.4) + (volatilityRisk * 0.4) + (concentrationRisk * 0.2)),
            100
        );

        let riskLevel = 'Low';
        let riskColor = 'text-green-400';
        if (riskScore >= 70) {
            riskLevel = 'High';
            riskColor = 'text-red-400';
        } else if (riskScore >= 40) {
            riskLevel = 'Medium';
            riskColor = 'text-yellow-400';
        }

        return {
            avgVolatility,
            highRiskAssets,
            riskScore,
            riskLevel,
            riskColor,
        };
    }, [cryptoCurrencies, cryptoAllocation]);

    const getRiskScoreColor = (score: number): string => {
        if (score >= 70) return 'bg-red-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getRiskScoreBgColor = (score: number): string => {
        if (score >= 70) return 'bg-red-500/20';
        if (score >= 40) return 'bg-yellow-500/20';
        return 'bg-green-500/20';
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Risk Analysis</h2>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Risk</span>
            </div>

            <div className="space-y-6">
                {/* Risk Score Circle */}
                <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#374151"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={getRiskScoreColor(riskMetrics.riskScore)}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${(riskMetrics.riskScore / 100) * 440} 440`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold ${riskMetrics.riskColor}`}>
                                {riskMetrics.riskScore}
                            </span>
                            <span className="text-xs text-gray-400 uppercase">Risk Score</span>
                        </div>
                    </div>
                </div>

                {/* Risk Level */}
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Risk Level</p>
                    <p className={`text-2xl font-bold ${riskMetrics.riskColor}`}>
                        {riskMetrics.riskLevel}
                    </p>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Crypto Allocation</span>
                            <span className="text-white font-mono font-semibold">
                                {cryptoAllocation.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-500"
                                style={{ width: `${cryptoAllocation}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Avg Volatility (24h)</span>
                            <span className="text-white font-mono font-semibold">
                                {riskMetrics.avgVolatility.toFixed(2)}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getRiskScoreColor(Math.min(riskMetrics.avgVolatility * 5, 100))} transition-all duration-500`}
                                style={{ width: `${Math.min(riskMetrics.avgVolatility * 5, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">High-Risk Assets</span>
                            <span className="text-white font-semibold">
                                {riskMetrics.highRiskAssets} / {cryptoCurrencies.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Risk Disclaimer */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-400 text-center">
                        Risk analysis is based on volatility and allocation. Past performance does not guarantee future results.
                    </p>
                </div>
            </div>
        </div>
    );
};
