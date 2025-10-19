import React from 'react';
import { Page } from '../types';
import { SparklesIcon } from '../components/icons/Icons';
import { BibIcon } from '../components/icons/Icons';

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

const BibPage: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BibIcon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">BiB!</h1>
            <p className="text-gray-400 text-sm">A suite of powerful AI and development tools.</p>
          </div>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevCategoryCard
                title="AI Studio"
                description="A multi-provider AI playground. Prompt Gemini, OpenAI, and Anthropic in one unified interface."
                icon={<SparklesIcon className="w-8 h-8" />}
                onClick={() => setPage(Page.AIStudio)}
            />
        </div>
      </section>
    </div>
  );
};

export default BibPage;