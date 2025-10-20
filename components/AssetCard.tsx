
import React from 'react';
import { Asset, CryptoCurrency, cryptoAssetTypes, nftAssetTypes } from '../types';
// FIX: Use relative paths for local modules
import { EditIcon, TrashIcon, SparklesIcon } from './icons/Icons';

interface AssetCardProps {
  asset: Asset;
  categoryName: string;
  cryptoCurrency?: CryptoCurrency;
  onEdit: () => void;
  onDelete: () => void;
  onMint: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, categoryName, cryptoCurrency, onEdit, onDelete, onMint }) => {
    const isCrypto = cryptoAssetTypes.includes(asset.categoryId) && cryptoCurrency && asset.quantity;
    const value = isCrypto ? cryptoCurrency.price * asset.quantity : asset.value;
    const gainLoss = (asset.purchasePrice !== undefined) ? value - asset.purchasePrice : undefined;
    const isGain = gainLoss !== undefined && gainLoss >= 0;
    const gainLossPercent = (gainLoss !== undefined && asset.purchasePrice && asset.purchasePrice > 0) ? (gainLoss / asset.purchasePrice) * 100 : undefined;
    
    const isMintable = nftAssetTypes.includes(asset.categoryId) && !asset.mintId;
    const isMinted = !!asset.mintId;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-white/10 group relative flex flex-col h-full">
            {asset.imageUrl && <img src={asset.imageUrl} alt={asset.name} className="w-full h-32 object-cover rounded-md mb-4" />}
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{asset.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                         {isMinted && (
                            <span className="text-xs font-semibold uppercase tracking-wider bg-purple-900/50 text-purple-400 px-2 py-1 rounded">Minted</span>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider bg-cyan-900/50 text-cyan-400 px-2 py-1 rounded">{categoryName}</span>
                    </div>
                </div>
                <p className="text-gray-400 mt-2 text-sm">{asset.description}</p>
            </div>

            {isMintable && (
                <div className="my-4">
                    <button 
                        onClick={onMint}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 bg-purple-500/80 hover:bg-purple-500 text-white"
                        title="This is a simulated minting for tracking purposes within the app."
                    >
                        <SparklesIcon className="w-4 h-4" />
                        Mint for Tracking
                    </button>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10 font-mono text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="text-white font-semibold">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {asset.quantity && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Quantity:</span>
                        <span className="text-white">{asset.quantity} {isCrypto ? cryptoCurrency.symbol : ''}</span>
                    </div>
                )}
                {asset.purchasePrice !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Purchase Price:</span>
                        <span className="text-white">${asset.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                )}
                {asset.purchaseDate && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Purchase Date:</span>
                        <span className="text-white">{asset.purchaseDate}</span>
                    </div>
                )}
                {gainLoss !== undefined && (
                     <div className="flex justify-between">
                        <span className="text-gray-400">Gain/Loss:</span>
                        <span className={`font-semibold ${isGain ? 'text-green-400' : 'text-red-400'}`}>
                            {isGain ? '+' : ''}${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {gainLossPercent !== undefined && ` (${isGain ? '+' : ''}${gainLossPercent.toFixed(2)}%)`}
                        </span>
                    </div>
                )}
                {/* NFT Details */}
                {asset.mintId && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Mint ID:</span>
                        <span className="text-white truncate" title={asset.mintId}>{asset.mintId}</span>
                    </div>
                )}
                {asset.contractAddress && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Contract:</span>
                        <span className="text-white truncate" title={asset.contractAddress}>{asset.contractAddress}</span>
                    </div>
                )}
                {asset.tokenId && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Token ID:</span>
                        <span className="text-white truncate">{asset.tokenId}</span>
                    </div>
                )}
                 {asset.blockchainNetwork && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span className="text-white truncate">{asset.blockchainNetwork}</span>
                    </div>
                )}
            </div>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-cyan-600/80 transition-colors"><EditIcon className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-red-600/80 transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

export default AssetCard;
