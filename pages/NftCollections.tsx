
import React, { useState, useMemo } from 'react';
import { Asset, Page, Profile, BrandAuthConfig } from '../types';
import { ProFolioIcon, TrashIcon, SocialIcon } from '../components/icons/Icons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import AssetCard from '../components/AssetCard';
import { nftAssetTypes } from '../types';

interface ProFolioPageProps {
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    setPage: (page: Page) => void;
    profile: Profile;
    socialAuth: BrandAuthConfig[];
}

const ProFolioPage: React.FC<ProFolioPageProps> = ({ assets, setAssets, setPage, profile, socialAuth }) => {
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

    const nftAssets = useMemo(() => {
        return assets.filter(asset => nftAssetTypes.includes(asset.categoryId));
    }, [assets]);
    
    const handleConfirmDelete = () => {
        if (assetToDelete) {
            setAssets(prev => prev.filter(asset => asset.id !== assetToDelete.id));
            setAssetToDelete(null);
        }
    };
    
    const allSocials = useMemo(() => socialAuth.flatMap(brand => brand.socials), [socialAuth]);
    
    return (
        <div className="space-y-8">
             <header className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <img src={profile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full ring-4 ring-fuchsia-500/50 object-cover" />
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">{profile.name}'s ProFolio</h1>
                    <p className="text-gray-400 mt-1">{profile.bio || "A collection of curated digital and physical assets."}</p>
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start mt-4">
                        {allSocials.map(social => (
                             <a key={`${social.platform}-${social.url}`} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors">
                                <SocialIcon platform={social.platform} className="w-6 h-6" />
                             </a>
                        ))}
                    </div>
                </div>
            </header>

            <div>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ProFolioIcon className="w-6 h-6"/>NFT Collection</h2>
                     {nftAssets.length > 0 && (
                         <button onClick={() => { if (window.confirm("Are you sure you want to remove all NFT assets from your portfolio tracking? This cannot be undone.")) { setAssets(prev => prev.filter(a => !nftAssetTypes.includes(a.categoryId))) }}} className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
                            <TrashIcon className="w-3 h-3"/> Clear Collection
                         </button>
                     )}
                </div>
                 {nftAssets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {nftAssets.map(nft => (
                            <AssetCard 
                                key={nft.id} 
                                asset={nft}
                                categoryName={nft.categoryId}
                                onEdit={() => { /* Edit functionality can be added here */ }}
                                onDelete={() => setAssetToDelete(nft)}
                                onMint={() => { /* Minting is handled on Assets page */ }}
                             />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                        <ProFolioIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <h3 className="text-xl font-semibold text-white mt-4">Your Collection is Empty</h3>
                        <p className="text-gray-400 mt-2">Creations from the <button onClick={() => setPage(Page.PsychedelicNftWorkshop)} className="text-cyan-400 hover:underline font-semibold">NFT Workshop</button> will appear here.</p>
                    </div>
                )}
            </div>
            
            <ConfirmationDialog
                isOpen={!!assetToDelete}
                title="Delete NFT Asset"
                message={`Are you sure you want to remove "${assetToDelete?.name}" from your portfolio? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setAssetToDelete(null)}
                confirmText="Delete"
            />
        </div>
    );
};

export default ProFolioPage;
