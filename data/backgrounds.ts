diff --git a/data/backgrounds.ts b/data/backgrounds.ts
index 9821aa5730e4683e56b70de84e8f0aa5b999329a..e7a9aaddd24e75f71b766e88ce7c8a86b5b52ae5 100644
--- a/data/backgrounds.ts
+++ b/data/backgrounds.ts
@@ -1,8 +1,188 @@
+import { Page } from '../types';
+
 // These are procedurally generated SVG backgrounds to create a psychedelic effect.
 // In a real application, these could be URLs to generated assets or larger base64 strings.
 export const psychedelicBackgrounds: string[] = [
   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3CradialGradient id='a' cx='400' cy='400' r='400' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0%25' stop-color='%23d946ef' /%3E%3Cstop offset='100%25' stop-color='%2306b6d4' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23a)' width='800' height='800'/%3E%3C/svg%3E")`,
   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='800' y2='800' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23f59e0b'/%3E%3Cstop offset='1' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23a)' width='800' height='800'/%3E%3C/svg%3E")`,
   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cdefs%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3CradialGradient id='g'%3E%3Cstop stop-color='%2334d399' offset='0%25'/%3E%3Cstop stop-color='%238b5cf6' offset='100%25'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23g)'/%3E%3Crect width='800' height='800' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E")`,
   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2300F;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23F00;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='100' height='100' fill='url(%23g)'/%3E%3Cpath d='M0,50 Q25,0 50,50 T100,50' stroke='yellow' stroke-width='2' fill='none'/%3E%3Cpath d='M0,50 Q25,100 50,50 T100,50' stroke='cyan' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
