
import React, { useState, useMemo } from 'react';
import { Asset, CryptoCurrency, AssetCategory, nftAssetTypes, DeploymentTransaction, Web3Wallet } from '../types';
import AssetCard from '../components/AssetCard';
import AssetForm from '../components/AssetForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CsvImportModal from '../components/CsvImportModal';
import { SparklesIcon, WalletIcon, SpinnerIcon } from '../components/icons/Icons';
import * as ethers from 'ethers';

interface MintModalProps {
    assetToMint: Asset;
    onClose: () => void;
    onMintSuccess: (assetId: string, updates: Partial<Asset>) => void;
    deployedContracts: DeploymentTransaction[];
    web3Wallet: Web3Wallet;
}

const MintModal: React.FC<MintModalProps> = ({ assetToMint, onClose, onMintSuccess, deployedContracts, web3Wallet }) => {
    const [selectedContractAddress, setSelectedContractAddress] = useState<string>('');
    const [metadataUri, setMetadataUri] = useState('');
    const [isMinting, setIsMinting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const erc721Contracts = useMemo(() => {
        return deployedContracts.filter(tx => 
            tx.abi.some(item => item.name === 'safeMint' && item.type === 'function') &&
            tx.abi.some(item => item.name === 'tokenURI' && item.type === 'function')
        );
    }, [deployedContracts]);

    const handleMint = async () => {
        if (!selectedContractAddress || !metadataUri) {
            setError("Please select a contract and provide a metadata URI.");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setError("A Web3 wallet is required for this action.");
            return;
        }
        
        setIsMinting(true);
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractAbi = erc721Contracts.find(c => c.contractAddress === selectedContractAddress)?.abi;
            
            if (!contractAbi) {
                throw new Error("Could not find ABI for the selected contract.");
            }

            const contract = new ethers.Contract(selectedContractAddress, contractAbi, signer);
            
            const tx = await contract.safeMint(web3Wallet.address, metadataUri);
            const receipt = await tx.wait();
            
            // It's not straightforward to get tokenId from receipt without parsing logs.
            // For now, we store the tx hash and let the user fill in the token ID later.
            const updates: Partial<Asset> = {
                contractAddress: selectedContractAddress,
                mintTxHash: tx.hash,
                blockchainNetwork: web3Wallet.network,
                mintId: 'Minted', // Generic status update
            };
            onMintSuccess(assetToMint.id, updates);
            onClose();

        } catch (err) {
            console.error("Minting failed:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during minting.");
        } finally {
            setIsMinting(false);
        }
    };
    
    const metadataTemplate = JSON.stringify({
        name: assetToMint.name,
        description: assetToMint.description,
        image: "YOUR_IMAGE_IPFS_OR_HTTP_URL_HERE",
        attributes: [
            { trait_type: "Category", value: assetToMint.categoryId }
        ]
    }, null, 2);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Mint "{assetToMint.name}" NFT</h2>
                {assetToMint.imageUrl && <img src={assetToMint.imageUrl} alt="Asset to mint" className="w-full h-48 object-contain rounded-md mb-4" />}
                
                <p className="text-sm text-gray-400">Upload the metadata below to a service like IPFS, then paste the URL.</p>
                <pre className="bg-gray-800 p-2 rounded-md text-xs text-gray-300 max-h-32 overflow-y-auto">{metadataTemplate}</pre>
                
                <select 
                    value={selectedContractAddress} 
                    onChange={e => setSelectedContractAddress(e.target.value)}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white"
                >
                    <option value="">-- Select a Deployed ERC721 Contract --</option>
                    {erc721Contracts.map(tx => (
                        <option key={tx.contractAddress} value={tx.contractAddress}>{tx.contractName} ({tx.contractAddress.slice(0, 6)}...)</option>
                    ))}
                </select>

                <input 
                    type="text" 
                    value={metadataUri} 
                    onChange={e => setMetadataUri(e.target.value)} 
                    placeholder="ipfs://... or https://... Metadata URI"
                    className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white"
                />

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                
                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <button onClick={onClose} disabled={isMinting} className="px-6 py-2 rounded-md text-sm bg-gray-600/50 hover:bg-gray-600">Cancel</button>
                    <button onClick={handleMint} disabled={isMinting || !selectedContractAddress || !metadataUri} className="px-6 py-2 rounded-md text-sm bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-700 flex items-center gap-2">
                        {isMinting ? <SpinnerIcon className="w-4 h-4" /> : <WalletIcon className="w-4 h-4" />}
                        {isMinting ? 'Minting...' : 'Mint'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AssetsPageProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  cryptoCurrencies: CryptoCurrency[];
  assetCategories: AssetCategory[];
  setAssetCategories: React.Dispatch<React.SetStateAction<AssetCategory[]>>;
  deploymentTransactions: DeploymentTransaction[];
  web3Wallet: Web3Wallet | null;
}

const AssetsPage: React.FC<AssetsPageProps> = ({ assets, setAssets, cryptoCurrencies, assetCategories, setAssetCategories, deploymentTransactions, web3Wallet }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
    const [assetToMint, setAssetToMint] = useState<Asset | null>(null);
    
    const [filterGroup, setFilterGroup] = useState('All');
    const categoryGroups = useMemo(() => ['All', ...Array.from(new Set(assetCategories.map(c => c.group)))], [assetCategories]);

    const filteredAssets = useMemo(() => {
        if (filterGroup === 'All') return assets;
        const groupCategoryIds = assetCategories.filter(c => c.group === filterGroup).map(c => c.id);
        return assets.filter(a => groupCategoryIds.includes(a.categoryId));
    }, [assets, filterGroup, assetCategories]);

    const handleAddNew = () => {
        setAssetToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (asset: Asset) => {
        setAssetToEdit(asset);
        setIsFormOpen(true);
    };

    const handleDelete = (asset: Asset) => {
        setAssetToDelete(asset);
    };

    const handleSaveAsset = (asset: Asset) => {
        if (assetToEdit) {
            setAssets(prev => prev.map(a => (a.id === asset.id ? asset : a)));
        } else {
            setAssets(prev => [...prev, asset]);
        }
        setIsFormOpen(false);
        setAssetToEdit(null);
    };

    const handleConfirmDelete = () => {
        if (assetToDelete) {
            setAssets(prev => prev.filter(a => a.id !== assetToDelete!.id));
            setAssetToDelete(null);
        }
    };
    
    const handleMint = (asset: Asset) => {
        if (!web3Wallet) {
            alert("Please connect your wallet on the Wallet page before minting.");
            return;
        }
        setAssetToMint(asset);
    };
    
    const handleMintSuccess = (assetId: string, updates: Partial<Asset>) => {
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates } : a));
    };

    const handleImport = (newAssets: Asset[], newCategories: AssetCategory[]) => {
        setAssets(prev => [...prev, ...newAssets]);
        if (newCategories.length > 0) {
            setAssetCategories(prev => [...prev, ...newCategories]);
        }
    };

    const categoryMap = useMemo(() => new Map(assetCategories.map(c => [c.id, c.name])), [assetCategories]);
    const cryptoMap = useMemo(() => new Map(cryptoCurrencies.map(c => [c.id, c])), [cryptoCurrencies]);

    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Assets</h1>
                        <p className="text-gray-400 text-sm">Your unified digital and physical portfolio.</p>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Import from CSV
                    </button>
                    <button onClick={handleAddNew} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        + Add New Asset
                    </button>
                </div>
            </header>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-2xl w-full p-6 h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">{assetToEdit ? 'Edit Asset' : 'Add New Asset'}</h2>
                        <AssetForm
                            onSave={handleSaveAsset}
                            onCancel={() => setIsFormOpen(false)}
                            cryptoCurrencies={cryptoCurrencies}
                            assetCategories={assetCategories}
                            assetToEdit={assetToEdit || undefined}
                        />
                    </div>
                </div>
            )}
            
            {assetToMint && web3Wallet && (
                <MintModal 
                    assetToMint={assetToMint}
                    onClose={() => setAssetToMint(null)}
                    onMintSuccess={handleMintSuccess}
                    deployedContracts={deploymentTransactions}
                    web3Wallet={web3Wallet}
                />
            )}
            
            <CsvImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
                assetCategories={assetCategories}
            />

            <div className="flex gap-2 overflow-x-auto pb-2">
                {categoryGroups.map(group => (
                    <button
                        key={group}
                        onClick={() => setFilterGroup(group)}
                        className={`px-4 py-1 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                            filterGroup === group
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {group}
                    </button>
                ))}
            </div>

            {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAssets.map(asset => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            categoryName={categoryMap.get(asset.categoryId) || 'Unknown'}
                            cryptoCurrency={asset.cryptoId ? cryptoMap.get(asset.cryptoId) : undefined}
                            onEdit={() => handleEdit(asset)}
                            onDelete={() => handleDelete(asset)}
                            onMint={() => handleMint(asset)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                    <SparklesIcon className="w-12 h-12 mx-auto text-gray-600" />
                    <h3 className="text-xl font-semibold text-white mt-4">No Assets Found</h3>
                    <p className="text-gray-400 mt-2">Add your first asset to begin tracking your portfolio.</p>
                </div>
            )}

            <ConfirmationDialog
                isOpen={!!assetToDelete}
                title="Delete Asset"
                message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setAssetToDelete(null)}
                confirmText="Delete"
            />
        </div>
    );
};

export default AssetsPage;