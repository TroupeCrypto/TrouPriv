
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { get, set } from '../utils/storage';
import { Page, MintedNft } from '../types';
import { SpinnerIcon, CodeIcon, TrashIcon } from '../components/icons/Icons';
import ConfirmationDialog from '../components/ConfirmationDialog';


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
    });
};

const animations = [
    { name: 'None', class: '' },
    { name: 'Pulse', class: 'animate-pulse-glow' },
    { name: 'Wobble', class: 'animate-wobble' },
    { name: 'Color Shift', class: 'animate-color-shift' },
];

interface WorkshopSettings {
    prompts: string[];
    selectedAnimation: string;
    filterValues: {
        saturate: number;
        contrast: number;
        hueRotate: number;
        blur: number;
        brightness: number;
    };
}

const initialSettings: WorkshopSettings = {
    prompts: [],
    selectedAnimation: '',
    filterValues: {
        saturate: 100,
        contrast: 100,
        hueRotate: 0,
        blur: 0,
        brightness: 100,
    },
};


const PsychedelicNftWorkshop: React.FC<{ setPage: (page: Page) => void; mintedNfts: MintedNft[]; setMintedNfts: React.Dispatch<React.SetStateAction<MintedNft[]>>; }> = ({ setPage, mintedNfts, setMintedNfts }) => {
    const [settings, setSettings] = useState<WorkshopSettings>(() => get('workshop_settings', initialSettings));
    const { prompts, selectedAnimation, filterValues } = settings;
    
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isMinting, setIsMinting] = useState<boolean>(false);
    const [mintSuccess, setMintSuccess] = useState<boolean>(false);
    const [conceptImage, setConceptImage] = useState<File | null>(null);
    const [conceptImageUrl, setConceptImageUrl] = useState<string | null>(null);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const [nftToDelete, setNftToDelete] = useState<MintedNft | null>(null);
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);

    useEffect(() => {
        set('workshop_settings', settings);
    }, [settings]);

    useEffect(() => {
        if (!conceptImage) {
            setConceptImageUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(conceptImage);
        setConceptImageUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [conceptImage]);

    const handleAddPrompt = () => {
        if (currentPrompt.trim() && !prompts.includes(currentPrompt.trim())) {
            setSettings(s => ({ ...s, prompts: [...s.prompts, currentPrompt.trim()] }));
            setCurrentPrompt('');
        }
    };

    const handleRemovePrompt = (promptToRemove: string) => {
        setSettings(s => ({ ...s, prompts: s.prompts.filter(p => p !== promptToRemove) }));
    };
    
    const handleGenerateImage = async () => {
        if (prompts.length === 0 && !conceptImage) {
            setError("Please add a prompt or upload an image to bring your vision to life.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setMintSuccess(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const parts: any[] = [];
            
            if (conceptImage) {
                const base64Data = await fileToBase64(conceptImage);
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: conceptImage.type,
                    },
                });
            }
            
            let fullPrompt = `Psychedelic digital art, vibrant colors, surreal masterpiece.`;
            if (prompts.length > 0) {
                fullPrompt += ` Keywords: ${prompts.join(', ')}`;
            }

            const enhancements = [];
            if(filterValues.saturate > 150) enhancements.push('highly saturated colors');
            if(filterValues.contrast > 150) enhancements.push('high contrast');
            if(filterValues.hueRotate !== 0) enhancements.push(`a color palette shifted by ${filterValues.hueRotate} degrees`);
            if(filterValues.blur > 1) enhancements.push('a soft, dreamy blur');
            if(filterValues.brightness > 120) enhancements.push('a bright, glowing aesthetic');

            const animationName = animations.find(a => a.class === selectedAnimation)?.name;
            if (animationName && animationName !== 'None') {
                let animationDescription = '';
                switch(animationName) {
                    case 'Pulse': animationDescription = 'glowing with pulsating energy'; break;
                    case 'Wobble': animationDescription = 'a wobbly, distorted, unstable effect'; break;
                    case 'Color Shift': animationDescription = 'shifting, iridescent, rainbow colors'; break;
                }
                if (animationDescription) {
                    enhancements.push(animationDescription);
                }
            }

            if (enhancements.length > 0) {
                fullPrompt += `, incorporating ${enhancements.join(' and ')}`;
            }

            parts.push({ text: fullPrompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                    return;
                }
            }
            throw new Error("The AI didn't return an image. Try a different prompt!");
        } catch (err) {
            console.error("AI image generation failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMint = () => {
        if (!generatedImage || !imageRef.current) return;

        setIsMinting(true);

        const canvas = document.createElement('canvas');
        const img = imageRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError("Could not process image for minting.");
            setIsMinting(false);
            return;
        }
        
        const imageToDraw = new Image();
        imageToDraw.crossOrigin = 'anonymous';
        imageToDraw.src = img.src;

        imageToDraw.onload = () => {
            canvas.width = imageToDraw.naturalWidth;
            canvas.height = imageToDraw.naturalHeight;
            
            ctx.filter = img.style.filter;
            
            ctx.drawImage(imageToDraw, 0, 0);
            
            const filteredImageUrl = canvas.toDataURL('image/png');

            setTimeout(() => {
                const newNft: MintedNft = {
                    id: `nft-${Date.now()}`,
                    imageUrl: filteredImageUrl,
                    prompt: prompts.join(', ') || 'Image-based creation',
                    mintedAt: Date.now(),
                    animationClass: selectedAnimation,
                };
                setMintedNfts(prev => [newNft, ...prev]);
                setIsMinting(false);
                setMintSuccess(true);
    
                setTimeout(() => {
                    setMintSuccess(false);
                    setGeneratedImage(null);
                    setSettings(s => ({ ...s, selectedAnimation: '' }));
                }, 3000);
            }, 1500);
        }
        imageToDraw.onerror = () => {
             setError("Could not load image for minting process.");
             setIsMinting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setConceptImage(file);
        }
    };
    
    const handleConfirmDelete = () => {
        if (nftToDelete) {
            setMintedNfts(prev => prev.filter(n => n.id !== nftToDelete.id));
            setNftToDelete(null);
        }
    };

    const handleConfirmClearAll = () => {
        setMintedNfts([]);
        setShowClearAllDialog(false);
    };

    const filterStyleString = `
        saturate(${filterValues.saturate}%) 
        contrast(${filterValues.contrast}%) 
        hue-rotate(${filterValues.hueRotate}deg) 
        blur(${filterValues.blur}px) 
        brightness(${filterValues.brightness}%)
    `.replace(/\s+/g, ' ').trim();

    const EffectSlider: React.FC<{
        label: string;
        value: number;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        min?: number;
        max?: number;
        step?: number;
        unit: string;
    }> = ({ label, value, onChange, min=0, max=200, step=1, unit }) => (
        <div>
            <div className="flex justify-between items-center text-sm">
                <label className="text-gray-300">{label}</label>
                <span className="font-mono text-cyan-400">{value}{unit}</span>
            </div>
            <input type="range" value={value} onChange={onChange} min={min} max={max} step={step} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb" />
        </div>
    );

    return (
        <div className="space-y-8">
            <style>{`
                @keyframes pop-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-pop-in { animation: pop-in 0.4s ease-out forwards; }
                .glow-shadow { box-shadow: 0 0 15px rgba(139, 92, 246, 0.5), 0 0 5px rgba(6, 182, 212, 0.5); }
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none; width: 16px; height: 16px;
                    background: #06b6d4; border-radius: 50%; cursor: pointer;
                }
                .range-thumb::-moz-range-thumb {
                    width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; cursor: pointer;
                }
                @keyframes pulse-glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.1); } }
                .animate-pulse-glow { animation: pulse-glow 3s infinite ease-in-out; }
                @keyframes wobble {
                    0%, 100% { transform: translate(0, 0) rotate(0); }
                    25% { transform: translate(-2px, 2px) rotate(-1deg); }
                    75% { transform: translate(2px, -2px) rotate(1deg); }
                }
                .animate-wobble { animation: wobble 4s infinite ease-in-out; }
                @keyframes color-shift-bg { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
                .animate-color-shift { animation: color-shift-bg 5s linear infinite; }
            `}</style>
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <CodeIcon className="w-8 h-8 text-fuchsia-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Psychedelic NFT Workshop</h1>
                        <button onClick={() => setPage(Page.Web3Tools)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web3 Tools</button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Controls */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">1. Conceptualize your Masterpiece</h2>
                        <p className="text-sm text-gray-400 mt-2">Upload a concept image and/or add descriptive keywords to guide the AI.</p>
                        
                        <div className="p-4 border border-dashed border-white/20 rounded-lg text-center space-y-2 mt-4">
                            <label htmlFor="conceptImageUpload" className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                                {conceptImage ? 'Change concept image' : '+ Upload a concept image (optional)'}
                            </label>
                            <input id="conceptImageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            {conceptImageUrl && (
                                <div className="relative w-24 h-24 mx-auto">
                                    <img src={conceptImageUrl} alt="Concept preview" className="w-full h-full object-cover rounded-md" />
                                    <button
                                        onClick={() => setConceptImage(null)}
                                        className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                                        aria-label="Remove concept image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentPrompt}
                                    onChange={(e) => setCurrentPrompt(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPrompt()}
                                    placeholder="Add a keyword or phrase..."
                                    className="flex-grow bg-gray-900/70 border border-white/10 rounded-md p-2 text-white font-mono text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                                />
                                <button onClick={handleAddPrompt} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-2 rounded-md transition-colors text-sm">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {prompts.map(p => (
                                    <div key={p} className="bg-fuchsia-800/50 text-fuchsia-200 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-2">
                                        <span>{p}</span>
                                        <button onClick={() => handleRemovePrompt(p)} className="text-fuchsia-300 hover:text-white">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">2. Enhance Your Vision</h2>
                         <div className="space-y-3">
                             <EffectSlider label="Saturation" value={filterValues.saturate} onChange={(e) => setSettings(s => ({...s, filterValues: { ...s.filterValues, saturate: +e.target.value }}))} unit="%" />
                             <EffectSlider label="Contrast" value={filterValues.contrast} onChange={(e) => setSettings(s => ({...s, filterValues: { ...s.filterValues, contrast: +e.target.value }}))} unit="%" />
                             <EffectSlider label="Brightness" value={filterValues.brightness} onChange={(e) => setSettings(s => ({...s, filterValues: { ...s.filterValues, brightness: +e.target.value }}))} unit="%" />
                             <EffectSlider label="Hue Rotate" value={filterValues.hueRotate} max={360} onChange={(e) => setSettings(s => ({...s, filterValues: { ...s.filterValues, hueRotate: +e.target.value }}))} unit="deg" />
                             <EffectSlider label="Blur" value={filterValues.blur} max={10} step={0.1} onChange={(e) => setSettings(s => ({...s, filterValues: { ...s.filterValues, blur: +e.target.value }}))} unit="px" />
                        </div>
                         <div>
                            <h3 className="text-md font-semibold text-gray-300 mb-2">Animations</h3>
                            <div className="flex flex-wrap gap-2">
                                {animations.map(opt => (
                                    <button
                                        key={opt.name}
                                        onClick={() => setSettings(s => ({...s, selectedAnimation: opt.class}))}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                            selectedAnimation === opt.class
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        {opt.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={handleGenerateImage}
                            disabled={isLoading}
                            className="w-full bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? <><SpinnerIcon className="w-5 h-5" />Generating...</> : 'Generate Masterpiece'}
                        </button>
                        {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
                    </div>
                </div>

                {/* Display & Mint */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 space-y-4 min-h-[400px] flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">3. Mint Your Creation</h2>
                        <div className="mt-4 aspect-square w-full bg-black/30 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                            {isLoading && <SpinnerIcon className="w-12 h-12 text-fuchsia-400" />}
                            {!isLoading && generatedImage && (
                                <div className={`w-full h-full flex items-center justify-center ${selectedAnimation}`}>
                                    <img 
                                        ref={imageRef} 
                                        crossOrigin="anonymous" 
                                        src={generatedImage} 
                                        alt="Generated NFT artwork" 
                                        className={`w-full h-full object-contain animate-pop-in`}
                                        style={{ filter: filterStyleString }}
                                    />
                                </div>
                            )}
                            {!isLoading && !generatedImage && (
                                <p className="text-gray-500 px-8 text-center">Your generated artwork will appear here.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        {generatedImage && !isMinting && !mintSuccess && (
                             <button
                                onClick={handleMint}
                                className="w-full bg-cyan-500/80 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                Mint to Gallery
                            </button>
                        )}
                         {isMinting && (
                             <div className="w-full text-center text-gray-400 py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-4">
                                <SpinnerIcon className="w-5 h-5" /> Minting to your collection...
                            </div>
                        )}
                        {mintSuccess && (
                            <div className="w-full text-center bg-green-800/50 border border-green-500 text-green-300 font-semibold py-3 px-4 rounded-md mt-4 animate-pop-in">
                                ✓ Successfully Minted!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gallery */}
            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-white">Your Minted Collection</h2>
                    {mintedNfts.length > 0 && (
                        <button onClick={() => setShowClearAllDialog(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-4 h-4" /> Clear All
                        </button>
                    )}
                </div>
                {mintedNfts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {mintedNfts.map(nft => (
                            <div key={nft.id} className="aspect-square bg-black/20 rounded-lg overflow-hidden border border-transparent hover:border-cyan-400/50 transition-all duration-300 group relative glow-shadow">
                                <div className={`w-full h-full ${nft.animationClass || ''}`}>
                                    <img src={nft.imageUrl} alt={nft.prompt} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/70 p-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity overflow-y-auto">
                                    <p className="font-mono">{nft.prompt}</p>
                                </div>
                                 <button
                                    onClick={() => setNftToDelete(nft)}
                                    className="absolute top-2 right-2 p-2 bg-gray-800/80 rounded-full text-gray-300 hover:text-white hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Delete NFT"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Your gallery is empty. Generate and mint your first NFT to start your collection!</p>
                )}
            </div>
            
            <ConfirmationDialog
                isOpen={!!nftToDelete}
                title="Delete NFT"
                message="Are you sure you want to permanently delete this NFT from your collection?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setNftToDelete(null)}
                confirmText="Delete"
            />
            <ConfirmationDialog
                isOpen={showClearAllDialog}
                title="Clear Entire Collection"
                message="Are you sure you want to delete ALL minted NFTs? This action cannot be undone."
                onConfirm={handleConfirmClearAll}
                onCancel={() => setShowClearAllDialog(false)}
                confirmText="Clear All"
            />
        </div>
    );
};

export default PsychedelicNftWorkshop;
