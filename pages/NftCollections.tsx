import React, { useState, useMemo } from 'react';
import { MintedNft, Page, Profile, BrandAuthConfig } from '../types';
import { ProFolioIcon, TrashIcon, SocialIcon } from '../components/icons/Icons';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface ProFolioPageProps {
    mintedNfts: MintedNft[];
    setMintedNfts: React.Dispatch<React.SetStateAction<MintedNft[]>>;
    setPage: (page: Page) => void;
    profile: Profile;
    socialAuth: BrandAuthConfig[];
}

const NftCard: React.FC<{ nft: MintedNft; onDelete: () => void }> = ({ nft, onDelete }) => {
    return (
        <div className="bg-gray-900/50 border border-white/10 rounded-lg overflow-hidden group relative transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50">
            <div className={`aspect-square w-full ${nft.animationClass || ''}`}>
                <img src={nft.imageUrl} alt={nft.prompt} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 border-t border-white/10">
                <p className="text-sm text-gray-300 truncate font-mono" title={nft.prompt}>{nft.prompt || 'Untitled Artwork'}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(nft.mintedAt).toLocaleString()}</p>
            </div>
            <button
                onClick={onDelete}
                className="absolute top-2 right-2 p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete NFT"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


const ProFolioPage: React.FC<ProFolioPageProps> = ({ mintedNfts, setMintedNfts, setPage, profile, socialAuth }) => {
    const [nftToDelete, setNftToDelete] = useState<MintedNft | null>(null);
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);

    const handleConfirmDelete = () => {
        if (nftToDelete) {
            setMintedNfts(prev => prev.filter(nft => nft.id !== nftToDelete.id));
            setNftToDelete(null);
        }
    };
    
    const handleConfirmClearAll = () => {
        setMintedNfts([]);
        setShowClearAllDialog(false);
    };

    const connectedSocials = useMemo(() => {
        return socialAuth.flatMap(brand => brand.socials.filter(s => s.connected));
    }, [socialAuth]);
    
    return (
        <div className="space-y-8">
             <header className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <img src={profile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full ring-4 ring-cyan-500/50 object-cover flex-shrink-0" />
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter">{profile.name}</h1>
                    <p className="text-gray-400 mt-2 max-w-xl">{profile.bio}</p>
                    {profile.website && (
                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all mt-2 inline-block text-sm">
                            {profile.website.replace(/https?:\/\//, '')}
                        </a>
                    )}
                    {connectedSocials.length > 0 && (
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                            {connectedSocials.map(social => (
                                <a key={`${social.platform}-${social.authUrl}`} href={social.authUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title={social.platform}>
                                    <SocialIcon platform={social.platform} className="w-6 h-6" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Featured Digital Art</h2>
                    {mintedNfts.length > 0 && (
                        <button onClick={() => setShowClearAllDialog(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-4 h-4" /> Clear All
                        </button>
                    )}
                </div>
                {mintedNfts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {mintedNfts.map(nft => (
                            <NftCard key={nft.id} nft={nft} onDelete={() => setNftToDelete(nft)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-900/50 border border-dashed border-white/10 rounded-lg">
                        <ProFolioIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <h3 className="text-xl font-semibold text-white mt-4">Your Portfolio is Empty</h3>
                        <p className="text-gray-400 mt-2">Creations from the NFT Workshop will appear here.</p>
                        <button 
                            onClick={() => setPage(Page.PsychedelicNftWorkshop)}
                            className="mt-6 bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-2 px-6 rounded-md transition-colors"
                        >
                            Go to the Workshop
                        </button>
                    </div>
                )}
            </div>
            
            <ConfirmationDialog
                isOpen={!!nftToDelete}
                title="Delete NFT"
                message={`Are you sure you want to permanently delete this NFT from your portfolio? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setNftToDelete(null)}
                confirmText="Delete"
            />
            <ConfirmationDialog
                isOpen={showClearAllDialog}
                title="Clear Entire Portfolio"
                message="Are you sure you want to delete ALL minted NFTs from your portfolio? This action cannot be undone."
                onConfirm={handleConfirmClearAll}
                onCancel={() => setShowClearAllDialog(false)}
                confirmText="Clear All"
            />
        </div>
    );
};

export default ProFolioPage;