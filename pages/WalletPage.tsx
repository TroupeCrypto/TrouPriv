import React, { useState, useEffect } from 'react';
import * as ethers from 'ethers';
import { Web3Wallet } from '../types';
import { WalletIcon, KeyIcon, SpinnerIcon, ArrowUpRightIcon, ArrowDownLeftIcon, CheckCircleIcon, XCircleIcon } from '../components/icons/Icons';
import { useVault } from '../contexts/VaultContext';

interface WalletPageProps {
  web3Wallet: Web3Wallet | null;
  setWeb3Wallet: React.Dispatch<React.SetStateAction<Web3Wallet | null>>;
  vaultItems: unknown[]; // vaultItems prop is not used, but kept for signature consistency
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
}

const supportedWallets = [
    { name: 'MetaMask', standard: 'EVM' },
    { name: 'Trust Wallet', standard: 'EVM' },
    { name: 'Base Wallet', standard: 'EVM' },
    { name: 'Exodus', standard: 'EVM / Multi-chain' },
    { name: 'Phantom', standard: 'Solana' },
    { name: 'SubWallet', standard: 'Polkadot' },
    { name: 'xPortal', standard: 'MultiversX' },
    { name: 'NearMobile', standard: 'NEAR' },
];

const WalletSupport: React.FC = () => (
    <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Wallet Compatibility</h3>
        <p className="text-sm text-gray-400 mb-4">
            This app connects using the standard browser wallet interface (`window.ethereum`). Any wallet that supports this standard for EVM chains (like Ethereum, Polygon, Base, etc.) should work.
            <span className="font-bold text-cyan-400"> Currently, only EVM-compatible networks are supported for interaction.</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {supportedWallets.map(wallet => (
                 <div key={wallet.name} className={`flex flex-col items-center p-2 rounded-md text-center transition-opacity ${wallet.standard.startsWith('EVM') ? 'bg-gray-800/50' : 'bg-gray-800/20 opacity-60'}`}>
                    <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center bg-gray-700 text-xs font-bold`}>
                        {wallet.name.charAt(0)}
                    </div>
                    <p className={`text-xs font-semibold ${!wallet.standard.startsWith('EVM') ? 'text-gray-500' : 'text-gray-200'}`}>{wallet.name}</p>
                    <p className={`text-[10px] ${!wallet.standard.startsWith('EVM') ? 'text-gray-600' : 'text-gray-400'}`}>{!wallet.standard.startsWith('EVM') ? 'Not Supported' : 'Supported'}</p>
                 </div>
            ))}
        </div>
    </div>
);

const WalletPage: React.FC<WalletPageProps> = ({ web3Wallet, setWeb3Wallet }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const { decryptedItems } = useVault();

    // State for sending funds
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [txStatus, setTxStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [txError, setTxError] = useState<string | null>(null);

    // State for transaction history
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isFetchingTx, setIsFetchingTx] = useState(false);
    
    const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const fetchTransactions = async (address: string) => {
        setIsFetchingTx(true);
        try {
            // NOTE: This is a public/free Etherscan API key. In a real production app, this should be a secret.
            const apiKey = '9D13ZE7XSBTJ9W73T4M6CMM6I21I8C3MM2';
            const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=10&apikey=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === "1") {
                setTransactions(data.result);
            } else {
                console.error("Etherscan API error:", data.message);
                setTransactions([]);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setIsFetchingTx(false);
        }
    };

    useEffect(() => {
        if (web3Wallet?.address && web3Wallet.network.toLowerCase().includes('sepolia')) {
            fetchTransactions(web3Wallet.address);
        } else {
            setTransactions([]);
        }
    }, [web3Wallet]);

    const handleConnect = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('A compatible Web3 wallet (like MetaMask or Trust Wallet) is not installed. Please install one to use this feature.');
            return;
        }

        setIsConnecting(true);
        try {
            // Simply request accounts. The listener in App.tsx will handle the state updates.
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error: any) {
            console.error("Failed to request accounts:", error);
            if (error.code !== 4001) { // 4001 is user rejection, which is not an app error.
                 alert(`Failed to connect wallet: ${error.message}`);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!web3Wallet || !ethers.isAddress(recipient) || !(parseFloat(amount) > 0)) {
            alert("Please enter a valid recipient address and a positive amount.");
            return;
        }

        setTxStatus('sending');
        setTxError(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tx = {
                to: recipient,
                value: ethers.parseEther(amount)
            };
            const txResponse = await signer.sendTransaction(tx);
            await txResponse.wait();
            setTxStatus('success');
            
            // The balance will be refreshed automatically by the listeners in App.tsx after a short delay.
            setRecipient('');
            setAmount('');
            setTimeout(() => fetchTransactions(web3Wallet.address), 5000); // Refresh transactions after 5s
        } catch (error: any) {
            console.error("Transaction failed:", error);
            setTxStatus('error');
            setTxError(error.reason || error.message || "An unknown error occurred.");
        } finally {
            setTimeout(() => setTxStatus('idle'), 5000);
        }
    };

    const handleDisconnect = () => {
        // Disconnecting is handled by the user in their wallet. 
        // We clear our state, and the `accountsChanged` listener will confirm it.
        setWeb3Wallet(null);
        // Future versions might use wallet-specific disconnect methods if available.
    };

    const commonInputStyle = "w-full bg-gray-800/50 border border-white/10 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header className="flex items-center gap-3 pb-4 border-b border-white/10">
                <WalletIcon className="w-8 h-8 text-cyan-400" />
                <div>
                    <h1 className="text-3xl font-bold text-white">Web3 Wallet</h1>
                    <p className="text-gray-400 text-sm">Connect, view, and manage your digital assets.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-6">
                    {/* Connection Status */}
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
                                        <span className="text-white capitalize">{web3Wallet.network}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Balance:</span>
                                        <span className="text-white font-mono">{web3Wallet.balance.toFixed(6)} ETH</span>
                                    </div>
                                </div>
                                <button onClick={handleDisconnect} className="w-full mt-4 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white">No Wallet Connected</h3>
                                <p className="text-gray-400 mt-2">Connect your wallet to interact with Web3 features.</p>
                                <button onClick={handleConnect} disabled={isConnecting} className="mt-6 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center w-full sm:w-auto mx-auto">
                                    {isConnecting ? <><SpinnerIcon className="w-5 h-5 mr-2" />Connecting...</> : 'Connect Wallet'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Send Form */}
                    {web3Wallet && (
                         <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                            <h3 className="text-xl font-semibold text-white mb-4">Send ETH</h3>
                            <form onSubmit={handleSend} className="space-y-4">
                                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient Address (0x...)" required className={commonInputStyle} />
                                <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (e.g., 0.01)" required className={commonInputStyle} />
                                <button type="submit" disabled={txStatus === 'sending'} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center">
                                    {txStatus === 'sending' ? <SpinnerIcon className="w-5 h-5"/> : 'Send'}
                                </button>
                                {txStatus === 'success' && <p className="text-green-400 text-sm text-center">Transaction successful!</p>}
                                {txStatus === 'error' && <p className="text-red-400 text-sm text-center" title={txError || ''}>Transaction failed. See console for details.</p>}
                            </form>
                         </div>
                    )}
                 </div>

                {/* Transaction History */}
                <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
                    <p className="text-xs text-gray-500 mb-4 -mt-2">Displaying recent transactions from Sepolia testnet.</p>
                    {isFetchingTx ? <div className="flex justify-center items-center h-48"><SpinnerIcon className="w-8 h-8" /></div> : 
                    transactions.length > 0 ? (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {transactions.map(tx => {
                                const isOutgoing = tx.from.toLowerCase() === web3Wallet?.address.toLowerCase();
                                return (
                                <div key={tx.hash} className="bg-gray-800/50 p-3 rounded-md text-xs">
                                    <div className="flex justify-between items-center">
                                        <div className={`flex items-center gap-1.5 font-semibold ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
                                            {isOutgoing ? <ArrowUpRightIcon className="w-3.5 h-3.5"/> : <ArrowDownLeftIcon className="w-3.5 h-3.5"/>}
                                            {isOutgoing ? 'Sent' : 'Received'}
                                        </div>
                                        <span className="font-mono text-white">{parseFloat(ethers.formatEther(tx.value)).toFixed(5)} ETH</span>
                                    </div>
                                    <div className="text-gray-400 mt-2 space-y-1">
                                        <p><strong>{isOutgoing ? 'To:' : 'From:'}</strong> <span className="font-mono">{truncateAddress(isOutgoing ? tx.to : tx.from)}</span></p>
                                        <div className="flex justify-between items-center">
                                            <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline">{truncateAddress(tx.hash)}</a>
                                            {tx.isError === '0' ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XCircleIcon className="w-4 h-4 text-red-500" />}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-12">{web3Wallet ? 'No transactions found or network not supported for history.' : 'Connect wallet to see transactions.'}</p>
                    )}
                </div>
            </div>

            <WalletSupport />

            <div className="p-6 bg-gray-900/50 border border-white/10 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5"/> Wallet-Related Secrets
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    The following secrets from your vault might be related to your Web3 activities (e.g., private keys, seed phrases). Manage them securely in the Vault.
                </p>
                {decryptedItems.length > 0 && decryptedItems.some(item => ['wallet', 'seed', 'private key'].some(keyword => item.name.toLowerCase().includes(keyword))) ? (
                    <ul className="space-y-2">
                        {decryptedItems.filter(item => ['wallet', 'seed', 'private key'].some(keyword => item.name.toLowerCase().includes(keyword))).map(item => (
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