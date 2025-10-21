import React, { useState, useCallback, useMemo } from 'react';
import { VaultItem, VaultItemType } from '../types';
import { encrypt } from '../utils/encryption';
import { FileTextIcon, CheckCircleIcon, XCircleIcon, KeyIcon } from './icons/Icons';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newItems: VaultItem[]) => void;
  masterPassword: string;
}

type ImportStep = 'paste' | 'preview';

interface ParsedItem {
  name: string;
  type: VaultItemType;
  content: string;
  website?: string;
  username?: string;
  password?: string;
  notes?: string;
  error?: string;
}

/**
 * Parses a line of text to extract key-value pairs
 * Supports formats:
 * - KEY=VALUE
 * - KEY: VALUE
 * - KEY = VALUE
 */
function parseLine(line: string): { key: string; value: string } | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;
  
  // Try KEY=VALUE format
  let match = trimmedLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  
  // Try KEY: VALUE format
  match = trimmedLine.match(/^([^:]+):(.*)$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  
  return null;
}

/**
 * Detects the type of vault item based on the content
 */
function detectItemType(name: string, value: string, website?: string): VaultItemType {
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase();
  
  // Check for API key indicators
  if (lowerName.includes('api') || lowerName.includes('key') || 
      lowerName.includes('token') || lowerName.includes('secret')) {
    return 'apiKey';
  }
  
  // Check for login indicators (username/password combination)
  if (lowerName.includes('username') || lowerName.includes('user') || 
      lowerName.includes('login') || lowerName.includes('password') || 
      lowerName.includes('pass')) {
    return 'login';
  }
  
  // Check for typical API key patterns in the value
  if (value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value)) {
    return 'apiKey';
  }
  
  return 'secret';
}

/**
 * Parses batch text input into vault items
 * Supports multiple formats:
 * 1. Simple KEY=VALUE or KEY: VALUE (one per line)
 * 2. Grouped format with blank lines separating items
 * 3. Special handling for login credentials with username/password pairs
 */
function parseBatchText(text: string): ParsedItem[] {
  const lines = text.split('\n');
  const items: ParsedItem[] = [];
  let currentItem: Partial<ParsedItem> = {};
  let lineNumber = 0;
  
  const commitCurrentItem = () => {
    if (currentItem.name && currentItem.content) {
      const type = currentItem.type || detectItemType(
        currentItem.name,
        currentItem.content,
        currentItem.website
      );
      
      items.push({
        name: currentItem.name,
        type,
        content: currentItem.content,
        website: currentItem.website,
        username: currentItem.username,
        password: currentItem.password,
        notes: currentItem.notes,
      });
    }
    currentItem = {};
  };
  
  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();
    
    // Skip empty lines (they separate grouped items)
    if (!trimmedLine) {
      commitCurrentItem();
      continue;
    }
    
    // Skip comment lines
    if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
      continue;
    }
    
    const parsed = parseLine(line);
    if (!parsed) {
      // If we can't parse the line and we have a current item, treat it as part of content
      if (currentItem.content) {
        currentItem.content += '\n' + line;
      }
      continue;
    }
    
    const { key, value } = parsed;
    const lowerKey = key.toLowerCase();
    
    // Check for known fields
    if (lowerKey === 'name' || lowerKey === 'title' || lowerKey === 'label') {
      commitCurrentItem();
      currentItem.name = value;
    } else if (lowerKey === 'type') {
      currentItem.type = value as VaultItemType;
    } else if (lowerKey === 'website' || lowerKey === 'url' || lowerKey === 'site') {
      currentItem.website = value;
    } else if (lowerKey === 'username' || lowerKey === 'user' || lowerKey === 'login') {
      if (!currentItem.name) {
        currentItem.name = `Login - ${value}`;
      }
      currentItem.username = value;
      currentItem.type = 'login';
    } else if (lowerKey === 'password' || lowerKey === 'pass' || lowerKey === 'pwd') {
      currentItem.password = value;
      currentItem.type = 'login';
      if (!currentItem.content) {
        currentItem.content = value;
      }
    } else if (lowerKey === 'notes' || lowerKey === 'description' || lowerKey === 'desc') {
      currentItem.notes = value;
    } else if (lowerKey === 'key' || lowerKey === 'secret' || lowerKey === 'token' || lowerKey === 'apikey') {
      if (!currentItem.name) {
        currentItem.name = key;
      }
      currentItem.content = value;
      currentItem.type = 'apiKey';
    } else {
      // For any other key-value pair, treat it as a new item
      commitCurrentItem();
      currentItem.name = key;
      currentItem.content = value;
    }
  }
  
  // Commit the last item
  commitCurrentItem();
  
  return items.filter(item => item.name && item.content);
}

/**
 * Validates parsed items and adds error messages
 */
function validateItems(items: ParsedItem[]): ParsedItem[] {
  return items.map(item => {
    const errors: string[] = [];
    
    if (!item.name || item.name.length < 1) {
      errors.push('Name is required');
    }
    
    if (!item.content || item.content.length < 1) {
      errors.push('Content is required');
    }
    
    if (item.type === 'login') {
      if (!item.username && !item.password) {
        errors.push('Login requires username and/or password');
      }
    }
    
    return {
      ...item,
      error: errors.length > 0 ? errors.join(', ') : undefined,
    };
  });
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  masterPassword 
}) => {
  const [step, setStep] = useState<ImportStep>('paste');
  const [batchText, setBatchText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setStep('paste');
    setBatchText('');
    setParsedItems([]);
    setIsProcessing(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleParse = () => {
    const items = parseBatchText(batchText);
    const validatedItems = validateItems(items);
    setParsedItems(validatedItems);
    setStep('preview');
  };

  const handleImportConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const validItems = parsedItems.filter(item => !item.error);
      const vaultItems: VaultItem[] = [];
      
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        let contentToEncrypt: string;
        
        if (item.type === 'login') {
          contentToEncrypt = JSON.stringify({
            username: item.username || '',
            password: item.password || item.content,
          });
        } else if (item.type === 'apiKey') {
          contentToEncrypt = JSON.stringify({
            key: item.content,
            notes: item.notes,
          });
        } else {
          contentToEncrypt = item.content;
        }
        
        const encryptedContent = await encrypt(contentToEncrypt, masterPassword);
        
        vaultItems.push({
          id: `${Date.now()}-${i}`,
          name: item.name,
          type: item.type,
          encryptedContent,
          website: item.website,
        });
      }
      
      onImport(vaultItems);
      handleClose();
    } catch (error) {
      console.error('Failed to encrypt items:', error);
      alert('Failed to encrypt items. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validItemCount = useMemo(() => 
    parsedItems.filter(item => !item.error).length,
    [parsedItems]
  );

  const errorCount = useMemo(() => 
    parsedItems.filter(item => item.error).length,
    [parsedItems]
  );

  const renderPasteStep = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">Batch Import Vault Items</h3>
        <p className="text-sm text-gray-400 mt-1">
          Paste your environment variables, API keys, or secrets below. One per line.
        </p>
      </div>
      
      <div className="p-6 flex-grow overflow-y-auto space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">
            Supported Formats:
          </label>
          <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-md space-y-1 font-mono">
            <div># Simple key-value pairs:</div>
            <div>API_KEY=your_api_key_here</div>
            <div>SECRET_TOKEN: your_secret_token</div>
            <div className="pt-2"># Grouped format (separated by blank lines):</div>
            <div>name: GitHub API Key</div>
            <div>website: github.com</div>
            <div>key: ghp_xxxxxxxxxxxxx</div>
            <div className="pt-2"># Login credentials:</div>
            <div>name: My Service Login</div>
            <div>website: service.com</div>
            <div>username: myuser@example.com</div>
            <div>password: mypassword123</div>
          </div>
        </div>
        
        <textarea
          value={batchText}
          onChange={(e) => setBatchText(e.target.value)}
          placeholder="Paste your items here..."
          rows={12}
          className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-3 text-white font-mono text-sm focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none"
        />
      </div>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">Preview & Confirm</h3>
        <p className="text-sm text-gray-400 mt-1">
          Review the parsed items before importing.
        </p>
      </div>
      
      <div className="p-6 flex-grow overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-green-900/30 rounded-md">
            <span className="font-bold text-lg text-green-300">{validItemCount}</span>
            <p className="text-xs text-green-400">Items to Import</p>
          </div>
          <div className="p-3 bg-red-900/30 rounded-md">
            <span className="font-bold text-lg text-red-300">{errorCount}</span>
            <p className="text-xs text-red-400">Items with Errors</p>
          </div>
        </div>

        {errorCount > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3">
            <h4 className="font-semibold text-red-300 text-sm mb-2">
              Items with errors (will be skipped):
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {parsedItems.filter(item => item.error).map((item, i) => (
                <div key={i} className="text-xs text-red-400 flex items-start gap-2">
                  <XCircleIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{item.name}: {item.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-200 mb-2 text-sm">Items to Import:</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {parsedItems.filter(item => !item.error).map((item, i) => (
              <div
                key={i}
                className="bg-gray-800/50 border border-white/10 rounded-md p-3 space-y-1"
              >
                <div className="flex items-start gap-2">
                  <div className="text-gray-400 pt-0.5">
                    {item.type === 'login' && <KeyIcon className="w-4 h-4" />}
                    {item.type === 'apiKey' && <KeyIcon className="w-4 h-4 text-yellow-400" />}
                    {item.type === 'secret' && <FileTextIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="font-semibold text-white text-sm">{item.name}</span>
                      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700/50 rounded">
                        {item.type}
                      </span>
                    </div>
                    {item.website && (
                      <div className="text-xs text-cyan-400 mt-1">{item.website}</div>
                    )}
                    {item.type === 'login' && (
                      <div className="text-xs text-gray-400 mt-1">
                        Username: {item.username || 'N/A'}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-gray-400 mt-1">
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh]">
        {step === 'paste' && renderPasteStep()}
        {step === 'preview' && renderPreviewStep()}

        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-gray-900/80 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-md text-sm font-medium bg-gray-600/50 hover:bg-gray-600 text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <button
                onClick={() => setStep('paste')}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'paste' && (
              <button
                onClick={handleParse}
                disabled={!batchText.trim()}
                className="px-6 py-2 rounded-md text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                Parse & Preview →
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleImportConfirm}
                disabled={validItemCount === 0 || isProcessing}
                className="px-6 py-2 rounded-md text-sm font-medium bg-fuchsia-600 hover:bg-fuchsia-700 text-white transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Importing...' : `Import ${validItemCount} Items`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchImportModal;
