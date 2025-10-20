

import React, { useState } from 'react';
import { BrandAuthConfig, SocialPlatform } from '../types';
// FIX: Use relative paths for local modules
import { SocialIcon, SpinnerIcon } from './icons/Icons';

interface Props {
  brand: BrandAuthConfig;
  setSocialAuth: React.Dispatch<React.SetStateAction<BrandAuthConfig[]>>;
}

const SocialLoginCard: React.FC<Props> = ({ brand, setSocialAuth }) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleLogin = (authUrl: string, platform: SocialPlatform) => {
    setConnecting(platform);
    // Simulate API call and redirect
    console.log(`Redirecting to ${authUrl} for ${platform}...`);
    setTimeout(() => {
        // In a real OAuth flow, a redirect would happen.
        // Here, we'll just simulate a successful connection for demo purposes.
        setSocialAuth(prevAuths => {
            return prevAuths.map(b => {
                if (b.id === brand.id) {
                    return {
                        ...b,
                        socials: b.socials.map(s => {
                            if (s.platform === platform) {
                                return { ...s, connected: true };
                            }
                            return s;
                        })
                    };
                }
                return b;
            });
        });
        setConnecting(null);
        // window.location.href = authUrl; 
    }, 1500);
  };

  return (
    <div className={`bg-gray-900/50 border rounded-lg p-6 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 ${connecting ? 'border-fuchsia-500/80 animate-pulse' : 'border-white/10 hover:border-fuchsia-500/50'}`}>
      <h3 className="text-xl font-bold text-white mb-4">{brand.name}</h3>
      <div className="space-y-2">
        {brand.socials.map((s) => {
          const isConnected = s.connected;
          const isThisConnecting = connecting === s.platform;
          
          return (
            <button
              key={s.platform}
              className={`w-full px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                ${
                  isConnected
                    ? 'bg-green-800/50 border border-green-500 text-green-300 cursor-default'
                    : isThisConnecting
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-transparent hover:border-gray-600 focus:ring-cyan-400'
                }`}
              onClick={() => !isConnected && handleLogin(s.authUrl, s.platform)}
              disabled={!!connecting || isConnected}
            >
              <SocialIcon platform={s.platform} className="w-4 h-4" />
              <span className="capitalize flex-grow text-left">
                {s.platform}
              </span>
              <span className="text-xs w-24 text-right">
                {isConnected ? '✓ Connected' : isThisConnecting ? (
                  <div className="flex items-center justify-end gap-2">
                    <SpinnerIcon className="w-4 h-4" />
                    <span>Connecting...</span>
                  </div>
                ) : 'Connect'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialLoginCard;
