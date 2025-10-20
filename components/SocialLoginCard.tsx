
import React from 'react';
import { BrandAuthConfig } from '../types';
import { SocialIcon } from './icons/Icons';

interface Props {
  brand: BrandAuthConfig;
  setSocialAuth: React.Dispatch<React.SetStateAction<BrandAuthConfig[]>>; // Prop kept for potential future functionality
}

const SocialLoginCard: React.FC<Props> = ({ brand }) => {

  return (
    <div className={`bg-gray-900/50 border rounded-lg p-6 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 border-white/10 hover:border-fuchsia-500/50`}>
      <h3 className="text-xl font-bold text-white mb-4">{brand.name}</h3>
      <div className="space-y-2">
        {brand.socials.map((s) => (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 bg-gray-800 hover:bg-gray-700 text-white border border-transparent hover:border-gray-600 focus:ring-cyan-400`}
          >
            <SocialIcon platform={s.platform} className="w-4 h-4" />
            <span className="capitalize flex-grow text-left">
              {s.platform === 'website' ? 'Website' : s.platform}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLoginCard;