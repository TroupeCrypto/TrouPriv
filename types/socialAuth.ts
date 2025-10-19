export type SocialPlatform =
  | 'instagram'
  | 'spotify'
  | 'youtube'
  | 'x'
  | 'website'
  | 'behance'
  | 'deviantart'
  | 'linkedin'
  | 'discord'
  | 'mirror'
  | 'opensea'
  | 'facebook'
  | 'github';

export interface SocialLink {
  platform: SocialPlatform;
  authUrl: string;
  connected: boolean;
}

export interface BrandAuthConfig {
  id: string;
  name: string;
  socials: SocialLink[];
}
