import React from 'react';
import { Web3Tool } from '../data/tools';

const ToolCard: React.FC<{ tool: Web3Tool; onClick?: () => void }> = ({ tool, onClick }) => (
  <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 transform transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-cyan-400/50 flex flex-col h-full">
    <h3 className="text-lg font-bold text-white">{tool.name}</h3>
    <p className="text-gray-400 mt-2 text-sm flex-grow">{tool.description}</p>
    <button
      onClick={onClick}
      disabled={!onClick}
      className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors mt-4 text-sm self-start"
    >
      Open
    </button>
  </div>
);

export default ToolCard;