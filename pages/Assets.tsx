
import React, { useState, useMemo } from 'react';
import { Asset, CryptoCurrency, AssetCategory, nftAssetTypes } from '../types';
import AssetCard from '../components/AssetCard';
import AssetForm from '../components/AssetForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CsvImportModal from '../components/CsvImportModal';
import { SparklesIcon } from '../components/icons/Icons';

interface AssetsPageProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  cryptoCurrencies: CryptoCurrency[];
  assetCategories: AssetCategory[];
  setAssetCategories: React.Dispatch<React.SetStateAction<AssetCategory[]>>;
}

const AssetsPage: React.FC<AssetsPageProps> = ({ assets, setAssets, cryptoCurrencies, assetCategories, setAssetCategories }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
    
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
    
    const handleMint = (assetToMint: Asset) => {
        if (!nftAssetTypes.includes(assetToMint.categoryId)) return;

        setAssets(prev => prev.map(a => {
            if (a.id === assetToMint.id) {
                return {
                    ...a,
                    mintId: `sim-${Date.now()}`,
                    // For demo, we can generate some plausible-looking data
                    contractAddress: '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                    tokenId: String(Math.floor(Math.random() * 10000)),
                    blockchainNetwork: 'Simulated Network',
                    tokenStandard: 'ERC-721'
                };
            }
            return a;
        }));
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
