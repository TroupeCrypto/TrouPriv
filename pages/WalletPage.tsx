import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Web3Wallet, VaultItem } from '../types';
import { WalletIcon, KeyIcon, SpinnerIcon } from '../components/icons/Icons';
import { useVault } from '../contexts/VaultContext';

interface WalletPageProps {
  web3Wallet: Web3Wallet | null;
  setWeb3Wallet: React.Dispatch<React.SetStateAction<Web3Wallet | null>>;
  vaultItems: VaultItem[];
}

const WalletPage: React.FC<WalletPageProps> = ({ web3Wallet, setWeb3Wallet }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const { decryptedItems } = useVault(); // To show keys related to wallet if any

    const handleConnect = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed. Please install it to use this feature.');
            return;
        }

        setIsConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Request account access which also prompts the user to connect
            await provider.send("eth_requestAccounts", []);
            
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const balanceWei = await provider.getBalance(address);
            const balanceEth = ethers.formatEther(balanceWei);
            const network = await provider.getNetwork();

            setWeb3Wallet({
                address: address,
                balance: parseFloat(balanceEth),
                network: network.name,
            });
        } catch (error: any) {
            console.error("Failed to connect wallet:", error);
            const errorMessage = error.reason || error.message || "An unknown error occurred.";
            alert(`Failed to connect wallet. ${errorMessage}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setWeb3Wallet(null);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <header className="flex items-center gap-3 pb-4 border-b border-white/10">
                <WalletIcon className="w-8 h-8 text-cyan-400" />
                <div>
                    <h1 className="text-3xl font-bold text-white">Web3 Wallet</h1>
                    <p className="text-gray-400 text-sm">Connect and manage your digital wallet.</p>
                </div>
            </header>

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                {web3Wallet ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-green-400 font-semibold">Wallet Connected</p>
                            <p className="text-lg text-white font-mono break-all mt-1">{web3Wallet.address}</p>
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Network:</span>
                                <span className="text-white">{web3Wallet.network}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Balance:</span>
                                <span className="text-white font-mono">{web3Wallet.balance.toFixed(4)} ETH</span>
                            </div>
                        </div>
                        <button onClick={handleDisconnect} className="w-full mt-4 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Disconnect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-white">No Wallet Connected</h3>
                        <p className="text-gray-400 mt-2">Connect your wallet to interact with Web3 features.</p>
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="mt-6 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center w-full sm:w-auto mx-auto"
                        >
                            {isConnecting ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5 mr-2" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect Wallet'
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5"/> Wallet-Related Secrets
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    The following secrets from your vault might be related to your Web3 activities (e.g., private keys, seed phrases). Manage them in the Vault.
                </p>
                {decryptedItems.length > 0 && decryptedItems.some(item => item.name.toLowerCase().includes('wallet') || item.name.toLowerCase().includes('seed') || item.name.toLowerCase().includes('private key')) ? (
                    <ul className="space-y-2">
                        {decryptedItems.filter(item => item.name.toLowerCase().includes('wallet') || item.name.toLowerCase().includes('seed') || item.name.toLowerCase().includes('private key')).map(item => (
                             <li key={item.id} className="p-3 bg-gray-800/50 rounded-md text-sm text-gray-300">
                                {item.name}
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-sm text-gray-500 text-center py-4">No wallet-related secrets found or vault is locked.</p>
                )}
            </div>
        </div>
    );
};

export default WalletPage;