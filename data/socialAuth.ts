
import { BrandAuthConfig } from '../types';

export const brandAuthConfigs: BrandAuthConfig[] = [
  {
    id: 'troupe-inc',
    name: 'Troupe Inc',
    socials: [
      { platform: 'instagram', authUrl: 'https://api.troupeinc.com/oauth/troupeinc/instagram', connected: false },
      { platform: 'spotify',   authUrl: 'https://api.troupeinc.com/oauth/troupeinc/spotify',   connected: false },
      { platform: 'youtube',   authUrl: 'https://api.troupeinc.com/oauth/troupeinc/youtube',   connected: false },
      { platform: 'x',         authUrl: 'https://api.troupeinc.com/oauth/troupeinc/x',         connected: false },
      { platform: 'website',   authUrl: 'https://troupeinc.com',                               connected: false },
    ],
  },
  {
    id: 'psilocyber',
    name: 'PsiloCyber',
    socials: [
      { platform: 'instagram',  authUrl: 'https://api.troupeinc.com/oauth/psilocyber/instagram',  connected: false },
      { platform: 'behance',    authUrl: 'https://api.troupeinc.com/oauth/psilocyber/behance',    connected: false },
      { platform: 'deviantart', authUrl: 'https://api.troupeinc.com/oauth/psilocyber/deviantart', connected: false },
      { platform: 'website',    authUrl: 'https://psilocyber.art',                                connected: false },
    ],
  },
  {
    id: 'troupe-includes',
    name: 'Troupe Includes, LTD',
    socials: [
      { platform: 'linkedin', authUrl: 'https://api.troupeinc.com/oauth/includes/linkedin', connected: false },
      { platform: 'x',        authUrl: 'https://api.troupeinc.com/oauth/includes/x',        connected: false },
      { platform: 'instagram',authUrl: 'https://api.troupeinc.com/oauth/includes/instagram',connected: false },
      { platform: 'website',  authUrl: 'https://troupeincludes.com',                        connected: false },
    ],
  },
  {
    id: 'troupe-cryptospace',
    name: 'Troupe CryptoSpace',
    socials: [
      { platform: 'discord', authUrl: 'https://api.troupeinc.com/oauth/cryptospace/discord', connected: false },
      { platform: 'x',       authUrl: 'https://api.troupeinc.com/oauth/cryptospace/x',       connected: false },
      { platform: 'mirror',  authUrl: 'https://api.troupeinc.com/oauth/cryptospace/mirror',  connected: false },
      { platform: 'opensea', authUrl: 'https://api.troupeinc.com/oauth/cryptospace/opensea', connected: false },
      { platform: 'website', authUrl: 'https://troupecryptospace.io',                         connected: false },
    ],
  },
  {
    id: 'troupe-collects',
    name: 'Troupe Collects',
    socials: [
      { platform: 'instagram', authUrl: 'https://api.troupeinc.com/oauth/collects/instagram', connected: false },
      { platform: 'facebook',  authUrl: 'https://api.troupeinc.com/oauth/collects/facebook',  connected: false },
      { platform: 'x',         authUrl: 'https://api.troupeinc.com/oauth/collects/x',         connected: false },
      { platform: 'website',   authUrl: 'https://troupecollects.com',                         connected: false },
    ],
  },
  {
    id: 'gunga-report',
    name: 'The Gunga Report',
    socials: [
      { platform: 'instagram', authUrl: 'https://api.troupeinc.com/oauth/gunga/instagram', connected: false },
      { platform: 'x',         authUrl: 'https://api.troupeinc.com/oauth/gunga/x',         connected: false },
      { platform: 'youtube',   authUrl: 'https://api.troupeinc.com/oauth/gunga/youtube',   connected: false },
      { platform: 'website',   authUrl: 'https://thegungareport.com',                      connected: false },
    ],
  },
  {
    id: 'bib',
    name: 'BiB!',
    socials: [
      { platform: 'github',   authUrl: 'https://api.troupeinc.com/oauth/bib/github',   connected: false },
      { platform: 'discord',  authUrl: 'https://api.troupeinc.com/oauth/bib/discord',  connected: false },
      { platform: 'linkedin', authUrl: 'https://api.troupeinc.com/oauth/bib/linkedin', connected: false },
      { platform: 'website',  authUrl: 'https://bib.dev',                              connected: false },
    ],
  },
  {
    id: 'ziggy-vision-personal',
    name: 'Ziggy Vision (Personal)',
    socials: [
      { platform: 'instagram', authUrl: 'https://api.troupeinc.com/oauth/ziggy/instagram', connected: false },
      { platform: 'x',         authUrl: 'https://api.troupeinc.com/oauth/ziggy/x',         connected: false },
      { platform: 'github',    authUrl: 'https://api.troupeinc.com/oauth/ziggy/github',    connected: false },
      { platform: 'website',   authUrl: 'https://ziggy.vision',                            connected: false },
    ],
  },
];