-];
\ No newline at end of file
+];
+
+export interface FestivalStageTheme {
+  areaName: string;
+  tagline: string;
+  description: string;
+  background: string;
+  heroImage: string;
+  accent: string;
+  portals: { label: string; page: Page; description: string }[];
+  stats: { label: string; value: string }[];
+}
+
+const mainStage: FestivalStageTheme = {
+  areaName: 'Cosmic Main Stage',
+  tagline: 'Troupe CryptoSpace Universe',
+  description: 'A molten skyline of neon towers, prismatic mushrooms, and flowing crypto rivers that welcome every traveler to the festival.',
+  background: "url('/festival/troupe-cryptospace-universe.svg')",
+  heroImage: '/festival/troupe-cryptospace-universe.svg',
+  accent: '#22d3ee',
+  portals: [
+    { label: 'Asset Atrium', page: Page.Assets, description: 'Curated collectibles, NFTs, and tokenized art under dripping auroras.' },
+    { label: 'AI Constellation', page: Page.AIStudio, description: 'Collaborate with BiB! inside a mushroom-lit, data-drenched observatory.' },
+    { label: 'Vault of the Velvet Rabbit', page: Page.Vault, description: 'A secure lounge of crystalline secrets and membership magic.' },
+  ],
+  stats: [
+    { label: 'Sonic Flux', value: '128 BPM' },
+    { label: 'Festival Latency', value: '0.24s' },
+    { label: 'Active Wallets', value: '∞' },
+  ],
+};
+
+const assetAtrium: FestivalStageTheme = {
+  areaName: 'Melty Asset Atrium',
+  tagline: 'Collectible Rivers & Token Flows',
+  description: 'Cards and vinyl drip from zero-g galleries, cataloguing every asset you own.',
+  background: "url('/festival/assets-melty-cards.svg')",
+  heroImage: '/festival/assets-melty-cards.svg',
+  accent: '#ff6bd6',
+  portals: [
+    { label: 'Manage Categories', page: Page.ManageCategories, description: 'Tune the taxonomy of your holdings.' },
+    { label: 'NFT ProFolio', page: Page.ProFolio, description: 'Showcase curated drops and custom galleries.' },
+    { label: 'Workshop', page: Page.PsychedelicNftWorkshop, description: 'Mint fresh visuals amid dripping auroras.' },
+  ],
+  stats: [
+    { label: 'Liquid Stands', value: '32' },
+    { label: 'Featured Drops', value: '8' },
+    { label: 'Mint Queue', value: 'Live' },
+  ],
+};
+
+const businessBazaar: FestivalStageTheme = {
+  areaName: 'Neon Enterprise Bazaar',
+  tagline: 'Deal Flow Under Mushroom Skyscrapers',
+  description: 'Pitch decks glow in lava rivers while negotiations echo through electric spores.',
+  background: "url('/festival/business-mushroom-city.svg')",
+  heroImage: '/festival/business-mushroom-city.svg',
+  accent: '#38e8ff',
+  portals: [
+    { label: 'Meeting Atrium', page: Page.BusinessMeeting, description: 'Summon partners inside a holographic boardroom.' },
+    { label: 'Wallet Lounge', page: Page.Wallet, description: 'Track flows as they enter the bazaar.' },
+    { label: 'Vault Access', page: Page.Vault, description: 'Secure agreements inside the velvet vault.' },
+  ],
+  stats: [
+    { label: 'Pitch Slots', value: '12' },
+    { label: 'Negotiation Heat', value: '88%' },
+    { label: 'Liquidity Veins', value: 'Flowing' },
+  ],
+};
+
+const creationLab: FestivalStageTheme = {
+  areaName: 'Quantum Creation Lab',
+  tagline: 'Astronaut Garden of Code & Color',
+  description: 'A melty mission-control where astronauts garden synth shrooms and craft new prototypes.',
+  background: "url('/festival/ai-astronaut-garden.svg')",
+  heroImage: '/festival/ai-astronaut-garden.svg',
+  accent: '#47f1ff',
+  portals: [
+    { label: 'Conceptualize', page: Page.Conceptualize, description: 'Seed the story with BiB! and friends.' },
+    { label: 'Create', page: Page.Create, description: 'Draft flows, copy, and stagecraft.' },
+    { label: 'Design Studio', page: Page.Design, description: 'Sculpt UI neon, melt CSS, and refine the vibe.' },
+  ],
+  stats: [
+    { label: 'Active Synths', value: '5' },
+    { label: 'Prototype Orbit', value: 'Stable' },
+    { label: 'Shroom Bloom', value: 'Radiant' },
+  ],
+};
+
+const sonicLounge: FestivalStageTheme = {
+  areaName: 'Sonic Hologram Lounge',
+  tagline: 'Streams, Speakers & Stellar Socials',
+  description: 'Vinyl planets and holographic speakers keep community channels humming.',
+  background: "url('/festival/social-sonic-stream.svg')",
+  heroImage: '/festival/social-sonic-stream.svg',
+  accent: '#ff6ee9',
+  portals: [
+    { label: 'Chat Portal', page: Page.Chat, description: 'Drop in for live banter with the crew.' },
+    { label: 'Share Streams', page: Page.Social, description: 'Broadcast mixes and mirror your presence.' },
+    { label: 'AI Persona', page: Page.Persona, description: 'Tune BiB! before taking the mic.' },
+  ],
+  stats: [
+    { label: 'Live Sets', value: '4' },
+    { label: 'Audience Heat', value: '97%' },
+    { label: 'Echo Delay', value: '11ms' },
+  ],
+};
+
+const velvetVault: FestivalStageTheme = {
+  areaName: 'Vault of the Velvet Rabbit',
+  tagline: 'Crystalline Security & Membership Magic',
+  description: 'Butterfly-coded passes guard your secrets inside a shimmering chamber.',
+  background: "url('/festival/vault-rabbit-pass.svg')",
+  heroImage: '/festival/vault-rabbit-pass.svg',
+  accent: '#60f5ff',
+  portals: [
+    { label: 'Wallet Sync', page: Page.Wallet, description: 'Link decentralized keys to the vault.' },
+    { label: 'Security Settings', page: Page.Settings, description: 'Tune encryption, alerts, and access rituals.' },
+    { label: 'AI Memory', page: Page.Learning, description: 'Archive insights for future rituals.' },
+  ],
+  stats: [
+    { label: 'Vault Integrity', value: '99.99%' },
+    { label: 'Access Sigils', value: '3' },
+    { label: 'Butterfly Swarm', value: '216' },
+  ],
+};
+
+const portraitNexus: FestivalStageTheme = {
+  areaName: 'Portrait Nexus',
+  tagline: 'Bioluminescent Biographies',
+  description: 'Profile pulses, persona traits, and AI memories swirl like electric auras.',
+  background: "url('/festival/profile-portrait.svg')",
+  heroImage: '/festival/profile-portrait.svg',
+  accent: '#ff9fe1',
+  portals: [
+    { label: 'Persona Forge', page: Page.Persona, description: 'Edit traits, ethics, and dreams.' },
+    { label: 'Learning Archive', page: Page.Learning, description: 'Review stored memories and downloads.' },
+    { label: 'Protocol Constellation', page: Page.Protocols, description: 'Activate rituals for AI performances.' },
+  ],
+  stats: [
+    { label: 'Persona Charge', value: '82%' },
+    { label: 'Knowledge Orbs', value: '144' },
+    { label: 'Dream Density', value: 'High' },
+  ],
+};
+
+const pageThemeOverrides: Partial<Record<Page, FestivalStageTheme>> = {
+  [Page.Dashboard]: mainStage,
+  [Page.Assets]: assetAtrium,
+  [Page.ManageCategories]: assetAtrium,
+  [Page.ProFolio]: assetAtrium,
+  [Page.PsychedelicNftWorkshop]: assetAtrium,
+  [Page.Business]: businessBazaar,
+  [Page.BusinessMeeting]: businessBazaar,
+  [Page.WebDev]: creationLab,
+  [Page.SmartContractBuilder]: creationLab,
+  [Page.PromptStudio]: creationLab,
+  [Page.Conceptualize]: creationLab,
+  [Page.Create]: creationLab,
+  [Page.Design]: creationLab,
+  [Page.AIStudio]: creationLab,
+  [Page.Chat]: sonicLounge,
+  [Page.Social]: sonicLounge,
+  [Page.Persona]: portraitNexus,
+  [Page.Learning]: portraitNexus,
+  [Page.Protocols]: portraitNexus,
+  [Page.Profile]: portraitNexus,
+  [Page.Settings]: velvetVault,
+  [Page.Wallet]: velvetVault,
+  [Page.Vault]: velvetVault,
+};
+
+export const festivalStageThemes: Record<Page, FestivalStageTheme> = Object.values(Page).reduce((acc, page) => {
+  const theme = pageThemeOverrides[page as Page] ?? mainStage;
+  acc[page as Page] = theme;
+  return acc;
+}, {} as Record<Page, FestivalStageTheme>);
+
+export const getFestivalTheme = (page: Page): FestivalStageTheme => festivalStageThemes[page] ?? mainStage;
\ No newline at end of file
