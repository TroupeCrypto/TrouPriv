
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
// FIX: Use relative paths for local modules
import { Asset, CryptoCurrency, cryptoAssetTypes, nftAssetTypes, AssetCategory } from '../types';
// FIX: Use relative paths for local modules
import { SpinnerIcon, SparklesIcon } from '../components/icons/Icons';

interface AssetFormProps {
    onSave: (asset: Asset) => void;
    onCancel: () => void;
    cryptoCurrencies: CryptoCurrency[];
    assetCategories: AssetCategory[];
    assetToEdit?: Partial<Asset>;
}

interface AiValueSuggestion {
    low: number;
    high: number;
    currency: string;
    rationale: string;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const AssetForm: React.FC<AssetFormProps> = ({ onSave, onCancel, cryptoCurrencies, assetCategories, assetToEdit }) => {
    const isEditMode = !!(assetToEdit && assetToEdit.id);

    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [value, setValue] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cryptoId, setCryptoId] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const [contractAddress, setContractAddress] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [tokenStandard, setTokenStandard] = useState('');
    const [blockchainNetwork, setBlockchainNetwork] = useState('');
    const [address, setAddress] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [isSuggestingValue, setIsSuggestingValue] = useState(false);
    const [valueSuggestion, setValueSuggestion] = useState<AiValueSuggestion | null>(null);
    const [valueSuggestionError, setValueSuggestionError] = useState<string | null>(null);

    const categoryGroups = useMemo(() => {
        const groups = new Map<string, AssetCategory[]>();
        assetCategories.forEach(cat => {
            if (!groups.has(cat.group)) {
                groups.set(cat.group, []);
            }
            groups.get(cat.group)!.push(cat);
        });
        return Array.from(groups.entries());
    }, [assetCategories]);

    useEffect(() => {
        if (assetToEdit) {
            setName(assetToEdit.name || '');
            setCategoryId(assetToEdit.categoryId || (assetCategories.length > 0 ? assetCategories[0].id : ''));
            setValue(String(assetToEdit.value || ''));
            setQuantity(String(assetToEdit.quantity || ''));
            setCryptoId(assetToEdit.cryptoId || (cryptoCurrencies.length > 0 ? cryptoCurrencies[0].id : ''));
            setDescription(assetToEdit.description || '');
            setPreviewUrl(assetToEdit.imageUrl);
            setContractAddress(assetToEdit.contractAddress || '');
            setTokenId(assetToEdit.tokenId || '');
            setTokenStandard(assetToEdit.tokenStandard || '');
            setBlockchainNetwork(assetToEdit.blockchainNetwork || '');
            setAddress(assetToEdit.address || '');
            setPurchasePrice(String(assetToEdit.purchasePrice || ''));
            setPurchaseDate(assetToEdit.purchaseDate || '');
        } else {
            if (assetCategories.length > 0) {
                setCategoryId(assetToEdit?.categoryId || assetCategories[0].id);
            }
        }
        setIsGeneratingDescription(false);
        setDescriptionError(null);
    }, [assetToEdit, assetCategories, cryptoCurrencies]);


