

import React from 'react';
import { BrandAuthConfig } from '../types';
import SocialLoginCard from '../components/SocialLoginCard';
// FIX: Use relative paths for local modules
import { Share2Icon } from '../components/icons/Icons';

interface SocialPageProps {
  socialAuth: BrandAuthConfig[];
  setSocialAuth: React.Dispatch<React.SetStateAction<BrandAuthConfig[]>>;
}

const Social: React.FC<SocialPageProps> = ({ socialAuth, setSocialAuth }) => {
  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Share2Icon className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Social</h1>
            <p className="text-gray-400 text-sm">Troupe Inc — Sub-Company Social Connections</p>
          </div>
        </div>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialAuth.map((brand) => (
            <SocialLoginCard key={brand.id} brand={brand} setSocialAuth={setSocialAuth} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Social;
