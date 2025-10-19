
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, CryptoCurrency, AssetCategory, cryptoAssetTypes } from '../types';
import AssetCard from '../components/AssetCard';
import AssetForm from '../components/AssetForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { CategoryIcon } from '../components/icons/Icons';
import { get, set } from '../utils/storage';

interface AssetsPageProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  cryptoCurrencies: CryptoCurrency[];
  assetCategories: AssetCategory[];
}

const AssetsPage: React.FC<AssetsPageProps> = ({ assets, setAssets, cryptoCurrencies, assetCategories }) => {
    const [selectedGroup, setSelectedGroup] = useState<string | null>(() => get('assetsPage_selectedGroup', null));
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => get('assetsPage_selectedCategory', null));
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Partial<Asset> | undefined>(undefined);
    const [assetToDelete, setAssetToDelete] = useState<Asset | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState(() => get('assetsPage_searchTerm', ''));

    useEffect(() => {
        set('assetsPage_selectedGroup', selectedGroup);
        set('assetsPage_selectedCategory', selectedCategoryId);
    }, [selectedGroup, selectedCategoryId]);

    useEffect(() => {
        set('assetsPage_searchTerm', searchTerm);
    }, [searchTerm]);

    const assetCategoryGroups = useMemo(() => ['All', ...Array.from(new Set(assetCategories.map(c => c.group)))], [assetCategories]);

    const filteredCategories = useMemo(() => {
        if (!selectedGroup || selectedGroup === 'All') return assetCategories;
        return assetCategories.filter(c => c.group === selectedGroup);
    }, [assetCategories, selectedGroup]);

    const globalFilteredAssets = useMemo(() => {
        if (!searchTerm) return [];
        
        const categoryMap = new Map(assetCategories.map(c => [c.id, c]));

        return assets.filter(asset => {
            const searchLower = searchTerm.toLowerCase();
            // FIX: Cast the result of categoryMap.get() to the correct type to resolve the type inference issue.
            const category = categoryMap.get(asset.categoryId) as AssetCategory | undefined;
            const categoryName = category?.name.toLowerCase() || '';
            const groupName = category?.group.toLowerCase() || '';

            const matchesName = asset.name.toLowerCase().includes(searchLower);
            const matchesDescription = asset.description.toLowerCase().includes(searchLower);
            const matchesCategory = categoryName.includes(searchLower);
            const matchesGroup = groupName.includes(searchLower);
            
            return matchesName || matchesDescription || matchesCategory || matchesGroup;
        });
    }, [assets, searchTerm, assetCategories]);

    const handleSaveAsset = (asset: Asset) => {
        if (assetToEdit && assetToEdit.id) {
            setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
        } else {
            setAssets(prev => [asset, ...prev]);
        }
        setIsFormVisible(false);
        setAssetToEdit(undefined);
    };

    const handleEditAsset = (asset: Asset) => {
        setAssetToEdit(asset);
        setIsFormVisible(true);
    };

    const handleMintAsset = (assetToMint: Asset) => {
        setAssets(prev => prev.map(a => {
            if (a.id === assetToMint.id) {
                return {
                    ...a,
                    mintId: `TP-NFT-${Date.now()}`,
                    tokenId: a.tokenId || a.id, 
                    contractAddress: a.contractAddress || `0xTP${Date.now().toString(16).slice(-8)}...${a.id.slice(0, 4)}`,
                    blockchainNetwork: a.blockchainNetwork || 'TrouPrive Chain (Simulated)',
                    tokenStandard: a.tokenStandard || 'ERC-721'
                };
            }
            return a;
        }));
    };

    const handleAddNew = () => {
        setAssetToEdit({
            categoryId: selectedCategoryId || undefined,
        });
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setAssetToEdit(undefined);
    };
    
    const handleDeleteAsset = (asset: Asset) => {
        setAssetToDelete(asset);
    };
    
    const handleConfirmDelete = () => {
        if (assetToDelete) {
            setAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
            setAssetToDelete(undefined);
        }
    };
    
    const CategoryCard: React.FC<{
        category: AssetCategory;
        assetCount: number;
        onClick: () => void;
    }> = ({ category, assetCount, onClick }) => (
        <div
            onClick={onClick}
            className="p-6 bg-gray-900/50 rounded-lg border border-white/10 group cursor-pointer transition-all duration-300 hover:border-fuchsia-400/50 hover:-translate-y-1"
        >
            <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors flex-grow">{category.name}</h3>
                <p className="text-sm text-gray-400 mt-2">{assetCount} asset{assetCount !== 1 ? 's' : ''}</p>
            </div>
        </div>
    );

    const renderContent = () => {
        if (searchTerm) {
             return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {globalFilteredAssets.length > 0 ? globalFilteredAssets.map(asset => {
                        const crypto = cryptoAssetTypes.includes(asset.categoryId) ? cryptoCurrencies.find(c => c.id === asset.cryptoId) : undefined;
                        const category = assetCategories.find(c => c.id === asset.categoryId);
                        return (
                             <AssetCard 
                                key={asset.id} 
                                asset={asset} 
                                categoryName={category?.name || 'Unknown'}
                                cryptoCurrency={crypto}
                                onEdit={() => handleEditAsset(asset)}
                                onDelete={() => handleDeleteAsset(asset)}
                                onMint={() => handleMintAsset(asset)}
                            />
                        )
                    }) : (
                        <p className="text-gray-500 col-span-full text-center py-10">No assets found for "{searchTerm}".</p>
                    )}
                </div>
            );
        }

        if (selectedCategoryId) {
            const selectedCategory = assetCategories.find(c => c.id === selectedCategoryId);
            const filteredAssets = assets.filter(a => a.categoryId === selectedCategoryId);
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">{selectedCategory?.name}</h2>
                        <button onClick={() => setSelectedCategoryId(null)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Categories</button>
                    </div>
                    {filteredAssets.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                            <h3 className="text-xl font-semibold text-white">No Assets Here</h3>
                            <p className="text-gray-400 mt-2">Click "Add New Asset" to get started in this category.</p>
                        </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAssets.map(asset => {
                                const crypto = cryptoAssetTypes.includes(asset.categoryId) ? cryptoCurrencies.find(c => c.id === asset.cryptoId) : undefined;
                                return (
                                    <AssetCard 
                                        key={asset.id} 
                                        asset={asset} 
                                        categoryName={selectedCategory?.name || 'Unknown'}
                                        cryptoCurrency={crypto}
                                        onEdit={() => handleEditAsset(asset)}
                                        onDelete={() => handleDeleteAsset(asset)}
                                        onMint={() => handleMintAsset(asset)}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // Category grid view
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredCategories.map(category => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        assetCount={assets.filter(a => a.categoryId === category.id).length}
                        onClick={() => setSelectedCategoryId(category.id)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-gray-400">
                    <h1 className="text-3xl font-bold text-white">Assets</h1>
                </div>
                 <div className="w-full sm:w-auto flex items-center gap-4">
                    <input 
                        type="text"
                        placeholder="Search all assets..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value); 
                            setSelectedCategoryId(null); 
                            setSelectedGroup('All');
                        }}
                        className="w-full sm:w-64 bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                    />
                    <button onClick={handleAddNew} className="bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap">
                        + Add New Asset
                    </button>
                </div>
            </div>
            
            {!searchTerm && (
                <div className="flex flex-wrap gap-2 items-center p-2 bg-gray-900/50 border border-white/10 rounded-md">
                    <span className="text-sm font-semibold text-gray-300 px-2">Filter by:</span>
                    {assetCategoryGroups.map(group => (
                        <button 
                            key={group}
                            onClick={() => {setSelectedGroup(group); setSelectedCategoryId(null);}}
                            className={`px-3 py-1 text-sm rounded-md font-semibold transition-colors ${selectedGroup === group ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {group}
                        </button>
                    ))}
                </div>
            )}
            
            {isFormVisible ? (
                <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                    <AssetForm
                        onSave={handleSaveAsset}
                        onCancel={handleCancel}
                        cryptoCurrencies={cryptoCurrencies}
                        assetCategories={assetCategories}
                        assetToEdit={assetToEdit}
                    />
                </div>
            ) : renderContent()}

            <ConfirmationDialog
                isOpen={!!assetToDelete}
                title="Delete Asset"
                message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setAssetToDelete(undefined)}
                confirmText="Delete"
            />
        </div>
    );
};

export default AssetsPage;