    useEffect(() => {
        if (!imageFile) {
            if (!isEditMode) {
                 setPreviewUrl(undefined);
            }
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile, isEditMode]);

    const handleGenerateImage = async () => {
        if (!description) {
            setGenerationError("Please enter a description to generate an image.");
            return;
        }
        setIsGenerating(true);
        setGenerationError(null);
        setImageFile(null); // Clear any uploaded file

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: `A high-quality digital artwork of: ${description}` }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setPreviewUrl(imageUrl);
                    return;
                }
            }
            throw new Error("The AI did not return an image. Please try a different prompt.");
        } catch (err) {
            console.error("AI image generation failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
            setGenerationError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateDescription = async () => {
        const category = assetCategories.find(c => c.id === categoryId);
        if (!name || !category) {
            setDescriptionError("Please provide an asset name and category first.");
            return;
        }
        setIsGeneratingDescription(true);
        setDescriptionError(null);

        let promptParts = [
            `Generate a concise, professional description for a portfolio asset.`,
            `The asset's name is "${name}".`,
            `It is categorized as "${category.name}".`
        ];

        if (cryptoAssetTypes.includes(categoryId) && cryptoId && quantity) {
            const crypto = cryptoCurrencies.find(c => c.id === cryptoId);
            promptParts.push(`It's a cryptocurrency holding of ${quantity} ${crypto?.symbol || cryptoId}.`);
        } else if (nftAssetTypes.includes(categoryId)) {
            if (contractAddress) promptParts.push(`Contract Address: ${contractAddress}.`);
            if (tokenId) promptParts.push(`Token ID: ${tokenId}.`);
            if (blockchainNetwork) promptParts.push(`Blockchain: ${blockchainNetwork}.`);
        } else if (category.name === 'Real Estate') {
            if (address) promptParts.push(`Property Address: ${address}.`);
            if (purchasePrice) promptParts.push(`It was purchased for $${purchasePrice}.`);
        }

        if (value) {
            promptParts.push(`Its current estimated value is $${value}.`);
        }

        promptParts.push("The description should be suitable for a personal asset management dashboard. Keep it to 1-2 sentences.");
        const fullPrompt = promptParts.join(' ');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: fullPrompt }] },
            });

            setDescription(response.text.trim());

        } catch (err) {
            console.error("AI description generation failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setDescriptionError(`Failed to generate description: ${errorMessage}`);
        } finally {
            setIsGeneratingDescription(false);
        }
    };
    
    const handleSuggestValue = async () => {
        const category = assetCategories.find(c => c.id === categoryId);
        if (!name || !description || !category) {
            setValueSuggestionError("Asset name, category, and description are needed to suggest a value.");
            return;
        }
        setIsSuggestingValue(true);
        setValueSuggestion(null);
        setValueSuggestionError(null);

        const prompt = `
            Based on the following asset details, provide a hypothetical valuation range.
            This is for a personal portfolio and not financial advice.
            - Asset Name: "${name}"
            - Asset Type: "${category.name}"
            - Description: "${description}"
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            low: { type: Type.NUMBER, description: "The low end of the estimated value range." },
                            high: { type: Type.NUMBER, description: "The high end of the estimated value range." },
                            currency: { type: Type.STRING, description: "The currency of the valuation (e.g., USD)." },
                            rationale: { type: Type.STRING, description: "A brief, one-sentence explanation for the valuation." }
                        },
                        required: ["low", "high", "currency", "rationale"]
                    }
                }
            });
            const suggestion = JSON.parse(response.text) as AiValueSuggestion;
            setValueSuggestion(suggestion);
        } catch (err) {
            console.error("AI value suggestion failed:", err);
            setValueSuggestionError("Could not suggest a value. The AI may not have enough information.");
        } finally {
            setIsSuggestingValue(false);
        }
    };


    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const category = assetCategories.find(c => c.id === categoryId);
        if (!name || !description) {
            alert("Name and description are required.");
            return;
        }
        if (nftAssetTypes.includes(categoryId) && (!contractAddress || !tokenId)) {
            alert("Contract Address and Token ID are required for these NFT types.");
            return;
        }
        if (category?.name === 'Real Estate' && (!address || !purchasePrice || !value)) {
            alert("Address, Purchase Price, and Estimated Value are required for Real Estate.");
            return;
        }

        let uploadedImageUrl: string | undefined = assetToEdit?.imageUrl;
        if (imageFile) {
            try {
                uploadedImageUrl = await fileToDataUrl(imageFile);
            } catch (error) {
                console.error("Error reading image file:", error);
                alert("There was an error processing the image file.");
                return;
            }
        } else if (previewUrl && previewUrl.startsWith('data:image')) {
            uploadedImageUrl = previewUrl;
        }

        const assetData: Asset = {
            id: isEditMode ? assetToEdit.id! : Date.now().toString(),
            name,
            categoryId: categoryId,
            value: (!cryptoAssetTypes.includes(categoryId) ? parseFloat(value) : 0) || 0,
            quantity: quantity ? parseFloat(quantity) : undefined,
            cryptoId: cryptoAssetTypes.includes(categoryId) ? cryptoId : undefined,
            description,
            imageUrl: uploadedImageUrl || (nftAssetTypes.includes(categoryId) && contractAddress && tokenId ? `https://picsum.photos/seed/${contractAddress}${tokenId}/300/200` : category?.name === 'Real Estate' ? `https://picsum.photos/seed/${address.replace(/\s/g, '')}/300/200` : undefined),
            contractAddress: nftAssetTypes.includes(categoryId) ? contractAddress : undefined,
            tokenId: nftAssetTypes.includes(categoryId) ? tokenId : undefined,
            tokenStandard: nftAssetTypes.includes(categoryId) ? tokenStandard : undefined,
            blockchainNetwork: nftAssetTypes.includes(categoryId) ? blockchainNetwork : undefined,
            address: category?.name === 'Real Estate' ? address : undefined,
            purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
            purchaseDate: purchaseDate ? purchaseDate : undefined,
        };
        onSave(assetData);
    };

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";
    const canSuggestValue = !cryptoAssetTypes.includes(categoryId);
    const categoryName = assetCategories.find(c => c.id === categoryId)?.name;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Asset Name" required className={commonInputStyle} />
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={commonInputStyle}>
                    {categoryGroups.map(([group, categories]) => (
                        <optgroup label={group} key={group}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                    ))}
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="text-xs text-gray-400">Quantity</label>
                    <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 1 or 0.5" className={`${commonInputStyle} mt-1`} />
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Total Purchase Price ($)</label>
                    <input type="number" step="any" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="e.g., 1000" className={`${commonInputStyle} mt-1`} />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Purchase Date</label>
                    <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={`${commonInputStyle} mt-1`} />
                </div>
            </div>

            {canSuggestValue && (
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-400">Current Value ($)</label>
                        <button
                            type="button"
                            onClick={handleSuggestValue}
                            disabled={isSuggestingValue || !name || !description}
                            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSuggestingValue ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                            <span>Suggest Value</span>
                        </button>
                    </div>
                    <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g., 1200" required={!cryptoAssetTypes.includes(categoryId)} className={commonInputStyle} />
                    {valueSuggestion && (
                        <div className="mt-2 p-2 bg-gray-800/50 border border-cyan-500/30 rounded-md text-xs">
                            <p className="font-semibold text-cyan-300">AI Suggestion: ${valueSuggestion.low} - ${valueSuggestion.high} {valueSuggestion.currency}</p>
                            <p className="text-gray-400 italic mt-1">{valueSuggestion.rationale}</p>
                        </div>
                    )}
                     {valueSuggestionError && <p className="text-red-400 text-xs mt-1">{valueSuggestionError}</p>}
                </div>
            )}
            
            {cryptoAssetTypes.includes(categoryId) && (
                <div>
                    <label className="text-xs text-gray-400">Cryptocurrency</label>
                    <select value={cryptoId} onChange={e => setCryptoId(e.target.value)} className={`${commonInputStyle} mt-1`}>
                        {cryptoCurrencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>
                </div>
            )}

            {nftAssetTypes.includes(categoryId) && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={contractAddress} onChange={e => setContractAddress(e.target.value)} placeholder="Contract Address" required className={commonInputStyle} />
                        <input type="text" value={tokenId} onChange={e => setTokenId(e.target.value)} placeholder="Token ID" required className={commonInputStyle} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={tokenStandard} onChange={e => setTokenStandard(e.target.value)} placeholder="Token Standard (e.g., ERC-721)" className={commonInputStyle} />
                        <input type="text" value={blockchainNetwork} onChange={e => setBlockchainNetwork(e.target.value)} placeholder="Blockchain (e.g., Ethereum)" className={commonInputStyle} />
                    </div>
                </>
            )}
            
            {categoryName === 'Real Estate' && (
                <div>
                    <label className="text-xs text-gray-400">Property Address</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Property Address" required className={`${commonInputStyle} mt-1`} />
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="description" className="text-xs text-gray-400">Description</label>
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGeneratingDescription || !name || !categoryId}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isGeneratingDescription ? (
                            <>
                                <SpinnerIcon className="w-3 h-3 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-3 h-3" />
                                <span>Generate with AI</span>
                            </>
                        )}
                    </button>
                </div>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A description of the asset..." required rows={3} className={commonInputStyle} />
                {descriptionError && <p className="text-red-400 text-xs mt-1">{descriptionError}</p>}
            </div>
            
            {nftAssetTypes.includes(categoryId) && (
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGenerating || !description.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 bg-cyan-500/80 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white focus:ring-cyan-400"
                    >
                        {isGenerating ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                Generating Artwork...
                            </>
                        ) : (
                            'Generate Artwork with AI'
                        )}
                    </button>
                    {generationError && <p className="text-red-400 text-xs text-center">{generationError}</p>}
                </div>
            )}

            <div className="p-4 border border-dashed border-white/20 rounded-lg text-center">
                 <label htmlFor="imageUpload" className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                    {previewUrl ? 'Change Image' : 'Click to Upload Image'}
                </label>
                <input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {previewUrl && <img src={previewUrl} alt="Asset Preview" className="mt-4 w-32 h-32 object-cover rounded-md mx-auto" />}
            </div>
            
            <div className="flex items-center gap-4">
                <button type="button" onClick={onCancel} className="w-full bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Cancel
                </button>
                <button type="submit" className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    {isEditMode ? 'Update Asset' : 'Save Asset'}
                </button>
            </div>
        </form>
    );
};

export default AssetForm;
