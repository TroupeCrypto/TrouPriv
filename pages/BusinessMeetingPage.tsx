
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppData } from '../types';
import { BriefcaseIcon, SpinnerIcon, SparklesIcon } from '../components/icons/Icons';

interface BusinessMeetingPageProps {
  allData: Omit<AppData, 'schemaVersion'>;
}

type ReportType = 'portfolio_overview' | 'crypto_analysis' | 'investment_performance' | 'strategic_plan';

const reportOptions: { id: ReportType; name: string; description: string }[] = [
    { id: 'portfolio_overview', name: 'Comprehensive Portfolio Overview', description: 'A detailed breakdown of all assets, allocations, and overall value.' },
    { id: 'crypto_analysis', name: 'Crypto Market Analysis', description: 'In-depth analysis of current crypto holdings and market trends.' },
    { id: 'investment_performance', name: 'Investment Performance Review', description: 'Review of gains, losses, and APY from all financial positions.' },
    { id: 'strategic_plan', name: 'Forward-Looking Strategic Plan', description: 'AI-generated suggestions and plans for future business movements.' },
];

const BusinessMeetingPage: React.FC<BusinessMeetingPageProps> = ({ allData }) => {
    const [selectedReport, setSelectedReport] = useState<ReportType>('portfolio_overview');
    const [reportContent, setReportContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePrompt = useMemo(() => {
        const { assets, cryptoCurrencies, positions, aiPersona } = allData;
        
        const assetSummary = assets.map(a => `${a.name} (Category: ${a.categoryId}, Value: $${a.value.toFixed(2)})`).join(', ');
        const cryptoSummary = cryptoCurrencies.map(c => `${c.name} (Price: $${c.price.toFixed(2)}, 24h Change: ${c.change24h.toFixed(2)}%)`).join(', ');
        const positionSummary = positions.map(p => `${p.name} (Principal: $${p.principal.toFixed(2)}, APY: ${p.apy}%)`).join(', ');

        let context = `
            You are BiB!, an AI business analyst with the persona: "${aiPersona.corePersona}".
            Your task is to generate a professional, in-depth business report for your user, Ziggy Vision.
            Use the following real-time data from the TrouPrive system:
            - Assets: ${assetSummary || 'No assets tracked.'}
            - Cryptocurrencies: ${cryptoSummary || 'No cryptocurrencies tracked.'}
            - Financial Positions: ${positionSummary || 'No financial positions.'}
        `;
        
        switch(selectedReport) {
            case 'portfolio_overview':
                return `${context} \n\nGenerate a comprehensive portfolio overview. Structure it with clear headings. Include a summary of total value, asset allocation by group, highlight the top 3 most valuable assets, and identify any potential concentration risks. Conclude with a brief, actionable insight.`;
            case 'crypto_analysis':
                return `${context} \n\nGenerate a detailed crypto market analysis. Focus on the user's holdings. Discuss the recent performance (24h change) of each held asset. Briefly mention any significant market-wide news or trends that might affect their holdings. Provide a short-term outlook (bullish, bearish, neutral) for their top 2 crypto assets, with clear reasoning.`;
            case 'investment_performance':
                 return `${context} \n\nGenerate an investment performance review based on the 'Financial Positions' data. Calculate and present the total principal invested and the estimated annual return. For each position, comment on its performance relative to its APY. Highlight the best-performing position and suggest if there are any underperforming assets to review.`;
            case 'strategic_plan':
                 return `${context} \n\nGenerate a forward-looking strategic plan. Based on the entire portfolio, identify 3 potential opportunities for growth or diversification. These could be new asset classes to explore, specific cryptocurrencies showing potential, or strategies to optimize yield from existing positions. For each suggestion, provide a clear rationale and outline the potential risks. Frame this as a high-level strategic document.`;
        }
    }, [allData, selectedReport]);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportContent('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [{ text: generatePrompt }] },
            });
            setReportContent(response.text);
        } catch (err) {
            console.error("Report generation failed:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating the report.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <BriefcaseIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Business Meeting</h1>
                        <p className="text-gray-400 text-sm">Generate comprehensive, data-driven reports with BiB!</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Controls */}
                <div className="lg:col-span-1 bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Report Configuration</h2>
                    <div className="space-y-3">
                        {reportOptions.map(opt => (
                            <div key={opt.id} onClick={() => setSelectedReport(opt.id)} className={`p-3 rounded-md cursor-pointer transition-all border ${selectedReport === opt.id ? 'bg-fuchsia-900/30 border-fuchsia-500/50' : 'bg-gray-800/50 border-transparent hover:border-white/20'}`}>
                                <h3 className="font-semibold text-gray-200">{opt.name}</h3>
                                <p className="text-xs text-gray-400 mt-1">{opt.description}</p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="w-full bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? <><SpinnerIcon className="w-5 h-5" />Generating Report...</> : <><SparklesIcon className="w-5 h-5" />Generate Report</>}
                    </button>
                </div>

                {/* Report Display */}
                <div className="lg:col-span-2 bg-gray-900/50 border border-white/10 rounded-lg p-6 min-h-[60vh]">
                     <h2 className="text-xl font-semibold text-white mb-4">Generated Report</h2>
                     {isLoading && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center space-y-2">
                                <SpinnerIcon className="w-12 h-12 mx-auto text-fuchsia-400" />
                                <p>BiB! is compiling the report...</p>
                            </div>
                        </div>
                     )}
                     {error && <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 font-mono text-sm">{error}</div>}
                     {reportContent && !isLoading && (
                        <div className="prose prose-invert prose-sm max-w-none font-mono text-gray-300 whitespace-pre-wrap">
                            {reportContent}
                        </div>
                     )}
                     {!isLoading && !error && !reportContent && (
                        <div className="text-center text-gray-500 pt-20">
                            <p>Select a report type and click "Generate Report" to begin.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default BusinessMeetingPage;
