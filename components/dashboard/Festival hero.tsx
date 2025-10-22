diff --git a/components/dashboard/FestivalHero.tsx b/components/dashboard/FestivalHero.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..244ee560097d8359478618081c0e268a03051a30
--- /dev/null
+++ b/components/dashboard/FestivalHero.tsx
@@ -0,0 +1,198 @@
+import React, { useEffect, useMemo, useState } from 'react';
+import { Page, CryptoCurrency } from '../../types';
+import { ArrowUpIcon, ArrowDownIcon, SparklesIcon, StarIcon, ArrowUpRightIcon } from '../icons/Icons';
+
+interface FestivalHeroProps {
+  onNavigate?: (page: Page) => void;
+  totalValue: number;
+  change24h: number;
+  assetCount: number;
+  cryptoAllocation: number;
+  topMovers: CryptoCurrency[];
+  aiInsight?: string;
+}
+
+const actionPortals: { label: string; page: Page; description: string }[] = [
+  { label: 'Assets Atrium', page: Page.Assets, description: 'Review holdings inside the dripping gallery.' },
+  { label: 'Vault Lounge', page: Page.Vault, description: 'Secure treasures with the Velvet Rabbit sentries.' },
+  { label: 'AI Constellation', page: Page.AIStudio, description: 'Collaborate with BiB! for instant creative signals.' },
+];
+
+const formatCurrency = (value: number) => {
+  if (!Number.isFinite(value)) return '$0.00';
+  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
+};
+
+export const FestivalHero: React.FC<FestivalHeroProps> = ({
+  onNavigate,
+  totalValue,
+  change24h,
+  assetCount,
+  cryptoAllocation,
+  topMovers,
+  aiInsight,
+}) => {
+  const [highlightIndex, setHighlightIndex] = useState(0);
+
+  const formattedInsight = useMemo(() => {
+    if (!aiInsight) return undefined;
+    const trimmed = aiInsight.trim();
+    return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
+  }, [aiInsight]);
+
+  useEffect(() => {
+    if (!topMovers || topMovers.length <= 1) return undefined;
+    const interval = window.setInterval(() => {
+      setHighlightIndex((index) => (index + 1) % topMovers.length);
+    }, 5000);
+    return () => window.clearInterval(interval);
+  }, [topMovers]);
+
+  useEffect(() => {
+    setHighlightIndex(0);
+  }, [topMovers?.length]);
+
+  const highlightedMover = topMovers?.[highlightIndex];
+  const moversToDisplay = topMovers?.slice(0, 3) ?? [];
+  const changePositive = change24h >= 0;
+
+  return (
+    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-10 text-white shadow-xl">
+      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.3),transparent_60%)]" aria-hidden />
+      <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('/festival/troupe-cryptospace-universe.svg')] bg-cover bg-right opacity-20" aria-hidden />
+      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
+        <div className="space-y-6">
+          <div className="flex flex-wrap items-center gap-4">
+            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em]">
+              <SparklesIcon className="h-4 w-4 text-yellow-300" />
+              Main Stage Pulse
+            </span>
+            {highlightedMover && (
+              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold">
+                {highlightedMover.change24h >= 0 ? (
+                  <ArrowUpIcon className="h-4 w-4 text-emerald-300" />
+                ) : (
+                  <ArrowDownIcon className="h-4 w-4 text-rose-300" />
+                )}
+                {highlightedMover.symbol} {highlightedMover.change24h >= 0 ? '+' : ''}
+                {highlightedMover.change24h.toFixed(2)}%
+              </span>
+            )}
+          </div>
+          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
+            Welcome to the Cosmic Main Stage of Troupe CryptoSpace
+          </h2>
+          <p className="max-w-2xl text-base text-gray-200/90">
+            Track your liquidity rivers, favorite movers, and AI-guided insights from the heart of the festival. Each
+            metric below is a glowing beacon keeping your creative economy aligned.
+          </p>
+          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Portfolio Value</p>
+              <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalValue)}</p>
+              <p className={`mt-1 text-sm font-semibold ${changePositive ? 'text-emerald-300' : 'text-rose-300'}`}>
+                {changePositive ? '+' : ''}{change24h.toFixed(2)}% today
+              </p>
+            </div>
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Asset Count</p>
+              <p className="mt-2 text-2xl font-semibold">{assetCount}</p>
+              <p className="mt-1 text-sm text-gray-300">Curated pieces in your melty archive</p>
+            </div>
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Crypto Allocation</p>
+              <p className="mt-2 text-2xl font-semibold">{cryptoAllocation.toFixed(1)}%</p>
+              <p className="mt-1 text-sm text-gray-300">Digital river vs physical gallery</p>
+            </div>
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Spotlight Movers</p>
+              <div className="mt-2 space-y-2">
+                {moversToDisplay.length > 0 ? (
+                  moversToDisplay.map((mover) => (
+                    <div key={mover.id} className="flex items-center justify-between text-sm">
+                      <span className="font-semibold">{mover.symbol}</span>
+                      <span className={mover.change24h >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
+                        {mover.change24h >= 0 ? '+' : ''}{mover.change24h.toFixed(2)}%
+                      </span>
+                    </div>
+                  ))
+                ) : (
+                  <p className="text-xs text-gray-400">Add your favorite coins to see their flux.</p>
+                )}
+              </div>
+            </div>
+          </div>
+          {formattedInsight && (
+            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 via-black/50 to-transparent p-5 shadow-lg">
+              <div className="flex items-start gap-3">
+                <StarIcon className="h-5 w-5 flex-shrink-0 text-yellow-200" />
+                <div>
+                  <p className="text-xs uppercase tracking-[0.35em] text-gray-300">AI Constellation Insight</p>
+                  <p className="mt-2 text-sm text-gray-100">{formattedInsight}</p>
+                </div>
+              </div>
+            </div>
+          )}
+          <div className="flex flex-wrap gap-3">
+            {actionPortals.map((portal) => (
+              <button
+                key={portal.label}
+                onClick={() => onNavigate?.(portal.page)}
+                className="group relative overflow-hidden rounded-full border border-white/20 bg-black/50 px-5 py-3 text-sm font-semibold backdrop-blur transition-transform hover:-translate-y-0.5"
+              >
+                <span className="relative z-10 flex items-center gap-2">
+                  {portal.label}
+                  <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
+                </span>
+                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-400/40 via-fuchsia-400/30 to-orange-400/30 opacity-0 transition-opacity group-hover:opacity-100" />
+                <span className="block text-[11px] font-normal text-gray-300">{portal.description}</span>
+              </button>
+            ))}
+          </div>
+        </div>
+        <div className="relative rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur">
+          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-300">Live Flux Radar</h3>
+          <div className="mt-4 space-y-6">
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Main Stage Mood</p>
+              <p className="mt-2 text-lg font-semibold">{changePositive ? 'Ebullient Growth' : 'Contained Drip'}</p>
+              <p className="mt-1 text-sm text-gray-300">
+                {changePositive
+                  ? 'Positive waves sweep through the sonic river. Keep channeling liquidity into high-energy sets.'
+                  : 'The river is simmering. Stabilize positions and let AI guide your next amplification.'}
+              </p>
+            </div>
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Portal Suggestions</p>
+              <ul className="mt-3 space-y-2 text-sm text-gray-200">
+                <li>• Sync your wallet to unlock Velvet Rabbit perks.</li>
+                <li>• Curate a new NFT drop for tonight’s luminal runway.</li>
+                <li>• Jam with BiB! to orchestrate a fresh campaign score.</li>
+              </ul>
+            </div>
+            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
+              <p className="text-xs uppercase tracking-widest text-gray-400">Top Movers Orbit</p>
+              <div className="mt-2 flex flex-wrap gap-2">
+                {topMovers.slice(0, 6).map((mover) => (
+                  <span
+                    key={`orbit-${mover.id}`}
+                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs"
+                  >
+                    {mover.symbol}
+                    <span className={mover.change24h >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
+                      {mover.change24h >= 0 ? '+' : ''}{mover.change24h.toFixed(1)}%
+                    </span>
+                  </span>
+                ))}
+                {topMovers.length === 0 && <span className="text-xs text-gray-400">Feed the orbit by tracking assets.</span>}
+              </div>
+            </div>
+          </div>
+          <div className="absolute -top-10 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/30 via-fuchsia-400/30 to-orange-400/40 blur-3xl" aria-hidden />
+        </div>
+      </div>
+    </section>
+  );
+};
+
+export default FestivalHero;
