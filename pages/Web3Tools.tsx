
import React from 'react';
import ToolCard from '../components/ToolCard';
import { web3Tools } from '../data/tools';
// FIX: Use relative paths for local modules
import { NftCollectionIcon } from '../components/icons/Icons';
// FIX: Use relative paths for local modules
import { Page } from '../types';

const Web3Tools: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <NftCollectionIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Web3 Tools</h1>
            <p className="text-gray-400 text-sm">Blockchain & Smart Contract Development</p>
          </div>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {web3Tools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={() => {
                if (tool.id === 'nftDesigner') {
                  setPage(Page.PsychedelicNftWorkshop);
                } else if (tool.id === 'contractBuilder') {
                  setPage(Page.SmartContractBuilder);
                }
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Web3Tools;
