export interface Blockchain {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
}

export const blockchains: Blockchain[] = [
  { id: 'ethereum', name: 'Ethereum Mainnet', chainId: 1, rpcUrl: 'https://mainnet.infura.io/v3/', explorerUrl: 'https://etherscan.io', currency: 'ETH' },
  { id: 'sepolia', name: 'Sepolia (Testnet)', chainId: 11155111, rpcUrl: 'https://sepolia.infura.io/v3/', explorerUrl: 'https://sepolia.etherscan.io', currency: 'SepoliaETH' },
  { id: 'polygon', name: 'Polygon', chainId: 137, rpcUrl: 'https://polygon-rpc.com/', explorerUrl: 'https://polygonscan.com', currency: 'MATIC' },
  { id: 'bsc', name: 'BNB Smart Chain', chainId: 56, rpcUrl: 'https://bsc-dataseed.binance.org/', explorerUrl: 'https://bscscan.com', currency: 'BNB' },
  { id: 'avalanche', name: 'Avalanche C-Chain', chainId: 43114, rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', explorerUrl: 'https://snowtrace.io', currency: 'AVAX' },
  { id: 'arbitrum', name: 'Arbitrum One', chainId: 42161, rpcUrl: 'https://arb1.arbitrum.io/rpc', explorerUrl: 'https://arbiscan.io', currency: 'ETH' },
  { id: 'optimism', name: 'OP Mainnet', chainId: 10, rpcUrl: 'https://mainnet.optimism.io', explorerUrl: 'https://optimistic.etherscan.io', currency: 'ETH' },
  { id: 'fantom', name: 'Fantom Opera', chainId: 250, rpcUrl: 'https://rpc.ftm.tools/', explorerUrl: 'https://ftmscan.com', currency: 'FTM' },
  { id: 'gnosis', name: 'Gnosis Chain', chainId: 100, rpcUrl: 'https://rpc.gnosischain.com', explorerUrl: 'https://gnosisscan.io', currency: 'xDAI' },
  { id: 'cronos', name: 'Cronos', chainId: 25, rpcUrl: 'https://evm.cronos.org', explorerUrl: 'https://cronoscan.com', currency: 'CRO' },
  { id: 'moonbeam', name: 'Moonbeam', chainId: 1284, rpcUrl: 'https://rpc.api.moonbeam.network', explorerUrl: 'https://moonscan.io', currency: 'GLMR' },
  { id: 'moonriver', name: 'Moonriver', chainId: 1285, rpcUrl: 'https://rpc.api.moonriver.moonbeam.network', explorerUrl: 'https://moonriver.moonscan.io', currency: 'MOVR' },
  { id: 'celo', name: 'Celo', chainId: 42220, rpcUrl: 'https://forno.celo.org', explorerUrl: 'https://celoscan.io', currency: 'CELO' },
  { id: 'klaytn', name: 'Klaytn', chainId: 8217, rpcUrl: 'https://public-node-api.klaytnapi.com/v1/cypress', explorerUrl: 'https://scope.klaytn.com', currency: 'KLAY' },
  { id: 'base', name: 'Base', chainId: 8453, rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org', currency: 'ETH' },
  { id: 'linea', name: 'Linea', chainId: 59144, rpcUrl: 'https://rpc.linea.build', explorerUrl: 'https://lineascan.build', currency: 'ETH' },
  { id: 'zksync', name: 'zkSync Era', chainId: 324, rpcUrl: 'https://mainnet.era.zksync.io', explorerUrl: 'https://explorer.zksync.io', currency: 'ETH' },
  { id: 'aurora', name: 'NEAR (Aurora)', chainId: 1313161554, rpcUrl: 'https://mainnet.aurora.dev', explorerUrl: 'https://aurorascan.dev', currency: 'ETH' },
  { id: 'polygon-mumbai', name: 'Polygon Mumbai (Testnet)', chainId: 80001, rpcUrl: 'https://rpc-mumbai.maticvigil.com/', explorerUrl: 'https://mumbai.polygonscan.com', currency: 'MATIC' },
  { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia (Testnet)', chainId: 421614, rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc', explorerUrl: 'https://sepolia.arbiscan.io', currency: 'ETH' },
];

export const getBlockchainByChainId = (chainId: number) => {
    return blockchains.find(b => b.chainId === chainId);
}