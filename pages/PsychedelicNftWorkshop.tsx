

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { get, set } from '../utils/storage';
import { Page, Asset, AssetCategory } from '../types';
// FIX: Imported the missing SparklesIcon component.
import { SpinnerIcon, CodeIcon, CheckCircleIcon, SparklesIcon } from '../components/icons/Icons';

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


const PsychedelicNftWorkshop: React.FC<{ 
    setPage: (page: Page) => void; 
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>; 
    assetCategories: AssetCategory[];
}> = ({ setPage, setAssets, assetCategories }) => {
    const [settings, setSettings] = useState<WorkshopSettings>(() => get('workshop_settings', initialSettings));
    const { prompts, selectedAnimation, filterValues } = settings;
    
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [conceptImage, setConceptImage] = useState<File | null>(null);
    const [conceptImageUrl, setConceptImageUrl] = useState<string | null>(null);
    
    const imageRef = useRef<HTMLImageElement>(null);

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
        setSaveSuccess(false);

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
    
    const handleSaveCreation = () => {
        if (!generatedImage || !imageRef.current) return;

        setIsSaving(true);

        const canvas = document.createElement('canvas');
        const img = imageRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError("Could not process image for saving.");
            setIsSaving(false);
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
            
            const nftArtCategory = assetCategories.find(c => c.id === 'nft-art');
            if (!nftArtCategory) {
                setError("Could not save: 'NFT - Art' category not found.");
                setIsSaving(false);
                return;
            }

            setTimeout(() => {
                const newAsset: Asset = {
                    id: `creation-${Date.now()}`,
                    name: prompts.length > 0 ? prompts.join(', ').substring(0, 50) : 'Psychedelic Artwork',
                    categoryId: 'nft-art',
                    value: 0,
                    description: `AI-generated artwork from the Psychedelic NFT Workshop. Based on prompts: "${prompts.join(', ')}".`,
                    imageUrl: filteredImageUrl,
                };
                
                setAssets(prev => [newAsset, ...prev]);
                setIsSaving(false);
                setSaveSuccess(true);
    
                setTimeout(() => {
                    setSaveSuccess(false);
                    setGeneratedImage(null);
                    setSettings(s => ({ ...s, selectedAnimation: '' }));
                }, 3000);
            }, 1500);
        }
        imageToDraw.onerror = () => {
             setError("Could not load image for saving process.");
             setIsSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setConceptImage(file);
        }
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
                        {/* FIX: Replaced non-existent 'Page.Web3Tools' with 'Page.WebDev' and updated link text. */}
                        <button onClick={() => setPage(Page.WebDev)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web-Dev</button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Controls */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2">Concept</h3>
                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentPrompt}
                                    onChange={(e) => setCurrentPrompt(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPrompt()}
                                    placeholder="Add a prompt keyword (e.g., 'cosmic turtle')"
                                    className="flex-grow bg-gray-700/50 border border-white/10 rounded-md px-3 py-1.5 text-sm"
                                />
                                <button onClick={handleAddPrompt} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 rounded-md text-sm">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {prompts.map(p => (
                                    <span key={p} className="bg-fuchsia-900/50 text-fuchsia-300 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5">
                                        {p}
                                        <button onClick={() => handleRemovePrompt(p)} className="text-fuchsia-400 hover:text-white">&times;</button>
                                    </span>
                                ))}
                            </div>
                            <div className="text-center text-gray-500 text-sm my-2">OR</div>
                            <div className="text-center">
                                 <label htmlFor="concept-upload" className="cursor-pointer text-sm text-cyan-400 hover:underline">
                                    Upload a reference image
                                </label>
                                <input id="concept-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                                {conceptImageUrl && <img src={conceptImageUrl} alt="Concept Preview" className="mt-2 w-24 h-24 object-cover rounded-md mx-auto"/>}
                            </div>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-bold mb-2">Visual Effects</h3>
                        <div className="p-3 bg-gray-800/50 rounded-lg grid grid-cols-2 gap-4">
                            <EffectSlider label="Saturation" value={filterValues.saturate} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, saturate: +e.target.value } }))} unit="%"/>
                            <EffectSlider label="Contrast" value={filterValues.contrast} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, contrast: +e.target.value } }))} unit="%"/>
                            <EffectSlider label="Hue" value={filterValues.hueRotate} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, hueRotate: +e.target.value } }))} max={360} unit="deg"/>
                            <EffectSlider label="Brightness" value={filterValues.brightness} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, brightness: +e.target.value } }))} unit="%"/>
                             <div className="col-span-2">
                                <EffectSlider label="Blur" value={filterValues.blur} onChange={(e) => setSettings(s => ({ ...s, filterValues: { ...s.filterValues, blur: +e.target.value } }))} max={10} step={0.1} unit="px"/>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-bold mb-2">Animation</h3>
                         <div className="flex flex-wrap gap-2">
                            {animations.map(anim => (
                                <button key={anim.name} onClick={() => setSettings(s => ({ ...s, selectedAnimation: anim.class }))} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedAnimation === anim.class ? 'bg-cyan-500 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'}`}>
                                    {anim.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGenerateImage} disabled={isLoading} className="w-full bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-md transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2 text-lg">
                        {isLoading ? <SpinnerIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading ? 'Conjuring Vision...' : 'Generate'}
                    </button>
                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                </div>

                {/* Canvas */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10 aspect-square flex flex-col items-center justify-center relative">
                    {isLoading && <SpinnerIcon className="w-16 h-16 text-fuchsia-400" />}
                    {!isLoading && !generatedImage && (
                        <div className="text-center text-gray-500">
                            <SparklesIcon className="w-16 h-16 mx-auto" />
                            <p className="mt-2">Your creation will appear here.</p>
                        </div>
                    )}
                    {generatedImage && (
                        <div className="w-full h-full flex flex-col items-center justify-center animate-pop-in">
                            <div className={`relative glow-shadow rounded-lg ${selectedAnimation}`}>
                                <img
                                    ref={imageRef}
                                    src={generatedImage}
                                    alt="Generated psychedelic art"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                    style={{ filter: filterStyleString }}
                                />
                            </div>
                            <div className="mt-6 flex gap-4">
                                <button onClick={handleSaveCreation} disabled={isSaving || saveSuccess} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isSaving ? <SpinnerIcon className="w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : null}
                                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Assets!' : 'Save to Assets'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PsychedelicNftWorkshop;