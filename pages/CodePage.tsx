
import React, { useState, useEffect, useCallback } from 'react';
import * as ethers from 'ethers';
import { Page, DeploymentTransaction } from '../types';
import { blockchains, getBlockchainByChainId } from '../data/blockchains';
import { default as Editor } from 'react-simple-code-editor';
import prism from 'prismjs';
import 'prismjs/components/prism-solidity';
import { CodeIcon, CompileIcon, DeployIcon, WalletIcon, TerminalIcon, ChevronUpIcon, ChevronDownIcon, TrashIcon, SpinnerIcon } from '../components/icons/Icons';


declare global {
  interface Window {
    ethereum?: any;
    solc?: any;
  }
}

type Mode = 'generator' | 'importer';
type ContractType = 'ERC20' | 'ERC721';
type CompilationStatus = 'idle' | 'compiling' | 'success' | 'error';
type DeploymentStatus = 'idle' | 'connecting' | 'deploying' | 'success' | 'error';
type ConsoleLogType = 'log' | 'error' | 'success';

interface ConsoleLog {
    message: React.ReactNode;
    type: ConsoleLogType;
    timestamp: string;
}

const erc20Features: Record<string, { label: string; description: string }> = {
  mintable: { label: 'Mintable (Ownable)', description: 'Privileged accounts can create more tokens.' },
  burnable: { label: 'Burnable', description: 'Token holders can destroy their tokens.' },
  pausable: { label: 'Pausable (Ownable)', description: 'Privileged accounts can pause token transfers.' },
};

const erc721Features: Record<string, { label: string; description: string }> = {
  mintable: { label: 'Mintable (Ownable)', description: 'Privileged accounts can create new NFTs with auto-incrementing IDs.' },
  burnable: { label: 'Burnable', description: 'Token holders can destroy their NFTs.' },
  pausable: { label: 'Pausable (Ownable)', description: 'Privileged accounts can pause NFT transfers.' },
};

const generateCode = (type: ContractType, name: string, features: Record<string, boolean>) => {
  const pragma = "pragma solidity ^0.8.20;";
  
  const imports = new Set<string>();
  const extensions = new Set<string>();
  let constructorCalls = ``;
  if (type === 'ERC20') {
      constructorCalls = `ERC20(name, symbol)`;
  } else {
      constructorCalls = `ERC721(name, symbol)`;
  }
  let contractBody = '';

  const needsOwnable = features.mintable || features.pausable;

  // Base contract
  imports.add(`import "@openzeppelin/contracts/token/${type}/${type}.sol";`);
  extensions.add(type);
  

  // Ownable - required for minting or pausing
  if (needsOwnable) {
    imports.add(`import "@openzeppelin/contracts/access/Ownable.sol";`);
    extensions.add('Ownable');
    constructorCalls += ` Ownable(msg.sender)`;
  }

  // Burnable
  if (features.burnable) {
    imports.add(`import "@openzeppelin/contracts/token/${type}/extensions/${type}Burnable.sol";`);
    extensions.add(`${type}Burnable`);
  }
  
  // Pausable
  if (features.pausable) {
    if (type === 'ERC20') {
      imports.add(`import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";`);
      extensions.add('ERC20Pausable');
      contractBody += `
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }`;
    } else { // ERC721
      imports.add(`import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";`);
      extensions.add('ERC721Pausable');
      contractBody += `
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }`;
    }
    
    contractBody += `
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
`;
  }
  
  // Mintable
  if (features.mintable) {
    if (type === 'ERC20') {
         contractBody += `
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
`;
    } else { // ERC721
        imports.add(`import "@openzeppelin/contracts/utils/Counters.sol";`);
        contractBody = `
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
` + contractBody;
        
        contractBody += `
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
`;
    }
  }

  const sortedImports = Array.from(imports).sort().join('\n');
  const extensionsStr = Array.from(extensions).join(', ');
  
  const constructorParams = type === 'ERC20' ? 'string memory name, string memory symbol' : 'string memory name, string memory symbol';
  
  const finalBody = contractBody.trim() ? `\n${contractBody}` : '';

  return `// SPDX-License-Identifier: MIT
${pragma}

${sortedImports}

contract ${name} is ${extensionsStr} {${finalBody}
    constructor(${constructorParams}) ${constructorCalls} {}
}`;
};

