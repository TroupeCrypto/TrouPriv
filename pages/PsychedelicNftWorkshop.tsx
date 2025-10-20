

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { get, set } from '../utils/storage';
import { Page, MintedNft } from '../types';
// FIX: Use relative paths for local modules
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddPrompt(); }} className="flex gap-2 mt-4">
                            <input
                                type="text"
                                value={currentPrompt}
                                onChange={(e) => setCurrentPrompt(e.target.value)}
                                placeholder="Add a keyword (e.g., 'cosmic turtle')"
                                className="flex-grow bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                            />
                            <button type="submit" className="bg-cyan-500/80 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap">
                                Add
                            </button>
                        </form>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {prompts.map(p => (
                                <div key={p} className="bg-fuchsia-900/50 text-fuchsia-300 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                                    {p}
                                    <button onClick={() => handleRemovePrompt(p)} className="text-fuchsia-400 hover:text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white">2. Apply Visual Effects</h2>
                        <div className="mt-4 space-y-3">
                            <EffectSlider label="Saturation" value={filterValues.saturate} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, saturate: +e.target.value } }))} unit="%" />
                            <EffectSlider label="Contrast" value={filterValues.contrast} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, contrast: +e.target.value } }))} unit="%" />
                            <EffectSlider label="Hue" value={filterValues.hueRotate} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, hueRotate: +e.target.value } }))} min={0} max={360} unit="deg" />
                            <EffectSlider label="Blur" value={filterValues.blur} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, blur: +e.target.value } }))} max={10} step={0.1} unit="px" />
                            <EffectSlider label="Brightness" value={filterValues.brightness} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, brightness: +e.target.value } }))} max={200} unit="%" />
                        </div>
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold text-white">3. Add Animation</h2>
                         <div className="grid grid-cols-2 gap-2 mt-4">
                            {animations.map(anim => (
                                <button key={anim.name} onClick={() => setSettings(s => ({...s, selectedAnimation: anim.class}))} className={`py-2 text-sm font-semibold rounded-md transition-colors ${selectedAnimation === anim.class ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700'}`}>
                                    {anim.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateImage}
                        disabled={isLoading}
                        className="w-full bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                Generating Vision...
                            </>
                        ) : (
                            'Generate Masterpiece'
                        )}
                    </button>
                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                </div>

                {/* Preview */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 flex flex-col items-center justify-center min-h-[50vh]">
                    {generatedImage ? (
                        <div className="w-full space-y-4 animate-pop-in">
                            <div className={`aspect-square w-full rounded-lg overflow-hidden glow-shadow ${selectedAnimation}`}>
                                 <img ref={imageRef} src={generatedImage} alt="Generated NFT" className="w-full h-full object-cover" style={{ filter: filterStyleString }} />
                            </div>
                           
                            <button
                                onClick={handleMint}
                                disabled={isMinting || mintSuccess}
                                className="w-full bg-green-600/80 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isMinting ? <><SpinnerIcon className="w-5 h-5" />Minting...</> : mintSuccess ? '✓ Minted!' : 'Mint to ProFolio'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <p>Your generated masterpiece will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

             {/* Minted Gallery */}
            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Minted Collection</h2>
                     {mintedNfts.length > 0 && (
                        <button onClick={() => setShowClearAllDialog(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-4 h-4" /> Clear All
                        </button>
                    )}
                </div>
                {mintedNfts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {mintedNfts.map(nft => (
                             <div key={nft.id} className="group relative aspect-square">
                                <img src={nft.imageUrl} alt={nft.prompt} className={`w-full h-full object-cover rounded-md ${nft.animationClass || ''}`} />
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <button onClick={() => setNftToDelete(nft)} className="p-2 bg-red-600/80 rounded-full text-white"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-center text-gray-500 py-8">Your minted NFTs will be displayed here.</p>
                )}
            </div>
             <ConfirmationDialog
                isOpen={!!nftToDelete}
                title="Delete NFT"
                message="Are you sure you want to delete this minted NFT? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setNftToDelete(null)}
                confirmText="Delete"
            />
            <ConfirmationDialog
                isOpen={showClearAllDialog}
                title="Clear Entire Collection"
                message="Are you sure you want to delete ALL minted NFTs from the workshop? This action cannot be undone."
                onConfirm={handleConfirmClearAll}
                onCancel={() => setShowClearAllDialog(false)}
                confirmText="Clear All"
            />
        </div>
    );
};

export default PsychedelicNftWorkshop;
