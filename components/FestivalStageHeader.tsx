components/FestivalStageHeader.tsx
New
+165
-0

import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../types';
import { FestivalStageTheme } from '../data/backgrounds';
import { ArrowUpRightIcon, SparklesIcon, StarIcon } from './icons/Icons';

interface FestivalStageHeaderProps {
  page: Page;
  theme: FestivalStageTheme;
  onNavigate: (page: Page) => void;
}

const shimmerStyles = `
  @keyframes festival-ribbon {
    0% { transform: translateX(-10%) skewX(-6deg); opacity: 0.65; }
    50% { transform: translateX(10%) skewX(6deg); opacity: 0.9; }
    100% { transform: translateX(-10%) skewX(-6deg); opacity: 0.65; }
  }
  .animate-festival-ribbon {
    animation: festival-ribbon 18s linear infinite;
  }
  @keyframes pulse-orb {
    0%, 100% { transform: scale(0.9) translateY(0); opacity: 0.6; }
    50% { transform: scale(1.1) translateY(-6px); opacity: 1; }
  }
  .animate-orb {
    animation: pulse-orb 6s ease-in-out infinite;
  }
`;

export const FestivalStageHeader: React.FC<FestivalStageHeaderProps> = ({ page, theme, onNavigate }) => {
  const [activePortalIndex, setActivePortalIndex] = useState(0);

  const activePortal = useMemo(() => {
    if (!theme.portals || theme.portals.length === 0) return undefined;
    return theme.portals[Math.min(activePortalIndex, theme.portals.length - 1)];
  }, [theme.portals, activePortalIndex]);

  useEffect(() => {
    if (!theme.portals || theme.portals.length <= 1) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setActivePortalIndex((index) => (index + 1) % theme.portals.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [theme.portals]);

  useEffect(() => {
    setActivePortalIndex(0);
  }, [page]);

  const accentShadow = `${theme.accent}33`;
  const accentSolid = theme.accent;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-2xl">
      <style>{shimmerStyles}</style>
      <div className="absolute inset-0 opacity-70">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: theme.background }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-transparent" />
      </div>
      <div className="relative flex flex-col lg:flex-row items-center gap-10 px-6 sm:px-10 py-10">
        <div className="flex-1 space-y-5 text-white">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <SparklesIcon className="w-5 h-5 text-yellow-300" />
            <span className="text-xs uppercase tracking-[0.35em] text-gray-200">Festival Area</span>
            <span className="text-sm font-semibold" style={{ color: accentSolid }}>{theme.areaName}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-lg">
            {theme.tagline}
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-gray-200/90 leading-relaxed">
            {theme.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {theme.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur flex items-center gap-3"
                style={{ boxShadow: `0 0 24px ${accentShadow}` }}
              >
                <StarIcon className="w-5 h-5 text-yellow-200" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-300">{stat.label}</p>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
          {activePortal && (
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 sm:px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Featured Portal</p>
                  <h3 className="text-xl font-semibold text-white">{activePortal.label}</h3>
                  <p className="text-sm text-gray-300 max-w-xl">{activePortal.description}</p>
                </div>
                <button
                  onClick={() => onNavigate(activePortal.page)}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${accentSolid}, ${accentShadow})`,
                    color: '#0b1120',
                  }}
                >
                  Enter Portal
                  <ArrowUpRightIcon className="w-4 h-4" />
                </button>
              </div>
              {theme.portals.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {theme.portals.map((portal, index) => (
                    <button
                      key={portal.label}
                      onClick={() => setActivePortalIndex(index)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                        index === activePortalIndex
                          ? 'bg-white/20 border-white/60 text-white'
                          : 'border-white/10 text-gray-300 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {portal.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-6 rounded-full blur-3xl" style={{ background: accentShadow }} aria-hidden />
          <div className="relative rounded-[36px] border border-white/20 bg-black/60 p-4 backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-[28px] border border-white/20">
              <img
                src={theme.heroImage}
                alt={`${theme.areaName} illustration`}
                className="h-72 w-full object-cover object-center saturate-[1.2]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-black/30" />
              <div className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Stage: {theme.areaName}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {theme.stats.slice(0, 2).map((stat) => (
                <div key={`orb-${stat.label}`} className="rounded-2xl border border-white/10 bg-black/50 px-3 py-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-gradient-to-br from-transparent via-white/30 to-white/10 animate-orb" style={{ boxShadow: `0 0 40px ${accentShadow}` }} />
        </div>
      </div>
      <div className="absolute -bottom-16 left-6 right-6 h-32 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-festival-ribbon" aria-hidden />
    </div>
  );
};

export default FestivalStageHeader;
