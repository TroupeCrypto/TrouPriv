import React, { useState, useCallback, useMemo } from 'react';
import { Asset, AssetCategory } from '../types';
import { SpinnerIcon, FileUploadIcon, CheckCircleIcon, XCircleIcon } from './icons/Icons';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newAssets: Asset[], newCategories: AssetCategory[]) => void;
  assetCategories: AssetCategory[];
}

type ImportStep = 'upload' | 'map' | 'preview';

const assetProperties: (keyof Asset)[] = [
    'name', 'categoryId', 'value', 'quantity', 'description', 'purchasePrice',
    'purchaseDate', 'imageUrl', 'contractAddress', 'tokenId', 'tokenStandard',
    'blockchainNetwork', 'address', 'cryptoId'
];

const requiredMappings: (keyof Asset)[] = ['name', 'value', 'categoryId'];

const mappingSuggestions: Partial<Record<keyof Asset, string[]>> = {
  name: ['name', 'title', 'item', 'asset', 'label'],
  categoryId: ['category', 'categoryid', 'cat', 'group', 'type'],
  value: ['value', 'price', 'cost', 'market value', 'worth', 'valuation'],
  quantity: ['quantity', 'qty', 'count', 'amount', 'number'],
  cryptoId: ['cryptoid', 'crypto symbol', 'ticker'],
  description: ['description', 'desc', 'notes', 'details', 'comment'],
  imageUrl: ['imageurl', 'image', 'url', 'picture', 'photo'],
  contractAddress: ['contractaddress', 'contract'],
  tokenId: ['tokenid', 'token no'],
  tokenStandard: ['tokenstandard', 'standard'],
  blockchainNetwork: ['blockchainnetwork', 'network', 'chain'],
  address: ['address', 'location', 'property address'],
  purchasePrice: ['purchaseprice', 'purchase price', 'buy price', 'cost basis'],
  purchaseDate: ['purchasedate', 'purchase date', 'buy date', 'bought on'],
};

