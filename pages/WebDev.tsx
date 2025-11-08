

import React from 'react';
// FIX: Use relative paths for local modules
import { CodeIcon, NftCollectionIcon, SparklesIcon } from '../components/icons/Icons';
// FIX: Use relative paths for local modules
import { Page } from '../types';

interface DevCategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const DevCategoryCard: React.FC<DevCategoryCardProps> = ({ title, description, icon, onClick }) => (
    <div onClick={onClick} className="bg-gray-900/50 p-6 rounded-lg border border-white/10 group relative overflow-hidden transition-all duration-300 hover:border-cyan-400/50 cursor-pointer transform hover:-translate-y-1">
        <div className="flex items-start gap-4">
            <div className="text-cyan-400">{icon}</div>
            <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-gray-400 mt-1 text-sm">{description}</p>
            </div>
        </div>
    </div>
);


const WebDev: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CodeIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Web-Dev</h1>
            <p className="text-gray-400 text-sm">Troupe Inc — Digital IP Development Portal</p>
          </div>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DevCategoryCard
                title="Smart Contract Builder"
                description="Generate, compile, and deploy ERC smart contracts with ease."
                icon={<CodeIcon className="w-8 h-8" />}
                onClick={() => setPage(Page.SmartContractBuilder)}
            />
            <DevCategoryCard
                title="Psychedelic NFT Workshop"
                description="Conceptualize and create unique digital art with the power of AI."
                icon={<NftCollectionIcon className="w-8 h-8" />}
                onClick={() => setPage(Page.PsychedelicNftWorkshop)}
            />
            <DevCategoryCard
                title="Prompt Studio"
                description="A creative space to experiment with and refine generative AI prompts."
                icon={<SparklesIcon className="w-8 h-8" />}
                onClick={() => setPage(Page.PromptStudio)}
            />
        </div>
      </section>
    </div>
  );
};

export default WebDev;