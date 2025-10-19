export interface Web3Tool {
  id: string;
  name: string;
  description: string;
}

export const web3Tools: Web3Tool[] = [
  { id: 'contractBuilder', name: 'Smart Contract Builder', description: 'Deploy ERC smart contracts.' },
  { id: 'nftDesigner', name: 'Psychedelic NFT Workshop', description: 'Conceptualize, create, and display unique digital art with the power of AI. A virtual playground to design, test, and showcase interactive NFT universes and visual masterpieces.' },
];