function autoMapHeader(header: string): keyof Asset | '' {
    const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, '');
    for (const key in mappingSuggestions) {
        if (mappingSuggestions[key as keyof Asset]?.some(suggestion => normalizedHeader.includes(suggestion.replace(/[\s_-]/g, '')))) {
            return key as keyof Asset;
        }
    }
    return '';
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport, assetCategories }) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mappings, setMappings] = useState<Record<string, keyof Asset | ''>>({});

    const [previewAssets, setPreviewAssets] = useState<Partial<Asset>[]>([]);
    const [newCategories, setNewCategories] = useState<AssetCategory[]>([]);
    const [importErrors, setImportErrors] = useState<{row: number, message: string}[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const resetState = useCallback(() => {
        setStep('upload');
        setFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setMappings({});
        setPreviewAssets([]);
        setNewCategories([]);
        setImportErrors([]);
        setIsLoading(false);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelected = (selectedFile: File) => {
        setIsLoading(true);
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 1) {
                setImportErrors([{row: 0, message: "CSV file is empty or invalid."}]);
                setIsLoading(false);
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1).map(line => line.split(',').map(val => val.trim().replace(/"/g, '')));

            setCsvHeaders(headers);
            setCsvRows(rows);

            const initialMappings: Record<string, keyof Asset | ''> = {};
            headers.forEach(header => {
                initialMappings[header] = autoMapHeader(header);
            });
            setMappings(initialMappings);

            setIsLoading(false);
            setStep('map');
        };
        reader.onerror = () => {
            setImportErrors([{row: 0, message: "Failed to read the file."}]);
            setIsLoading(false);
        };
        reader.readAsText(selectedFile);
    };

    const handleMappingChange = (header: string, assetProp: keyof Asset | '') => {
        setMappings(prev => ({ ...prev, [header]: assetProp }));
    };

    const goToPreview = () => {
        const missingMappings = requiredMappings.filter(req => !Object.values(mappings).includes(req));
        if (missingMappings.length > 0) {
            alert(`Please map the following required fields: ${missingMappings.join(', ')}`);
            return;
        }

        const localAssets: Partial<Asset>[] = [];
        const localErrors: {row: number, message: string}[] = [];
        const foundCategoryIds = new Set<string>();

        const getColumnIndex = (prop: keyof Asset): number => {
            const header = Object.keys(mappings).find(h => mappings[h] === prop);
            return header ? csvHeaders.indexOf(header) : -1;
        };

        const nameIndex = getColumnIndex('name');
        const valueIndex = getColumnIndex('value');
        const categoryIdIndex = getColumnIndex('categoryId');

        csvRows.forEach((row, rowIndex) => {
            const asset: Partial<Asset> = {};
            
            const name = row[nameIndex];
            const valueStr = row[valueIndex];
            const categoryId = row[categoryIdIndex];

            if (!name) { localErrors.push({row: rowIndex + 2, message: "Name is missing."}); }
            if (!valueStr || isNaN(parseFloat(valueStr))) { localErrors.push({row: rowIndex + 2, message: `Value "${valueStr}" is not a valid number.`}); }
            if (!categoryId) { localErrors.push({row: rowIndex + 2, message: "Category ID is missing."}); }

            if (!name || !valueStr || isNaN(parseFloat(valueStr)) || !categoryId) {
                localAssets.push({ name: name || `Row ${rowIndex + 2} (Error)`});
                return;
            }
            
            asset.name = name;
            asset.value = parseFloat(valueStr);
            asset.categoryId = categoryId;
            foundCategoryIds.add(categoryId);
            
            assetProperties.forEach(prop => {
                if (requiredMappings.includes(prop)) return;
                const index = getColumnIndex(prop);
                if (index > -1 && row[index]) {
                    const value = row[index];
                    if (prop === 'quantity' || prop === 'purchasePrice') {
                        (asset as any)[prop] = !isNaN(parseFloat(value)) ? parseFloat(value) : undefined;
                    } else {
                        (asset as any)[prop] = value;
                    }
                }
            });
            
            localAssets.push(asset);
        });

        const existingCategoryIds = new Set(assetCategories.map(c => c.id));
        const newCategoryIds = Array.from(foundCategoryIds).filter(id => id && !existingCategoryIds.has(id));
        
        const newCatsToCreate: AssetCategory[] = newCategoryIds.map(id => ({
            id: id,
            name: id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            group: 'Imported',
        }));
        
        setPreviewAssets(localAssets);
        setImportErrors(localErrors);
        setNewCategories(newCatsToCreate);
        setStep('preview');
    };

    const handleImportConfirm = () => {
        const validAssets = previewAssets
            .filter((p, index) => !importErrors.some(e => e.row === index + 2))
            .map((p, index) => ({
                ...p,
                id: `${Date.now()}-${index}`,
                description: p.description || '',
            } as Asset));
        
        onImport(validAssets, newCategories);
        handleClose();
    };

    const renderHeader = (title: string, subtitle: string) => (
        <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
    );
    
    const renderUploadStep = () => (
        <>
            {renderHeader("Step 1: Upload CSV", "Select or drop your CSV file.")}
             <div className="p-6 flex-grow overflow-y-auto space-y-4">
                 <label htmlFor="csv-upload" onDrop={(e) => { e.preventDefault(); handleFileSelected(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} className="cursor-pointer p-8 border-2 border-dashed border-white/20 rounded-lg text-center flex flex-col items-center justify-center hover:bg-gray-800/50 hover:border-fuchsia-500 transition-colors h-full">
                    {isLoading ? <SpinnerIcon className="w-10 h-10 text-gray-500" /> : <FileUploadIcon className="w-10 h-10 mx-auto text-gray-500"/>}
                    <span className="mt-2 text-gray-400">{isLoading ? 'Processing...' : 'Drag & drop a file here or click to browse'}</span>
                 </label>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && handleFileSelected(e.target.files[0])} />
             </div>
        </>
    );

    const renderMapStep = () => (
         <>
            {renderHeader("Step 2: Map Columns", `Found ${csvHeaders.length} columns. Match them to asset fields.`)}
            <div className="p-6 flex-grow overflow-y-auto space-y-3">
                 {csvHeaders.map(header => (
                     <div key={header} className="grid grid-cols-2 gap-4 items-center">
                         <div className="text-sm font-semibold text-gray-300 truncate" title={header}>{header}</div>
                         <select
                             value={mappings[header] || ''}
                             onChange={e => handleMappingChange(header, e.target.value as keyof Asset | '')}
                             className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500"
                         >
                             <option value="">-- Ignore Column --</option>
                             {assetProperties.map(prop => (
                                 <option key={prop} value={prop}>
                                     {prop} {requiredMappings.includes(prop) && '*'}
                                 </option>
                             ))}
                         </select>
                     </div>
                 ))}
                 <p className="text-xs text-gray-500 pt-2">* Required field</p>
            </div>
        </>
    );

    const renderPreviewStep = () => {
        const validAssetCount = previewAssets.length - importErrors.length;
        return (
            <>
                {renderHeader("Step 3: Preview & Confirm", "Review your data before the final import.")}
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-green-900/30 rounded-md"><span className="font-bold text-lg text-green-300">{validAssetCount}</span><p className="text-xs text-green-400">Assets to Import</p></div>
                        <div className="p-3 bg-blue-900/30 rounded-md"><span className="font-bold text-lg text-blue-300">{newCategories.length}</span><p className="text-xs text-blue-400">New Categories</p></div>
                        <div className="p-3 bg-red-900/30 rounded-md"><span className="font-bold text-lg text-red-300">{importErrors.length}</span><p className="text-xs text-red-400">Rows with Errors</p></div>
                    </div>

                    {importErrors.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-300 mb-1">Errors Found (these rows will be skipped):</h4>
                            <ul className="text-xs text-red-400 list-disc list-inside bg-gray-800/50 p-2 rounded-md max-h-24 overflow-y-auto">
                                {importErrors.map((err, i) => <li key={i}>Row {err.row}: {err.message}</li>)}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-gray-200 mb-1">Data Preview (first 5 rows):</h4>
                        <div className="text-xs bg-gray-800/50 p-2 rounded-md max-h-48 overflow-y-auto font-mono">
                            {previewAssets.slice(0, 5).map((asset, i) => {
                                const hasError = importErrors.some(e => e.row === i + 2);
                                return (
                                    <div key={i} className={`flex items-start gap-2 p-1 ${hasError ? 'text-red-500' : ''}`}>
                                        {hasError ? <XCircleIcon className="w-3 h-3 mt-0.5 flex-shrink-0"/> : <CheckCircleIcon className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0"/>}
                                        <span>{asset.name}, Value: {asset.value ?? 'N/A'}, Category: {asset.categoryId ?? 'N/A'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                {step === 'upload' && renderUploadStep()}
                {step === 'map' && renderMapStep()}
                {step === 'preview' && renderPreviewStep()}

                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-gray-900/80 rounded-b-lg">
                    <button onClick={handleClose} className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors">
                        Cancel
                    </button>
                    <div className="flex items-center gap-2">
                        {step !== 'upload' && (
                             <button onClick={() => setStep(prev => prev === 'preview' ? 'map' : 'upload')} className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors">
                                Back
                            </button>
                        )}
                         {step === 'map' && (
                             <button onClick={goToPreview} className="px-6 py-2 rounded-md text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors">
                                Preview &rarr;
                            </button>
                        )}
                        {step === 'preview' && (
                             <button onClick={handleImportConfirm} disabled={previewAssets.length - importErrors.length === 0} className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed">
                                Confirm Import
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvImportModal;