interface DeployedContractCardProps {
    tx: DeploymentTransaction;
    isExpanded: boolean;
    onToggle: () => void;
    onInteract: (tx: DeploymentTransaction, func: any, params: any[]) => Promise<void>;
}

const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const DeployedContractCard: React.FC<DeployedContractCardProps> = ({ tx, isExpanded, onToggle, onInteract }) => {
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const { abi, contractName, contractAddress, chainId, timestamp, signature } = tx;

    const handleInputChange = (funcName: string, paramName: string, value: string) => {
        setInputs(prev => ({ ...prev, [`${funcName}_${paramName}`]: value }));
    };

    const handleSubmit = (func: any) => {
        const params = func.inputs.map((input: any) => inputs[`${func.name}_${input.name}`] || '');
        onInteract(tx, func, params);
    };
    
    const blockchain = getBlockchainByChainId(chainId);

    const renderFunctions = (functions: any[], type: 'Read' | 'Write') => (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">{type} Functions</h4>
            {functions.map(func => (
                <div key={func.name} className="bg-gray-900/50 p-3 rounded-md">
                    <p className="font-mono text-sm text-cyan-400">{func.name}</p>
                    {func.inputs.map((input: any, index: number) => (
                        <input
                            key={index}
                            type="text"
                            placeholder={`${input.name} (${input.type})`}
                            value={inputs[`${func.name}_${input.name}`] || ''}
                            onChange={(e) => handleInputChange(func.name, input.name, e.target.value)}
                            className="w-full bg-gray-800 border border-white/10 rounded-md px-2 py-1 text-white text-xs mt-2 focus:ring-1 focus:ring-cyan-500"
                        />
                    ))}
                    <button
                        onClick={() => handleSubmit(func)}
                        className={`w-full mt-2 text-sm font-semibold py-1 px-3 rounded-md transition-colors ${
                            type === 'Read' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-fuchsia-600 hover:bg-fuchsia-500'
                        } text-white`}
                    >
                        {type === 'Read' ? 'Query' : 'Transact'}
                    </button>
                </div>
            ))}
        </div>
    );
    
    const writeFunctions = abi.filter(f => f.stateMutability !== 'view' && f.type === 'function' && f.name !== 'constructor');
    const readFunctions = abi.filter(f => f.stateMutability === 'view' && f.type === 'function');

    return (
        <div className="bg-gray-800/50 p-3 rounded-md">
            <button onClick={onToggle} className="w-full flex justify-between items-center text-left">
                <div className="space-y-1">
                    <p className="font-semibold text-cyan-400">{contractName}</p>
                    <p className="text-xs text-gray-400 font-mono" title={contractAddress}>Contract: {truncateAddress(contractAddress)}</p>
                    <p className="text-xs text-gray-400 font-mono" title={signature}>Signer: {truncateAddress(signature)}</p>
                    <p className="text-xs text-gray-500 pt-1">{blockchain?.name || 'Unknown Network'} - {new Date(timestamp).toLocaleString()}</p>
                </div>
                {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
            </button>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/20 space-y-4">
                     {blockchain?.explorerUrl && (
                        <a href={`${blockchain.explorerUrl}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">View on Explorer</a>
                    )}
                    {writeFunctions.length > 0 && renderFunctions(writeFunctions, 'Write')}
                    {readFunctions.length > 0 && renderFunctions(readFunctions, 'Read')}
                </div>
            )}
        </div>
    );
};

interface CodePageProps {
  setPage: (page: Page) => void;
  deploymentTransactions: DeploymentTransaction[];
  setDeploymentTransactions: React.Dispatch<React.SetStateAction<DeploymentTransaction[]>>;
}

const CodePage: React.FC<CodePageProps> = ({ setPage, deploymentTransactions, setDeploymentTransactions }) => {
    const [mode, setMode] = useState<Mode>('generator');
    const [contractType, setContractType] = useState<ContractType>('ERC20');
    const [contractName, setContractName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [code, setCode] = useState('');

    const [importedContractName, setImportedContractName] = useState('');
    const [importedAbi, setImportedAbi] = useState('');
    const [importedBytecode, setImportedBytecode] = useState('');
    
    const [compilationStatus, setCompilationStatus] = useState<CompilationStatus>('idle');
    const [compilationError, setCompilationError] = useState('');
    const [compilationResult, setCompilationResult] = useState<{ name: string; abi: any[]; bytecode: string; } | null>(null);
    
    const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
    const [deploymentError, setDeploymentError] = useState('');
    const [selectedChainId, setSelectedChainId] = useState<number>(blockchains.find(b => b.id === 'sepolia')?.chainId || blockchains[0].chainId);
    const [gasLimit, setGasLimit] = useState('');
    const [wallet, setWallet] = useState<{ provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner, address: string } | null>(null);

    const [constructorInputs, setConstructorInputs] = useState<any[]>([]);
    const [constructorArgs, setConstructorArgs] = useState<Record<string, string>>({});

    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [expandedContract, setExpandedContract] = useState<string | null>(null);
    const [logFilters, setLogFilters] = useState<Record<ConsoleLogType, boolean>>({
        log: true,
        error: true,
        success: true,
    });

    const activeFeatures = contractType === 'ERC20' ? erc20Features : erc721Features;
    
    const logToConsole = useCallback((message: React.ReactNode, type: ConsoleLogType = 'log') => {
        const timestamp = new Date().toLocaleTimeString();
        setConsoleLogs(prev => [{ message, type, timestamp }, ...prev.slice(0, 100)]);
    }, []);
    
    useEffect(() => {
        if (mode === 'generator') {
            if (contractType === 'ERC20') {
                setContractName('MyToken');
                setSymbol('MTK');
                setFeatures({ mintable: true, burnable: true, pausable: false });
            } else {
                setContractName('MyNFT');
                setSymbol('MNFT');
                setFeatures({ mintable: true, burnable: true, pausable: false });
            }
        }
    }, [contractType, mode]);

    const handleGenerateCode = useCallback(() => {
        if (!contractName) return;
        const finalContractName = contractName.replace(/[^a-zA-Z0-9_]/g, '') || 'MyContract';
        const generated = generateCode(contractType, finalContractName, features);
        setCode(generated);
        setCompilationStatus('idle');
        setCompilationResult(null);
    }, [contractType, contractName, features]);
    
    useEffect(() => {
        if (mode === 'generator') {
            handleGenerateCode();
        }
    }, [handleGenerateCode, mode]);
    
    useEffect(() => {
        if (mode === 'generator') {
            setConstructorArgs({ name: contractName, symbol });
        }
    }, [contractName, symbol, mode]);

    const handleCompile = async () => {
        setCompilationStatus('compiling');
        setCompilationError('');
        setCompilationResult(null);
        const finalContractName = (mode === 'generator' ? contractName : importedContractName).replace(/[^a-zA-Z0-9_]/g, '');
        logToConsole(`Compiling ${finalContractName}.sol...`);
    
        const worker = new Worker(URL.createObjectURL(new Blob([`
            self.importScripts('https://binaries.soliditylang.org/bin/soljson-v0.8.20+commit.a1b79de6.js');
            self.onmessage = function (e) {
                const { code, contractName } = e.data;
                const solc = self.solc;
                
                const findImports = (path) => {
                    if (path.startsWith('@openzeppelin/')) {
                        return { contents: 'error: Imports are not supported in this client-side compiler.' };
                    }
                    return { error: 'File not found' };
                };

                const input = {
                    language: 'Solidity',
                    sources: {
                        [contractName + '.sol']: {
                            content: code,
                        },
                    },
                    settings: {
                        outputSelection: {
                            '*': {
                                '*': ['*'],
                            },
                        },
                    },
                };
                const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
                self.postMessage(output);
            };
        `], { type: 'application/javascript' })));
    
        worker.onmessage = (e) => {
            const output = e.data;
            if (output.errors) {
                const errorMessages = output.errors.filter((err) => err.severity === 'error').map((err) => err.formattedMessage).join('\\n');
                if (errorMessages) {
                    if (errorMessages.includes("Imports are not supported")) {
                         setCompilationStatus('error');
                         const importError = "This compiler does not support OpenZeppelin imports directly. Please paste the full contract code from a source like Etherscan or use the Importer with pre-compiled artifacts.";
                         setCompilationError(importError);
                         logToConsole(<div><p className="font-bold">Compilation Failed</p><pre className="mt-1 font-mono p-2 bg-red-900/20 rounded text-xs">{importError}</pre></div>, 'error');
                    } else {
                        setCompilationStatus('error');
                        setCompilationError(errorMessages);
                        logToConsole(<div><p className="font-bold">Compilation Failed</p><pre className="mt-1 font-mono p-2 bg-red-900/20 rounded text-xs">{errorMessages}</pre></div>, 'error');
                    }
                    worker.terminate();
                    return;
                }
            }
    
            const compiledContract = output.contracts[`${finalContractName}.sol`]?.[finalContractName];
            if (!compiledContract) {
                setCompilationStatus('error');
                const errorMessage = "Compilation succeeded, but couldn't find the contract artifact. Make sure the contract name in the code matches the name you provided.";
                setCompilationError(errorMessage);
                logToConsole(errorMessage, 'error');
                worker.terminate();
                return;
            }
    
            const abi = compiledContract.abi;
            const bytecode = '0x' + compiledContract.evm.bytecode.object;
    
            setCompilationResult({ name: finalContractName, abi, bytecode });
            const constructor = abi.find((item) => item.type === 'constructor');
            setConstructorInputs(constructor ? constructor.inputs : []);
            setCompilationStatus('success');
            logToConsole(`Successfully compiled ${finalContractName}.sol.`, 'success');
            worker.terminate();
        };
    
        worker.onerror = (e) => {
            setCompilationStatus('error');
            const errorMessage = `Compiler worker error: ${e.message}. The compiler might be blocked by your browser's security settings.`;
            setCompilationError(errorMessage);
            logToConsole(errorMessage, 'error');
            worker.terminate();
        };
    
        worker.postMessage({ code, contractName: finalContractName });
    };

    const handleLoadImported = () => {
        setCompilationStatus('compiling');
        setCompilationError('');
        setCompilationResult(null);
        setConstructorInputs([]);
        setConstructorArgs({});
        logToConsole(`Loading artifact for ${importedContractName}...`);

        try {
            if (!importedContractName) throw new Error("Contract Name is required.");
            if (!importedBytecode.startsWith('0x') || !/^[0-9a-fA-F]*$/.test(importedBytecode.slice(2))) throw new Error("Bytecode must be a valid hex string starting with '0x'.");
            const parsedAbi = JSON.parse(importedAbi);
            if (!Array.isArray(parsedAbi)) throw new Error("ABI must be a valid JSON array.");

            const constructor = parsedAbi.find(item => item.type === 'constructor');
            setConstructorInputs(constructor ? constructor.inputs : []);

            setCompilationResult({ name: importedContractName, abi: parsedAbi, bytecode: importedBytecode });
            setCompilationStatus('success');
            logToConsole(`Successfully loaded artifact for ${importedContractName}.`, 'success');
        } catch (e) {
            const message = e instanceof Error ? e.message : "An unknown error occurred.";
            setCompilationStatus('error');
            setCompilationError(message);
            logToConsole(<div><p className="font-bold">Artifact Load Failed</p><p className="mt-1 font-mono p-2 bg-red-900/20 rounded">{message}</p></div>, 'error');
        }
    };

    const handleConnectWallet = async () => {
        if (!window.ethereum) {
            logToConsole("MetaMask or a compatible wallet is not installed.", 'error');
            return;
        }
        try {
            logToConsole("Connecting to wallet...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            setWallet({ provider, signer, address: accounts[0] });
            logToConsole(<span>Wallet connected. Signer Address: <strong className="font-mono text-cyan-400">{accounts[0]}</strong></span>, 'success');

            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(selectedChainId)) {
                const currentBlockchain = getBlockchainByChainId(Number(network.chainId));
                const targetBlockchain = getBlockchainByChainId(selectedChainId);
                logToConsole(`Wallet is on ${currentBlockchain?.name || 'an unknown network'} (Chain ID ${network.chainId}).`, 'log');
                logToConsole(`Attempting to switch to the selected network: ${targetBlockchain?.name || `Chain ID ${selectedChainId}`}.`, 'log');
                
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${selectedChainId.toString(16)}` }],
                    });
                    logToConsole("Network switched successfully.", 'success');
                } catch (switchError: any) {
                    const message = switchError.code === 4001 ? "User rejected the network switch request." : (switchError.message || "Failed to switch network.");
                    logToConsole(message, 'error');
                }
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to connect wallet.";
            logToConsole(message, 'error');
        }
    };
    
    const handleDeploy = async () => {
        if (!wallet) {
            logToConsole("Please connect your wallet first.", 'error');
            return;
        }
        if (!compilationResult) {
            logToConsole("Please compile or load your contract artifact first.", 'error');
            return;
        }

        setDeploymentStatus('deploying');
        setDeploymentError('');
        logToConsole(`Preparing to deploy ${compilationResult.name}...`);

        try {
            const deployOptions: { gasLimit?: number } = {};
            if (gasLimit.trim() !== '') {
                const parsedGasLimit = parseInt(gasLimit, 10);
                if (isNaN(parsedGasLimit) || parsedGasLimit <= 0) {
                    throw new Error("Invalid Gas Limit. Please enter a positive number.");
                }
                deployOptions.gasLimit = parsedGasLimit;
                logToConsole(`Using custom gas limit: ${parsedGasLimit}`);
            } else {
                logToConsole("Using default gas estimation.");
            }

            const validatedArgs: any[] = [];
            for (const input of constructorInputs) {
                const value = constructorArgs[input.name]?.trim() || '';
                if (value === '') {
                    throw new Error(`Constructor argument "${input.name}" is required.`);
                }

                if (input.type.startsWith('uint') || input.type.startsWith('int')) {
                    try {
                        const bigIntValue = BigInt(value);
                        if (input.type.startsWith('uint') && bigIntValue < 0) {
                            throw new Error(`Argument "${input.name}" must be a non-negative number.`);
                        }
                        validatedArgs.push(value); 
                    } catch (err) {
                        throw new Error(`Invalid number format for argument "${input.name}". Please enter a valid integer.`);
                    }
                } else if (input.type === 'address') {
                    if (!ethers.isAddress(value)) {
                        throw new Error(`Invalid Ethereum address for argument "${input.name}".`);
                    }
                    validatedArgs.push(value);
                } else if (input.type === 'bool') {
                    const lowerValue = value.toLowerCase();
                    if (lowerValue !== 'true' && lowerValue !== 'false') {
                        throw new Error(`Argument "${input.name}" must be 'true' or 'false'.`);
                    }
                    validatedArgs.push(lowerValue === 'true');
                } else {
                    validatedArgs.push(value);
                }
            }
            
            const { abi, bytecode } = compilationResult;
            const { provider, signer } = wallet;
            
            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(selectedChainId)) {
                logToConsole(`Network mismatch. Your wallet is on chain ${network.chainId}, but you selected ${selectedChainId}.`, 'error');
                try {
                    logToConsole("Requesting network switch...");
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${selectedChainId.toString(16)}` }],
                    });
                    logToConsole("Network switched successfully.", 'success');
                } catch (switchError: any) {
                    const message = switchError.message || "Failed to switch network.";
                    throw new Error(message);
                }
            }

            const factory = new ethers.ContractFactory(abi, bytecode, signer);
            
            logToConsole("Deploying contract with arguments: " + validatedArgs.map((arg, i) => `${constructorInputs[i].name}: "${arg}"`).join(', '));
            logToConsole(<span>Deployment authorized by signer: <strong className="font-mono text-cyan-400">{wallet.address}</strong></span>);
            
            const contract = await factory.deploy(...validatedArgs, deployOptions);
            
            logToConsole(`Deployment transaction sent: ${contract.deploymentTransaction()?.hash}`);
            const deployedContract = await contract.waitForDeployment();
            const contractAddress = await deployedContract.getAddress();

            const newTx: DeploymentTransaction = {
                txHash: contract.deploymentTransaction()?.hash || 'N/A',
                contractAddress,
                contractName: compilationResult.name,
                chainId: selectedChainId,
                timestamp: Date.now(),
                abi,
                signature: wallet.address,
            };

            setDeploymentTransactions(prev => [newTx, ...prev]);
            setDeploymentStatus('success');
            logToConsole(`Contract ${compilationResult.name} deployed successfully at ${contractAddress}`, 'success');

        } catch (e) {
            const message = e instanceof Error ? e.message : "An unknown error occurred during deployment.";
            setDeploymentStatus('error');
            setDeploymentError(message);
            logToConsole(<div><p className="font-bold">Deployment Failed</p><p className="mt-1 font-mono p-2 bg-red-900/20 rounded">{message}</p></div>, 'error');
        }
    };
    
    const handleInteract = async (tx: DeploymentTransaction, func: any, params: any[]) => {
         if (!wallet) {
            logToConsole("Please connect your wallet first.", 'error');
            return;
        }

        try {
            const validatedParams: any[] = [];
            for (let i = 0; i < func.inputs.length; i++) {
                const input = func.inputs[i];
                const value = params[i]?.trim() || '';

                if (value === '') {
                    throw new Error(`Argument "${input.name}" for function "${func.name}" is required.`);
                }

                if (input.type.startsWith('uint') || input.type.startsWith('int')) {
                    try {
                        const bigIntValue = BigInt(value);
                        if (input.type.startsWith('uint') && bigIntValue < 0) {
                            throw new Error(`Argument "${input.name}" must be a non-negative number.`);
                        }
                        validatedParams.push(value);
                    } catch (err) {
                        throw new Error(`Invalid number format for argument "${input.name}". Please enter a valid integer.`);
                    }
                } else if (input.type === 'address') {
                    if (!ethers.isAddress(value)) {
                        throw new Error(`Invalid Ethereum address for argument "${input.name}".`);
                    }
                    validatedParams.push(value);
                } else if (input.type === 'bool') {
                    const lowerValue = value.toLowerCase();
                    if (lowerValue !== 'true' && lowerValue !== 'false') {
                        throw new Error(`Argument "${input.name}" must be 'true' or 'false'.`);
                    }
                    validatedParams.push(lowerValue === 'true');
                } else {
                    validatedParams.push(value);
                }
            }
            
            logToConsole(`Interacting with ${tx.contractName} -> ${func.name}(${validatedParams.join(', ')})`);
            
            const contract = new ethers.Contract(tx.contractAddress, tx.abi, wallet.signer);

            if (func.stateMutability === 'view') {
                logToConsole("Executing query...");
                const result = await contract[func.name](...validatedParams);
                logToConsole(`Query result for ${func.name}: ${result.toString()}`, 'success');
            } else {
                logToConsole("Sending transaction...");
                const txResponse = await contract[func.name](...validatedParams);
                logToConsole(`Transaction sent: ${txResponse.hash}`);
                await txResponse.wait();
                logToConsole(`Transaction for ${func.name} confirmed!`, 'success');
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : "Interaction failed.";
            logToConsole(<div><p className="font-bold">Interaction Failed</p><p className="mt-1 font-mono p-2 bg-red-900/20 rounded">{message}</p></div>,'error');
        }
    };

    const toggleLogFilter = (type: ConsoleLogType) => {
        setLogFilters(prev => ({ ...prev, [type]: !prev[type] }));
    };
    
    const pageTitle = mode === 'generator' ? 'Smart Contract Builder' : 'Smart Contract Importer';
    const backLink = Page.WebDev;


    return (
        <div className="space-y-6">
            <header className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <CodeIcon className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
                        <button onClick={() => setPage(backLink)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Web-Dev</button>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Generator & Editor */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-800/50 rounded-md self-start">
                        <button onClick={() => setMode('generator')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'generator' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Generator</button>
                        <button onClick={() => setMode('importer')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'importer' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Importer</button>
                    </div>

                    {mode === 'generator' ? (
                        <>
                            <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                                <h2 className="text-lg font-semibold mb-3">1. Configure Contract</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select value={contractType} onChange={e => setContractType(e.target.value as ContractType)} className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500">
                                    <option value="ERC20">ERC20 Token</option>
                                    <option value="ERC721">ERC721 NFT</option>
                                </select>
                                    <input type="text" value={contractName} onChange={e => setContractName(e.target.value)} placeholder="Contract Name (e.g., MyToken)" className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" />
                                    <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g., MTK)" className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" />
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-md font-semibold mb-2">Features</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                        {Object.entries(activeFeatures).map(([key, {label}]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!features[key]} onChange={() => setFeatures(prev => ({...prev, [key]: !prev[key]}))} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-fuchsia-500 focus:ring-fuchsia-600"/>
                                                <span className="text-sm text-gray-300">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-white/10 rounded-lg h-[60vh] flex flex-col">
                                <Editor
                                    value={code}
                                    onValueChange={newCode => setCode(newCode)}
                                    highlight={code => prism.highlight(code, prism.languages.solidity, 'solidity')}
                                    padding={16}
                                    className="code-editor"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 space-y-4">
                            <h2 className="text-lg font-semibold">1. Import Contract Artifact</h2>
                             <input type="text" value={importedContractName} onChange={e => setImportedContractName(e.target.value)} placeholder="Contract Name" className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500" />
                            <div>
                                <label className="text-xs text-gray-400">ABI (JSON Array)</label>
                                <textarea value={importedAbi} onChange={e => setImportedAbi(e.target.value)} placeholder='[ { "type": "constructor", ... } ]' rows={8} className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md p-2 text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500 resize-y"></textarea>
                            </div>
                             <div>
                                <label className="text-xs text-gray-400">Bytecode (Hex)</label>
                                <textarea value={importedBytecode} onChange={e => setImportedBytecode(e.target.value)} placeholder="0x..." rows={4} className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md p-2 text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500 resize-y"></textarea>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Right Column: Actions & History */}
                <div className="space-y-4">
                    <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4 space-y-3">
                         <h2 className="text-lg font-semibold">2. Actions</h2>
                          <button onClick={mode === 'generator' ? handleCompile : handleLoadImported} disabled={compilationStatus === 'compiling'} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            {compilationStatus === 'compiling' ? <SpinnerIcon className="w-5 h-5"/> : <CompileIcon className="w-5 h-5"/>}
                            {compilationStatus === 'compiling' ? 'Compiling...' : (mode === 'generator' ? 'Compile Contract' : 'Load Imported Artifact')}
                        </button>
                        {compilationStatus === 'success' && compilationResult && (
                             <div className="p-2 bg-green-900/30 border border-green-500/30 rounded-md text-center">
                                <p className="text-sm font-semibold text-green-400">✓ Ready to Deploy: {compilationResult.name}</p>
                            </div>
                        )}
                        {compilationStatus === 'error' && <p className="text-red-400 text-xs text-center">{compilationError}</p>}
                        
                        <div className="pt-3 border-t border-white/10">
                            {wallet ? (
                                <div className="text-center p-2 bg-gray-800/50 rounded-md">
                                    <p className="text-sm font-semibold text-green-400">Wallet Connected</p>
                                    <p className="text-xs text-gray-400 font-mono truncate" title={wallet.address}>{wallet.address}</p>
                                </div>
                            ) : (
                                <button onClick={handleConnectWallet} className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    <WalletIcon className="w-5 h-5"/> Connect Wallet
                                </button>
                            )}
                        </div>
                         
                         <div className="pt-3 border-t border-white/10 space-y-3">
                             <h2 className="text-lg font-semibold">3. Deploy</h2>
                             <div>
                                 <label className="text-xs text-gray-400">Target Network</label>
                                 <select value={selectedChainId} onChange={e => setSelectedChainId(Number(e.target.value))} className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500">
                                    {blockchains.map(b => <option key={b.chainId} value={b.chainId}>{b.name}</option>)}
                                </select>
                             </div>
                             
                             <div>
                                <label className="text-xs text-gray-400">Gas Limit (Optional)</label>
                                <input type="number" value={gasLimit} onChange={e => setGasLimit(e.target.value)} placeholder="e.g., 500000" className="mt-1 w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500" />
                             </div>

                             {constructorInputs.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Constructor Arguments</label>
                                    {constructorInputs.map(input => (
                                        <input
                                            key={input.name}
                                            type="text"
                                            placeholder={`${input.name} (${input.type})`}
                                            value={constructorArgs[input.name] || ''}
                                            onChange={e => setConstructorArgs(prev => ({ ...prev, [input.name]: e.target.value }))}
                                            className="w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white text-xs focus:ring-2 focus:ring-fuchsia-500"
                                        />
                                    ))}
                                </div>
                             )}
                            
                             <button onClick={handleDeploy} disabled={!compilationResult || !wallet || deploymentStatus === 'deploying'} className="w-full flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors">
                                 {deploymentStatus === 'deploying' ? <SpinnerIcon className="w-5 h-5"/> : <DeployIcon className="w-5 h-5"/>}
                                 {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy'}
                            </button>
                            {deploymentStatus === 'error' && <p className="text-red-400 text-xs text-center">{deploymentError}</p>}
                         </div>
                    </div>

                    <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">Deployment History</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {deploymentTransactions.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No contracts deployed yet.</p> : (
                                deploymentTransactions.map(tx => (
                                    <DeployedContractCard 
                                        key={tx.txHash} 
                                        tx={tx} 
                                        isExpanded={expandedContract === tx.txHash}
                                        onToggle={() => setExpandedContract(prev => prev === tx.txHash ? null : tx.txHash)}
                                        onInteract={handleInteract}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 border border-white/10 rounded-lg h-48 flex flex-col">
                <div className="p-2 border-b border-white/10 flex items-center justify-between text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4" />
                        <span>Console</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 p-0.5 bg-gray-800 rounded-md">
                            {(['log', 'error', 'success'] as ConsoleLogType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleLogFilter(type)}
                                    className={`px-2 py-0.5 text-xs rounded-md font-semibold capitalize transition-colors ${
                                        logFilters[type]
                                            ? {log: 'bg-gray-600 text-gray-200', error: 'bg-red-800 text-red-200', success: 'bg-green-800 text-green-200'}[type]
                                            : 'bg-transparent text-gray-500 hover:bg-gray-700'
                                    }`}
                                >
                                    {type}s
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setConsoleLogs([])}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                            title="Clear Console"
                        >
                            <TrashIcon className="w-3 h-3" />
                            Clear
                        </button>
                    </div>
                </div>
                <div className="p-2 flex-grow overflow-y-auto text-xs font-mono">
                    {consoleLogs.filter(log => logFilters[log.type]).map((log, i) => (
                        <div key={i} className={`flex gap-2 items-baseline ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-400'}`}>
                            <span className="flex-shrink-0 text-gray-600">{log.timestamp}</span>
                            <div className="flex-grow whitespace-pre-wrap break-all">{log.message}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CodePage;