import React from 'react';
import { Page } from '../types';

const DesignIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;

interface DesignPageProps {
  setPage: (page: Page) => void;
}

const DesignPage: React.FC<DesignPageProps> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <DesignIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Design</h1>
            <button onClick={() => setPage(Page.Code)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Code</button>
          </div>
        </div>
      </header>
      <div className="p-6 text-gray-400">
        Design content goes here. Craft user interfaces, design system components, and visualize user flows.
      </div>
    </div>
  );
};

export default DesignPage;