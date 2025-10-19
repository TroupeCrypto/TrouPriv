import React from 'react';
import { Page } from '../types';
import { SparklesIcon } from '../components/icons/Icons';

interface ConceptualizePageProps {
  setPage: (page: Page) => void;
}

const ConceptualizePage: React.FC<ConceptualizePageProps> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Conceptualize</h1>
            <button onClick={() => setPage(Page.Code)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Code</button>
          </div>
        </div>
      </header>
      <div className="p-6 text-gray-400">
        Conceptualize content goes here. Plan your software projects, define features, and outline architecture.
      </div>
    </div>
  );
};

export default ConceptualizePage;