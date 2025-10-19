import React from 'react';
import { Page } from '../types';

const CreateIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

interface CreatePageProps {
  setPage: (page: Page) => void;
}

const CreatePage: React.FC<CreatePageProps> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <CreateIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Create</h1>
            <button onClick={() => setPage(Page.Code)} className="text-sm text-cyan-400 hover:underline">&larr; Back to Code</button>
          </div>
        </div>
      </header>
      <div className="p-6 text-gray-400">
        Create content goes here. Write, test, and debug your code in an integrated environment.
      </div>
    </div>
  );
};

export default CreatePage;